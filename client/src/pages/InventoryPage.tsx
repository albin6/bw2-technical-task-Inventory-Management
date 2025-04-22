import { useState, useEffect } from "react";
import { Layout, Typography, Pagination, Spin } from "antd";
import { InventoryTable } from "../components/InventoryTable";
import { AddItemForm } from "../components/AddItemForm";
import { EditItemForm } from "../components/EditItemForm";
import { SearchBar } from "../components/Searchbar";
import type { Item } from "../types/Item";
import {
  getAllItems,
  addItem,
  deleteItem,
  updateItem,
} from "@/api/inventory.service";
import { toast } from "sonner";
import { AxiosError } from "axios";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, pageSize]);

  // Fetch items from API
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getAllItems(currentPage, pageSize, searchTerm);
      setItems(response.data);
      setTotalItems(response.totalItems);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || "Failed to fetch inventory items"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Load initial data
  useEffect(() => {
    fetchItems();
  }, []);

  // Add a new item
  const handleAddItem = async (newItem: Omit<Item, "id">) => {
    try {
      const data = await addItem(newItem);
      toast.success(data.message);
      fetchItems(); // Refresh the list
      setIsAddModalOpen(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || "Failed to add item");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Edit an existing item
  const handleEditItem = async (updatedItem: Item) => {
    console.log(updatedItem);
    try {
      const data = await updateItem(updatedItem);
      toast.success(data.message);
      fetchItems(); // Refresh the list
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || "Failed to update item");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Delete an item
  const handleDeleteItem = async (id: string) => {
    try {
      const data = await deleteItem(id);
      toast.success(data.message);
      fetchItems(); // Refresh the list
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || "Failed to delete item");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Start editing an item
  const startEdit = (item: Item) => {
    console.log("start edit", item);
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Handle pagination change
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
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
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={() => {
                setCurrentPage(1); // Reset to first page on new search
                fetchItems();
              }}
            />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add New Item
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <InventoryTable
                items={items}
                onEdit={startEdit}
                onDelete={handleDeleteItem}
              />

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={currentPage}
                  total={totalItems}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total ${total} items`}
                />
              </div>
            </>
          )}

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
