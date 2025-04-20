import { axiosInstance } from "./axios.instance";

export const getAllCustomers = async () => {
  const response = await axiosInstance.get("/customer");
  return response.data;
};
