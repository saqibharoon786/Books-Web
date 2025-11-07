const express = require("express");
const router = express.Router();
const { uploadFiles } = require("../middleware/upload");
const {
  uploadBook,
  approveBook,
  getApprovedBooks,
  getMyBooks,
} = require("../controllers/book.controller");

// Temporary user role middleware until Auth is ready
router.use((req, res, next) => {
  req.user = { id: "6761234567890abcde1234f", role: "admin" }; 
  next();
});

// ✅ Upload Book (Admin / Superadmin) - Using single middleware
router.post("/upload", uploadFiles, uploadBook);

// ✅ Get only approved books
router.get("/approved", getApprovedBooks);

// ✅ Get books uploaded by logged-in admin
router.get("/my-books", getMyBooks);

module.exports = router;