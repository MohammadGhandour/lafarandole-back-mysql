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

    for (let productVariant of arrayOfSizes) {
        try {
            const productAlreadyExist = await Products.findOne({ raw: true, where: { barcode: productVariant.barcode } });
            if (productAlreadyExist !== null) {
                res.status(400).json({ error: "A product with this barcode already exists.", productId: productAlreadyExist.id })
                break;
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
                    product.discount = 0;
                }
                if (product.discount === 0) {
                    product.priceAfterDiscount = product.price;
                } else {
                    product.priceAfterDiscount = Number(product.price - (product.price * (product.discount / 100))).toFixed(2);
                }

                try {
                    await Products.create(product);
                    numberOfSuccessfullyAddedProducts++;
                    if (numberOfSuccessfullyAddedProducts === arrayOfSizes.length) res.status(201).json(product);
                } catch (error) {
                    res.status(500).json({ message: "Server error while adding the product !" });
                    console.log(error);
                    break;
                }
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
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
                    { name: { [Op.and]: searchParams.split(' ').map(word => ({ [Op.like]: `%${word}%` })) } },
                    { brand: { [Op.like]: `%${searchParams}%` } },
                    { description: { [Op.like]: `%${searchParams}%` } },
                    { barcode: { [Op.like]: `%${searchParams}%` } },
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
    // return console.log(product);
    product.name = (product.name);
    product.price = Number(product.price).toFixed(2);
    product.cost = Number(product.cost).toFixed(2);
    product.inStock = product.quantity;
    const productId = req.params.id;
    let previousPhoto;

    if (product.discount === '' || product.discount === null) {
        product.discount = 0;
    }

    if (product.discount === 0) {
        product.priceAfterDiscount = product.price;
    } else {
        product.priceAfterDiscount = Number(product.price - (product.price * (product.discount / 100))).toFixed(2);
    }

    const oldProduct = Products.findByPk(productId, { raw: true });
    if (oldProduct) {
        if (oldProduct.photo) {
            try {
                previousPhoto = oldProduct.photo;
                previousPhoto = previousPhoto.split('/images/')[1];
                if (previousPhoto) {
                    if (req.file) {
                        const newPhoto = `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}`;
                        product.photo = newPhoto;
                        fs.unlinkSync(`images/${previousPhoto}`, (err => { if (err) { console.log(err) } }))
                    } else {
                        product.photo = oldProduct.photo;
                    }
                    Products.update({ ...req.body }, { where: { id: productId } })
                    res.status(200).json("Ok");
                }
            } catch (error) {
                console.log(error);
                res.status(500).json(error);
            }
        } else {
            try {
                const photo = req.file ? `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}` : null;
                product.photo = photo;

                Products.update({ ...req.body }, { where: { id: productId } })
                res.status(200).json("Ok.");
            } catch (error) {
                console.log(error);
                res.status(500).json(error);
            }
        }
    } else {
        res.status(404).json("Product not found");
    }
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
};

exports.exportProducts = async (req, res) => {
    try {
        const products = (await Products.findAll({ raw: true, where: { gender: { [Op.not]: "Women" } }, order: [["createdAt", "ASC"]] })).filter(o => !barcodesToDelete.includes(o.barcode));
        const final = [];
        for (let product of products) {
            const { name, quantity, category, brand, gender, size, barcode, price, priceAfterDiscount, cost, id } = product;

            const finalProducts = {
                "id": id,
                "Handle": `${brand}-${name.toLowerCase().split(" ").join("-")}-${price}`,
                "Title": `${toCapitalizedWords(name)}`,
                "Body (HTML)": "",
                "Vendor": "La Farandole Paris",
                "Product Category": "Apparel & Accessories > Clothing",
                "Type": category,
                "Tags": `${brand}, ${gender}`,
                "Published": "FALSE",
                "Option1 Name": "Size",
                "Option1 Value": size,
                "Option2 Name": "",
                "Option2 Value": "",
                "Option3 Name": "",
                "Option3 Value": "",
                "Variant SKU": barcode,
                "Variant Inventory Tracker": "shopify",
                "Variant Inventory Qty": Number(quantity),
                "Variant Inventory Policy": "deny",
                "Variant Fulfillment Service": "manual",
                "Variant Price": Number(priceAfterDiscount),
                "Variant Compare At Price": Number(price),
                "Variant Requires Shipping": "TRUE",
                "Variant Taxable": "TRUE",
                "Variant Barcode": barcode,
                "Gift Card": "FALSE",
                "Cost per item": Number(cost),
                "Price / International": Number(priceAfterDiscount),
                "Compare At Price / International": Number(price),
                "Status": "active"
            };

            final.push(finalProducts);
        };

        // const repetitive = [];

        // for (let product of final) {
        //     const exists = final.find(o => o.Handle === product.Handle && o.id !== product.id);
        //     const existsInRepetitive = repetitive.find(o => o.Handle === product.Handle);
        //     if (exists || existsInRepetitive) repetitive.push(product);
        // };
        // console.log({ final: final.length, repetitive: repetitive.length });
        console.log(final.length);
        res.status(200).json(final.map(o => {
            delete o.id;
            return o;
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};

function toCapitalizedWords(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const barcodesToDelete = [
    "0111124336",
    "0011112822",
    "0011113058",
    "0011113041",
    "0111126545",
    "0111126538",
    "0111126521",
    "0111126514",
    "0111126491",
    "0111126507",
    "0111114870",
    "0111114856",
    "0111114863",
    "0011112730",
    "0011112747",
    "0011112761",
    "0111115044",
    "0111115037",
    "0111115020",
    "0111115013",
    "0011112716",
    "0011112723",
    "0011112693",
    "0011112709",
    "0111115068",
    "0111115051",
    "0111125586",
    "0111125593",
    "0111125609",
    "0111125616",
    "0111125623",
    "0011114345",
    "0011113874",
    "0011113881",
    "0011114246",
    "0011114239",
    "0011114222",
    "011114086",
    "0011114215",
    "0011113942",
    "0011114277",
    "0011114284",
    "0011114314",
    "0011114321",
    "0011114338",
    "0011114154",
    "0011114161",
    "0011114178",
    "0111121137",
    "0011113911",
    "0011113874",
    "0011113881",
    "0011114123",
    "0011114116",
    "0011113805",
    "0011113812",
    "0111121533",
    "0111123063",
    "0111123056",
    "0111123018",
    "0111123032",
    "0111123025",
    "0111122998",
    "0111123001",
    "0111122981",
    "0111119813",
    "0111119820",
    "0111121564",
    "0111121557",
    "0111121303",
    "0111121311",
    "0111121328",
    "0111121335",
    "0111121816",
    "111121830",
    "0011113645",
    "0011113652",
    "0011113713",
    "0111120932",
    "0111120925",
    "011113393",
    "0111120376",
    "0111120383",
    "0111120352",
    "0111120772",
    "0111120765",
    "0111126002",
    "0011114055",
    "0011114062",
    "0011114079",
    "0011114031",
    "0111126552",
    "0111126699",
    "0111126682",
    "0111126675",
    "0111126668",
    "0111126651",
    "0111126422",
    "0111126415",
    "0111126408",
    "0111126460",
    "0111126453",
    "0111126446",
    "0111125753",
    "0111125760",
    "0111124558",
    "0111126712",
    "0111121366",
    "0111114917",
    "0111114900",
    "0111126026",
    "0111126033",
    "0011113614",
    "0011113621",
    "0111125548",
    "0111125517",
    "0111121403",
    "0111121410",
    "0111121427",
    "0111122042",
    "0111122035",
    "0111119417",
    "0111119394",
    "0111119363",
    "0111119370",
    "0111119387",
    "0111126101",
    "0111126095",
    "0111126088",
    "0111124930",
    "0111124947",
    "0111120130",
    "0111120147",
    "0111120123",
    "0111120154",
    "0111120178",
    "0111120161",
    "0011113034",
    "0011114475",
    "0011114482",
    "0111120208",
    "0111120192",
    "0111120185",
    "0111126200",
    "0111126194",
    "0111126262",
    "0111126248",
    "0111126231",
    "0111126224",
    "0111120758",
    "0111120741",
    "0111120734",
    "0011114017",
    "0011114000",
    "0011113997",
    "0111126064",
    "0111126071",
    "0111122004",
    "0111126156",
    "0111126170",
    "0111126187",
    "0111126736",
    "0111126743",
    "0111126750",
    "0111126767",
    "0111122646",
    "0111122653",
    "0111122639",
    "0111122691",
    "0111122707",
    "0011112884",
    "0011112891",
    "0011112907",
    "0011112914",
    "0111122738",
    "0111122721",
    "0111121007",
    "0111121021",
    "1234567116",
    "1234567819",
    "0111125739",
    "0111125722",
    "1111126443",
    "1111126450",
    "1111127129",
    "1111127136",
    "0111121991",
    "0111121977",
    "011113270",
    "0111117277",
    "0111120215",
    "0111120222",
    "0111126118",
    "0111126149",
    "0111120413",
    "0111120406",
    "0111120659",
    "0111120642",
    "0011113768",
    "0011113775",
    "0111121595",
    "0111121601",
    "0111125319",
    "1111127235",
    "1111127242",
    "0111121519",
    "0111125791",
    "0111125784",
    "0111125777",
    "0111114849",
    "0111114832",
    "0111114801",
    "011113386",
    "0111125227",
    "0111122073",
    "0111122097",
    "0111125890",
    "0111125883",
    "0111125876",
    "011114444",
    "0111126378",
    "01111129307",
    "01111129222",
    "01111129239",
    "1111113009",
    "1111112989",
    "0011114383",
    "0011114390",
    "0011114406",
    "0011114413",
    "0111122820",
    "0111122813",
    "0111122806",
    "0111126828",
    "0111126798",
    "0111126774",
    "0111126781",
    "0111114436",
    "0111114443",
    "0111122288",
    "0111122288",
    "0111122288",
    "0111122288",
    "0111122288",
    "0111122288",
    "0111122264",
    "0111122264",
    "0111122271",
    "0111122271",
    "0111122271"
];