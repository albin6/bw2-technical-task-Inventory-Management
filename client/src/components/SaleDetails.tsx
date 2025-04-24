import React from "react";
import { Modal, Descriptions, Table } from "antd";
import { Sale } from "./SalesModule";

interface SaleDetailsProps {
  sale: Sale;
  visible: boolean;
  onClose: () => void;
}

const SaleDetails: React.FC<SaleDetailsProps> = ({
  sale,
  visible,
  onClose,
}) => {
  const columns = [
    {
      title: "Item",
      dataIndex: ["item", "name"],
      key: "name",
      render: (name: string, record: any) =>
        name ||
        (typeof record.item === "object" ? record.item.name : "Unknown Item"),
    },
    {
      title: "Unit Price",
      key: "price",
      render: (_: any, record: any) => {
        // Handle different price structures from API
        const price =
          record.priceAtSale ||
          (record.item && typeof record.item === "object"
            ? record.item.price
            : 0);
        return `$${price.toFixed(2)}`;
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_: any, record: any) => {
        // Handle different price structures from API
        const price =
          record.priceAtSale ||
          (record.item && typeof record.item === "object"
            ? record.item.price
            : 0);
        return `$${(record.quantity * price).toFixed(2)}`;
      },
    },
  ];

  // Format the customer information
  const getCustomerDisplay = () => {
    if (sale.isCashSale) return "Cash Sale";
    if (typeof sale.customer === "string") return sale.customer;
    if (sale.customer && typeof sale.customer === "object") {
      return `${sale.customer.name} (${
        sale.customer.phone || sale.customer.email || ""
      })`;
    }
    return "Unknown";
  };

  return (
    <Modal
      title="Sale Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Descriptions bordered column={1} className="mb-6">
        <Descriptions.Item label="Sale Date">
          {sale.date ? new Date(sale.date).toLocaleString() : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Customer">
          {getCustomerDisplay()}
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          ${sale.totalAmount?.toFixed(2) || "0.00"}
        </Descriptions.Item>
      </Descriptions>

      <h3 className="text-lg font-semibold mb-3">Items Purchased</h3>
      <Table
        columns={columns}
        dataSource={sale.items}
        rowKey={(record, index) => `${record.item?._id || index}`}
        pagination={false}
      />
    </Modal>
  );
};

export default SaleDetails;
