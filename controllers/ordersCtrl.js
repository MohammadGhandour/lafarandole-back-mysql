const { Orders } = require('../models');
const { Products } = require('../models');
const { Customers } = require('../models');

exports.postOrder = async (req, res) => {
    const order = req.body;
    const cart = order.cart;

    const itemsNumber = cart.reduce((totalItems, item) => ((totalItems + item.quantity)), 0);
    order.itemsNumber = itemsNumber;

    cart.map(item => {
        Products.findByPk(item.id)
            .then(res => {
                let productToUpdate = res;
                productToUpdate.quantity = productToUpdate.quantity - item.quantity;
                productToUpdate.inStock = productToUpdate.inStock - item.quantity;
                productToUpdate.quantitySold = productToUpdate.quantitySold + item.quantity;
                Products.update(
                    {
                        quantity: productToUpdate.quantity,
                        inStock: productToUpdate.inStock,
                        quantitySold: productToUpdate.quantitySold
                    },
                    { where: { id: item.id } }
                )
                    .then(newProductAfterUpdate => {
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400).json({ error: err })
                    })
            })
    });

    await Orders.create(order)
        .then(order => {
            res.status(200).json(order);
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: err })
        })
};

exports.updateOrder = async (req, res) => {
    const orderId = req.params.id;
    const productsToReturn = req.body.productsToReturn;
    const orderToAdd = req.body.updated;
    let oldCart = [];
    let oldOrder = {};
    const currencyExchange = 38000;

    await Orders.findByPk(orderId, { raw: true })
        .then(order => {
            if (order) {
                oldOrder = order;
                oldCart = order.cart;
            } else {
                res.status(404).json({ error: `The order with the id ${req.params.id} is not found.` });
                console.log(`The order with the id ${req.params.id} is not found.`);
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting orders." })
        });

    let finalCart = [];
    if (oldOrder.discount) {
        let discountCurrencyPERCENT = oldOrder.discount.split('%');
        let discountCurrencyUSD = oldOrder.discount.split('USD');
        let discountCurrencyLBP = oldOrder.discount.split('LBP');
        if (discountCurrencyPERCENT.length > 1) {
            oldCart.map(product => {
                product.priceAfterDiscount = Number(product.priceAfterDiscount - (discountCurrencyPERCENT[0] / 100 * product.priceAfterDiscount)).toFixed(2)
            })
            finalCart = oldCart
        } else {
            finalCart = oldCart;
        }
    }

    console.log(productsToReturn);

    for (let i = 0; i < oldCart.length; i++) {
        for (let j = 0; j < productsToReturn.length; j++) {
            if (oldCart[i].id === productsToReturn[j].id) {
                if (oldCart[i].quantity === productsToReturn[j].quantity) {
                    finalCart = finalCart.filter(product => product.id !== oldCart[i].id);
                } else {
                    finalCart = finalCart.map(product => product.id === oldCart[i].id ?
                        { ...product, quantity: oldCart[i].quantity - productsToReturn[j].quantity } : product);
                }
            } else {
                console.log('I am not doing anything');
            }

            Products.findByPk(productsToReturn[j].id)
                .then(res => {
                    let productToUpdate = res;
                    productToUpdate.quantity = Number(productToUpdate.quantity) + Number(productsToReturn[j].quantity);
                    productToUpdate.inStock = Number(productToUpdate.inStock) + Number(productsToReturn[j].quantity);
                    productToUpdate.quantitySold = Number(productToUpdate.quantitySold) - Number(productsToReturn[j].quantity);
                    Products.update(
                        {
                            quantity: productToUpdate.quantity,
                            inStock: productToUpdate.inStock,
                            quantitySold: productToUpdate.quantitySold
                        },
                        { where: { id: productsToReturn[j].id } }
                    )
                        .then(newProductAfterUpdate => {
                        })
                        .catch(err => {
                            console.log(err);
                            res.status(400).json({ error: err })
                        })
                })
        }
    }


    let totalOfProductsThatWillStay = finalCart.reduce((total, item) => ((total + item.quantity * item.priceAfterDiscount)), 0);

    if (orderToAdd.discount) {
        let discountCurrencyPERCENT = orderToAdd.discount.split('%');
        let discountCurrencyUSD = orderToAdd.discount.split('USD');
        let discountCurrencyLBP = orderToAdd.discount.split('LBP');
        if (discountCurrencyPERCENT.length > 1) {
            orderToAdd.cart.map(product => {
                product.priceAfterDiscount = Number(product.priceAfterDiscount - (discountCurrencyPERCENT[0] / 100 * product.priceAfterDiscount)).toFixed(2)
            })
            orderToAdd.cart.forEach(productToAdd => {
                finalCart.push(productToAdd);
            });
        } else {
            orderToAdd.cart.forEach(productToAdd => {
                finalCart.push(productToAdd);
            });
        }
    }

    orderToAdd.cart.map(item => {
        Products.findByPk(item.id)
            .then(res => {
                let productToUpdate = res;
                productToUpdate.quantity = productToUpdate.quantity - item.quantity;
                productToUpdate.inStock = productToUpdate.inStock - item.quantity;
                productToUpdate.quantitySold = productToUpdate.quantitySold + item.quantity;
                Products.update(
                    {
                        quantity: productToUpdate.quantity,
                        inStock: productToUpdate.inStock,
                        quantitySold: productToUpdate.quantitySold
                    },
                    { where: { id: item.id } }
                )
                    .then(newProductAfterUpdate => {
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400).json({ error: err })
                    })
            })
    });

    let totalBeforeDiscount = finalCart.reduce((total, item) => (total + item.quantity * item.price), 0);
    totalBeforeDiscount = totalBeforeDiscount.toFixed(2);
    const cost = finalCart.reduce((totalCost, item) => (totalCost + item.quantity * item.cost), 0);
    const itemsNumber = finalCart.reduce((totalItems, item) => ((totalItems + item.quantity)), 0);
    // let total = orderToAdd.cart.reduce((total, item) => ((total + item.quantity * item.priceAfterDiscount)), 0);
    let total = orderToAdd.total;
    let finalTotal = Number(total + totalOfProductsThatWillStay).toFixed(2);

    if (oldOrder.customerNumber) {
        Customers.findOne({ where: { customerNumber: oldOrder.customerNumber } })
            .then(response => {
                let oldCustomer = response.dataValues;
                let newVersionOfCustomer = {
                    customerName: oldCustomer.customerName,
                    customerNumber: oldCustomer.customerNumber,
                    numberOfOrders: oldCustomer.numberOfOrders,
                    totalOfAllOrders: (Number(oldCustomer.totalOfAllOrders) - Number(oldOrder.total)) + Number(finalTotal)
                }
                Customers.update(
                    {
                        customerName: newVersionOfCustomer.customerName,
                        customerNumber: newVersionOfCustomer.customerNumber,
                        numberOfOrders: newVersionOfCustomer.numberOfOrders,
                        totalOfAllOrders: newVersionOfCustomer.totalOfAllOrders,
                    },
                    { where: { customerNumber: oldOrder.customerNumber } }
                )
                    .then(response => {
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400).json({ error: "Something went wrong" })
                    })
            })
    } else {
        console.log("There is not a customer number");
    }

    Orders.update({
        customerName: oldOrder.customerName,
        customerNumber: oldOrder.customerNumber,
        itemsNumber: itemsNumber,
        totalBeforeDiscount: totalBeforeDiscount,
        total: finalTotal,
        cost: cost.toFixed(2),
        discount: orderToAdd.discount,
        profit: Number(finalTotal) - Number(cost),
        cart: finalCart,
        promoCode: oldOrder.promoCode
    }, { where: { id: orderId } })
        .then(newFinalOrder => {
            console.log(newFinalOrder);
            res.status(200).json({ message: 'Order updated successfully.' });
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "For some reason an error has occured" });
        })
};

exports.getOrders = async (req, res) => {
    await Orders.findAll({ order: [['createdAt', 'DESC']] })
        .then(orders => {
            res.status(200).json(orders)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting orders." })
        })
};

exports.getOrder = async (req, res) => {
    await Orders.findByPk(req.params.id)
        .then(order => {
            if (order) {
                res.status(200).json(order)
            } else {
                res.status(404).json({ error: `The order with the id ${req.params.id} is not found.` })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting orders." })
        })
};

exports.getCustomerOrders = async (req, res) => {
    await Orders.findAll({ where: { customerNumber: req.params.customerNumber }, raw: true })
        .then(orders => {
            const sortedOrders = orders.sort((a, b) => b.createdAt - a.createdAt);
            res.status(200).json(sortedOrders);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting orders." })
        })
};

exports.getOrdersForChart = async (req, res) => {
    await Orders.findAll({})
        .then(orders => {
            const sortedOrders = orders.sort((a, b) => a.createdAt - b.createdAt);
            res.status(200).json(sortedOrders)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting orders." })
        })
};