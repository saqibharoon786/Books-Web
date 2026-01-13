const User = require('../models/user.model');
const Payout = require('../models/payout.model');
const Commission = require('../models/commission.model');
const AppError = require('../utils/appError');

// Get wallet information
const getWalletInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Get pending commissions
    const pendingCommissions = await Commission.find({
      seller: req.user.id,
      status: 'PROCESSED'
    })
    .populate('book', 'title')
    .populate('buyer', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Get recent payouts
    const recentPayouts = await Payout.find({
      user: req.user.id
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    const response = {
      success: true,
      data: {
        wallet: user.wallet,
        payoutSettings: user.payoutSettings,
        canWithdraw: user.wallet.availableBalance >= (user.payoutSettings.minimumPayout || 1000),
        minimumPayout: user.payoutSettings.minimumPayout || 1000,
        pendingCommissions,
        recentPayouts
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Connect JazzCash wallet
const connectJazzCashWallet = async (req, res, next) => {
  try {
    const { jazzcashNumber } = req.body;
    
    if (!jazzcashNumber) {
      return next(new AppError('JazzCash number is required', 400));
    }
    
    // Validate JazzCash number format (03XXXXXXXXX)
    const jazzcashRegex = /^03\d{9}$/;
    if (!jazzcashRegex.test(jazzcashNumber)) {
      return next(new AppError('Invalid JazzCash number format. Must be 03XXXXXXXXX', 400));
    }
    
    // Check if number is already registered
    const existingUser = await User.findOne({
      'wallet.jazzcash.number': jazzcashNumber,
      _id: { $ne: req.user.id }
    });
    
    if (existingUser) {
      return next(new AppError('This JazzCash number is already registered with another account', 400));
    }
    
    const user = await User.findById(req.user.id);
    
    // Update wallet
    user.wallet.jazzcash = {
      number: jazzcashNumber,
      verified: user.role === 'superadmin', // Superadmin auto-verified
      verifiedBy: user.role === 'superadmin' ? req.user.id : null,
      verifiedAt: user.role === 'superadmin' ? new Date() : null
    };
    
    // If user selects JazzCash as payout method, update it
    if (!user.payoutSettings.payoutMethod) {
      user.payoutSettings.payoutMethod = 'jazzcash';
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: user.role === 'superadmin' 
        ? 'JazzCash wallet connected and auto-verified' 
        : 'JazzCash wallet connected. Waiting for superadmin verification.',
      data: {
        wallet: user.wallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update payout settings
const updatePayoutSettings = async (req, res, next) => {
  try {
    const { autoPayout, payoutMethod, minimumPayout, payoutSchedule } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (autoPayout !== undefined) {
      user.payoutSettings.autoPayout = autoPayout;
    }
    
    if (payoutMethod) {
      // Validate wallet for selected payment method
      if (payoutMethod === 'jazzcash' && !user.wallet.jazzcash.number) {
        return next(new AppError('Please connect JazzCash wallet first', 400));
      }
      if (payoutMethod === 'easypaisa' && !user.wallet.easypaisa.number) {
        return next(new AppError('Please connect Easypaisa wallet first', 400));
      }
      if (payoutMethod === 'bank' && !user.wallet.bankAccount.accountNumber) {
        return next(new AppError('Please add bank account details first', 400));
      }
      
      user.payoutSettings.payoutMethod = payoutMethod;
    }
    
    if (minimumPayout) {
      if (minimumPayout < 1000) {
        return next(new AppError('Minimum payout must be at least PKR 1000', 400));
      }
      user.payoutSettings.minimumPayout = minimumPayout;
    }
    
    if (payoutSchedule) {
      user.payoutSettings.payoutSchedule = payoutSchedule;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Payout settings updated successfully',
      data: {
        payoutSettings: user.payoutSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Request manual payout
const requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return next(new AppError('Valid amount is required', 400));
    }
    
    const user = await User.findById(req.user.id);
    
    // Check minimum payout
    const minimumPayout = user.payoutSettings.minimumPayout || 1000;
    if (amount < minimumPayout) {
      return next(new AppError(`Minimum payout amount is PKR ${minimumPayout}`, 400));
    }
    
    // Check available balance
    if (amount > user.wallet.availableBalance) {
      return next(new AppError('Insufficient available balance', 400));
    }
    
    // Check wallet verification
    const payoutMethod = user.payoutSettings.payoutMethod || 'manual';
    let isWalletVerified = false;
    
    switch (payoutMethod) {
      case 'jazzcash':
        isWalletVerified = user.wallet.jazzcash.verified;
        break;
      case 'easypaisa':
        isWalletVerified = user.wallet.easypaisa.verified;
        break;
      case 'bank':
        isWalletVerified = user.wallet.bankAccount.verified;
        break;
      case 'manual':
        isWalletVerified = true;
        break;
    }
    
    if (!isWalletVerified) {
      return next(new AppError('Your wallet is not verified for the selected payment method', 400));
    }
    
    // Create payout request
    const payout = await Payout.create({
      user: req.user.id,
      amount: amount,
      paymentMethod: payoutMethod,
      recipientDetails: getRecipientDetails(user),
      status: 'PENDING',
      notes: 'Manual payout request'
    });
    
    // Deduct from available balance
    user.wallet.availableBalance -= amount;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        payout,
        newBalance: user.wallet.availableBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get recipient details
const getRecipientDetails = (user) => {
  const method = user.payoutSettings.payoutMethod || 'manual';
  
  switch (method) {
    case 'jazzcash':
      return {
        jazzcashNumber: user.wallet.jazzcash.number
      };
    case 'easypaisa':
      return {
        easypaisaNumber: user.wallet.easypaisa.number
      };
    case 'bank':
      return {
        bankAccount: user.wallet.bankAccount
      };
    default:
      return {};
  }
};

module.exports = {
  getWalletInfo,
  connectJazzCashWallet,
  updatePayoutSettings,
  requestPayout
};