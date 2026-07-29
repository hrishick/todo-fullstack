const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userSalt: {
        type: String,
        default: null
    },
    encryptedMasterKeyPassword: {
        type: String,
        default: null
    },
    encryptedMasterKeyRecovery: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model("User", userSchema);