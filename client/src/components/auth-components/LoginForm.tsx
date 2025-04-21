import React, { useEffect } from "react";
import { Form, Input, Button, Card, Typography, Radio } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { login } from "@/api/auth.service";

const { Title, Text } = Typography;

export interface LoginFormValues {
  email: string;
  password: string;
  role: "admin" | "customer";
}

export default function LoginForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, []);

  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      // Here you would implement your actual login logic
      console.log("Login form values:", values);

      // Simulate API call with role included
      const data = await login(values);

      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-lg" bordered={false}>
        <div className="text-center mb-6">
          <Title level={2}>Welcome Back</Title>
          <Text type="secondary">Please sign in to continue</Text>
        </div>

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
          initialValues={{ role: "customer" }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Login as"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Radio.Group>
              <Radio value="customer">Customer</Radio>
              <Radio value="admin">Admin</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Don't have an account?{" "}
            <a onClick={() => navigate("/signup")}>Sign up</a>
          </Text>
        </div>
      </Card>
    </div>
  );
}
