import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import { User, Role } from "../../src/components/user"
import { mock } from "node:test"
jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("createUser", () => {
    test("It should resolve true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "Customer")
        expect(result).toBe(true)
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()

    
    })
    test("It should reject an UserAlreadyExistsError", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback({message: "UNIQUE constraint failed: users.username"})
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        await expect(userDAO.createUser("username", "name", "surname", "password", "Customer")).rejects.toEqual(new UserAlreadyExistsError())
        mockDBRun.mockRestore()
    })

    test("DB crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        try{
         await userDAO.createUser("username", "name", "surname", "password", "Customer")
        } 
        catch (error) {
            expect(error.message).toBe("DB crashed")
        }finally {
            mockDBRun.mockRestore()
        }
        
    });
})
describe ("getIsUserAuthenticated", () => {
    test("getIsUserAuthenticated - success", async () => {
        const userDAO = new UserDAO()
        const user = {username: "username", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return true;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(true);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }

    });

    test("getIsUserAuthenticated - error no username", async () => {
        const userDAO = new UserDAO()
        const user = {username: "nousername", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return true;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(false);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }

    });

    test("getIsUserAuthenticated - error wrong password", async () => {
        const userDAO = new UserDAO()
        const user = {username: "username", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return false;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "nopassword");
        expect(result).toBe(false);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }
    });
    test("getIsUserAuthenticated DB Error", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await userDAO.getIsUserAuthenticated("username", "password")
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });
    test("getIsUserAuthenticated DB Crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        try{
            await userDAO.getIsUserAuthenticated("username", "password")
        } catch (error) {
            expect(error.message).toBe("DB crashed")
        } finally {
            mockDBGet.mockRestore()
        }
    }); 
});
describe("getUserByUsername ", () => {
    test("It should resolve a user customer", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "address", birthdate: "birthdate"})
            return {} as Database
        });
        const result = await userDAO.getUserByUsername("username")
        expect(result).toEqual({username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "address", birthdate: "birthdate"})
        mockDBGet.mockRestore()
    });
    test("It should reject an UserNotFoundError", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as Database
        });
        await expect(userDAO.getUserByUsername("username")).rejects.toEqual(new UserNotFoundError())
        mockDBGet.mockRestore()
    });
    test("DB crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        try{
            await userDAO.getUserByUsername("username")
        } catch (error) {
            expect(error.message).toBe("DB crashed")
        } finally {
            mockDBGet.mockRestore()
        }
    });
    test("DB error", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"))
            return {} as Database
        });
        try{
            await userDAO.getUserByUsername("username")
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });

})

describe("getListUsers", () => {
    //It should resolve an array of users
    test("It should resolve an array of users", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER},
                {username: "username", name: "name", surname: "surname", role: Role.MANAGER}])
            return {} as Database
        });
        const result = await userDAO.getUsers()
        expect(result).toEqual([{username: "username", name: "name", surname: "surname", role:Role.CUSTOMER},
                                {username: "username", name: "name", surname: "surname", role: Role.MANAGER}
        ])
        mockDBAll.mockRestore()
    });
    //It should resolve an empty array if there are no users
    test("It should resolve an empty array if there are no users", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });
        const result = await userDAO.getUsers()
        expect(result).toEqual([])
        mockDBAll.mockRestore()
    });
    //It should reject if there is an error
    test("Db crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        try{
            await userDAO.getUsers()
        } catch (error) {
            expect(error.message).toBe("DB crashed")
        } finally {
            mockDBAll.mockRestore()
        }
    });
    test("DB error", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"))
            return {} as Database
        });
        try{
            await userDAO.getUsers()
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBAll.mockRestore()
        }
    });
  
})

