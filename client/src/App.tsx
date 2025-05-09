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
import InventoryPage from "./pages/InventoryPage";
import { CustomerPage } from "./pages/CustomerPage";
import SalesModule from "./components/SalesModule";
import ReportsPage from "./pages/ReportsPage";
import SalesReportExport from "./components/SalesReportExport";

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
        <Route path="/dashboard">
          <Route index element={<h1>Test Route</h1>} />
          <Route path="customers" element={<CustomerPage />} />
          <Route path="inventory" element={<InventoryPage />} />
        </Route>
        <Route path="/sales" element={<SalesModule />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/exports" element={<SalesReportExport />} />
      </Route>
    </Routes>
  );
}
