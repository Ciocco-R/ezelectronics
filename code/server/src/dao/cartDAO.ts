
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
import db from "../db/db";
import {Product} from "../components/product";
import {Cart, ProductInCart} from "../components/cart";
import {User} from "../components/user"
import dayjs from "dayjs";
import{CartNotFoundError, EmptyCartError, ProductNotInCartError, WrongUserCartError} from "../errors/cartError";
import {ProductNotFoundError, EmptyProductStockError, LowProductStockError} from "../errors/productError"
import { resolve } from "path";
import { rejects } from "assert";


class CartDAO {
    /**
     * Retrieves the current cart of the logged in user.
     * The total cost of the cart needs to be equal to the total cost of its products, considering the quantity of each product.
     * There can be at most one unpaid cart per customer in the database at any moment.
     * Can only be called by a logged in user whose role is Customer.
     * Returns an empty Cart object if there is no information about an unpaid cart in the database, or if there is an unpaid cart with no products.
     */
    
    async getCart(loggedInUser:User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const cartQuery = "SELECT cp.model, p.sellingPrice, p.category, cp.quantity FROM cart_product cp JOIN product p ON cp.model = p.model WHERE cp.cartId = ?";
                //const loggedInUser = getCurrentUser(); 
                const user = "SELECT * FROM cart WHERE username = ? AND paid = False";
                db.get(user, [loggedInUser.username], (err: Error | null, cart: any) => {
                    if (err) {
                        reject(err);
                    } 
                    if (!cart) {
                        resolve({ customer: loggedInUser.username, paid: false, paymentDate: null, total: 0, products: [] });
                    } else {
                        db.all(cartQuery, [cart.cartId], (err: Error | null, rows: any[]) => {
                            if (err) {
                                reject(err);
                            } else {
                                const products = rows.map((r) => new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice)); 
                                resolve(new Cart(loggedInUser.username, false, null, cart.total, products));
                    }});
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async addToCart(loggedInUser: User, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const p = "SELECT * FROM product WHERE model = ?";
                db.get(p, [model], (err: Error | null, product: any) => {
                    if(err){
                        reject(err)
                    }
                    if (!product) {
                        return reject(new ProductNotFoundError());
                        
                    }
                    if (product.quantity <= 0) {
                        return reject(new EmptyProductStockError());
                    }
                    
                    const cartQuery = "SELECT * FROM cart WHERE username = ? AND paid = false";
                    db.get(cartQuery, [loggedInUser.username], (err: Error | null, cart: any) => {
                        if (err) {
                            return reject(err);
                        }
                        
                        
                        if (!cart) {   
                            const insertCartQuery = "INSERT INTO cart (paid, paymentDate,  username) VALUES (?, ?,  ?)";
                            db.run(insertCartQuery, [false, null, loggedInUser.username], function(err: Error | null) {
                                if (err) {
                                     reject(err);
                                     return
                                }
                                
                                db.run("INSERT INTO cart_product (model, cartId, quantity, category, price) VALUES (?, ?, ?, ?, ?)", [product.model, this.lastID, 1, product.category, product.sellingPrice], (err: Error | null) => {
                                    if (err) return reject(err);
                                    db.run("UPDATE cart SET total = ? WHERE cartId = ?", [product.sellingPrice, this.lastID], (err: Error | null) => {
                                        if (err) return reject(err);
                                        resolve(true);
                                    });
                                    
                                });  
                            }); 
                        } else {
                            const cartProductQuery = "SELECT cartId, model FROM cart_product WHERE cartId = ? AND model = ?";
                            db.get(cartProductQuery, [cart.cartId, model], (err: Error | null, cp: any) => {
                                if (err) {
                                    return reject(err);
                                }
                                console.log(cp)
                                if (cp) {
                                    db.run("UPDATE cart_product SET quantity = quantity + 1 WHERE model = ? AND cartId = ?", [model, cart.cartId], (err: Error | null) => {
                                        if (err) return reject(err);
                                        
                                        
                                        db.run("UPDATE cart SET total = total + ? WHERE cartId = ?", [product.sellingPrice, cart.cartId], (err: Error | null) => {
                                            if (err) return reject(err);
                                            resolve(true);
                                        });
                                        
                                    });
                                } else {
                                    db.run("INSERT INTO cart_product (model, cartId, quantity, category, price) VALUES (?, ?, ?, ?, ?)", [product.model, cart.cartId, 1, product.category, product.sellingPrice], (err: Error | null) => {
                                        if (err) return reject(err);
                                        db.run("UPDATE cart SET total = total + ? WHERE cartId = ?", [product.sellingPrice, cart.cartId], (err: Error | null) => {
                                            if (err) return reject(err);
                                            resolve(true);
                                        });
                                        
                                    });
                                }
                            });
                            
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    
    
    async checkoutCart(loggedInUser:User): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                //const loggedInUser = getCurrentUser();
                db.get("SELECT * FROM cart WHERE username = ? AND paid = false", [loggedInUser.username], (err: Error | null, cart: any) => {
                    if (err) {
                        reject(err);
                        return
                    } else if (!cart) {
                        reject(new CartNotFoundError());
                        return 
                    } else {
                        const cartQuery = "SELECT cp.model, p.quantity AS availableQuantity, cp.quantity FROM cart_product cp JOIN product p ON cp.model = p.model WHERE cp.cartId = ?";
                        db.all(cartQuery, [cart.cartId], (err: Error | null, rows: any[]) => {
                            if (err) {
                                reject(err);
                                return
                            } else if (rows.length === 0) {
                                reject(new EmptyCartError());
                                return
                            } else {
                                const updatePromises: Promise<void>[] = [];
                                for (const row of rows) {
                                    if (row.quantity > row.availableQuantity) {
                                        reject(new LowProductStockError());
                                        return;
                                    }
                                    const updatePromise = new Promise<void>((resolve, reject) => {
                                        db.run("UPDATE product SET quantity = quantity - ? WHERE model = ?", [row.quantity, row.model], (err: Error | null) => {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                resolve();
                                            }
                                        });
                                    });

                                    updatePromises.push(updatePromise);
                                }
                                Promise.all(updatePromises)
                                    .then(() => {
                                            
                                            const currentDate = dayjs().format("YYYY-MM-DD");
                                            db.run(
                                                "UPDATE cart SET paid = true, paymentDate = ? WHERE cartId = ?",
                                                [currentDate, cart.cartId],
                                                (err: Error | null) => (err ? reject(err) : resolve(true))
                                            );
                                    
                                })
                                    .catch((err) => {
                                        reject(err);
                                    });
                            }
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    async getCustomerCarts(loggedInUser: User): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const cartQuery = "SELECT cp.model, p.sellingPrice, p.category, cp.quantity FROM cart_product cp JOIN product p ON cp.model = p.model WHERE cp.cartId = ?";
                db.all("SELECT * FROM cart WHERE username = ? AND paid = true", [loggedInUser.username], (err: Error | null, carts: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        const cartPromises: Promise<Cart>[] = carts.map(cart => {
                            return new Promise<Cart>((resolve, reject) => {
                                db.all(cartQuery, [cart.cartId], (err: Error | null, rows: any[]) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const products = rows.map((r) => new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));
                                        resolve(new Cart(loggedInUser.username, true, cart.paymentDate, cart.total, products));
                                    }
                                });
                            });
                        });
                        Promise.all(cartPromises)
                            .then(resolve)
                            .catch(reject);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    


async removeProductFromCart(loggedInUser:User, model: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        try {
            const productQuery = "SELECT * FROM product WHERE model = ?";
            db.get(productQuery, [model], (err: Error | null, product: any) => {
                if (err) {
                    reject(err);
                } else if (!product) {
                    reject(new ProductNotFoundError());
                } else {
                    const cartQuery = "SELECT * FROM cart WHERE username = ? AND paid = false";
                    db.get(cartQuery, [loggedInUser.username], (err: Error | null, cart: any) => {
                        if (err) {
                            reject(err);
                        }
                        if (!cart) {
                            reject(new CartNotFoundError()); 
                        } else {
                            const cartProductQuery = "SELECT * FROM cart_product WHERE cartId = ? AND model = ?";
                            db.get(cartProductQuery, [cart.cartId, model], (err: Error | null, cartProduct: any) => {
                                if (err) {
                                    reject(err);
                                } else if (!cartProduct) {
                                    reject(new ProductNotInCartError());
                                } else {
                                    db.get("SELECT quantity FROM cart_product WHERE cartId = ?", [cart.cartId],(err: Error | null, quant: any)=>{
                                        if(err){
                                            reject(err)
                                        }
                                        if(quant.quantity> 1){
                                            db.run("UPDATE cart_product SET quantity = quantity - 1 WHERE cartId = ? AND model = ?", [cart.cartId, model], (err: Error | null) => {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    db.get("SELECT sellingPrice FROM product WHERE model = ?", [model], (err: Error | null, product: any) => {
                                                        if (err) {
                                                            reject(err);
                                                        } else {
                                                            db.run("UPDATE cart SET total = total - ? WHERE cartId = ?", [product.sellingPrice, cart.cartId], (err: Error | null) => {   
                                                                if (err) {
                                                                    reject(err);
                                                                } else {
                                                                    resolve(true);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        else{
                                            db.run("DELETE FROM cart_product WHERE cartId = ? AND model = ?", [cart.cartId, model], (err: Error | null) => {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    db.run("DELETE FROM cart WHERE cartId = ?", [cart.cartId], (err: Error | null) => {
                                                        if (err) {
                                                            reject(err);
                                                        }
                                                        resolve(true);
                                                    });
                                                }
                                            });
                                        }
                                    } )
                                    
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
}

async clearCart(loggedInUser:User): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        try {
            const cartQuery = "SELECT * FROM cart WHERE username = ? AND paid = false";
            db.get(cartQuery, [loggedInUser.username], (err: Error | null, cart: any) => {
                if (err) {
                    reject(err);
                } else if (!cart) {
                    reject(new CartNotFoundError());
                } else {
                    db.run("UPDATE cart SET total = 0 WHERE cartId = ?", [cart.cartId], (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            db.run("DELETE FROM cart_product WHERE cartId = ?", [cart.cartId], (err: Error | null) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(true);
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
}

async deleteAllCarts(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        try {
            
            db.run("DELETE FROM cart", [], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}
async getAllCarts(): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
        try {
            const cartQuery = "SELECT cp.model, p.sellingPrice, p.category, cp.quantity FROM cart_product cp JOIN product p ON cp.model = p.model WHERE cp.cartId = ?";
            db.all("SELECT * FROM cart", [], (err: Error | null, carts: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    const cartPromises: Promise<Cart>[] = carts.map(cart => {
                        return new Promise<Cart>((resolve, reject) => {
                            db.all(cartQuery, [cart.cartId], (err: Error | null, rows: any[]) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    const products = rows.map((r) => new ProductInCart(r.model, r.quantity, r.category, r.sellingPrice));
                                    if(cart.paid ==1)
                                        resolve(new Cart(cart.username, true, cart.paymentDate, cart.total, products));
                                    if(cart.paid ==0)
                                        resolve(new Cart(cart.username, false, cart.paymentDate, cart.total, products));
                                }
                            });
                        });
                    });
                    Promise.all(cartPromises)
                        .then(resolve)
                        .catch(reject);
                }
            });
        } catch (error) {
            reject(error);
        }
        
    });
}
}

export default CartDAO