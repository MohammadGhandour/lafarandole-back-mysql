const { Users } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Orders } = require("../models");
const { Op } = require("sequelize");
require('dotenv').config();

exports.register = async (req, res) => {
    const { username, password } = req.body;

    const userId = req.params.userId;
    await Users.findByPk(userId)
        .then(user => {
            if (user == null) {
                bcrypt.hash(password, 10)
                    .then((hash) => {
                        Users.create({ username: username, password: hash, admin: 0 })
                            .then((user) => {
                                res.status(201).json({
                                    username: user.username,
                                    userId: user.id,
                                    token: jwt.sign(
                                        { userId: user.id },
                                        process.env.RANDOM_TOKEN,
                                        { expiresIn: '365d' }
                                    )
                                });
                            })
                            .catch((err) => {
                                console.log(err);
                                if (err.errors[0].message === 'username must be unique') {
                                    res.status(400).json({ error: "This username is already in use" });
                                } else {
                                    res.status(500).json({ error: "Server error while creating a user !" });
                                }
                            })
                    })
            } else {
                res.status(404).json({ error: "User already exists." });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Couldn't find user" + err })
        })
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    await Users.findOne({ where: { username: username } })
        .then((user) => {
            if (user == null) {
                res.status(404).json({ error: "User doesn't exist !" })
            } else {
                bcrypt.compare(password, user.password)
                    .then((valid) => {
                        if (!valid) {
                            res.status(400).json({ error: "Incorrect passwrod" })
                        } else {
                            res.status(200).json({
                                username: user.username,
                                userId: user.id,
                                admin: user.admin,
                                token: jwt.sign(
                                    { userId: user.id },
                                    process.env.RANDOM_TOKEN,
                                    { expiresIn: '365d' }
                                )
                            })
                        }
                    })
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(401).json({ error: "Something went wrong with our end. " + err })
        })
};

exports.getUsers = async (req, res) => {
    await Users.findAll({})
        .then((users) => {
            if (!users) {
                res.status(404).json({ error: "There is no users." })
            } else {
                res.status(200).json(users);
            }
        })
        .catch((err) => {
            res.status(404).json({ error: "Couldn't find user with id: " + userId })
        })
};

exports.getOneUser = async (req, res) => {
    const usersOrdersSold = await Orders.findAll({ raw: true, where: { salesperson_id: req.params.id } });
    res.status(200).json(usersOrdersSold);
}