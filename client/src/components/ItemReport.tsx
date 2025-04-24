import { useState, useEffect } from "react";
import { Table, Card, Tag, Spin, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import { axiosInstance } from "@/api/axios.instance";

interface InventoryApiResponse {
  success: boolean;
  count: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  data: InventoryItem[];
}

interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function ItemReport() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get<InventoryApiResponse>(
        "/inventory"
      );

      if (response.data.success) {
        setItems(response.data.data);
      } else {
        setError(
          "Failed to load inventory data: API returned unsuccessful response"
        );
      }
    } catch (err) {
      setError("Failed to load inventory data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<InventoryItem> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Current Stock",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (stock) => (
        <span>
          {stock} {stock < 10 && <Tag color="error">Low Stock</Tag>}
        </span>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
  ];

  return (
    <div className="space-y-6">
      {error && <Alert message={error} type="error" showIcon />}

      <Card title="Inventory Items" className="shadow-sm">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="_id"
            pagination={{ pageSize: 15 }}
          />
        </Spin>
      </Card>
    </div>
  );
}
