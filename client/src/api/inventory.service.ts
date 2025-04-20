import { InventoryItem } from "@/components/InventoryDashboard";
import { axiosInstance } from "./axios.instance";

export const getAllInventoryItems = async () => {
  const response = await axiosInstance.get("/inventory");
  return response.data;
};

export const addInventoryItem = async (data: Omit<InventoryItem, "_id">) => {
  const response = await axiosInstance.post("/inventory", data);
  return response.data;
};
