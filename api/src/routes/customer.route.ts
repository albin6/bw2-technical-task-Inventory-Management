import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.use(verifyAuth);

router.route("/").get(getAllCustomers).post(createCustomer);

// router.get("/search", searchCustomers);

router
  .route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
