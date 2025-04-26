export interface ISaleItem {
  item: { _id: string; name: string };
  quantity: number;
  priceAtSale: number;
}

export interface ISale {
  _id: string;
  date: string;
  items: ISaleItem[];
  customer?: { _id: string; name: string };
  isCashSale: boolean;
  totalAmount: number;
}
