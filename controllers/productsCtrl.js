const { Products } = require('../models');
const fs = require('fs');
const { Op } = require("sequelize");

exports.addProduct = async (req, res) => {
    const arrayOfSizes = JSON.parse(req.body.arrayOfSizes);

    const productOriginalBarcode = req.body.barcode;
    const productOriginalSize = req.body.size;
    const productOriginalQuantity = req.body.quantity;

    const productOriginalSizeBarcode = { size: productOriginalSize, barcode: productOriginalBarcode, quantity: productOriginalQuantity };
    arrayOfSizes.push(productOriginalSizeBarcode);

    let numberOfSuccessfullyAddedProducts = 0;

    arrayOfSizes.map(productVariant => {
        Products.findOne({ where: { barcode: productVariant.barcode } })
            .then(productAlreadyExist => {
                if (productAlreadyExist !== null) {
                    return res.status(400).json({
                        error: "A product with this barcode already exists.",
                        productId: productAlreadyExist.id,
                    })
                } else {
                    const product = req.body;
                    const photo = req.file ? `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}` : null;
                    product.name = product.name;
                    product.photo = photo;
                    product.quantity = productVariant.quantity;
                    product.quantitySold = 0;
                    product.inStock = productVariant.quantity;
                    product.price = Number(product.price).toFixed(2);
                    product.cost = Number(product.cost).toFixed(2);
                    product.barcode = productVariant.barcode;
                    product.size = productVariant.size;

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
                            numberOfSuccessfullyAddedProducts++;
                            if (numberOfSuccessfullyAddedProducts === arrayOfSizes.length) res.status(201).json(product);
                            else return
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
    })
};

exports.getAllProducts = async (req, res) => {
    let {
        page,
        searchParams,
        offset,
        limit,
        filters
    } = req.query;
    if (Number(page) === 1) { offset = 0 }
    else offset = Number(page - 1) * Number(limit);

    let where = {};
    const arrayOfFilters = [];

    if (filters) {
        filters = JSON.parse(filters);
        const gender = filters.filter(filter => filter.key === "gender");
        const brand = filters.filter(filter => filter.key === "brand");
        const category = filters.filter(filter => filter.key === "category");
        const size = filters.filter(filter => filter.key === "size");

        if (gender.length > 0) {
            arrayOfFilters.push(
                {
                    [Op.or]: gender.map(filter => ({
                        [Op.and]: [
                            { gender: filter.value }
                        ]
                    }))
                }
            )
        }
        if (brand.length > 0) {
            arrayOfFilters.push(
                {
                    [Op.or]: brand.map(filter => ({
                        [Op.and]: [
                            { brand: filter.value }
                        ]
                    }))
                }
            )
        }
        if (category.length > 0) {
            arrayOfFilters.push(
                {
                    [Op.or]: category.map(filter => ({
                        [Op.and]: [
                            { category: filter.value }
                        ]
                    }))
                }
            )
        }
        if (size.length > 0) {
            arrayOfFilters.push(
                {
                    [Op.or]: size.map(filter => ({
                        [Op.and]: [
                            { size: filter.value }
                        ]
                    }))
                }
            )
        }
    };

    if (searchParams) {
        arrayOfFilters.push(
            {
                [Op.or]: [
                    {
                        name: {
                            [Op.like]: `%${searchParams}%`
                        }
                    },
                    {
                        brand: {
                            [Op.like]: `%${searchParams}%`
                        }
                    },
                    {
                        description: {
                            [Op.like]: `%${searchParams}%`
                        }
                    },
                ]
            }
        )
    }
    where = { [Op.and]: arrayOfFilters }
    await Products.findAndCountAll({
        where,
        raw: true,
        limit: Number(limit),
        offset: offset,
        order: [['createdAt', 'DESC']]
    })
        .then(response => {
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        })
};

exports.getOneProduct = async (req, res) => {
    const productId = req.params.id;
    await Products.findByPk(productId)
        .then((product) => {
            if (product === null) {
                res.status(404).json({ error: "Product not found" });
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

exports.alterAllProducts = async (req, res) => {
    const brands = [
        "babydola",
        "nipperland",
        "leoking",
        "andywawa",
        "tongs",
        "minibubbles",
        "minora",
        "bebus",
        "mixbabi",
        "toysi",
        "tafyy",
        "kts",
        "tiwinti",
        "msc",
        "belemir",
        "ladi",
        "miomini",
        "minipodyum",
        "eraykids",
        "babymy",
        "diab",
        "eleysa",
        "albadi",
        "beren",
        "yavrucak",
        "blackone",
        "yuko",
        "mondo",
        "roya",
        "lemon",
        "ecolkiz",
        "bebessi",
        "eray",
        "ness",
        "funny",
        "uzun",
        "mspn",
        "taskids",
        "corpi",
        "nirvana",
        "minicool",
        "h&m",
        "monnarosa",
        "adn",
        "mtn",
        "bln",
        "qumru",
        "laderra",
        "pilise",
        "moda",
        "newlenza",
        "meristore",
        "newmission",
        "levure",
        "benin",
        "bgn",
        "miss",
        "avrile",
        "biskuvi",
        "quqa",
        "turkmoda",
        "sorez",
        "pucka",
        "ramrod",
        "aynaz",
        "asist",
        "femkai",
        "nike",
        "adidas",
        "basicpark",
        "missron",
        "hatunatila",
        "toymall",
        "donino",
        "limones",
        "emins",
        "panda",
        "bignile",
        "fame",
        "kadriye",
        "nevermore"
    ]
    console.log('hey');

    await Products.findAll({ raw: true }, { order: [['createdAt', 'ASC']] })
        .then(products => {
            products.forEach(product => {
                if (product.brand === '' || product.brand === null) {
                    Products.update(
                        { brand: brands.includes(product.name.split(' ')[0]) ? product.name.split(' ')[0] : '' },
                        { where: { id: product.id } }
                    )
                        .then(newProduct => { })
                        .catch(err => {
                            console.log(err);
                        })
                }
            });
            // const unbrandedProducts = products.filter(product => product.brand === '');
            // console.log(unbrandedProducts.length);
            res.status(200).json(products);
        })
        .catch(err => {
            console.log(err);
        })
}