import {
  useState,
  useEffect,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
import {
  Select,
  Table,
  Card,
  Space,
  Alert,
  Spin,
  Empty,
  Descriptions,
  Statistic,
  Row,
  Col,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { axiosInstance } from "@/api/axios.instance";

interface CustomerApiResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface Customer {
  _id: string;
  name: string;
  address: string;
  mobileNumber: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface CustomerLedgerResponse {
  customer: Customer;
  summary: {
    totalSales: number;
    totalAmount: number;
    firstPurchaseDate: string | null;
    lastPurchaseDate: string | null;
  };
  sales: Sale[];
}

interface Sale {
  _id: string;
  date: string;
  totalAmount: number;
  items: {
    item: {
      _id: string;
      name: string;
    };
    quantity: number;
    priceAtSale: number;
  }[];
}

export default function CustomerLedger() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerData, setCustomerData] =
    useState<CustomerLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get<CustomerApiResponse>(
        "/customer"
      );

      if (response.data.success) {
        setCustomers(response.data.data);
      } else {
        setError(
          "Failed to load customers: API returned unsuccessful response"
        );
      }
    } catch (err) {
      setError("Failed to load customers");
      console.error(err);
    }
  };

  const fetchCustomerLedger = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get<CustomerLedgerResponse>(
        `/reports/customers/${selectedCustomer}/ledger`
      );

      setCustomerData(response.data);
    } catch (err) {
      setError("Failed to load customer sales data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerLedger();
    } else {
      setCustomerData(null);
    }
  }, [selectedCustomer]);

  const columns: ColumnsType<Sale> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items) => (
        <ul className="list-disc pl-4">
          {items?.map(
            (
              item: {
                item: {
                  name:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                };
                quantity:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<unknown, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactPortal
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
                priceAtSale: number;
              },
              index: Key | null | undefined
            ) => (
              <li key={index}>
                {item.item.name} × {item.quantity} @ $
                {item.priceAtSale.toFixed(2)}
              </li>
            )
          )}
        </ul>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => `$${amount.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Customer Selection" className="shadow-sm">
        <Space direction="vertical" size="middle" className="w-full">
          <div>
            <div className="mb-2">Select Customer</div>
            <Select
              showSearch
              placeholder="Search for a customer"
              optionFilterProp="children"
              className="w-full"
              onChange={setSelectedCustomer}
              options={customers.map((c) => ({ value: c._id, label: c.name }))}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </Space>
      </Card>

      {error && <Alert message={error} type="error" showIcon />}

      {customerData && (
        <Card title="Customer Summary" className="shadow-sm">
          <Descriptions title={customerData.customer.name} bordered>
            <Descriptions.Item label="Mobile Number">
              {customerData.customer.mobileNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {customerData.customer.address}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Sales"
                value={customerData.summary.totalSales}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Amount"
                value={customerData.summary.totalAmount}
                precision={2}
                prefix="$"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="First Purchase"
                value={
                  customerData.summary.firstPurchaseDate
                    ? new Date(
                        customerData.summary.firstPurchaseDate
                      ).toLocaleDateString()
                    : "N/A"
                }
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Last Purchase"
                value={
                  customerData.summary.lastPurchaseDate
                    ? new Date(
                        customerData.summary.lastPurchaseDate
                      ).toLocaleDateString()
                    : "N/A"
                }
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card title="Customer Sales History" className="shadow-sm">
        <Spin spinning={loading}>
          {selectedCustomer ? (
            customerData?.sales && customerData.sales.length > 0 ? (
              <Table
                columns={columns}
                dataSource={customerData.sales}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="No sales history found for this customer" />
            )
          ) : (
            <Empty description="Select a customer to view their sales history" />
          )}
        </Spin>
      </Card>
    </div>
  );
}
