const express = require("express");
const expensesCtrl = require("../controllers/expensesCtrl");
const auth = require("../middlewares/auth");
const validateExpenseRequest = require("../middlewares/validateExpenseRequest");
const router = express.Router();

router.post('/', auth, validateExpenseRequest, expensesCtrl.addExpense);
router.get('/', auth, expensesCtrl.getExpenses);
// router.get('/:customerName', auth, expensesCtrl.getCustomerOrders);

module.exports = router;
