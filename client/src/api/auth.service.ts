import { axiosInstance } from "./axios.instance";

interface AuthFormValues {
  email: string;
  password: string;
}

export const login = async (data: AuthFormValues) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

export const signup = async (data: AuthFormValues) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("user");
};
