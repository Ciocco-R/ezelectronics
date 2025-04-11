import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user";
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductReview } from "../../src/components/review";
import { error } from "console"


jest.mock("../../src/db/db.ts")

describe("addReview", () => {
    
    test("It should return 404 if the product does not exist in the database", async () => {
        const reviewDAO = new ReviewDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")

        const mockDBGetProduct = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes('product WHERE model')) {
                callback(null, null); // No product found
            }

            //callback(null, new Error('Product Not Found'))
            return {} as Database
        })

        await expect(reviewDAO.addReview("NonExistingProduct", loggedInUser, 5, "The smartphone works well")).rejects.toThrow(new ProductNotFoundError())
        mockDBGetProduct.mockRestore()
    });


    test("It should return 409 if there is already a review by the customer", async () => {
        const reviewDAO = new ReviewDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
        const product = { model: 'product1', quantity: 2, category: 'category1', sellingPrice: 200 }

        const mockDBGetReview = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, new Error('Existing review'));
            return {} as Database
        })

        await expect(reviewDAO.addReview(product.model, loggedInUser, 5, "The smartphone works well")).rejects.toThrow(new ExistingReviewError())
        mockDBGetReview.mockRestore()
    });


    test("It should resolve void when a review is successfully added", async () => { 
        const reviewDAO = new ReviewDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if(sql.includes("product WHERE model = ?")) {
                callback(null, { model: 'iPhone13' });
            } else if (sql.includes("product_review WHERE model = ? AND username = ?")) {
                callback(null, null);
            }
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        })

        const result = await reviewDAO.addReview('iPhone13', loggedInUser, 5, "The smartphone works well")
        expect(result).toBe(undefined);

        mockDBRun.mockRestore()
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const reviewDAO = new ReviewDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });


        await expect(reviewDAO.addReview('iPhone13', loggedInUser, 5, "The smartphone works well")).rejects.toThrow(new Error());

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });    

    test("DB crashed", async () => {
        const reviewDAO = new ReviewDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });

        try{
         await reviewDAO.addReview('iPhone13', loggedInUser, 5, "The smartphone works well")
        } 
        catch (error) {
            expect(error.message).toBe("DB crashed")
        }finally {
            mockDBRun.mockRestore()
        }
        
    });

    test("DB Error", async () => {
        const reviewDAO = new ReviewDAO()
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await reviewDAO.addReview('iPhone13', loggedInUser, 5, "The smartphone works well")
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });



});


describe ("getProductReviews", () => {

    test("It should return 404 if the product does not exist in the database", async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'

        const mockDBGetProduct = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('product WHERE model')) {
                callback(null, null); // No product found
            }

            return {} as Database
        })

        await expect(reviewDAO.getProductReviews(model)).rejects.toThrow(new ProductNotFoundError())
        mockDBGetProduct.mockRestore()

    }); 


    test("It should return an array of reviews made for a specific product", async () => {
        const reviewDAO = new ReviewDAO();
        const model = 'iPhone11';

        const mockDBGetProduct = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, [{ id:1, model: 'iPhone11' }]);
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, 
                [{ model: 'iPhone11',
                    user: 'Riccardo Monti',
                    score: 5,
                    date: '2024-05-02',
                    comment: 'It works well, the camera is great'
                    }   
                ])
            return {} as Database
        })

        const result = await reviewDAO.getProductReviews(model)
        expect(result).toEqual([
            new ProductReview('iPhone11', 'Riccardo Monti', 5, '2024-05-02', 'It works well, the camera is great')
        ])

        mockDBGetProduct.mockRestore()
        mockDBRun.mockRestore()
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const reviewDAO = new ReviewDAO();
        const model = 'iPhone11'

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        await expect(reviewDAO.getProductReviews(model)).rejects.toThrow(new Error());

        mockDBGet.mockRestore();
    });    

    test("DB crashed", async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'

        const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });

        try{
         await reviewDAO.getProductReviews(model)
        } 
        catch (error) {
            expect(error.message).toBe("DB crashed")
        }finally {
            mockDBRun.mockRestore()
        }
        
    });

    test("DB Error", async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await reviewDAO.getProductReviews(model)
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });




});


