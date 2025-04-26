import type React from "react";
import { Typography, Layout, Breadcrumb } from "antd";
import SalesReportExport from "@/components/SalesReportExport";

const { Title } = Typography;
const { Content } = Layout;

const SalesReportPage: React.FC = () => {
  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>Reports</Breadcrumb.Item>
          <Breadcrumb.Item>Sales</Breadcrumb.Item>
        </Breadcrumb>

        <div className="bg-white p-6 rounded-lg shadow">
          <Title level={2} className="mb-6">
            Sales Reports
          </Title>
          <p className="text-gray-600 mb-8">
            Generate and export sales reports based on date range, sale type,
            and customer. You can print reports, export them as Excel or PDF, or
            send them via email.
          </p>

          <SalesReportExport apiUrl="/reports/export" />
        </div>
      </Content>
    </Layout>
  );
};

export default SalesReportPage;
