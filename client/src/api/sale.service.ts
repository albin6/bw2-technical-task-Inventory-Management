import { Sale } from "@/components/SalesModule";
import { axiosInstance } from "./axios.instance";

export const recordSale = async (data: Sale) => {
  const response = await axiosInstance.post("/sales", data);
  return response.data;
};

export const getSalesList = async () => {
  const response = await axiosInstance.get("/sales");
  return response.data;
};
