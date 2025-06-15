import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';

const EditBooking = ({ onClose, booking, setBookings, setLocalBookings }) => {
  // Quản lý state trong EditBooking
  const [editServices, setEditServices] = useState(booking?.additionalServices || []);
  const [newService, setNewService] = useState({ name: '', price: '', quantity: 1 });
  const [paymentMethod, setPaymentMethod] = useState(booking?.paymentMethod || '');

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

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
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'card', label: 'Thẻ tín dụng' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
    { value: 'momo', label: 'MoMo' },
    { value: 'vnpay', label: 'VNPay' },
  ];

  // Hàm định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  // Hàm cập nhật dịch vụ và thanh toán
  const updateBookingServices = async (bookingId, services, paymentMethod) => {
    try {
      const response = await axios.put(
        `${baseUrl}/bookings/hotelowner/update-services/${bookingId}`,
        {
          additionalServices: services,
          paymentMethod: paymentMethod,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data?.message?.msgError === false) {
        const updatedBooking = response.data.booking;
        setLocalBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, ...updatedBooking } : b
          )
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, ...updatedBooking } : b
          )
        );
        toast.success('Cập nhật dịch vụ thành công!');
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || 'Cập nhật thất bại!');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật dịch vụ:', error.message);
      toast.error('Lỗi khi cập nhật dịch vụ!');
      return { success: false };
    }
  };

  // Hàm lưu thay đổi
  const saveChanges = async () => {
    if (!booking) {
      toast.error('Không có thông tin đơn đặt phòng!');
      return;
    }

    if (!paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    const result = await updateBookingServices(
      booking.bookingId,
      editServices,
      paymentMethod
    );

    if (result.success) {
      onClose();
    }
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
                <span className="text-gray-600">Check-in:</span>
                <span className="ml-2 font-medium">{booking.checkInDate}</span>
              </div>
              <div>
                <span className="text-gray-600">Check-out:</span>
                <span className="ml-2 font-medium">{booking.checkOutDate}</span>
              </div>
            </div>
          </div>

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
                <span>Tiền phòng:</span>
                <span>{formatCurrency(booking.roomAmount || booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dịch vụ bổ sung:</span>
                <span>{formatCurrency(calculateServicesTotal(editServices))}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">
                  {formatCurrency(
                    (booking.roomAmount || booking.totalAmount) +
                      calculateServicesTotal(editServices)
                  )}
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