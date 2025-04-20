import { useNavigate } from "react-router-dom";
import { Button, Avatar, Dropdown } from "antd";
import { UserOutlined, LogoutOutlined, DownOutlined } from "@ant-design/icons";

const Header = ({ onToggleSidebar }: any) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const items = [
    {
      key: "profile",
      label: (
        <div
          className="flex items-center"
          onClick={() => navigate("/userprofile")}
        >
          <UserOutlined className="mr-2" />
          <span>Profile</span>
        </div>
      ),
    },
    {
      key: "logout",
      label: (
        <div className="flex items-center" onClick={handleLogout}>
          <LogoutOutlined className="mr-2" />
          <span>Logout</span>
        </div>
      ),
    },
  ];

  return (
    <header className="bg-white shadow w-full">
      <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button type="text" onClick={onToggleSidebar} className="mr-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management Dashboard
          </h1>
        </div>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Button type="text" className="flex items-center gap-1 px-1 sm:px-3">
            <Avatar icon={<UserOutlined />} size="small" />
            <span className="hidden sm:inline-block font-medium ml-2">
              {localStorage.getItem("user")
                ? JSON.parse(localStorage.getItem("user") || "")?.username
                : ""}
            </span>
            <DownOutlined className="text-xs ml-1" />
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
