const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes")
const bookRoutes = require("./book.routes");
// API BASE PATHS
router.use("/auth", authRoutes)
// router.use("/books", bookRoutes);

module.exports = router;
