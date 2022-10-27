const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, 'PDQ8v94SswOcgMnqlUTd');
            const userId = decodedToken.userId;
            req.auth = { userId };

            if (req.body.userId && req.body.userId !== userId) {
                throw 'User ID non valable !';
            } else {
                next();
            }
        } else {
            res.status(401).json({ error: "You're not authorized 😡" })
        }
    } catch (error) {
        res.status(401).json({ error: error | 'Requête non authentifiée !' });
        console.log(error);
    }
}
