import { test, expect, jest, beforeAll, afterEach, afterAll , describe} from "@jest/globals"
import request from 'supertest';
import { app } from "../../index"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"
import ReviewController from "../../src/controllers/reviewController"
import {cleanup} from "../../src/db/cleanup" 
import { Role } from "../../src/components/user";
const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")


jest.mock('../../src/controllers/reviewController');
const customer = { username: "customer", name: "customer", surname: "customer", password: "1234", role: "Customer" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "1234", role: "Manager" }

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
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

afterAll(()=>{
    cleanup();
});
  

describe('POST /ezelectronics/reviews/model', () => {

    test('It should return a 200 success code if a review to a product id added', async () => { 
        const userTest = {
            username: "customer",
            password: "1234"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isInt: () => ({ isLength: () => ({}) }),
            })),
        }))
        
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            next();
          });
        
          jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            req.user = userTest;
            next();
          });

        jest.spyOn(ReviewController.prototype, 'addReview').mockResolvedValueOnce(undefined);
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next();
        });
        const response = await request(app).post(baseURL + '/reviews/iPhone11').send({score: 5,
            comment: 'Great product!'});

    
        expect(response.status).toBe(200); 
        expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1);
    });

    test("It should resolve a 503 if the database is down", async () => {
        const user = {
          username: "customer",
          password: "1234",
      };

      const cookie = await login(user);
      jest.spyOn(ReviewController.prototype, 'addReview').mockRejectedValueOnce(new Error("Internal Server Error"));
      const response = await request(app).post(baseURL + "/reviews/iPhone11").set('Cookie', cookie).send({
        model: "iPhone11", 
        user: 'customer',
        comment: "This is a test comment",
        score: 4
      });
      expect(response.status).toBe(503);
      expect(response.body.error).toEqual("Internal Server Error");
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('Should return a 401 error if the user is authenticated but not a Customer', async () => {

        jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a Customer" });
        })

        const response = (await request(app).post(baseURL + "/reviews/iPhone11").send({
            model: "iPhone11", 
            user: 'customer',
            comment: "This is a test comment",
            score: 4

        }));

        expect(response.status).toBe(401)
    });

    test('Should return a 401 error if the user is not authenticated.', async () => {
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in" });
        })

        const response = (await request(app).post(baseURL + "/reviews/iPhone11").send({          
            model: "iPhone11", 
            user: 'customer',
            comment: "This is a test comment",
            score: 4
        }));


        expect(response.status).toBe(401)
    });

    test("It should return a 422 error if the model parameter is an empty string", async () => {

        const response = await request(app).post(baseURL + "/reviews/").send({
            model: "", 
            user: 'customer',
            comment: "This is a test comment",
            score: 4
          });
      
        expect(response.status).toBe(422);
        expect(response.body.error).toEqual("Model cannot be empty");
      });

    test("It should return a 400 error if the score parameter is not an integer between 1 and 5", async () => {

        try{
        await request(app).post(baseURL + "/reviews/iPhone11").send({
            model: "iPhone11", 
            user: 'customer',
            comment: "This is a test comment",
            score: 6
        });
    }catch(error){
        expect(error.status).toBe(400);
        expect(error.body.error).toEqual("Score must be an integer between 1 and 5");
    }
    });  

    test('It should return a 400 error if the comment parameter is an empty string', async () => {
        const currentDate = new Date().toISOString();

        try {
        await request(app).post(baseURL + "/reviews/iPhone11").send({
            model: "iPhone11", 
            user: 'customer',
            date: currentDate,
            comment: "",
            score: 4
          });
        } catch (error) {
        expect(error.status).toBe(400);
        expect(error.body.error).toBe('Comment cannot be empty');
        }
    });

});

describe('GET ezelectronics/reviews/model', () => {

    test('It should return a 200 success code for retrieving all reviews of a product', async () => {
        const userTest = {
            username: "customer",
            password: "1234"
        }
        const cookie = await login(userTest)

        const model = 'iPhone11';
        const currentDate = new Date().toISOString();

        const reviewTest = {
            model: 'iPhone11',
            user: 'test',
            score: 5,
            date: currentDate,
            comment: 'Great product!'
        };

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            req.user = userTest;
            next();
        });


       jest.spyOn(ReviewController.prototype, 'getProductReviews').mockResolvedValueOnce([reviewTest]);
        const response = await request(app).get(baseURL + '/reviews/iPhone11').set('Cookie', cookie).send('iPhone11');
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual([reviewTest])
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1);
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model);

    });

    test('Should return a 401 error if the user is not authenticated.', async () => {
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in" });
        })

        const response = (await request(app).get(baseURL + "/reviews/iPhone11").send('iPhone11'));

        expect(response.status).toBe(401)
    });

    test("It should return a 422 error if the model parameter is an empty string", async () => {

        const response = await request(app).get(baseURL + "/reviews/").send("");
      
        expect(response.status).toBe(422);
        expect(response.body.error).toEqual("Model cannot be empty");
      });

    test("It should resolve a 503 if the database is down", async () => { 
        const user = {
          username: "customer",
          password: "1234",
      };

      const cookie = await login(user);

      jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
        req.user = user;
        next();
      });

      jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
        return next();
    });
      jest.spyOn(ReviewController.prototype, 'getProductReviews').mockRejectedValueOnce(new Error("Internal Server Error"));
      const response = await request(app).get(baseURL + "/reviews/iPhone11").set('Cookie', cookie).send('iPhone11');
      
      expect(response.status).toBe(503);
      expect(response.body.error).toEqual("Internal Server Error");
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });



});


