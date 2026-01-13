const express = require("express");
const router = express.Router();
const { protect, isAdmin, isSuperAdmin } = require("../middleware/auth.middleware");

const {
  getWalletInfo,
  connectJazzCashWallet,
  updatePayoutSettings,
  requestPayout
} = require("../controllers/wallet.controller");

// ================== 🔐 PROTECTED ROUTES ==================
router.use(protect);

router.get("/info", getWalletInfo);
router.post("/connect-jazzcash", connectJazzCashWallet);
router.put("/payout-settings", updatePayoutSettings);
router.post("/request-payout", requestPayout);

module.exports = router;