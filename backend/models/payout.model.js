const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    amount: {
      type: Number,
      required: true,
    },
    
    paymentMethod: {
      type: String,
      enum: ["jazzcash", "easypaisa", "bank", "manual"],
      required: true,
    },
    
    // Recipient details based on payment method
    recipientDetails: {
      jazzcashNumber: String,
      easypaisaNumber: String,
      bankAccount: {
        accountTitle: String,
        accountNumber: String,
        bankName: String,
        iban: String
      }
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    
    // Processing info
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    processedAt: Date,
    completedAt: Date,
    
    // Transaction references
    internalRef: {
      type: String,
      unique: true,
    },
    
    externalRef: String, // JazzCash/Easypaisa transaction ID
    
    // Error handling
    failureReason: String,
    retryCount: {
      type: Number,
      default: 0
    },
    
    // Related commissions
    commissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
    }],
    
    // Metadata
    notes: String,
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// Indexes
// payoutSchema.index({ user: 1, createdAt: -1 });
// payoutSchema.index({ status: 1 });
// payoutSchema.index({ internalRef: 1 });
// payoutSchema.index({ createdAt: -1 });

// Pre-save middleware to generate internal reference
payoutSchema.pre('save', function(next) {
  if (!this.internalRef) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.internalRef = `PAYOUT_${timestamp}_${random}`;
  }
  next();
});

module.exports = mongoose.model("Payout", payoutSchema);