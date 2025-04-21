import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Router>
        <Toaster />
        <AppRoute />
      </Router>
    </>
  );
}

export default App;

function AppRoute() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogout = () => {
    console.log("User logged out");
    setIsLoggedIn(false);
    localStorage.removeItem("user");
    navigate("/");
  };
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        element={
          <AppLayout
            isLoggedIn={isLoggedIn}
            userName="John Doe"
            onLogout={handleLogout}
          />
        }
      >
        <Route path="/dashboard" element={<h2>Test Route</h2>} />
      </Route>
    </Routes>
  );
}
