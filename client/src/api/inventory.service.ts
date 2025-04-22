import { Item } from "@/types/Item";
import { axiosInstance } from "./axios.instance";

export const addItem = async (data: Omit<Item, "id">) => {
  const response = await axiosInstance.post("/inventory", data);
  return response.data;
};
