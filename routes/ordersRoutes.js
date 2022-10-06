const express = require("express");
const ordersCtrl = require("../controllers/ordersCtrl");
const auth = require("../middlewares/auth");
const router = express.Router();

router.post('/', auth, ordersCtrl.postOrder);
router.get('/', auth, ordersCtrl.getOrders);
router.get('/chart', auth, ordersCtrl.getOrdersForChart);
router.get('/:id', auth, ordersCtrl.getOrder);
router.get('/customerOrders/:customerNumber', auth, ordersCtrl.getCustomerOrders);

module.exports = router;