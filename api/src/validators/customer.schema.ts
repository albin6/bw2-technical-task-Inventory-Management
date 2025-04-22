import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[A-Za-z\s]+$/, {
      message: "Name must contain only letters and spaces",
    }),

  address: z.string().min(1, { message: "Address is required" }),

  mobileNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Mobile number must be exactly 10 digits" }),
});
