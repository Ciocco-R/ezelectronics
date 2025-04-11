import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import ProductController from "../../src/controllers/productController";
import { Product } from "../../src/components/product";
import { Category } from "../../src/components/product";
import { cleanup } from "../../src/db/cleanup"
import { userInfo } from "os";
import exp from "constants";
import { group } from "console";
import e from "express";
import dayjs from "dayjs";
import { DateAfterError, DateBeforeError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/productController");
const customer = { username: "customer", name: "customer", surname: "customer", password: "1234", role: "Customer" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "1234", role: "Manager" };

describe('ProductRoutes', () => {
    const postUser = async (userInfo: any) => {
        await request(app)
            .post(`${baseURL}/users`)
            .send(userInfo)
            .expect(200)
    }

    const login = async (userInfo: any) => {
        return new Promise<string>((resolve, reject) => {
            request(app)
                .post(`${baseURL}/sessions`)
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

    beforeAll(async () => {
        postUser(customer)
        postUser(manager)
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        cleanup()
    })

    describe('POST /products', () => {
        test('should register the products', async() => {
            const productData = {
                model: "testModel",
                category: Category.LAPTOP,
                quantity: 10,
                details: "testDetails",
                sellingPrice: 100,
                arrivalDate: "2021-01-01"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(undefined)
            const response = await request(app).post(baseURL + "/products").set('Cookie', cookie).send(productData)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                productData.model,
                productData.category,
                productData.quantity,
                productData.details,
                productData.sellingPrice,
                productData.arrivalDate
            )
        })

        test('should return 401 if the user is not a manager', async() => {
            const productData = {
                model: "testModel",
                category: Category.LAPTOP,
                quantity: 10,
                details: "testDetails",
                sellingPrice: 100,
                arrivalDate: "2021-01-01"
            }
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).post(baseURL + "/products").set('Cookie', cookie).send(productData)
            expect(response.status).toBe(401)
        })

        test('should return 401 if the user is not authenticated', async() => {
            const productData = {
                model: "testModel",
                category: Category.LAPTOP,
                quantity: 10,
                details: "testDetails",
                sellingPrice: 100,
                arrivalDate: "2021-01-01"
            }
            const user = {
                username: "manager",
                password: "1"
            }
            const cookie = await login(user)
            const response = await request(app).post(baseURL + "/products").set('Cookie', cookie).send(productData)
            expect(response.status).toBe(401)
        })
        test('should return 400 if the arrival date is in the future', async () => {
            const productData = {
                model: "testModel",
                category: "Smartphone",
                quantity: 10,
                details: "testDetails",
                sellingPrice: 100,
                arrivalDate: dayjs().add(1, 'day').format('YYYY-MM-DD') // Data nel futuro
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "registerProducts").mockImplementationOnce(() => {
                return Promise.reject(new DateAfterError());
            });
    
            const response = await request(app).post(baseURL + "/products").set('Cookie', cookie).send(productData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The insert date is after today');
        });

        test('should return 409 if the product already exists', async () => {
            const productData = {
                model: "testModel",
                category: "Smartphone",
                quantity: 10,
                details: "testDetails",
                sellingPrice: 100,
                arrivalDate: "2021-01-01"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "registerProducts").mockImplementationOnce(() => {
                return Promise.reject(new ProductAlreadyExistsError());
            });
    
            const response = await request(app).post(baseURL + "/products").set('Cookie', cookie).send(productData);
            expect(response.status).toBe(409);
            expect(response.body.error).toBe('The product already exists');
        });
    })

    describe('PATCH /products/:model', () => {
        test('should update the product', async() => {
            const productData = {
                model: "model",
                quantity: 10,
                changeDate: "2021-01-01"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(10)
            const response = await request(app).patch(baseURL + "/products/model").set('Cookie', cookie).send(productData)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(
                productData.model,
                productData.quantity,
                productData.changeDate
            )
        })
        test('should return 400 if the change date is in the future', async () => {
            const productData = {
                model: "model",
                quantity: 10,
                changeDate: dayjs().add(1, 'day').format('YYYY-MM-DD') // Data nel futuro
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
                return Promise.reject(new DateAfterError());
            });
    
            const response = await request(app).patch(baseURL + "/products/" + productData.model).set('Cookie', cookie).send(productData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The insert date is after today');
        });

        test('should return 400 if the change date is before the arrival date', async () => {
            const productData = {
                model: "model",
                quantity: 10,
                changeDate: "2021-01-01"
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
                return Promise.reject(new DateBeforeError());
            });
    
            const response = await request(app).patch(baseURL + "/products/" + productData.model).set('Cookie', cookie).send(productData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The insert date is before the already present one');
        });

        test('should return 404 if the product is not found', async () => {
            const productData = {
                model: "model",
                quantity: 10,
                changeDate: "2021-01-01"
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
                return Promise.reject(new ProductNotFoundError());
            });
    
            const response = await request(app).patch(baseURL + "/products/" + productData.model).set('Cookie', cookie).send(productData);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found');
        });
    })

    describe('PATCH /products/:model/sell', () => {
        test('should sell the product', async() => {
            const productData = {
                model: "model",
                quantity: 10,
                sellingDate: "2021-01-01"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(0)
            const response = await request(app).patch(baseURL + "/products/model/sell").set('Cookie', cookie).send(productData)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
                productData.model,
                productData.quantity,
                productData.sellingDate
            )
        })

        test('should return 400 if the selling date is before the arrival date', async () => {
            const productData = {
                model: "model",
                quantity: 5,
                sellingDate: "2020-01-01"
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
                return Promise.reject(new DateBeforeError());
            });
            const response = await request(app).patch(baseURL + "/products/model/sell").set('Cookie', cookie).send(productData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The insert date is before the already present one');
        });

        test('should return 400 if the selling date is in the future', async () => {
            const productData = {
                model: "model",
                quantity: 5,
                sellingDate: "2020-01-01"
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
                return Promise.reject(new DateAfterError());
            });
            const response = await request(app).patch(baseURL + "/products/model/sell").set('Cookie', cookie).send(productData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The insert date is after today');
        });

        test('should return 404 if the product is not found', async () => {
            const productData = {
                model: "model",
                quantity: 5,
                sellingDate: "2020-01-01"
            };
            const user = {
                username: "manager",
                password: "1234"
            };
            const cookie = await login(user);
            jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
                return Promise.reject(new ProductNotFoundError());
            });
            const response = await request(app).patch(baseURL + "/products/model/sell").set('Cookie', cookie).send(productData);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found');
        });
    })

    describe('GET /products', () => {
        test('should return all products', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined)
        })

        test('should return all products by category', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products?grouping=category&category=Laptop").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category", Category.LAPTOP, undefined)
        })

        test('should return all products by model', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products?grouping=model&model=model").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, "model")
        })

        test('should return 500 if there is a database error during product retrieval', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getProducts").mockImplementationOnce(() => {
                return Promise.reject(new Error())
            })
            const response = await request(app).get(baseURL + "/products").set('Cookie', cookie)
            expect(response.status).toBe(503)
            expect(response.body.error).toBe("Internal Server Error")
        })

        test('should return 422 if the category is invalid', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products?grouping=category").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })

        test('should return 422 if the model is invalid', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products?grouping=model").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })

        test('should return 422 if the grouping is null but category or model are not', async() => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products?model=model").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })
    })

    describe('GET /products/available', () => {
        test('should return all available products', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products/available").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
        })

        test('should return all available products by category', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products/available?grouping=category&category=Laptop").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("category", Category.LAPTOP, undefined)
        })

        test('should return all available products by model', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([{model: "model", category: Category.LAPTOP, quantity: 10, details: "details", sellingPrice: 100, arrivalDate: "2021-01-01"}])
            const response = await request(app).get(baseURL + "/products/available?grouping=model&model=model").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("model", undefined, "model")
        })

        test('should return 500 if there is a database error during product retrieval', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockImplementationOnce(() => {
                return Promise.reject(new Error())
            })
            const response = await request(app).get(baseURL + "/products/available").set('Cookie', cookie)
            expect(response.status).toBe(503)
            expect(response.body.error).toBe("Internal Server Error")
        })

        test('should return 422 if the category is invalid', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products/available?grouping=category").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })

        test('should return 422 if the model is invalid', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products/available?grouping=model").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })

        test('should return 422 if the grouping is null but category or model are not', async() => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
            const response = await request(app).get(baseURL + "/products/available?model=model").set('Cookie', cookie)
            expect(response.status).toBe(422)
        })
    })

    describe('DELETE /products' , () => {
        test('should delete the product', async() => {
            const productData = {
                model: "model"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            const response = await request(app).delete(baseURL + "/products").set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)       
        })

        test('should return 500 if there is a database error during deletion', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockImplementationOnce(() => {
                return Promise.reject(new Error("Database error"))
            })
            const response = await request(app).delete(baseURL + "/products").set('Cookie', cookie)
            expect(response.status).toBe(503)
            expect(response.body.error).toBe("Internal Server Error")
        })
    })

    describe('DELETE /products/:model' , () => {
        test('should delete the product', async() => {
            const productData = {
                model: "model"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            const response = await request(app).delete(baseURL + "/products/" + productData.model).set('Cookie', cookie)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(productData.model)
        })

        test('should return 404 if the product does not exist', async () => {
            const productData = {
                model: "nonExistentModel"
            }
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
            jest.spyOn(ProductController.prototype, "deleteProduct").mockImplementationOnce(() => {
                return Promise.reject(new ProductNotFoundError())
            })
            const response = await request(app).delete(baseURL + "/products/" + productData.model).set('Cookie', cookie)
            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Product not found')
        })
    })
})
