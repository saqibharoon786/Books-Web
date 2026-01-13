const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    sellerType: {
      type: String,
      enum: ["admin", "superadmin"],
      required: true,
    },
    
    // Amounts
    totalAmount: {
      type: Number,
      required: true,
    },
    
    sellerAmount: {
      type: Number,
      required: true,
    },
    
    superadminAmount: {
      type: Number,
      required: true,
    },
    
    commissionPercentage: {
      type: Number,
      default: 10
    },
    
    // Status
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "PAID_OUT"],
      default: "PENDING",
    },
    
    // Payout reference if paid out
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
    },
    
    processedAt: Date,
    paidOutAt: Date
  },
  { timestamps: true }
);

// Indexes
// commissionSchema.index({ seller: 1, status: 1 });
// commissionSchema.index({ createdAt: -1 });
// commissionSchema.index({ payment: 1 }, { unique: true });

module.exports = mongoose.model("Commission", commissionSchema);