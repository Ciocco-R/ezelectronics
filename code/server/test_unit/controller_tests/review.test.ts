import { test, expect, jest } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { User, Role } from "../../src/components/user";
import { ProductReview } from "../../src/components/review";

jest.mock("../../src/dao/reviewDAO")


test("addReview should return void", async () => {
    const testReview = {
        model: "Iphone 11",
        user: "testUser",
        score: 5,
        comment: "Nice, works well"
    }

    const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

    jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce(undefined);
    const controller = new ReviewController(); 

    const response = await controller.addReview(testReview.model, loggedInUser, testReview.score, testReview.comment);

    expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model,
        loggedInUser,
        testReview.score,
        testReview.comment);
    expect(response).toBe(undefined); 
});


test("getProductReviews should return all reviews for a product", async () => {
    const model = "Iphone 11";
    const currentDate = new Date().toISOString();
    const testReview = new ProductReview("Iphone 11", "testUser", 5, currentDate, "Nice, works well");

    jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce([testReview]);
    jest.spyOn(Date, 'now').mockImplementation(() => new Date(currentDate).getTime());
    const controller = new ReviewController(); 

    const response = await controller.getProductReviews(model);

    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(model);
    expect(response).toEqual([new ProductReview("Iphone 11", "testUser", 5, currentDate, "Nice, works well")]);
});

test("deleteReview should return void", async () => {
    const model = "Iphone 11";
    const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

    jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(undefined);
    const controller = new ReviewController(); 

    const response = await controller.deleteReview(model, loggedInUser);

    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, loggedInUser);
    expect(response).toBe(undefined); 

});

test("deleteReviewsOfProduct should return void", async () => {
    const model = "Iphone 11";

    jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined);
    const controller = new ReviewController(); 

    const response = await controller.deleteReviewsOfProduct(model);

    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model);
    expect(response).toBe(undefined); 

});

test("deleteAllReviews should return void", async () => {

    jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined);
    const controller = new ReviewController(); 

    const response = await controller.deleteAllReviews();

    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
    expect(response).toBe(undefined); 

});

        
