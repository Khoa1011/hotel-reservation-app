const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Booking = require('../Model/Booking/Booking'); // Import Booking model

// ===== HELPER FUNCTIONS =====
function formatDateForZaloPay(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getCurrentDateTime() {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
}

// ===== MOMO PAYMENT ===== ✅ ENHANCED
router.post('/momo/create', async (req, res) => {
  try {
    const { orderId, amount, orderInfo, userId  } = req.body;
    
    // Validate input
    if (!orderId || !amount || !orderInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, amount, orderInfo' 
      });
    }

    // Validate amount
    if (amount < 10000 || amount > 50000000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be between 10,000 and 50,000,000 VND' 
      });
    }
    
    // MoMo Configuration
    const MOMO_CONFIG = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
      accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
      endpoint: "https://test-payment.momo.vn/v2/gateway/api/create"
    };
    
    const requestId = `MOMO_${orderId}_${Date.now()}`;
    const redirectUrl = `${process.env.APP_URL || 'http://localhost:3000'}/payment/momo/return`;
    const ipnUrl = `${process.env.API_URL || 'http://localhost:3000'}/api/payment/momo/ipn`;
    const extraData = Buffer.from(JSON.stringify({ orderId })).toString('base64');
    
    // Create signature - order matters!
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithATM`;
    
    const signature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: "Hotel Booking",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      requestType: "payWithATM", // or "captureWallet"
      extraData: extraData,
      signature: signature,
      lang: "vi"
    };
    
    console.log('🔄 MoMo Request:', { ...requestBody, signature: '***' });
    
    const response = await axios.post(MOMO_CONFIG.endpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ MoMo Response:', response.data);
    
    // Store payment info in booking
     if (userId) {
      const latestBooking = await Booking.findOne({
        maNguoiDung: userId,
        trangThaiThanhToan: 'chua_thanh_toan'
      }).sort({ createdAt: -1 });
      
      if (latestBooking) {
        await Booking.findByIdAndUpdate(latestBooking._id, {
          $set: { 
            'thongTinThanhToan.maDonHang': orderId,
            'thongTinThanhToan.momoRequestId': requestId,
            'thongTinThanhToan.phuongThucThanhToan': 'Momo'
          }
        });
        console.log(`✅ Updated booking ${latestBooking._id} with orderId: ${orderId}`);
      } else {
        console.log('⚠️ No unpaid booking found for user:', userId);
      }
    }
    
    res.json({
      success: true,
      message: "MoMo payment created successfully",
      data: response.data
    });
  } catch (error) {
    console.error('❌ MoMo Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create MoMo payment",
      error: error.response?.data?.message || error.message 
    });
  }
});

// MoMo IPN (Instant Payment Notification)
router.post('/momo/ipn', async (req, res) => {
  try {
    const momoData = req.body;
    console.log('📨 MoMo IPN received:', momoData);
    
    // Verify signature
    const MOMO_CONFIG = {
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz"
    };
    
    const rawSignature = `accessKey=${momoData.accessKey}&amount=${momoData.amount}&extraData=${momoData.extraData}&message=${momoData.message}&orderId=${momoData.orderId}&orderInfo=${momoData.orderInfo}&orderType=${momoData.orderType}&partnerCode=${momoData.partnerCode}&payType=${momoData.payType}&requestId=${momoData.requestId}&responseTime=${momoData.responseTime}&resultCode=${momoData.resultCode}&transId=${momoData.transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    if (expectedSignature !== momoData.signature) {
      console.error('❌ Invalid MoMo signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Find and update booking
    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': momoData.orderId
    });
    
    if (booking) {
      if (momoData.resultCode === 0) {
        // Payment successful
        booking.trangThaiThanhToan = 'da_thanh_toan';
        booking.trangThai = 'da_xac_nhan';
        booking.thongTinThanhToan.thoiGianThanhToan = new Date();
        booking.thongTinThanhToan.daXacThuc = true;
      }
      
      booking.thongTinThanhToan.transactionId = momoData.transId;
      await booking.save();
      
      console.log(`✅ Updated booking ${booking._id} with MoMo payment result`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ MoMo IPN Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// MoMo Return URL Handler
router.get('/momo/return', async (req, res) => {
  try {
    const { orderId, resultCode } = req.query;
    
    if (resultCode === '0') {
      res.redirect(`${process.env.APP_URL}/payment/success?orderId=${orderId}&method=momo`);
    } else {
      res.redirect(`${process.env.APP_URL}/payment/failed?orderId=${orderId}&method=momo`);
    }
  } catch (error) {
    console.error('❌ MoMo Return Error:', error);
    res.redirect(`${process.env.APP_URL}/payment/error`);
  }
});

// ===== VNPAY PAYMENT ===== ✅ FIXED & ENHANCED
router.post('/vnpay/create', async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;
    
    // Validate input
    if (!orderId || !amount || !orderInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, amount, orderInfo' 
      });
    }

    // Validate amount
    if (amount < 5000 || amount > 500000000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be between 5,000 and 500,000,000 VND' 
      });
    }
    
    // VNPay Configuration
    const VNPAY_CONFIG = {
      tmnCode: process.env.VNPAY_TMN_CODE || "DEMOV210",
      hashSecret: process.env.VNPAY_HASH_SECRET || "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ",
      url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    };
    
    const vnpParams = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': VNPAY_CONFIG.tmnCode,
      'vnp_Amount': (amount * 100).toString(), // VNPay uses cents
      'vnp_CurrCode': 'VND',
      'vnp_TxnRef': `VNPAY_${orderId}_${Date.now()}`,
      'vnp_OrderInfo': orderInfo,
      'vnp_OrderType': 'other',
      'vnp_Locale': 'vn',
      'vnp_ReturnUrl': `${process.env.API_URL || 'http://localhost:3000'}/api/payment/vnpay/return`,
      'vnp_IpAddr': getClientIP(req),
      'vnp_CreateDate': getCurrentDateTime(),
    };
    
    // Sort parameters alphabetically
    const sortedParams = Object.keys(vnpParams).sort().reduce((result, key) => {
      result[key] = vnpParams[key];
      return result;
    }, {});
    
    // Create query string with proper encoding
    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Create signature
    const signature = crypto
      .createHmac('sha512', VNPAY_CONFIG.hashSecret)
      .update(queryString)
      .digest('hex');
    
    const paymentUrl = `${VNPAY_CONFIG.url}?${queryString}&vnp_SecureHash=${signature}`;
    
    console.log('🔄 VNPay Request created for order:', orderId);
    
    // Store payment info in booking
    await Booking.findOneAndUpdate(
      { 'thongTinThanhToan.maDonHang': orderId },
      { 
        $set: { 
          'thongTinThanhToan.vnpayTxnRef': vnpParams.vnp_TxnRef,
          'thongTinThanhToan.phuongThucThanhToan': 'VNPay'
        }
      }
    );
    
    res.json({ 
      success: true,
      message: "VNPay payment created successfully",
      data: {
        paymentUrl: paymentUrl, 
        orderId: orderId,
        txnRef: vnpParams.vnp_TxnRef
      }
    });
  } catch (error) {
    console.error('❌ VNPay Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create VNPay payment",
      error: error.message 
    });
  }
});