describe("getListUsersByRole", () => {
    //It should resolve an array of users with the given role
    test("It should resolve an array of users with the given role", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER},
                            {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER}
            ])
            return {} as Database
        });
        const result = await userDAO.getListUsersByRole(Role.CUSTOMER)
        expect(result).toEqual([{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER},
                                {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER}
        ])
        mockDBAll.mockRestore()
    });
    //It should return and empty arrey if there are no users with the given role
    test("It should resolve an empty array if there are no users with the given role", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });
        const result = await userDAO.getListUsersByRole(Role.MANAGER)
        expect(result).toEqual([])
        mockDBAll.mockRestore()
    });
    
    //It should reject if there is an error
    test("Db crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        try{
            await userDAO.getListUsersByRole(Role.CUSTOMER)
        } catch (error) {
            expect(error.message).toBe("DB crashed")
        } finally {
            mockDBAll.mockRestore()
        }
    });
    test("DB error", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"))
            return {} as Database
        });
        try{
            await userDAO.getListUsersByRole(Role.CUSTOMER)
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBAll.mockRestore()
        }
    });
  
})
describe ("delete User by username", () => {
    //It should resolve true if the user has been deleted
    test("It should resolve true if the user has been deleted", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "address", birthdate: "birthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const result = await userDAO.deleteUser("username");
        expect(result).toBe(true);
    
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    
    //It should reject an UserNotFoundError if the user does not exist
    test("It should reject an UserNotFoundError if the user does not exist", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined) // Simula il caso in cui l'utente non esiste
            return {} as Database
        });
        
        await expect(userDAO.deleteUser("username")).rejects.toEqual(new UserNotFoundError())
        mockDBGet.mockRestore()
    });
    
    //It should reject if there is an error

    test("Db crashed in get", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed");
        });
    
        try {
            await userDAO.deleteUser("username");
        } catch (error) {
            expect(error.message).toBe("DB crashed");
        } finally {
            mockDBGet.mockRestore();
        }
    });
    test("Db crashed in run", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "address", birthdate: "birthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("DB crashed"));
            return {} as Database;
        });
    
        try {
            await userDAO.deleteUser("username");
        } catch (error) {
            expect(error.message).toBe("DB crashed");
        } finally {
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        }
    });
    test("DB error", async () => {  
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER, address: "address", birthdate: "birthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"));
            return {} as Database;
        });
    
        try {
            await userDAO.deleteUser("username");
        } catch (error) {
            expect(error.message).toBe("DB error");
        } finally {
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        }
    });

})

describe("deleteAllNonAdmin", () => {
    //It should resolve true if all non-Admin users have been deleted
    test("It should resolve true if all non-Admin users have been deleted", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const result = await userDAO.deleteAll()
        expect(result).toBe(true)
        mockDBRun.mockRestore()
    });
    test("Db crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });
        try{
            await userDAO.deleteAll()
        } catch (error) {
            expect(error.message).toBe("DB crashed")
        } finally {
            mockDBRun.mockRestore()
        }
    });
    test("DB error", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"))
            return {} as Database
        });
        try{
            await userDAO.deleteAll()
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBRun.mockRestore()
        }
    });

    //It should resolve true if there are no non-Admin users

});

describe("updateUserInfo", () => {
    //It should resolve the updated user
    test("Should update user info successfully", async () => {
        const userDAO = new UserDAO();
    
        const mockDBGet1 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT")) {
                callback(null, { username: "username", name: "oldName", surname: "oldSurname", role: "CUSTOMER", address: "oldAddress", birthdate: "oldBirthdate" });
            }
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const mockDBGet2 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "newName", surname: "newSurname", role: Role.CUSTOMER, address: "newAddress", birthdate: "newBirthdate" });
            return {} as Database;
        });
        const result = await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate");
        
        expect(result).toEqual(new User("username", "newName", "newSurname", Role.CUSTOMER, "newAddress", "newBirthdate"));
    
        mockDBGet1.mockRestore();
        mockDBGet2.mockRestore();
        mockDBRun.mockRestore();
    });
    test("Should reject an UserNotFoundError if the user does not exist", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined);
            return {} as Database;
        });
    
        await expect(userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate")).rejects.toEqual(new UserNotFoundError());
    
        mockDBGet.mockRestore();
    });
    test("DB crashed in get 1", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed");
        });
    
        try {
            await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate");
        } catch (error) {
            expect(error.message).toBe("DB crashed");
        } finally {
            mockDBGet.mockRestore();
        }
    });
    test ("DB crashed in get 2", async () => {
        const userDAO = new UserDAO();
        const mockDBGet1 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "oldName", surname: "oldSurname", role: "CUSTOMER", address: "oldAddress", birthdate: "oldBirthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const mockDBGet2 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed");
        });
    
        try {
            await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate");
        } catch (error) {
            expect(error.message).toBe("DB crashed");
        } finally {
            mockDBGet1.mockRestore();
            mockDBRun.mockRestore();
            mockDBGet2.mockRestore();
        }
    });
    
    test("DB error 1", async () => {
        const userDAO = new UserDAO();
        const mockDBGet1 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "oldName", surname: "oldSurname", role: "CUSTOMER", address: "oldAddress", birthdate: "oldBirthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"));
            return {} as Database;
        });
    
        try {
            await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate");
        } catch (error) {
            expect(error.message).toBe("DB error");
        } finally {
            mockDBGet1.mockRestore();
            mockDBRun.mockRestore();
        }
    });
    test("DB error 2", async () => {
        const userDAO = new UserDAO();
        const mockDBGet1 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "oldName", surname: "oldSurname", role: "CUSTOMER", address: "oldAddress", birthdate: "oldBirthdate" });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const mockDBGet2 = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("DB error"));
            return {} as Database;
        });
    
        try {
            await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate");
        } catch (error) {
            expect(error.message).toBe("DB error");
        } finally {
            mockDBGet1.mockRestore();
            mockDBRun.mockRestore();
            mockDBGet2.mockRestore();
        }
    });

})






