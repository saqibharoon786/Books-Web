const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    // Role and Status
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'customer'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile Information
    profileImage: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },

    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },

    // Professional Information (for Admin/Superadmin)
    profession: String,
    qualification: String,
    experience: Number,
    bio: {
      type: String,
      maxlength: 500,
    },

    // CNIC Verification (KEEPING AS PER YOUR REQUEST)
    cnic: {
      number: { type: String, trim: true, default: null },
      frontImage: {
        url: { type: String, default: null },
        filename: { type: String, default: null },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: null },
      },
      backImage: {
        url: { type: String, default: null },
        filename: { type: String, default: null },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: null },
      },
      verified: { type: Boolean, default: false },
    },

    // Address Information
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Pakistan' },
      zipCode: { type: String, trim: true },
    },

    // Wallet and Earnings System (UPDATED)
    wallet: {
      jazzcash: {
        number: { type: String, sparse: true },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date
      },
      easypaisa: {
        number: String,
        verified: { type: Boolean, default: false },
      },
      bankAccount: {
        accountTitle: String,
        accountNumber: String,
        bankName: String,
        iban: String,
        verified: { type: Boolean, default: false },
      },
      // Earnings tracking
      totalEarnings: { type: Number, default: 0 },
      availableBalance: { type: Number, default: 0 }, // Can withdraw
      pendingBalance: { type: Number, default: 0 },   // Not yet cleared
      totalWithdrawn: { type: Number, default: 0 },
      lastPayoutDate: Date
    },

    // Payout Settings
    payoutSettings: {
      autoPayout: { type: Boolean, default: false },
      payoutMethod: { 
        type: String, 
        enum: ['jazzcash', 'easypaisa', 'bank', 'manual'], 
        default: 'manual'
      },
      minimumPayout: { type: Number, default: 1000 },
      payoutSchedule: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly', 'manual'], 
        default: 'manual'
      }
    },

    // Statistics
    totalBooksUploaded: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },

    // Security
    lastLogin: { type: Date, default: null },
    lastPasswordChange: Date,
    loginAttempts: { type: Number, default: 0 },
    accountLockedUntil: Date,

    // OTP Verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual Fields
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin' || this.role === 'superadmin';
});

userSchema.virtual('isSuperAdmin').get(function () {
  return this.role === 'superadmin';
});

userSchema.virtual('walletVerified').get(function () {
  if (this.payoutSettings.payoutMethod === 'jazzcash') {
    return this.wallet.jazzcash.verified;
  } else if (this.payoutSettings.payoutMethod === 'easypaisa') {
    return this.wallet.easypaisa.verified;
  } else if (this.payoutSettings.payoutMethod === 'bank') {
    return this.wallet.bankAccount.verified;
  }
  return true; // manual doesn't need verification
});

// Indexes
// userSchema.index({ email: 1 });
// userSchema.index({ role: 1, isActive: 1 });
// userSchema.index({ 'wallet.jazzcash.number': 1 }, { sparse: true });
// userSchema.index({ 'wallet.totalEarnings': -1 });

// Password Encryption
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.lastPasswordChange = Date.now();
  next();
});

// Instance Methods
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.lastPasswordChange) {
    const changedTimestamp = parseInt(this.lastPasswordChange.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  return otp;
};

userSchema.methods.getPublicProfile = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpires;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationExpires;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  delete userObj.loginAttempts;
  delete userObj.accountLockedUntil;
  return userObj;
};

userSchema.methods.getProfile = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpires;
  delete userObj.loginAttempts;
  delete userObj.accountLockedUntil;
  return userObj;
};

// Wallet methods
userSchema.methods.addEarnings = async function(amount, type = 'sale') {
  this.wallet.totalEarnings += amount;
  this.wallet.pendingBalance += amount;
  
  // Auto move to available balance after 24 hours (to prevent fraud)
  setTimeout(async () => {
    if (this.wallet.pendingBalance >= amount) {
      this.wallet.pendingBalance -= amount;
      this.wallet.availableBalance += amount;
      await this.save();
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  await this.save();
  return this;
};

userSchema.methods.requestPayout = async function(amount) {
  if (amount > this.wallet.availableBalance) {
    throw new Error('Insufficient available balance');
  }
  
  if (amount < (this.payoutSettings.minimumPayout || 1000)) {
    throw new Error(`Minimum payout is ${this.payoutSettings.minimumPayout || 1000}`);
  }
  
  this.wallet.availableBalance -= amount;
  await this.save();
  
  return {
    success: true,
    amount: amount,
    availableBalance: this.wallet.availableBalance
  };
};

module.exports = mongoose.model('User', userSchema);