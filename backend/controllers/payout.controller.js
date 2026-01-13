const Payout = require('../models/payout.model');
const User = require('../models/user.model');
const PayoutService = require('../services/payout.service');
const AppError = require('../utils/appError');

// Get all payouts (Superadmin only)
const getAllPayouts = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Only superadmin can view all payouts', 403));
    }
    
    const { page = 1, limit = 20, status, userId, paymentMethod } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    const payouts = await Payout.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payout.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: { payouts },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's payouts
const getUserPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    
    const payouts = await Payout.find(query)
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payout.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: { payouts },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Process payout (Superadmin only)
const processPayout = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Only superadmin can process payouts', 403));
    }
    
    const { payoutId } = req.params;
    const { status, externalRef, failureReason, notes } = req.body;
    
    const payout = await Payout.findById(payoutId)
      .populate('user');
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    // Update payout
    payout.status = status;
    payout.processedBy = req.user.id;
    payout.processedAt = new Date();
    
    if (externalRef) payout.externalRef = externalRef;
    if (failureReason) payout.failureReason = failureReason;
    if (notes) payout.notes = notes;
    
    // If completed, update completedAt
    if (status === 'COMPLETED') {
      payout.completedAt = new Date();
      
      // Update user's total withdrawn
      const user = await User.findById(payout.user._id);
      if (user) {
        user.wallet.totalWithdrawn += payout.amount;
        user.wallet.lastPayoutDate = new Date();
        await user.save();
      }
    }
    
    // If failed, return amount to user's available balance
    if (status === 'FAILED') {
      const user = await User.findById(payout.user._id);
      if (user) {
        user.wallet.availableBalance += payout.amount;
        await user.save();
      }
    }
    
    await payout.save();
    
    res.status(200).json({
      success: true,
      message: `Payout ${status.toLowerCase()} successfully`,
      data: { payout }
    });
  } catch (error) {
    next(error);
  }
};

// Trigger auto-payouts (Superadmin only - for testing)
const triggerAutoPayouts = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Only superadmin can trigger auto-payouts', 403));
    }
    
    const results = await PayoutService.processAllAutoPayouts();
    
    res.status(200).json({
      success: true,
      message: 'Auto-payouts processed',
      data: { results }
    });
  } catch (error) {
    next(error);
  }
};

// Get payout statistics
const getPayoutStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Only superadmin can view payout stats', 403));
    }
    
    // Total payouts
    const totalPayouts = await Payout.countDocuments();
    const completedPayouts = await Payout.countDocuments({ status: 'COMPLETED' });
    const pendingPayouts = await Payout.countDocuments({ status: 'PENDING' });
    const failedPayouts = await Payout.countDocuments({ status: 'FAILED' });
    
    // Total amount
    const totalAmount = await Payout.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Monthly stats
    const monthlyStats = await Payout.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    // Method distribution
    const methodStats = await Payout.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalPayouts,
        completedPayouts,
        pendingPayouts,
        failedPayouts,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyAmount: monthlyStats[0]?.total || 0,
        monthlyCount: monthlyStats[0]?.count || 0,
        methodStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayouts,
  getUserPayouts,
  processPayout,
  triggerAutoPayouts,
  getPayoutStats
};