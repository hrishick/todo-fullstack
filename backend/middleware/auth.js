const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {

    try {

        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                message: "Access Denied"
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const verified = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = verified;

        next();

    } catch (err) {

        res.status(401).json({
            message: "Invalid Token"
        });

    }

};

module.exports = auth;