// VNPay Return URL Handler
router.get('/vnpay/return', async (req, res) => {
  try {
    const vnpParams = req.query;
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];
    
    // Sort parameters and create signature for verification
    const sortedParams = Object.keys(vnpParams).sort().reduce((result, key) => {
      result[key] = vnpParams[key];
      return result;
    }, {});
    
    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const VNPAY_CONFIG = {
      hashSecret: process.env.VNPAY_HASH_SECRET || "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ"
    };
    
    const expectedSignature = crypto
      .createHmac('sha512', VNPAY_CONFIG.hashSecret)
      .update(queryString)
      .digest('hex');
    
    console.log('📨 VNPay Return:', vnpParams);
    
    if (expectedSignature === secureHash) {
      // Extract orderId from txnRef
      const orderId = vnpParams.vnp_TxnRef.split('_')[1];
      
      // Find and update booking
      const booking = await Booking.findOne({
        'thongTinThanhToan.maDonHang': orderId
      });
      
      if (booking) {
        if (vnpParams.vnp_ResponseCode === '00') {
          // Payment successful
          booking.trangThaiThanhToan = 'da_thanh_toan';
          booking.trangThai = 'da_xac_nhan';
          booking.thongTinThanhToan.thoiGianThanhToan = new Date();
          booking.thongTinThanhToan.daXacThuc = true;
        }
        
        booking.thongTinThanhToan.vnpayData = vnpParams;
        await booking.save();
      }
      
      if (vnpParams.vnp_ResponseCode === '00') {
        res.redirect(`${process.env.APP_URL}/payment/success?orderId=${orderId}&method=vnpay`);
      } else {
        res.redirect(`${process.env.APP_URL}/payment/failed?orderId=${orderId}&method=vnpay&code=${vnpParams.vnp_ResponseCode}`);
      }
    } else {
      res.redirect(`${process.env.APP_URL}/payment/error?reason=invalid_signature`);
    }
  } catch (error) {
    console.error('❌ VNPay Return Error:', error);
    res.redirect(`${process.env.APP_URL}/payment/error`);
  }
});

