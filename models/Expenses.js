module.exports = (sequelize, DataTypes) => {
    const Expenses = sequelize.define("Expenses", {
        expenseValue: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        currency: { type: DataTypes.STRING, allowNull: false, },
        currencyExchange: { type: DataTypes.DECIMAL(11, 2) },
        comment: { type: DataTypes.STRING, default: '' },
        category: { type: DataTypes.STRING, default: '' }
    })

    return Expenses;
};