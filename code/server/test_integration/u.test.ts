import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { Role } from "../src/components/user";
import { cleanup } from '../src/db/cleanup';
import dayjs from "dayjs";
import { after } from "node:test";

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "usercustomer", name: "usercustomer", surname: "usercustomer", password: "customer", role: Role.CUSTOMER }
const admin = { username: "useradmin", name: "useradmin", surname: "useradmin", password: "admin", role: Role.ADMIN }

//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string


//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
        
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                console.log(res.status)
                if(res.status === 200)
                    resolve(res.header["set-cookie"][0])
                else
                    resolve("")
            })
    })
}


describe("User routes integration tests", () => {
    beforeEach(() => {
        cleanup()
    });
    afterEach(() => {
        cleanup()
    });

    describe("POST /users", () => {
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and create a new user", async () => {
            cleanup() //Before starting the test, we clean up the database. This is done to ensure that the database is empty and that the test is not influenced by previous tests
            //A 'request' function is used to send a request to the server. It is similar to the 'fetch' function in the browser
            //It executes an API call to the specified route, similarly to how the client does it
            //It is an actual call, with no mocking, so it tests the real behavior of the server
            //Route calls are asynchronous operations, so we need to use 'await' to wait for the response
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200) //The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation
            await request(app).post(`${routePath}/users`).send(admin).expect(200) //We can repeat the call for the Admin user. The result should be the same
            adminCookie = await login(admin) //After creating the Admin user, we log in as Admin and save the cookie. We will use it for further requests
            //After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the user is present in the database
            //A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                .expect(200)
            expect(users.body).toHaveLength(1) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            
            let adm = users.body.find((user: any) => user.username === admin.username) //We look for the user we created in the array of users
            expect(adm).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
            cleanup()
        },10000);

        //Tests for error conditions can be added in separate 'test' blocks.
        //We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            cleanup()
            await request(app)
                .post(`${routePath}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
                .expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
            cleanup()
        },10000);
    });

    
    // Before each test, we clean up the database and create necessary users
    describe("GET /users", () => {
        
        test("It should return an array of users", async () => {
            cleanup()
            await postUser(admin)
            adminCookie = await login(admin)
            console.log(adminCookie)
            await postUser(customer)
            customerCookie = await login(customer)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
            cleanup();
        },10000);

        test("It should return a 401 error code if the user is not an Admin", async () => {
            cleanup()
            await postUser(customer)
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
            cleanup();
        },10000);
    });

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            cleanup()
            const l = await request(app).post(`${routePath}/users`).send(admin).expect(200)
            customerCookie = await login(customer)
            const l2= await request(app).post(`${routePath}/users`).send(customer).expect(200)
            adminCookie = await login(admin)
            const admins = await request(app).get(`${routePath}/users/roles/Customer`).set("Cookie", adminCookie).expect(200)
            console.log(admins.body)
            expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
            let cus = admins.body[0]
            expect(cus.username).toBe(customer.username)
            expect(cus.name).toBe(customer.name)
            expect(cus.surname).toBe(customer.surname)
            cleanup()
        },100000);

    }); 


    
    describe("DELETE /users/:username", () => {
        test("It should delete a user", async () => {
            cleanup()
            await postUser(customer);
            customerCookie = await login(admin);
            await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie);
            cleanup()
        },10000);

    });
    describe("DELETE /users only if admin", () => {
        test("It should delete all users if the user calling is an Admin", async () => {
            cleanup();
            await postUser(customer);
            await postUser(admin);
            const adminCookie = await login(admin);
    
            // Assicurati di usare il nome utente corretto
            console.log("Customer username:", customer.username);
    
            const user = await request(app)
                .delete(`${routePath}/users`)
                .set("Cookie", adminCookie)
                .expect(200);
    
            // Verifica i campi dell'utente
            

            await cleanup();
        },10000);
        test("It should return a 401 error code if the user is not an Admin", async () => {
            cleanup();
            await postUser(customer);
            customerCookie = await login(customer);
            await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).delete(`${routePath}/users/${customer.username}`).expect(401) //We can also call the route without any cookie. The result should be the same
            cleanup();
        },10000);
    });

    describe("PATCH /users/:username", () => {
        /**
         * Route for updating the information of a user.
         * It requires the user to be authenticated.
         * It expects the username of the user to edit in the request parameters: if the user is not an Admin, the username must match the username of the logged in user. Admin users can edit other non-Admin users.
         * It requires the following body parameters:
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - address: string. It cannot be empty.
         * - birthdate: date. It cannot be empty, it must be a valid date in format YYYY-MM-DD, and it cannot be after the current date
         * It returns the updated user.
         */
        test("Update user info - USER UPDATE HIS INFO", async () => {
            cleanup();
            await postUser(customer);
            adminCookie = await login(customer);
            customerCookie= await login(customer);
            const response = await request(app)
                .patch(`${routePath}/users/${customer.username}`)
                .set("Cookie", adminCookie)
                .send({ name: "newname", surname: "newsurname", address: "newaddress", birthdate: "1999-01-01" })
                .expect(200);
            const transformedUsers = {
                ...response.body,
                address: response.body.address === null ? "" : response.body.address,
                birthdate: response.body.birthdate === null ? "" : response.body.birthdate
            };
        
            // Verifica della risposta
            expect(response.status).toBe(200);
            expect(transformedUsers).toEqual({ username: customer.username, name: "newname", surname: "newsurname", address: "newaddress", birthdate: "1999-01-01", role: "Customer" });
            await cleanup();
        },10000);
        
    });
});
cleanup()