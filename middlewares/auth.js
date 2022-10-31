const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.RANDOM_TOKEN);
            const userId = decodedToken.userId;
            req.auth = { userId };

            if (req.body.userId && req.body.userId !== userId) {
                throw 'User ID non valable !';
            } else {
                next();
            }
        } else {
            res.status(401).json({ error: "Through a series of highly sophisticated and complex algorithms, this system has determined that you are not presently authorized to use this system function. It could be that you simply mistyped a password, or, it could be that you are some sort of interplanetary alien-being that has no hands and, thus, cannot type. If I were a gambler, I would bet that a cat (an orange tabby named Sierra or Harley) somehow jumped onto your keyboard and forgot some of the more important pointers from those typing lessons you paid for. Based on the actual error encountered, I would guess that the feline in question simply forgot to place one or both paws on the appropriate home keys before starting. Then again, I suppose it could have been a keyboard error caused by some form of cosmic radiation; this would fit nicely with my interplanetary alien-being theory. If you think this might be the cause, perhaps you could create some sort of underground bunker to help shield yourself from it. I don't know that it will work, but, you will probably feel better if you try something." })
        }
    } catch (error) {
        res.status(401).json({ error: "Through a series of highly sophisticated and complex algorithms, this system has determined that you are not presently authorized to use this system function. It could be that you simply mistyped a password, or, it could be that you are some sort of interplanetary alien-being that has no hands and, thus, cannot type. If I were a gambler, I would bet that a cat (an orange tabby named Sierra or Harley) somehow jumped onto your keyboard and forgot some of the more important pointers from those typing lessons you paid for. Based on the actual error encountered, I would guess that the feline in question simply forgot to place one or both paws on the appropriate home keys before starting. Then again, I suppose it could have been a keyboard error caused by some form of cosmic radiation; this would fit nicely with my interplanetary alien-being theory. If you think this might be the cause, perhaps you could create some sort of underground bunker to help shield yourself from it. I don't know that it will work, but, you will probably feel better if you try something." });
        console.log(error);
    }
}
