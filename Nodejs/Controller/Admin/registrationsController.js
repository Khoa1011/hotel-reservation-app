const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const HotelRegistration = require("../../Model/Hotel/HotelRegistration");
const User = require("../../Model/User/User");
const Hotel = require("../../Model/Hotel/Hotel");
const authorizeRoles = require('../../middleware/roleAuth');
const { uploadHotel, logUploadProcess, handleMulterError, deleteFiles, getRelativePath } = require('../../config/upload');
const registrationsRouter = express.Router();

// Helper function để generate random password
const generateRandomPassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Helper function để gửi email (mock)
const sendEmail = async (to, subject, content) => {
  // Thay thế bằng service email thực tế (nodemailer, sendgrid, etc.)
  console.log(`Email sent to ${to}: ${subject}`);
  console.log(content);
  return true;
};

// GET: Lấy danh sách tất cả đăng ký
registrationsRouter.get("/admin/registrations", authorizeRoles("admin"), async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    let query = {};

    // Filter theo status
    if (status) {
      query.trangThai = status;
    }

    // Search theo tên khách sạn hoặc chủ sở hữu
    if (search) {
      const users = await User.find({
        $or: [
          { tenNguoiDung: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const userIds = users.map(user => user._id);

      query.$or = [
        { tenKhachSan: { $regex: search, $options: "i" } },
        { maNguoiDung: { $in: userIds } }
      ];
    }

    const skip = (page - 1) * limit;

    const registrations = await HotelRegistration.find(query)
      .populate({
        path: "maNguoiDung",
        select: "tenNguoiDung email soDienThoai cccd"
      })
      .sort({ ngayDangKy: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HotelRegistration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: registrations.length,
        totalRecords: total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đăng ký",
      error: error.message
    });
  }
});

// GET: Lấy chi tiết đăng ký theo ID
registrationsRouter.get("/admin/registrations-details/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const registration = await HotelRegistration.findById(req.params.id)
      .populate({
        path: "maNguoiDung",
        select: "tenNguoiDung email soDienThoai cccd ngaySinh gioiTinh"
      });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký"
      });
    }

    res.json({
      success: true,
      data: registration
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết đăng ký",
      error: error.message
    });
  }
});

// POST: Tạo đăng ký mới (từ frontend form)
registrationsRouter.post("/admin/registrations-create", logUploadProcess,
  uploadHotel.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'cccdBack', maxCount: 1 },
    { name: 'businessLicenseFile', maxCount: 1 },
    { name: 'hotelPhoto', maxCount: 1 }
  ]),
  handleMulterError,
  async (req, res) => {
    try {
      console.log('🔍 Content-Type:', req.get('Content-Type'));
      console.log('🔍 req.files:', req.files);
      console.log('🔍 req.body sample:', {
        ownerName: req.body.ownerName,
        hotelName: req.body.hotelName
      });
      console.log('📥 Registration request received:', JSON.stringify(req.body, null, 2));

      if (req.files) {
        console.log('📁 Files received:', Object.keys(req.files));
      }

      // Validate required fields
      const fieldErrors = validateRequiredFields(req.body);
      if (fieldErrors.length > 0) {
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          const uploadedPaths = allFiles.map(f => f.path);
          deleteFiles(uploadedPaths);
        }
        return res.status(400).json({
          success: false,
          messages: fieldErrors
        });
      }

      // Validate email format
      if (!validateEmailFormat(req.body.ownerEmail)) {
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          const uploadedPaths = allFiles.map(f => f.path);
          deleteFiles(uploadedPaths);
        }
        return res.status(400).json({
          success: false,
          message: "Email không đúng định dạng"
        });
      }

      // Find or create user
      let targetUser;
      const existingUserByEmail = await User.findOne({ email: req.body.ownerEmail.trim().toLowerCase() });
      const existingUserByCCCD = await User.findOne({ cccd: req.body.ownerCCCD.trim() });

      if (existingUserByEmail) {
        targetUser = await handleExistingUser(existingUserByEmail, req.body.ownerCCCD);
      } else if (existingUserByCCCD) {
        if (existingUserByCCCD.email !== req.body.ownerEmail.trim().toLowerCase()) {
          throw {
            status: 400,
            message: "CCCD đã được sử dụng với email khác",
            details: "Một người chỉ có thể có một tài khoản duy nhất"
          };
        }
        targetUser = existingUserByCCCD;
      } else {
        targetUser = await createNewUser(req.body);
      }

      // Validate business license
      const licenseValidation = await validateBusinessLicense(req.body.businessLicense.trim());
      if (!licenseValidation.isValid) {
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          const uploadedPaths = allFiles.map(f => f.path);
          deleteFiles(uploadedPaths);
        }
        return res.status(400).json({
          success: false,
          message: licenseValidation.message,
          ...(licenseValidation.existingRegistration && {
            existingRegistration: licenseValidation.existingRegistration
          })
        });
      }

      // Check duplicate registration
      const duplicateCheck = await checkDuplicateHotelRegistration(targetUser._id, {
        hotelName: req.body.hotelName.trim(),
        address: req.body.address
      });

      if (duplicateCheck.isDuplicate) {
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          const uploadedPaths = allFiles.map(f => f.path);
          deleteFiles(uploadedPaths);
        }
        return res.status(400).json({
          success: false,
          message: duplicateCheck.message,
          existingRegistration: duplicateCheck.existingRegistration
        });
      }
      const documentPaths = {};
      if (req.files) {
        if (req.files.cccdFront?.[0]) {
          documentPaths.cccdMatTruoc = getRelativePath(req.files.cccdFront[0].path);
        }
        if (req.files.cccdBack?.[0]) {
          documentPaths.cccdMatSau = getRelativePath(req.files.cccdBack[0].path);
        }
        if (req.files.businessLicenseFile?.[0]) {
          documentPaths.giayPhepKinhDoanh = getRelativePath(req.files.businessLicenseFile[0].path);
        }
        if (req.files.hotelPhoto?.[0]) {
          documentPaths.anhKhachSan = getRelativePath(req.files.hotelPhoto[0].path);
        }
      }

      // Create new registration
      const registration = new HotelRegistration({
        maNguoiDung: targetUser._id,
        tenKhachSan: req.body.hotelName.trim(),
        loaiKhachSan: req.body.hotelType || 'khachSan',

        diaChi: {
          soNha: req.body.address?.soNha || '',
          tenDuong: req.body.address?.tenDuong || '',
          phuong: req.body.address?.phuong || '',
          quan: req.body.address?.quan || '',
          thanhPho: req.body.address?.tinhThanh || ''
        },
        hinhAnh: {
          cccdMatTruoc: documentPaths.cccdMatTruoc || null,
          cccdMatSau: documentPaths.cccdMatSau || null,
          giayPhepKinhDoanh: documentPaths.giayPhepKinhDoanh || null,
          anhMatTienKhachSan: documentPaths.anhKhachSan || null,
        },
        giayTo: {
          maSoGPKD: req.body.businessLicense.trim(),
          maSoThue: req.body.taxCode?.trim() || '',
        },
        trangThai: "dang_cho_duyet",
        ngayDangKy: new Date()
      });

      await registration.save();

      // Prepare response
      const response = {
        success: true,
        message: existingUserByEmail || existingUserByCCCD
          ? "Đăng ký khách sạn mới thành công với tài khoản hiện tại"
          : "Đăng ký khách sạn thành công",
        data: {
          registrationId: registration._id,
          userId: targetUser._id,
          status: "dang_cho_duyet"
        }
      };

      if (duplicateCheck.hasWarning) {
        response.warning = {
          message: "Có khách sạn tên tương tự trong khu vực",
          similarRegistration: duplicateCheck.similarRegistration
        };
      }

      res.status(201).json(response);

    } catch (error) {
      console.error('❌ Registration error:', error);
      if (req.files) {
        const allFiles = Object.values(req.files).flat();
        const uploadedPaths = allFiles.map(f => f.path);
        deleteFiles(uploadedPaths);
      }

      const status = error.status || 500;
      const message = error.message || "Lỗi hệ thống khi tạo đăng ký";
      const errorResponse = {
        success: false,
        message: message,
        ...(error.details && { details: error.details })
      };

      if (error.name === 'ValidationError') {
        errorResponse.validationErrors = Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }));
      }

      if (error.code === 11000) {
        errorResponse.message = "Dữ liệu đã tồn tại trong hệ thống";
        errorResponse.duplicateField = Object.keys(error.keyValue)[0];
      }

      res.status(status).json(errorResponse);
    }
  });

