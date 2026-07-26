import { useEffect, useState } from "react";
import axios from "axios";
import "./Todo.css";
const token = localStorage.getItem("token");
const email = localStorage.getItem("email");
function Todo() {

    const [task, setTask] = useState("");
    const [tasks, setTasks] = useState([]);

    const token = localStorage.getItem("token");

    const API = "https://todo-fullstack-qrvd.onrender.com/api/tasks";

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // Load tasks
    const getTasks = async () => {
        try {
            const res = await axios.get(API, config);
            setTasks(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getTasks();
    }, []);

    // Add task
    const addTask = async () => {

        if (task.trim() === "") return;

        try {

            await axios.post(
                API,
                {
                    text: task
                },
                config
            );

            setTask("");
            getTasks();

        } catch (err) {

            console.log(err);

        }

    };

    // Delete task
    const deleteTask = async (id) => {

        await axios.delete(
            `${API}/${id}`,
            config
        );

        getTasks();

    };

    // Toggle complete
    const toggleComplete = async (todo) => {

        await axios.put(
            `${API}/${todo._id}`,
            {
                completed: !todo.completed
            },
            config
        );

        getTasks();

    };

    // Edit task
    const editTask = async (todo) => {

        const newText = prompt(
            "Edit Task",
            todo.text
        );

        if (!newText) return;

        await axios.put(
            `${API}/${todo._id}`,
            {
                text: newText
            },
            config
        );

        getTasks();

    };

    // Logout
    const logout = () => {

        localStorage.removeItem("token");

        window.location.href = "/login";

    };

    return (

        <div className="container">

<div className="header">

    <div>

        <h1>My Tasks</h1>

        <p className="welcome">
            Welcome, {email}
        </p>

    </div>

    <button
        className="logout"
        onClick={logout}
    >
        Logout
    </button>

</div>

            <div className="input-section">

                <input
                    value={task}
                    placeholder="Enter Task..."
                    onChange={(e)=>setTask(e.target.value)}
                    onKeyDown={(e)=>{
                        if(e.key==="Enter"){
                            addTask();
                        }
                    }}
                />

                <button onClick={addTask}>
                    Add
                </button>

            </div>

            {
                tasks.length===0
                ?
                <p className="empty">
                    No Tasks Yet
                </p>
                :
                <ul>

                    {

                        tasks.map((todo)=>(

                            <li key={todo._id}>

                                <span
                                    className={
                                        todo.completed
                                        ?
                                        "completed"
                                        :
                                        ""
                                    }
                                >
                                    {todo.text}
                                </span>

                                <div>

                                    <button
                                        onClick={()=>
                                            toggleComplete(todo)
                                        }
                                    >
                                        {
                                            todo.completed
                                            ?
                                            "Undo"
                                            :
                                            "Done"
                                        }
                                    </button>

                                    <button
                                        onClick={()=>
                                            editTask(todo)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={()=>
                                            deleteTask(todo._id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            </li>

                        ))

                    }

                </ul>
            }

        </div>

    );

}

export default Todo;