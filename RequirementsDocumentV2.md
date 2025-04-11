# Requirements Document - current EZElectronics

Date:

Version: V1 - description of EZElectronics in CURRENT form (as received by teachers)

| Version number | Change |
| :------------: | :----: |
|        2        |        |

# Contents

- [Requirements Document - current EZElectronics](#requirements-document---current-ezelectronics)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non Functional Requirements](#non-functional-requirements)
- [Access rights](#access-rights)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
    - [1 Login](#1-login)
      - [Scenario 1.1](#scenario-11)
      - [Scenario 1.2](#scenario-12)
      - [Scenario 1.3](#scenario-13)
      - [Scenario 1.4](#scenario-14)
      - [Scenario 1.5](#scenario-15)
    - [2 Logout](#2-logout)
      - [Scenario 2.1](#scenario-21)
      - [Scenario 2.2](#scenario-22)
    - [3 CreateNewAccount](#3-createnewaccount)
      - [Scenario 3.1](#scenario-31)
      - [Scenario 3.2](#scenario-32)
      - [Scenario 3.3](#scenario-33)
    - [4 GetCurrentLoggedUser](#4-getcurrentloggeduser)
      - [Scenario 4.1](#scenario-41)
      - [Scenario 4.2](#scenario-42)
      - [Scenario 4.3](#scenario-43)
    - [5 RegisterNewArrivals](#5-registernewarrivals)
      - [Scenario 5.1](#scenario-51)
      - [Scenario 5.2](#scenario-52)
      - [Scenario 5.3](#scenario-53)
      - [Scenario 5.4](#scenario-54)
    - [6 GetProducts Manager](#6-getproducts-manager)
      - [Scenario 6.1](#scenario-61)
      - [Scenario 6.2](#scenario-62)
      - [Scenario 6.3](#scenario-63)
      - [Scenario 6.4](#scenario-64)
    - [7 DeleteProductByCode](#7-deleteproductbycode)
      - [Scenario 7.1](#scenario-71)
      - [Scenario 7.2](#scenario-72)
      - [Scenario 7.3](#scenario-73)
    - [8 CreateNewProduct](#8-createnewproduct)
      - [Scenario 8.1](#scenario-81)
      - [Scenario 8.2](#scenario-82)
    - [9 Pay](#9-pay)
      - [Scenario 9.1](#scenario-91)
      - [Scenario 9.2](#scenario-92)
      - [Scenario 9.3](#scenario-93)
    - [10 GetHistoryPaidCarts](#10-gethistorypaidcarts)
      - [Scenario 10.1](#scenario-101)
      - [Scenario 10.2](#scenario-102)
      - [Scenario 10.3](#scenario-103)
      - [Scenario 10.4](#scenario-104)
    - [11 RemoveProductFromCart](#11removeproductfromcart)
      - [Scenario 11.1](#scenario-111)
      - [Scenario 11.2](#scenario-112)
      - [Scenario 11.3](#scenario-113)
    - [12 DeleteCart](#12-deletecart)
      - [Scenario 12.1](#scenario-121)
      - [Scenario 12.2](#scenario-122)
      - [Scenario 12.3](#scenario-123)
    - [13 AddProduct](#13-addproduct)
      - [Scenario 13.1](#scenario-131)
      - [Scenario 13.2](#scenario-132)
      - [Scenario 13.3](#scenario-133)
    - [14 GetCart](#14-getcart)
      - [Scenario 14.1](#scenario-141)
      - [Scenario 14.2](#scenario-142)
    - [15 RequestReturn](#15-requestreturn)
      - [Scenario 15.1](#scenario-151)
      - [Scenario 15.2](#scenario-152)
    - [16 AddRating](#16-addrating)
      - [Scenario 16.1](#scenario-161)
      - [Scenario 16.2](#scenario-162)
    - [17 AddDiscount](#17-adddiscount)
      - [Scenario 17.1](#scenario-171)
      - [Scenario 17.2](#scenario-172)
    - [18 UpdatePrice](#18-updateprice)
      - [Scenario 18.1](#scenario-181)
      - [Scenario 18.2](#scenario-182)
    - [19 RequestShipment](#19-requestshipment)
      - [Scenario 19.1](#scenario-191)
      - [Scenario 19.2](#scenario-192)
    - [20 CreateNewModel](#20-createnewmodel)
      - [Scenario 20.1](#scenario-201)
      - [Scenario 20.2](#scenario-202)
    - [21 GetProducts Customer and Guest](#21-getproducts-customer-and-guest)
      - [Scenario 21.1](#scenario-211)
      - [Scenario 21.2](#scenario-212)
      - [Scenario 21.3](#scenario-213)
      - [Scenario 21.4](#scenario-214)
    - [22 OrderByPrice](#22-orderbyprice)
      - [Scenario 22.1](#scenario-221)
      - [Scenario 22.2](#scenario-222)
      - [Scenario 22.3](#scenario-223)
    - [23 ActivateNotification](#23-activatenotification)
      - [Scenario 23.1](#scenario-231)
      - [Scenario 23.2](#scenario-232)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)

# Informal description

EZElectronics (read EaSy Electronics) is a software application designed to help managers of electronics stores to manage their products and offer them to customers through a dedicated website. Managers can assess the available products, record new ones, and confirm purchases. Customers can see available products, add them to a cart and see the history of their past purchases.

# Stakeholders

| Stakeholder name | Description                                         |
| :--------------: | :-------------------------------------------------: |
| Manager          | Individual that needs to manage products in the shop |
| Customer         | Individual that wants to buy products from the shop |
| Guest         | Individual that wants to view products without being logged in |
| Admin         | App developer |
| Payment service         | Service to manage products payment |
| Shipping service         | Service to manage the shipment of products |

# Context Diagram and interfaces

## Context Diagram

![Context Diagram](diagrams/V2/ContextDiagram.png "Context Diagram")

## Interfaces

Manager and Customer will access the system using a GUI. The GUI will be different based on the actor, managers will be able to manage products in stock, while customers will be able to insert products in the cart to buy them later.

|   Actor   | Logical Interface   | Physical Interface |
| :-------: | :---------------:   | :----------------: |
| Manager   | GUI                 | PC / Smartphone                |
| Customer  | GUI                 | PC / Smartphone                |
| Guest  | GUI                 | PC / Smartphone                |
| Admin  | GUI                 | PC                |
| Payment service  | https://www.paypal.com/it/home                 | Internet                |
| Shipping service  | https://www.poste.it/                 | Internet                |

# Stories and personas

Maria is a middle-age woman that works in an electronics shop. She uses EZElectronics to upload weekly (one or multiple time per week) new products in the system and comunicate the arrival of a specific product in the shop. She also needs to know the current situation of the stock.

Mario is a working student with the passion of tech stuff. He monthly buys new devices and he doesn't have time to do that in person, so he choses EZElectronics to do that wherever he is without losing extra time to reach the shop.

Giovanni is a man in his 30s who works during opening hours of physical shops and needs to be able to buy things online.

Roberto is a 42 years old man that works as an admin of
EZElectronics. He is in charge of managing the application's
functionalities and contributing to its improvement, in
order to optimize all features and offer a better user
experience.

Silvia is a 20 year old woman who has never bought from EzEletrnics and doesn't have an account. She needs to compare prices between different sites so she checks on different products available 

# Functional and non functional requirements

## Functional Requirements

|  ID      | Description                                 |
| :---:    | :-----------------------------------------: |
|  FR1     | Handle authentication                       |
|  FR1.2   | Login                                       |
|  FR1.2   | Logout                                      |
|  FR1.3   | Get logged account info                     |
|  FR1.4   | Create new account                          |
|  FR2     | Manage products                             |
|  FR2.1   | Register a new arrival of a set of products |
|  FR2.2   | Mark a product as sold                      |
|  FR2.3   | Request a list of all products              |
|  FR2.4   | Request a product by code                   |
|  FR2.5   | Request a list of products by category      |
|  FR2.6   | Request a list of products by model         |
|  FR2.7   | Delete product by code                      |
|  FR2.8   | Create new product                          |
|  FR2.9   | Add discount                                |
|  FR2.10  | Edit price                                  |
|  FR3     | Manage cart for logged user                 |
|  FR3.1   | Add product to cart                         |
|  FR3.2   | Pay the cart                                |
|  FR3.3   | Request a list of all paid cart             |
|  FR3.4   | Remove a product from the cart              |
|  FR3.5   | Delete the current unpaid cart              |
|  FR3.6   | Retrieve the cart for the current user      |
|  FR3.7   | Request a return      |
|  FR3.8   | Add a rating      |
|  FR4    | Handle view products                        |
|  FR4.1   | Order products by price                     |

## Non Functional Requirements

|   ID    | Type (efficiency, reliability, ..) | Description | Refers to |
| :-----: | :--------------------------------: | :---------: | :-------: |
|  NFR1   | Usability                          | No training needed | Managers/Customers |
|  NFR2   | Efficency                          | Minimizing response not considering the network delay | Managers/Customers |
|  NFR3   | Portability                        | The app should be available at least on the last version of the following browsers (Chrome, Firefox, Safari) |           |
|  NFR4   | Usability                          | The app should be visualized both on mobile devices and PC correctly |           |
|  NFR5   | Reliability                        | Frequent backup |           | 
|  NFR6   | Security                           | Cryptography |           |    
|  NFR7   | Efficency                          | Few interactions | Managers/Customers |    
|  NFR8   | Reliability                        | Less than one bug per year |           |
|  NFR9   | Usability                        | Products in the cart are reserved for 10 minutes | Customers          |

## Access rights
| Function | Manager | Customer | Guest |
| :-----: | :----------: | :---------: | :---------: | 
| Login | X | X | |  |
| Logout | X| X| | |
| CreateNewAccount |X |X | | |
| GetCurrentLoggedUser |X |X | | |
| RegisterNewArrivals |X | | | |
| GetProducts  |X (By model, category or code) |X (By model or category) | X (By model or actegory)| |
| DeleteProductByCode| X| | | |
| CreateNewProduct|X | | | |
| Pay| |X | | |
| GetHistoryPaidCarts| |X | | |
| RemoveProductFromCart| |X | | |
| DeleteCart| |X | | |
| AddProducts| |X | | |
| GetCart| | X| | |
| RequestReturn| | X| | |
| AddRating| | X| | |
| AddDiscount| X| | | |
| UpdatePrice | X| | | |
| RequestShipment| | X| | |
| CreateNewModel|X | | | |
| OrderByPrice| |X |X | |
| ActivateNotification| |X | | |


# Use case diagram and use cases

## Use case diagram

![Use Case Diagram](diagrams/V2/UseCaseDiagramV2.1.png "Use Case Diagram")

![Use Case Diagram](diagrams/V2/UseCaseDiagramV2.2.png)

### 1 Login

| Actors Involved  | Manager, Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is registred and not logged in |
|  Post condition  | The user is logged in |
| Nominal Scenario | The user wants to log into their account to perform some action |
|     Variants     | - |
|    Exceptions    | The system is unavailable. Wrong credentials have been used. Credential missing |

##### Scenario 1.1

|  Scenario 1.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is registred and not logged in |
|  Post condition  | The user is logged in |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user insert the credentials |
|       3        | The user is authenticated |

##### Scenario 1.2

|  Scenario 1.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is registred and not logged in |
|  Post condition  | The user is not logged in |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user insert the credentials |
|       3        | The credentials are wrong |

##### Scenario 1.3

|  Scenario 1.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is registred and not logged in |
|  Post condition  | The user is not logged in |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | EZElectronics is unavailable |

##### Scenario 1.4

|  Scenario 1.4  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is not registred and not logged in |
|  Post condition  | The user is not logged in and is registered |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user is not registered |
|       3        | The system ask to the user to create a new account |
|       4        | The user accepts |
|       5        | Go to CreateNewAccount |

##### Scenario 1.5

|  Scenario 1.5  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is registred and not logged in |
|  Post condition  | The user is not logged in |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user tries to authenticate |
|       3        | Credentials are missing |

### 2 Logout

| Actors Involved  | Manager, Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in |
|  Post condition  | The user is logged out |
| Nominal Scenario | The user needs to log out from the account |
|     Variants     | - |
|    Exceptions    | The system is unavailable. |

##### Scenario 2.1

|  Scenario 2.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in |
|  Post condition  | The user is logged out |
|     Step#      |                                Description                                 |
|       1        | The user ask to log out |
|       2        | The user is loged out |

##### Scenario 2.2

|  Scenario 2.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in |
|  Post condition  | The user is not logged out |
|     Step#      |                                Description                                 |
|       1        | The user ask to log out |
|       2        | EZElectronics is unavailable |

### 3 CreateNewAccount

| Actors Involved  | Manager, Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is not registered to the system |
|  Post condition  | The user is registered and can now login/out |
| Nominal Scenario | The user needs to use the system in some way (as a manager or customer) |
|     Variants     | - |
|    Exceptions    | The system is unavailable. Username already present |

##### Scenario 3.1

|  Scenario 3.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is not registered to the system |
|  Post condition  | The user is registered and can now login/out |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user insert the data required |
|       3        | The user is registered into the system |

##### Scenario 3.2

|  Scenario 3.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is not registered to the system |
|  Post condition  | The user is not registered |
|     Step#      |                                Description                                 |
|       1        | The user access EZElectronics |
|       2        | The user insert the data required |
|       3        | The username is already present |
|       4        | The user is not registered |

##### Scenario 3.3

|  Scenario 3.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is not registered to the system |
|  Post condition  | The user is not registered |
|     Step#      |                                Description                                 |
|       1        | The user accesses EZElectronics |
|       2        | The system is unavailable |

### 4 GetCurrentLoggedUser

| Actors Involved  | Manager, Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in |
|  Post condition  | The system get to know the info about the user |
| Nominal Scenario | The user needs to do some sort of action, and the system needs to know if the user is allowed or not |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The user is not logged in |

##### Scenario 4.1

|  Scenario 4.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in |
| Post condition | The system get to know info about the user |
|     Step#      |                                Description                                 |
|       1        | The  user is logged in and wants to perform a specific action |
|       2        | The system get info about the user |

##### Scenario 4.2

|  Scenario 4.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is not logged in |
| Post condition | The system doesn't get info about the user |
|     Step#      |                                Description                                 |
|       1        | The  user is not logged in |
|       2        | The info cannot be retreived |

##### Scenario 4.3

|  Scenario 4.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in |
| Post condition | The system doesn't get info about the user |
|     Step#      |                                Description                                 |
|       1        | The user try to use EZElectronics |
|       2        | The system is unavailable |

### 5 RegisterNewArrivals

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager |
|  Post condition  | The set of products is registered in the stock |
| Nominal Scenario | The manager needs to register in the stock a new set of products arrived at the shop |
|     Variants     | Product doesn't exist and it need to be created |
|    Exceptions    | The system is unavailable. The insert data is wrong. The arrival date is after the current date |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The arrival date is after the current date |

##### Scenario 5.1

|  Scenario 5.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged as manager |
| Post condition | The new set of product is registered in the stock |
|     Step#      |                                Description                                 |
|       1        | The user sends data about a new set of products to be registered in the stock |
|       2        | The products are registered in the stock |

##### Scenario 5.2

|  Scenario 5.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged as manager |
| Post condition | The new set of product is not registered in the stock |
|     Step#      |                                Description                                 |
|       1        | The user sends data about a new set of products to be registered in the stock |
|       2        | The arrival date is after current date |
|       3        | The set of product is not being registered in the stock|

##### Scenario 5.3

|  Scenario 5.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in asmanager |
| Post condition | The new set of product is not registered in the stock |
|     Step#      |                                Description                                 |
|       1        | The user tries to register the new product |
|       2        | The system is unavailable |

##### Scenario 5.4

|  Scenario 5.4  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | The new set of product is registered in the stock |
|     Step#      |                                Description                                 |
|       1        | The user sends data about a new set of products to be registered in the stock |
|       2        | The product does not exist |
|       3        | Go to UC CreateNewProduct |

### 6 GetProducts Manager

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager |
|  Post condition  | The user gets a list of the required products |
| Nominal Scenario | The manager needs to know which products are registered usig specific filters |
|     Variants     | The user can ask for sold/not sold products (filter by category, model, code) |
|    Exceptions    | The system is unavailable. If the product is required by code and not present |

##### Scenario 6.1

|  Scenario 6.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | The user gets a list of the required products |
|     Step#      |                                Description                                 |
|       1        | The user ask for sold/not sold products filter by category/model (it includes searching by category or model name|
|       2        | The user gets the list of products |

##### Scenario 6.2

|  Scenario 6.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | The user gets the required product |
|     Step#      |                                Description                                 |
|       1        | The user asks for a specific product by code |
|       2        | The user gets the required product |

##### Scenario 6.3

|  Scenario 6.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | The user does not get the required product |
|     Step#      |                                Description                                 |
|       1        | The user asks for a specific product by code |
|       2        | The product doesn't exist |
|       2        | The user doesn't get the required product |

##### Scenario 6.4

|  Scenario 6.4  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | The user does not get the required products |
|     Step#      |                                Description                                 |
|       1        | The user asks for products/product |
|       2        | The system is unavailable |

### 7 DeleteProductByCode

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager. The product is present |
|  Post condition  | The selected product is deleted |
| Nominal Scenario | The amnager needs to delete a product |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The product is not present |

##### Scenario 7.1

|  Scenario 7.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager. The product is present |
|  Post condition  | The selected product is deleted |
|     Step#      |                                Description                                 |
|       1        | The user delete a product |
|       2        | The product is deleted |

##### Scenario 7.2

|  Scenario 7.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager |
|  Post condition  | The selected product is not deleted |
|     Step#      |                                Description                                 |
|       1        | The user delete a product |
|       2        | The product is not present |

##### Scenario 7.3

|  Scenario 7.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager |
|  Post condition  | The selected product is not deleted |
|     Step#      |                                Description                                 |
|       1        | The user delete a product |
|       2        | The system is unavailable |

### 8 CreateNewProduct

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager. The product is not present |
|  Post condition  | The new product is registered |
| Nominal Scenario | The manager needs to create a product |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The product is already present. |

##### Scenario 8.1

|  Scenario 8.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager. The product is not present |
|  Post condition  | The new product is registered |
|     Step#      |                                Description              
|       1        | Go to UC CreateNewModel |                   |
|       2        | The new product is registered in the system |

##### Scenario 8.2

|  Scenario 8.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The new product is not registered |
|     Step#      |                                Description                                 |
|       1        | The system is unavailable |

## 9 Pay

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The cart is marked as paid |
| Nominal Scenario | The user wants to pay for the order |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The cart is empty or not present |

##### Scenario 9.1

|  Scenario 9.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The cart is marked as paid |
|     Step#      |                                Description                                 |
|       1        | The user enter the checkout section |
|       2        | The user pays for the cart total |
|       3        | The cart is marked as paid in the current date |

##### Scenario 9.2

|  Scenario 9.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The cart is not marked as paid |
|     Step#      |                                Description                                 |
|       1        | The user enter the checkout section |
|       2        | The cart is empty or not present |

##### Scenario 9.3

|  Scenario 9.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The cart is not marked as paid |
|     Step#      |                                Description                                 |
|       1        | The user tries to enter the checkout section |
|       2        | The system is unavailable |

### 10 GetHistoryPaidCarts

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The user gets all the already paid carts |
| Nominal Scenario | The user wants to know for which carts they already paid |
|     Variants     | The user asks a retire or he adds a rating |
|    Exceptions    | The system is unavailable. |

##### Scenario 10.1

|  Scenario 10.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The user gets all the already paid carts |
|     Step#      |                                Description                                 |
|       1        | The user enter in the paid checkouts section |
|       2        | The user sees all the previous cart paid |

##### Scenario 10.2

|  Scenario 10.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The user does not get all the paid carts |
|     Step#      |Description                                 |
|       1        | The user enter in the paid checkouts section |
|       2        | The system is unavailable |

##### Scenario 10.3 

|  Scenario 10.3  | |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The user requests a return |
|     Step#     |                         Description                                 |
|       1        | The user enter in the paid checkouts section |
|       2        | The user sees all the previous cart paid |
|       3        | The user enters in a specific cart  |
|       4        | The user selects a specific product  |
|       5        | If the user wants to request a return go to use case RequestReturn |

##### Scenario 10.4 

|  Scenario 10.4  | |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The user adds a rating to an already bought product |
|     Step#      |                             Description                                 |
|       1        | The user enter in the paid checkouts section |
|       2        | The user sees all the previous cart paid |
|       3        | The user enters in a specific cart  |
|       4        | The user selects a specific product  |
|       5        | If the user wants to add a rating to a product go to use case AddRating |

### 11 RemoveProductFromCart

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is deleted from the current cart |
| Nominal Scenario | The user wants to delete a product in the current cart |
|     Variants     | - |
|    Exceptions    | The system is unavailable. There is no current cart present |

##### Scenario 11.1

|  Scenario 11.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is deleted from the current cart |
|     Step#      |                                Description                                 |
|       1        | The user accesses the cart |
|       2        | The user remove a product from the cart |

##### Scenario 11.2

|  Scenario 11.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is not deleted from the current cart |
|     Step#      |                                Description                                 |
|       1        | The user accesses the cart |
|       2        | There is no active cart |

##### Scenario 11.3

|  Scenario 11.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is not deleted from the current cart |
|     Step#      |                                Description                                 |
|       1        | The user accesses the cart |
|       2        | The system is unvailable |

### 12 DeleteCart

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is deleted |
| Nominal Scenario | The user wants to delete the current cart |
|     Variants     | - |
|    Exceptions    | The system is unavailable. There is no current cart present |

##### Scenario 12.1

|  Scenario 12.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is deleted |
|     Step#      |                                Description                                 |
|       1        | The user enter the cart settings |
|       2        | The user chooses to delete the cart |
|       3        | The cart is deleted |

##### Scenario 12.2

|  Scenario 12.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is not deleted |
|     Step#      |                                Description                                 |
|       1        | The user accesses the cart settings |
|       2        | There is no active cart |

##### Scenario 12.3

|  Scenario 12.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is not deleted |
|     Step#      |                                Description                                 |
|       1        | The user accesses the cart settings |
|       2        | The system is unvailable |

### 13 AddProducts

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is added in the cart |
| Nominal Scenario | The user wants to add a new product in the cart |
|     Variants     | - |
|    Exceptions    | The system is unavailable. The product does not exist, is present in another cart, is already sold |

##### Scenario 13.1

|  Scenario 13.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is added in the cart |
|     Step#      |                                Description                                 |
|       1        | The user adds a product in the cart |
|       2        | The product is in the user cart |

##### Scenario 13.2

|  Scenario 13.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is not added in the cart |
|     Step#      |                                Description                                 |
|       1        | The user adds a product in the cart |
|       2        | The product does not exist/is present in another cart/as been already sold |

##### Scenario 13.3

|  Scenario 13.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | A product is not added in the cart |
|     Step#      |                                Description                                 |
|       1        | The user tries to add a product in the cart |
|       2        | The system is unvailable |

### 14 GetCart

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is retreived |
| Nominal Scenario | The user wants to know the info about the current cart |
|     Variants     | - |
|    Exceptions    | The system is unavailable. No current cart present |

##### Scenario 14.1

|  Scenario 14.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is retreived |
|     Step#      |                                Description                                 |
|       1        | The user enter the cart section |
|       2        | The user sees the cart products |

##### Scenario 14.2

|  Scenario 14.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a customer |
|  Post condition  | The current cart is not retreived |
|     Step#      |                                Description                                 |
|       1        | The user enter the cart section |
|       2        | The system is unvailable |


### 15 RequestReturn

| Actors Involved  | Customer|
| :---------------:|:--------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user requests a return |
| Nominal Scenario | The user want to request a return |
|     Variants     | - |
|    Exceptions    | The system is unavailable |

##### Scenario 15.1 

|  Scenario 15.1  |  |
| :-------------:  | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user requests a return |
|     Step#      |                            Description                                 |
|       1        | The user enters in an already paid cart  |
|       2        | The user selects which products to return  |
|       3        | The user requests a return  |

##### Scenario 15.2 

|  Scenario 15.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user cannot request a return |
|     Step#      |                              Description                                 |
|       1        | The user enters in an already paid cart  |
|       2        | The user selects which products to return  |
|       3        | The system is unavailable |


### 16 AddRating

| Actors Involved  | Customer|
| :---------------:|:--------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user rates an already bought product |
| Nominal Scenario | The user wants to add a rating |
|     Variants     | - |
|    Exceptions    | The system is unavailable |

##### Scenario 16.1 

|  Scenario 16.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user rates an already bought product |
|     Step#      |                              Description                                 |
|       1        | The user enters in an already paid cart  |
|       2        | The user selects a product  |
|       3        | The user rates a product  |

##### Scenario 16.2 

|  Scenario 16.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer. The user has an already paid cart |
|  Post condition  | The user  cannot rate an already bought product |
|     Step#      |                              Description                                 |
|       1        | The user enters in an already paid cart  |
|       2        | The user selects a product  |
|       3        | The system is unavailable |

### 17 AddDiscount

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The discount is applied |
| Nominal Scenario | The user wants to apply a discount on a product |
|     Variants     | - |
|    Exceptions    | The system is unavailable |

#### Scenario 17.1

|  Scenario 17.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The discount is applied |
|     Step#      |                                Description                                 |
|       1        | The user selects the product |
|       2        | The user sets a discount |
|       3        | The discount is applied |

#### Scenario 17.2

|  Scenario 17.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The discount is not applied |
|     Step#      |                                Description                                 |
|       1        | The user selects the prodcut |
|       2        | The system is unavailable |

### 18 UpdatePrice

| Actors Involved  | Manager |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The price is updated |
| Nominal Scenario | The user wants to update the price of a product |
|     Variants     | - |
|    Exceptions    | The system is unavailable |

#### Scenario 18.1

|  Scenario 18.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The price is updated |
|     Step#      |                                Description                                 |
|       1        | The user selects the product |
|       2        | The user updates the price |
|       3        | The price is updated |

#### Scenario 18.2

|  Scenario 18.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user is logged as a manager |
|  Post condition  | The price is not updated |
|     Step#      |                                Description                                 |
|       1        | The user selects the product |
|       2        | The system is unavailable |

### 19 RequestShipment 

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user has requested the shipment in the checkout section |
|  Post condition  | The shipment is assigned |
| Nominal Scenario | The user wants to conclude the order |
|     Variants     | - |
|    Exceptions    | The system is unavailable |

##### Scenario 19.1

|  Scenario 19.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user has requested the shipment in the checkout section and the shipping address is already in the system |
|  Post condition  | The shipment is assigned |
|     Step#      |                                Description                                 |                                
|       1        | The user enters the checkout section |
|       2        | The user requests the shipment |
|       2        | The user inserts the address |
|       3        | Shipment required |

##### Scenario 19.2

|  Scenario 19.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|   Precondition   | The user has requested the shipment in the checkout section and the shipping address is already in the system |
|  Post condition  | The shipment couldn't be assigned |
|     Step#      |                                Description                                 |                              
|       1        | The user enters the checkout section |
|       2        | The user requests the shipment |
|       3        | The system is unavailable |

## 20 CreateNewModel

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a manager |
|  Post condition  | A new model is created|
| Nominal Scenario | The customer needs to create a new model to create a new product  |
|     Variants     |  |
|    Exceptions    | The system is unavailable |

##### Scenario 20.1

|  Scenario 20.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | A new model is created |
|     Step#      |                                Description                                 |
|       1        | A new model is created with the inserted name |

##### Scenario 20.2

|  Scenario 20.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a manager |
| Post condition | A new model is created |
|     Step#      |                                Description                                 |
|       1        | The system is unavailable |


## 21 GetProducts Customer and Guest

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer or he is not authenticated|
|  Post condition  | The user gets a list of the required products |
| Nominal Scenario | The customer needs to know which products are registered using specific filters |
|     Variants     | The user can ask for sold/not sold products (filter by category, model, model name). He wants to sort products. He wants to activate notifications |
|    Exceptions    | The system is unavailable. If the product is required by code and not present |

##### Scenario 21.1

|  Scenario 21.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer or he is not authenticated |
| Post condition | The user gets a list of the required products |
|     Step#      |                                Description                                 |
|       1        | The user asks for sold/not sold products filtering by category/model (it includes category and model name)|
|       2        | The user gets the list of products |

##### Scenario 21.2

|  Scenario 21.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer or he is not authenticated|
| Post condition | The user does not get the required products |
|     Step#      |                                Description                                 |
|       1        | The user asks for products/product |
|       2        | The system is unavailable |

##### Scenario 21.3

|  Scenario 21.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  |  The user is logged in as a customer or he is not authenticated|
| Post condition | The user gets the required products |
|     Step#      |                                Description                                 |
|       1        | The user asks for products and want to sort them|
|       2        |  Go to UC OrderByPrice|

##### Scenario 21.4

|  Scenario 21.4  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  |  The user is logged in as a customer or he is not authenticated |
| Post condition | The user gets the required products |
|     Step#      |                                Description                                 |
|       1        | The user asks for product/products but it/they is/are out of stock and he wants to be notified when it/they will be available|
|       2        |  Go to UC ActivateNotification|


## 22 OrderByPrice

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer or he is not authenticated|
|  Post condition  | The user gets products ordered by price|
| Nominal Scenario | The customer needs to order products by price  |
|     Variants     | The user can ask to order products by higher or lower price |
|    Exceptions    | The system is unavailable |

##### Scenario 22.1

|  Scenario 22.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer or he is not authenticated|
| Post condition | The user gets products ordered by price |
|     Step#      |                                Description                                 |
|       1        | The user asks for products ordered by higher price |
|       2        | The user gets the right order of products |

##### Scenario 22.2

|  Scenario 22.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer or he is not authenticated|
| Post condition | The user gets products ordered by price |
|     Step#      |                                Description                                 |
|       1        | The user asks for products ordered by lower price |
|       2        | The user gets the right order of products |

##### Scenario 22.3

|  Scenario 22.3  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer or he is not authenticated|
| Post condition | The user dosen't get products ordered by price |
|     Step#      |                                Description                                 |
|       1        | The user asks for products ordered by price |
|       2        | The system is unavailable |

## 23 ActivateNotification

| Actors Involved  | Customer |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | The user is logged in as a customer |
|  Post condition  | The user will be notified when the product will be available|
| Nominal Scenario | The customer needs to know where an out of stock product is available  |
|     Variants     |  |
|    Exceptions    | The system is unavailable |

##### Scenario 23.1

|  Scenario 23.1  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer |
| Post condition | The user will be notified when the product will be available |
|     Step#      |                                Description                                 |
|       1        | The user requests a notify  |
|       2        | The user will receive a notify |

##### Scenario 23.2

|  Scenario 23.2  |  |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | The user is logged in as a customer |
| Post condition | The user will be notified when the product will be available |
|     Step#      |                                Description                                 |
|       1        | The user requests a notify  |
|       2        | The system is unavailable |

# Glossary

The user can be a "Manager", if their purpose is to manage products (sell, add, register...); it can be a "Customer", if their purpose is to buy products; it can be a "Guest", if their purpose is to view products

The product is something (electronic devices) identified with a unique code, that can be managed in the virtual shop by the manager or can be bought by the customer. The product belongs to a Model

The cart is a set of products that the customer is willing to buy.

The customer orders from a specific adress inserted every time he has to pay for a cart

The customer can also rate a model of a product he already bought


![Class Diagram](diagrams/V2/ClassDiagramV2.png "Class Diagram")

# System Design

![System Design Diagram](diagrams/V1/SystemDesignDiagram.png "System Design Diagram")

# Deployment Diagram

![Deployment Diagram](diagrams/V1/DeploymentDiagram.png "Deployment Diagram")