// PUT: Phê duyệt đăng ký
registrationsRouter.put("/admin/registrations/:id/approve", authorizeRoles("admin"), async (req, res) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const registrationId = req.params.id;
    const { adminNote } = req.body;

    // Tìm đăng ký
    const registration = await HotelRegistration.findById(registrationId)
      .populate("maNguoiDung")
      .session(session);

    if (!registration) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký"
      });
    }

    if (registration.trangThai !== "dang_cho_duyet") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Đăng ký không ở trạng thái chờ duyệt"
      });
    }

    // Tạo mật khẩu mới cho chủ khách sạn
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật user thành chủ khách sạn
    await User.findByIdAndUpdate(
      registration.maNguoiDung._id,
      {
        matKhau: hashedPassword,
        vaiTro: "chuKhachSan",
        trangThaiTaiKhoan: "hoatDong"
      },
      { session }
    );

    // Tạo khách sạn mới
    const newHotel = new Hotel({
      maChuKhachSan: registration.maNguoiDung._id,
      tenKhachSan: registration.tenKhachSan,
      diaChi: registration.diaChi,
      loaiKhachSan: registration.loaiKhachSan,
      email: registration.maNguoiDung.email,
      soDienThoai: registration.maNguoiDung.soDienThoai,
      soSao: 5,
      hinhAnh: registration.hinhAnh?.anhMatTienKhachSan || "",
      
    });

    await newHotel.save({ session });

    // Cập nhật đăng ký
    await HotelRegistration.findByIdAndUpdate(
      registrationId,
      {
        trangThai: "da_duyet",
        maKhachSan: newHotel._id,
        ngayXuLy: new Date(),
        ngayDuyet: new Date()
      },
      { session }
    );

    await session.commitTransaction();

    // Gửi email thông báo
    const emailContent = `
      Chào ${registration.maNguoiDung.tenNguoiDung},
      
      Chúc mừng! Đăng ký khách sạn "${registration.tenKhachSan}" của bạn đã được phê duyệt.
      
      Thông tin đăng nhập:
      - Email: ${registration.maNguoiDung.email}
      - Mật khẩu: ${newPassword}
      
      Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.
      
      Trân trọng,
      Staytion Team
    `;

    await sendEmail(
      registration.maNguoiDung.email,
      "Đăng ký khách sạn được phê duyệt - Staytion",
      emailContent
    );

    res.json({
      success: true,
      message: "Đăng ký đã được phê duyệt thành công",
      data: {
        hotelId: newHotel._id,
        generatedPassword: newPassword // Chỉ để test, production nên bỏ
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Lỗi khi phê duyệt đăng ký",
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// PUT: Từ chối đăng ký
registrationsRouter.put("/admin/registrations/:id/reject", authorizeRoles("admin"), async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { reason, adminNote } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối"
      });
    }

    const registration = await HotelRegistration.findById(registrationId)
      .populate("maNguoiDung");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký"
      });
    }

    if (registration.trangThai !== "dang_cho_duyet") {
      return res.status(400).json({
        success: false,
        message: "Đăng ký không ở trạng thái chờ duyệt"
      });
    }

    // Cập nhật trạng thái
    await HotelRegistration.findByIdAndUpdate(registrationId, {
      trangThai: "tu_choi",
      lyDoTuChoi: reason,
      ngayXuLy: new Date()
    });

    // Xóa user tạm thời (vì chưa được duyệt)
    await User.findByIdAndDelete(registration.maNguoiDung._id);

    // Gửi email thông báo
    const emailContent = `
      Chào ${registration.maNguoiDung.tenNguoiDung},
      
      Rất tiếc, đăng ký khách sạn "${registration.tenKhachSan}" của bạn đã bị từ chối.
      
      Lý do: ${reason}
      
      Bạn có thể đăng ký lại sau khi khắc phục các vấn đề được nêu.
      
      Trân trọng,
      Staytion Team
    `;

    await sendEmail(
      registration.maNguoiDung.email,
      "Đăng ký khách sạn bị từ chối - Staytion",
      emailContent
    );

    res.json({
      success: true,
      message: "Đăng ký đã bị từ chối"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối đăng ký",
      error: error.message
    });
  }
});

