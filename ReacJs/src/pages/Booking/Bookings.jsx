import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Bed,
  DollarSign,
  Settings,
  Bell,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  X,
  Edit,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import Cookies from 'js-cookie';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from "moment";
import AddBooking from './addBooking';
import EditBooking from './editBooking';

const Booking = ({ bookings, setBookings, expandedBooking, setExpandedBooking, formatCurrency, formatDate, getStatusColor, getStatusText }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    timeRange: '',
    hotelId: '',
  });
  const [localBookings, setLocalBookings] = useState(bookings);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // States cho chỉnh sửa booking
  const [editingBooking, setEditingBooking] = useState(null);
  const [editServices, setEditServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', price: '', quantity: 1 });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const hotelList = Array.from(
    new Map(bookings.map(b => [b.hotelId._id, b.hotelId.hotelName])).entries()
  ).map(([id, name]) => ({ id, name }));

  // Danh sách dịch vụ có sẵn
  const availableServices = [
    { name: 'Nước suối', price: 15000 },
    { name: 'Coca Cola', price: 20000 },
    { name: 'Bánh kẹo', price: 25000 },
    { name: 'Dịch vụ giặt ủi', price: 50000 },
    { name: 'Massage', price: 300000 },
    { name: 'Ăn sáng', price: 100000 },
    { name: 'Thuê xe', price: 500000 },
    { name: 'Tour du lịch', price: 800000 }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'card', label: 'Thẻ tín dụng' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
    { value: 'momo', label: 'MoMo' },
    { value: 'vnpay', label: 'VNPay' }
  ];

  //Hàm cập nhật trạng thái đơn đặt phòng/hotel owner
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await axios.put(
        `${baseUrl}/bookings/hotelowner/update/${bookingId}`,
        { status: newStatus },
        {
          withCredentials: true,
        }
      );

      if (response.data?.message?.msgError === false) {
        setLocalBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: newStatus } : b
          )
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: newStatus } : b
          )
        );
        toast.success("Cập nhật trạng thái thành công!");
        return {
          success: true,
          message: "Đã cập nhật trạng thái thành công!",
        };
      } else {
        toast.error(response.data?.message?.msgBody || "Cập nhật thất bại!");
        return {
          success: false,
          message: response.data?.message?.msgBody || "Cập nhật thất bại!",
        };
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error.message);
      toast.error("Lỗi khi gửi yêu cầu cập nhật trạng thái!");
      return {
        success: false,
        message: "Lỗi khi gửi yêu cầu cập nhật trạng thái!",
      };
    }
  };

  // Hàm cập nhật dịch vụ và thanh toán
  const updateBookingServices = async (bookingId, services, paymentMethod) => {
    try {
      const response = await axios.put(
        `${baseUrl}/bookings/hotelowner/update-services/${bookingId}`,
        {
          additionalServices: services,
          paymentMethod: paymentMethod
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
        toast.success("Cập nhật dịch vụ thành công!");
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || "Cập nhật thất bại!");
        return { success: false };
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật dịch vụ:", error.message);
      toast.error("Lỗi khi cập nhật dịch vụ!");
      return { success: false };
    }
  };

  // Hàm mở modal chỉnh sửa
  const openEditModal = (booking) => {
  setEditingBooking(booking);
  setShowEditModal(true);
};



  // Tính tổng tiền dịch vụ
  const calculateServicesTotal = (services) => {
    return services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

  // Hàm fetch danh sách đặt phòng
  const fetchBookingByHotelOwner = async (filterParams = {}) => {
    setLoading(true);
    try {
      if (!token) {
        toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      // Xây dựng query params từ filterParams
      const queryParams = new URLSearchParams();
      if (filterParams.status) {
        queryParams.append('status', filterParams.status);
      }
      if (filterParams.timeRange) {
        queryParams.append('filter', filterParams.timeRange);
      }
      if (filterParams.dateFrom) {
        queryParams.append('fromDate', filterParams.dateFrom);
      }
      if (filterParams.dateTo) {
        queryParams.append('toDate', filterParams.dateTo);
      }
      if (filterParams.hotelId) {
        queryParams.append('hotelId', filterParams.hotelId);
      }

      // URL API
      const url = queryParams.toString()
        ? `${baseUrl}/bookings/hotelowner/bookings?${queryParams}`
        : `${baseUrl}/bookings/hotelowner/bookings`;

      const response = await axios.get(url);

      if (response.status == 404) {
        toast.error('Chưa có khách sạn nào');
        window.location.href = '/';
      }
      // Cập nhật danh sách bookings
      setBookings(response.data);
      setLocalBookings(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đặt phòng:', error.response?.data || error.message);
      toast.error('Không thể lấy danh sách đặt phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ localBookings khi bookings thay đổi
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  // Gọi API khi filters thay đổi
  useEffect(() => {
    fetchBookingByHotelOwner(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    if (key == "hotelId") {
      localStorage.setItem("selectedHotelId", value);
    }
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      timeRange: '',
      hotelId: '',
    });
  };

  //Tính toán thời gian lưu trú (nights)
  const calculateNights = (checkInDate, checkOutDate) => {
    const checkIn = moment(checkInDate, "DD-MM-YYYY");
    const checkOut = moment(checkOutDate, "DD-MM-YYYY");
    if (!checkIn.isValid() || !checkOut.isValid()) return 0;
    return checkOut.diff(checkIn, "days");
  };

  const applyFilters = () => {
    console.log('Applying filters:', filters);
    setShowFilter(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Đơn Đặt Phòng</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => setShowAddModal(true)}
          >
            Đơn mới
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="h-4 w-4" />
            <span>Lọc</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white rounded-lg shadow-lg border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Bộ lọc đơn đặt phòng</h3>
            <button
              onClick={() => setShowFilter(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Hotel Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khách sạn
            </label>
            <select
              value={filters.hotelId}
              onChange={(e) => handleFilterChange('hotelId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả khách sạn</option>
              {hotelList.map((hotel, index) => (
                <option key={index} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái đơn
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Đang xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theo thời gian
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả thời gian</option>
                <option value="past">Từ trước đến giờ</option>
                <option value="current">Hiện tại</option>
                <option value="upcoming">Sắp tới</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.status || filters.dateFrom || filters.dateTo || filters.timeRange) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-700 font-medium">Bộ lọc đang áp dụng:</span>
              {filters.status && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Trạng thái: {filters.status === 'processing' ? 'Đang xử lý' :
                    filters.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                </span>
              )}
              {filters.dateFrom && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Từ: {new Date(filters.dateFrom).toLocaleDateString('vi-VN')}
                </span>
              )}
              {filters.dateTo && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Đến: {new Date(filters.dateTo).toLocaleDateString('vi-VN')}
                </span>
              )}
              {filters.timeRange && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {filters.timeRange === 'past' ? 'Từ trước đến giờ' :
                    filters.timeRange === 'current' ? 'Hiện tại' : 'Sắp tới'}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )}

      {/* Danh sách đặt phòng */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      ) : localBookings.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          {localBookings.map((booking) => (
            <div key={booking.bookingId} className="border-b border-gray-200 last:border-b-0">
              <div
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedBooking(expandedBooking === booking.bookingId ? null : booking.bookingId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {expandedBooking === booking.bookingId ?
                        <ChevronDown className="h-5 w-5 text-gray-400" /> :
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{booking.customerName}</h3>
                      <p className="text-sm text-gray-600">Mã: {booking.bookingId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.roomType}</p>
                      <p className="text-sm text-gray-600">{booking.hotelId.hotelName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.checkInDate} - {booking.checkOutDate}</p>
                      <p className="text-sm text-gray-600">
                        {calculateNights(booking.checkInDate, booking.checkOutDate)} ngày • {booking.guests || 2} khách</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(booking.totalAmount || 0)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {expandedBooking === booking.bookingId && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Thông tin khách hàng
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{booking.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{booking.phoneNumber}</span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                        <Bed className="h-4 w-4 mr-2" />
                        Yêu cầu đặc biệt
                      </h4>
                      <p className="text-sm text-gray-600">{booking.specialRequests || "Không có yêu cầu đặc biệt"}</p>

                      {/* Dịch vụ bổ sung */}
                      {booking.additionalServices && booking.additionalServices.length > 0 && (
                        <>
                          <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Dịch vụ bổ sung
                          </h4>
                          <div className="space-y-2">
                            {booking.additionalServices.map((service, index) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                <span>{service.name} x{service.quantity}</span>
                                <span className="font-medium">{formatCurrency(service.price * service.quantity)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-sm font-semibold border-t pt-2">
                              <span>Tổng dịch vụ:</span>
                              <span>{formatCurrency(calculateServicesTotal(booking.additionalServices))}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Thông tin thanh toán
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Phương thức:</span>
                          <span className="font-medium">
                            {booking.paymentMethod ?
                              paymentMethods.find(pm => pm.value === booking.paymentMethod)?.label || booking.paymentMethod
                              : "Chưa chọn"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trạng thái:</span>
                          <span
                            className={`font-medium ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                              }`}
                          >
                            {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tiền phòng:</span>
                          <span>{formatCurrency(booking.roomAmount || booking.totalAmount)}</span>
                        </div>
                        {booking.additionalServices && booking.additionalServices.length > 0 && (
                          <div className="flex justify-between">
                            <span>Dịch vụ:</span>
                            <span>{formatCurrency(calculateServicesTotal(booking.additionalServices))}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Tổng cộng:</span>
                          <span>{formatCurrency((booking.roomAmount || booking.totalAmount) + calculateServicesTotal(booking.additionalServices || []))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thời gian đặt:</span>
                          <span>{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={() => updateBookingStatus(booking.bookingId, 'confirmed')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.bookingId, 'cancelled')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Hủy đơn
                        </button>
                        <button
                          onClick={() => openEditModal(booking)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Chỉnh sửa
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 flex items-center justify-center">
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Đơn đặt phòng</h3>
          <p className="text-gray-500 mt-2">Chưa có đơn đặt nào</p>
        </div>
      )}

      {/* Modal thêm booking mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowAddModal(false)}
            >
              ✕
            </button>
            <AddBooking onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {/* Modal thêm booking mới */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl relative">
            
            <EditBooking
              onClose={() => setShowEditModal(false)}
              booking={editingBooking}
              setBookings={setBookings}
              setLocalBookings={setLocalBookings}
            />
          </div>
        </div>
      )}


    </div>)
}

export default Booking;