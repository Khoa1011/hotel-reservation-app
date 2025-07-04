const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Booking = require('../Model/Booking/Booking');

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
    const { orderId, amount, orderInfo, userId } = req.body;

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

    console.log("MoMo payment created successfully");
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
    console.log('📨 MoMo IPN received at:', new Date().toISOString());
    console.log('📨 Full MoMo data:', JSON.stringify(momoData, null, 2));
    console.log('📨 MoMo headers:', req.headers);

    // Verify signature
    const MOMO_CONFIG = {
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz"
    };

    // ✅ FIX: Correct signature order theo MoMo documentation
    const rawSignature = `accessKey=${momoData.accessKey}&amount=${momoData.amount}&extraData=${momoData.extraData}&message=${momoData.message}&orderId=${momoData.orderId}&orderInfo=${momoData.orderInfo}&orderType=${momoData.orderType}&partnerCode=${momoData.partnerCode}&payType=${momoData.payType}&requestId=${momoData.requestId}&responseTime=${momoData.responseTime}&resultCode=${momoData.resultCode}&transId=${momoData.transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    console.log('🔐 Raw signature string:', rawSignature);
    console.log('🔐 Expected signature:', expectedSignature);
    console.log('🔐 Received signature:', momoData.signature);
    console.log('🔐 Signature match:', expectedSignature === momoData.signature);

    // ✅ IMPORTANT: Always respond OK to MoMo first, then process
    res.status(200).json({ success: true, message: 'IPN received' });

    if (expectedSignature !== momoData.signature) {
      console.error('❌ Invalid MoMo signature, but still responding OK');
      return; // Don't process payment but still respond OK
    }

    console.log('🔍 Searching for booking with orderId:', momoData.orderId);

    // Find and update booking
    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': momoData.orderId
    });

    console.log('📋 Found booking:', booking ? booking._id : 'NOT FOUND');

    if (booking) {
      console.log('💳 Processing MoMo result. ResultCode:', momoData.resultCode);

      if (momoData.resultCode === 0) {
        // Payment successful
        booking.trangThaiThanhToan = 'da_thanh_toan';
        booking.trangThai = 'da_xac_nhan';
        booking.thongTinThanhToan.thoiGianThanhToan = new Date();
        booking.thongTinThanhToan.daXacThuc = true;
        console.log('✅ Marking booking as PAID');
      } else {
        console.log('❌ MoMo payment failed with code:', momoData.resultCode);
        booking.trangThaiThanhToan = 'that_bai';
      }

      booking.thongTinThanhToan.transactionId = momoData.transId;
      booking.thongTinThanhToan.momoData = momoData;

      await booking.save();
      console.log(`✅ Updated booking ${booking._id} with MoMo payment result`);
    } else {
      console.log(`⚠️ No booking found for orderId: ${momoData.orderId}`);
    }

  } catch (error) {
    console.error('❌ MoMo IPN Error:', error);
    // Still respond OK to prevent MoMo from retrying
    res.status(200).json({ success: true, message: 'Error processed' });
  }
});



//=======================================================================================



router.post('/momo/query/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('🔍 Querying MoMo payment status for:', orderId);

    // Tìm booking để lấy requestId
    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': orderId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const requestId = booking.thongTinThanhToan.momoRequestId;
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'No MoMo requestId found in booking'
      });
    }

    // MoMo Query Config
    const MOMO_CONFIG = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
      accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
      endpoint: "https://test-payment.momo.vn/v2/gateway/api/query"
    };

    // Tạo signature cho query
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&orderId=${orderId}&partnerCode=${MOMO_CONFIG.partnerCode}&requestId=${requestId}`;

    const signature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    const queryBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      requestId: requestId,
      orderId: orderId,
      signature: signature,
      lang: "vi"
    };

    console.log('🔄 MoMo Query Request:', { ...queryBody, signature: '***' });

    // Gọi MoMo Query API
    const response = await axios.post(MOMO_CONFIG.endpoint, queryBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ MoMo Query Response:', response.data);

    // Cập nhật booking nếu payment đã thành công
    if (response.data.resultCode === 0) {
      console.log('🎉 MoMo payment confirmed via query!');

      booking.trangThaiThanhToan = 'da_thanh_toan';
      booking.trangThai = 'da_xac_nhan';
      booking.thongTinThanhToan.thoiGianThanhToan = new Date();
      booking.thongTinThanhToan.daXacThuc = true;
      booking.thongTinThanhToan.transactionId = response.data.transId;
      booking.thongTinThanhToan.momoData = response.data;

      await booking.save();
      console.log(`✅ Updated booking ${booking._id} via MoMo query`);
    }

    res.json({
      success: true,
      message: "MoMo query completed",
      data: response.data,
      bookingStatus: {
        id: booking._id,
        status: booking.trangThaiThanhToan,
        verified: booking.thongTinThanhToan.daXacThuc,
        transactionId: booking.thongTinThanhToan.transactionId
      }
    });

  } catch (error) {
    console.error('❌ MoMo Query Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to query MoMo payment",
      error: error.response?.data?.message || error.message
    });
  }
});

// ✅ Enhanced payment status check with MoMo query fallback
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔍 Checking payment status for:', orderId);

    const booking = await Booking.findOne({
      'thongTinThanhToan.maDonHang': orderId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for orderId: ' + orderId
      });
    }

    console.log('📋 Found booking:', booking._id);
    console.log('💳 Current status:', booking.trangThaiThanhToan);
    console.log('🔐 Is verified:', booking.thongTinThanhToan?.daXacThuc);

    // ✅ AUTO QUERY MOMO nếu status vẫn pending và là MoMo payment
    if (booking.trangThaiThanhToan === 'chua_thanh_toan' &&
      booking.thongTinThanhToan?.phuongThucThanhToan === 'Momo' &&
      booking.thongTinThanhToan?.momoRequestId) {

      console.log('🔄 Auto-querying MoMo for pending payment...');

      try {
        // Query MoMo directly
        const MOMO_CONFIG = {
          partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
          accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
          secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
          endpoint: "https://test-payment.momo.vn/v2/gateway/api/query"
        };

        const requestId = booking.thongTinThanhToan.momoRequestId;
        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&orderId=${orderId}&partnerCode=${MOMO_CONFIG.partnerCode}&requestId=${requestId}`;

        const signature = crypto
          .createHmac('sha256', MOMO_CONFIG.secretKey)
          .update(rawSignature)
          .digest('hex');

        const queryBody = {
          partnerCode: MOMO_CONFIG.partnerCode,
          requestId: requestId,
          orderId: orderId,
          signature: signature,
          lang: "vi"
        };

        const momoResponse = await axios.post(MOMO_CONFIG.endpoint, queryBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        console.log('🔍 MoMo auto-query result:', momoResponse.data);

        // Cập nhật nếu thanh toán thành công
        if (momoResponse.data.resultCode === 0) {
          console.log('🎉 MoMo payment confirmed via auto-query!');

          booking.trangThaiThanhToan = 'da_thanh_toan';
          booking.trangThai = 'da_xac_nhan';
          booking.thongTinThanhToan.thoiGianThanhToan = new Date();
          booking.thongTinThanhToan.daXacThuc = true;
          booking.thongTinThanhToan.transactionId = momoResponse.data.transId;
          booking.thongTinThanhToan.momoData = momoResponse.data;

          await booking.save();
          console.log(`✅ Auto-updated booking ${booking._id} via MoMo query`);
        }

      } catch (queryError) {
        console.log('⚠️ MoMo auto-query failed:', queryError.message);
        // Continue với status hiện tại
      }
    }

    // Return final status
    const response = {
      success: true,
      message: "Payment status retrieved successfully",
      data: {
        orderId: orderId,
        bookingId: booking._id,
        status: booking.trangThaiThanhToan,
        bookingStatus: booking.trangThai,
        paymentMethod: booking.thongTinThanhToan?.phuongThucThanhToan,
        amount: booking.thongTinGia?.tongDonDat || 0,
        paymentTime: booking.thongTinThanhToan?.thoiGianThanhToan,
        isVerified: booking.thongTinThanhToan?.daXacThuc || false,
        transactionId: booking.thongTinThanhToan?.transactionId ||
          booking.thongTinThanhToan?.momoData?.transId ||
          booking.thongTinThanhToan?.vnpayData?.vnp_TransactionNo ||
          booking.thongTinThanhToan?.zaloPayData?.parsedData?.zp_trans_id ||
          null,
        debug: {
          lastUpdated: booking.updatedAt,
          momoRequestId: booking.thongTinThanhToan?.momoRequestId,
          hasIpnData: !!booking.thongTinThanhToan?.momoData?.transId
        }
      }
    };

    console.log('📤 Final payment status:', response.data.status);
    res.json(response);

  } catch (error) {
    console.error('❌ Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message
    });
  }
});
//=======================================================================================






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



router.post('/zalopay/callback-debug', async (req, res) => {
  try {
    console.log('🐛 DEBUG Callback received:', JSON.stringify(req.body, null, 2));
    console.log('🐛 Headers:', JSON.stringify(req.headers, null, 2));

    const cbdata = req.body;

    // Check if this is a test ping
    if (cbdata.test) {
      return res.json({
        return_code: 1,
        return_message: "debug test successful",
        received_data: cbdata
      });
    }

    // Check if we have proper ZaloPay data
    if (!cbdata.data || !cbdata.mac) {
      return res.json({
        return_code: 0,
        return_message: "missing data or mac field",
        received_fields: Object.keys(cbdata)
      });
    }

    const ZALOPAY_CONFIG = {
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz"
    };

    const dataStr = cbdata.data;
    const reqMac = cbdata.mac;

    console.log('🔐 DataStr:', dataStr);
    console.log('🔐 Received MAC:', reqMac);

    const mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key2)
      .update(dataStr)
      .digest('hex');

    console.log('🔐 Calculated MAC:', mac);
    console.log('🔐 MAC match:', mac === reqMac);

    if (reqMac !== mac) {
      return res.json({
        return_code: -1,
        return_message: "mac not equal",
        debug: {
          received_mac: reqMac,
          calculated_mac: mac,
          data_string: dataStr
        }
      });
    }

    // Try to parse data
    let dataJson;
    try {
      dataJson = JSON.parse(dataStr);
      console.log('📊 Parsed data:', dataJson);
    } catch (parseError) {
      return res.json({
        return_code: 0,
        return_message: "failed to parse data JSON",
        error: parseError.message,
        raw_data: dataStr
      });
    }

    // Try to find booking
    const booking = await Booking.findOne({
      'thongTinThanhToan.zaloPayAppTransId': dataJson.app_trans_id
    });

    if (!booking) {
      // Also try other search methods
      const bookingByOrder = await Booking.findOne({
        'thongTinThanhToan.maDonHang': { $regex: dataJson.app_trans_id, $options: 'i' }
      });

      return res.json({
        return_code: 1,
        return_message: "booking search result",
        debug: {
          app_trans_id: dataJson.app_trans_id,
          found_by_app_trans_id: !!booking,
          found_by_order_search: !!bookingByOrder,
          booking_id: booking?._id || bookingByOrder?._id || null
        }
      });
    }

    // Update booking
    booking.trangThaiThanhToan = 'da_thanh_toan';
    booking.trangThai = 'da_xac_nhan';
    booking.thongTinThanhToan.thoiGianThanhToan = new Date();
    booking.thongTinThanhToan.daXacThuc = true;
    booking.thongTinThanhToan.transactionId = dataJson.zp_trans_id;
    booking.thongTinThanhToan.zaloPayData = dataJson;

    await booking.save();

    res.json({
      return_code: 1,
      return_message: "success",
      debug: {
        booking_updated: booking._id,
        app_trans_id: dataJson.app_trans_id
      }
    });

  } catch (error) {
    console.error('❌ Debug callback error:', error);
    res.json({
      return_code: 0,
      return_message: "failed",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Also add a simple health check
router.get('/zalopay/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      create: '/api/payment/zalopay/create',
      callback: '/api/payment/zalopay/callback',
      callback_debug: '/api/payment/zalopay/callback-debug',
      health: '/api/payment/zalopay/health'
    }
  });
});



















// ✅ Helper function to format date for ZaloPay
function formatDateForZaloPay(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}


// ===== ZALOPAY PAYMENT ===== ✅ ALREADY FIXED
router.post('/zalopay/create', async (req, res) => {
  try {
    const { orderId, amount, description, userId } = req.body;

    // Validate input
    if (!orderId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount, description'
      });
    }

    const intAmount = parseInt(amount);
    if (isNaN(intAmount) || intAmount < 1000 || intAmount > 500000000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between 1,000 and 500,000,000 VND'
      });
    }

    // ZaloPay Configuration
    const ZALOPAY_CONFIG = {
      appId: process.env.ZALOPAY_APP_ID || "2553",
      key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create"
    };

    // ✅ FIX: Correct app_trans_id format as per ZaloPay docs
    // Format: YYMMDD_randomNumber (max 40 chars)
    const today = new Date();
    const dateStr = formatDateForZaloPay(today);
    const transId = Math.floor(Math.random() * 1000000); // Random 6-digit number
    const appTransId = `${dateStr}_${transId}`;

    console.log('📋 Generated app_trans_id:', appTransId, '(length:', appTransId.length, ')');

    // ✅ FIX: Minimal embed_data
    const embedData = JSON.stringify({
      redirecturl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/zalopay/return`
    });

    // ✅ FIX: Simple item structure  
    const item = JSON.stringify([{}]); // Empty item as per ZaloPay examples

    // ✅ FIX: Clean description - ASCII only, max 50 chars
    const cleanDescription = description
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9\s]/g, '') // Keep only alphanumeric and spaces
      .replace(/\s+/g, ' ') // Single spaces
      .trim()
      .substring(0, 50);

    console.log('📝 Clean description:', cleanDescription);

    // ✅ Order data exactly as ZaloPay examples
    const orderData = {
      app_id: parseInt(ZALOPAY_CONFIG.appId),
      app_user: "user123", // Simple user as in examples
      app_time: Date.now(),
      amount: intAmount,
      app_trans_id: appTransId,
      embed_data: embedData,
      item: item,
      description: cleanDescription,
      bank_code: "", // Empty as recommended
      callback_url: `${process.env.API_URL || 'http://localhost:3000'}/api/payment/zalopay/callback`
    };

    // ✅ MAC calculation - exact order as documented
    const macData = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    orderData.mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key1).update(macData).digest('hex');

    console.log('🔄 ZaloPay Request for order:', orderId);
    console.log('📋 Order Data:', JSON.stringify(orderData, null, 2));
    console.log('🔐 MAC String:', macData);
    console.log('🔐 MAC:', orderData.mac);

    // ✅ Send request with proper form encoding
    const formData = new URLSearchParams();
    Object.keys(orderData).forEach(key => {
      formData.append(key, orderData[key]);
    });

    console.log('📤 FormData:', formData.toString());

    const response = await axios.post(ZALOPAY_CONFIG.endpoint, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    console.log('✅ ZaloPay Response:', JSON.stringify(response.data, null, 2));

    if (response.data.return_code === 1) {
      console.log('✅ ZaloPay payment creation successful!');
      console.log('📋 Order URL:', response.data.order_url);
      console.log('📋 QR Code:', response.data.qr_code ? 'Available' : 'Not available');

      // Success - update booking
      if (userId) {
        console.log('🔍 Looking for unpaid booking for user:', userId);

        const latestBooking = await Booking.findOne({
          maNguoiDung: userId,
          trangThaiThanhToan: 'chua_thanh_toan'
        }).sort({ createdAt: -1 });

        if (latestBooking) {
          console.log('📋 Found booking to update:', latestBooking._id);
          console.log('📋 Current booking status:', latestBooking.trangThaiThanhToan);

          const updateResult = await Booking.findByIdAndUpdate(latestBooking._id, {
            $set: {
              'thongTinThanhToan.maDonHang': orderId,
              'thongTinThanhToan.zaloPayAppTransId': appTransId,
              'thongTinThanhToan.phuongThucThanhToan': 'ZaloPay',
              'thongTinThanhToan.originalOrderId': orderId,
              'thongTinThanhToan.createdAt': new Date(),
              // ✅ ALSO update the main field
              phuongThucThanhToan: 'ZaloPay'
            }
          }, { new: true });

          if (updateResult) {
            console.log(`✅ Successfully updated booking ${latestBooking._id}:`);
            console.log(`   - Order ID: ${orderId}`);
            console.log(`   - App Trans ID: ${appTransId}`);
            console.log(`   - Payment Method: ZaloPay`);
            console.log(`   - Current Status: ${updateResult.trangThaiThanhToan}`);
          } else {
            console.error('❌ Failed to update booking in database');
          }
        } else {
          console.log('⚠️ No unpaid booking found for user:', userId);
          console.log('🔍 Searching all bookings for this user...');

          const allUserBookings = await Booking.find({ maNguoiDung: userId }).sort({ createdAt: -1 }).limit(3);
          console.log('📋 Recent bookings for user:', allUserBookings.map(b => ({
            id: b._id,
            status: b.trangThaiThanhToan,
            created: b.createdAt
          })));
        }
      } else {
        console.log('⚠️ No userId provided - skipping booking update');
      }

      res.json({
        success: true,
        message: "ZaloPay payment created successfully",
        data: {
          ...response.data,
          app_trans_id: appTransId,
          orderId: orderId
        }
      });

    } else {
      // Failed
      console.error('❌ ZaloPay Error:', {
        return_code: response.data.return_code,
        return_message: response.data.return_message,
        sub_return_code: response.data.sub_return_code,
        sub_return_message: response.data.sub_return_message
      });

      res.status(400).json({
        success: false,
        message: "ZaloPay payment creation failed",
        error: {
          code: response.data.sub_return_code,
          message: response.data.sub_return_message || response.data.return_message
        }
      });
    }

  } catch (error) {
    console.error('❌ ZaloPay Request Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create ZaloPay payment",
      error: error.response?.data || error.message
    });
  }
});

// ✅ Helper function - correct format
function formatDateForZaloPay(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

router.post('/zalopay/callback', async (req, res) => {
  try {
    const cbdata = req.body;
    console.log('📨 ZaloPay Callback received at:', new Date().toISOString());

    if (cbdata.test) {
      return res.json({ return_code: 1, return_message: "test ping successful" });
    }

    if (!cbdata.data || !cbdata.mac) {
      return res.json({ return_code: 0, return_message: "invalid callback structure" });
    }

    // MAC verification
    const ZALOPAY_CONFIG = {
      key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz"
    };

    const dataStr = cbdata.data;
    const reqMac = cbdata.mac;
    const mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key2).update(dataStr).digest('hex');

    if (reqMac !== mac) {
      return res.json({ return_code: -1, return_message: "mac not equal" });
    }

    const dataJson = JSON.parse(dataStr);
    const appTransId = dataJson.app_trans_id;

    console.log('🔍 Looking for app_trans_id:', appTransId);

    // ✅ FIX: Search by the correct fields according to schema
    let booking = await Booking.findOne({
      'thongTinThanhToan.zaloPayData.app_trans_id': appTransId
    });

    if (booking) {
      console.log('✅ Found booking by zaloPayData.app_trans_id:', booking._id);
    } else {
      console.log('❌ No booking found by zaloPayData.app_trans_id');

      // Fallback: Search by main phuongThucThanhToan and recent
      console.log('🔍 Searching recent ZaloPay bookings...');
      booking = await Booking.findOne({
        phuongThucThanhToan: 'ZaloPay',
        trangThaiThanhToan: 'chua_thanh_toan'
      }).sort({ createdAt: -1 });

      if (booking) {
        console.log('✅ Found recent ZaloPay booking:', booking._id);
      } else {
        console.log('❌ No ZaloPay bookings found');
      }
    }

    if (booking) {
      console.log('✅ Updating booking:', booking._id);

      const updateResult = await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            trangThaiThanhToan: 'da_thanh_toan',
            trangThai: 'da_xac_nhan',
            'thongTinThanhToan.thoiGianThanhToan': new Date(),
            'thongTinThanhToan.daXacThuc': true,
            'thongTinThanhToan.zaloPayData': dataJson, // ✅ Store complete ZaloPay data
            'thongTinThanhToan.maDonHang': booking.thongTinThanhToan?.maDonHang || `ZLP_${appTransId}`,
            'thongTinThanhToan.transactionId': dataJson.zp_trans_id.toString(),
            'thongTinThanhToan.callbackProcessedAt': new Date()
          }
        },
        { new: true }
      );

      console.log('✅ Booking updated successfully!');
      console.log('✅ New status:', updateResult.trangThaiThanhToan);
      console.log('✅ Verified:', updateResult.thongTinThanhToan.daXacThuc);
      console.log('✅ ZaloPay Data stored:', !!updateResult.thongTinThanhToan.zaloPayData);

    } else {
      console.error('❌ No booking found for callback!');
    }

    res.json({ return_code: 1, return_message: "success" });

  } catch (error) {
    console.error('❌ Callback error:', error);
    res.json({ return_code: 0, return_message: "failed" });
  }
});

