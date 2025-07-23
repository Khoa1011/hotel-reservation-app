import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Bed,
  DollarSign,
  User,
  Phone,
  Mail,
  CreditCard,
  Clock,
  FileText,
  Plus,
  Minus,
  Calculator,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from "moment";

const AddBooking = ({ onClose }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const hotelId = localStorage.getItem("selectedHotelId");

  const [formData, setFormData] = useState({
    // Thông tin khách hàng
    customerName: '',
    phoneNumber: '',
    email: '',
    cccd: '',

    // ✅ THÊM: Loại đặt phòng
    bookingType: 'qua_dem', // Default

    // Thông tin đặt phòng
    maLoaiPhong: '', // Room type ID
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',

    // ✅ THÊM: Thời gian cho đặt theo giờ
    checkInTime: '14:00',
    checkOutTime: '18:00',

    guests: 1,
    roomQuantity: 1,

    // Thanh toán
    paymentMethod: 'tien_mat',
    payNow: false,
    customerPayment: '',

    // Ghi chú
    notes: ''
  });

  const [duration, setDuration] = useState(0); // ✅ THAY ĐỔI: duration thay vì nights
  const [unit, setUnit] = useState('đêm'); // ✅ THÊM: đơn vị thời gian
  const [totalAmount, setTotalAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [errors, setErrors] = useState({});
  const [roomTypes, setRoomTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // ✅ THÊM: Danh sách loại đặt phòng
  const bookingTypes = [
    { value: 'theo_gio', label: 'Theo giờ', description: 'Đặt phòng theo số giờ sử dụng' },
    { value: 'qua_dem', label: 'Qua đêm', description: 'Đặt phòng qua đêm (1 ngày)' },
    { value: 'dai_ngay', label: 'Dài ngày', description: 'Đặt phòng nhiều ngày (2+ ngày)' }
  ];

  const paymentMethods = [
    { id: 'tien_mat', name: 'Tiền mặt' },
    { id: 'VNPay', name: 'VNPay' },
    { id: 'Momo', name: 'Momo' },
    { id: 'ZaloPay', name: 'ZaloPay' },
    { id: 'the_tin_dung', name: 'Thẻ tín dụng' }
  ];


  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'Vui lòng nhập tên khách hàng';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.maLoaiPhong) newErrors.maLoaiPhong = 'Vui lòng chọn loại phòng';

    // ✅ Validation theo booking type
    switch (formData.bookingType) {
      case 'theo_gio':
        if (!formData.checkInTime) newErrors.checkInTime = 'Vui lòng chọn giờ nhận';
        if (!formData.checkOutTime) newErrors.checkOutTime = 'Vui lòng chọn giờ trả';
        if (duration <= 0) newErrors.checkOutTime = 'Giờ trả phải sau giờ nhận';
        break;

      case 'qua_dem':
        break;

      case 'dai_ngay':
        if (!formData.checkOutDate) newErrors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
        if (duration < 2) newErrors.checkOutDate = 'Đặt dài ngày tối thiểu 2 ngày';
        break;
    }

    if (formData.paymentMethod === 'tien_mat' && formData.payNow) {
      const payment = parseFloat(formData.customerPayment) || 0;
      if (payment < totalAmount) {
        newErrors.customerPayment = 'Số tiền khách đưa không đủ';
      }
    }

    if (formData.cccd && !/^[0-9]{12}$/.test(formData.cccd)) {
      newErrors.cccd = 'CCCD phải có 12 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Tạo đơn đặt phòng với booking type
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        maKhachSan: hotelId,
        maLoaiPhong: formData.maLoaiPhong,
        bookingType: formData.bookingType,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.bookingType === 'theo_gio' ? formData.checkInDate : formData.checkOutDate, // ✅ SỬA
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        cccd: formData.cccd,
        paymentMethod: formData.paymentMethod,
        guests: formData.guests,
        notes: formData.notes,
        roomQuantity: formData.roomQuantity
      };

      const response = await axios.post(
        `${baseUrl}/api/booking-hotel/hotelowner/create-booking`,
        payload,
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        toast.success(response.data.message.msgBody);
        onClose();
      } else {
        toast.error(response.data?.message?.msgBody || 'Tạo đơn không thành công!');
      }

    } catch (error) {
      console.error('Lỗi tạo đơn:', error);
      const errorMessage = error.response?.data?.msgBody || 'Tạo đơn đặt phòng thất bại!';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Lấy danh sách loại phòng trong khách sạn
  const getRoomTypesInHotel = async (hotelId = '') => {
    try {
      const url = `${baseUrl}/api/booking-hotel/hotelowner/getRoomInHotel/${hotelId}`;
      const response = await axios.get(url, { withCredentials: true });

      if (response.status === 200) {
        const formatted = response.data.map(room => ({
          id: room.roomId,
          name: room.roomTypeName,
          price: room.roomTypePrice,
          maxGuests: room.roomcapacity,
          description: room.roomTypeDescription
        }));

        const uniqueRoomTypes = Array.from(
          new Map(formatted.map(item => [item.id, item])).values()
        );

        setRoomTypes(uniqueRoomTypes);
        console.log("Danh sách loại phòng:", uniqueRoomTypes);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại phòng:", error);
      toast.error("Lỗi lấy dữ liệu loại phòng khách sạn");
    }
  };

  // Load room types khi component mount
  useEffect(() => {
    if (hotelId) {
      getRoomTypesInHotel(hotelId);
    } else {
      toast.error("Vui lòng chọn khách sạn trước!");
    }
  }, [hotelId]);


  useEffect(() => {
    if (formData.bookingType === 'qua_dem' && formData.checkInDate) {
      // Tự động set ngày trả = ngày nhận + 1 ngày  
      const checkInDate = new Date(formData.checkInDate);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + 1);

      const checkOutString = checkOutDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        checkOutDate: checkOutString
      }));
    }
  }, [formData.bookingType, formData.checkInDate]);

  //Tính duration theo booking type
  useEffect(() => {
    if (formData.bookingType === 'theo_gio') {
      // Tính số giờ
      if (formData.checkInTime && formData.checkOutTime) {
        const startTime = moment(`${formData.checkInDate} ${formData.checkInTime}`, 'YYYY-MM-DD HH:mm');
        let endTime = moment(`${formData.checkInDate} ${formData.checkOutTime}`, 'YYYY-MM-DD HH:mm');

        if (endTime.isSameOrBefore(startTime)) {
          endTime.add(1, 'day');
        }

        const hours = Math.ceil(endTime.diff(startTime, 'hours', true));
        setDuration(hours > 0 ? hours : 0);
        setUnit('giờ');
      }

    } else if (formData.bookingType === 'qua_dem') {

      setDuration(1);
      setUnit('đêm');

    } else if (formData.checkInDate && formData.checkOutDate) {
      // Tính số ngày
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDuration(diffDays > 0 ? diffDays : 0);
      setUnit('ngày');
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.checkInTime, formData.checkOutTime, formData.bookingType]);

// Tính tổng tiền theo booking type
useEffect(() => {
  const roomType = roomTypes.find(rt => rt.id === formData.maLoaiPhong);
  if (roomType && duration > 0) {
    let unitPrice = roomType.price;

    if (formData.bookingType === 'theo_gio') {
      // Giá theo giờ = giá phòng / 14 giờ
      unitPrice = Math.round(roomType.price / 14);
    }

    const roomTotal = unitPrice * duration * formData.roomQuantity;
    setTotalAmount(roomTotal);
  } else {
    setTotalAmount(0);
  }
}, [formData.maLoaiPhong, duration, formData.roomQuantity, roomTypes, formData.bookingType]);

// Tính tiền thừa
useEffect(() => {
  if (formData.paymentMethod === 'tien_mat' && formData.payNow && formData.customerPayment) {
    const payment = parseFloat(formData.customerPayment) || 0;
    setChange(payment - totalAmount);
  } else {
    setChange(0);
  }
}, [formData.customerPayment, totalAmount, formData.paymentMethod, formData.payNow]);

const handleInputChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  // Xóa lỗi khi người dùng bắt đầu nhập
  if (errors[field]) {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// ✅ THÊM: Helper function để get unit text
const getUnitText = () => {
  switch (formData.bookingType) {
    case 'theo_gio': return 'giờ';
    case 'qua_dem': return 'đêm';
    case 'dai_ngay': return 'ngày';
    default: return 'đơn vị';
  }
};

return (
  <div className="space-y-4">

    <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Đặt Phòng Tại Quầy
        </h1>
        <p className="text-sm text-gray-600 mt-1">Tạo đơn đặt phòng mới cho khách hàng</p>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-red-500">
        <X className="h-6 w-6" />
      </button>
    </div>

    {/* Thông tin khách hàng */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <User className="h-5 w-5 mr-2" />
        Thông tin khách hàng
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên khách hàng *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Nhập tên khách hàng"
          />
          {errors.customerName && (
            <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Nhập số điện thoại"
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập email (tùy chọn)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CMND/CCCD
          </label>
          <input
            type="text"
            value={formData.cccd}
            onChange={(e) => handleInputChange('cccd', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.cccd ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Nhập số CMND/CCCD"
          />
          {errors.cccd && (
            <p className="text-red-500 text-xs mt-1">{errors.cccd}</p>
          )}
        </div>
      </div>
    </div>

    {/* ✅ THÊM: Chọn loại đặt phòng */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Loại đặt phòng
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bookingTypes.map(type => (
          <label key={type.value} className="cursor-pointer">
            <input
              type="radio"
              name="bookingType"
              value={type.value}
              checked={formData.bookingType === type.value}
              onChange={(e) => handleInputChange('bookingType', e.target.value)}
              className="sr-only"
            />
            <div className={`p-4 rounded-lg border-2 transition-colors ${formData.bookingType === type.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}>
              <h3 className={`font-medium ${formData.bookingType === type.value ? 'text-blue-700' : 'text-gray-800'
                }`}>
                {type.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>

    {/* Thông tin đặt phòng */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <Bed className="h-5 w-5 mr-2" />
        Thông tin đặt phòng
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại phòng *
          </label>
          <select
            value={formData.maLoaiPhong}
            onChange={(e) => handleInputChange('maLoaiPhong', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.maLoaiPhong ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Chọn loại phòng</option>
            {roomTypes.map(room => (
              <option key={room.id} value={room.id}>
                {room.name} - {formatCurrency(room.price)}/{
                  formData.bookingType === 'theo_gio' ? 'giờ' :
                    formData.bookingType === 'qua_dem' ? 'đêm' : 'ngày'
                }
              </option>
            ))}
          </select>
          {errors.maLoaiPhong && (
            <p className="text-red-500 text-xs mt-1">{errors.maLoaiPhong}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày nhận phòng
          </label>
          <input
            type="date"
            value={formData.checkInDate}
            onChange={(e) => handleInputChange('checkInDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* ✅ CONDITIONAL: Ngày trả phòng (không hiển thị với theo giờ) */}
        {formData.bookingType ==='dai_ngay' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày trả phòng *
            </label>
            <input
              type="date"
              value={formData.checkOutDate}
              onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
              min={formData.checkInDate}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.checkOutDate ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.checkOutDate && (
              <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>
            )}
          </div>
        )}


        {formData.bookingType === 'qua_dem' && formData.checkOutDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày trả phòng
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {(() => {
                  const checkOutDate = new Date(formData.checkOutDate);
                  return checkOutDate.toLocaleDateString('vi-VN');
                })()} (12:00)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡Trả phòng lúc 12:00
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số phòng
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleInputChange('roomQuantity', Math.max(1, formData.roomQuantity - 1))}
              className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={formData.roomQuantity}
              onChange={(e) => handleInputChange('roomQuantity', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border-t border-b border-gray-300 text-center"
              min="1"
              max="10"
            />
            <button
              type="button"
              onClick={() => handleInputChange('roomQuantity', Math.min(10, formData.roomQuantity + 1))}
              className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ THÊM: Thời gian cho đặt theo giờ */}
      {formData.bookingType === 'theo_gio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ nhận phòng *
            </label>
            <input
              type="time"
              value={formData.checkInTime}
              onChange={(e) => handleInputChange('checkInTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.checkInTime ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.checkInTime && (
              <p className="text-red-500 text-xs mt-1">{errors.checkInTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ trả phòng *
            </label>
            <input
              type="time"
              value={formData.checkOutTime}
              onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.checkOutTime ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.checkOutTime && (
              <p className="text-red-500 text-xs mt-1">{errors.checkOutTime}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số khách
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleInputChange('guests', Math.max(1, formData.guests - 1))}
              className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={formData.guests}
              onChange={(e) => handleInputChange('guests', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border-t border-b border-gray-300 text-center"
              min="1"
            />
            <button
              type="button"
              onClick={() => handleInputChange('guests', formData.guests + 1)}
              className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ SỬA: Hiển thị duration info */}
      {duration > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-blue-800">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-medium">
              Thời gian lưu trú: {duration} {getUnitText()}
              {formData.bookingType === 'theo_gio' && (
                <span className="text-sm ml-2">
                  ({formData.checkInTime} - {formData.checkOutTime})
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Thanh toán */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <CreditCard className="h-5 w-5 mr-2" />
        Thông tin thanh toán
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phương thức thanh toán
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        {formData.paymentMethod === 'tien_mat' && (
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.payNow}
                onChange={(e) => handleInputChange('payNow', e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Khách thanh toán ngay
              </span>
            </label>

            {formData.payNow && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền khách đưa
                  </label>
                  <input
                    type="number"
                    value={formData.customerPayment}
                    onChange={(e) => handleInputChange('customerPayment', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.customerPayment ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nhập số tiền"
                  />
                  {errors.customerPayment && (
                    <p className="text-red-500 text-xs mt-1">{errors.customerPayment}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiền thừa
                  </label>
                  <div className={`w-full px-3 py-2 border rounded-lg bg-gray-100 flex items-center ${change < 0 ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'
                    }`}>
                    <Calculator className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {change >= 0 ? formatCurrency(change) : `Thiếu ${formatCurrency(Math.abs(change))}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Ghi chú */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        Ghi chú
      </h2>
      <textarea
        value={formData.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
      />
    </div>

    {/* Tổng kết */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-blue-800 mb-3">Tổng kết đơn đặt phòng</h2>

      <div className="space-y-2">
        {formData.maLoaiPhong && duration > 0 && (
          <div className="flex justify-between">
            <span>
              Phòng ({roomTypes.find(r => r.id === formData.maLoaiPhong)?.name}) x {duration} {getUnitText()} x {formData.roomQuantity} phòng:
            </span>
            <span className="font-medium">
              {(() => {
                const roomType = roomTypes.find(r => r.id === formData.maLoaiPhong);
                if (!roomType) return formatCurrency(0);

                let unitPrice = roomType.price;
                if (formData.bookingType === 'theo_gio') {
                  unitPrice = Math.round(roomType.price / 14);
                }

                return formatCurrency(unitPrice * duration * formData.roomQuantity);
              })()}
            </span>
          </div>
        )}

        <div className="border-t pt-2 flex justify-between text-lg font-bold text-blue-800">
          <span>Tổng cộng:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>

        <div className="text-sm text-gray-600">
          {formData.paymentMethod === 'tien_mat' && !formData.payNow && (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              Khách sẽ thanh toán sau
            </div>
          )}
          {formData.paymentMethod === 'tien_mat' && formData.payNow && change >= 0 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Đã thanh toán đủ
            </div>
          )}
          {formData.paymentMethod !== 'tien_mat' && (
            <div className="flex items-center text-blue-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              Thanh toán qua {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.name}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex space-x-4">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || totalAmount === 0}
        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${submitting || totalAmount === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
      >
        {submitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Đang tạo đơn...
          </div>
        ) : (
          `Tạo đơn đặt phòng ${formData.bookingType === 'theo_gio' ? 'theo giờ' : formData.bookingType === 'qua_dem' ? 'qua đêm' : 'dài ngày'}`
        )}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Hủy
      </button>
    </div>

    {/* Debug info - Remove in production */}
    {process.env.NODE_ENV === 'development' && (
      <div className="bg-gray-100 p-3 rounded text-xs">
        <p><strong>Hotel ID:</strong> {hotelId}</p>
        <p><strong>Booking Type:</strong> {formData.bookingType}</p>
        <p><strong>Duration:</strong> {duration} {getUnitText()}</p>
        <p><strong>Room Types:</strong> {roomTypes.length}</p>
        <p><strong>Total Amount:</strong> {totalAmount}</p>
        <p><strong>Form Valid:</strong> {Object.keys(errors).length === 0 ? 'Yes' : 'No'}</p>
      </div>
    )}

  </div>
);
};

export default AddBooking;