import type React from "react";
import { Modal, Form, Input, InputNumber, Button } from "antd";
import type { Item } from "../types/Item";

interface AddItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<Item, "id">) => void;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        onAdd(values);
        form.resetFields();
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      title="Add New Item"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          className="bg-blue-500"
        >
          Add Item
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="addItemForm"
        initialValues={{ quantity: 1, price: 0 }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter the item name" }]}
        >
          <Input placeholder="Enter item name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input.TextArea
            placeholder="Enter item description"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[
            { required: true, message: "Please enter the quantity" },
            { type: "number", min: 0, message: "Quantity must be at least 0" },
          ]}
        >
          <InputNumber min={0} className="w-full" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price ($)"
          rules={[
            { required: true, message: "Please enter the price" },
            { type: "number", min: 0, message: "Price must be at least 0" },
          ]}
        >
          <InputNumber<number>
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) =>
              `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
            className="w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
