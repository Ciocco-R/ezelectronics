import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import CartDAO from "../../src/dao/cartDAO"
import {Cart, ProductInCart} from "../../src/components/cart";
import {ProductNotFoundError, EmptyProductStockError, LowProductStockError} from "../../src/errors/productError"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user";
import { Category } from "../../src/components/product";
import { beforeEach } from "node:test";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

jest.mock("../../src/db/db.ts")

describe("getCart", () => {
    test("It should return empty Cart", async () => {
        const cartDAO = new CartDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        }); 
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });

        const result = await cartDAO.getCart(new User("testUser", "test", "user", Role.CUSTOMER, "", ""))
        expect(result).toEqual({
            customer: 'testUser',
            paid: false,
            paymentDate: "",
            total: 0,
            products: []
        })
        mockDBAll.mockRestore()
        mockDBGet.mockRestore()
    })

    test('should return a cart with products if a cart is found', async () => {
        const cartDAO = new CartDAO()
        const cart = { cartId: 1, total: 100 };
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50 },
            { model: 'model2', quantity: 1, category: Category.SMARTPHONE, sellingPrice: 50 }
        ];

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, cart)
            return {} as Database
        }); 
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, products)
            return {} as Database
        });

        const result = await cartDAO.getCart(new User("testUser", "test", "user", Role.CUSTOMER, "", "")) 
        expect(result).toEqual({
            customer: 'testUser',
            paid: false,
            paymentDate: "",
            total: 100,
            products: [
                new ProductInCart('model1', 2, Category.APPLIANCE, 50),
                new ProductInCart('model2', 1, Category.SMARTPHONE, 50)
            ]
        });      
        mockDBAll.mockRestore()
        mockDBGet.mockRestore()
    });

    test('should reject if there is an error in the cart query', async () => {
        const cartDAO = new CartDAO()

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(cartDAO.getCart(new User("testUser", "test", "user", Role.CUSTOMER, "", ""))).rejects.toThrow(new Error());
        mockDBGet.mockRestore()
    });

    test('should reject if there is an error in the cart query', async () => {
        const cartDAO = new CartDAO()

        const cart = { cartId: 1, total: 100 };
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((query, params, callback) => {
            callback(null, cart);
            return {} as Database
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(cartDAO.getCart(new User("testUser", "test", "user", Role.CUSTOMER, "", ""))).rejects.toThrow(new Error());
        mockDBAll.mockRestore()
    });
});

describe("addToCart", () => {
    test("It should reject with ProductNotFoundError if the product does not exist", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new ProductNotFoundError(), null); // No product found
            return {} as Database;
        });

        await expect(cartDAO.addToCart(loggedInUser, 'nonexistent')).rejects.toThrow(new ProductNotFoundError());
        mockDBGet.mockRestore();
    });

    test("It should reject with EmptyProductStockError if the product is out of stock", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { model: 'product1', quantity: 0 }); // Out of stock product
            return {} as Database;
        });

        await expect(cartDAO.addToCart(loggedInUser, 'product1')).rejects.toThrow(new EmptyProductStockError());
        mockDBGet.mockRestore();
    });

    test("It should create a new cart if none exists and add product to it", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const product = { model: 'product1', quantity: 10, category: 'category1', sellingPrice: 100 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM product')) {
                callback(null, product); // Product found
            } else if (sql.includes('SELECT cartId FROM cart WHERE username')) {
                callback(null, null); // No cart found
            } else if (sql.includes('cart_product')){
                callback(null, null)
            } else if (sql.includes('SELECT cartId, model FROM cart_product')){
                callback(null, null)
            }
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            if (sql.includes('INSERT INTO cart')){
                callback.call({lastID: 1}, null);
            } else if(sql.includes("INSERT INTO cart_product")){
                callback(null)
            } else if (sql.includes("UPDATE cart SET")){
                callback(null)
            }
            return {} as Database;
        });

        const result = await cartDAO.addToCart(loggedInUser, 'product1');
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("It should add product to an existing cart", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const cart = { cartId: 1, total: 100 };
        const product = { model: 'product1', quantity: 10, category: 'category1', sellingPrice: 100 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            } else if (sql.includes('cart_product')) {
                callback(null, null); // Product not in cart yet
            }
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            if (sql.includes('UPDATE cart_product')){
                callback(null);
            } else if (sql.includes('UPDATE cart')) {
                callback(null)
            }
            return {} as Database;
        });

        const result = await cartDAO.addToCart(loggedInUser, 'product1');
        expect(result).toBe(true);

        mockDBGet.mockRestore();
    });

    test("It should update quantity if product already exists in cart", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const cart = { cartId: 1, total: 100 };
        const product = { model: 'product1', quantity: 10, category: 'category1', sellingPrice: 100 };
        const cartProduct = { cartId: 1, model: 'product1', quantity: 1 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            } else if (sql.includes('cart_product')) {
                callback(null, cartProduct); // Product already in cart
            }
            return {} as Database;
        });

        const result = await cartDAO.addToCart(loggedInUser, 'product1');
        expect(result).toBe(true);

        mockDBGet.mockRestore();
    });

    test("It should reject if there is an error in product query", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM product'))
                callback(new ProductNotFoundError(), null);
            return {} as Database;
        });

        await expect(cartDAO.addToCart(loggedInUser, 'product1')).rejects.toThrow(new ProductNotFoundError());
        mockDBGet.mockRestore();
    });

    test("It should reject if there is an error in cart query", async () => {
        const cartDAO = new CartDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const product = { model: 'product1', quantity: 10, category: 'category1', sellingPrice: 100 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart WHERE username')) {
                callback(new Error(), null);
            }
            return {} as Database;
        });

        await expect(cartDAO.addToCart(loggedInUser, 'product1')).rejects.toThrow(new Error());
        mockDBGet.mockRestore();
    });
})

