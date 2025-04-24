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
  DatePicker,
  Select,
  Card,
  Table,
  Button,
  Statistic,
  Row,
  Col,
  Space,
  Alert,
  Spin,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type dayjs from "dayjs";
import { axiosInstance } from "@/api/axios.instance";

const { RangePicker } = DatePicker;

// Updated interfaces to match actual API responses
interface CustomerApiResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface ItemApiResponse {
  success: boolean;
  count?: number;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  data: Item[];
}

interface SalesApiResponse {
  success: boolean;
  result: SaleResult[];
}

interface SaleResult {
  date: string;
  items: {
    name: string;
    quantity: number;
  }[];
  customer: string;
  totalAmount: number;
  _id?: string; // Add this if present in your actual data
}

interface Customer {
  _id: string;
  name: string;
  address: string;
  mobileNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export default function SalesReport() {
  const [sales, setSales] = useState<SaleResult[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Summary stats
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [totalUnitsSold, setTotalUnitsSold] = useState(0);

  useEffect(() => {
    // Fetch customers and items for dropdowns
    const fetchFilterData = async () => {
      try {
        const [customersRes, itemsRes] = await Promise.all([
          axiosInstance.get<CustomerApiResponse>("/customer"),
          axiosInstance.get<ItemApiResponse>("/inventory"),
        ]);

        // Check if the API responses are successful
        if (customersRes.data.success && itemsRes.data.success) {
          setCustomers(customersRes.data.data);
          setItems(itemsRes.data.data);
        } else {
          setError(
            "Failed to load filter data: API returned unsuccessful response"
          );
        }
      } catch (err) {
        setError("Failed to load filter data");
        console.error(err);
      }
    };

    fetchFilterData();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    setError("");

    try {
      // Build query parameters
      const params: Record<string, string> = {};

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format("YYYY-MM-DD");
        params.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      if (selectedCustomer) {
        params.customerId = selectedCustomer;
      }

      if (selectedItem) {
        params.itemId = selectedItem;
      }

      const response = await axiosInstance.get<SalesApiResponse>("/sales", {
        params,
      });

      if (response.data.success) {
        setSales(response.data.result);

        // Calculate summary statistics
        let totalValue = 0;
        let totalUnits = 0;

        response.data.result.forEach((sale: SaleResult) => {
          totalValue += sale.totalAmount;
          sale.items.forEach((item) => {
            totalUnits += item.quantity;
          });
        });

        setTotalSalesValue(totalValue);
        setTotalUnitsSold(totalUnits);
      } else {
        setError(
          "Failed to load sales data: API returned unsuccessful response"
        );
      }
    } catch (err) {
      setError("Failed to load sales data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<SaleResult> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Items Sold",
      dataIndex: "items",
      key: "items",
      render: (items) => (
        <ul className="list-disc pl-4">
          {items?.map(
            (
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
              },
              index: Key | null | undefined
            ) => (
              <li key={index}>
                {item.name} × {item.quantity}
              </li>
            )
          )}
        </ul>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" href={`/sales/${record._id || ""}`}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Filters" className="shadow-sm">
        <Space direction="vertical" size="middle" className="w-full">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <div className="mb-2">Date Range</div>
              <RangePicker
                className="w-full"
                onChange={(dates) =>
                  setDateRange(
                    dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                  )
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2">Customer</div>
              <Select
                placeholder="Select customer"
                className="w-full"
                allowClear
                onChange={setSelectedCustomer}
                options={customers.map((c) => ({
                  value: c._id,
                  label: c.name,
                }))}
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2">Item</div>
              <Select
                placeholder="Select item"
                className="w-full"
                allowClear
                onChange={setSelectedItem}
                options={items.map((i) => ({ value: i._id, label: i.name }))}
              />
            </Col>
          </Row>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchSales}>
            Search
          </Button>
        </Space>
      </Card>

      {error && <Alert message={error} type="error" showIcon />}

      <Card title="Summary" className="shadow-sm">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Statistic
              title="Total Sales Value"
              value={totalSalesValue}
              precision={2}
              prefix="$"
            />
          </Col>
          <Col xs={24} md={12}>
            <Statistic title="Total Units Sold" value={totalUnitsSold} />
          </Col>
        </Row>
      </Card>

      <Card title="Sales Data" className="shadow-sm">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={sales}
            rowKey={(record) => record._id || record.date}
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>
    </div>
  );
}
