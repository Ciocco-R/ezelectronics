import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { DateAfterError, DateBeforeError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import { Category, Product } from "../../src/components/product";
import { error } from "console"

jest.mock("../../src/db/db.ts")

describe("registerNewProductsSet", () => {
    test("It should return undefined if the new Products are inserted", async () => {
        const productDAO = new ProductDAO()
        
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });
        const result = await productDAO.registerNewProductsSet("model3", Category.APPLIANCE, 2, "", 50, "")
        expect(result).toBe(undefined)
        mockDBRun.mockRestore()
    })

    test("It should return a ProductAlreadyExistsError if the product already exists", async () => {
        const productDAO = new ProductDAO()

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: product.model"), null)
            return {} as Database
        });
        await expect(productDAO.registerNewProductsSet("model1", Category.APPLIANCE, 2, "", 50, "")).rejects.toThrow(new ProductAlreadyExistsError)
        mockDBRun.mockRestore()
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });
        await expect(productDAO.registerNewProductsSet("model3", Category.APPLIANCE, 2, "", 50, "")).rejects.toThrow(new Error)
        mockDBRun.mockRestore()
    })

    test("It should return a DateAfterError if the date is wrong", async () => {
        const productDAO = new ProductDAO()
        
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });
        await expect(productDAO.registerNewProductsSet("model2", Category.APPLIANCE, 2, "", 50, "2027-01-01")).rejects.toThrow(new DateAfterError)
        mockDBRun.mockRestore()
    })

    test("DB Error", async () => {
        const productDAO = new ProductDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await productDAO.registerNewProductsSet("model2", Category.APPLIANCE, 2, "", 50, "")
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBRun.mockRestore()
        }
    });
})

describe("increaseProductQuantity", () => {
    test("It should return a number if the product quantity is increased", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(null, {quantity: 2})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });
        const result = await productDAO.increaseProductQuantity("model1", 2, "")
        expect(result).toEqual(2)
        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
    })

    test("It should return a ProductNotFoundError if the product is not found", async () => {
        const productDAO = new ProductDAO()
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(ProductNotFoundError, null)
            return {} as Database
        });

        await expect(productDAO.increaseProductQuantity("model1", 2, "")).rejects.toThrow(new ProductNotFoundError)
        mockDBGet.mockRestore()
    })

    test("It should return a DateBeforeError if the date is wrong", async () => {
        const productDAO = new ProductDAO()
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {arrivalDate: "2024-09-10" })
            return {} as Database
        });

        await expect(productDAO.increaseProductQuantity("model1", 2, "2023-01-01")).rejects.toThrow(new DateBeforeError)
        mockDBGet.mockRestore()
    })

    test("It should return a DateAfterError if the date is wrong", async () => {
        const productDAO = new ProductDAO()

        await expect(productDAO.increaseProductQuantity("model1", 2, "2027-01-01")).rejects.toThrow(new DateBeforeError)
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(null, {quantity: 0})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(productDAO.increaseProductQuantity("model1", 2, "")).rejects.toThrow(new Error)
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(new Error(), null)
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });

        await expect(productDAO.increaseProductQuantity("model1", 2, "")).rejects.toThrow(new Error)
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })
    
})

describe("decreaseProductQuantity", () => {
    test("It should return a number if the product quantity is decreased", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(null, {quantity: 0})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes: 2}, null)
            return {} as Database
        });
        const result = await productDAO.decreaseProductQuantity("model1", 2, "")
        expect(result).toEqual(0)
        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
    })

    test("It should return a DateAfterError if the date is wrong", async () => {
        const productDAO = new ProductDAO()

        await expect(productDAO.decreaseProductQuantity("model1", 2, "2027-01-01")).rejects.toThrow(new DateBeforeError)
    })

    test("It should return a ProductNotFoundError if the product is not found", async () => {
        const productDAO = new ProductDAO()
        
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(ProductNotFoundError, null)
            } 
            return {} as Database
        });

        await expect(productDAO.decreaseProductQuantity("model1", 2, "")).rejects.toThrow(new ProductNotFoundError)
        mockDBGet.mockRestore()
    })

    test("It should return a DateBeforeError if the date is wrong", async () => {
        const productDAO = new ProductDAO()
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {arrivalDate: "2024-09-10" })
            return {} as Database
        });

        await expect(productDAO.decreaseProductQuantity("model1", 2, "2023-01-01")).rejects.toThrow(new DateBeforeError)
        mockDBGet.mockRestore()
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(null, {quantity: 0})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(productDAO.decreaseProductQuantity("model1", 2, "")).rejects.toThrow(new Error)
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
        ]
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("SELECT *")) {
                callback(null, products)
            } else if(sql.includes("SELECT quantity")) {
                callback(new Error(), null)
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });

        await expect(productDAO.decreaseProductQuantity("model1", 2, "")).rejects.toThrow(new Error)
        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })
})

describe("getProducts", () => {
    test("It should return an empty vector of products", async () => {
        const productDAO = new ProductDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.getProducts()
        expect(result).toEqual([])
        mockDBAll.mockRestore()
    })

    test("It should return two products", async () => {
        const productDAO = new ProductDAO()
        const products = [
            { model: 'model1', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" },
            { model: 'model2', quantity: 2, category: Category.APPLIANCE, sellingPrice: 50, arrivalDate: "", details: "" }
        ]
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, products)
            return {} as Database
        });

        const result = await productDAO.getProducts()
        expect(result).toEqual([
            new Product(50, 'model1', Category.APPLIANCE, "", "", 2),
            new Product(50, 'model2', Category.APPLIANCE, "", "", 2)
        ]);
        mockDBAll.mockRestore()
    })

    test("It should reject if there is an error in the product query", async () => {
        const productDAO = new ProductDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(productDAO.getProducts()).rejects.toThrow(new Error());
        mockDBAll.mockRestore()
    })
})

