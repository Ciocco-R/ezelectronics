import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from "@jest/globals";
import request from 'supertest'
import { Role } from "../src/components/user";
import { app } from "../index"
import { cleanup } from '../src/db/cleanup';
import dayjs from "dayjs";
import { ProductInCart, Cart } from "../src/components/cart";
import { Category } from "../src/components/product";
import e, { response } from "express";
import exp from "node:constants";
import db from "../src/db/db";

const routePath = "/ezelectronics"

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
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
                if(res.status === 200)
                    resolve(res.header["set-cookie"][0])
                else
                    resolve("")
            })
    })
}

beforeEach(async () => {
    cleanup(); // Pulisce il database prima di ogni test
    await postUser(customer); // Crea un nuovo utente cliente
    customerCookie = await login(customer); // Effettua il login e ottiene il cookie
    await postUser(admin); // Crea un nuovo utente amministratore
    adminCookie = await login(admin); // Effettua il login e ottiene il cookie
});

afterEach(() => {
    cleanup(); // Pulisce il database dopo ogni test
});

describe("Product routes integration tests", () => {
    
    describe("POST /products", () => {
        test("Should register products", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);
            expect(response.body).toEqual({})
        })

        test("Should return a DateAfterError if the arrival date is in the future", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2025-06-04"
            }
            const response = 
                await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(400);
            expect(response.body.error).toEqual("The insert date is after today")
        })

        test("Should return a ProductAlreadyExistsError if the product already exists", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);
            expect(response.body).toEqual({})

            const productError = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            const responseError = 
                await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(productError)
                .expect(409);
            expect(responseError.body.error).toEqual("The product already exists")
        })
    })

    describe("PATCH /products/:model", () => {
        test("Should update the product", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                changeDate: "2024-06-04"
            }
            const response = await request(app)
                .patch(`${routePath}/products/IPhone X`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(200);
            expect(response.body).toEqual({quantity: 20})
        })

        test("Should return a DateAfterError if the change date is in the future", async () => {
            const product = {
                model: "IPhone 11", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone 11", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                changeDate: "2025-06-04"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 11`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(400);
            expect(response.body.error).toEqual("The insert date is after today")
        })

        test("Should return a DateBeforeError if the change date is before the arrival date", async () => {
            const product = {
                model: "IPhone 12", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone 12", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                changeDate: "2024-06-03"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 12`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(400);
            expect(response.body.error).toEqual("The insert date is before the already present one")
        })

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const productUpdate = {
                model: "IPhone 13", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                changeDate: "2024-06-04"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 13`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })
    })

    describe("PATCH /products/:model/sell", () => {
        test("Should sell the product", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 5, 
                details: "Details", 
                sellingPrice: 400, 
                sellingDate: "2024-06-04"
            }
            const response = await request(app)
                .patch(`${routePath}/products/IPhone X/sell`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(200);
            expect(response.body).toEqual({quantity: 5})
        })

        test("Should return a DateAfterError if the selling date is in the future", async () => {
            const product = {
                model: "IPhone 11", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone 11", 
                category: Category.SMARTPHONE, 
                quantity: 5, 
                details: "Details", 
                sellingPrice: 400, 
                sellingDate: "2025-06-04"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 11/sell`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(400);
            expect(response.body.error).toEqual("The insert date is after today")
        })

        test("Should return a DateBeforeError if the selling date is before the arrival date", async () => {
            const product = {
                model: "IPhone 12", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const productUpdate = {
                model: "IPhone 12", 
                category: Category.SMARTPHONE, 
                quantity: 5, 
                details: "Details", 
                sellingPrice: 400, 
                sellingDate: "2024-06-03"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 12/sell`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(400);
            expect(response.body.error).toEqual("The insert date is before the already present one")
        })

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const productUpdate = {
                model: "IPhone 13", 
                category: Category.SMARTPHONE, 
                quantity: 5, 
                details: "Details", 
                sellingPrice: 400, 
                sellingDate: "2024-06-04"
            }
            const response = 
                await request(app)
                .patch(`${routePath}/products/IPhone 13/sell`)
                .set("Cookie", adminCookie)
                .send(productUpdate)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })
    })

    describe("GET /products", () => {
        test("Should return all products", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return all products of a certain category", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products?grouping=category&category=Smartphone`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return all products of a certain model", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products?grouping=model&model=IPhone X`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return a ProductNotFoundError if the model does not exist", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products?grouping=model&model=IPhone 13`)
                .set("Cookie", adminCookie)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })

        test("Should return a 422 error if grouping is category and category is null or model not null", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products?grouping=category`)
                .set("Cookie", adminCookie)
                .expect(422);
        })

        test("Should return a 422 error if grouping is model and model is null or category not null", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products?grouping=model`)
                .set("Cookie", adminCookie)
                .expect(422);
        })

        test("Should return a 422 error if grouping is null but category or model are not", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products?category=Smartphone`)
                .set("Cookie", adminCookie)
                .expect(422);
        })
    })

    describe("GET /products/available", () => {
        test("Should return all available products", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return all available products of a certain category", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=category&category=Smartphone`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return all available products of a certain model", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=model&model=IPhone X`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([{model: "IPhone X", category: Category.SMARTPHONE, quantity: 10, details: "Details", sellingPrice: 400, arrivalDate: "2024-06-04"}])
        })

        test("Should return a ProductNotFoundError if the model does not exist", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products/available?grouping=model&model=IPhone 13`)
                .set("Cookie", adminCookie)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })

        test("Should return an empty array if there are no available products", async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual([])
        })

        test("Should return a 422 error if grouping is category and category is null or model not null", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products/available?grouping=category`)
                .set("Cookie", adminCookie)
                .expect(422);
        })

        test("Should return a 422 error if grouping is model and model is null or category not null", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products/available?grouping=model`)
                .set("Cookie", adminCookie)
                .expect(422);
        })

        test("Should return a 422 error if grouping is null but category or model are not", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/products/available?category=Smartphone`)
                .set("Cookie", adminCookie)
                .expect(422);
        })
    })

    describe("DELETE /products", () => {
        test("Should delete all products", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual({})
        })
    })

    describe("DELETE /products/:model", () => {
        test("Should delete the product", async () => {
            const product = {
                model: "IPhone X", 
                category: Category.SMARTPHONE, 
                quantity: 10, 
                details: "Details", 
                sellingPrice: 400, 
                arrivalDate: "2024-06-04"
            }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(200);

            const response = await request(app)
                .delete(`${routePath}/products/IPhone X`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toEqual({})
        })

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const response = 
                await request(app)
                .delete(`${routePath}/products/IPhone 13`)
                .set("Cookie", adminCookie)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })
    })
})
cleanup()