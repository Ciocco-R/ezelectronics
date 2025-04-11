import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import CartController from "../../src/controllers/cartController"
import { Cart } from "../../src/components/cart"
import { ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import { cleanup } from "../../src/db/cleanup"
const baseURL = "/ezelectronics"

// Mock the CartController
jest.mock('../../src/controllers/cartController');
const customer = { username: "customer", name: "customer", surname: "customer", password: "1234", role: "Customer" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "1234", role: "Manager" };

describe('CartRoutes', () => {
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

    describe('GET /carts', () => {
        test('should get the cart of the logged in customer', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)

            const cart = new Cart(user.username, false, "", 100, [new ProductInCart('model1', 2, Category.SMARTPHONE, 50)]);
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart)
            
            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(200)

            expect(response.body).toEqual(cart)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
        });

        test('Should return an empty cart object if there is no unpaid cart in the database.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            
            const cookie = await login(user)

            const cart = new Cart(user.username, false, "", 0, []);
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart)

            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(200)
            expect(response.body).toEqual(cart)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
        });

        test('Should return an empty cart object if the unpaid cart contains no products.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            
            const cookie = await login(user)

            const cart = new Cart(user.username, false, "", 0, []);
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart)

            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(200)
            expect(response.body).toEqual(cart)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('POST /carts', () => {
        test('should add a product to the cart', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
    
            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie).send({ model: "iPhone13", quantity: 1 })
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        });

        test('Should increase the quantity of the product if it already exists in the cart.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
    
            //let's suppose is already present
            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie).send({ model: "iPhone13", quantity: 1 })
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        });

        test('Should create a new unpaid cart if none exists and add the product.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
    
            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie).send({ model: "iPhone13", quantity: 1 })
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 404 error if the product model does not exist.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError)
    
            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie).send({ model: "Iphone13", quatity: 1 })
    
            expect(response.status).toBe(404)
        });

        test('Should return a 409 error if the product model has an available quantity of 0.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError)
    
            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie).send({ model: "Iphone13", quantity: 1 })
    
            expect(response.status).toBe(409)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).post(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('PATCH /carts', () => {
        test('should checkout the cart', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should update the stock quantities of the products in the cart.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 404 error if there is no unpaid cart in the database.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(404)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 400 error if the unpaid cart contains no products.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(400)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 409 error if any product in the cart has an available quantity of 0.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyProductStockError)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(409)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 409 error if any product in the cart has a quantity higher than available stock.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError)
    
            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)
    
            expect(response.status).toBe(409)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).patch(baseURL + "/carts").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('GET /carts/history', () => {
        test('should get the history of the customer\'s carts', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            const cartHistory = [
                new Cart(user.username, true, "2024-05-02", 200, [new ProductInCart('iPhone 13', 1, Category.SMARTPHONE, 200)])
            ];
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce(cartHistory)
    
            const response = await request(app).get(baseURL + "/carts/history").set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(response.body).toEqual(cartHistory)
            expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + "/carts/history").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + "/carts/history").set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('DELETE /carts/products/:model', () => {
        test('should remove a product from the cart', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true)
    
            const response = await request(app).delete(baseURL + `/carts/products/iPhone13`).set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 404 error if the product is not in the cart.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError)
    
            const response = await request(app).delete(baseURL + `/carts/products/NonExistentProduct`).set('Cookie', cookie)
    
            expect(response.status).toBe(404)
        });

        test('Should return a 404 error if there is no unpaid cart for the user.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError)
    
            const response = await request(app).delete(baseURL + `/carts/products/iPhone13`).set('Cookie', cookie)
    
            expect(response.status).toBe(404)
        });

        test('Should return a 404 error if the product model does not exist.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError)
    
            const response = await request(app).delete(baseURL + `/carts/products/NonExistentProduct`).set('Cookie', cookie)
    
            expect(response.status).toBe(404)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts/products/iPhone13`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts/products/iPhone13`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('DELETE /carts/current', () => {
        test('should clear the cart', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true)
    
            const response = await request(app).delete(baseURL + `/carts/current`).set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1)
        });

        test('Should return a 404 error if there is no unpaid cart for the user.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError)
    
            const response = await request(app).delete(baseURL + `/carts/current`).set('Cookie', cookie)
    
            expect(response.status).toBe(404)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "customer",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts/current`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a customer.', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts/current`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('DELETE /carts', () => {
        test('should delete all carts', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
    
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true)
    
            const response = await request(app).delete(baseURL + `/carts`).set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "manager",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not a manager or an admin', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).delete(baseURL + `/carts`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });

    describe('GET /carts/all', () => {
        test('should get all carts', async () => {
            const user = {
                username: "manager",
                password: "1234"
            }
            const cookie = await login(user)
    
            const carts = [
                new Cart(user.username, true, "2024-05-02", 200, [new ProductInCart('iPhone 13', 1, Category.SMARTPHONE, 200)])
            ];
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(carts)
    
            const response = await request(app).get(baseURL + `/carts/all`).set('Cookie', cookie)
    
            expect(response.status).toBe(200)
            expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1)
        });

        test('Should return a 401 error if the user is not authenticated.', async () => {
            const user = {
                username: "manager",
                password: "1"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + `/carts/all`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });

        test('Should return a 401 error if the user is authenticated but not an admin or manager.', async () => {
            const user = {
                username: "customer",
                password: "1234"
            }

            const cookie = await login(user)

            const response = await request(app).get(baseURL + `/carts/all`).set('Cookie', cookie)

            expect(response.status).toBe(401)
        });
    });
});
