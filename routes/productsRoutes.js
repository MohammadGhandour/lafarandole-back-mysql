const express = require("express");
const productsCtrl = require("../controllers/productsCtrl");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer");
const validateProductRequest = require("../middlewares/validateProductRequest");
const router = express.Router();

router.post('/', auth, multer, validateProductRequest, productsCtrl.addProduct);
router.get('/', auth, productsCtrl.getAllProducts);
router.get('/:id', auth, productsCtrl.getOneProduct);
router.get('/product-by-barcode/:barcode', auth, productsCtrl.getProductByBarcode);
router.put('/:id', auth, multer, validateProductRequest, productsCtrl.updateProduct);
router.delete('/:id', auth, productsCtrl.deleteProduct);

module.exports = router;
