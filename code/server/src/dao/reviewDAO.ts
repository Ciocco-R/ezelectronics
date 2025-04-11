import db from "../db/db"
import { User } from "../components/user";
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const checkProductExistence = "SELECT * FROM product WHERE model = ?"
                db.get(checkProductExistence, [model], (err: Error | null, product: any) => {
                    if(err){
                        reject(err);
                        return
                    } else if(!product){
                        reject(new ProductNotFoundError);
                        return
                    } else {
                        // controllo se esiste già una recensione per il prodotto dato dall'utente dato
                        const checkExistingReview = "SELECT * FROM product_review WHERE model = ? AND username = ?"
                        db.get(checkExistingReview, [model, user.username], (err: Error | null, row: any) => {
                            if(err){
                                reject(err);
                                return
                            }
                            if(row) {
                                reject(new ExistingReviewError);
                                return
                            } else {
                                // se non esiste già, inserisco la recensione
                                const sql = "INSERT INTO product_review (model, username, score, date, comment) VALUES (?, ?, ?, CURRENT_DATE, ?)"
                                    db.run(sql, [model, user.username, score, comment], (err: Error | null) => {
                                    if(err) {
                                        reject(err);
                                        return;
                                    }
                                    else {
                                        resolve();
                                    }
                                })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                const checkProductExistence = "SELECT * FROM product WHERE model = ?"
                db.get(checkProductExistence, [model], (err: Error | null, product: any) => {
                    if(err){
                        reject(err);
                        return
                    } else if(!product){
                        reject(new ProductNotFoundError);
                        return
                    } else {
                        const sql = "SELECT * FROM product_review WHERE model = ?"
                        db.all(sql, [model], (err: Error | null, rows: any[]) => {
                            if(err) {
                                reject(err);
                                return
                            } else {
                                const reviews: ProductReview[] = []
                                for(const row of rows) {
                                    reviews.push(new ProductReview(row.model, row.username, row.score, row.date, row.comment));
                                }
                            resolve(reviews);
                            }
                        })
                    }
            })
            } catch(error) {
                reject(error)
            }
        })
    }

    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const checkProductExistence = "SELECT * FROM product WHERE model = ?"
                db.get(checkProductExistence, [model], (err: Error | null, product: any) => {
                    if (err) {
                        reject(err);
                        return;
                    } 
                    if (!product) {
                        reject(new ProductNotFoundError());
                        return;
                    } else {
                        // controllo prima se il prodotto è stato recensito dall'utente 
                        const checkExistingReview = "SELECT model, username FROM product_review WHERE model = ? AND username = ?"
                        db.get(checkExistingReview, [model, user.username], (err: Error | null, row: any) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!row) {
                                reject(new NoReviewProductError());
                                return;
                            } else {
        
                                // Se la recensione esiste, la elimino
                                const sql = "DELETE FROM product_review WHERE model = ? AND username = ?"
                                db.run(sql, [model, user.username], (err: Error | null) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    } else {
                                        resolve();
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    };
    

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const checkProductExistence = "SELECT * FROM product WHERE model = ?"
                db.get(checkProductExistence, [model], (err: Error | null, product: any) => {
                    if(err){
                        reject(err);
                        return
                    } else if(!product){
                        reject(new ProductNotFoundError);
                        return
                    } else {
                        const sql = "DELETE FROM product_review WHERE model = ?"
                        db.run(sql, [model], (err: Error | null) => {
                            if(err) {
                                reject(err);
                                return
                            } else {
                                resolve();
                            }
                        })
                    }
                })
            } catch(error) {
                reject(error)
            }
        })
    }

    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const sql = "DELETE FROM product_review"
                db.run(sql, (err: Error | null) => {
                    if(err) {
                        reject(err);
                        return
                    } else {
                        resolve();
                    }
                })
            } catch(error) {
                reject(error)
            }
        })
    }

}

export default ReviewDAO;