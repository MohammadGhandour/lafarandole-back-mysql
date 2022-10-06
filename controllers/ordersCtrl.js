const { Orders } = require('../models');
const { Products } = require('../models');
const bcrypt = require('bcrypt');

exports.postOrder = async (req, res) => {
    const order = req.body;
    console.log(order);
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
