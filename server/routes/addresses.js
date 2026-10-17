const express = require("express");
const router = express.Router();

const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addresses");

// GET /api/addresses/:userId
router.get("/:userId", getAddresses);

// POST /api/addresses
router.post("/", createAddress);

// PUT /api/addresses/:id
router.put("/:id", updateAddress);

// DELETE /api/addresses/:id
router.delete("/:id", deleteAddress);

module.exports = router;