// ✅ Return URL handler
router.get('/zalopay/return', async (req, res) => {
  try {
    const { status, orderId } = req.query;
    console.log('🔙 ZaloPay return:', { status, orderId, query: req.query });

    if (status === '1') {
      res.redirect(`${process.env.APP_URL}/payment/success?orderId=${orderId}&method=zalopay`);
    } else {
      res.redirect(`${process.env.APP_URL}/payment/failed?orderId=${orderId}&method=zalopay`);
    }
  } catch (error) {
    console.error('❌ Return error:', error);
    res.redirect(`${process.env.APP_URL}/payment/error`);
  }
});

// ✅ Status check endpoint
router.get('/zalopay/check/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const booking = await Booking.findOne({
      $or: [
        { 'thongTinThanhToan.maDonHang': orderId },
        { 'thongTinThanhToan.originalOrderId': orderId }
      ]
    });

    if (!booking) {
      return res.json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        status: booking.trangThaiThanhToan,
        verified: booking.thongTinThanhToan?.daXacThuc || false,
        transactionId: booking.thongTinThanhToan?.transactionId,
        method: booking.thongTinThanhToan?.phuongThucThanhToan,
        paymentTime: booking.thongTinThanhToan?.thoiGianThanhToan,
        app_trans_id: booking.thongTinThanhToan?.zaloPayAppTransId
      }
    });
  } catch (error) {
    console.error('❌ Check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status'
    });
  }
});
// ===== CHECK PAYMENT STATUS =====
// router.get('/status/:orderId', async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const booking = await Booking.findOne({
//       'thongTinThanhToan.maDonHang': orderId
//     });

