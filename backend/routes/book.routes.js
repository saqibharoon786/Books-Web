// const express = require("express");
// const router = express.Router();
// const {
//   uploadCover,
//   uploadBookFile,
// } = require("../middleware/upload");
// const {
//   uploadBook,
//   approveBook,
//   getApprovedBooks,
//   getMyBooks,
// } = require("../controllers/book.controller");

// // Temporary user role middleware until Auth is ready
// router.use((req, res, next) => {
//   req.user = { id: "6761234567890abcde1234f", role: "admin" }; 
//   next();
// });

// // ✅ Upload Book (Admin / Superadmin)
// router.post(
//   "/upload",
//   uploadCover.array("coverImages", 5),
//   uploadBookFile.array("bookFile", 1),
//   uploadBook
// );

// // ✅ Get only approved books
// router.get("/approved", getApprovedBooks);

// // ✅ Get books uploaded by logged-in admin
// router.get("/my-books", getMyBooks);

// // ✅ Approve Book (Superadmin only - temporary check)
// router.patch("/approve/:id", (req, res, next) => {
//   if (req.user.role !== "superadmin")
//     return res.status(403).json({ message: "Unauthorized" });

//   next();
// }, approveBook);

// module.exports = router;
