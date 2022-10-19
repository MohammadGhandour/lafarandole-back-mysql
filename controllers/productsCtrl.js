const { Products } = require('../models');
const fs = require('fs');

exports.addProduct = async (req, res) => {
    await Products.findOne({ where: { barcode: req.body.barcode } })
        .then(productAlreadyExist => {
            if (productAlreadyExist !== null) {
                res.status(400).json({
                    error: "A product with this barcode already exists.",
                    productId: productAlreadyExist.id,
                })
            } else {
                const product = req.body;
                const photo = req.file ? `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}` : null;
                product.name = product.name;
                product.photo = photo;
                product.inStock = product.quantity;
                product.quantitySold = 0;
                product.price = Number(product.price).toFixed(2);
                product.cost = Number(product.cost).toFixed(2);

                if (product.discount === '') {
                    product.discount === 0;
                }

                if (product.discount === 0) {
                    product.priceAfterDiscount = product.price;
                } else {
                    product.priceAfterDiscount = Number(product.price - (product.price * (product.discount / 100))).toFixed(2);
                }

                Products.create(product)
                    .then((product) => {
                        res.status(201).json(product);
                    })
                    .catch((err) => {
                        res.status(500).json({ message: "Server error while adding the product !" });
                        console.log(err);
                    })
            }
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getAllProducts = async (req, res) => {
    await Products.findAll({ order: [['createdAt', 'DESC']] })
        .then((products) => {
            res.status(200).json(products);
        })
        .catch(err => {
            console.log(err);
            res.status(404).json({ error: "Product not found." })
        })
};

exports.getOneProduct = async (req, res) => {
    const productId = req.params.id;
    await Products.findByPk(productId)
        .then((product) => {
            if (product === null) {
                res.status(200).json({ Message: "Product not found" });
            } else {
                res.status(200).json(product);
            }
        })
        .catch((err) => {
            console.log(err);
        })
};

exports.getProductByBarcode = async (req, res) => {
    const barcode = req.params.barcode;
    await Products.findOne({ where: { barcode: barcode } })
        .then((product) => {
            if (!product) {
                res.status(404).json({ error: "Product not found." })
            } else {
                res.status(200).json(product);
            }
        })
        .catch((err) => {
            console.log(err);
        })
};

exports.getProductsSold = async (req, res) => {
    await Products.findAll({ raw: true })
        .then((products) => {
            if (!products.length) {
                res.status(404).json({ error: "Products not found." });
            } else {
                let productsSold = [];
                for (let i = 0; i < products.length; i++) {
                    if (products[i].quantitySold > 0) {
                        productsSold.push(products[i]);
                    }
                }
                res.status(200).json(productsSold);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ error: "Server error while getting products" });
        })
}

exports.updateProduct = async (req, res) => {
    const product = req.body;
    product.name = (product.name);
    product.price = Number(product.price).toFixed(2);
    product.cost = Number(product.cost).toFixed(2);
    product.inStock = product.quantity;
    const productId = req.params.id;
    let previousPhoto;

    if (product.discount === '' || product.discount === null) {
        product.discount === 0;
    }

    if (product.discount === 0) {
        product.priceAfterDiscount = product.price;
    } else {
        product.priceAfterDiscount = Number(product.price - (product.price * (product.discount / 100))).toFixed(2);
    }

    await Products.findByPk(productId)
        .then((response) => {
            let oldProduct = response.dataValues;
            if (oldProduct.photo) {
                previousPhoto = oldProduct.photo;
                previousPhoto = previousPhoto.split('/images/')[1];
                if (previousPhoto) {
                    if (req.file) {
                        const newPhoto = `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}`;
                        product.photo = newPhoto;
                        // console.log(product);
                        fs.unlinkSync(`images/${previousPhoto}`, (err => {
                            if (err) {
                                console.log(err);
                            }
                        }))
                    } else {
                        product.photo = `${req.protocol}://${req.get('host')}/api/images/${previousPhoto}`;
                    }
                    Products.update({ ...req.body }, { where: { id: productId } })
                        .then(newProduct => {
                            res.status(200).json(newProduct);
                        })
                        .catch(err => {
                            console.log(err);
                        })
                }
            } else {
                const photo = req.file ? `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}` : null;
                product.photo = photo;

                Products.update({ ...req.body }, { where: { id: productId } })
                    .then(newProduct => {
                        res.status(200).json(newProduct);
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        })
        .catch((err) => {
            console.log(err);
        })
};

exports.deleteProduct = async (req, res) => {
    const id = req.params.id;
    await Products.findByPk(id)
        .then(product => {
            product = product.dataValues
            if (product.photo) {
                const previousPhoto = product.photo.split('/images/')[1];
                if (previousPhoto) {
                    fs.unlinkSync(`images/${previousPhoto}`, (err => {
                        if (err) {
                            console.log(err);
                        }
                    }))
                }
            }
            Products.destroy({ where: { id: id } })
                .then(() => res.status(200).json({ message: "Product deleted." }))
                .catch(error => {
                    res.status(400).json(error);
                });
        })
        .catch(error => {
            res.status(500).json(error);
            console.log(error);
        })
}