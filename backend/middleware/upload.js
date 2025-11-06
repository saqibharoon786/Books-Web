const multer = require("multer");
const path = require("path");

// Storage for Cover Images
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/covers/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Storage for Book Files (pdf/doc/txt)
const bookFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/books/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File Filter for only book formats
const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "text/plain", "application/msword"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file format"), false);
};

exports.uploadCover = multer({ storage: coverStorage });
exports.uploadBookFile = multer({ storage: bookFileStorage, fileFilter });
