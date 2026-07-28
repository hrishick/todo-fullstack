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

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword
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

        const user = await User.findOne({ email });

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
            email: user.email
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    UPDATE PROFILE (EMAIL / PASSWORD)
*/
router.put("/profile", auth, async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check if email is being changed and if it is taken by another user
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

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters"
                });
            }
            user.password = await bcrypt.hash(password, 10);
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
            email: user.email
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

module.exports = router;