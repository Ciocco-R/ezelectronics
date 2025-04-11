import { test, expect, jest, beforeAll, afterEach, afterAll , describe} from "@jest/globals"
import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";
import dayjs from "dayjs";
import {ProductReview} from "../src/components/review";

const routePath = "/ezelectronics";

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const product = {model: "iPhone11", category: "Smartphone", quantity: 10, details: "It's fast!", sellingPrice: 299.99, arrivalDate: "2024-06-04" }
const review = {score: 5, comment: "Great product!"}
const model = "iPhone11";
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

describe('Review routes integration tests', () => {

    describe('POST /reviews/model', () => {
        test('It should create a new review', async () => {
            const response = await request(app)
                .post(`${routePath}/reviews/${model}`)
                .set("Cookie", customerCookie)
                .send({
                    score: 5,
                    comment: 'Great product!',
                    model: 'iPhone11'
                });

            expect(response.status).toBe(200);
        });

        test("should return 422 if model is empty", async () => {
            await request(app).post(`${routePath}/reviews`).set("Cookie", customerCookie).send({ 
                score: 5,
                comment: 'Great product!',
                model: ''
             }).expect(422);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).post(`${routePath}/reviews/${model}`).expect(401);
        });

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const response = 
                await request(app)
                .post(`${routePath}/reviews/iPhone14`)
                .set("Cookie", customerCookie)
                .send({score: 5, comment: 'Great product!', model: ''})
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })

        test("Should return a ExistingReviewError if there is an existing review for the product made by the customer", async () => {
            const response = 
                await request(app)
                .post(`${routePath}/reviews/${model}`)
                .set("Cookie", customerCookie)
                .send({score: 5, comment: 'Great product!', model: 'iPhone11'})
                .expect(409);
            expect(response.body.error).toEqual("You have already reviewed this product")
        })

        test("It should return a 401 error code if the user is not a Customer", async () => {
            await request(app).post(`${routePath}/reviews/${model}`).set("Cookie", adminCookie).expect(401);
        })

        test("It should return a 422 error code if the score is not between 1 and 5", async () => {
            const response = await request(app)
                .post(`${routePath}/reviews/${model}`)
                .set("Cookie", customerCookie)
                .send({
                    score: 6,
                    comment: 'Great product!',
                    model: 'iPhone11'
                });

            expect(response.status).toBe(422);
        });

        test("It should return 422 if comment is an empty string", async () => {
            const response = await request(app)
                .post(`${routePath}/reviews/${model}`)
                .set("Cookie", customerCookie)
                .send({
                    score: 5,
                    comment: '',
                    model: 'iPhone11'
                });

            expect(response.status).toBe(422);
        });

    });

    describe('GET /reviews/model', () => {
        test('It should get all reviews for a product', async () => {
            const response = await request(app).get(`${routePath}/reviews/${model}`).set("Cookie", customerCookie).send(model);

            expect(response.status).toBe(200);
        });

        test("should return 422 if model is empty", async () => {
            await request(app).get(`${routePath}/reviews/`).set("Cookie", customerCookie).send("").expect(422);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).get(`${routePath}/reviews/${model}`).expect(401);
        });

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const response = 
                await request(app)
                .get(`${routePath}/reviews/iPhone14`)
                .set("Cookie", customerCookie)
                .send(model)
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })    

    });

    describe('DELETE /reviews/model', () => {
        test('It should delete the review made by a user for one product', async () => {
            const response = await request(app).delete(`${routePath}/reviews/${model}`).set("Cookie", customerCookie).send(model);

            expect(response.status).toBe(200);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews/${model}`).expect(401);
        });

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const response = 
                await request(app)
                .delete(`${routePath}/reviews/iPhone14`)
                .set("Cookie", customerCookie)
                .send('iPhone14')
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })

        test("Should return a NoReviewProductError if the current user does not have a review for the product", async () => {
            const response = 
                await request(app)
                .delete(`${routePath}/reviews/${model}`)
                .set("Cookie", customerCookie)
                .send(model)
                .expect(404);
            expect(response.body.error).toEqual("You have not reviewed this product")
        })

        test("It should return a 401 error code if the user is not a Customer", async () => {
            await request(app).delete(`${routePath}/reviews/${model}`).set("Cookie", adminCookie).expect(401);
        })



    });

    describe('DELETE /reviews/model/all', () => {
        test('It should delete all reviews for a product', async () => {
            const response = await request(app).delete(`${routePath}/reviews/${model}/all`).set("Cookie", adminCookie).send(model);

            expect(response.status).toBe(200);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews/${model}/all`).expect(401);
        });

        test("Should return a ProductNotFoundError if the product does not exist", async () => {
            const response = 
                await request(app)
                .delete(`${routePath}/reviews/iPhone14/all`)
                .set("Cookie", adminCookie)
                .send('iPhone14')
                .expect(404);
            expect(response.body.error).toEqual("Product not found")
        })

        test("It should return a 401 error code if the user is not an Admin or a Manager", async () => {
            await request(app).delete(`${routePath}/reviews/${model}/all`).set("Cookie", customerCookie).expect(401);
        })



    });

    describe('DELETE /reviews', () => {
        test('It should delete all reviews', async () => {
            const response = await request(app).delete(`${routePath}/reviews`).set("Cookie", adminCookie).send();

            expect(response.status).toBe(200);
        });

        test("should return 401 if user is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews`).expect(401);
        });

        test("It should return a 401 error code if the user is not an Admin or a Manager", async () => {
            await request(app).delete(`${routePath}/reviews`).set("Cookie", customerCookie).expect(401);
        });

    });

});
cleanup()