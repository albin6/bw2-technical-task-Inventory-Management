import type React from "react";
import { useState, useEffect } from "react";
import {
  DatePicker,
  Select,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Divider,
  Card,
  Typography,
} from "antd";
import {
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { axiosInstance } from "@/api/axios.instance";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface Customer {
  _id: string;
  name: string;
}

interface SalesReportExportProps {
  apiUrl?: string;
}

const SalesReportExport: React.FC<SalesReportExportProps> = ({
  apiUrl = "/reports/export",
}) => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [saleType, setSaleType] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState({
    excel: false,
    pdf: false,
    email: false,
  });

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get("/customer");
        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.data)
        ) {
          setCustomers(response.data.data); // Access the nested data array
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        message.error("Failed to load customers");
      }
    };

    fetchCustomers();
  }, []);

  const getQueryParams = () => {
    const params = new URLSearchParams();

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.append("from", dateRange[0].format("YYYY-MM-DD"));
      params.append("to", dateRange[1].format("YYYY-MM-DD"));
    }

    if (saleType) {
      params.append("isCashSale", saleType === "cash" ? "true" : "false");
    }

    if (selectedCustomer) {
      params.append("customer", selectedCustomer);
    }

    return params.toString();
  };

  const handlePrint = async () => {
    try {
      const response = await axiosInstance.get(
        `${apiUrl}?${getQueryParams()}&format=html`
      );

      // Create a new window with the HTML content
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Sales Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h1, h2 { color: #333; }
                .report-header { margin-bottom: 20px; }
                .no-print { display: none; }
                @media print {
                  button { display: none; }
                  .page-break { page-break-before: always; }
                }
              </style>
            </head>
            <body>
              <div class="report-header">
                <h1>Sales Report</h1>
                <p>Period: ${dateRange[0].format(
                  "MMM D, YYYY"
                )} - ${dateRange[1].format("MMM D, YYYY")}</p>
                ${
                  saleType
                    ? `<p>Sale Type: ${
                        saleType === "cash" ? "Cash Sale" : "Credit Sale"
                      }</p>`
                    : ""
                }
                ${
                  selectedCustomer
                    ? `<p>Customer: ${
                        customers.find((c) => c._id === selectedCustomer)
                          ?.name || ""
                      }</p>`
                    : ""
                }
              </div>
              <button class="no-print" onclick="window.print()">Print Report</button>
              ${response.data}
              <script>
                // Auto print
                setTimeout(() => { window.print(); }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        message.error(
          "Unable to open print window. Please check your popup settings."
        );
      }
    } catch (error) {
      console.error("Error generating print view:", error);
      message.error("Failed to generate print view");
    }
  };

  const handleExcelExport = async () => {
    setLoading({ ...loading, excel: true });
    try {
      const response = await axiosInstance.get(
        `${apiUrl}?${getQueryParams()}&format=excel`,
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales_report_${dayjs().format("YYYY-MM-DD")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("Failed to export Excel report");
    } finally {
      setLoading({ ...loading, excel: false });
    }
  };

  const handlePdfExport = async () => {
    setLoading({ ...loading, pdf: true });
    try {
      const response = await axiosInstance.get(
        `${apiUrl}?${getQueryParams()}&format=pdf`,
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales_report_${dayjs().format("YYYY-MM-DD")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("PDF report downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error("Failed to export PDF report");
    } finally {
      setLoading({ ...loading, pdf: false });
    }
  };

  const showEmailModal = () => {
    setEmailModalVisible(true);
  };

  const handleEmailSend = async () => {
    try {
      await emailForm.validateFields();
      const { email, message: emailMessage } = emailForm.getFieldsValue();

      setLoading({ ...loading, email: true });

      await axiosInstance.get(
        `${apiUrl}?${getQueryParams()}&format=email&email=${encodeURIComponent(
          email
        )}`
      );

      message.success("Report sent successfully to " + email);
      setEmailModalVisible(false);
      emailForm.resetFields();
    } catch (error) {
      console.error("Error sending email:", error);
      message.error("Failed to send email report");
    } finally {
      setLoading({ ...loading, email: false });
    }
  };

  return (
    <Card className="w-full shadow-md">
      <Title level={4}>Sales Report Export</Title>
      <Divider />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Text strong>Date Range</Text>
          <RangePicker
            className="w-full mt-2"
            value={dateRange}
            onChange={(dates) =>
              dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
            }
          />
        </div>

        <div>
          <Text strong>Sale Type</Text>
          <Select
            className="w-full mt-2"
            placeholder="All Sale Types"
            allowClear
            onChange={(value) => setSaleType(value)}
          >
            <Option value="cash">Cash Sale</Option>
            <Option value="credit">Credit Sale</Option>
          </Select>
        </div>

        <div>
          <Text strong>Customer (Optional)</Text>
          <Select
            className="w-full mt-2"
            placeholder="All Customers"
            allowClear
            showSearch
            optionFilterProp="children"
            onChange={(value) => setSelectedCustomer(value)}
          >
            {customers.map((customer) => (
              <Option key={customer._id} value={customer._id}>
                {customer.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <Divider />

      <Space size="middle" wrap className="justify-center md:justify-start">
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          className="bg-blue-500"
        >
          Print
        </Button>

        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={handleExcelExport}
          loading={loading.excel}
          className="bg-green-600"
        >
          Export as Excel
        </Button>

        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handlePdfExport}
          loading={loading.pdf}
          className="bg-red-600"
        >
          Export as PDF
        </Button>

        <Button
          type="primary"
          icon={<MailOutlined />}
          onClick={showEmailModal}
          className="bg-purple-600"
        >
          Send via Email
        </Button>
      </Space>

      {/* Email Modal */}
      <Modal
        title="Send Report via Email"
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmailModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading.email}
            onClick={handleEmailSend}
            className="bg-blue-500"
          >
            Send Report
          </Button>,
        ]}
      >
        <Form form={emailForm} layout="vertical">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter an email address" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input placeholder="recipient@example.com" />
          </Form.Item>

          <Form.Item name="message" label="Message (Optional)">
            <TextArea
              rows={4}
              placeholder="Optional message to include with the report"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SalesReportExport;
