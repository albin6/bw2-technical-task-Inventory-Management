import type React from "react";
import { useState } from "react";
import { Layout, Tabs } from "antd";
import RecordSaleForm from "./RecordSaleForm";
import SalesList from "./SalesList";
import SaleDetails from "./SaleDetails";

const { Content } = Layout;
const { TabPane } = Tabs;

// Mock data types
export interface InventoryItem {
  _id: string;
  name: string;
  stock: number;
  price: number;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SaleItem {
  item: InventoryItem;
  quantity: number;
  price: number;
}

export interface Sale {
  _id: string;
  date: Date;
  items: SaleItem[];
  customer: Customer | null;
  total: number;
}

// Mock data
export const mockInventoryItems: InventoryItem[] = [
  { _id: "1", name: "Laptop", stock: 15, price: 999.99 },
  { _id: "2", name: "Smartphone", stock: 25, price: 499.99 },
  { _id: "3", name: "Headphones", stock: 50, price: 79.99 },
  { _id: "4", name: "Monitor", stock: 10, price: 249.99 },
  { _id: "5", name: "Keyboard", stock: 30, price: 59.99 },
];

export const mockCustomers: Customer[] = [
  { _id: "1", name: "John Doe", email: "john@example.com", phone: "555-1234" },
  {
    _id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-5678",
  },
  {
    _id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "555-9012",
  },
];

export const mockSales: Sale[] = [
  {
    _id: "1",
    date: new Date("2023-05-15"),
    items: [
      {
        item: mockInventoryItems[0],
        quantity: 1,
        price: mockInventoryItems[0].price,
      },
      {
        item: mockInventoryItems[2],
        quantity: 2,
        price: mockInventoryItems[2].price,
      },
    ],
    customer: mockCustomers[0],
    total: 999.99 + 79.99 * 2,
  },
  {
    _id: "2",
    date: new Date("2023-05-16"),
    items: [
      {
        item: mockInventoryItems[1],
        quantity: 1,
        price: mockInventoryItems[1].price,
      },
    ],
    customer: null, // Cash sale
    total: 499.99,
  },
];

const SalesModule: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const handleAddSale = (newSale: Sale) => {
    setSales([...sales, newSale]);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsVisible(true);
  };

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
                inventoryItems={mockInventoryItems}
                customers={mockCustomers}
                onSaleSubmit={handleAddSale}
              />
            </TabPane>
            <TabPane tab="Sales List" key="2">
              <SalesList sales={sales} onViewDetails={handleViewDetails} />
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
