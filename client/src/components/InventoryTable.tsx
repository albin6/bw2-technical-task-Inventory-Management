import type React from "react";
import { useState } from "react";
import { Table, Button, Modal, Space, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import type { Item } from "../types/Item";

interface InventoryTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
}) => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this item?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        onDelete(id);
      },
    });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return <Tag color="red">Out of Stock</Tag>;
    if (quantity < 5) return <Tag color="orange">Low Stock</Tag>;
    if (quantity < 10) return <Tag color="blue">Medium Stock</Tag>;
    return <Tag color="green">In Stock</Tag>;
  };

  const columns: TableProps<Item>["columns"] = [
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
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity) => (
        <div className="flex items-center gap-2">
          <span>{quantity}</span>
          {getStockStatus(quantity)}
        </div>
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
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            className="bg-blue-500"
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="id"
      pagination={pagination}
      onChange={handleTableChange}
      className="overflow-x-auto"
      scroll={{ x: 800 }}
    />
  );
};
