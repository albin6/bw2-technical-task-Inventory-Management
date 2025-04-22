import { Item } from "@/types/Item";
import { axiosInstance } from "./axios.instance";

export const addItem = async (data: Omit<Item, "_id">) => {
  const response = await axiosInstance.post("/inventory", data);
  return response.data;
};

export const updateItem = async (data: Item) => {
  const response = await axiosInstance.put(`/inventory/${data._id}`, data);
  return response.data;
};

export const deleteItem = async (id: string) => {
  const response = await axiosInstance.put(`/inventory/${id}`);
  return response.data;
};

export const getAllItems = async (page = 1, limit = 10, search = "") => {
  const response = await axiosInstance.get("/inventory", {
    params: { page, limit, search },
  });
  return response.data;
};
