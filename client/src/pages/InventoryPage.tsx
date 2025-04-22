import { useState, useEffect } from "react";
import { Layout, Typography } from "antd";
import { InventoryTable } from "../components/InventoryTable";
import { AddItemForm } from "../components/AddItemForm";
import { EditItemForm } from "../components/EditItemForm";
import { SearchBar } from "../components/Searchbar";
import type { Item } from "../types/Item";
import { addItem } from "@/api/inventory.service";
import { toast } from "sonner";
import { AxiosError } from "axios";

const { Header, Content } = Layout;
const { Title } = Typography;

// Sample initial data
const initialItems: Item[] = [
  {
    id: "1",
    name: "Laptop",
    description: "High-performance laptop with 16GB RAM",
    quantity: 10,
    price: 1299.99,
  },
  {
    id: "2",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with long battery life",
    quantity: 25,
    price: 49.99,
  },
  {
    id: "3",
    name: "Monitor",
    description: "27-inch 4K monitor with HDR support",
    quantity: 15,
    price: 349.99,
  },
  {
    id: "4",
    name: "Keyboard",
    description: "Mechanical keyboard with RGB lighting",
    quantity: 20,
    price: 129.99,
  },
  {
    id: "5",
    name: "Headphones",
    description: "Noise-cancelling wireless headphones",
    quantity: 30,
    price: 199.99,
  },
];

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<Item[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter items based on search term
  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [items, searchTerm]);

  // Add a new item
  const handleAddItem = async (newItem: Omit<Item, "id">) => {
    console.log(newItem);
    try {
      const data = await addItem(newItem);
      toast.success(data.message);

      const id = Math.random().toString(36).substring(2, 9);
      const itemWithId = { ...newItem, id };
      setItems([...items, itemWithId]);
      setIsAddModalOpen(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    }
  };

  // Edit an existing item
  const handleEditItem = (updatedItem: Item) => {
    setItems(
      items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Delete an item
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Start editing an item
  const startEdit = (item: Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="flex items-center bg-white shadow-sm">
        <Title level={3} className="text-gray-800 m-0">
          Inventory Management
        </Title>
      </Header>
      <Content className="p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add New Item
            </button>
          </div>

          <InventoryTable
            items={filteredItems}
            onEdit={startEdit}
            onDelete={handleDeleteItem}
          />

          <AddItemForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddItem}
          />

          {editingItem && (
            <EditItemForm
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              onSave={handleEditItem}
              item={editingItem}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}
