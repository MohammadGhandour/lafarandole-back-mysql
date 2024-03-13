const { Customers } = require('../models');
const { Orders } = require('../models');

exports.addCustomer = async (req, res) => {

    let customer = req.body.customer;
    const newTotal = req.body.finalTotal;

    await Customers.findOne({ where: { customerNumber: customer.customerNumber } })
        .then(customerAlreadyExist => {
            if (customerAlreadyExist !== null) {
                let oldCustomer = customerAlreadyExist.dataValues;
                let newVersionOfCustomer = {
                    customerName: customer.customerName,
                    customerNumber: customer.customerNumber,
                    numberOfOrders: oldCustomer.numberOfOrders + 1,
                    totalOfAllOrders: Number(oldCustomer.totalOfAllOrders) + newTotal
                }
                Customers.update(
                    {
                        customerName: newVersionOfCustomer.customerName,
                        customerNumber: newVersionOfCustomer.customerNumber,
                        numberOfOrders: newVersionOfCustomer.numberOfOrders,
                        totalOfAllOrders: newVersionOfCustomer.totalOfAllOrders,
                    },
                    { where: { customerNumber: customer.customerNumber } }
                )
                    .then(response => {
                        res.status(200).json(response);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({ error: "Something went wrong" })
                    })
            } else {
                customer.totalOfAllOrders = newTotal;
                customer.numberOfOrders = 1;
                Customers.create(customer, { raw: true })
                    .then(customer => {
                        res.status(200).json(customer)
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({ error: "Server Error while creating customer." })
                    })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Something went wrong." })
        })
};

exports.getCustomers = async (req, res) => {
    await Customers.findAll({})
        .then(customers => {
            const sortedCustomers = customers.sort((a, b) => b.totalOfAllOrders - a.totalOfAllOrders);
            res.status(200).json(sortedCustomers);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting customers." })
        })
};

exports.getCustomersDropDown = async (req, res) => {
    await Customers.findAll({ raw: true, attributes: ["customerNumber", "customerName", "id"] })
        .then(customers => {
            const sortedCustomers = customers.sort((a, b) => b.totalOfAllOrders - a.totalOfAllOrders);
            res.status(200).json(sortedCustomers);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Server Error while getting customers." })
        })
};

exports.getCustomerOrders = async (req, res) => {
    await Orders.findAll({ where: { customerName: req.params.customerName }, raw: true })
        .then(orders => {
            console.log(orders);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Error retrieving orders for this customer" })
        })
}

exports.exportCustomers = async (req, res) => {
    try {
        const customers = (await Customers.findAll({ raw: true, order: [["createdAt", "ASC"]] }));
        console.log(customers.length);
        const final = [];
        for (let customer of customers) {
            const { customerName, customerNumber } = customer;
            const { firstName, lastName } = splitName(customerName);
            const finalCustomer = {
                "First Name": firstName,
                "Last Name": lastName,
                "Email": "",
                "Phone": `(+961) ${customerNumber}`,
                "Accepts SMS Marketing": "yes"
            };

            final.push(finalCustomer);
        };

        console.log(final.length);
        res.status(200).json(final);
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};

function splitName(name) {
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ').trim();
    return { firstName: firstName.trim(), lastName };
}