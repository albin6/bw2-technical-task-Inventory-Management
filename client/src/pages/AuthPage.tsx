import type React from "react";
import { useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { login, signup } from "@/api/auth.service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string; password: string }) => {
    // In a real application, you would handle authentication here
    console.log(
      `${activeTab === "login" ? "Login" : "Signup"} submitted:`,
      values
    );

    try {
      let response;
      if (activeTab === "login") {
        response = await login(values);
      } else {
        response = await signup(values);
        toast.success("Register success");
      }

      console.log("heree", response);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "login",
      label: "Login",
      children: <AuthForm mode="login" onSubmit={handleSubmit} />,
    },
    {
      key: "signup",
      label: "Sign Up",
      children: <AuthForm mode="signup" onSubmit={handleSubmit} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          centered
          className="bg-white rounded-lg shadow-md p-4"
        />
      </div>
    </div>
  );
};
