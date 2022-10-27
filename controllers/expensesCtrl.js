const { Expenses } = require('../models');

exports.addExpense = async (req, res) => {
    const expense = req.body;

    await Expenses.create(expense)
        .then((expense) => {
            res.status(201).json(expense);
        })
        .catch((err) => {
            res.status(500).json({ message: "Server error while adding the expense !" });
            console.log(err);
        })
};

exports.getExpenses = async (req, res) => {
    await Expenses.findAll({ order: [['createdAt', 'DESC']] })
        .then((expenses) => {
            res.status(200).json(expenses);
        })
        .catch(err => {
            console.log(err);
            res.status(404).json({ error: "Expenses not found." })
        })
};
