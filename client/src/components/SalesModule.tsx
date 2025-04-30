import React, { useState, useEffect } from "react";
import { Layout, Tabs, message } from "antd";
import RecordSaleForm from "./RecordSaleForm";
import SalesList from "./SalesList";
import SaleDetails from "./SaleDetails";
import { recordSale, getSalesList } from "../api/sale.service";
import { getAllItems } from "../api/inventory.service";
import { listCustomer } from "../api/customer.service";

const { Content } = Layout;
const { TabPane } = Tabs;

// Interface definitions matching your backend models
export interface InventoryItem {
  _id: string;
  name: string;
  quantity: number; // Changed from 'stock' to match your backend
  price: number;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SaleItem {
  itemId: string; // For creating a sale
  quantity: number;
  item?: InventoryItem; // For display purposes
  priceAtSale?: number;
}

export interface Sale {
  _id?: string;
  date?: Date;
  items: SaleItem[];
  customerId?: string; // For creating a sale
  customer?: Customer | string; // Could be Customer object or "Cash"
  totalAmount?: number;
  isCashSale?: boolean;
}

const SalesModule: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch inventory items
        const itemsResponse = await getAllItems(1, 100); // Get a reasonable amount
        setInventoryItems(itemsResponse.data);

        // Fetch customers
        const customersResponse = await listCustomer(1, 100);
        setCustomers(customersResponse.data);

        // Fetch sales
        const salesResponse = await getSalesList();
        setSales(salesResponse.result);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddSale = async (newSale: Sale) => {
    try {
      // Format the sale data for the API
      const saleData = {
        items: newSale.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        customerId: newSale.customerId,
      };

      // Send to API
      const response = await recordSale(saleData);

      console.log(response);

      // Refresh sales list
      const salesResponse = await getSalesList();
      setSales(salesResponse.result);

      message.success("Sale recorded successfully");
    } catch (error) {
      console.error("Error adding sale:", error);
      message.error("Failed to record sale");
    }
  };

  // const handleViewDetails = async (saleId: string) => {
  //   try {
  //     // You need to implement this API function to get a single sale
  //     // const response = await getSaleById(saleId);
  //     // setSelectedSale(response.sale);

  //     // For now, find the sale in the already loaded sales
  //     const sale = sales.find((s) => s._id === saleId);
  //     if (sale) {
  //       setSelectedSale(sale);
  //       setIsDetailsVisible(true);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching sale details:", error);
  //     message.error("Failed to load sale details");
  //   }
  // };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
    setSelectedSale(null);
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Sales Management
          </h1>

          <Tabs defaultActiveKey="1" className="mb-6">
            <TabPane tab="Record Sale" key="1">
              <RecordSaleForm
                inventoryItems={inventoryItems}
                customers={customers}
                onSaleSubmit={handleAddSale}
                loading={loading}
              />
            </TabPane>
            <TabPane tab="Sales List" key="2">
              <SalesList sales={sales} loading={loading} />
            </TabPane>
          </Tabs>

          {isDetailsVisible && selectedSale && (
            <SaleDetails
              sale={selectedSale}
              visible={isDetailsVisible}
              onClose={handleCloseDetails}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default SalesModule;
