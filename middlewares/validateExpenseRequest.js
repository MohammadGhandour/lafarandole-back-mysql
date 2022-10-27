module.exports = (req, res, next) => {
    const expense = req.body;
    const expenseValue = expense.expenseValue;
    const currency = expense.currency;
    const currencyExchange = expense.currencyExchange;
    const category = expense.category;

    console.log(expenseValue);

    let emptyFields = [];

    if (expenseValue === '' || expenseValue < 0.1) {
        emptyFields.push("expenseValue");
    }
    if (currency === '' || currency === 0) {
        emptyFields.push("currency");
    }
    if (currency === 'LBP' && currencyExchange === 0) {
        emptyFields.push("currencyExchange");
    }
    if (category === '' || category === 0 || category === undefined) {
        emptyFields.push("category");
    }

    if (emptyFields.length > 0) {
        res.status(400).json({ error: `Please fill all the fields.`, emptyFields })
    } else {
        next();
    }
}