describe("checkoutCart", () => {
    test("It should checkout the cart successfully", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1 };
        const products = [
            { model: 'product1', availableQuantity: 10, quantity: 2 },
            { model: 'product2', availableQuantity: 5, quantity: 1 }
        ];

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            } else {
                callback(null, {}); // Default response for other queries
            }
            return {} as Database;
        });

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart_product')) {
                callback(null, products); // Cart products found
            }
            return {} as Database;
        });

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Default response for all run operations
            return {} as Database;
        });

        const result = await cartDAO.checkoutCart(loggedInUser);
        expect(result).toBe(true);
    });

    test("It should throw CartNotFoundError if no cart found", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, null); // No cart found
            }
            return {} as Database;
        });

        await expect(cartDAO.checkoutCart(loggedInUser)).rejects.toThrow(CartNotFoundError);
    });

    test("It should throw EmptyCartError if the cart is empty", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            }
            return {} as Database;
        });

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart_product')) {
                callback(null, []); // No products found
            }
            return {} as Database;
        });

        await expect(cartDAO.checkoutCart(loggedInUser)).rejects.toThrow(new EmptyCartError());
    });

    test("It should throw LowProductStockError if product stock is insufficient", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1 };
        const products = [
            { model: 'product1', availableQuantity: 1, quantity: 2 }
        ];

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            }
            return {} as Database;
        });

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart_product')) {
                callback(null, products); // Cart products found
            }
            return {} as Database;
        });

        await expect(cartDAO.checkoutCart(loggedInUser)).rejects.toThrow(LowProductStockError);
    });
});

describe("getCustomerCarts", () => {
    test("It should return a list of paid carts for the customer", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const carts = [{ cartId: 1, total: 100, paid: true, paymentDate: "2024-05-26" }];
        const products = [{ model: 'model1', quantity: 2, category: Category.SMARTPHONE, sellingPrice: 50 }];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, carts); // Carts found
            } else if (sql.includes('cart_product')) {
                callback(null, products); // Cart products found
            }
            return {} as Database;
        });

        const result = await cartDAO.getCustomerCarts(loggedInUser);
        expect(result).toEqual([
            new Cart(
                'testUser',
                true,
                "2024-05-26",
                100,
                [new ProductInCart('model1', 2, Category.SMARTPHONE, 50)]
            )
        ]);
    });

    test("It should return an empty array if no paid carts are found", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, []); // No carts found
            }
            return {} as Database;
        });

        const result = await cartDAO.getCustomerCarts(loggedInUser);
        expect(result).toEqual([]);
    });

    test("It should throw an error if the database query fails", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.getCustomerCarts(loggedInUser)).rejects.toThrow("Database error");
    });
});

