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
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || "dashboard";

  // Extract the parent key if we're on a child route
  const openKey = currentPath.includes("/")
    ? currentPath.split("/")[0]
    : currentPath;

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
      getItem("Customer Management", "dashboard/customers", <TeamOutlined />),
      getItem("Inventory Management", "dashboard/inventory", <InboxOutlined />),
    ]),
    getItem("Sales", "sales", <ShoppingCartOutlined />),
    getItem("Reports", "reports", <BarChartOutlined />),
    getItem("Exports", "exports", <ExportOutlined />),
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(`/${e.key}`);
  };

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
        selectedKeys={[currentPath]}
        defaultOpenKeys={[openKey]}
        items={items}
        className="border-r-0"
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default AppSidebar;
