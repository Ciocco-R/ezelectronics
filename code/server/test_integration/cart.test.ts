import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { Role } from "../src/components/user";
import { app } from "../index"
import { cleanup } from '../src/db/cleanup';
import dayjs from "dayjs";
import { afterEach, beforeEach } from "node:test";
import { ProductInCart, Cart } from "../src/components/cart";
import { Category } from "../src/components/product";

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const product = {model: "IPhone13", category: "Smartphone", quantity: 10, details: "It's fast!", sellingPrice: 299.99, arrivalDate: "2024-06-04" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

const postProduct = async (cookie: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", cookie)
        .send(product)
        .expect(200);
}

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
                if(res.status === 200)
                    resolve(res.header["set-cookie"][0])
                else
                    resolve("")
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    cleanup()
    await postUser(customer)
    customerCookie = await login(customer)

    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(customer)
    customerCookie = await login(customer)

    await postProduct(adminCookie)
})

//After executing tests, we remove everything from our test database
afterAll(() => {
    cleanup()
})

describe("Cart routes integration tests", () => {

    describe("POST /carts", () => {
         test("should add a product to the cart", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "IPhone13"}).expect(200);
            
        });

        test("should return 422 if model is empty", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "" }).expect(422);
        });
    });

    describe("GET /carts", () => {
        test("should return the cart of the logged in customer", async () => {
            const response = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            expect(response.body).toEqual({customer: "customer", 
                paid: false, 
                paymentDate: "", 
                total: 299.99, 
                products: 
                    [{model: "IPhone13", 
                    category: "Smartphone", 
                    quantity: 1, 
                    price: 299.99}]});
                    
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).get(`${routePath}/carts`).expect(401);
        });
    });

    describe("PATCH /carts", () => {
        test("should checkout the cart", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).patch(`${routePath}/carts`).expect(401);
        });
    });

    describe("GET /carts/history", () => {
        test("should return the cart history of the logged in customer", async () => {
            const response = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200);
            expect(response.body).toEqual([{customer: "customer", paid: true, paymentDate: dayjs().format("YYYY-MM-DD"), total: 299.99, products: [{model: "IPhone13", category: "Smartphone", quantity: 1, price: 299.99}]}]);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).get(`${routePath}/carts/history`).expect(401);
        });
    });

    describe("DELETE /carts/products/:model", () => {
        test("should remove a product from the cart", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "IPhone13"}).expect(200);
            await request(app).delete(`${routePath}/carts/products/IPhone13`).set("Cookie", customerCookie).expect(200);
            
        });

        test("should return 422 if model is empty", async () => {
            await request(app).delete(`${routePath}/carts/products`).set("Cookie", customerCookie).expect(404);
        });
    });

    describe("DELETE /carts/current", () => {
        test("should clear the cart", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "IPhone13"}).expect(200);
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customerCookie).expect(200);
            
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).delete(`${routePath}/carts/current`).expect(401);
        });
    });

    describe("GET /carts/all", () => {
        test("should retrieve all carts", async () => {
            await request(app).delete(`${routePath}/carts`).set("Cookie", adminCookie).expect(200);
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "IPhone13"}).expect(200);
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            const response = await request(app).get(`${routePath}/carts/all`).set("Cookie", adminCookie).expect(200);
            expect(response.body).toEqual([new Cart("customer", true, dayjs().format("YYYY-MM-DD"), 299.99, 
                [new ProductInCart("IPhone13", 1, Category.SMARTPHONE, 299.99)])]);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).get(`${routePath}/carts/all`).expect(401);
        });
    });

    describe("DELETE /carts", () => {
        test("should delete all carts", async () => {
            await request(app).delete(`${routePath}/carts`).set("Cookie", adminCookie).expect(200);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).delete(`${routePath}/carts`).expect(401);
        });
    });

});
cleanup()
