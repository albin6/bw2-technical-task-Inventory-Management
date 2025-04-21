import type React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  ExportOutlined,
  TeamOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const getItem = (
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[]
  ): MenuItem => {
    return {
      key,
      icon,
      children,
      label,
    } as MenuItem;
  };

  const items: MenuItem[] = [
    getItem("Dashboard", "dashboard", <DashboardOutlined />, [
      getItem("Customer Management", "customers", <TeamOutlined />),
      getItem("Inventory Management", "inventory", <InboxOutlined />),
    ]),
    getItem("Sales", "sales", <ShoppingCartOutlined />),
    getItem("Reports", "reports", <BarChartOutlined />),
    getItem("Exports", "exports", <ExportOutlined />),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      className="shadow-md"
      theme="light"
      breakpoint="lg"
    >
      <div className="h-16 flex items-center justify-center">
        <h1
          className={`text-xl font-bold text-blue-600 transition-opacity duration-300 ${
            collapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          {!collapsed && "ACME Corp"}
        </h1>
        {collapsed && <span className="text-2xl text-blue-600">A</span>}
      </div>
      <Menu
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        defaultOpenKeys={["dashboard"]}
        items={items}
        className="border-r-0"
      />
    </Sider>
  );
};

export default AppSidebar;
