import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.route("/").post(createCustomer).get(listCustomers);

router.route("/:id").put(updateCustomer).delete(deleteCustomer);

export default router;
