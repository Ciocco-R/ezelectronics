import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import CartController from "../../src/controllers/cartController";
import { Cart, ProductInCart } from "../../src/components/cart";
import { User, Role } from "../../src/components/user";
import { Category, Product } from "../../src/components/product";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import CartDAO from "../../src/dao/cartDAO"; // Replace with your actual DAO path
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import { LOCKED } from "sqlite3";

jest.mock("../../src/dao/cartDAO");

describe('CartController', () => {
    let cartController: CartController;
    let mockUser: User;
    let mockCartDAO: jest.Mocked<CartDAO>;

    beforeAll(() => {
        mockCartDAO = new CartDAO() as jest.Mocked<CartDAO>;
        cartController = new CartController();
        cartController['dao'] = mockCartDAO; // Override the DAO instance with the mocked one
        mockUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addToCart', () => {
        test('should create a new cart if none exists and add product to it', async () => {
            mockCartDAO.addToCart.mockResolvedValue(true);

            const result = await cartController.addToCart(mockUser, 'product1');
            expect(result).toBe(true);
            expect(mockCartDAO.addToCart).toHaveBeenCalledWith(mockUser, 'product1');
        });

        test('should throw an error if the product do not exist', async () => {
            mockCartDAO.addToCart.mockRejectedValue(new ProductNotFoundError())

            await expect(cartController.addToCart(mockUser, "product1")).rejects.toThrow(new ProductNotFoundError());
        });

        test('should throw an error if the product is out of stock', async () => {
            mockCartDAO.addToCart.mockRejectedValue(new EmptyProductStockError())

            await expect(cartController.addToCart(mockUser, "product1")).rejects.toThrow(new EmptyProductStockError());
        });

        test('should throw an error if the product is out of stock', async () => {
            mockCartDAO.addToCart.mockRejectedValue(new Error("Database error"))

            await expect(cartController.addToCart(mockUser, "product1")).rejects.toThrow(new Error("Database error"));
        });
    });

    describe('getCart', () => {
        test('should return an empty cart if no cart exists', async () => {
            mockCartDAO.getCart.mockResolvedValue(new Cart(mockUser.username, false, "", 0, []));

            const result = await cartController.getCart(mockUser);
            expect(result).toEqual(new Cart(
                'testUser',
                false,
                "",
                0,
                []
            ));
        });

        test('should return a cart with products if a cart is found', async () => {
            const cart = new Cart(mockUser.username, false, "", 100, [new ProductInCart('model1', 2, Category.SMARTPHONE, 50)]);
            mockCartDAO.getCart.mockResolvedValue(cart);

            const result = await cartController.getCart(mockUser);
            expect(result).toEqual(new Cart(
                'testUser',
                false,
                "",
                100,
                [
                    new ProductInCart('model1', 2, Category.SMARTPHONE, 50)
                ]
            ));
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('checkoutCart', () => {
        test('should successfully checkout a cart', async () => {
            mockCartDAO.checkoutCart.mockResolvedValue(true);

            const result = await cartController.checkoutCart(mockUser);
            expect(result).toBe(true);
            expect(mockCartDAO.checkoutCart).toHaveBeenCalledWith(mockUser);
        });

        test('should throw an error if the cart is not found', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new CartNotFoundError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new CartNotFoundError());
        });

        test('should throw an error if the cart is empty', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new EmptyCartError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new EmptyCartError());
        });

        test('should throw an error if the product is low of stock', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new LowProductStockError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new LowProductStockError());
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('getCustomerCarts', () => {
        test('should return all paid carts for a customer', async () => {
            const cart = new Cart(mockUser.username, true, "", 100, [new ProductInCart('model1', 2, Category.SMARTPHONE, 50)]);
            mockCartDAO.getCustomerCarts.mockResolvedValue([cart]);

            const result = await cartController.getCustomerCarts(mockUser);
            expect(result).toEqual([new Cart(
                'testUser',
                true,
                "",
                100,
                [
                    new ProductInCart('model1', 2, Category.SMARTPHONE, 50)
                ]
            )]);
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('removeProductFromCart', () => {
        test('should remove a product from the cart', async () => {
            mockCartDAO.removeProductFromCart.mockResolvedValue(true);

            const result = await cartController.removeProductFromCart(mockUser, 'product1');
            expect(result).toBe(true);
            expect(mockCartDAO.removeProductFromCart).toHaveBeenCalledWith(mockUser, 'product1');
        });

        test('should throw an error if the product is not found', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new ProductNotFoundError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new ProductNotFoundError());
        });

        test('should throw an error if the cart is not found', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new CartNotFoundError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new CartNotFoundError());
        });

        test('should throw an error if the product is not in the cart', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new ProductNotInCartError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new ProductNotInCartError());
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('clearCart', () => {
        test('should clear the cart', async () => {
            mockCartDAO.clearCart.mockResolvedValue(true);

            const result = await cartController.clearCart(mockUser);
            expect(result).toBe(true);
            expect(mockCartDAO.clearCart).toHaveBeenCalledWith(mockUser);
        });

        test('should throw an error if the cart is not found', async () => {
            mockCartDAO.checkoutCart.mockRejectedValue(new CartNotFoundError());

            await expect(cartController.checkoutCart(mockUser)).rejects.toThrow(new CartNotFoundError());
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('deleteAllCarts', () => {
        test('should delete all carts', async () => {
            mockCartDAO.deleteAllCarts.mockResolvedValue(true);

            const result = await cartController.deleteAllCarts();
            expect(result).toBe(true);
            expect(mockCartDAO.deleteAllCarts).toHaveBeenCalled();
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getCart.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getCart(mockUser)).rejects.toThrow("Database error");
        });
    });

    describe('getAllCarts', () => {
        test('should return a list of all carts', async () => {
            const cart = new Cart(mockUser.username, false, "", 100, [new ProductInCart('model1', 2, Category.SMARTPHONE, 50)]);
            mockCartDAO.getAllCarts.mockResolvedValue([cart]);

            const result = await cartController.getAllCarts();
            expect(result).toEqual([new Cart(
                'testUser',
                false,
                "",
                100,
                [
                    new ProductInCart('model1', 2, Category.SMARTPHONE, 50)
                ]
            )]);
        });

        test('should return an empty array if no carts are found', async () => {
            mockCartDAO.getAllCarts.mockResolvedValue([]);

            const result = await cartController.getAllCarts();
            expect(result).toEqual([]);
        });

        test('should throw an error if the database query fails', async () => {
            mockCartDAO.getAllCarts.mockRejectedValue(new Error("Database error"));

            await expect(cartController.getAllCarts()).rejects.toThrow("Database error");
        });
    });
});
