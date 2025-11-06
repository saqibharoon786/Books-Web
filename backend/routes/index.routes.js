const express = require("express");
const router = express.Router();

const bookRoutes = require("./book.routes");

// API BASE PATHS
router.use("/books", bookRoutes);

module.exports = router;