describe('DELETE /ezelectronics/reviews/model', () => {

    test('It should return a 200 success code if the review made by a user of a product is deleted', async () => {
        const userTest= {
            username: "customer",
            password: "1234"
        }
        const cookie = await login(userTest)

        const testUser ={
            username: 'customer',
            name: 'test',
            surname: 'test',
            role: Role.CUSTOMER,
            address: 'test',
            birthdate: 'test'
        }; 

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })

        
        jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            next();
          });
        
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            req.user = testUser;
            next();
        });

    
        jest.spyOn(ReviewController.prototype, 'deleteReview').mockResolvedValueOnce(undefined);
        const response = await request(app).delete(baseURL + '/reviews/iPhone11').set('Cookie', cookie).send('iPhone11');

    
        expect(response.status).toBe(200);
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);        
    });

    test("It should resolve a 503 if the database is down", async () => {
        const user = {
          username: "customer",
          password: "1234",
      };

      const cookie = await login(user);
      jest.spyOn(ReviewController.prototype, 'deleteReview').mockRejectedValueOnce(new Error("Internal Server Error"));
      const response = await request(app).delete(baseURL + "/reviews/iPhone11").set('Cookie', cookie).send('iPhone11');
      expect(response.status).toBe(503);
      expect(response.body.error).toEqual("Internal Server Error");
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('Should return a 401 error if the user is authenticated but not a Customer', async () => {
  
        jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a Customer" });
        })

        const response = (await request(app).delete(baseURL + "/reviews/iPhone11").send('iPhone11'));

        expect(response.status).toBe(401)
    });

    test('Should return a 401 error if the user is not authenticated.', async () => {
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in" });
        })

        const response = (await request(app).delete(baseURL + "/reviews/iPhone11").send('iPhone11'));

        expect(response.status).toBe(401)
    });


});

describe('DELETE /ezelectronics/reviews/model/all', () => {

    test('It should return a 200 success code if all the reviews of a specific product are deleted', async () => {
        const userTest = {
            username: "manager",
            password: "1234"
        }
        const cookie = await login(userTest)

        const model = 'iPhone11';

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })


        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            next();
          });
        
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            req.user = userTest;
            next();
        });
    
        jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockResolvedValueOnce(undefined);
        const response = await request(app).delete(baseURL + '/reviews/iPhone11/all').set('Cookie', cookie).send(model);
    
        expect(response.status).toBe(200);
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
        
    });

    test("It should resolve a 503 if the database is down", async () => {
        const user = {
          username: "manager",
          password: "1234",
      };
      const model = 'iPhone11'

      const cookie = await login(user);
      jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockRejectedValueOnce(new Error("Internal Server Error"));
      const response = await request(app).delete(baseURL + "/reviews/iPhone11/all").set('Cookie', cookie).send(model); 
      expect(response.status).toBe(503);
      expect(response.body.error).toEqual("Internal Server Error");
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('Should return a 401 error if the user is not authenticated.', async () => {
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in" });
        })

        const response = (await request(app).delete(baseURL + "/reviews/iPhone11/all").send('iPhone11'));

        expect(response.status).toBe(401)
    });


    test('Should return a 401 error if the user is authenticated but not an Admin or a Manager.', async () => {
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an Admin or a Manager" });
        })

        const response = (await request(app).delete(baseURL + "/reviews/iPhone11/all").send('iPhone11'));

        expect(response.status).toBe(401)
    });

});

describe('DELETE /ezelectronics/reviews', () => {

    test('It should return a 200 success code if all the reviews of all products are deleted', async () => {
        const userTest = {
            username: "manager",
            password: "1234"
        }
        const cookie = await login(userTest)

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            next();
          });
        
          jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            req.user = userTest;
            next();
          });

    
        jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockResolvedValueOnce(undefined);
        const response = await request(app).delete(baseURL + '/reviews').set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();


    });

    test("It should resolve a 503 if the database is down", async () => {
        const user = {
          username: "manager",
          password: "1234",
      };

      const cookie = await login(user);
      jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockRejectedValueOnce(new Error("Internal Server Error"));
      const response = await request(app).delete(baseURL + "/reviews").set('Cookie', cookie);
    
      expect(response.status).toBe(503);
      expect(response.body.error).toEqual("Internal Server Error");
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('Should return a 401 error if the user is not authenticated.', async () => {
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in" });
        })

        const response = (await request(app).delete(baseURL + "/reviews").send());

        expect(response.status).toBe(401)
    });


    test('Should return a 401 error if the user is authenticated but not an Admin or a Manager.', async () => {
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an Admin or a Manager" });
        })

        const response = (await request(app).delete(baseURL + "/reviews").send());

        expect(response.status).toBe(401)
    });


});




