import { useState, useEffect } from "react";
import { axiosInstance } from "@/api/axios.instance";

// Define types
interface InventoryItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  _id: string;
  name: string;
}

interface SaleItem {
  item: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface SaleFormData {
  date: string;
  customer?: string;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: "cash" | "credit";
}

const SalesForm = () => {
  // State management
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [saleData, setSaleData] = useState<SaleFormData>({
    date: new Date().toISOString().split("T")[0],
    items: [],
    totalAmount: 0,
    paymentMethod: "cash",
  });

  // Selected item state (for adding items)
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isCashSale, setIsCashSale] = useState<boolean>(true);

  // Fetch inventory items and customers on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [inventoryRes, customersRes] = await Promise.all([
          axiosInstance.get("/inventory"),
          axiosInstance.get("/customers"),
        ]);

        setInventory(inventoryRes.data.data);
        setCustomers(customersRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate subtotal and update total amount
  const calculateTotals = (items: SaleItem[]) => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Add item to sale
  const handleAddItem = () => {
    if (!selectedItem || quantity <= 0) {
      console.error("Please select an item and a valid quantity");
      return;
    }

    const inventoryItem = inventory.find((item) => item._id === selectedItem);

    if (!inventoryItem) {
      console.error("Selected item not found");
      return;
    }

    if (inventoryItem.quantity < quantity) {
      console.error(`Only ${inventoryItem.quantity} units available in stock`);
      return;
    }

    const existingItemIndex = saleData.items.findIndex(
      (item) => item.item === selectedItem
    );

    let updatedItems = [...saleData.items];

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItem = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        subtotal:
          (updatedItems[existingItemIndex].quantity + quantity) *
          inventoryItem.price,
      };

      updatedItems[existingItemIndex] = updatedItem;
    } else {
      // Add new item
      const newItem: SaleItem = {
        item: inventoryItem._id,
        name: inventoryItem.name,
        quantity: quantity,
        price: inventoryItem.price,
        subtotal: quantity * inventoryItem.price,
      };

      updatedItems = [...updatedItems, newItem];
    }

    const newTotalAmount = calculateTotals(updatedItems);

    setSaleData({
      ...saleData,
      items: updatedItems,
      totalAmount: newTotalAmount,
    });

    // Reset selection fields
    setSelectedItem("");
    setQuantity(1);
  };

  // Remove item from sale
  const handleRemoveItem = (index: number) => {
    const updatedItems = saleData.items.filter((_, i) => i !== index);
    const newTotalAmount = calculateTotals(updatedItems);

    setSaleData({
      ...saleData,
      items: updatedItems,
      totalAmount: newTotalAmount,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleData.items.length === 0) {
      console.error("Please add at least one item to the sale");
      return;
    }

    setSubmitting(true);

    // Prepare the sale data
    const salePayload = {
      ...saleData,
      date: new Date(saleData.date).toISOString(),
      customer: isCashSale ? undefined : saleData.customer,
      customerName: isCashSale ? "Cash Sale" : undefined,
    };

    try {
      const response = await axiosInstance.post("/sales", salePayload);

      if (response.data.success) {
        console.log("Sale recorded successfully");

        // Reset form
        setSaleData({
          date: new Date().toISOString().split("T")[0],
          items: [],
          totalAmount: 0,
          paymentMethod: "cash",
        });
        setIsCashSale(true);
      }
    } catch (error) {
      console.error("Failed to record sale");
      console.error("Error submitting sale:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: "cash" | "credit") => {
    setSaleData({
      ...saleData,
      paymentMethod: method,
    });
  };

  // Handle customer selection change
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setSaleData({
      ...saleData,
      customer: customerId,
    });
  };

  // Toggle between cash sale and customer sale
  const toggleSaleType = (isCash: boolean) => {
    setIsCashSale(isCash);
    if (isCash) {
      // Remove customer reference for cash sales
      const { customer, ...rest } = saleData;
      setSaleData(rest);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Record New Sale</h2>

      <form onSubmit={handleSubmit}>
        {/* Date and Sale Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={saleData.date}
              onChange={(e) =>
                setSaleData({ ...saleData, date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => toggleSaleType(true)}
                className={`px-4 py-2 rounded-md ${
                  isCashSale
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Cash Sale
              </button>
              <button
                type="button"
                onClick={() => toggleSaleType(false)}
                className={`px-4 py-2 rounded-md ${
                  !isCashSale
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Customer Sale
              </button>
            </div>
          </div>
        </div>

        {/* Customer Selection (only for customer sales) */}
        {!isCashSale && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={saleData.customer || ""}
              onChange={handleCustomerChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("cash")}
              className={`px-4 py-2 rounded-md ${
                saleData.paymentMethod === "cash"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("credit")}
              className={`px-4 py-2 rounded-md ${
                saleData.paymentMethod === "credit"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Credit
            </button>
          </div>
        </div>

        {/* Add Items Section */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="font-medium mb-4">Add Items</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Select Item</option>
                {inventory &&
                  inventory.length > 0 &&
                  inventory?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} - ${item.price.toFixed(2)} (In Stock:{" "}
                      {item.quantity})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Sale Items</h3>

          {saleData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Item</th>
                    <th className="py-2 px-4 border-b text-right">Price</th>
                    <th className="py-2 px-4 border-b text-right">Quantity</th>
                    <th className="py-2 px-4 border-b text-right">Subtotal</th>
                    <th className="py-2 px-4 border-b text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.items.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="py-2 px-4 text-right">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 text-right">{item.quantity}</td>
                      <td className="py-2 px-4 text-right">
                        ${item.subtotal.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={3} className="py-2 px-4 text-right">
                      Total Amount:
                    </td>
                    <td className="py-2 px-4 text-right">
                      ${saleData.totalAmount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 border rounded-md">
              No items added to this sale yet
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || saleData.items.length === 0}
            className={`px-6 py-2 rounded-md ${
              submitting || saleData.items.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium`}
          >
            {submitting ? "Recording Sale..." : "Record Sale"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;
