const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },

  // Role and Status
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'customer'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },

  // Profile Image
  profileImage: {
    url: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },

  // CNIC (simplified, no validation/rejection)
  cnic: {
    number: {
      type: String,
      trim: true,
      default: null
    },
    frontImage: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: null }
    },
    backImage: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: null }
    }
  },

  // Address Information
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Pakistan' },
    zipCode: { type: String, trim: true }
  },

  // Timestamps and Activity
  lastLogin: { type: Date, default: null },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for complete address
userSchema.virtual('completeAddress').get(function() {
  if (!this.address.street) return null;
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.country} ${this.address.zipCode}`;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Track password change
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Update profileCompleted flag
userSchema.pre('save', function(next) {
  const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
  const hasRequiredFields = requiredFields.every(field => this[field]);
  this.profileCompleted = hasRequiredFields;
  next();
});

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Get user profile for response
userSchema.methods.getProfile = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.passwordChangedAt;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationExpires;
  return userObj;
};

// Static methods
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
