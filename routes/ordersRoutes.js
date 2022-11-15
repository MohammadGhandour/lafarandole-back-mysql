const express = require("express");
const ordersCtrl = require("../controllers/ordersCtrl");
const auth = require("../middlewares/auth");
const router = express.Router();

router.post('/', auth, ordersCtrl.postOrder);
router.put('/:id', auth, ordersCtrl.updateOrder);
router.get('/', auth, ordersCtrl.getOrders);
router.get('/chart', auth, ordersCtrl.getOrdersForChart);
router.get('/:id', auth, ordersCtrl.getOrder);
router.get('/customerOrders/:customerNumber', auth, ordersCtrl.getCustomerOrders);
router.put('/orderStatus/:id', auth, ordersCtrl.updateOrderStatus);

module.exports = router;
