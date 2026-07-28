const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    category: {
        type: String,
        enum: ["Work", "Personal", "Shopping", "General"],
        default: "General"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Task", taskSchema);