// ===== ZALOPAY PAYMENT ===== ✅ ALREADY FIXED
router.post('/zalopay/create', async (req, res) => {
  try {
    const { orderId, amount, description,  userId } = req.body;
    
    // Validate input
    if (!orderId || !amount || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, amount, description' 
      });
    }

    // Validate amount
    if (amount < 1000 || amount > 500000000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be between 1,000 and 500,000,000 VND' 
      });
    }
    
    // Ensure amount is integer
    const intAmount = parseInt(amount);
    
    // ZaloPay Configuration
    const ZALOPAY_CONFIG = {
      appId: process.env.ZALOPAY_APP_ID || "2553",
      key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create"
    };
    
    // ✅ FIXED: Simpler app_trans_id format
    const appTransId = `${formatDateForZaloPay(new Date())}_${Date.now()}`;
    
    // ✅ FIXED: Remove special characters and orderId from embed_data
    const embedData = JSON.stringify({
      redirecturl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/zalopay/return`
    });
    
    // ✅ FIXED: Use English only, no Vietnamese characters
    const item = JSON.stringify([{
      itemid: "hotel_booking",
      itemname: "Hotel Room Booking",
      itemprice: intAmount,
      itemquantity: 1
    }]);
    
    const orderData = {
      app_id: parseInt(ZALOPAY_CONFIG.appId),
      app_user: `user${Date.now()}`,
      app_time: Date.now(),
      amount: intAmount,
      app_trans_id: appTransId,
      embed_data: embedData,
      item: item,
      description: description.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '').substring(0, 50), // Remove Vietnamese chars
      callback_url: `${process.env.API_URL || 'http://localhost:3000'}/api/payment/zalopay/callback`,
      bank_code: ""
    };
    
    // Create MAC signature
    const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    orderData.mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key1).update(data).digest('hex');
    
    console.log('🔄 ZaloPay Request for order:', orderId);
    console.log('📋 ZaloPay Order Data:', JSON.stringify(orderData, null, 2));
    console.log('🔐 MAC Data String:', data);
    console.log('🔐 Generated MAC:', orderData.mac);
    
    // ✅ ALTERNATIVE: Use URLSearchParams for proper form encoding
    const formData = new URLSearchParams();
    Object.keys(orderData).forEach(key => {
      formData.append(key, orderData[key]);
    });
    
    const response = await axios.post(ZALOPAY_CONFIG.endpoint, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    console.log('✅ ZaloPay Response:', response.data);
    
    // Log chi tiết nếu có lỗi
    if (response.data.return_code !== 1) {
      console.error('❌ ZaloPay Error Details:', {
        return_code: response.data.return_code,
        return_message: response.data.return_message,
        sub_return_code: response.data.sub_return_code,
        sub_return_message: response.data.sub_return_message
      });
    }
    

    if (userId) {
      const latestBooking = await Booking.findOne({
        maNguoiDung: userId,
        trangThaiThanhToan: 'chua_thanh_toan'
      }).sort({ createdAt: -1 });
      
      if (latestBooking) {
        await Booking.findByIdAndUpdate(latestBooking._id, {
          $set: { 
            'thongTinThanhToan.maDonHang': orderId,
            'thongTinThanhToan.zaloPayAppTransId': appTransId,
            'thongTinThanhToan.phuongThucThanhToan': 'ZaloPay'
          }
        });
        console.log(`✅ Updated booking ${latestBooking._id} with orderId: ${orderId}`);
      } else {
        console.log('⚠️ No unpaid booking found for user:', userId);
      }
    }
    
    
    res.json({
      success: true,
      message: "ZaloPay payment created successfully",
      data: {
        ...response.data,
        app_trans_id: appTransId
      }
    });
  } catch (error) {
    console.error('❌ ZaloPay Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create ZaloPay payment",
      error: error.response?.data?.message || error.message 
    });
  }
});
// ZaloPay Callback
router.post('/zalopay/callback', async (req, res) => {
  try {
    const cbdata = req.body;
    console.log('📨 ZaloPay Callback received:', cbdata);
    
    // Verify MAC
    const ZALOPAY_CONFIG = {
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz"
    };
    
    const dataStr = cbdata.data;
    const reqMac = cbdata.mac;
    
    const mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key2)
                     .update(dataStr)
                     .digest('hex');
    
    if (reqMac !== mac) {
      console.error('❌ Invalid ZaloPay MAC');
      return res.json({ return_code: -1, return_message: "mac not equal" });
    }
    
    // Parse callback data
  
    const dataJson = JSON.parse(dataStr);
    const orderId = dataJson.app_trans_id.split('_')[1]; // Extract orderId
    
    // Find and update booking
    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': orderId
    });
    
    if (booking) {
      booking.trangThaiThanhToan = 'da_thanh_toan';
      booking.trangThai = 'da_xac_nhan';
      booking.thongTinThanhToan.thoiGianThanhToan = new Date();
      booking.thongTinThanhToan.daXacThuc = true;
      booking.thongTinThanhToan.zaloPayData = { ...cbdata, parsedData: dataJson };
      
      await booking.save();
      console.log(`✅ Updated booking ${booking._id} with ZaloPay payment success`);
    }
    
    res.json({ return_code: 1, return_message: "success" });
  } catch (error) {
    console.error('❌ ZaloPay Callback Error:', error);
    res.json({ return_code: 0, return_message: "failed" });
  }
});

// ZaloPay Return URL Handler
router.get('/zalopay/return', async (req, res) => {
  try {
    const { status, orderId } = req.query;
    
    if (status === '1') {
      res.redirect(`${process.env.APP_URL}/payment/success?orderId=${orderId}&method=zalopay`);
    } else {
      res.redirect(`${process.env.APP_URL}/payment/failed?orderId=${orderId}&method=zalopay`);
    }
  } catch (error) {
    console.error('❌ ZaloPay Return Error:', error);
    res.redirect(`${process.env.APP_URL}/payment/error`);
  }
});

// ===== CHECK PAYMENT STATUS =====
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': orderId
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found for orderId: ' + orderId
      });
    }
    
    res.json({
      success: true,
      message: "Payment status retrieved successfully",
      data: {
        orderId: orderId,
        bookingId: booking._id,
        status: booking.trangThaiThanhToan,
        bookingStatus: booking.trangThai,
        paymentMethod: booking.phuongThucThanhToan,
        amount: booking.thongTinGia?.tongDonDat || 0,
        paymentTime: booking.thongTinThanhToan?.thoiGianThanhToan,
        isVerified: booking.thongTinThanhToan?.daXacThuc || false,
        transactionId: booking.thongTinThanhToan?.transactionId || 
                      booking.thongTinThanhToan?.momoData?.transId || 
                      booking.thongTinThanhToan?.vnpayData?.vnp_TransactionNo ||
                      booking.thongTinThanhToan?.zaloPayData?.zp_trans_id ||
                      null,
        transactionData: {
          momo: booking.thongTinThanhToan?.momoData,
          vnpay: booking.thongTinThanhToan?.vnpayData,
          zalopay: booking.thongTinThanhToan?.zaloPayData
        }
      }
    });
  } catch (error) {
    console.error('❌ Get payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get payment status",
      error: error.message 
    });
  }
});

// ===== BULK CHECK PAYMENT STATUS =====
router.post('/status/bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'orderIds must be an array' 
      });
    }
    
    const bookings = await Booking.find({
      'thongTinThanhToan.maDonHang': { $in: orderIds }
    });
    
    const results = bookings.map(booking => ({
      orderId: booking.thongTinThanhToan.maDonHang,
      bookingId: booking._id,
      status: booking.trangThaiThanhToan,
      bookingStatus: booking.trangThai,
      paymentMethod: booking.phuongThucThanhToan,
      amount: booking.thongTinGia?.tongDonDat || 0,
      paymentTime: booking.thongTinThanhToan?.thoiGianThanhToan,
      isVerified: booking.thongTinThanhToan?.daXacThuc || false
    }));
    
    res.json({
      success: true,
      message: "Bulk payment status retrieved successfully",
      data: results
    });
  } catch (error) {
    console.error('❌ Bulk payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get bulk payment status",
      error: error.message 
    });
  }
});

module.exports = router;