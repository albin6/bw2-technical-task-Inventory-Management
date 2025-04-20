import { useState, useEffect } from "react";
import { Search, Plus, Edit, Delete, UserPlus2 } from "lucide-react";
import {
  addInventoryItem,
  getAllInventoryItems,
} from "@/api/inventory.service";
import { addNewCustomer, getAllCustomers } from "@/api/customer.service";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, MenuProps } from "antd";
import { DownOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";

// Define types based on the API response structure
export type InventoryItem = {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type Customer = {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  email: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

// API response types
type InventoryResponse = {
  success: boolean;
  count: number;
  totalPages: number;
  currentPage: number;
  data: InventoryItem[];
};

type CustomerResponse = {
  success: boolean;
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
};

// Mock data for initial state - will be replaced by API data
const initialInventory: InventoryItem[] = [];
const initialCustomers: Customer[] = [];

export default function InventoryDashboard() {
  const navigate = useNavigate();
  // State for inventory items
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [filteredInventory, setFilteredInventory] =
    useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState("");

  // State for customers
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  // State for active view (inventory or customers)
  const [activeView, setActiveView] = useState<"inventory" | "customers">(
    "inventory"
  );

  // State for modal forms
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({
    name: "",
    description: "",
    quantity: 0,
    price: 0,
    category: "",
  });

  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    name: "",
    address: "",
    mobile: "",
    email: "",
  });

  // Simulating API fetch (replace with actual API calls)
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    // Fetch inventory data
    // This would be replaced with your actual API call
    const fetchInventory = async () => {
      try {
        // Mock API response - replace with actual API call
        const response: InventoryResponse = await getAllInventoryItems();

        if (response.success) {
          setInventory(response.data);
          setFilteredInventory(response.data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    // Fetch customer data
    const fetchCustomers = async () => {
      try {
        // Mock API response - replace with actual API call
        const response: CustomerResponse = await getAllCustomers();

        if (response.success) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchInventory();
    fetchCustomers();
  }, []);

  // Filter inventory items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInventory(inventory);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = inventory.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
      setFilteredInventory(filtered);
    }
  }, [searchQuery, inventory]);

  // Item form handlers
  const handleItemFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleItemSubmit = async () => {
    if (editingItem) {
      // Update existing item - in a real app, this would call an API
      setInventory((prev) =>
        prev.map((item) =>
          item._id === editingItem._id ? { ...editingItem, ...itemForm } : item
        )
      );
    } else {
      // Add new item - in a real app, this would call an API
      const newItem = {
        ...itemForm,
        _id: Math.random().toString(36).substr(2, 9),
        createdBy: "currentUserId",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      } as InventoryItem;
      try {
        const response = await addInventoryItem(itemForm as InventoryItem);
        console.log(response);
        setInventory((prev) => [...prev, newItem]);

        setItemForm({
          name: "",
          description: "",
          quantity: 0,
          price: 0,
          category: "",
        });
        setEditingItem(null);
        setIsItemModalOpen(false);
      } catch (error) {}
    }

    // Reset form and close modal
  };

  // Customer form handlers
  const handleCustomerFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSubmit = async () => {
    if (editingCustomer) {
      // Update existing customer - in a real app, this would call an API
      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === editingCustomer._id
            ? { ...editingCustomer, ...customerForm }
            : customer
        )
      );
    } else {
      // Add new customer - in a real app, this would call an API
      const newCustomer = {
        ...customerForm,
        _id: Math.random().toString(36).substr(2, 9),
        createdBy: "currentUserId",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      } as Customer;

      try {
        const response = await addNewCustomer(customerForm as Customer);
        console.log(response);
        setCustomers((prev) => [...prev, newCustomer]);
      } catch (error) {}
    }

    // Reset form and close modal
    setCustomerForm({ name: "", address: "", mobile: "", email: "" });
    setEditingCustomer(null);
    setIsCustomerModalOpen(false);
  };

  // Delete handlers
  const handleDeleteItem = (id: string) => {
    // In a real app, this would call an API
    setInventory((prev) => prev.filter((item) => item._id !== id));
  };

  const handleDeleteCustomer = (id: string) => {
    // In a real app, this would call an API
    setCustomers((prev) => prev.filter((customer) => customer._id !== id));
  };

  // Edit handlers
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      category: item.category,
    });
    setIsItemModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      email: customer.email,
    });
    setIsCustomerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 ${
                activeView === "inventory"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("inventory")}
            >
              Inventory
            </button>
            <button
              className={`py-4 px-1 ${
                activeView === "customers"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("customers")}
            >
              Customers
            </button>
          </div>
        </div>

        {/* Inventory View */}
        {activeView === "inventory" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="bg-white pl-10 pr-4 py-2 border border-gray-300 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    name: "",
                    description: "",
                    quantity: 0,
                    price: 0,
                    category: "",
                  });
                  setIsItemModalOpen(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                Add Item
              </button>
            </div>

            {/* Inventory Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${item.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Delete size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers View */}
        {activeView === "customers" && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerForm({
                    name: "",
                    address: "",
                    mobile: "",
                    email: "",
                  });
                  setIsCustomerModalOpen(true);
                }}
              >
                <UserPlus2 size={16} className="mr-2" />
                Add Customer
              </button>
            </div>

            {/* Customers Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {customer.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Delete size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleItemSubmit();
                }}
              >
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Item name"
                    value={itemForm.name}
                    onChange={handleItemFormChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Item description"
                    value={itemForm.description}
                    onChange={handleItemFormChange as any}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="category"
                  >
                    Category
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Item category"
                    value={itemForm.category}
                    onChange={handleItemFormChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="quantity"
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={itemForm.quantity}
                    onChange={handleItemFormChange}
                    min="0"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="price"
                  >
                    Price
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={itemForm.price}
                    onChange={handleItemFormChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="bg-gray-500 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-gray-600"
                    onClick={() => setIsItemModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700"
                  >
                    {editingItem ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Modal */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCustomerSubmit();
                }}
              >
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="customer-name"
                  >
                    Name
                  </label>
                  <input
                    id="customer-name"
                    name="name"
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Customer name"
                    value={customerForm.name}
                    onChange={handleCustomerFormChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="address"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Customer address"
                    value={customerForm.address}
                    onChange={handleCustomerFormChange as any}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="mobile"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Mobile number"
                    value={customerForm.mobile}
                    onChange={handleCustomerFormChange}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Email address"
                    value={customerForm.email}
                    onChange={handleCustomerFormChange}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="bg-gray-500 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-gray-600"
                    onClick={() => setIsCustomerModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700"
                  >
                    {editingCustomer ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
