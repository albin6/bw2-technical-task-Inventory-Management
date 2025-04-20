import React, { useState } from "react";
import { Package, ShoppingCart, BarChart2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory");
  const [expandedSubmenu, setExpandedSubmenu] = useState("");

  const toggleSubmenu = (menu: React.SetStateAction<string>) => {
    if (expandedSubmenu === menu) {
      setExpandedSubmenu("");
    } else {
      setExpandedSubmenu(menu);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* App Title */}
        <div className="p-4 bg-gray-900">
          <h1 className="text-xl font-bold">Inventory System</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {/* Inventory Management */}
            <li>
              <button
                onClick={() => {
                  setActiveTab("inventory");
                  toggleSubmenu("inventory");
                  navigate("/dashboard");
                }}
                className={`flex items-center w-full p-3 hover:bg-gray-700 ${
                  activeTab === "inventory" ? "bg-gray-700" : ""
                }`}
              >
                <Package size={20} className="mr-3" />
                <span>Inventory Management</span>
              </button>

              {/* {expandedSubmenu === "inventory" && (
                <ul className="bg-gray-700 pl-10">
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Plus size={16} className="mr-2" />
                      <span>Add Items</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <List size={16} className="mr-2" />
                      <span>Manage Items</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Search size={16} className="mr-2" />
                      <span>Search Items</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Users size={16} className="mr-2" />
                      <span>Manage Customers</span>
                    </button>
                  </li>
                </ul>
              )} */}
            </li>

            {/* Sales */}
            <li>
              <button
                onClick={() => {
                  setActiveTab("sales");
                  toggleSubmenu("sales");
                  navigate("/sales");
                }}
                className={`flex items-center w-full p-3 hover:bg-gray-700 ${
                  activeTab === "sales" ? "bg-gray-700" : ""
                }`}
              >
                <ShoppingCart size={20} className="mr-3" />
                <span>Sales</span>
              </button>

              {/* {expandedSubmenu === "sales" && (
                <ul className="bg-gray-700 pl-10">
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Plus size={16} className="mr-2" />
                      <span>New Sale</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <List size={16} className="mr-2" />
                      <span>View Sales</span>
                    </button>
                  </li>
                </ul>
              )} */}
            </li>

            {/* Reports */}
            <li>
              <button
                onClick={() => {
                  setActiveTab("reports");
                  toggleSubmenu("reports");
                  navigate("/reports");
                }}
                className={`flex items-center w-full p-3 hover:bg-gray-700 ${
                  activeTab === "reports" ? "bg-gray-700" : ""
                }`}
              >
                <BarChart2 size={20} className="mr-3" />
                <span>Reports</span>
              </button>

              {/* {expandedSubmenu === "reports" && (
                <ul className="bg-gray-700 pl-10">
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <ShoppingCart size={16} className="mr-2" />
                      <span>Sales Report</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Package size={16} className="mr-2" />
                      <span>Items Report</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <FileText size={16} className="mr-2" />
                      <span>Customer Ledger</span>
                    </button>
                  </li>
                </ul>
              )} */}
              {/* {expandedSubmenu === "reports" && (
                <ul className="bg-gray-700 pl-10">
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <ShoppingCart size={16} className="mr-2" />
                      <span>Sales Report</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Package size={16} className="mr-2" />
                      <span>Items Report</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <FileText size={16} className="mr-2" />
                      <span>Customer Ledger</span>
                    </button>
                  </li>
                </ul>
              )} */}
            </li>

            {/* Data Export */}
            <li>
              <button
                onClick={() => {
                  setActiveTab("export");
                  toggleSubmenu("export");
                  navigate("/export");
                }}
                className={`flex items-center w-full p-3 hover:bg-gray-700 ${
                  activeTab === "export" ? "bg-gray-700" : ""
                }`}
              >
                <FileText size={20} className="mr-3" />
                <span>Data Export</span>
              </button>

              {/* {expandedSubmenu === "export" && (
                <ul className="bg-gray-700 pl-10">
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Printer size={16} className="mr-2" />
                      <span>Print</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <FileSpreadsheet size={16} className="mr-2" />
                      <span>Excel</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <File size={16} className="mr-2" />
                      <span>PDF</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-2 hover:bg-gray-600">
                      <Mail size={16} className="mr-2" />
                      <span>Email</span>
                    </button>
                  </li>
                </ul>
              )} */}
            </li>
          </ul>
        </nav>

        {/* User Info / Logout */}
        <div className="p-4 bg-gray-900">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-500 mr-2"></div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <button className="text-xs text-gray-400 hover:text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 bg-gray-100 p-6">
        <h2 className="text-2xl font-bold mb-4">
          {activeTab === "inventory" && "Inventory Management"}
          {activeTab === "sales" && "Sales"}
          {activeTab === "reports" && "Reports"}
          {activeTab === "export" && "Data Export"}
        </h2>
        <div className="bg-white rounded shadow p-4">
          <p className="text-gray-600">
            Select an option from the sidebar to view content
          </p>
        </div>
      </div>
    </div>
  );
}
