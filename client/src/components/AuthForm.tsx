import type React from "react";
import { useState } from "react";
import { Form, Input, Button, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export interface AuthFormProps {
  /**
   * The mode of the form - either 'login' or 'signup'
   */
  mode: "login" | "signup";

  /**
   * Optional custom title for the form
   */
  title?: string;

  /**
   * Optional custom submit button text
   */
  submitButtonText?: string;

  /**
   * Optional callback for form submission
   */
  onSubmit?: (values: { email: string; password: string }) => Promise<void>;

  /**
   * Optional loading state for the form
   */
  isLoading?: boolean;
}

/**
 * A reusable authentication form component that can be used for both login and signup
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  mode = "login",
  title,
  submitButtonText,
  onSubmit,
  isLoading = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isLoading);

  // Determine the title and button text based on the mode
  const formTitle = title || (mode === "login" ? "Log In" : "Sign Up");
  const buttonText =
    submitButtonText || (mode === "login" ? "Log In" : "Sign Up");

  // Handle form submission
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // Default implementation for demo purposes
        console.log("Form values:", values);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <Title level={3} className="mb-2">
          {formTitle}
        </Title>
        <Text type="secondary">
          {mode === "login"
            ? "Enter your credentials to access your account"
            : "Create an account to get started"}
        </Text>
      </div>

      <Form
        form={form}
        name="auth-form"
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Email"
            size="large"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please enter your password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Password"
            size="large"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700"
            size="large"
          >
            {buttonText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
