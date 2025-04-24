import CustomerLedger from "@/components/CustomerLedger";
import ItemReport from "@/components/ItemReport";
import SalesReport from "@/components/SalesReport";
import { Tabs } from "antd";

export default function ReportsPage() {
  const items = [
    {
      key: "1",
      label: "Sales Report",
      children: <SalesReport />,
    },
    {
      key: "2",
      label: "Item Report",
      children: <ItemReport />,
    },
    {
      key: "3",
      label: "Customer Ledger",
      children: <CustomerLedger />,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}
