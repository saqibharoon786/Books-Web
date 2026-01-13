const express = require("express");
const router = express.Router();
const { protect, isSuperAdmin } = require("../middleware/auth.middleware");

const {
  getAllPayouts,
  getUserPayouts,
  processPayout,
  triggerAutoPayouts,
  getPayoutStats
} = require("../controllers/payout.controller");

// ================== 🔐 PROTECTED ROUTES ==================
router.use(protect);

router.get("/my-payouts", getUserPayouts);

// ================== 🧑‍⚖️ SUPERADMIN ONLY ==================
router.get("/all", isSuperAdmin, getAllPayouts);
router.get("/stats", isSuperAdmin, getPayoutStats);
router.post("/process/:payoutId", isSuperAdmin, processPayout);
router.post("/trigger-auto-payouts", isSuperAdmin, triggerAutoPayouts);

module.exports = router;