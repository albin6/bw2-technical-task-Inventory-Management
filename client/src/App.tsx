import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/auth-components/LoginForm";
import SignupForm from "./components/auth-components/SignupForm";
import InventoryDashboard from "./components/InventoryDashboard";

function App() {
  return (
    <>
      <AppLayout />
    </>
  );
}

export default App;

function AppLayout() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/dashboard" element={<InventoryDashboard />} />
      </Routes>
    </Router>
  );
}
