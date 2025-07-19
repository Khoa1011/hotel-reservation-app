import React, { useState, useEffect, useRef } from 'react';
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
  Save,
  Home,
  FileText
} from 'lucide-react';
import Cookies from 'js-cookie';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from "moment";
import AddBooking from './addBooking';
import EditBooking from './editBooking';
import { useNotifications } from '../../contexts/NotificationContext';
import { RefreshCw } from 'lucide-react';

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

  //State tự động cập nhật khi có booking mới
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const previousBookingCountRef = useRef(bookings.length);
  const autoUpdateIntervalRef = useRef(null);


  // States cho chỉnh sửa booking
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  //States cho lý do hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // State cho room assignment
  const [showRoomAssignModal, setShowRoomAssignModal] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [roomAssignData, setRoomAssignData] = useState({
    roomNumber: '',
    floor: 1,
    viewType: '',
    notes: ''
  });

  //State cho thông báo nếu có đơn mới 
  const { notifications, fetchAllNotifications, markHotelAsRead } = useNotifications();

  // State cho detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);
  //State chọn tầng
  const [enableFloorSelection, setEnableFloorSelection] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  //Tạo danh sách hotel từ bookings
  // const hotelList = Array.from(
  //   new Map(bookings.map(b => [b.hotelId?._id, b.hotelId?.tenKhachSan])).entries()
  // ).map(([id, name]) => ({ id, name })).filter(hotel => hotel.id && hotel.name);

  const getAllHotels = () => {
    // Lấy tất cả hotels từ bookings gốc (không phải localBookings)
    const allHotels = Array.from(
      new Map(bookings.map(b => [b.hotelId?._id, b.hotelId?.tenKhachSan])).entries()
    ).map(([id, name]) => ({
      id,
      name,
      notifications: notifications.hotelNotifications[id] || { newBookings: 0, pendingBookings: 0, totalUnread: 0 }
    })).filter(hotel => hotel.id && hotel.name);

    return allHotels;
  };

  const hotelList = getAllHotels();




  // Map trạng thái từ backend sang frontend
  const statusMapping = {
    'dang_cho': 'pending',
    'da_xac_nhan': 'confirmed',
    'da_huy': 'cancelled',
    'da_nhan_phong': 'checked_in',
    'dang_su_dung': 'in_use',
    'da_tra_phong': 'checked_out',
    'khong_nhan_phong': 'no_show'
  };

  const reverseStatusMapping = {
    'pending': 'dang_cho',
    'confirmed': 'da_xac_nhan',
    'cancelled': 'da_huy',
    'checked_in': 'da_nhan_phong',
    'in_use': 'dang_su_dung',
    'checked_out': 'da_tra_phong',
    'no_show': 'khong_nhan_phong'
  };

  

  // ✅ THÊM: Hàm kiểm tra đơn mới (hoàn toàn tự động)
  const checkForNewBookings = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${baseUrl}/api/booking-hotel/hotelowner/bookings`,
        { withCredentials: true }
      );

      if (response.data && Array.isArray(response.data)) {
        const newBookings = response.data;
        const previousCount = previousBookingCountRef.current;
        const currentCount = newBookings.length;

        // Phát hiện đơn mới
        if (currentCount > previousCount) {
          const existingBookingIds = bookings.map(b => b.bookingId);
          const actualNewBookings = newBookings.filter(
            booking => !existingBookingIds.includes(booking.bookingId)
          );

          if (actualNewBookings.length > 0) {
            console.log('🆕 Phát hiện đơn mới:', actualNewBookings.length);

            // Cập nhật state
            setBookings(newBookings);

            // Hiển thị toast cho từng đơn mới
            actualNewBookings.forEach(booking => {
              const hotelName = booking.hotelId?.tenKhachSan || 'Khách sạn';
              toast.success(
                `🎉 Đơn mới #${booking.bookingId} - ${hotelName}`,
              );
            });

            previousBookingCountRef.current = currentCount;
            setLastUpdateTime(Date.now());

            // Cập nhật thông báo tổng
            toast.info(
              `📊 Tổng cộng ${currentCount} đơn đặt phòng`,
              {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: true,
                style: {
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px'
                }
              }
            );
          }
        } else if (currentCount !== previousCount) {
          // Cập nhật nếu có thay đổi (hủy, xóa, etc.)
          console.log('🔄 Cập nhật danh sách đơn');
          setBookings(newBookings);
          previousBookingCountRef.current = currentCount;
          setLastUpdateTime(Date.now());
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra đơn mới:', error);
    }
  };

  // ✅ THÊM: Cập nhật thủ công (chỉ có nút refresh)
  const manualRefresh = async () => {
    toast.info('Đang kiểm tra đơn mới...');

    await checkForNewBookings();

    toast.success('Đã cập nhật danh sách đơn');
  };

  useEffect(() => {
    previousBookingCountRef.current = bookings.length;

    // Bắt đầu auto update ngay lập tức
    if (token) {
      console.log('🚀 Bắt đầu tự động theo dõi đơn mới');

      // Kiểm tra ngay lần đầu sau 3 giây
      const initialTimer = setTimeout(() => {
        checkForNewBookings();
      }, 3000);

      // Sau đó kiểm tra mỗi 15 giây
      const interval = setInterval(checkForNewBookings, 15000);
      autoUpdateIntervalRef.current = interval;

      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [token]);

  // ✅ THÊM: Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
    };
  }, []);

  // ✅ THÊM: Cập nhật ref khi bookings thay đổi
  useEffect(() => {
    previousBookingCountRef.current = bookings.length;
  }, [bookings]);



  //Modal đóng/mở hủy đơn
  const openCancelModal = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellingBooking(null);
    setCancelReason('');
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn!');
      return;
    }

    setIsSubmittingCancel(true);

    try {
      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update/${cancellingBooking.bookingId}`,
        {
          
          status: 'da_huy',
          cancelReason: cancelReason.trim()
        },
        
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        // Cập nhật local state
        setLocalBookings(prev =>
          prev.map(b =>
            b.bookingId === cancellingBooking.bookingId
              ? { ...b, status: 'da_huy', cancelReason: cancelReason.trim() }
              : b
          )
        );

        setBookings(prev =>
          prev.map(b =>
            b.bookingId === cancellingBooking.bookingId
              ? { ...b, status: 'da_huy', cancelReason: cancelReason.trim() }
              : b
          )
        );

        toast.success(`✅ Đã hủy đơn #${cancellingBooking.bookingId}`);
        closeCancelModal();
      } else {
        toast.error(response.data?.message?.msgBody || 'Hủy đơn thất bại!');
      }
    } catch (error) {
      console.error('Lỗi khi hủy đơn:', error);
      toast.error('Lỗi khi hủy đơn. Vui lòng thử lại!');
    } finally {
      setIsSubmittingCancel(false);
    }
  };


  //Hàm cập nhật trạng thái đơn đặt phòng/hotel owner
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {

      if (newStatus === 'cancelled') {
        const booking = localBookings.find(b => b.bookingId === bookingId);
        if (booking) {
          openCancelModal(booking);
        }
        return { success: true, message: 'Mở modal hủy đơn' };
      }



      const backendStatus = reverseStatusMapping[newStatus] || newStatus;

      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update/${bookingId}`,
        { status: backendStatus },
        {
          withCredentials: true,
        }
      );

      if (response.data?.message?.msgError === false) {
        setLocalBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: backendStatus } : b
          )
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: backendStatus } : b
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

  // Hàm gán phòng
  const assignRoom = async (bookingId, roomData) => {
    try {
      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/assign-room/${bookingId}`,
        roomData,
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        // Update local bookings với assigned room mới
        setLocalBookings((prev) =>
          prev.map((b) => {
            if (b.bookingId === bookingId) {
              return {
                ...b,
                assignedRooms: [...(b.assignedRooms || []), response.data.assignedRoom],
                status: 'da_nhan_phong' // Update status nếu cần
              };
            }
            return b;
          })
        );

        setBookings((prev) =>
          prev.map((b) => {
            if (b.bookingId === bookingId) {
              return {
                ...b,
                assignedRooms: [...(b.assignedRooms || []), response.data.assignedRoom],
                status: 'da_nhan_phong'
              };
            }
            return b;
          })
        );

        toast.success("Gán phòng thành công!");
        setShowRoomAssignModal(false);
        setRoomAssignData({ roomNumber: '', floor: 1, viewType: '', notes: '' });
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || "Gán phòng thất bại!");
        return { success: false };
      }
    } catch (error) {
      console.error("Lỗi khi gán phòng:", error);
      toast.error("Lỗi khi gán phòng!");
      return { success: false };
    }
  };

  // Hàm mở modal gán phòng
  const openRoomAssignModal = (booking) => {
    setAssigningBooking(booking);
    setShowRoomAssignModal(true);
  };

  // Hàm mở modal chỉnh sửa
  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  // ✅ Hàm mở detail modal
  const openDetailModal = (booking) => {
    setViewingBooking(booking);
    setShowDetailModal(true);
  };

  // Hàm fetch danh sách đặt phòng
  // const fetchBookingByHotelOwner = async (filterParams = {}) => {
  //   setLoading(true);
  //   try {
  //     if (!token) {
  //       toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
  //       return;
  //     }

  //     // Xây dựng query params từ filterParams
  //     const queryParams = new URLSearchParams();
  //     if (filterParams.status) {
  //       queryParams.append('status', filterParams.status);
  //     }
  //     if (filterParams.timeRange) {
  //       queryParams.append('filter', filterParams.timeRange);
  //     }
  //     if (filterParams.dateFrom) {
  //       queryParams.append('fromDate', filterParams.dateFrom);
  //     }
  //     if (filterParams.dateTo) {
  //       queryParams.append('toDate', filterParams.dateTo);
  //     }
  //     if (filterParams.hotelId) {
  //       queryParams.append('hotelId', filterParams.hotelId);
  //     }

  //     // ✅ Fixed: URL API với đúng path
  //     const url = queryParams.toString()
  //       ? `${baseUrl}/api/booking-hotel/hotelowner/bookings?${queryParams}`
  //       : `${baseUrl}/api/booking-hotel/hotelowner/bookings`;

  //     const response = await axios.get(url);

  //     if (response.status == 404) {
  //       toast.error('Chưa có khách sạn nào');
  //       window.location.href = '/';
  //       return;
  //     }

  //     // Cập nhật danh sách bookings
  //     setBookings(response.data);
  //     setLocalBookings(response.data);
  //   } catch (error) {
  //     console.error('Lỗi khi lấy danh sách đặt phòng:', error.response?.data || error.message);
  //     console.error('Kiểm tra token trong booking:', token);
  //     toast.error('Không thể lấy danh sách đặt phòng. Vui lòng thử lại.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    previousBookingCountRef.current = bookings.length;

    // Bắt đầu auto update ngay lập tức
    if (token) {
      console.log('🚀 Bắt đầu tự động theo dõi đơn mới');

      // Kiểm tra ngay lần đầu sau 3 giây
      const initialTimer = setTimeout(() => {
        checkForNewBookings();
      }, 3000);

      // Sau đó kiểm tra mỗi 15 giây
      const interval = setInterval(checkForNewBookings, 15000);
      autoUpdateIntervalRef.current = interval;

      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [token]);

  // ✅ THÊM: Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
    };
  }, []);

  // ✅ THÊM: Cập nhật ref khi bookings thay đổi
  useEffect(() => {
    previousBookingCountRef.current = bookings.length;
  }, [bookings]);


  const fetchBookingByHotelOwner = async (filterParams = {}) => {
    setLoading(true);
    try {
      if (!token) {
        toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        return;
      }

      // Nếu không có filter nào, hiển thị tất cả bookings
      if (!filterParams.hotelId && !filterParams.status && !filterParams.timeRange && !filterParams.dateFrom && !filterParams.dateTo) {
        setLocalBookings(bookings);
        return;
      }

      // Filter bookings dựa trên filterParams
      let filteredBookings = [...bookings];

      // Filter theo hotel
      if (filterParams.hotelId) {
        filteredBookings = filteredBookings.filter(booking =>
          booking.hotelId?._id === filterParams.hotelId
        );
      }

      // Filter theo trạng thái
      if (filterParams.status) {
        filteredBookings = filteredBookings.filter(booking =>
          booking.status === filterParams.status
        );
      }

      // Filter theo ngày
      if (filterParams.dateFrom || filterParams.dateTo) {
        filteredBookings = filteredBookings.filter(booking => {
          const checkInDate = moment(booking.checkInDate, "DD-MM-YYYY");
          const fromDate = filterParams.dateFrom ? moment(filterParams.dateFrom) : null;
          const toDate = filterParams.dateTo ? moment(filterParams.dateTo) : null;

          if (fromDate && checkInDate.isBefore(fromDate, 'day')) return false;
          if (toDate && checkInDate.isAfter(toDate, 'day')) return false;
          return true;
        });
      }

      // Filter theo time range
      if (filterParams.timeRange) {
        const now = moment();
        filteredBookings = filteredBookings.filter(booking => {
          const checkInDate = moment(booking.checkInDate, "DD-MM-YYYY");
          const checkOutDate = moment(booking.checkOutDate, "DD-MM-YYYY");

          switch (filterParams.timeRange) {
            case 'past':
              return checkOutDate.isBefore(now, 'day');
            case 'current':
              return checkInDate.isSameOrBefore(now, 'day') && checkOutDate.isSameOrAfter(now, 'day');
            case 'upcoming':
              return checkInDate.isAfter(now, 'day');
            default:
              return true;
          }
        });
      }

      setLocalBookings(filteredBookings);
    } catch (error) {
      console.error('Lỗi khi lọc danh sách đặt phòng:', error);
      toast.error('Không thể lọc danh sách đặt phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };



  //Lấy thông báo khi có đơn mới
  useEffect(() => {
    if (hotelList.length > 0) {
      fetchAllNotifications(hotelList);
    }
  }, [bookings]);

  // Đồng bộ localBookings khi bookings thay đổi
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  // Gọi API khi có booking hoặc filter thay đổi
  useEffect(() => {
    const hasActiveFilter = filters.hotelId || filters.status || filters.timeRange || filters.dateFrom || filters.dateTo;

    if (!hasActiveFilter) {
      setLocalBookings(bookings);
    } else {
      // Nếu có filter đang active, apply lại filter
      fetchBookingByHotelOwner(filters);
    }
  }, [bookings]);

  //Lấy thông báo khi có đơn mới
  useEffect(() => {
    if (hotelList.length > 0) {
      fetchAllNotifications(hotelList);
    }
  }, [bookings]); // Chỉ chạy khi bookings thay đổi


  // Handle hotel selection
  const handleFilterChange = (key, value) => {
    if (key === "hotelId") {
      localStorage.setItem("selectedHotelId", value);
      // Đánh dấu hotel đã đọc khi chọn
      if (value) {
        markHotelAsRead(value);
      }
    }
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value
      };

      // Gọi filter ngay lập tức
      fetchBookingByHotelOwner(newFilters);

      return newFilters;
    });
  };

  // const handleFilterChange = (key, value) => {
  //   if (key == "hotelId") {
  //     localStorage.setItem("selectedHotelId", value);
  //   }
  //   setFilters(prev => ({
  //     ...prev,
  //     [key]: value
  //   }));
  // };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      timeRange: '',
      hotelId: '',
    });

    setFilters(clearedFilters);
    localStorage.removeItem("selectedHotelId");

    // Hiển thị lại tất cả bookings
    setLocalBookings(bookings);
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
    fetchBookingByHotelOwner(filters);
    setShowFilter(false);
  };

  // Helper function để get status text tiếng Việt
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

  // Helper function để get status color
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Đơn Đặt Phòng</h2>
        {/* Nút refresh thủ công */}
        <div className="flex items-center space-x-2">
          {/* Manual refresh */}
          <button
            onClick={manualRefresh}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm"
            title="Làm mới ngay"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Làm mới</span>
          </button>

          {/* Existing buttons */}
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

      {/*Status bar (chỉ hiển thị trạng thái) */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Đang tự động theo dõi đơn mới
              </span>
            </div>

            <div className="text-sm text-gray-600">
              Tổng: <span className="font-semibold text-blue-600">{localBookings.length}</span> đơn
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Cập nhật: {new Date(lastUpdateTime).toLocaleTimeString('vi-VN')}
          </div>
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

          {/* Hotel Filter with Notifications */}
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
                  {hotel.notifications.totalUnread > 0 && `(${hotel.notifications.pendingBookings} đơn đang chờ)`}
                </option>
              ))}
            </select>
            {/* Hiển thị thông báo chi tiết cho khách sạn đã chọn */}

            {filters.hotelId && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  {(() => {
                    const selectedHotel = hotelList.find(h => h.id === filters.hotelId);
                    const notif = selectedHotel?.notifications;
                    if (!notif || notif.totalUnread === 0) {
                      return <span className="text-gray-600">Không có thông báo mới</span>;
                    }
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-blue-800">
                          {selectedHotel.name} - {notif.totalUnread} thông báo mới
                        </p>
                        {notif.newBookings > 0 && (
                          <p className="text-blue-600">• {notif.newBookings} đơn mới</p>
                        )}
                        {notif.pendingBookings > 0 && (
                          <p className="text-blue-600">• {notif.pendingBookings} đơn chờ xử lý</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
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
                <option value="dang_cho">Đang chờ</option>
                <option value="da_xac_nhan">Đã xác nhận</option>
                <option value="da_huy">Đã hủy</option>
                <option value="da_nhan_phong">Đã nhận phòng</option>
                <option value="dang_su_dung">Đang sử dụng</option>
                <option value="da_tra_phong">Đã trả phòng</option>
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
                  Trạng thái: {getVietnameseStatusText(filters.status)}
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
                      <p className="text-sm text-gray-600 flex items-center">
                        <Home className="h-3 w-3 mr-1" />
                        {booking.hotelId?.tenKhachSan || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.checkInDate} - {booking.checkOutDate}</p>
                      <p className="text-sm text-gray-600">
                        {
                          booking?.bookingType === 'theo_gio' ?
                            (() => {
                              const checkIn = moment(`${booking.checkInDate} ${booking.checkInTime}`, "DD-MM-YYYY HH:mm");
                              const checkOut = moment(`${booking.checkOutDate} ${booking.checkOutTime}`, "DD-MM-YYYY HH:mm");
                              const hours = checkOut.diff(checkIn, 'hours');
                              return `${hours} giờ (Theo giờ)`;
                            })() :
                            booking?.bookingType === 'qua_dem' ?
                              (() => {
                                const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
                                return `${nights} đêm (Qua đêm)`;
                              })() :
                              booking?.bookingType === 'dai_ngay' ?
                                `${calculateNights(booking.checkInDate, booking.checkOutDate)} ngày (Dài ngày)`
                                : `${calculateNights(booking.checkInDate, booking.checkOutDate)} ngày`
                        } • {booking.roomQuantity || 1} phòng
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(booking.totalAmount || 0)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVietnameseStatusColor(booking.status)}`}>
                        {getVietnameseStatusText(booking.status)}
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
                        {booking.cccd && (
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                            <span>CCCD: {booking.cccd}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                        <Bed className="h-4 w-4 mr-2" />
                        Thông tin phòng
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>Loại: {booking.roomType}</p>
                        <p>Giá: {formatCurrency(booking.roomPrice || 0)}/ngày</p>
                        <p>Số lượng: {booking.roomQuantity || 1} phòng</p>
                        <p>Giờ nhận: {booking.checkInTime || "14:00"}</p>
                        <p>Giờ trả: {booking.checkOutTime || "12:00"}</p>
                      </div>

                      {/* Phòng đã được gán */}
                      {booking.assignedRooms && booking.assignedRooms.length > 0 && (
                        <>
                          <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                            <Home className="h-4 w-4 mr-2" />
                            Phòng đã nhận
                          </h4>
                          <div className="space-y-2">
                            {booking.assignedRooms.map((room, index) => (
                              <div key={index} className="bg-white p-2 rounded border">
                                <p className="font-medium">Phòng {room.soPhong}</p>
                                <p className="text-xs text-gray-600">
                                  Tầng {room.tang} • {room.loaiView || "N/A"} • {room.trangThaiPhong}
                                </p>
                                {room.ghiChuPhong && (
                                  <p className="text-xs text-gray-500">{room.ghiChuPhong}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {booking.notes && (
                        <>
                          <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                            <FileText className="h-4 w-4 mr-2" />
                            Ghi chú
                          </h4>
                          <p className="text-sm text-gray-600">{booking.notes}</p>
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
                            {booking.paymentMethod === 'tien_mat' ? 'Tiền mặt' :
                              booking.paymentMethod === 'VNPay' ? 'VNPay' :
                                booking.paymentMethod === 'Momo' ? 'Momo' :
                                  booking.paymentMethod === 'ZaloPay' ? 'ZaloPay' :
                                    booking.paymentMethod === 'the_tin_dung' ? 'Thẻ tín dụng' :
                                      booking.paymentMethod || "Chưa chọn"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trạng thái:</span>
                          <span className={`font-medium ${booking.paymentStatus === 'da_thanh_toan' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {booking.paymentStatus === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Tổng cộng:</span>
                          <span>{formatCurrency(booking.totalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thời gian đặt:</span>
                          <span>{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {booking.status === 'dang_cho' && (
                          <>
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
                          </>
                        )}



                        {booking.status === 'da_xac_nhan' && (
                          <>
                            <button
                              onClick={() => openRoomAssignModal(booking)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
                            >
                              <Home className="h-4 w-4 mr-1" />
                              Gán phòng
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.bookingId, 'cancelled')}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Hủy đơn
                            </button>
                          </>
                        )}

                        {booking.status === 'da_nhan_phong' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.bookingId, 'in_use')}
                              className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Đang sử dụng
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.bookingId, 'checked_out')}
                              className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Trả phòng
                            </button>
                          </>
                        )}

                        {booking.status === 'dang_su_dung' && (
                          <button
                            onClick={() => updateBookingStatus(booking.bookingId, 'checked_out')}
                            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 col-span-2"
                          >
                            Trả phòng
                          </button>
                        )}

                        {/* Buttons luôn hiển thị */}
                        <button
                          onClick={() => openEditModal(booking)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => openDetailModal(booking)}
                          className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 flex items-center justify-center"
                        >
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

      {/* ✅ Fixed: Modal thêm booking mới - Size cố định */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">

            <AddBooking onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa booking */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <EditBooking
              onClose={() => setShowEditModal(false)}
              booking={editingBooking}
              setBookings={setBookings}
              setLocalBookings={setLocalBookings}
            />
          </div>
        </div>
      )}

      {/* Modal gán phòng */}
      {showRoomAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Gán phòng cho đơn #{assigningBooking?.bookingId}
              </h2>
              <button
                onClick={() => setShowRoomAssignModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Khách:</strong> {assigningBooking?.customerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Loại phòng:</strong> {assigningBooking?.roomType}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Số lượng:</strong> {assigningBooking?.roomQuantity || 1} phòng
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số phòng *
                  </label>
                  <input
                    type="text"
                    value={roomAssignData.roomNumber}
                    onChange={(e) => setRoomAssignData({ ...roomAssignData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: 101, 102..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tầng
                  </label>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        id="enable-floor"
                        type="checkbox"
                        checked={enableFloorSelection}
                        onChange={(e) => setEnableFloorSelection(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="enable-floor" className="text-sm text-gray-700">
                        Chọn tầng cụ thể
                      </label>
                    </div>

                    {enableFloorSelection && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tầng
                        </label>
                        <input
                          type="number"
                          value={roomAssignData.floor}
                          onChange={(e) =>
                            setRoomAssignData({
                              ...roomAssignData,
                              floor: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại view
                  </label>
                  <select
                    value={roomAssignData.viewType}
                    onChange={(e) => setRoomAssignData({ ...roomAssignData, viewType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn loại view</option>
                    <option value="sea_view">View biển</option>
                    <option value="city_view">View thành phố</option>
                    <option value="garden_view">View vườn</option>
                    <option value="mountain_view">View núi</option>
                    <option value="pool_view">View hồ bơi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={roomAssignData.notes}
                    onChange={(e) => setRoomAssignData({ ...roomAssignData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Ghi chú thêm về phòng..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowRoomAssignModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!roomAssignData.roomNumber) {
                    toast.error('Vui lòng nhập số phòng!');
                    return;
                  }
                  assignRoom(assigningBooking.bookingId, roomAssignData);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gán phòng
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ✅ Modal Detail View */}
      {showDetailModal && viewingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-800">
                Chi tiết đơn đặt phòng #{viewingBooking.bookingId}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Thông tin booking */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Thông tin đặt phòng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã đơn:</span>
                        <span className="font-medium">{viewingBooking.bookingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loại phòng:</span>
                        <span className="font-medium">{viewingBooking.roomType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Khách sạn:</span>
                        <span className="font-medium">{viewingBooking.hotelId?.tenKhachSan || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số phòng:</span>
                        <span className="font-medium">{viewingBooking.roomQuantity || 1} phòng</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian nhận:</span>
                        <span className="font-medium">{viewingBooking.checkInDate} {viewingBooking.checkInTime || "14:00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian trả:</span>
                        <span className="font-medium">{viewingBooking.checkOutDate} {viewingBooking.checkOutTime || "12:00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian lưu trú:</span>
                        <span className="font-medium">
                          {
                            viewingBooking?.bookingType === 'theo_gio' ?
                              (() => {
                                const checkIn = moment(`${viewingBooking.checkInDate} ${viewingBooking.checkInTime}`, "DD-MM-YYYY HH:mm");
                                const checkOut = moment(`${viewingBooking.checkOutDate} ${viewingBooking.checkOutTime}`, "DD-MM-YYYY HH:mm");
                                const hours = checkOut.diff(checkIn, 'hours');
                                return `${hours} giờ (Theo giờ)`;
                              })() :
                              viewingBooking?.bookingType === 'qua_dem' ?
                                (() => {
                                  const nights = calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate);
                                  return `${nights} đêm (Qua đêm)`;
                                })() :
                                viewingBooking?.bookingType === 'dai_ngay' ?
                                  `${calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate)} ngày (Dài ngày)`
                                  : `${calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate)} ngày`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVietnameseStatusColor(viewingBooking.status)}`}>
                          {getVietnameseStatusText(viewingBooking.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Họ tên:</span>
                        <span className="font-medium">{viewingBooking.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{viewingBooking.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số điện thoại:</span>
                        <span className="font-medium">{viewingBooking.phoneNumber || "N/A"}</span>
                      </div>
                      {viewingBooking.cccd && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">CCCD:</span>
                          <span className="font-medium">{viewingBooking.cccd}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {viewingBooking.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Ghi chú
                      </h3>
                      <p className="text-sm text-gray-600">{viewingBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Thông tin thanh toán và phòng */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Thông tin thanh toán
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phương thức:</span>
                        <span className="font-medium">{viewingBooking.paymentMethod || "Chưa chọn"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`font-medium ${viewingBooking.paymentStatus === 'da_thanh_toan' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {viewingBooking.paymentStatus === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Giá phòng:</span>
                        <span className="font-medium">{formatCurrency(viewingBooking.roomPrice || 0)}/ngày</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2 text-base">
                        <span>Tổng cộng:</span>
                        <span className="text-blue-600">{formatCurrency(viewingBooking.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian đặt:</span>
                        <span className="font-medium">{formatDate(viewingBooking.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Phòng đã được gán */}
                  {viewingBooking.assignedRooms && viewingBooking.assignedRooms.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        Phòng đã nhận ({viewingBooking.assignedRooms.length})
                      </h3>
                      <div className="space-y-3">
                        {viewingBooking.assignedRooms.map((room, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-lg">Phòng {room.soPhong}</p>
                                <p className="text-sm text-gray-600">Tầng {room.tang}</p>
                                {room.loaiView && (
                                  <p className="text-sm text-gray-600">View: {room.loaiView}</p>
                                )}
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {room.trangThaiPhong}
                              </span>
                            </div>
                            {room.ghiChuPhong && (
                              <p className="text-sm text-gray-500 mt-2 italic">{room.ghiChuPhong}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Gán lúc: {formatDate(room.thoiGianGiaoPhong)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Thao tác</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {viewingBooking.status === 'dang_cho' && (
                        <>
                          <button
                            onClick={() => {
                              updateBookingStatus(viewingBooking.bookingId, 'confirmed');
                              setShowDetailModal(false);
                            }}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              updateBookingStatus(viewingBooking.bookingId, 'cancelled');
                              setShowDetailModal(false);
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}

                      {viewingBooking.status === 'da_xac_nhan' && (
                        <>
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              openRoomAssignModal(viewingBooking);
                            }}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
                          >
                            <Home className="h-4 w-4 mr-1" />
                            Gán phòng
                          </button>
                          <button
                            onClick={() => {
                              updateBookingStatus(viewingBooking.bookingId, 'cancelled');
                              setShowDetailModal(false);
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          openEditModal(viewingBooking);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Chỉnh sửa
                      </button>

                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal hủy đơn */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                Xác nhận hủy đơn
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Đơn #{cancellingBooking?.bookingId} - {cancellingBooking?.customerName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Thông tin đơn */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Khách sạn:</strong> {cancellingBooking?.hotelId?.tenKhachSan}</p>
                  <p><strong>Loại phòng:</strong> {cancellingBooking?.roomType}</p>
                  <p><strong>Ngày:</strong> {cancellingBooking?.checkInDate} - {cancellingBooking?.checkOutDate}</p>
                  <p><strong>Tổng tiền:</strong> <span className="text-red-600 font-semibold">{formatCurrency(cancellingBooking?.totalAmount || 0)}</span></p>
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

export default Booking;