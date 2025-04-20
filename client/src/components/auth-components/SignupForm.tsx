import React, { useEffect } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { signup } from "@/api/auth.service";
import { toast } from "sonner";

const { Title, Text } = Typography;

export interface SignupFormValues {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function SignupForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, []);

  const onFinish = async (values: SignupFormValues) => {
    try {
      setLoading(true);
      // Here you would implement your actual signup logic
      console.log("Signup form values:", values);

      // Simulate API call
      const data = await signup(values);

      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Account created successfully!");
      navigate("/dashboard"); // Redirect to login after signup
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-lg" bordered={false}>
        <div className="text-center mb-6">
          <Title level={2}>Create Account</Title>
          <Text type="secondary">Sign up to get started</Text>
        </div>

        <Form
          form={form}
          name="signup"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
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
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: "Please enter your phone number" },
              {
                pattern: /^\+?[0-9]{10,15}$/,
                message: "Please enter a valid phone number",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="Phone Number"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message:
                  "Password must contain uppercase, lowercase, number and special character",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Already have an account?{" "}
            <a onClick={() => navigate("/")}>Sign in</a>
          </Text>
        </div>
      </Card>
    </div>
  );
}
