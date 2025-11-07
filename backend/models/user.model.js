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

  // OTP Verification Fields
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  otpBlockedUntil: {
    type: Date,
    default: null,
    select: false
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
  
  // Remove old token fields since we're using OTP now
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
// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ otpExpires: 1 }); // For OTP expiration cleanup

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

// OTP Methods
userSchema.methods.createOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpAttempts = 0;
  this.otpBlockedUntil = null;
  return otp;
};

userSchema.methods.verifyOTP = function(candidateOTP) {
  // Check if OTP is blocked
  if (this.otpBlockedUntil && this.otpBlockedUntil > Date.now()) {
    return {
      isValid: false,
      message: `Too many failed attempts. Try again after ${Math.ceil((this.otpBlockedUntil - Date.now()) / 60000)} minutes.`
    };
  }

  // Check if OTP exists and not expired
  if (!this.otp || !this.otpExpires || this.otpExpires < Date.now()) {
    return {
      isValid: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  // Verify OTP
  if (this.otp === candidateOTP) {
    this.otp = undefined;
    this.otpExpires = undefined;
    this.otpAttempts = 0;
    this.otpBlockedUntil = null;
    return {
      isValid: true,
      message: 'OTP verified successfully.'
    };
  } else {
    // Increment failed attempts
    this.otpAttempts += 1;
    
    // Block after 5 failed attempts for 30 minutes
    if (this.otpAttempts >= 5) {
      this.otpBlockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      return {
        isValid: false,
        message: 'Too many failed attempts. Account temporarily blocked for 30 minutes.'
      };
    }
    
    return {
      isValid: false,
      message: `Invalid OTP. ${5 - this.otpAttempts} attempts remaining.`
    };
  }
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
  delete userObj.otp;
  delete userObj.otpExpires;
  delete userObj.otpAttempts;
  delete userObj.otpBlockedUntil;
  return userObj;
};

// Static methods
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Cleanup expired OTPs (you can run this periodically)
userSchema.statics.cleanupExpiredOTPs = function() {
  return this.updateMany(
    { otpExpires: { $lt: Date.now() } },
    { 
      $unset: { 
        otp: 1, 
        otpExpires: 1 
      },
      $set: {
        otpAttempts: 0,
        otpBlockedUntil: null
      }
    }
  );
};

module.exports = mongoose.model('User', userSchema);