import { Customer } from "@/components/InventoryDashboard";
import { axiosInstance } from "./axios.instance";

export const getAllCustomers = async () => {
  const response = await axiosInstance.get("/customer");
  return response.data;
};

export const addNewCustomer = async (data: Omit<Customer, "_id">) => {
  const response = await axiosInstance.post("/customer", data);
  return response.data;
};
