// models/judgment.model.js
const mongoose = require("mongoose");

const judgmentSchema = new mongoose.Schema(
  {
    // Case Information
    citation: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    parties: {
      type: String,
      required: true,
      trim: true,
    },
    caseTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // Court Information
    court: {
      type: String,
      required: true,
      enum: [
        'Supreme Court of Pakistan',
        'High Court',
        'District Court',
        'Session Court',
        'Special Court',
        'Federal Shariat Court'
      ]
    },
    judge: {
      type: String,
      trim: true,
    },

    // Case Details
    caseType: {
      type: String,
      required: true,
      enum: ['Civil', 'Criminal', 'Constitutional', 'Family', 'Commercial', 'Tax', 'Labor', 'Customs']
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Contract Law', 'Property Law', 'Tort Law', 'Criminal Law', 
        'Constitutional Law', 'Family Law', 'Corporate Law', 'Tax Law',
        'Labor Law', 'Environmental Law', 'Intellectual Property', 'Cyber Law'
      ]
    },
    year: {
      type: Number,
      required: true,
      min: 1947,
      max: new Date().getFullYear()
    },
    decisionDate: {
      type: Date,
    },

    // Legal Information
    keywords: [String],
    summary: {
      type: String,
      maxlength: 1500,
    },

    // File Information
    pdfFile: {
      type: String,
      required: true,
    },
    
    // ✅ CHANGED: Replaced textFile with textContent and textFormat
    textContent: {
      type: String,
      required: [true, 'Text content is required']
    },
    textFormat: {
      type: String,
      enum: ["plain", "html", "markdown"],
      default: "plain"
    },
    
    // ✅ ADDED: Cover Images
    coverImages: [{
      type: String,
      trim: true
    }],

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "PKR",
    },

    // Upload Information (Only superadmin)
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Statistics
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },

    // Additional Info
    isFeatured: {
      type: Boolean,
      default: false,
    }
  },
  { 
    timestamps: true
  }
);

// Indexes
// judgmentSchema.index({ citation: 1 });
// judgmentSchema.index({ court: 1, year: -1 });
// judgmentSchema.index({ caseType: 1 });
// judgmentSchema.index({ category: 1 });
// judgmentSchema.index({ year: -1 });
// judgmentSchema.index({ uploader: 1 });
// judgmentSchema.index({ isFeatured: -1 });

// Virtual for full case info
judgmentSchema.virtual('fullCaseInfo').get(function() {
  return `${this.citation} - ${this.court} (${this.year})`;
});

// Method to get primary cover image
judgmentSchema.methods.getPrimaryCover = function() {
  return this.coverImages.length > 0 ? this.coverImages[0] : null;
};

// Method to increment views
judgmentSchema.methods.incrementView = function() {
  this.views += 1;
  return this.save();
};

// Method to increment purchases
judgmentSchema.methods.incrementPurchase = function() {
  this.purchases += 1;
  return this.save();
};

// Static method to get judgments by year range
judgmentSchema.statics.findByYearRange = function(startYear, endYear) {
  return this.find({
    year: { $gte: startYear, $lte: endYear }
  }).sort({ year: -1 });
};

// Static method to get featured judgments
judgmentSchema.statics.getFeatured = function() {
  return this.find({ isFeatured: true })
    .sort({ year: -1 })
    .limit(10);
};

module.exports = mongoose.model("Judgment", judgmentSchema);