import { Request, Response } from "express";
import { Customer } from "../model/customer.model";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";
import { StatusCode } from "../constants/status-codes";

export const createCustomer = async (req: Request, res: Response) => {
  const { name, address, mobileNumber } = req.body;

  const customer = await Customer.findOne({ name, mobileNumber });

  if (customer) {
    throw new AppError(Messages.customer.ALREADY_EXISTS, StatusCode.CONFLICT);
  }

  const newCustomer = new Customer({
    name,
    address,
    mobileNumber,
  });

  await newCustomer.save();

  res.status(StatusCode.CREATED).json({
    success: true,
    message: Messages.customer.CREATED_SUCCESS,
  });
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, mobileNumber } = req.body;

  const customer = await Customer.findById(id);

  if (!customer) {
    throw new AppError(
      Messages.customer.CUSTOMER_NOT_FOUND,
      StatusCode.NOT_FOUND
    );
  }

  // Check if another customer has the same name and mobileNumber
  const existingCustomer = await Customer.findOne({
    _id: { $ne: id }, // exclude current customer
    name,
    mobileNumber,
  });

  if (existingCustomer) {
    throw new AppError(Messages.customer.ALREADY_EXISTS, StatusCode.CONFLICT);
  }

  customer.name = name ?? customer.name;
  customer.address = address ?? customer.address;
  customer.mobileNumber = mobileNumber ?? customer.mobileNumber;

  await customer.save();

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.customer.UPDATED_SUCCESS,
  });
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;

  const customer = await Customer.findById(id);

  if (!customer) {
    throw new AppError(
      Messages.customer.CUSTOMER_NOT_FOUND,
      StatusCode.NOT_FOUND
    );
  }

  await Customer.findByIdAndDelete(id);

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.customer.DELETED_SUCCESS,
  });
};

export const listCustomers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find().skip(skip).limit(limit),
    Customer.countDocuments(),
  ]);

  res.status(StatusCode.OK).json({
    success: true,
    data: customers,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};
