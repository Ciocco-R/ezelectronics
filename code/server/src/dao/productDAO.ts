import db from "../db/db";
import { Product } from "../components/product";
import { DateAfterError, DateBeforeError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../errors/productError";
import dayjs from "dayjs";
import { resolve } from "path";
import { rejects } from "assert";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Registers the arrival of a set of products that have the same model. 
     * It can only be used to register the first arrival of a new model.
     * @param model Model of the products
     * @param category Category of the products can only be one of ("Smartphone", "Laptop", "Appliance")
     * @param quantity Represents the instances of the product that have arrived
     * @param details Represent the details of the products
     * @param sellingPrice Represents the price at which a single instance of the product is sold to customers
     * @param arrivalDate If present, it must be in the format YYYY-MM-DD. If absent, then the current date is used as the arrival date for the product, in the same format.
     * @returns A void promise.
     */
    async registerNewProductsSet(model : string, category : string, quantity : number, details : string, sellingPrice : number, arrivalDate : string) : Promise<void>{
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "INSERT INTO product(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)"
                
                if(dayjs(arrivalDate) > dayjs()) return reject(new DateAfterError)
                
                db.run(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: product.model")) reject(new ProductAlreadyExistsError)
                        return reject(err)
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    async increaseProductQuantity(model : string, quantity : number, changeDate : string) : Promise<number>{
        return new Promise<number>((resolve, reject) => {
            try {
                console.log(model)
                if(dayjs(changeDate) > dayjs()) return reject(new DateAfterError)

                const sqlSelect = "SELECT * FROM product WHERE model = ?"
                db.get(sqlSelect, [model], (err:Error | null, row: any) => {
                    if(!row) 
                        return reject(new ProductNotFoundError);
                    if(dayjs(changeDate) < dayjs(row.arrivalDate)){
                        return reject(new DateBeforeError);
                    } else {
                        const sqlUpdate = "UPDATE product SET quantity = quantity + ? WHERE model = ?"
                        db.run(sqlUpdate, [quantity, model], function(err: Error | null, row: any) {
                            if (err) {
                                return reject(err)
                            } else {
                                const sqlQuantity = "SELECT quantity FROM product WHERE model = ?"
                                db.get(sqlQuantity, [model], (err:Error | null, row: any) => {
                                    if (err) {
                                        return reject(err)
                                    }
                                    resolve(row.quantity)
                                })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    async decreaseProductQuantity(model : string, quantity : number, changeDate : string) : Promise<number>{
        return new Promise<number>((resolve, reject) => {
            try {
                if(dayjs(changeDate) > dayjs()) return reject(new DateAfterError)

                const sqlSelect = "SELECT * FROM product WHERE model = ?"
                db.get(sqlSelect, [model], (err:Error | null, row: any) => {
                    if(!row) 
                        return reject(new ProductNotFoundError);
                    if(dayjs(changeDate) < dayjs(row.arrivalDate)){
                        return reject(new DateBeforeError);
                    } 
                    
                    if(row.quantity<quantity){
                        reject(new LowProductStockError)
                    } else {
                        const sql = "UPDATE product SET quantity = quantity - ? WHERE model = ?"
                        db.run(sql, [quantity, model], function (err: Error | null) {
                            if (err) {
                                return reject(err)
                            } else {
                                const sqlQuantity = "SELECT quantity FROM product WHERE model = ?"
                                db.get(sqlQuantity, [model], (err:Error | null, row: any) => {
                                    if (err) {
                                        return reject(err)
                                    }
                                resolve(row.quantity)
                                })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    async getProducts() : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product"
                db.all(sql, [], (err:Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    }
                    const products : Product[] = []
                    for (const row of rows){
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    }
                    resolve(products)
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async getProductsByModel(model : string) : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try{
                const sql = "SELECT * FROM product WHERE model = ?"
                db.all(sql, [model], (err:Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    }
                    if (!rows || rows.length === 0){
                        return reject(new ProductNotFoundError)
                    }  else {
                        const products : Product[] = []
                        for (const row of rows){
                            products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                        }
                        resolve(products)
                    }
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async getProductsByCategory(category : string) : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try{
                const sql = "SELECT * FROM product WHERE category = ?"
                db.all(sql, [category], (err:Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    }
                    const products : Product[] = []
                    for (const row of rows){
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    }
                    resolve(products)
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async getAvailableProducts() : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE quantity > 0"
                db.all(sql, [], (err:Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    }
                    const products : Product[] = []
                    for (const row of rows){
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    }
                    resolve(products)
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async getAvailableProductsByModel(model : string) : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try{
                db.all("SELECT * FROM product WHERE model = ?", [model], (err:Error | null, rows: any[]) => {
                    if(!rows || rows.length === 0){
                        reject(new ProductNotFoundError)
                    }

                    const sql = "SELECT * FROM product WHERE model = ? AND quantity > 0"
                    db.all(sql, [model], (err:Error | null, rows: any[]) => {
                        if (err) {
                            return reject(err)
                        }

                        const products : Product[] = []
                        if (!rows || rows.length === 0){
                            return resolve(products)
                        }

                        for (const row of rows){
                            products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                        }
                        resolve(products)
                    })
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async getAvailableProductsByCategory(category : string) : Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject) => {
            try{
                const sql = "SELECT * FROM product WHERE category = ? AND quantity > 0"
                db.all(sql, [category], (err:Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    }
                    const products : Product[] = []
                    for (const row of rows){
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    }
                    resolve(products)
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async deleteProductByModel(model : string) : Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            try{
                const sql = "DELETE FROM product WHERE model = ?"
                db.run(sql, [model], function (err:Error | null) {
                    if (err) {
                        return reject(err)
                    }

                    if(this.changes === 0){
                        return reject(new ProductNotFoundError)
                    }
                    resolve(true)
                })
            }catch(error){
                reject(error)
            }
        })
    }

    async deleteAllProducts() : Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            try{
                const sql = "DELETE FROM product"
                db.run(sql, [], (err:Error | null) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(true)
                })
            }catch(error){
                reject(error)
            }
        })
    }
}

export default ProductDAO