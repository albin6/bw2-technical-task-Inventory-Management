import { Types } from "mongoose";

// Sales Report Interfaces
export interface ISalesReportQuery {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  itemId?: string;
}

export interface ISalesReportSummary {
  totalSalesValue: number;
  totalUnitsSold: number;
}

export interface ISalesReportSaleItem {
  item: {
    _id: Types.ObjectId;
    name: string;
  };
  quantity: number;
  priceAtSale: number;
}

export interface ISalesReportSale {
  _id: Types.ObjectId;
  date: Date;
  items: ISalesReportSaleItem[];
  customer?: {
    _id: Types.ObjectId;
    name: string;
  } | null;
  isCashSale: boolean;
  totalAmount: number;
}

export interface ISalesReportResponse {
  summary: ISalesReportSummary;
  sales: ISalesReportSale[];
}

// Item Report Interfaces
export interface IItemReportItem {
  _id: Types.ObjectId;
  name: string;
  description: string;
  quantity: number;
  price: number;
  isLowStock: boolean;
}

export interface IItemReportResponse {
  items: IItemReportItem[];
}

// Customer Ledger Interfaces
export interface ICustomerLedgerEntry {
  _id: Types.ObjectId;
  date: Date;
  items: {
    item: {
      _id: Types.ObjectId;
      name: string;
    };
    quantity: number;
    priceAtSale: number;
  }[];
  totalAmount: number;
}

export interface ICustomerLedgerResponse {
  customer: {
    _id: Types.ObjectId;
    name: string;
    address: string;
    mobileNumber: string;
  };
  sales: ICustomerLedgerEntry[];
}
