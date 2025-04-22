import type React from "react";
import { Table, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { Sale } from "./SalesModule";

interface SalesListProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

const SalesList: React.FC<SalesListProps> = ({ sales, onViewDetails }) => {
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: Date) => date.toLocaleDateString(),
      sorter: (a: Sale, b: Sale) => a.date.getTime() - b.date.getTime(),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: any[]) => (
        <span>
          {items.map((item, index) => (
            <Tag color="blue" key={index}>
              {item.item.name}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_: any, record: Sale) => {
        const totalQuantity = record.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        return totalQuantity;
      },
    },
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: Sale) =>
        record.customer ? (
          record.customer.name
        ) : (
          <Tag color="orange">Cash Sale</Tag>
        ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `$${total.toFixed(2)}`,
      sorter: (a: Sale, b: Sale) => a.total - b.total,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Sale) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => onViewDetails(record)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg">
      <h2 className="text-xl font-semibold mb-6">Sales Transactions</h2>
      <Table
        columns={columns}
        dataSource={sales}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        className="shadow-sm"
      />
    </div>
  );
};

export default SalesList;
