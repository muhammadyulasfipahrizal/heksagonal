const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

const {
  getCustomerOrder,
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getAllOrders,
  getMyOrders,
} = require("../controllers/customer_orders");

router.route("/")
  .get(getAllOrders)
  .post(createCustomerOrder);

router.get("/my-orders", getMyOrders);

router.route("/:id")
  .get(getCustomerOrder)
  .put(updateCustomerOrder)
  .delete(deleteCustomerOrder);

module.exports = router;