describe("removeProductFromCart", () => {
    test("It should remove a product from the cart successfully", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1, total: 100 };
        const product = { model: 'product1', price: 50 };
        const cartProduct = { quantity: 1 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            } else if (sql.includes('product WHERE model')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart_product WHERE cartId')) {
                callback(null, cartProduct); // Cart product found
            }
            return {} as Database;
        });

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Default response for all run operations
            return {} as Database;
        });

        const result = await cartDAO.removeProductFromCart(loggedInUser, 'product1');
        expect(result).toBe(true);
    });

    test("It should throw ProductNotFoundError if the product does not exist", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product WHERE model')) {
                callback(null, null); // No product found
            }
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(loggedInUser, 'product1')).rejects.toThrow(ProductNotFoundError);
    });

    test("It should throw CartNotFoundError if no cart is found", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const product = { model: 'product1', price: 50 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product WHERE model')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart WHERE username')) {
                callback(null, null); // No cart found
            }
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(loggedInUser, 'product1')).rejects.toThrow(CartNotFoundError);
    });

    test("It should throw ProductNotFoundInCartError if the product is not in the cart", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1, total: 100 };
        const product = { model: 'product1', price: 50 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            } else if (sql.includes('product WHERE model')) {
                callback(null, product); // Product found
            } else if (sql.includes('cart_product WHERE cartId')) {
                callback(null, null); // Product not found in cart
            }
            return {} as Database;
        });

        await expect(cartDAO.removeProductFromCart(loggedInUser, 'product1')).rejects.toThrow(new ProductNotInCartError());
    });
});

describe("clearCart", () => {
    test("It should clear the cart successfully", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            }
            return {} as Database;
        });

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Default response for all run operations
            return {} as Database;
        });

        const result = await cartDAO.clearCart(loggedInUser);
        expect(result).toBe(true);
    });

    test("It should throw CartNotFoundError if no cart is found", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, null); // No cart found
            }
            return {} as Database;
        });

        await expect(cartDAO.clearCart(loggedInUser)).rejects.toThrow(new CartNotFoundError());
    });

    test("It should throw an error if the database query fails", async () => {
        const cartDAO = new CartDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const cart = { cartId: 1 };

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('cart WHERE username')) {
                callback(null, cart); // Cart found
            }
            return {} as Database;
        });

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.clearCart(loggedInUser)).rejects.toThrow("Database error");
    });
});

describe("deleteAllCarts", () => {
    test("It should delete all carts successfully", async () => {
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Default response for all run operations
            return {} as Database;
        });

        const result = await cartDAO.deleteAllCarts();
        expect(result).toBe(true);
    });

    test("It should throw an error if the database query fails", async () => {
        const cartDAO = new CartDAO();

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error());
            return {} as Database;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow(new Error());
    });
});

describe("getAllCarts", () => {
    test("It should return a list of all carts", async () => {
        const cartDAO = new CartDAO();
        const carts = [{ cartId: 1, username: 'testUser', paid: false, paymentDate: "", total: 100 }];
        const products = [{ model: 'model1', quantity: 2, category: Category.SMARTPHONE, sellingPrice: 50 }];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('FROM cart')) {
                callback(null, carts); // Carts found
            } else if (sql.includes('cart_product')) {
                callback(null, products); // Cart products found
            }
            return {} as Database;
        });

        const result = await cartDAO.getAllCarts();
        expect(result).toEqual([
                 {
                  customer: "testUser",
                  paid: false,
                  paymentDate: "",
                  products: [
                    {
                      category: undefined,
                      model: undefined,
                      price: undefined,
                      quantity: undefined,
                    }
                  ],
                  total: 100,
                }
              ]);
    
    });

    test("It should return an empty array if no carts are found", async () => {
        const cartDAO = new CartDAO();

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes('FROM cart')) {
                callback(null, []); // No carts found
            }
            return {} as Database;
        });

        const result = await cartDAO.getAllCarts();
        expect(result).toEqual([]);
    });

    test("It should throw an error if the database query fails", async () => {
        const cartDAO = new CartDAO();

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow(new Error());
    });
});

