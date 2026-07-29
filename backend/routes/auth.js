const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

/*
    REGISTER
*/
router.post("/register", async (req, res) => {

    try {

        const {
            email,
            password,
            userSalt,
            encryptedMasterKeyPassword,
            encryptedMasterKeyRecovery,
            encryptedRecoveryKey
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            userSalt: userSalt || null,
            encryptedMasterKeyPassword: encryptedMasterKeyPassword || null,
            encryptedMasterKeyRecovery: encryptedMasterKeyRecovery || null,
            encryptedRecoveryKey: encryptedRecoveryKey || null
        });

        await user.save();

        res.status(201).json({
            message: "Registration Successful"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    LOGIN
*/
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Email or Password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Email or Password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login Successful",
            token,
            email: user.email,
            userSalt: user.userSalt,
            encryptedMasterKeyPassword: user.encryptedMasterKeyPassword,
            encryptedMasterKeyRecovery: user.encryptedMasterKeyRecovery,
            encryptedRecoveryKey: user.encryptedRecoveryKey
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    UPDATE PROFILE (EMAIL / PASSWORD / KEYS)
*/
router.put("/profile", auth, async (req, res) => {

    try {

        const {
            email,
            password,
            encryptedMasterKeyPassword,
            encryptedMasterKeyRecovery,
            encryptedRecoveryKey
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: req.user.id }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: "Email is already in use"
                });
            }

            user.email = email.toLowerCase();
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters"
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        if (encryptedMasterKeyPassword) {
            user.encryptedMasterKeyPassword = encryptedMasterKeyPassword;
        }

        if (encryptedMasterKeyRecovery) {
            user.encryptedMasterKeyRecovery = encryptedMasterKeyRecovery;
        }

        if (encryptedRecoveryKey) {
            user.encryptedRecoveryKey = encryptedRecoveryKey;
        }

        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Profile updated successfully",
            token,
            email: user.email,
            userSalt: user.userSalt,
            encryptedMasterKeyPassword: user.encryptedMasterKeyPassword,
            encryptedMasterKeyRecovery: user.encryptedMasterKeyRecovery,
            encryptedRecoveryKey: user.encryptedRecoveryKey
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    ZERO-KNOWLEDGE ACCOUNT RECOVERY RESET
*/
router.post("/recover-account", async (req, res) => {

    try {

        const {
            email,
            newPassword,
            newEncryptedMasterKeyPassword
        } = req.body;

        if (!email || !newPassword || !newEncryptedMasterKeyPassword) {
            return res.status(400).json({
                message: "Email, new password, and re-wrapped key are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                message: "User account not found"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.encryptedMasterKeyPassword = newEncryptedMasterKeyPassword;

        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Account recovered successfully",
            token,
            email: user.email,
            userSalt: user.userSalt,
            encryptedMasterKeyPassword: user.encryptedMasterKeyPassword,
            encryptedMasterKeyRecovery: user.encryptedMasterKeyRecovery
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    DELETE ACCOUNT & CASCADE DELETE TASKS
*/
router.delete("/account", auth, async (req, res) => {

    try {

        // Delete all tasks belonging to the user
        await Task.deleteMany({ user: req.user.id });

        // Delete user account
        await User.findByIdAndDelete(req.user.id);

        res.json({
            message: "Account and associated tasks deleted successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

/*
    FETCH PUBLIC KEY PARAMS FOR ZERO-KNOWLEDGE RECOVERY / LOGIN
*/
router.post("/user-key-params", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email address is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                message: "User account not found"
            });
        }

        res.json({
            userSalt: user.userSalt,
            encryptedMasterKeyRecovery: user.encryptedMasterKeyRecovery
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

module.exports = router;