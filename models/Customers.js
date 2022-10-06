module.exports = (sequelize, DataTypes) => {
    const Customers = sequelize.define("Customers", {
        customerName: { type: DataTypes.STRING, allowNull: false },
        customerNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
        numberOfOrders: { type: DataTypes.INTEGER, allowNull: false, },
        totalOfAllOrders: { type: DataTypes.DECIMAL(11, 2), allowNull: false, },
        testNewProperty: { type: DataTypes.STRING, default: '' }
    })

    return Customers;
};