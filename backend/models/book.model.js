const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    pdf: { type: String, default: null },
    doc: { type: String, default: null },
    txt: { type: String, default: null },
  },
  { _id: false }
);

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    author: {
      type: String,
      required: true,
    },

    publisher: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ Multiple cover images supported
    coverImages: [
      {
        type: String,
        required: true, // at least 1 cover required
      },
    ],

    // ✅ Book file format support
    files: fileSchema,

    // ✅ Admin who uploaded the book
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Superadmin approval system
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ Usage stats
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },

    // ✅ Optional features
    tags: [{ type: String }],
    language: { type: String, default: "English" },
    publicationYear: { type: Number },
    pages: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
