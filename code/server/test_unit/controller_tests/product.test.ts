import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ProductController from "../../src/controllers/productController";
import { Category, Product } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import { User, Role } from "../../src/components/user";
import { DateAfterError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";

jest.mock("../../src/dao/productDAO");

describe('ProductController', () => {
    let produtctController: ProductController;
    let mockUser: User;
    let mockerProductDAO: jest.Mocked<ProductDAO>;

    beforeAll(() => {
        mockerProductDAO = new ProductDAO() as jest.Mocked<ProductDAO>;
        produtctController = new ProductController();
        produtctController['dao'] = mockerProductDAO;
        mockUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerProducts', () => {
        test('should call dao.registerNewProductsSet with the correct parameters', async () => {
            mockerProductDAO.registerNewProductsSet.mockResolvedValue();

            const result = await produtctController.registerProducts("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01");
            expect(result).toBeUndefined();
            expect(mockerProductDAO.registerNewProductsSet).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.registerNewProductsSet).toHaveBeenCalledWith("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01");
        });

        test('should throw a ProductAlreadyExistsError if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.registerNewProductsSet.mockRejectedValue(new ProductAlreadyExistsError);

            await expect(produtctController.registerProducts("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01")).rejects.toThrow(new ProductAlreadyExistsError);
            expect(mockerProductDAO.registerNewProductsSet).toHaveBeenCalledWith("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01");
        });

        test('should throw an error if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.registerNewProductsSet.mockRejectedValue(new Error);

            await expect(produtctController.registerProducts("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01")).rejects.toThrow(Error);
            expect(mockerProductDAO.registerNewProductsSet).toHaveBeenCalledWith("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01");
        });

        test('should throw a DateAfterError if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.registerNewProductsSet.mockRejectedValue(new DateAfterError);

            await expect(produtctController.registerProducts("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01")).rejects.toThrow(DateAfterError);
            expect(mockerProductDAO.registerNewProductsSet).toHaveBeenCalledWith("testModel", "testCategory", 10, "testDetails", 100, "2021-01-01");
        });
    });

    describe('changeProductQuantity', () => {
        test('should call dao.increaseProductQuantity with the correct parameters', async () => {
            mockerProductDAO.increaseProductQuantity.mockResolvedValue(20);

            const result = await produtctController.changeProductQuantity("testModel", 10, "2021-01-01");
            expect(result).toEqual(20);
            expect(mockerProductDAO.increaseProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.increaseProductQuantity).toHaveBeenCalledWith("testModel", 10, "2021-01-01");
        });

        test('should throw an error if dao.increaseProductQuantity throws an error', async () => {       
            mockerProductDAO.increaseProductQuantity.mockRejectedValue(new Error);

            await expect(produtctController.changeProductQuantity("testModel", 10, "2021-01-01")).rejects.toThrow(Error);
            expect(mockerProductDAO.increaseProductQuantity).toHaveBeenCalledTimes(1);
        });
        
        test('should throw a DateAfterError if dao.increaseProductQuantity throws an error', async () => {     
            mockerProductDAO.increaseProductQuantity.mockRejectedValue(new DateAfterError);

            await expect(produtctController.changeProductQuantity("testModel", 10, "2021-01-01")).rejects.toThrow(DateAfterError);
            expect(mockerProductDAO.increaseProductQuantity).toHaveBeenCalledTimes(1);
        });

        test('should throw a ProductNotFoundError if dao.increaseProductQuantity throws an error', async () => {
            mockerProductDAO.increaseProductQuantity.mockRejectedValue(new ProductNotFoundError);

            await expect(produtctController.changeProductQuantity("testModel", 10, "2021-01-01")).rejects.toThrow(ProductNotFoundError);
            expect(mockerProductDAO.increaseProductQuantity).toHaveBeenCalledTimes(1);
        });
    });

    describe('sellProduct', () => {
        test('should call dao.decreaseProductQuantity with the correct parameters', async () => {
            mockerProductDAO.decreaseProductQuantity.mockResolvedValue(20);

            const result = await produtctController.sellProduct("testModel", 10, "2021-01-01");
            expect(result).toEqual(20);
            expect(mockerProductDAO.decreaseProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.decreaseProductQuantity).toHaveBeenCalledWith("testModel", 10, "2021-01-01");
        });
        
        test('should throw an error if dao.decreaseProductQuantity throws an error', async () => {
            mockerProductDAO.decreaseProductQuantity.mockRejectedValue(new Error);

            await expect(produtctController.sellProduct("testModel", 10, "2021-01-01")).rejects.toThrow(Error);
            expect(mockerProductDAO.decreaseProductQuantity).toHaveBeenCalledTimes(1);
        });

        test('should throw a DateAfterError if dao.decreaseProductQuantity throws an error', async () => {
            mockerProductDAO.decreaseProductQuantity.mockRejectedValue(new DateAfterError);

            await expect(produtctController.sellProduct("testModel", 10, "2021-01-01")).rejects.toThrow(DateAfterError);
            expect(mockerProductDAO.decreaseProductQuantity).toHaveBeenCalledTimes(1);
        });

        test('should throw a ProductNotFoundError if dao.decreaseProductQuantity throws an error', async () => {
            mockerProductDAO.decreaseProductQuantity.mockRejectedValue(new ProductNotFoundError);

            await expect(produtctController.sellProduct("testModel", 10, "2021-01-01")).rejects.toThrow(ProductNotFoundError);
            expect(mockerProductDAO.decreaseProductQuantity).toHaveBeenCalledTimes(1);
        });
    });

    describe('getProducts', () => {
        test('should call dao.getProductsByCategory with the correct parameters', async () => {
            mockerProductDAO.getProductsByCategory.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getProducts("category", "testCategory", null);
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getProductsByCategory).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.getProductsByCategory).toHaveBeenCalledWith("testCategory");
        });

        test('should call dao.getProductsByModel with the correct parameters', async () => {
            mockerProductDAO.getProductsByModel.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getProducts("model", null, "testModel");
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getProductsByModel).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.getProductsByModel).toHaveBeenCalledWith("testModel");
        });

        test('should throw an error if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.getProducts.mockRejectedValue(new Error);

            await expect(produtctController.getProducts(null, null, null)).rejects.toThrow(Error);
            expect(mockerProductDAO.getProducts).toHaveBeenCalledTimes(1);
        });

        test('should return all products if no grouping is provided', async () => {
            mockerProductDAO.getProducts.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getProducts(null, null, null);
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getProducts).toHaveBeenCalledTimes(1);
        });

        test('should return an empty array if no products are found', async () => {
            mockerProductDAO.getProducts.mockResolvedValue([]);

            const result = await produtctController.getProducts(null, null, null);
            expect(result).toEqual([]);
            expect(mockerProductDAO.getProducts).toHaveBeenCalledTimes(1);
        });

        test('should throw a ProductNotFoundError if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.getProducts.mockRejectedValue(new ProductNotFoundError);

            await expect(produtctController.getProducts(null, null, null)).rejects.toThrow(ProductNotFoundError);
            expect(mockerProductDAO.getProducts).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAvailableProducts', () => {
        test('should call dao.getAvailableProductsByCategory with the correct parameters', async () => {
            mockerProductDAO.getAvailableProductsByCategory.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getAvailableProducts("category", "testCategory", null);
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getAvailableProductsByCategory).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.getAvailableProductsByCategory).toHaveBeenCalledWith("testCategory");
        });

        test('should call dao.getAvailableProductsByModel with the correct parameters', async () => {
            mockerProductDAO.getAvailableProductsByModel.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getAvailableProducts("model", null, "testModel");
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getAvailableProductsByModel).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.getAvailableProductsByModel).toHaveBeenCalledWith("testModel");
        });

        test('should throw an error if dao.registerNewProductsSet throws an error', async () => {         
            mockerProductDAO.getAvailableProducts.mockRejectedValue(new Error);

            await expect(produtctController.getAvailableProducts(null, null, null)).rejects.toThrow(Error);
            expect(mockerProductDAO.getAvailableProducts).toHaveBeenCalledTimes(1);
        });

        test('should return all products if no grouping is provided', async () => {
            mockerProductDAO.getAvailableProducts.mockResolvedValue([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);

            const result = await produtctController.getAvailableProducts(null, null, null);
            expect(result).toEqual([{ model: "testModel", category: Category.APPLIANCE, quantity: 10, details: "testDetails", sellingPrice: 100, arrivalDate: "2021-01-01"}]);
            expect(mockerProductDAO.getAvailableProducts).toHaveBeenCalledTimes(1);
        });
        
        test('should return an empty array if no products are found', async () => {
            mockerProductDAO.getAvailableProducts.mockResolvedValue([]);

            const result = await produtctController.getAvailableProducts(null, null, null);
            expect(result).toEqual([]);
            expect(mockerProductDAO.getAvailableProducts).toHaveBeenCalledTimes(1);
        });

        test('should throw a ProductNotFoundError if dao.registerNewProductsSet throws an error', async () => {
            mockerProductDAO.getAvailableProducts.mockRejectedValue(new ProductNotFoundError);

            await expect(produtctController.getAvailableProducts(null, null, null)).rejects.toThrow(ProductNotFoundError);
            expect(mockerProductDAO.getAvailableProducts).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteAllProducts', () => {
        test('should call dao.deleteAllProducts with the correct parameters', async () => {
            mockerProductDAO.deleteAllProducts.mockResolvedValue(true);

            const result = await produtctController.deleteAllProducts();
            expect(result).toEqual(true);
            expect(mockerProductDAO.deleteAllProducts).toHaveBeenCalledTimes(1);
        });

        test('should throw an error if dao.deleteAllProducts throws an error', async () => {
            mockerProductDAO.deleteAllProducts.mockRejectedValue(new Error);

            await expect(produtctController.deleteAllProducts()).rejects.toThrow(Error);
            expect(mockerProductDAO.deleteAllProducts).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteProduct', () => {
        test('should call dao.deleteProductByModel with the correct parameters', async () => {
            mockerProductDAO.deleteProductByModel.mockResolvedValue(true);

            const result = await produtctController.deleteProduct("testModel");
            expect(result).toEqual(true);
            expect(mockerProductDAO.deleteProductByModel).toHaveBeenCalledTimes(1);
            expect(mockerProductDAO.deleteProductByModel).toHaveBeenCalledWith("testModel");
        });

        test('should throw an error if dao.deleteProductByModel throws an error', async () => {
            mockerProductDAO.deleteProductByModel.mockRejectedValue(new Error);

            await expect(produtctController.deleteProduct("testModel")).rejects.toThrow(Error);
            expect(mockerProductDAO.deleteProductByModel).toHaveBeenCalledTimes(1);
        });

        test('should throw a ProductNotFoundError if dao.deleteProductByModel throws an error', async () => {
            mockerProductDAO.deleteProductByModel.mockRejectedValue(new ProductNotFoundError);

            await expect(produtctController.deleteProduct("testModel")).rejects.toThrow(ProductNotFoundError);
            expect(mockerProductDAO.deleteProductByModel).toHaveBeenCalledTimes(1);
        }); 
    });
})