describe ("deleteReview", () => {

        test('It should return 404 if the product does not exist in the database', async () => {
            const reviewDAO = new ReviewDAO()
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
            const model = 'iPhone11'

            const mockDBGetProduct = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                if (sql.includes('product WHERE model')) {
                    callback(null, null); // No product found
                }
    
                return {} as Database
            })

            await expect(reviewDAO.deleteReview(model, loggedInUser)).rejects.toThrow(new ProductNotFoundError())
            mockDBGetProduct.mockRestore()

        }); 

        test('It should return 404 if the product has not been reviewed by the user', async () => {
            const reviewDAO = new ReviewDAO()
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
            const model = 'iPhone11'

            const mockDBGetReview = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                if(sql.includes('product WHERE model')) {
                    callback(null, { id:1, model: 'iPhone11' });
                } else if (sql.includes('product_review')) {
                    callback(null, null); // No review found
                }
            
                return {} as Database;
            })

            await expect(reviewDAO.deleteReview(model, loggedInUser)).rejects.toThrow(new NoReviewProductError())
            mockDBGetReview.mockRestore()

        })

        test('It should resolve void when a review made by the current user for a specific product is successfully deleted', async () => {
            const reviewDAO = new ReviewDAO()
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "")
            const model = 'iPhone11'

            const mockDBGetReview = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, { id:1, model: 'iPhone11', user: 'testUser' })
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })

            const result = await reviewDAO.deleteReview(model, loggedInUser)
            expect(result).toBe(undefined);

            mockDBGetReview.mockRestore()
            mockDBRun.mockRestore()
        });


        test("It should reject with an error if there is an error in the database query", async () => {
            const reviewDAO = new ReviewDAO();
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
            const model = 'Iphone 11';
    
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(), null);
                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(), null);
                return {} as Database;
            });

    
            await expect(reviewDAO.deleteReview(model, loggedInUser)).rejects.toThrow(new Error());
    
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });  
        
        test("DB crashed", async () => {
            const reviewDAO = new ReviewDAO()
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
            const model = 'iPhone11'
            
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("product WHERE model = ?")) {
                    callback(null, { model: 'iPhone11' });
                } else if (sql.includes("product_review WHERE model = ? AND username = ?")) {
                    callback(null, { model: 'iPhone11', username: 'testUser' });
                }
                return {} as Database;
            });


            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error("DB crashed");
                return {} as Database;
            });
    
            try{
             await reviewDAO.deleteReview(model, loggedInUser)
            } 
            catch (error) {
                expect(error.message).toBe("DB crashed")
            }finally {
                mockDBRun.mockRestore()
                mockDBGet.mockRestore()
            }
            
        });

        test("DB Error", async () => {
            const reviewDAO = new ReviewDAO()
            const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
            const model = 'iPhone11'
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("DB error")
            });
            try{
                await reviewDAO.deleteReview(model, loggedInUser)
            } catch (error) {
                expect(error.message).toBe("DB error")
            } finally {
                mockDBGet.mockRestore()
            }
        });
    
    

});


describe("deleteReviewsOfProduct", () => {   

    test("It should return 404 if the product does not exist in the database", async () => { 
        const reviewDAO = new ReviewDAO();
        const model = "iPhone11";

        const mockDBGetProduct = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            
            if (sql.includes('product WHERE model')) { 
                callback(null, null); // No product found
            }

            return {} as Database;
        });

        await expect(reviewDAO.deleteReviewsOfProduct(model)).rejects.toThrow(new ProductNotFoundError());
        mockDBGetProduct.mockRestore();

    }); 

    test('It should resolve void when all reviews of a specific product are successfully deleted', async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'

        const mockDBGetProduct = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, { id:1, model: 'iPhone11' })
            return {} as Database
        })

        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        const result = await reviewDAO.deleteReviewsOfProduct(model)
        expect(result).toBe(undefined);

        mockDBGetProduct.mockRestore()
        mockDBRun.mockRestore()

    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const reviewDAO = new ReviewDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
        const model = "Iphone 11"

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });


        await expect(reviewDAO.deleteReviewsOfProduct(model)).rejects.toThrow(new Error());

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });    

    test("DB crashed", async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'

        const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });

        try{
         await reviewDAO.deleteReviewsOfProduct(model)
        } 
        catch (error) {
            expect(error.message).toBe("DB crashed")
        }finally {
            mockDBRun.mockRestore()
        }
        
    });

    test("DB Error", async () => {
        const reviewDAO = new ReviewDAO()
        const model = 'iPhone11'
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await reviewDAO.deleteReviewsOfProduct(model)
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });



});


describe("deleteAllReviews", () => {    

    test('It should resolve void when all reviews are successfully deleted', async () => {
        const reviewDAO = new ReviewDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null); 
            return {} as Database;
        });

        const result = await reviewDAO.deleteAllReviews();
        expect(result).toBe(undefined);

        mockDBRun.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const reviewDAO = new ReviewDAO();
        const loggedInUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });


        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow(new Error());

        mockDBRun.mockRestore();
    });    

    test("DB crashed", async () => {
        const reviewDAO = new ReviewDAO()

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB crashed")
        });

        try{
         await reviewDAO.deleteAllReviews()
        } 
        catch (error) {
            expect(error.message).toBe("DB crashed")
        }finally {
            mockDBRun.mockRestore()
        }
        
    });

    test("DB Error", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await reviewDAO.deleteAllReviews()
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
        }
    });



});


 