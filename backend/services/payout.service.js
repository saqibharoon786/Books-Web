const SafepayService = require('./safepay.service'); // CHANGED FROM JazzCashService
const User = require('../models/user.model');
const Payout = require('../models/payout.model');
const Commission = require('../models/commission.model');
const { sendEmail } = require('../utils/2FA/sendEmail');

class PayoutService {
  constructor() {
    this.minimumPayout = Number.parseInt(process.env.MINIMUM_PAYOUT_AMOUNT) || 1000
  }

  async processAutoPayout(userId) {
    try {
      const user = await User.findById(userId)

      if (!user.payoutSettings.autoPayout) {
        return {
          success: false,
          message: 'Auto-payout not enabled for this user'
        };
      }

      if (user.wallet.availableBalance < this.minimumPayout) {
        return {
          success: false,
          message: `Insufficient balance. Minimum required: ${this.minimumPayout} PKR`,
        }
      }

      if (!this.isWalletVerified(user)) {
        return {
          success: false,
          message: "Wallet not verified for selected payment method",
        }
      }

      const amount = user.wallet.availableBalance;
      const paymentMethod = user.payoutSettings.payoutMethod;
      
      const payout = await Payout.create({
        user: userId,
        amount: amount,
        paymentMethod: paymentMethod,
        recipientDetails: this.getRecipientDetails(user),
        status: "PROCESSING",
        internalRef: `AUTO_${Date.now()}_${userId}`,
        notes: "Automatic weekly payout",
      })

      const commissions = await Commission.find({
        seller: userId,
        status: 'PROCESSED',
        payout: { $exists: false }
      }).limit(50);

      if (commissions.length > 0) {
        const commissionIds = commissions.map(c => c._id);
        await Commission.updateMany(
          { _id: { $in: commissionIds } },
          { 
            $set: { 
              payout: payout._id,
              status: 'PAID_OUT',
              paidOutAt: new Date()
            }
          }
        );
        
        payout.commissions = commissionIds;
        await payout.save();
      }

      const payoutResult = await this.processPayoutByMethod(user, amount, payout);

      if (payoutResult.success) {
        // Mark payout as completed
        await payout.markCompleted(payoutResult.transactionId)

        user.wallet.availableBalance -= amount;
        user.wallet.totalWithdrawn += amount;
        user.wallet.lastPayoutDate = new Date();
        await user.save();

        await this.sendPayoutNotification(user, payout, payoutResult);

        return {
          success: true,
          message: "Payout processed successfully",
          payout: payout,
          transactionId: payoutResult.transactionId,
        }
      } else {
        // Mark payout as failed
        await payout.markFailed(payoutResult.errorMessage || "Payout processing failed")

        return {
          success: false,
          message: payoutResult.errorMessage || "Payout failed",
          payout: payout,
        }
      }
    } catch (error) {
      console.error("Payout processing error:", error)
      return {
        success: false,
        message: error.message,
      }
    }
  }

  async processPayoutByMethod(user, amount, payout) {
    const method = user.payoutSettings.payoutMethod;
    
    switch (method) {
      case 'jazzcash':
        return this.processJazzCashPayout(user, amount, payout);
      case 'easypaisa':
        return this.processEasypaisaPayout(user, amount, payout);
      case 'bank':
        return this.processBankPayout(user, amount, payout);
      case 'safepay':
        return this.processSafepayPayout(user, amount, payout);
      default:
        return { success: false, message: 'Manual payout required' };
    }
  }

