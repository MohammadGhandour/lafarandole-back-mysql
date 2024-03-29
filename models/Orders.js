module.exports = (sequelize, DataTypes) => {
    const Orders = sequelize.define("Orders", {
        customerName: { type: DataTypes.STRING, allowNull: true },
        customerNumber: { type: DataTypes.STRING, allowNull: true },
        itemsNumber: { type: DataTypes.INTEGER, allowNull: false },
        totalBeforeDiscount: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        total: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        cost: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        discount: { type: DataTypes.STRING, allowNull: true },
        profit: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        cart: { type: DataTypes.JSON, allowNull: false },
        orderLocation: { type: DataTypes.STRING, allowNull: false },
        promoCode: { type: DataTypes.STRING, allowNull: false },
        paid: { type: DataTypes.BOOLEAN, allowNull: false, default: 0 },
        salesperson_id: { type: DataTypes.INTEGER, allowNull: false, default: 0 }
    })

    return Orders;
};
