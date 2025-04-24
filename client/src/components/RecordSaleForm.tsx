import type React from "react";
import { useState, useEffect } from "react";
import {
  Form,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Table,
  Divider,
  Alert,
} from "antd";
import dayjs from "dayjs";
import type { InventoryItem, Customer, Sale, SaleItem } from "./SalesModule";

const { Option } = Select;

interface RecordSaleFormProps {
  inventoryItems: InventoryItem[];
  customers: Customer[];
  onSaleSubmit: (sale: Sale) => void;
  loading: boolean;
}

const RecordSaleForm: React.FC<RecordSaleFormProps> = ({
  inventoryItems,
  customers,
  onSaleSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update total whenever sale items change
  useEffect(() => {
    const newTotal = saleItems.reduce(
      (sum, item) => sum + (item.priceAtSale || 0) * item.quantity,
      0
    );
    setTotal(newTotal);
  }, [saleItems]);

  const handleItemSelect = (value: string[]) => {
    setSelectedItems(value);

    // Add new items that weren't in the previous selection
    const newItems = value.filter(
      (itemId) => !saleItems.some((saleItem) => saleItem.itemId === itemId)
    );

    const updatedSaleItems = [
      ...saleItems,
      ...newItems.map((itemId) => {
        const item = inventoryItems.find((invItem) => invItem._id === itemId)!;
        return {
          itemId,
          item, // Store for display purposes
          quantity: 1,
          priceAtSale: item.price,
        };
      }),
    ];

    // Remove items that are no longer selected
    const filteredItems = updatedSaleItems.filter((saleItem) =>
      value.includes(saleItem.itemId)
    );

    setSaleItems(filteredItems);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    const item = inventoryItems.find((item) => item._id === itemId);
    if (!item) return;

    // Validate quantity against available quantity
    if (quantity > item.quantity) {
      setValidationError(
        `Quantity exceeds available quantity for ${item.name}`
      );
      return;
    }

    setValidationError(null);

    setSaleItems((prevItems) =>
      prevItems.map((saleItem) =>
        saleItem.itemId === itemId ? { ...saleItem, quantity } : saleItem
      )
    );
  };

  const handleSubmit = (values: any) => {
    if (saleItems.length === 0) {
      setValidationError("Please select at least one item");
      return;
    }

    // Check if any item exceeds available quantity
    for (const saleItem of saleItems) {
      const inventoryItem = inventoryItems.find(
        (item) => item._id === saleItem.itemId
      );
      if (inventoryItem && saleItem.quantity > inventoryItem.quantity) {
        setValidationError(
          `Quantity exceeds available quantity for ${inventoryItem.name}`
        );
        return;
      }
    }

    setValidationError(null);

    // Determine if this is a cash sale (no customer selected)
    const isCashSale = !values.customer;

    // Prepare items for API
    const saleItemsForSubmit = saleItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      priceAtSale: item.priceAtSale,
    }));

    const newSale: Sale = {
      date: values.date.toDate(),
      items: saleItemsForSubmit,
      customerId: values.customer || undefined,
      totalAmount: total,
      isCashSale: isCashSale,
    };

    onSaleSubmit(newSale);

    // Reset form
    form.resetFields();
    setSelectedItems([]);
    setSaleItems([]);
    setTotal(0);
  };

  const columns = [
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      render: (item: InventoryItem) => item.name,
    },
    {
      title: "Available Quantity",
      dataIndex: "item",
      key: "quantity",
      render: (item: InventoryItem) => item.quantity,
    },
    {
      title: "Price",
      dataIndex: "priceAtSale",
      key: "price",
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_: any, record: SaleItem) => (
        <InputNumber
          min={1}
          max={record.item?.quantity}
          value={record.quantity}
          onChange={(value) =>
            handleQuantityChange(record.itemId, value as number)
          }
        />
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_: any, record: SaleItem) =>
        `$${((record.priceAtSale || 0) * record.quantity).toFixed(2)}`,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-6">Record New Sale</h2>

      {validationError && (
        <Alert
          message={validationError}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setValidationError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            name="date"
            label="Sale Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="customer"
            label="Customer"
            help="Leave empty for Cash Sale"
          >
            <Select
              loading={loading}
              disabled={loading}
              placeholder="Select customer (optional)"
              allowClear
            >
              {customers.map((customer) => (
                <Option key={customer._id} value={customer._id}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="items"
          label="Select Items"
          rules={[
            { required: true, message: "Please select at least one item" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select items to sell"
            value={selectedItems}
            onChange={handleItemSelect}
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {inventoryItems.map((item) => (
              <Option
                key={item._id}
                value={item._id}
                disabled={item.quantity === 0}
              >
                {item.name} - ${item.price.toFixed(2)} ({item.quantity} in
                stock)
              </Option>
            ))}
          </Select>
        </Form.Item>

        {saleItems.length > 0 && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Selected Items</h3>
              <Table
                dataSource={saleItems}
                columns={columns}
                pagination={false}
                rowKey={(record) => record.itemId}
                className="mb-4"
              />
            </div>

            <Divider />

            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="bg-blue-500 hover:bg-blue-600"
            disabled={saleItems.length === 0 || !!validationError}
          >
            Record Sale
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RecordSaleForm;