  async processJazzCashPayout(user, amount, payout) {
    const jazzcashNumber = user.wallet.jazzcash.number

    if (!jazzcashNumber) {
      return {
        success: false,
        errorMessage: "JazzCash number not found",
      }
    }

    try {
      // IMPLEMENT JazzCash API integration here
      // Placeholder - implement actual JazzCash API call
      const transactionId = `JC_${Date.now()}_${user._id}`;
      
      return {
        success: true,
        transactionId: transactionId,
        message: 'JazzCash payout processed'
      };
    } catch (error) {
      console.error('JazzCash payout error:', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async processSafepayPayout(user, amount, payout) {
    try {
      // Safepay payout implementation
      const result = await SafepayService.createPaymentRequest(
        amount,
        user._id,
        null,
        null,
        { type: 'payout', payoutId: payout._id }
      );

      return {
        success: true,
        transactionId: result.transactionRef,
        paymentUrl: result.paymentUrl,
        message: 'Safepay payout initiated'
      };
    } catch (error) {
      console.error('Safepay payout error:', error);
      return {
        success: false,
        errorMessage: error.message,
      }
    }
  }

  async processEasypaisaPayout(user, amount, payout) {
    // TODO: Implement Easypaisa API
    return {
      success: false,
      message: 'Easypaisa payout coming soon'
    };
  }

  async processBankPayout(user, amount, payout) {
    // TODO: Implement Bank transfer API
    return {
      success: false,
      message: 'Bank payout coming soon'
    };
  }

  isWalletVerified(user) {
    const method = user.payoutSettings.payoutMethod

    switch (method) {
      case 'jazzcash':
        return user.wallet.jazzcash.verified;
      case 'easypaisa':
        return user.wallet.easypaisa.verified;
      case 'bank':
        return user.wallet.bankAccount.verified;
      case 'safepay':
        return true; // Safepay doesn't need wallet verification
      case 'manual':
        return true;
      default:
        return false
    }
  }

  getRecipientDetails(user) {
    const method = user.payoutSettings.payoutMethod

    switch (method) {
      case 'jazzcash':
        return { jazzcashNumber: user.wallet.jazzcash.number };
      case 'easypaisa':
        return { easypaisaNumber: user.wallet.easypaisa.number };
      case 'bank':
        return { bankAccount: user.wallet.bankAccount };
      case 'safepay':
        return { email: user.email, name: user.fullName };
      default:
        return {}
    }
  }

  async sendPayoutNotification(user, payout, result) {
    try {
      const emailContent = `
        <h2>Payout Processed Successfully</h2>
        <p>Hello ${user.fullName},</p>
        <p>Your weekly payout of <strong>PKR ${payout.amount}</strong> has been processed successfully!</p>
        <p><strong>Transaction ID:</strong> ${result.transactionId || payout.internalRef}</p>
        <p><strong>Payment Method:</strong> ${payout.paymentMethod}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p>You should receive the amount within 24-48 hours depending on your payment method.</p>
        <p>Thank you for being part of our bookstore community!</p>
      `

      await sendEmail({
        to: user.email,
        subject: "Your Weekly Payout Has Been Processed",
        html: emailContent,
      })
    } catch (error) {
      console.error("Failed to send payout notification:", error)
    }
  }

  async processAllAutoPayouts() {
    try {
      console.log("Starting weekly auto-payout processing...")

      const users = await User.find({
        'payoutSettings.autoPayout': true,
        'wallet.availableBalance': { $gte: this.minimumPayout }
      }).select('_id email wallet payoutSettings fullName');

      console.log(`Found ${users.length} users eligible for auto-payout`)

      const results = []
      for (const user of users) {
        try {
          const result = await this.processAutoPayout(user._id)
          results.push({
            userId: user._id,
            email: user.email,
            success: result.success,
            message: result.message,
            amount: user.wallet.availableBalance,
          })
        } catch (error) {
          results.push({
            userId: user._id,
            email: user.email,
            success: false,
            message: error.message,
          })
        }
      }

      console.log('Auto-payout processing completed');
      return results;
    } catch (error) {
      console.error("Auto-payout processing error:", error)
      throw error
    }
  }

  /**
   * Get payout history for a user
   */
  async getUserPayoutHistory(userId, limit = 20, skip = 0) {
    return await Payout.find({ user: userId })
      .populate("commissions", "totalAmount sellerAmount superadminAmount")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
  }

  /**
   * Get pending payouts for manual approval
   */
  async getPendingPayouts(limit = 20) {
    return await Payout.find({ status: "PENDING" })
      .populate("user", "email fullName wallet.jazzcash wallet.easypaisa")
      .sort({ createdAt: -1 })
      .limit(limit)
  }
}

module.exports = new PayoutService()
