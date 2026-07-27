import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/register";
import Todo from "./pages/Todo";

function App() {

    const token = localStorage.getItem("token");

    return (

        <BrowserRouter basename="/todolist">

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/todo"
                    element={
                        token
                            ? <Todo />
                            : <Navigate to="/login" />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to={token ? "/todo" : "/login"}
                        />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}

export default App;