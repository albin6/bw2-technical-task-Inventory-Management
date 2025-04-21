import type React from "react";
import { Layout, Button, Dropdown, Space, Avatar, Typography } from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
  collapsed: boolean;
  toggleSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isLoggedIn,
  userName,
  onLogout,
  collapsed,
  toggleSidebar,
}) => {
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Profile",
      icon: <UserOutlined />,
    },
    {
      key: "2",
      label: "Settings",
      icon: <UserOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: onLogout,
      danger: true,
    },
  ];

  return (
    <Header className="flex items-center justify-between px-4 bg-white shadow-sm z-10 h-16">
      <div className="flex items-center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="mr-4 flex items-center justify-center"
          size="large"
        />
        <div className="text-xl font-semibold hidden md:block">
          Company Dashboard
        </div>
      </div>

      {isLoggedIn && (
        <div className="flex items-center">
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Space className="cursor-pointer">
              <Avatar icon={<UserOutlined />} className="bg-blue-500" />
              <Text className="hidden sm:inline-block">{userName}</Text>
            </Space>
          </Dropdown>
        </div>
      )}
    </Header>
  );
};

export default AppHeader;
