import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Register() {

    const navigate = useNavigate();

    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");

    const register = async ()=>{

        try{

            await axios.post(
                "https://todo-fullstack-qrvd.onrender.com/api/auth/register",
                {
                    email,
                    password
                }
            );

            alert("Registration Successful");

            navigate("/login");

        }
        catch(err){

            alert(err.response?.data?.message || "Registration Failed");

        }

    };

    return(

        <div className="page">

            <div className="card">

                <h1>To-Do List</h1>

                <h2>Register</h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                />

                <button onClick={register}>
                    Register
                </button>

                <p>
                    Already have an account?
                    <Link to="/login"> Login</Link>
                </p>

            </div>

        </div>

    );

}

export default Register;