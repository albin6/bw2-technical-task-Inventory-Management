import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/auth-components/LoginForm";
import SignupForm from "./components/auth-components/SignupForm";
import InventoryDashboard from "./components/InventoryDashboard";
import Layout from "./components/layout/Layout";

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
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<InventoryDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
