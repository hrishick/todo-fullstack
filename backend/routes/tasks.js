const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

/*
    GET ALL TASKS
*/
router.get("/", auth, async (req, res) => {

    try {

        const tasks = await Task.find({
            user: req.user.id
        });

        res.json(tasks);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    ADD TASK
*/
router.post("/", auth, async (req, res) => {

    try {

        const { text } = req.body;

        const task = new Task({
            text,
            user: req.user.id
        });

        await task.save();

        res.status(201).json(task);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    UPDATE TASK
*/
router.put("/:id", auth, async (req, res) => {

    try {

        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        task.text = req.body.text ?? task.text;

        if (req.body.completed !== undefined) {
            task.completed = req.body.completed;
        }

        await task.save();

        res.json(task);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


/*
    DELETE TASK
*/
router.delete("/:id", auth, async (req, res) => {

    try {

        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task Deleted"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

module.exports = router;