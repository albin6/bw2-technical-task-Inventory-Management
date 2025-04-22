import type React from "react";
import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Layout,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Customer } from "@/types/Customer";
import {
  addCustomer,
  deleteCustomer,
  editCustomer,
  listCustomer,
} from "../api/customer.service";
import { Content, Header } from "antd/es/layout/layout";
const { Title } = Typography;

type CustomerFormValues = Omit<Customer, "_id">;
type FormMode = "add" | "edit";
type ListCustomerResponse = {
  success: boolean;
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
};

export const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data: ListCustomerResponse = await listCustomer();
      setCustomers(data.data || []);
    } catch (error) {
      message.error("Failed to fetch customers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setFormMode("add");
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormMode("edit");
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      message.error("Failed to delete customer");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values: CustomerFormValues = await form.validateFields();

      if (formMode === "add") {
        await addCustomer(values);
        message.success("Customer added successfully");
      } else if (editingCustomer) {
        await editCustomer({ ...editingCustomer, ...values });
        message.success("Customer updated successfully");
      }

      setModalVisible(false);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to submit form:", error);
      message.error("Something went wrong");
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this customer?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ className: "bg-red-500 hover:bg-red-600" }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600"
            >
              Add Customer
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={customers}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="shadow-md rounded-md overflow-hidden"
          />

          <Modal
            title={formMode === "add" ? "Add New Customer" : "Edit Customer"}
            open={modalVisible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText={formMode === "add" ? "Add" : "Save"}
            okButtonProps={{ className: "bg-blue-500 hover:bg-blue-600" }}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                rules={[
                  { required: true, message: "Please enter customer address" },
                ]}
              >
                <Input.TextArea placeholder="Enter customer address" rows={3} />
              </Form.Item>

              <Form.Item
                name="mobileNumber"
                label="Mobile Number"
                rules={[
                  { required: true, message: "Please enter mobile number" },
                  {
                    pattern: /^[0-9-+() ]+$/,
                    message: "Please enter a valid mobile number",
                  },
                ]}
              >
                <Input placeholder="Enter mobile number" />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};
