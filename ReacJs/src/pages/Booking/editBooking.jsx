import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Clock, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import moment from 'moment';

const EditBooking = ({ onClose, booking, setBookings, setLocalBookings }) => {
  // Quản lý state trong EditBooking
  const [editServices, setEditServices] = useState(booking?.additionalServices || []);
  const [newService, setNewService] = useState({ name: '', price: '', quantity: 1 });
  const [paymentMethod, setPaymentMethod] = useState(booking?.paymentMethod || '');
  const [selectedStatus, setSelectedStatus] = useState(booking.status);

  // ✅ THÊM: State cho booking type và time changes
  const [newBookingType, setNewBookingType] = useState(booking?.bookingType || '');
  const [newCheckInDate, setNewCheckInDate] = useState(
    moment(booking?.checkInDate, 'DD-MM-YYYY').format('YYYY-MM-DD') || ''
  );
  const [newCheckOutDate, setNewCheckOutDate] = useState(
    moment(booking?.checkOutDate, 'DD-MM-YYYY').format('YYYY-MM-DD') || ''
  );
  const [newCheckInTime, setNewCheckInTime] = useState(booking?.checkInTime || '14:00');
  const [newCheckOutTime, setNewCheckOutTime] = useState(booking?.checkOutTime || '12:00');

  // ✅ THÊM: State cho actual time tracking
  const [actualCheckInTime, setActualCheckInTime] = useState('');
  const [actualCheckOutTime, setActualCheckOutTime] = useState('');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  // ✅ THÊM: State để tính toán pricing preview
  const [pricingPreview, setPricingPreview] = useState(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // ✅ THÊM: Danh sách booking types
  const bookingTypes = [
    { value: 'theo_gio', label: 'Theo giờ', description: 'Đặt phòng theo số giờ sử dụng' },
    { value: 'qua_dem', label: 'Qua đêm', description: 'Đặt phòng qua đêm (1 ngày)' },
    { value: 'dai_ngay', label: 'Dài ngày', description: 'Đặt phòng nhiều ngày (2+ ngày)' }
  ];

  // Danh sách dịch vụ có sẵn
  const availableServices = [
    { name: 'Nước suối', price: 15000 },
    { name: 'Coca Cola', price: 20000 },
    { name: 'Bánh kẹo', price: 25000 },
    { name: 'Dịch vụ giặt ủi', price: 50000 },
    { name: 'Massage', price: 300000 },
    { name: 'Ăn sáng', price: 100000 },
    { name: 'Thuê xe', price: 500000 },
    { name: 'Tour du lịch', price: 800000 },
  ];

  // Danh sách phương thức thanh toán
  const paymentMethods = [
    { value: 'tien_mat', label: 'Tiền mặt' },
    { value: 'the_tin_dung', label: 'Thẻ tín dụng' },
    { value: 'ZaloPay', label: 'Zalo pay' },
    { value: 'Momo', label: 'MoMo' },
    { value: 'VNPay', label: 'VNPay' },
  ];

  // ✅ THÊM: useEffect để tính toán pricing preview khi có thay đổi
  useEffect(() => {
    if (newBookingType && newBookingType !== booking?.bookingType) {
      calculatePricingPreview();
    }
  }, [newBookingType, newCheckInDate, newCheckOutDate, newCheckInTime, newCheckOutTime]);

  // ✅ THÊM: Function tính toán pricing preview
  const calculatePricingPreview = () => {
    try {
      let duration = 1;
      let unit = 'đêm';
      
      const basePrice = booking?.roomPrice || 0;
      let unitPrice = basePrice;

      if (newBookingType === 'theo_gio') {
        if (newCheckInTime && newCheckOutTime) {
          const startTime = moment(`${newCheckInDate} ${newCheckInTime}`, 'YYYY-MM-DD HH:mm');
          let endTime = moment(`${newCheckInDate} ${newCheckOutTime}`, 'YYYY-MM-DD HH:mm');
          
          if (endTime.isSameOrBefore(startTime)) {
            endTime.add(1, 'day');
          }
          
          duration = Math.ceil(endTime.diff(startTime, 'hours', true));
          unit = 'giờ';
          unitPrice = Math.round(basePrice / 14); // Giá theo giờ
        }
      } else if (newCheckInDate && newCheckOutDate) {
        const checkIn = moment(newCheckInDate);
        const checkOut = moment(newCheckOutDate);
        duration = checkOut.diff(checkIn, 'days');
        unit = newBookingType === 'qua_dem' ? 'đêm' : 'ngày';
      }

      const roomQuantity = booking?.roomQuantity || 1;
      const newTotal = unitPrice * duration * roomQuantity;

      setPricingPreview({
        duration,
        unit,
        unitPrice,
        newTotal,
        oldTotal: booking?.totalAmount || 0,
        difference: newTotal - (booking?.totalAmount || 0)
      });
    } catch (error) {
      console.error('Error calculating pricing preview:', error);
      setPricingPreview(null);
    }
  };

  // Hàm định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Helper function để hiển thị tên status
  const getVietnameseStatusText = (status) => {
    const statusTexts = {
      'dang_cho': 'Đang chờ',
      'da_xac_nhan': 'Đã xác nhận',
      'da_huy': 'Đã hủy',
      'da_nhan_phong': 'Đã nhận phòng',
      'dang_su_dung': 'Đang sử dụng',
      'da_tra_phong': 'Đã trả phòng'
    };
    return statusTexts[status] || status;
  };

  const getVietnameseStatusColor = (status) => {
    const statusColors = {
      'dang_cho': 'text-yellow-600 bg-yellow-100',
      'da_xac_nhan': 'text-green-600 bg-green-100',
      'da_huy': 'text-red-600 bg-red-100',
      'da_nhan_phong': 'text-blue-600 bg-blue-100',
      'dang_su_dung': 'text-purple-600 bg-purple-100',
      'da_tra_phong': 'text-gray-600 bg-gray-100',
      'khong_nhan_phong': 'text-red-600 bg-red-100'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  };

  // Tính tổng tiền dịch vụ
  const calculateServicesTotal = (services) => {
    return services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

  // Hàm thêm dịch vụ mới
  const addService = () => {
    if (!newService.name || !newService.price || newService.quantity < 1) {
      toast.error('Vui lòng nhập đầy đủ thông tin dịch vụ!');
      return;
    }

    const serviceExists = editServices.some((service) => service.name === newService.name);
    if (serviceExists) {
      toast.error('Dịch vụ này đã được thêm!');
      return;
    }

    setEditServices([
      ...editServices,
      {
        id: Date.now(),
        name: newService.name,
        price: parseFloat(newService.price),
        quantity: newService.quantity,
      },
    ]);
    setNewService({ name: '', price: '', quantity: 1 });
    toast.success('Thêm dịch vụ thành công!');
  };

  // Hàm xóa dịch vụ
  const removeService = (serviceId) => {
    setEditServices(editServices.filter((service) => service.id !== serviceId));
    toast.success('Xóa dịch vụ thành công!');
  };

  // Hàm cập nhật số lượng dịch vụ
  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity < 1) return;
    setEditServices(
      editServices.map((service) =>
        service.id === serviceId ? { ...service, quantity } : service
      )
    );
  };

  // Hàm cập nhật booking với booking type và time tracking
  const updateBookingServices = async (bookingId, services, paymentMethod, bookingStatus, bookingTypeChanges, actualTimes) => {
    try {
      const updateData = {
        ...(services && services.length > 0 && { service: services }),
        ...(paymentMethod && { paymentMethod }),
        ...(bookingStatus && { status: bookingStatus }),

        ...(bookingTypeChanges.newBookingType && { newBookingType: bookingTypeChanges.newBookingType }),
        ...(bookingTypeChanges.newCheckInDate && { newCheckInDate: bookingTypeChanges.newCheckInDate }),
        ...(bookingTypeChanges.newCheckOutDate && { newCheckOutDate: bookingTypeChanges.newCheckOutDate }),
        ...(bookingTypeChanges.newCheckInTime && { newCheckInTime: bookingTypeChanges.newCheckInTime }),
        ...(bookingTypeChanges.newCheckOutTime && { newCheckOutTime: bookingTypeChanges.newCheckOutTime }),

        ...(actualTimes.actualCheckInTime && { actualCheckInTime: actualTimes.actualCheckInTime }),
        ...(actualTimes.actualCheckOutTime && { actualCheckOutTime: actualTimes.actualCheckOutTime }),
        ...(actualTimes.roomIndex !== undefined && { roomIndex: actualTimes.roomIndex })
      };

      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update/${bookingId}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        // Cập nhật state với dữ liệu mới
        const updatedBooking = {
          ...booking,
          additionalServices: services || booking.additionalServices,
          paymentMethod: paymentMethod || booking.paymentMethod,
          status: bookingStatus || booking.status,
          bookingType: bookingTypeChanges.newBookingType || booking.bookingType,
    
          ...(response.data.updatedBooking || {})
        };
        
        setLocalBookings(prev =>
          prev.map(b => b.bookingId === bookingId ? updatedBooking : b)
        );
        setBookings(prev =>
          prev.map(b => b.bookingId === bookingId ? updatedBooking : b)
        );
        
        toast.success('Cập nhật đơn đặt thành công!');
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || 'Cập nhật thất bại!');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      toast.error('Lỗi khi cập nhật đơn đặt!');
      return { success: false };
    }
  };

  // Hàm lưu thay đổi với nhiều options
  const saveChanges = async () => {
    if (!booking) {
      toast.error('Không có thông tin đơn đặt phòng!');
      return;
    }

    if (!paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán!');
      return;
    }
    const bookingTypeChanges = {};
    if (newBookingType && newBookingType !== booking.bookingType) {
      bookingTypeChanges.newBookingType = newBookingType;
      bookingTypeChanges.newCheckInDate = newCheckInDate;
      bookingTypeChanges.newCheckOutDate = newCheckOutDate;
      bookingTypeChanges.newCheckInTime = newCheckInTime;
      bookingTypeChanges.newCheckOutTime = newCheckOutTime;
    }

    const actualTimes = {};
    if (actualCheckInTime || actualCheckOutTime) {
      actualTimes.actualCheckInTime = actualCheckInTime;
      actualTimes.actualCheckOutTime = actualCheckOutTime;
      actualTimes.roomIndex = selectedRoomIndex;
    }

    const result = await updateBookingServices(
      booking.bookingId,
      editServices || '',
      paymentMethod || '',
      selectedStatus || '',
      bookingTypeChanges,
      actualTimes
    );

    if (result.success) {
      onClose();
    }
  };

  const calculateTotal = () => {
    const roomAmount = pricingPreview ? pricingPreview.newTotal : (booking.totalAmount || 0);
    const servicesAmount = calculateServicesTotal(editServices);
    return roomAmount + servicesAmount;
  };

  if (!booking) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Chỉnh sửa đơn #{booking.bookingId}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Thông tin khách hàng */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Thông tin đơn đặt</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Khách hàng:</span>
                <span className="ml-2 font-medium">{booking.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">Loại phòng:</span>
                <span className="ml-2 font-medium">{booking.roomType}</span>
              </div>
              <div>
                <span className="text-gray-600">Thời gian nhận:</span>
                <span className="ml-2 font-medium">{booking.checkInDate} {booking.checkInTime}</span>
              </div>
              <div>
                <span className="text-gray-600">Thời gian trả:</span>
                <span className="ml-2 font-medium">{booking.checkOutDate} {booking.checkOutTime}</span>
              </div>
              <div>
                <span className="text-gray-600">Loại đặt hiện tại:</span>
                <span className="ml-2 font-medium">
                  {booking.bookingType === 'theo_gio' ? 'Theo giờ' : 
                   booking.bookingType === 'qua_dem' ? 'Qua đêm' : 'Dài ngày'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Số phòng:</span>
                <span className="ml-2 font-medium">{booking.roomQuantity || 1} phòng</span>
              </div>
            </div>
          </div>

          {/* ✅ THÊM: Thay đổi loại đặt phòng */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Thay đổi loại đặt phòng
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn loại đặt phòng mới
                </label>
                <select
                  value={newBookingType}
                  onChange={(e) => setNewBookingType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Giữ nguyên ({booking.bookingType === 'theo_gio' ? 'Theo giờ' : booking.bookingType === 'qua_dem' ? 'Qua đêm' : 'Dài ngày'})</option>
                  {bookingTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {newBookingType && (
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-700 mb-3">Cập nhật thời gian</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày nhận phòng
                      </label>
                      <input
                        type="date"
                        value={newCheckInDate}
                        onChange={(e) => setNewCheckInDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {newBookingType !== 'theo_gio' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày trả phòng
                        </label>
                        <input
                          type="date"
                          value={newCheckOutDate}
                          onChange={(e) => setNewCheckOutDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min={newCheckInDate}
                        />
                      </div>
                    )}

                    {(newBookingType === 'theo_gio' || newBookingType === 'qua_dem') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giờ nhận phòng
                          </label>
                          <input
                            type="time"
                            value={newCheckInTime}
                            onChange={(e) => setNewCheckInTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giờ trả phòng
                          </label>
                          <input
                            type="time"
                            value={newCheckOutTime}
                            onChange={(e) => setNewCheckOutTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* ✅ Pricing Preview */}
                  {pricingPreview && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border">
                      <h5 className="font-medium text-blue-800 mb-2">Preview giá mới:</h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Thời gian:</span>
                          <span>{pricingPreview.duration} {pricingPreview.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giá cũ:</span>
                          <span>{formatCurrency(pricingPreview.oldTotal)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Giá mới:</span>
                          <span className={pricingPreview.difference >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {pricingPreview.difference >= 0 ? '+' : ''}{formatCurrency(pricingPreview.difference)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ THÊM: Cập nhật thời gian thực tế */}
          {booking.assignedRooms && booking.assignedRooms.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Cập nhật thời gian thực tế
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn phòng cần cập nhật
                  </label>
                  <select
                    value={selectedRoomIndex}
                    onChange={(e) => setSelectedRoomIndex(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {booking.assignedRooms.map((room, index) => (
                      <option key={index} value={index}>
                        Phòng {room.soPhong} - Tầng {room.tang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ nhận phòng thực tế
                    </label>
                    <input
                      type="time"
                      value={actualCheckInTime}
                      onChange={(e) => setActualCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nhập giờ nhận thực tế"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Kế hoạch: {booking.checkInTime} | Nhận sớm → trả sớm, nhận trễ → trả đúng giờ
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ trả phòng thực tế
                    </label>
                    <input
                      type="time"
                      value={actualCheckOutTime}
                      onChange={(e) => setActualCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nhập giờ trả thực tế"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Kế hoạch: {booking.checkOutTime}
                    </p>
                  </div>
                </div>

                {/* ✅ Time calculation preview */}
                {actualCheckInTime && (
                  <div className="p-3 bg-white rounded border">
                    <h5 className="font-medium text-green-800 mb-2">Preview thời gian:</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Kế hoạch nhận:</span>
                        <span>{booking.checkInDate} {booking.checkInTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thực tế nhận:</span>
                        <span className="font-medium">{booking.checkInDate} {actualCheckInTime}</span>
                      </div>
                      {(() => {
                        const plannedTime = moment(`${booking.checkInDate} ${booking.checkInTime}`, 'DD-MM-YYYY HH:mm');
                        const actualTime = moment(`${booking.checkInDate} ${actualCheckInTime}`, 'DD-MM-YYYY HH:mm');
                        const diff = actualTime.diff(plannedTime, 'minutes');
                        
                        if (diff < 0) {
                          const plannedCheckOut = moment(`${booking.checkOutDate} ${booking.checkOutTime}`, 'DD-MM-YYYY HH:mm');
                          const adjustedCheckOut = plannedCheckOut.add(diff, 'minutes');
                          
                          return (
                            <div className="text-blue-600 text-xs bg-blue-50 p-2 rounded">
                              <p>⏰ Nhận sớm {Math.abs(diff)} phút</p>
                              <p>→ Giờ trả điều chỉnh: {adjustedCheckOut.format('HH:mm')}</p>
                            </div>
                          );
                        } else if (diff > 0) {
                          return (
                            <div className="text-orange-600 text-xs bg-orange-50 p-2 rounded">
                              <p>⏰ Nhận trễ {diff} phút</p>
                              <p>→ Giờ trả giữ nguyên: {booking.checkOutTime}</p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-green-600 text-xs bg-green-50 p-2 rounded">
                              <p>⏰ Nhận đúng giờ</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chọn phương thức thanh toán */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Phương thức thanh toán</h3>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn phương thức thanh toán</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cập nhật trạng thái đơn đặt */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Cập nhật trạng thái đơn đặt</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn trạng thái mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dang_cho">Đang chờ</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="da_huy">Đã hủy</option>
                  <option value="da_nhan_phong">Đã nhận phòng</option>
                  <option value="dang_su_dung">Đang sử dụng</option>
                  <option value="da_tra_phong">Đã trả phòng</option>
                  <option value="khong_nhan_phong">Không nhận phòng</option>
                </select>
              </div>

              {/* Hiển thị trạng thái hiện tại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái hiện tại
                </label>
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getVietnameseStatusColor(booking.status)}`}>
                  {getVietnameseStatusText(booking.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Quản lý dịch vụ */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Dịch vụ bổ sung</h3>

            {/* Thêm dịch vụ mới */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Thêm dịch vụ</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={newService.name}
                  onChange={(e) => {
                    const selectedService = availableServices.find(
                      (s) => s.name === e.target.value
                    );
                    setNewService({
                      ...newService,
                      name: e.target.value,
                      price: selectedService ? selectedService.price : '',
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn dịch vụ</option>
                  {availableServices.map((service, index) => (
                    <option key={index} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                  placeholder="Giá (VNĐ)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  value={newService.quantity}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  placeholder="Số lượng"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={addService}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </button>
              </div>
            </div>

            {/* Danh sách dịch vụ đã thêm */}
            {editServices.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Dịch vụ đã chọn:</h4>
                {editServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-gray-600">{formatCurrency(service.price)}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{service.quantity}</span>
                        <button
                          onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-medium text-blue-600 min-w-[100px] text-right">
                        {formatCurrency(service.price * service.quantity)}
                      </span>

                      <button
                        onClick={() => removeService(service.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Tổng dịch vụ:</span>
                    <span className="text-blue-600">
                      {formatCurrency(calculateServicesTotal(editServices))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tổng kết */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Tổng kết thanh toán</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tiền phòng {pricingPreview ? '(mới)' : '(hiện tại)'}:</span>
                <span className={pricingPreview ? 'text-blue-600 font-medium' : ''}>
                  {formatCurrency(pricingPreview ? pricingPreview.newTotal : (booking.roomAmount || booking.totalAmount))}
                </span>
              </div>
              {pricingPreview && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tiền phòng cũ:</span>
                  <span className="line-through">{formatCurrency(booking.totalAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Dịch vụ bổ sung:</span>
                <span>{formatCurrency(calculateServicesTotal(editServices))}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={saveChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBooking;