module.exports = (sequelize, DataTypes) => {
    const Products = sequelize.define("Products", {
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: true },
        size: { type: DataTypes.STRING, allowNull: false },
        gender: { type: DataTypes.STRING, allowNull: false },
        quantity: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false },
        photo: { type: DataTypes.STRING, allowNull: true },
        cost: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        price: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        discount: { type: DataTypes.INTEGER, allowNull: true },
        priceAfterDiscount: { type: DataTypes.DECIMAL(11, 2), allowNull: false },
        barcode: { type: DataTypes.STRING, allowNull: false, unique: true },
        inStock: { type: DataTypes.INTEGER, allowNull: false },
        quantitySold: { type: DataTypes.INTEGER, allowNull: false },
    });

    return Products;
};