// PUT: Yêu cầu bổ sung
registrationsRouter.put("/admin/registrations/:id/supplement", authorizeRoles("admin"), async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { supplementNote, requiredDocuments } = req.body;

    if (!supplementNote) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ghi chú bổ sung"
      });
    }

    const registration = await HotelRegistration.findById(registrationId)
      .populate("maNguoiDung");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký"
      });
    }

    if (registration.trangThai !== "dang_cho_duyet") {
      return res.status(400).json({
        success: false,
        message: "Đăng ký không ở trạng thái chờ duyệt"
      });
    }

    // Cập nhật trạng thái
    await HotelRegistration.findByIdAndUpdate(registrationId, {
      trangThai: "can_bo_sung",
      ghiChuBoSung: supplementNote,
      ngayXuLy: new Date()
    });

    // Gửi email thông báo
    const emailContent = `
      Chào ${registration.maNguoiDung.tenNguoiDung},
      
      Đăng ký khách sạn "${registration.tenKhachSan}" của bạn cần bổ sung thêm thông tin.
      
      Yêu cầu bổ sung: ${supplementNote}
      
      Vui lòng cập nhật thông tin và gửi lại hồ sơ.
      
      Trân trọng,
      Staytion Team
    `;

    await sendEmail(
      registration.maNguoiDung.email,
      "Yêu cầu bổ sung hồ sơ đăng ký - Staytion",
      emailContent
    );

    res.json({
      success: true,
      message: "Đã gửi yêu cầu bổ sung"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi yêu cầu bổ sung",
      error: error.message
    });
  }
});

// GET: Thống kê dashboard
registrationsRouter.get("/admin/dashboard/stats", authorizeRoles("admin"), async (req, res) => {
  try {
    const totalRegistrations = await HotelRegistration.countDocuments();
    const pendingRegistrations = await HotelRegistration.countDocuments({
      trangThai: "dang_cho_duyet"
    });
    const approvedRegistrations = await HotelRegistration.countDocuments({
      trangThai: "da_duyet"
    });
    const rejectedRegistrations = await HotelRegistration.countDocuments({
      trangThai: "tu_choi"
    });

    const totalHotels = await Hotel.countDocuments();
    const totalUsers = await User.countDocuments();

    // Tính tỷ lệ phê duyệt
    const approvalRate = totalRegistrations > 0
      ? ((approvedRegistrations / totalRegistrations) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        rejectedRegistrations,
        totalHotels,
        totalUsers,
        approvalRate: parseFloat(approvalRate)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message
    });
  }
});



// ======================== VALIDATION FUNCTIONS ========================
const validateRequiredFields = (fields) => {
  const errors = [];

  if (!fields.ownerName?.trim()) errors.push("Thiếu tên chủ sở hữu");
  if (!fields.ownerEmail?.trim()) errors.push("Thiếu email chủ sở hữu");
  if (!fields.ownerPhone?.trim()) errors.push("Thiếu số điện thoại chủ sở hữu");
  if (!fields.ownerCCCD?.trim()) errors.push("Thiếu CCCD chủ sở hữu");
  if (!fields.hotelName?.trim()) errors.push("Thiếu tên khách sạn");
  if (!fields.businessLicense?.trim()) errors.push("Thiếu số giấy phép kinh doanh");

  return errors;
};

const validateEmailFormat = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

