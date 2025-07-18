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

    // Thông tin đặt phòng
    maLoaiPhong: '', // Room type ID
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    guests: 1,
    roomQuantity: 1,

    // Thanh toán
    paymentMethod: 'tien_mat',
    payNow: false,
    customerPayment: '',

    // Ghi chú
    notes: ''
  });

  const [nights, setNights] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [errors, setErrors] = useState({});
  const [roomTypes, setRoomTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const paymentMethods = [
    { id: 'tien_mat', name: 'Tiền mặt' },
    { id: 'VNPay', name: 'VNPay' },
    { id: 'Momo', name: 'Momo' },
    { id: 'ZaloPay', name: 'ZaloPay' },
    { id: 'the_tin_dung', name: 'Thẻ tín dụng' }
  ];

  // Tạo đơn đặt phòng mới tại quầy
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        maKhachSan: hotelId,
        maLoaiPhong: formData.maLoaiPhong,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
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
        // Refresh page để load lại danh sách bookings
        window.location.reload();
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
        // Giả sử API trả về danh sách room types
        const formatted = response.data.map(room => ({
          id: room.roomId,
          name: room.roomTypeName,
          price: room.roomTypePrice,
          maxGuests: room.roomcapacity,
          description: room.roomTypeDescription
        }));

        // Loại bỏ trùng lặp dựa trên ID
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

  // Tính số ngày lưu trú
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  // Tính tổng tiền
  useEffect(() => {
    const roomType = roomTypes.find(rt => rt.id === formData.maLoaiPhong);
    const roomTotal = roomType ? roomType.price * nights * formData.roomQuantity : 0;
    setTotalAmount(roomTotal);
  }, [formData.maLoaiPhong, nights, formData.roomQuantity, roomTypes]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'Vui lòng nhập tên khách hàng';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.maLoaiPhong) newErrors.maLoaiPhong = 'Vui lòng chọn loại phòng';
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
    if (nights <= 0) newErrors.checkOutDate = 'Ngày trả phòng phải sau ngày nhận phòng';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
                  {room.name} - {formatCurrency(room.price)}/ngày
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

        {nights > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center text-blue-800">
              <Clock className="h-4 w-4 mr-2" />
              <span className="font-medium">Số ngày lưu trú: {nights} ngày</span>
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
          {formData.maLoaiPhong && (
            <div className="flex justify-between">
              <span>
                Phòng ({roomTypes.find(r => r.id === formData.maLoaiPhong)?.name}) x {nights} ngày x {formData.roomQuantity} phòng:
              </span>
              <span className="font-medium">
                {formatCurrency((roomTypes.find(r => r.id === formData.maLoaiPhong)?.price || 0) * nights * formData.roomQuantity)}
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
            'Tạo đơn đặt phòng'
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
          <p><strong>Room Types:</strong> {roomTypes.length}</p>
          <p><strong>Total Amount:</strong> {totalAmount}</p>
          <p><strong>Form Valid:</strong> {Object.keys(errors).length === 0 ? 'Yes' : 'No'}</p>
        </div>
      )}

    </div>
  );
};

export default AddBooking;