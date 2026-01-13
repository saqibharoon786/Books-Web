const Payment = require("../models/payment.model.js");
const Book = require("../models/book.model.js");
const User = require("../models/user.model.js");
const Purchase = require("../models/purchases.model.js");
const Commission = require("../models/commission.model.js");
const { createPaymentWithCommission, verifyPayment, SafepayService } = require("../services/payment.service.js");

const createPayment = async (req, res) => {
  try {
    const { bookId } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    const userId = req.user.id;
    
    const book = await Book.findById(bookId).populate('uploader');
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: "Book not found" 
      });
    }
    
    if (book.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: "Book is not available for purchase" 
      });
    }
    
    const existingPurchase = await Purchase.findOne({
      user: userId,
      book: bookId,
      paymentStatus: 'completed'
    });
    
    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already purchased this book" 
      });
    }
    
    const amount = book.discountedPrice || book.price;
    const sellerType = book.uploaderType || 'admin';
    
    // Create payment with commission calculation
    const paymentData = await createPaymentWithCommission(
      amount, 
      userId, 
      bookId, 
      book.uploader._id,
      sellerType
    );
    
    // Save payment record
    const paymentRecord = await Payment.create({
      user: userId,
      book: bookId,
      amount: amount,
      seller: book.uploader._id,
      sellerType: sellerType,
      commission: paymentData.commission,
      transactionRef: paymentData.transactionRef,
      tracker: paymentData.tracker,
      status: "PENDING",
      safepayResponse: {
        tracker: paymentData.tracker,
        paymentUrl: paymentData.paymentUrl
      },
      metadata: {
        bookTitle: book.title,
        sellerName: book.uploader.fullName,
        ...paymentData.metadata
      }
    });
    
    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      payment: {
        paymentUrl: paymentData.paymentUrl,
        tracker: paymentData.tracker,
        transactionRef: paymentData.transactionRef
      },
      paymentId: paymentRecord._id,
      redirectUrl: paymentData.paymentUrl,
      transactionRef: paymentData.transactionRef,
      commissionBreakdown: paymentData.commission
    });
  } catch (error) {
    console.error("Payment Creation Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Safepay return URL handler
const safepayReturn = async (req, res) => {
  try {
    const { tracker, status, cancel } = req.query;
    
    if (cancel === 'true') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .btn { display: inline-block; padding: 10px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Payment Cancelled</div>
            <p>The payment was cancelled. You can try again.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/books" class="btn">Back to Books</a>
          </div>
        </body>
        </html>
      `);
    }
    
    if (!tracker) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Invalid Payment Response</h1>
          <p>No tracker found</p>
        </body>
        </html>
      `);
    }
    
    // Verify payment status with Safepay
    const verification = await verifyPayment(tracker);
    console.log("Safepay verification response:", verification);
    
    // Find payment record
    const payment = await Payment.findOne({ tracker })
      .populate('book')
      .populate('seller')
      .populate('user');
      
    if (!payment) {
      console.error("Payment not found for tracker:", tracker);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Payment Not Found</h1>
          <p>Tracker: ${tracker}</p>
        </body>
        </html>
      `);
    }
    
    const isSuccess = verification?.data?.state === 'paid' || 
                      verification?.data?.payment?.state === 'paid' ||
                      status === 'paid';
    
    if (isSuccess) {
      payment.status = "SUCCESS";
      payment.safepayResponse = {
        ...payment.safepayResponse,
        verification: verification.data
      };
      
      // Create purchase record
      const purchase = await Purchase.create({
        user: payment.user._id,
        book: payment.book._id,
        type: 'book',
        format: 'pdf',
        amount: payment.amount,
        seller: payment.seller._id,
        sellerType: payment.sellerType,
        commission: payment.commission,
        paymentMethod: 'safepay',
        paymentStatus: 'completed',
        transactionId: payment.transactionRef,
        safepayTracker: tracker,
        paymentDetails: {
          method: 'safepay',
          transactionId: payment.transactionRef,
          tracker: tracker,
          amount: payment.amount,
          currency: 'PKR',
          status: 'completed',
          timestamp: new Date()
        }
      });
      
      // Create commission record
      const commission = await Commission.create({
        payment: payment._id,
        book: payment.book._id,
        buyer: payment.user._id,
        seller: payment.seller._id,
        sellerType: payment.sellerType,
        totalAmount: payment.amount,
        sellerAmount: payment.commission.sellerAmount,
        superadminAmount: payment.commission.superadminAmount,
        commissionPercentage: payment.commission.commissionPercentage,
        status: "PROCESSED",
        processedAt: new Date()
      });
      
      // Distribute earnings
      const { distributePurchaseEarnings } = require('./purchase.controller');
      await distributePurchaseEarnings(purchase);
      
      payment.earningsStatus = 'PROCESSED';
      
      console.log(`Payment ${tracker} completed. Commission distributed.`);
      
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
            .details { text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .btn { display: inline-block; padding: 10px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Payment Successful!</div>
            <div class="details">
              <p><strong>Transaction ID:</strong> ${payment.transactionRef}</p>
              <p><strong>Tracker:</strong> ${tracker}</p>
              <p><strong>Amount:</strong> PKR ${payment.amount}</p>
              <p><strong>Book:</strong> ${payment.book?.title || 'Book'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Your book is now available for download.</p>
            <p>You will be redirected to your dashboard in 5 seconds...</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/books" class="btn">Go to Dashboard</a>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/books';
            }, 5000);
          </script>
        </body>
        </html>
      `;
      
      await payment.save();
      return res.send(successHtml);
    } else {
      payment.status = "FAILED";
      payment.safepayResponse = {
        ...payment.safepayResponse,
        verification: verification.data
      };
      await payment.save();
      
      const failedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .btn { display: inline-block; padding: 10px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Payment Failed</div>
            <p>The payment was not successful. Please try again.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/books/${payment.book?._id || ''}" class="btn">Try Again</a>
          </div>
        </body>
        </html>
      `;
      return res.send(failedHtml);
    }
    
  } catch (error) {
    console.error("Safepay Return Error:", error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Processing Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #ddd; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Payment Processing Error</h1>
          <p>An error occurred while processing your payment.</p>
          <p>Please contact support with your transaction details.</p>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3001'}';
          }, 5000);
        </script>
      </body>
      </html>
    `;
    res.status(500).send(errorHtml);
  }
};

// Safepay webhook handler
const safepayWebhook = async (req, res) => {
  try {
    console.log("Safepay Webhook Received:", req.body);
    
    const signature = req.headers["x-sfpy-signature"];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    
    // Verify webhook signature
    const isValid = SafepayService.verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.error("Invalid Safepay webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    const event = SafepayService.parseWebhookEvent(req.body);
    
    if (event.status === 'paid') {
      // Find payment by tracker
      const payment = await Payment.findOne({ tracker: event.tracker })
        .populate('book')
        .populate('seller')
        .populate('user');
        
      if (payment && payment.status !== "SUCCESS") {
        // Update payment status
        payment.status = "SUCCESS";
        payment.safepayResponse = {
          ...payment.safepayResponse,
          webhook: event
        };
        await payment.save();
        
        // Create purchase if not exists
        const existingPurchase = await Purchase.findOne({
          user: payment.user._id,
          book: payment.book._id,
          paymentStatus: 'completed'
        });
        
        if (!existingPurchase) {
          const purchase = await Purchase.create({
            user: payment.user._id,
            book: payment.book._id,
            type: 'book',
            format: 'pdf',
            amount: payment.amount,
            seller: payment.seller._id,
            sellerType: payment.sellerType,
            commission: payment.commission,
            paymentMethod: 'safepay',
            paymentStatus: 'completed',
            transactionId: payment.transactionRef,
            safepayTracker: event.tracker,
            paymentDetails: {
              method: 'safepay',
              transactionId: payment.transactionRef,
              tracker: event.tracker,
              amount: payment.amount,
              currency: 'PKR',
              status: 'completed',
              timestamp: new Date()
            }
          });
          
          // Distribute earnings async
          setTimeout(async () => {
            try {
              const { distributePurchaseEarnings } = require('./purchase.controller');
              await distributePurchaseEarnings(purchase);
              payment.earningsStatus = 'PROCESSED';
              await payment.save();
            } catch (error) {
              console.error("Webhook earnings distribution error:", error);
            }
          }, 0);
        }
        
        console.log(`Webhook: Payment ${event.tracker} processed`);
      }
    }
    
    // Always return 200 to Safepay
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(200).json({ received: true });
  }
};

const verifyPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('book', 'title')
      .populate('user', 'firstName lastName')
      .populate('seller', 'firstName lastName');
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        transactionRef: payment.transactionRef,
        tracker: payment.tracker,
        book: payment.book,
        seller: payment.seller,
        commission: payment.commission,
        earningsStatus: payment.earningsStatus,
        createdAt: payment.createdAt,
      }
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal Server Error" 
    });
  }
};

module.exports = { 
  createPayment, 
  safepayReturn, 
  safepayWebhook,
  verifyPayment: verifyPaymentStatus
};