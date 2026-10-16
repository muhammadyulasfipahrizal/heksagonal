const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");

const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addresses");

// Semua endpoint alamat wajib login.
router.use(requireAuth);

router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;