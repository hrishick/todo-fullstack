import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Todo from "./pages/Todo";

function AppContent() {
  const token = localStorage.getItem("token");

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/todo"
          element={token ? <Todo /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;