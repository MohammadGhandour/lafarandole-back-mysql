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

exports.deleteExpense = async (req, res) => {
    const id = req.params.id;
    await Expenses.findByPk(id)
        .then(expense => {
            expense = expense.dataValues
            Expenses.destroy({ where: { id: id } })
                .then(() => res.status(200).json({ message: "Expense deleted." }))
                .catch(error => {
                    res.status(400).json(error);
                });
        })
        .catch(error => {
            res.status(500).json(error);
            console.log(error);
        })
}