describe("getProductsByModel", () => {
    test("It should return an array of products when products with the given model exists", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { sellingPrice: 100, model: 'model1', category: Category.APPLIANCE, arrivalDate: '2024-05-01', details: 'Details', quantity: 2 },
            ]);
            return {} as Database;
        });

        const result = await productDAO.getProductsByModel("model1");
        expect(result).toEqual([
            new Product(100, 'model1', Category.APPLIANCE, '2024-05-01', 'Details', 2),
        ]);

        mockDBAll.mockRestore();
    });

    test("It should reject with ProductNotFoundError if no products with the given model are found", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new ProductNotFoundError(), null);
            return {} as Database;
        });

        await expect(productDAO.getProductsByModel("nonExistingModel")).rejects.toThrow(ProductNotFoundError);

        mockDBAll.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        await expect(productDAO.getProductsByModel("model1")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
});

describe("getProductsByCategory", () => {
    test("It should return an array of products when products with the given category exist", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { sellingPrice: 100, model: 'model1', category: Category.APPLIANCE, arrivalDate: '2024-05-01', details: 'Details', quantity: 2 },
            ]);
            return {} as Database;
        });

        const result = await productDAO.getProductsByCategory("Appliance");
        expect(result).toEqual([
            new Product(100, 'model1', Category.APPLIANCE, '2024-05-01', 'Details', 2),
        ]);

        mockDBAll.mockRestore();
    });

    test("It should reject with ProductNotFoundError if no products with the given category are found", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        const result = await (productDAO.getProductsByCategory("NonExistingCategory"));
        expect(result).toEqual([]);
        mockDBAll.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database query error"), null);
            return {} as Database;
        });

        await expect(productDAO.getProductsByCategory("Appliance")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
})

describe("getAvailableProducts", () => {
    test("It should return an array of available products", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { sellingPrice: 100, model: 'model1', category: Category.APPLIANCE, arrivalDate: '2024-05-01', details: 'Details', quantity: 2 },
                { sellingPrice: 150, model: 'model2', category: Category.APPLIANCE, arrivalDate: '2024-05-02', details: 'Details', quantity: 1 },
            ]);
            return {} as Database;
        });

        const result = await productDAO.getAvailableProducts();
        expect(result).toEqual([
            new Product(100, 'model1', Category.APPLIANCE, '2024-05-01', 'Details', 2),
            new Product(150, 'model2', Category.APPLIANCE, '2024-05-02', 'Details', 1),
        ]);

        mockDBAll.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database query error"), null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts()).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
})

describe("getAvailableProductsByModel", () => {
    test("It should return an array of available products for the given model", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { sellingPrice: 100, model: 'model1', category: Category.APPLIANCE, arrivalDate: '2024-05-01', details: 'Details', quantity: 2 },
                { sellingPrice: 150, model: 'model1', category: Category.APPLIANCE, arrivalDate: '2024-05-02', details: 'Details', quantity: 1 },
            ]);
            return {} as Database;
        });

        const result = await productDAO.getAvailableProductsByModel("model1");
        expect(result).toEqual([
            new Product(100, 'model1', Category.APPLIANCE, '2024-05-01', 'Details', 2),
            new Product(150, 'model1', Category.APPLIANCE, '2024-05-02', 'Details', 1),
        ]);

        mockDBAll.mockRestore();
    });

    test("It should reject with ProductNotFoundError if no available products are found for the given model", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new ProductNotFoundError, null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProductsByModel("NonExistingModel")).rejects.toThrow(ProductNotFoundError);

        mockDBAll.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database query error"), null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProductsByModel("model1")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
})

describe("getAvailableProductsByCategory", () => {
    test("It should return an array of available products for the given category", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { sellingPrice: 100, model: 'model1', category: 'Appliance', arrivalDate: '2024-05-01', details: 'Details', quantity: 2 },
                { sellingPrice: 150, model: 'model2', category: 'Appliance', arrivalDate: '2024-05-02', details: 'Details', quantity: 1 },
            ]);
            return {} as Database;
        });

        const result = await productDAO.getAvailableProductsByCategory("Appliance");
        expect(result).toEqual([
            new Product(100, 'model1', Category.APPLIANCE, '2024-05-01', 'Details', 2),
            new Product(150, 'model2', Category.APPLIANCE, '2024-05-02', 'Details', 1),
        ]);

        mockDBAll.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database query error"), null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProductsByCategory("Appliance")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
})

describe("deleteProductByModel", () => {
    test("It should resolve if the product is deleted", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes: 1}, null);
            return {} as Database;
        });

        const result = await productDAO.deleteProductByModel("model1");
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("It should reject with ProductNotFoundError if the product to delete is not found", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({changes: 0}, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProductByModel("nonExistingModel")).rejects.toThrow(ProductNotFoundError);

        mockDBRun.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProductByModel("model1")).rejects.toThrow(Error);

        mockDBRun.mockRestore();
    });
})

describe("deleteAllProducts", () => {
    test("It should delete all products and return true", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await productDAO.deleteAllProducts();
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error, null);
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow(Error);

        mockDBRun.mockRestore();
    });

    test("DB Error", async () => {
        const productDAO = new ProductDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await productDAO.deleteAllProducts()
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBRun.mockRestore()
        }
    });

})