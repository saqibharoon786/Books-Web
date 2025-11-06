const Book = require("../models/book.model");

// ✅ Upload Book (Admin or Superadmin)
exports.uploadBook = async (req, res) => {
  try {
    const { title, description, category, author, publisher, price } = req.body;

    if (!req.files || !req.files.coverImages) {
      return res.status(400).json({ message: "Cover image required" });
    }

    const coverImages = req.files.coverImages.map((file) => file.path);

    const book = await Book.create({
      title,
      description,
      category,
      author,
      publisher,
      price,
      coverImages,
      files: {
        pdf: req.files.bookFile?.[0]?.path || null,
        doc: null,
        txt: null,
      },
      uploader: req.user.id,
    });

    res.json({
      message: "Book uploaded successfully, pending approval",
      book,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get only Approved Books (For Customers)
exports.getApprovedBooks = async (req, res) => {
  const books = await Book.find({ status: "approved" });
  res.json(books);
};

// ✅ Get BOOKS uploaded by this Admin
exports.getMyBooks = async (req, res) => {
  const books = await Book.find({ uploader: req.user.id });
  res.json(books);
};

// ✅ Approve Books (Superadmin)
exports.approveBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedBy: req.user.id },
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book Approved ✅", book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
