const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const usersCtrl = require('../controllers/usersCtrl');

router.post('/login', usersCtrl.login);
router.post('/register', usersCtrl.register);
router.get('/', usersCtrl.getUsers);
router.get('/hash', usersCtrl.hash);
router.get('/:id', auth, usersCtrl.getOneUser);

module.exports = router;