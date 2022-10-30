module.exports = (req, res, next) => {
    const product = req.body;
    const name = product.name;
    const barcode = product.barcode;
    const category = product.category;
    const brand = product.brand;
    const size = product.size;
    const gender = product.gender;
    const quantity = product.quantity;
    const cost = product.cost;
    const price = product.price;

    let emptyFields = [];

    if (name === '') {
        emptyFields.push("name");
    }
    if (!barcode) {
        emptyFields.push("barcode");
    }
    if (category === '') {
        emptyFields.push("category");
    }
    if (brand === '') {
        emptyFields.push("brand");
    }
    if (size === '') {
        emptyFields.push("size");
    }
    if (gender === '') {
        emptyFields.push("gender");
    }
    if (quantity == 0) {
        emptyFields.push("quantity");
    }
    if (cost == 0) {
        emptyFields.push("cost");
    }
    if (price == 0) {
        emptyFields.push("price");
    }

    if (emptyFields.length > 0) {
        res.status(400).json({ error: `Please fill all the fields.`, emptyFields })
    } else {
        next();
    }
}
