import React from "react";
import { Table, Tag } from "antd";
import { Sale } from "./SalesModule";

interface SalesListProps {
  sales: Sale[];
  loading: boolean;
}

const SalesList: React.FC<SalesListProps> = ({ sales, loading }) => {
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: any[]) => (
        <span>
          {items.slice(0, 2).map((item, index) => (
            <Tag key={index} color="blue">
              {item.name || (item.item as any)?.name} x{item.quantity}
            </Tag>
          ))}
          {items.length > 2 && (
            <Tag color="default">+{items.length - 2} more</Tag>
          )}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: Sale) =>
        // Handle different customer representations from API
        typeof record.customer === "string"
          ? record.customer
          : record.isCashSale
          ? "Cash"
          : (record.customer as any)?.name || "Unknown",
    },
    {
      title: "Total",
      key: "total",
      dataIndex: "totalAmount",
      render: (totalAmount: number) => `$${totalAmount?.toFixed(2) || "0.00"}`,
    },
    // {
    //   title: "Action",
    //   key: "action",
    //   render: (_: any, record: Sale) => (
    //     <Button
    //       icon={<EyeOutlined />}
    //       onClick={() => record._id && onViewDetails(record._id)}
    //       type="primary"
    //     >
    //       View Details
    //     </Button>
    //   ),
    // },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={sales}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default SalesList;
