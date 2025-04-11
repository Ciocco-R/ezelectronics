import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError} from "../errors/userError";
import dayjs from "dayjs";
import { DateAfterError} from "../errors/productError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                        reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
    * Returns a list of user objects from the database based on their role.
    * @param role The role of the users to retrieve
    * @returns A Promise that resolves an array with the users requested 
    */
    getListUsersByRole(role: string): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE role = ?"
                db.all(sql, [role], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    const users: User[] = []
                    for (const row of rows){
                        users.push(new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)) 
                    }
                    resolve(users)

                })
            } catch (error) {
                reject(error)
            }

        })
    }    

    /**
    * Returns a list of all user objects from the database.
    * @returns A Promise that resolves an array with all the users 
    */
    getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users"
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    const users: User[] = []
                    for (const row of rows){
                        users.push(new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)) 
                    }
                    resolve(users)

                })
            } catch (error) {
                reject(error)
            }

        })
    }    

    /**
    * Delete a user object from the database based on the username.
    * @param username The username of the user to delete
    * @returns A Promise that resolves to true if the user has been deleted.
    */
    deleteUser(username: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sqlSelect = "SELECT * FROM users WHERE username = ?"
                db.get(sqlSelect, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    else if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }else {
                    const sqlDelete = "DELETE FROM users WHERE username = ?"
                    db.run(sqlDelete, [username], (err:Error | null) => {
                        if (err) {
                            reject(err)
                            return
                        }
        
                        resolve(true)
                    })
                    }
                })

                

            } catch (error) {
                reject(error)
            }

        })
    }

    /**
    * Delete all user objects from the database except for the ones with role Admin 
    * @returns A Promise that resolves to true if the users have been deleted.
    */
    deleteAll(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try{
                const sqlDelete = "DELETE FROM users WHERE role != 'Admin'";
            
                db.run(sqlDelete, [], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(true)
                })    

            } catch (error) {
                reject(error)
            }
        })
    }

    /**Updates a user object from the database based on the username.
    * @param username The username of the user. It must be unique.
    * @param name The name of the user
    * @param surname The surname of the user
    * @param address The address of the user 
    * @param birthdate The birthdate of the user 
    * @returns A Promise that resolves the information of the updated user
    */
   updateUserInfo(username: string, name: string, surname: string, address: string, birthdate: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
        
        try {

            const sqlSelect = "SELECT * FROM users WHERE username = ?";
            db.get(sqlSelect, [username], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                if (!row) {
                    reject(new UserNotFoundError())
                    return
                }


            const sqlUpdate = "UPDATE users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?";
            db.run(sqlUpdate, [name, surname, address, birthdate, username], (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                } 
            
                db.get(sqlSelect, [username], (err: Error | null, updatedRow: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    
                const updatedUser = new User(updatedRow.username, updatedRow.name, updatedRow.surname, updatedRow.role, updatedRow.address, updatedRow.birthdate)
                
                resolve(updatedUser)

                })

            })
        })

        } catch (error) {
            reject(error)
        }

        })
   }
    
}
export default UserDAO