//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Booking not found for orderId: ' + orderId
//       });
//     }

//     res.json({
//       success: true,
//       message: "Payment status retrieved successfully",
//       data: {
//         orderId: orderId,
//         bookingId: booking._id,
//         status: booking.trangThaiThanhToan,
//         bookingStatus: booking.trangThai,
//         paymentMethod: booking.phuongThucThanhToan,
//         amount: booking.thongTinGia?.tongDonDat || 0,
//         paymentTime: booking.thongTinThanhToan?.thoiGianThanhToan,
//         isVerified: booking.thongTinThanhToan?.daXacThuc || false,
//         transactionId: booking.thongTinThanhToan?.transactionId || 
//                       booking.thongTinThanhToan?.momoData?.transId || 
//                       booking.thongTinThanhToan?.vnpayData?.vnp_TransactionNo ||
//                       booking.thongTinThanhToan?.zaloPayData?.zp_trans_id ||
//                       null,
//         transactionData: {
//           momo: booking.thongTinThanhToan?.momoData,
//           vnpay: booking.thongTinThanhToan?.vnpayData,
//           zalopay: booking.thongTinThanhToan?.zaloPayData
//         }
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get payment status error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to get payment status",
//       error: error.message 
//     });
//   }
// });

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


  // ✅ Test endpoint đơn giản
  router.get('/test/hello', (req, res) => {
    res.json({
      success: true,
      message: 'Server working! ✅',
      timestamp: new Date().toISOString()
    });
  });

  // ✅ Debug booking
  router.get('/debug/booking/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;

      const booking = await Booking.findOne({
        'thongTinThanhToan.maDonHang': orderId
      });

      if (!booking) {
        return res.json({
          success: false,
          message: 'Booking not found',
          orderId: orderId
        });
      }

      res.json({
        success: true,
        message: 'Booking found',
        data: {
          bookingId: booking._id,
          orderId: orderId,
          paymentInfo: booking.thongTinThanhToan,
          status: booking.trangThaiThanhToan,
          method: booking.thongTinThanhToan?.phuongThucThanhToan
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ✅ Test MoMo IPN manual
  router.post('/test/momo-ipn', async (req, res) => {
    try {
      const testBooking = await Booking.findOne({
        'thongTinThanhToan.maDonHang': { $exists: true }
      }).sort({ createdAt: -1 });

      if (!testBooking) {
        return res.json({
          success: false,
          message: 'No booking found to test'
        });
      }

      const testData = {
        accessKey: "F8BBA842ECF85",
        amount: "600000",
        extraData: "",
        message: "Successful.",
        orderId: testBooking.thongTinThanhToan.maDonHang,
        orderInfo: "Test payment",
        orderType: "momo_wallet",
        partnerCode: "MOMO",
        payType: "qr",
        requestId: "TEST_REQ_123",
        responseTime: Date.now(),
        resultCode: 0,
        transId: `TEST_TRANS_${Date.now()}`
      };

      const MOMO_CONFIG = {
        secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz"
      };

      const rawSignature = `accessKey=${testData.accessKey}&amount=${testData.amount}&extraData=${testData.extraData}&message=${testData.message}&orderId=${testData.orderId}&orderInfo=${testData.orderInfo}&orderType=${testData.orderType}&partnerCode=${testData.partnerCode}&payType=${testData.payType}&requestId=${testData.requestId}&responseTime=${testData.responseTime}&resultCode=${testData.resultCode}&transId=${testData.transId}`;

      testData.signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
        .update(rawSignature)
        .digest('hex');

      // Call our own IPN
      const ipnUrl = `${req.protocol}://${req.get('host')}/api/payment/momo/ipn`;
      const response = await axios.post(ipnUrl, testData);

      const updatedBooking = await Booking.findById(testBooking._id);

      res.json({
        success: true,
        message: 'MoMo IPN test completed! ✅',
        bookingStatus: {
          before: testBooking.trangThaiThanhToan,
          after: updatedBooking.trangThaiThanhToan,
          transactionId: updatedBooking.thongTinThanhToan?.transactionId
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

module.exports = router;