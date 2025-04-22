import type React from "react";
import { Modal, Descriptions, Table, Tag, Divider } from "antd";
import type { Sale, SaleItem } from "./SalesModule";

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
      dataIndex: "item",
      key: "item",
      render: (item: any) => item.name,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_: any, record: SaleItem) =>
        `$${(record.quantity * record.price).toFixed(2)}`,
    },
  ];

  return (
    <Modal
      title={<span className="text-xl">Sale Details</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div className="p-4">
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="Sale ID" span={2}>
            {sale._id}
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {sale.date.toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {sale.customer ? (
              sale.customer.name
            ) : (
              <Tag color="orange">Cash Sale</Tag>
            )}
          </Descriptions.Item>
          {sale.customer && (
            <>
              <Descriptions.Item label="Email">
                {sale.customer.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {sale.customer.phone}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Divider orientation="left">Items Purchased</Divider>

        <Table
          dataSource={sale.items}
          columns={columns}
          pagination={false}
          rowKey={(record) => record.item._id}
          className="mb-6"
        />

        <div className="flex justify-end mt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-medium">Total Amount</div>
            <div className="text-2xl font-bold text-green-600">
              ${sale.total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SaleDetails;
