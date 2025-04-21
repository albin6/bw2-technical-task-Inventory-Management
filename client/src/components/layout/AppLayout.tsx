import type React from "react";
import { useState } from "react";
import { Layout } from "antd";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { Outlet } from "react-router-dom";

const { Content } = Layout;

interface AppLayoutProps {
  isLoggedIn?: boolean;
  userName?: string;
  onLogout?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  isLoggedIn = true,
  userName = "User",
  onLogout = () => console.log("Logout clicked"),
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout className="min-h-screen">
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AppHeader
          isLoggedIn={isLoggedIn}
          userName={userName}
          onLogout={onLogout}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <Content className="m-4 p-6 bg-white rounded-lg shadow">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
