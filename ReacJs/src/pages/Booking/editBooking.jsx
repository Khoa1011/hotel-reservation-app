// ✅ ENHANCED EditBooking.jsx với các tính năng mới

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Clock, Calendar, User, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import moment from 'moment';

const EditBooking = ({ onClose, booking, setBookings, setLocalBookings }) => {
  // Existing states
  const [editServices, setEditServices] = useState(booking?.additionalServices || []);
  const [newService, setNewService] = useState({ name: '', price: '', quantity: 1 });
  const [paymentMethod, setPaymentMethod] = useState(booking?.paymentMethod || '');
  const [selectedStatus, setSelectedStatus] = useState(booking.status);

  // ✅ ENHANCED: State cho booking type changes
  const [newBookingType, setNewBookingType] = useState(''); // Empty = no change
  const [newCheckInDate, setNewCheckInDate] = useState(
    moment(booking?.checkInDate, 'DD-MM-YYYY').format('YYYY-MM-DD') || ''
  );
  const [newCheckOutDate, setNewCheckOutDate] = useState(
    moment(booking?.checkOutDate, 'DD-MM-YYYY').format('YYYY-MM-DD') || ''
  );
  const [newCheckInTime, setNewCheckInTime] = useState(booking?.checkInTime || '14:00');
  const [newCheckOutTime, setNewCheckOutTime] = useState(booking?.checkOutTime || '12:00');

  // ✅ ENHANCED: State cho actual time tracking
  const [actualCheckInTime, setActualCheckInTime] = useState('');
  const [actualCheckOutTime, setActualCheckOutTime] = useState('');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  // ✅ NEW: State cho cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // ✅ ENHANCED: State cho pricing preview
  const [pricingPreview, setPricingPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Existing data arrays
  const bookingTypes = [
    { value: 'theo_gio', label: 'Theo giờ', description: 'Đặt phòng theo số giờ sử dụng' },
    { value: 'qua_dem', label: 'Qua đêm', description: 'Đặt phòng qua đêm (1 ngày)' },
    { value: 'dai_ngay', label: 'Dài ngày', description: 'Đặt phòng nhiều ngày (2+ ngày)' }
  ];

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

  const paymentMethods = [
    { value: 'tien_mat', label: 'Tiền mặt' },
    { value: 'the_tin_dung', label: 'Thẻ tín dụng' },
    { value: 'ZaloPay', label: 'Zalo pay' },
    { value: 'Momo', label: 'MoMo' },
    { value: 'VNPay', label: 'VNPay' },
  ];

  // ✅ ENHANCED: useEffect cho pricing preview
  useEffect(() => {
    if (newBookingType && newBookingType !== booking?.bookingType) {
      calculatePricingPreview(); // ✅ Gọi API thay vì tính local
    } else {
      setPricingPreview(null);
    }
  }, [newBookingType, newCheckInDate, newCheckOutDate, newCheckInTime, newCheckOutTime]);

  // ✅ ENHANCED: Calculate pricing preview
  const calculatePricingPreview = async () => {
    if (!newBookingType || newBookingType === booking?.bookingType) {
      setPricingPreview(null);
      return;
    }

    try {
      // ✅ Gọi API để lấy pricing preview từ backend
      const previewData = {
        newBookingType,
        newCheckInDate,
        newCheckOutDate,
        newCheckInTime,
        newCheckOutTime
      };

      console.log('🔄 Requesting pricing preview from backend:', previewData);

      // ✅ Call backend API để tính pricing preview
      const response = await axios.post(
        `${baseUrl}/api/booking-hotel/hotelowner/pricing-preview/${booking.bookingId}`,
        previewData,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setPricingPreview(response.data.pricingPreview);
        console.log('💰 Backend pricing preview:', response.data.pricingPreview);
      } else {
        console.warn('Backend pricing preview failed:', response.data);
        setPricingPreview(null);
      }

    } catch (error) {
      console.error('Error getting pricing preview from backend:', error);

      // ✅ Fallback: Tính local nếu API fail
      const currentTotal = booking?.priceDetails?.tongTienPhong || booking?.totalAmount || 0;
      setPricingPreview({
        changeType: 'fallback',
        newTotal: currentTotal,
        oldTotal: currentTotal,
        difference: 0,
        error: 'Không thể tính preview từ server'
      });
    }
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getVietnameseStatusText = (status) => {
    const statusTexts = {
      'dang_cho': 'Đang chờ',
      'da_xac_nhan': 'Đã xác nhận',
      'da_huy': 'Đã hủy',
      'da_nhan_phong': 'Đã nhận phòng',
      'dang_su_dung': 'Đang sử dụng',
      'da_tra_phong': 'Đã trả phòng',
      'khong_nhan_phong': 'Không nhận phòng'
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

  // Service management functions
  const calculateServicesTotal = (services) => {
    return services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

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

  const removeService = (serviceId) => {
    setEditServices(editServices.filter((service) => service.id !== serviceId));
    toast.success('Xóa dịch vụ thành công!');
  };

  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity < 1) return;
    setEditServices(
      editServices.map((service) =>
        service.id === serviceId ? { ...service, quantity } : service
      )
    );
  };

  // ✅ ENHANCED: Main update function with better API sync
  const updateBookingServices = async (updateData) => {
    try {
      setIsUpdating(true);

      console.log('🔄 Updating booking with data:', updateData);

      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update/${booking.bookingId}`,
        updateData,
        { withCredentials: true }
      );

      console.log('📋 Update response:', response.data);

      if (response.data?.message?.msgError === false) {
        // ✅ Enhanced state update with API response
        const updatedBooking = {
          ...booking,
          ...updateData,
          ...(response.data.updatedBooking || {}),
          // Update pricing if changed
          ...(response.data.updatedBooking?.priceDetails && {
            priceDetails: response.data.updatedBooking.priceDetails,
            totalAmount: response.data.updatedBooking.totalAmount
          })
        };

        setLocalBookings(prev =>
          prev.map(b => b.bookingId === booking.bookingId ? updatedBooking : b)
        );
        setBookings(prev =>
          prev.map(b => b.bookingId === booking.bookingId ? updatedBooking : b)
        );

        toast.success(response.data.message.msgBody || 'Cập nhật đơn đặt thành công!');
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || 'Cập nhật thất bại!');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Error updating booking:', error);
      const errorMessage = error.response?.data?.message?.msgBody ||
        error.response?.data?.message ||
        'Lỗi khi cập nhật đơn đặt!';
      toast.error(errorMessage);
      return { success: false };
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ NEW: Cancel modal functions
  const openCancelModal = () => {
    setShowCancelModal(true);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn!');
      return;
    }

    setIsSubmittingCancel(true);
    try {
      const result = await updateBookingServices({
        status: 'da_huy',
        reason: cancelReason.trim()
      });

      if (result.success) {
        setSelectedStatus('da_huy');
        closeCancelModal();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // ✅ ENHANCED: Save changes with proper API calls
  const saveChanges = async () => {
    if (!booking) {
      toast.error('Không có thông tin đơn đặt phòng!');
      return;
    }

    // ✅ Handle cancel status separately
    if (selectedStatus === 'da_huy' && booking.status !== 'da_huy') {
      openCancelModal();
      return;
    }

    if (!paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    // ✅ Build update data
    const updateData = {};

    // Services
    if (editServices && editServices.length > 0) {
      updateData.service = editServices;
    }

    // Payment method
    if (paymentMethod && paymentMethod !== booking.paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Status (except cancel which is handled separately)
    if (selectedStatus && selectedStatus !== booking.status && selectedStatus !== 'da_huy') {
      updateData.status = selectedStatus;
    }

    // ✅ Booking type changes
    if (newBookingType && newBookingType !== booking.bookingType) {
      updateData.newBookingType = newBookingType;
      updateData.newCheckInDate = newCheckInDate;
      updateData.newCheckOutDate = newCheckOutDate;
      updateData.newCheckInTime = newCheckInTime;
      updateData.newCheckOutTime = newCheckOutTime;
    }

    // ✅ Actual time tracking
    if (actualCheckInTime || actualCheckOutTime) {
      updateData.actualCheckInTime = actualCheckInTime;
      updateData.actualCheckOutTime = actualCheckOutTime;
      updateData.roomIndex = selectedRoomIndex;
    }

    console.log('💾 Saving changes:', updateData);

    const result = await updateBookingServices(updateData);

    if (result.success) {
      onClose();
    }
  };

  const calculateTotal = () => {
    const roomAmount = pricingPreview ? pricingPreview.newTotal : (booking?.priceDetails?.tongTienPhong || booking.totalAmount || 0);
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

          {/* ✅ Thay đổi loại đặt phòng */}
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
                  <option value="">
                    Giữ nguyên ({booking.bookingType === 'theo_gio' ? 'Theo giờ' :
                      booking.bookingType === 'qua_dem' ? 'Qua đêm' : 'Dài ngày'})
                  </option>
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
                  </div>

                  {/* ✅ Pricing Preview */}
                  {pricingPreview && !pricingPreview.error && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border">
                      <h5 className="font-medium text-blue-800 mb-2">
                        {pricingPreview.isGuestChange ?
                          '💰 Guest Change - Cộng thêm:' :
                          '🔄 Admin Update - Tính lại:'
                        }
                      </h5>

                      <div className="text-sm space-y-1">
                        {/* ✅ Hiển thị booking type change */}
                        {pricingPreview.displayInfo && (
                          <div className="flex justify-between text-purple-600 font-medium">
                            <span>Thay đổi:</span>
                            <span>
                              {pricingPreview.displayInfo.oldBookingTypeText} → {pricingPreview.displayInfo.newBookingTypeText}
                            </span>
                          </div>
                        )}

                        {pricingPreview.duration && (
                          <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span>{pricingPreview.duration} {pricingPreview.unit}</span>
                          </div>
                        )}

                        {pricingPreview.isGuestChange ? (
                          // ✅ GUEST CHANGE: Hiển thị logic cộng thêm
                          <>
                            <div className="bg-white p-2 rounded border-l-4 border-blue-400">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Đã thanh toán:</span>
                                <span className="font-medium">{formatCurrency(pricingPreview.oldTotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600 font-medium">Cộng thêm:</span>
                                <span className="text-blue-600 font-bold">
                                  +{formatCurrency(pricingPreview.additionalPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t pt-1 mt-1">
                                <span className="font-bold">Tổng mới:</span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(pricingPreview.newTotal)}
                                </span>
                              </div>
                            </div>

                            {/* ✅ Hiển thị calculation details nếu có */}
                            {pricingPreview.calculationDetails && (
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                <div className="font-medium text-gray-700 mb-1">Chi tiết tính toán:</div>
                                <div className="text-gray-600">{pricingPreview.calculationDetails.explanation}</div>
                                <div className="font-mono text-blue-600 mt-1">
                                  {pricingPreview.calculationDetails.formula}
                                </div>
                              </div>
                            )}

                            {pricingPreview.changeDescription && (
                              <div className="text-xs text-gray-600 mt-1">
                                📝 {pricingPreview.changeDescription}
                              </div>
                            )}
                          </>
                        ) : (
                          // ✅ ADMIN UPDATE: Hiển thị logic thay thế
                          <>
                            <div className="flex justify-between">
                              <span>Giá cũ:</span>
                              <span>{formatCurrency(pricingPreview.oldTotal)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Giá mới:</span>
                              <span>{formatCurrency(pricingPreview.newTotal)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Chênh lệch:</span>
                              <span className={pricingPreview.difference >= 0 ? 'text-red-600' : 'text-green-600'}>
                                {pricingPreview.difference >= 0 ? '+' : ''}{formatCurrency(pricingPreview.difference)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* ✅ Warning message cho guest change */}
                      {pricingPreview.isGuestChange && pricingPreview.additionalPrice > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-yellow-800 font-medium">
                            ⚠️ Guest Change: Khách sẽ cần thanh toán thêm {formatCurrency(pricingPreview.additionalPrice)}
                          </p>
                          <p className="text-yellow-700 text-xs mt-1">
                            💡 Đây là phụ thu cộng thêm, không thay thế giá cũ
                          </p>
                        </div>
                      )}

                      {/* ✅ Info message cho admin update */}
                      {!pricingPreview.isGuestChange && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <p className="text-blue-800">
                            ℹ️ Admin Update: Giá được tính lại hoàn toàn theo booking type mới
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {pricingPreview?.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-600 text-sm">⚠️ {pricingPreview.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Cập nhật thời gian thực tế */}
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
                        Phòng {room.roomInfo?.soPhong || 'N/A'} - Tầng {room.roomInfo?.tang || 1}
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
                      Kế hoạch: {booking.checkInTime}
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
                  <option value="da_nhan_phong">Đã nhận phòng</option>
                  <option value="dang_su_dung">Đang sử dụng</option>
                  <option value="da_tra_phong">Đã trả phòng</option>
                  <option value="khong_nhan_phong">Không nhận phòng</option>
                  <option value="da_huy" className="text-red-600">🚫 Hủy đơn</option>
                </select>
              </div>

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

          {/* Services section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Dịch vụ bổ sung</h3>

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
                  {formatCurrency(pricingPreview ? pricingPreview.newTotal : (booking?.priceDetails?.tongTienPhong || booking.totalAmount || 0))}
                </span>
              </div>
              {pricingPreview && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tiền phòng cũ:</span>
                  <span className="line-through">{formatCurrency(pricingPreview.oldTotal)}</span>
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
            disabled={isUpdating}
          >
            Hủy
          </button>
          <button
            onClick={saveChanges}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Đang cập nhật...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✅ NEW: Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                Xác nhận hủy đơn
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Đơn #{booking?.bookingId} - {booking?.customerName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Thông tin đơn */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Khách sạn:</strong> {booking?.hotelId?.tenKhachSan || 'N/A'}</p>
                  <p><strong>Loại phòng:</strong> {booking?.roomType}</p>
                  <p><strong>Ngày:</strong> {booking?.checkInDate} - {booking?.checkOutDate}</p>
                  <p><strong>Tổng tiền:</strong> <span className="text-red-600 font-semibold">{formatCurrency(booking?.totalAmount || 0)}</span></p>
                </div>
              </div>

              {/* Lý do hủy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy đơn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  placeholder="Nhập lý do hủy đơn..."
                />
              </div>

              {/* Cảnh báo */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">Lưu ý:</p>
                    <p className="text-red-700">Đơn đã hủy không thể khôi phục và khách hàng sẽ được thông báo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeCancelModal}
                disabled={isSubmittingCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isSubmittingCancel || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmittingCancel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Xác nhận hủy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBooking;