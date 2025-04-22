import { Customer } from "@/types/Customer";
import { axiosInstance } from "./axios.instance";

export const addCustomer = async (data: Omit<Customer, "_id">) => {
  const response = await axiosInstance.post("/customer", data);
  return response.data;
};

export const editCustomer = async (data: Customer) => {
  const response = await axiosInstance.put(`/customer/${data._id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: string) => {
  const response = await axiosInstance.delete(`/customer/${id}`);
  return response.data;
};

export const listCustomer = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get("/customer", {
    params: { page, limit },
  });
  return response.data;
};
