const express = require("express");
const expensesCtrl = require("../controllers/expensesCtrl");
const auth = require("../middlewares/auth");
const validateExpenseRequest = require("../middlewares/validateExpenseRequest");
const router = express.Router();

router.post('/', auth, validateExpenseRequest, expensesCtrl.addExpense);
router.get('/', auth, expensesCtrl.getExpenses);
router.delete('/:id', auth, expensesCtrl.deleteExpense);

module.exports = router;