// ======================== BUSINESS LICENSE VALIDATION ========================
const validateBusinessLicense = async (licenseNumber) => {
  if (!licenseNumber?.trim()) {
    return {
      isValid: false,
      message: "Số giấy phép kinh doanh không được để trống"
    };
  }

  const licensePattern = /^[0-9A-Za-z\-\/\.]+$/;
  if (!licensePattern.test(licenseNumber.trim())) {
    return {
      isValid: false,
      message: "Số giấy phép kinh doanh chứa ký tự không hợp lệ"
    };
  }

  if (licenseNumber.trim().length < 5) {
    return {
      isValid: false,
      message: "Số giấy phép kinh doanh quá ngắn"
    };
  }

  const existingLicense = await HotelRegistration.findOne({
    soGiayPhepKinhDoanh: licenseNumber.trim(),
    trangThai: { $in: ["dang_cho_duyet", "da_duyet", "can_bo_sung"] }
  });

  if (existingLicense) {
    return {
      isValid: false,
      isUsed: true,
      message: "Số giấy phép kinh doanh này đã được sử dụng bởi khách sạn khác",
      existingRegistration: existingLicense
    };
  }

  return {
    isValid: true,
    message: "Số giấy phép kinh doanh hợp lệ"
  };
};

// ======================== DUPLICATE CHECK FUNCTIONS ========================
const checkSameAddressRegistration = async (userId, address) => {
  return await HotelRegistration.findOne({
    maNguoiDung: userId,
    "diaChi.soNha": address.soNha,
    "diaChi.tenDuong": address.tenDuong,
    "diaChi.quan": { $regex: new RegExp(`^${address.quan}$`, 'i') },
    "diaChi.tinhThanh": { $regex: new RegExp(`^${address.tinhThanh}$`, 'i') },
    trangThai: { $in: ["dang_cho_duyet", "da_duyet", "can_bo_sung"] }
  });
};

const checkSimilarNameInArea = async (userId, hotelName, address) => {
  return await HotelRegistration.findOne({
    maNguoiDung: userId,
    tenKhachSan: { $regex: new RegExp(`^${hotelName.trim()}$`, 'i') },
    "diaChi.quan": { $regex: new RegExp(`^${address.quan}$`, 'i') },
    "diaChi.tinhThanh": { $regex: new RegExp(`^${address.tinhThanh}$`, 'i') },
    trangThai: { $in: ["dang_cho_duyet", "da_duyet", "can_bo_sung"] }
  });
};

const checkDuplicateHotelRegistration = async (userId, hotelData) => {
  const { hotelName, address } = hotelData;

  // Check same address registration
  const existingByAddress = await checkSameAddressRegistration(userId, address);
  if (existingByAddress) {
    return {
      isDuplicate: true,
      reason: "same_address",
      message: `Bạn đã đăng ký khách sạn tại địa chỉ này`,
      existingRegistration: existingByAddress
    };
  }

  // Check similar name in same area
  const similarInSameArea = await checkSimilarNameInArea(userId, hotelName, address);
  if (similarInSameArea) {
    return {
      isDuplicate: false,
      hasWarning: true,
      reason: "similar_name_same_area",
      message: `Bạn đã có khách sạn tên tương tự trong khu vực`,
      similarRegistration: similarInSameArea
    };
  }

  return { isDuplicate: false, hasWarning: false };
};

// ======================== USER HANDLING FUNCTIONS ========================
const handleExistingUser = async (user, cccd) => {
  if (user.cccd && user.cccd !== cccd.trim()) {
    throw {
      status: 400,
      message: "CCCD không khớp với thông tin tài khoản",
      details: "Vui lòng sử dụng CCCD đã đăng ký hoặc liên hệ hỗ trợ"
    };
  }

  if (!user.cccd) {
    user.cccd = cccd.trim();
    await user.save();
  }

  return user;
};

const createNewUser = async (userData) => {
  const fullAddress = `${userData.address?.soNha || ''}, ${userData.address?.tenDuong || ''}`.replace(/^,\s*/, '');

  const newUser = new User({
    tenNguoiDung: userData.ownerName.trim(),
    email: userData.ownerEmail.trim().toLowerCase(),
    soDienThoai: userData.ownerPhone.trim(),
    cccd: userData.ownerCCCD.trim(),
    matKhau: "temp_password_" + Date.now(),
    vaiTro: "nguoiDung",
    trangThaiTaiKhoan: "khongHoatDong",
    viTri: {
      soNha: fullAddress,
      phuong: userData.address?.phuong || '',
      quan: userData.address?.quan || '',
      thanhPho: userData.address?.tinhThanh || '',
    },
    ngayTao: new Date(),
  });

  await newUser.save();
  return newUser;
};

module.exports = registrationsRouter;