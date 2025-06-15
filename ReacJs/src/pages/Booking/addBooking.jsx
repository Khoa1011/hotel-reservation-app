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
  AlertCircle
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from "moment";

const CounterBookingForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const hotelId = localStorage.getItem("selectedHotelId");


  const [formData, setFormData] = useState({
    // Thông tin khách hàng
    customerName: '',
    phoneNumber: '',
    email: '',
    idNumber: '',

    // Thông tin đặt phòng
    roomType: '',
    checkInDate: new Date().toISOString().split('T')[0], // Mặc định ngày hiện tại
    checkOutDate: '',
    guests: 1,

    // Thanh toán
    paymentMethod: 'cash',
    payNow: false,
    customerPayment: '',

    // Dịch vụ thêm
    additionalServices: [],

    // Ghi chú
    notes: ''
  });

  const [nights, setNights] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [serviceTotal, setServiceTotal] = useState(0);
  const [change, setChange] = useState(0);
  const [errors, setErrors] = useState({});
  const [roomTypes, setRoomTypes] = useState([]);

  // // Dữ liệu mẫu
  // const roomTypes = [
  //   { id: 'standard', name: 'Phòng Standard', price: 500000 },
  //   { id: 'deluxe', name: 'Phòng Deluxe', price: 800000 },
  //   { id: 'suite', name: 'Phòng Suite', price: 1200000 },
  //   { id: 'family', name: 'Phòng Family', price: 1500000 }
  // ];

  const paymentMethods = [
    { id: 'cash', name: 'Tiền mặt' },
    { id: 'vnpay', name: 'VNPay' },
    { id: 'momo', name: 'Momo' },
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng' },
    { id: 'credit_card', name: 'Thẻ tín dụng' }
  ];

  const additionalServicesList = [
    { id: 'breakfast', name: 'Ăn sáng buffet', price: 150000 },
    { id: 'lunch', name: 'Ăn trưa', price: 200000 },
    { id: 'dinner', name: 'Ăn tối', price: 250000 },
    { id: 'laundry', name: 'Giặt ủi', price: 100000 },
    { id: 'spa', name: 'Dịch vụ Spa', price: 500000 },
    { id: 'airport_pickup', name: 'Đưa đón sân bay', price: 300000 },
    { id: 'extra_bed', name: 'Giường phụ', price: 200000 },
    { id: 'minibar', name: 'Minibar', price: 80000 }
  ];

  //Tạo đơn đặt phòng mới tại quầy
  const handleSubmit = async () => {
  try {
    const payload = {
      hotelsId: hotelIdFromStorageOrProp,  // Lấy từ localStorage hoặc props
      roomId: formData.roomTypeId,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      paymentMethod: formData.paymentMethod,
      status: formData.status || 'pending', // mặc định nếu không chọn
      totalAmount: totalAmount, // đã tính trước
      additionalServices: formData.additionalServices,
    };

    const response = await axios.post(`${baseUrl}/bookings/hotelowner/create-booking`, payload);

    if (response.data?.message?.msgError === false) {
      toast.success(response.data.message.msgBody);
      // reset form hoặc chuyển trang
    } else {
      toast.error(response.data.message.msgBody || 'Tạo đơn không thành công!');
    }

  } catch (error) {
    console.error('Lỗi tạo đơn:', error);
    toast.error('Tạo đơn đặt phòng thất bại!');
  }
};

  //Lấy danh sách phòng trong khách sạn
  const getRoomInHotel = async (hotelsId = '') => {
    try {
      const url = `${baseUrl}/rooms/hotelowner/getRoomInHotel/${hotelsId}`;
      const response = await axios.get(url);

      if (response.status === 200) {
        const formatted = response.data.map(room => ({
          id: room.roomTypeId, // ID loại phòng
          name: room.roomTypeName,
          price: room.roomTypePrice
        }));

        // // Loại bỏ trùng lặp (do mỗi phòng có thể thuộc cùng loại phòng)
        // const uniqueRoomTypes = Array.from(
        //   new Map(formatted.map(item => [item.id, item])).values()
        // );

        setRoomTypes(formatted);
        console.log("Danh sách phòng trong ks: ",formatted);
      } else if (response.status === 400) {
        toast.error(response.data.msgBody || 'Không có phòng nào trong khách sạn này');
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng:", error);
      toast.error("Lỗi lấy dữ liệu phòng khách sạn");
    }
  };

  //Lấy id khi người dùng chọn khách sạn
  useEffect(() => {
    console.log(hotelId);
    if (hotelId) {
      getRoomInHotel(hotelId);
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

  // Tính tổng tiền dịch vụ
  useEffect(() => {
    const total = formData.additionalServices.reduce((sum, serviceId) => {
      const service = additionalServicesList.find(s => s.id === serviceId);
      return sum + (service ? service.price : 0);
    }, 0);
    setServiceTotal(total);
  }, [formData.additionalServices]);

  // Tính tổng tiền
  useEffect(() => {
    const roomType = roomTypes.find(rt => rt.id === formData.roomType);
    const roomTotal = roomType ? roomType.price * nights : 0;
    setTotalAmount(roomTotal + serviceTotal);
  }, [formData.roomType, nights, serviceTotal]);

  // Tính tiền thừa
  useEffect(() => {
    if (formData.paymentMethod === 'cash' && formData.payNow && formData.customerPayment) {
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

  const handleServiceChange = (serviceId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        additionalServices: [...prev.additionalServices, serviceId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        additionalServices: prev.additionalServices.filter(id => id !== serviceId)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName) newErrors.customerName = 'Vui lòng nhập tên khách hàng';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.roomType) newErrors.roomType = 'Vui lòng chọn loại phòng';
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
    if (nights <= 0) newErrors.checkOutDate = 'Ngày trả phòng phải sau ngày nhận phòng';

    if (formData.paymentMethod === 'cash' && formData.payNow) {
      const payment = parseFloat(formData.customerPayment) || 0;
      if (payment < totalAmount) {
        newErrors.customerPayment = 'Số tiền khách đưa không đủ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="p-4">
      {/* Button để mở modal */}
      <button
        onClick={handleOpen}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
      >
        Đặt Phòng Tại Quầy
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h1 className="text-2xl font-bold text-gray-800">Đặt Phòng Tại Quầy</h1>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-6">
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
                        value={formData.idNumber}
                        onChange={(e) => handleInputChange('idNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số CMND/CCCD"
                      />
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
                        value={formData.roomType}
                        onChange={(e) => { handleInputChange('roomType', e.target.value);
                        

                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.roomType ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Chọn loại phòng</option>
                        {roomTypes.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} - {formatCurrency(room.price)}/đêm
                          </option>
                        ))}
                      </select>
                      {errors.roomType && (
                        <p className="text-red-500 text-xs mt-1">{errors.roomType}</p>
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

                {/* Dịch vụ thêm */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Dịch vụ thêm
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {additionalServicesList.map(service => (
                      <label key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.additionalServices.includes(service.id)}
                          onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{service.name}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(service.price)}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {serviceTotal > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between text-green-800">
                        <span className="font-medium">Tổng dịch vụ thêm:</span>
                        <span className="font-bold">{formatCurrency(serviceTotal)}</span>
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

                    {formData.paymentMethod === 'cash' && (
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
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                  />
                </div>

                {/* Tổng kết */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-3">Tổng kết đơn đặt phòng</h2>

                  <div className="space-y-2">
                    {formData.roomType && (
                      <div className="flex justify-between">
                        <span>Phòng ({roomTypes.find(r => r.id === formData.roomType)?.name}) x {nights} ngày:</span>
                        <span className="font-medium">
                          {formatCurrency((roomTypes.find(r => r.id === formData.roomType)?.price || 0) * nights)}
                        </span>
                      </div>
                    )}

                    {serviceTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Dịch vụ thêm:</span>
                        <span className="font-medium">{formatCurrency(serviceTotal)}</span>
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between text-lg font-bold text-blue-800">
                      <span>Tổng cộng:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      {formData.paymentMethod === 'cash' && !formData.payNow && (
                        <div className="flex items-center text-orange-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Khách sẽ thanh toán sau
                        </div>
                      )}
                      {formData.paymentMethod === 'cash' && formData.payNow && change >= 0 && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Đã thanh toán đủ
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
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Tạo đơn đặt phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounterBookingForm;