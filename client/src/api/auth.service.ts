import { LoginFormValues } from "../components/auth-components/LoginForm";
import { SignupFormValues } from "../components/auth-components/SignupForm";
import { axiosInstance } from "./axios.instance";

export const login = async (data: LoginFormValues) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

export const signup = async (
  data: Omit<SignupFormValues, "confirmPassword">
) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("user");
};
