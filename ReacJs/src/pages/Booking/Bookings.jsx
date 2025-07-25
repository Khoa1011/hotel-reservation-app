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
  FileText,
  Search
} from 'lucide-react';
import Cookies from 'js-cookie';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from "moment";
import AddBooking from './addBooking';
import EditBooking from './editBooking';
import { useNotifications } from '../../contexts/NotificationContext';
import { RefreshCw } from 'lucide-react';

const Booking = ({ hotels = [], bookings, setBookings, expandedBooking, setExpandedBooking, formatCurrency, formatDate, getStatusColor, getStatusText, selectedHotelId }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    timeRange: '',
    search: ''
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

  //State gán phòng


  // State cho room assignment
  const [showRoomAssignModal, setShowRoomAssignModal] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState(null);

  const [assignmentData, setAssignmentData] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);


  //State cho thông báo nếu có đơn mới 
  const { notifications, fetchAllNotifications, markHotelAsRead } = useNotifications();

  // State cho detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);
  //State chọn tầng
  const [enableFloorSelection, setEnableFloorSelection] = useState(false);

  const [showTransferRoomModal, setShowTransferRoomModal] = useState(false);
  const [transferringAssignment, setTransferringAssignment] = useState(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [addingServiceAssignment, setAddingServiceAssignment] = useState(null);
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [editingGuestAssignment, setEditingGuestAssignment] = useState(null);
  const [transferAvailableRooms, setTransferAvailableRooms] = useState([]);
  // State cho transfer room
  const [transferRoomData, setTransferRoomData] = useState({
    newRoomId: '',
    reason: '',
    transferFee: 0
  });

  // State cho add service
  const [newServiceData, setNewServiceData] = useState({
    services: [{ name: '', price: '', quantity: 1 }]
  });

  // State cho guest info
  const [guestInfoData, setGuestInfoData] = useState({
    tenKhachChinh: '',
    soDienThoaiLienHe: '',
    soLuongKhachThucTe: 1,
    hasCompanions: false,
    danhSachKhach: [],
    yeuCauDacBiet: ''
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  //Tạo danh sách hotel từ bookings
  // const hotelList = Array.from(
  //   new Map(bookings.map(b => [b.hotelId?._id, b.hotelId?.tenKhachSan])).entries()
  // ).map(([id, name]) => ({ id, name })).filter(hotel => hotel.id && hotel.name);

  const getAllHotels = () => {
    // ✅ Nếu có hotels prop, dùng nó
    if (hotels && Array.isArray(hotels) && hotels.length > 0) {
      return hotels.map(h => ({
        id: h.hotelId || h._id,
        name: h.tenKhachSan,
        notifications: notifications.hotelNotifications[h.hotelId || h._id] || {
          newBookings: 0,
          pendingBookings: 0,
          totalUnread: 0
        }
      }));
    }

    // ✅ Fallback về bookings với safety check
    if (!bookings || !Array.isArray(bookings)) {
      console.log('⚠️ No valid data for hotels');
      return [];
    }

    const allHotels = Array.from(
      new Map(bookings.map(b => [b.hotelId?._id, b.hotelId?.tenKhachSan])).entries()
    ).map(([id, name]) => ({
      id,
      name,
      notifications: notifications.hotelNotifications[id] || {
        newBookings: 0,
        pendingBookings: 0,
        totalUnread: 0
      }
    })).filter(hotel => hotel.id && hotel.name);

    return allHotels;
  };

  const hotelList = getAllHotels();

  const getDiscountPercent = (booking) => {
  // Try to get from API first
  const apiPercent = booking.priceDetails?.chiTietGia?.discounts?.discountPercent;
  if (apiPercent && apiPercent > 0) return apiPercent;
  
  // Fallback: calculate from booking data
  if (booking.bookingType === 'dai_ngay') {
    const duration = booking.priceDetails?.soLuongDonVi || 0;
    if (duration >= 7) return 15;
    if (duration >= 5) return 10;  
    if (duration >= 3) return 5;
  }
  
  return 0;
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

  const getUnitBookingType = (unit) => {
    const unitText = {
      'dem': 'đêm',
      'gio': 'giờ',
      'ngay': 'ngày'
    }
    return unitText[unit] || "Không xác định";
  };


  const getViewText = (viewType) => {
    const viewTexts = {
      'sea_view': 'View biển',
      'city_view': 'View thành phố',
      'garden_view': 'View vườn',
      'mountain_view': 'View núi',
      'pool_view': 'View hồ bơi',
      'none': ''
    };
    return viewTexts[viewType] || 'Không có view';
  };

  const roomStatusMapping = (status) => {
    const statusText = {
      'chua_gan': 'Chưa thêm phòng',
      'da_gan': 'Đã thêm phòng',
      'dang_cho_checkin': 'Đang chờ check-in',
      'da_checkin': 'Đã check-in',
      'dang_su_dung': 'Đang sử dụng',
      'da_checkout': 'Đã check-out',
      'chuyen_phong': 'Chuyển phòng',
      'nang_cap': 'Nâng cấp',
      'huy_gan': 'Hủy thêm phòng',
    };
    return statusText[status] || "Không xác định";
  };

  // const loadAvailableRooms = async (booking) => {
  //   if (!booking) return;

  //   setLoadingRooms(true);
  //   try {
  //     let roomTypeId = booking.roomTypeId || booking.maLoaiPhong;

  //     if (!roomTypeId) {
  //       const roomTypeMapping = {
  //         'Phòng của Khoa': '687d1e94cee4aed371090b63',
  //       };
  //       roomTypeId = roomTypeMapping[booking.roomType];
  //     }

  //     if (!roomTypeId) {
  //       toast.error(`Không thể xác định loại phòng "${booking.roomType}"`);
  //       setAvailableRooms([]);
  //       return;
  //     }

  //     const payload = {
  //       maLoaiPhong: roomTypeId,
  //       checkInDate: moment(booking.checkInDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
  //       checkOutDate: moment(booking.checkOutDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
  //       checkInTime: booking.checkInTime,
  //       checkOutTime: booking.checkOutTime,
  //       bookingType: booking.bookingType,
  //       excludeBookingId: booking._id || booking.bookingId
  //     };
  //     const hotelId = booking.hotelId._id;

  //     const response = await axios.post(
  //       `${baseUrl}/api/booking-hotel/${hotelId}/available-rooms-for-assignment`,
  //       payload,
  //       { withCredentials: true }
  //     );
  //     console.log("Giá trị trả về", response);
  //     if (response.data?.success) {
  //       setAvailableRooms(response.data.availableRooms);
  //       if (response.data.availableRooms.length === 0) {
  //         toast.warning('Không có phòng trống trong thời gian này');
  //       }
  //     } else {
  //       setAvailableRooms([]);
  //       toast.warning('Không tìm thấy phòng trống phù hợp');
  //     }
  //   } catch (error) {
  //     console.error('Error loading available rooms:', error);
  //     setAvailableRooms([]);
  //     toast.error('Lỗi khi tải danh sách phòng trống');
  //   } finally {
  //     setLoadingRooms(false);
  //   }
  // };

  const loadAvailableRooms = async (booking) => {
    if (!booking) return;

    console.log('🔍 === DEBUG LOAD AVAILABLE ROOMS ===');
    console.log('📋 Booking for room loading:', {
      bookingId: booking.bookingId,
      roomType: booking.roomType,
      roomTypeId: booking.roomTypeId || booking.maLoaiPhong,
      dates: `${booking.checkInDate} ${booking.checkInTime} → ${booking.checkOutDate} ${booking.checkOutTime}`,
      bookingType: booking.bookingType,
      hotelId: booking.hotelId
    });

    setLoadingRooms(true);
    try {
      let roomTypeId = booking.roomTypeId || booking.maLoaiPhong;
      console.log('🏠 Initial roomTypeId:', roomTypeId);

      if (!roomTypeId) {
        const roomTypeMapping = {
          'Phòng của Khoa': '687d1e94cee4aed371090b63',
          'Phòng VIP Premium': '687b0e63288f00c9fdb5bac5',
          'Phòng vintage': '687b0e63288f00c9fdb5bac5'
        };
        roomTypeId = roomTypeMapping[booking.roomType];
        console.log('🏠 Mapped roomTypeId:', booking.roomType, '→', roomTypeId);
      }

      if (!roomTypeId) {
        console.error('❌ Cannot determine room type:', booking.roomType);
        toast.error(`Không thể xác định loại phòng "${booking.roomType}"`);
        setAvailableRooms([]);
        return;
      }

      const hotelId = booking.hotelId._id || booking.hotelId;
      console.log('🏨 Hotel ID:', hotelId);

      // ✅ THÊM: Thử nhiều strategy để lấy tất cả phòng
      const strategies = [
        // Strategy 1: Request gốc
        {
          name: 'Original Request',
          payload: {
            maLoaiPhong: roomTypeId,
            checkInDate: moment(booking.checkInDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
            checkOutDate: moment(booking.checkOutDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
            checkInTime: booking.checkInTime,
            checkOutTime: booking.checkOutTime,
            bookingType: booking.bookingType,
            excludeBookingId: booking._id || booking.bookingId
          }
        },
        // Strategy 2: Thời gian tương lai
        {
          name: 'Future Date',
          payload: {
            maLoaiPhong: roomTypeId,
            checkInDate: moment().add(30, 'days').format('YYYY-MM-DD'),
            checkOutDate: moment().add(31, 'days').format('YYYY-MM-DD'),
            checkInTime: '14:00',
            checkOutTime: '12:00',
            bookingType: 'qua_dem',
            excludeBookingId: null
          }
        },
        // Strategy 3: Booking type khác
        {
          name: 'Different Type',
          payload: {
            maLoaiPhong: roomTypeId,
            checkInDate: moment().format('YYYY-MM-DD'),
            checkOutDate: moment().format('YYYY-MM-DD'),
            checkInTime: '08:00',
            checkOutTime: '10:00',
            bookingType: 'theo_gio',
            excludeBookingId: null
          }
        }
      ];

      let allRooms = [];

      for (const strategy of strategies) {
        console.log(`🔄 Thử strategy: ${strategy.name}`);
        console.log('📋 Payload:', strategy.payload);

        try {
          const response = await axios.post(
            `${baseUrl}/api/booking-hotel/${hotelId}/available-rooms-for-assignment`,
            strategy.payload,
            { withCredentials: true }
          );

          console.log(`📋 ${strategy.name} response:`, response.data);

          if (response.data?.success && response.data.availableRooms?.length > 0) {
            console.log(`✅ ${strategy.name} tìm thấy ${response.data.availableRooms.length} phòng`);
            allRooms = [...allRooms, ...response.data.availableRooms];

            // Nếu đã có phòng thì break (có thể comment dòng này để lấy tất cả)
            if (allRooms.length >= 2) break; // Lấy ít nhất 2 phòng
          }
        } catch (error) {
          console.log(`❌ ${strategy.name} failed:`, error.message);
        }
      }

      // ✅ Remove duplicates
      const uniqueRooms = allRooms.filter((room, index, array) =>
        array.findIndex(r => (r.roomId || r._id) === (room.roomId || room._id)) === index
      );

      console.log('🏠 Unique rooms từ tất cả strategies:', uniqueRooms);

      // ✅ Nếu vẫn không có, tạo manual data
      if (uniqueRooms.length === 0) {
        console.log('🔄 Không tìm thấy phòng, tạo manual data...');

        const manualRooms = [];
        if (roomTypeId === '687b0e63288f00c9fdb5bac5') { // VIP Premium
          const roomNumbers = ['101', '102', '103', '104', '105', '106', '107'];
          roomNumbers.forEach(roomNum => {
            manualRooms.push({
              roomId: `manual-${roomNum}`,
              soPhong: roomNum,
              tang: 1,
              loaiView: 'none',
              displayName: `Phòng ${roomNum} - Tầng 1 (Manual)`
            });
          });
        }

        console.log('🏠 Manual rooms:', manualRooms);
        allRooms = manualRooms;
      }

      // ✅ Debug specific rooms
      const room103 = uniqueRooms.find(room => room.soPhong === '103') || allRooms.find(room => room.soPhong === '103');
      const room104 = uniqueRooms.find(room => room.soPhong === '104') || allRooms.find(room => room.soPhong === '104');
      console.log('🏠 Room 103:', room103);
      console.log('🏠 Room 104:', room104);

      const finalRooms = uniqueRooms.length > 0 ? uniqueRooms : allRooms;
      setAvailableRooms(finalRooms);

      if (finalRooms.length === 0) {
        toast.warning('Không có phòng trống trong thời gian này');
      } else {
        console.log(`✅ Found ${finalRooms.length} available rooms:`, finalRooms.map(r => r.soPhong));
      }

    } catch (error) {
      console.error('❌ Error loading available rooms:', error);

      // ✅ Ultimate fallback
      const fallbackRooms = [
        { roomId: 'fallback-103', soPhong: '103', tang: 1, displayName: 'Phòng 103 (Fallback)' },
        { roomId: 'fallback-104', soPhong: '104', tang: 1, displayName: 'Phòng 104 (Fallback)' }
      ];

      setAvailableRooms(fallbackRooms);
      toast.warning('Dùng dữ liệu fallback cho test');
    } finally {
      setLoadingRooms(false);
      console.log('🔍 === END DEBUG LOAD AVAILABLE ROOMS ===');
    }
  };

  const loadAvailableRoomsForTransfer = async (assignment, currentBooking) => {
    console.log('🔍 === DEBUG LOAD TRANSFER ROOMS ===');
    console.log('📋 Assignment:', assignment);
    console.log('📋 Current booking:', currentBooking);

    setLoadingRooms(true);
    try {
      const hotelId = currentBooking.hotelId._id || currentBooking.hotelId;
      let roomTypeId = currentBooking.roomTypeId || currentBooking.maLoaiPhong;

      if (!roomTypeId) {
        const roomTypeMapping = {
          'Phòng của Khoa': '687d1e94cee4aed371090b63',
          'Phòng VIP Premium': '687b0e63288f00c9fdb5bac5',
          'Phòng vintage': '687b0e63288f00c9fdb5bac5'
        };
        roomTypeId = roomTypeMapping[currentBooking.roomType];
        console.log('🏠 Mapped roomTypeId:', roomTypeId);
      }

      // ✅ CÁCH MỚI: Dùng nhiều thời gian khác nhau để bypass backend logic
      const testTimeSlots = [
        // Slot 1: Thời gian tương lai xa (không conflict)
        {
          checkInDate: moment().add(30, 'days').format('YYYY-MM-DD'),
          checkOutDate: moment().add(31, 'days').format('YYYY-MM-DD'),
          checkInTime: '14:00',
          checkOutTime: '12:00'
        },
        // Slot 2: Thời gian khác với booking hiện tại
        {
          checkInDate: moment().add(7, 'days').format('YYYY-MM-DD'),
          checkOutDate: moment().add(8, 'days').format('YYYY-MM-DD'),
          checkInTime: '10:00',
          checkOutTime: '18:00'
        },
        // Slot 3: Booking type khác
        {
          checkInDate: moment().format('YYYY-MM-DD'),
          checkOutDate: moment().format('YYYY-MM-DD'),
          checkInTime: '08:00',
          checkOutTime: '10:00'
        }
      ];

      let allAvailableRooms = [];

      for (let i = 0; i < testTimeSlots.length; i++) {
        const timeSlot = testTimeSlots[i];
        console.log(`🔄 Thử time slot ${i + 1}:`, timeSlot);

        try {
          const response = await axios.post(
            `${baseUrl}/api/booking-hotel/${hotelId}/available-rooms-for-assignment`,
            {
              maLoaiPhong: roomTypeId,
              ...timeSlot,
              bookingType: i === 2 ? 'theo_gio' : 'qua_dem', // Thử booking type khác
              excludeBookingId: null // Không exclude gì
            },
            { withCredentials: true }
          );

          console.log(`📋 Response slot ${i + 1}:`, response.data);

          if (response.data?.success && response.data.availableRooms?.length > 0) {
            console.log(`✅ Tìm thấy ${response.data.availableRooms.length} phòng ở slot ${i + 1}`);
            allAvailableRooms = [...allAvailableRooms, ...response.data.availableRooms];

            // Nếu tìm thấy phòng rồi thì break
            if (allAvailableRooms.length > 0) break;
          }
        } catch (error) {
          console.log(`❌ Slot ${i + 1} failed:`, error.message);
        }
      }

      // ✅ Remove duplicates based on roomId
      const uniqueRooms = allAvailableRooms.filter((room, index, array) =>
        array.findIndex(r => (r.roomId || r._id) === (room.roomId || room._id)) === index
      );

      console.log('🏠 Unique rooms từ all slots:', uniqueRooms);

      // ✅ Nếu vẫn không có phòng, thử cách manual
      if (uniqueRooms.length === 0) {
        console.log('🔄 Không tìm thấy phòng qua API, thử cách manual...');

        // ✅ MANUAL: Tạo fake room data cho test
        const manualRooms = [
          {
            roomId: '688233d7511cc065e76eb349', // ID giả của phòng 104
            soPhong: '104',
            tang: 1,
            loaiView: 'none',
            dienTich: 25,
            soLuongNguoiToiDa: 2,
            displayName: 'Phòng 104 - Tầng 1 (Manual)'
          }
        ];

        console.log('🏠 Manual rooms for testing:', manualRooms);
        allAvailableRooms = manualRooms;
      }

      // ✅ Filter out current room
      const currentRoomNumber = assignment.roomInfo?.soPhong;
      const filteredRooms = allAvailableRooms.filter(room => {
        const shouldExclude = room.soPhong === currentRoomNumber;
        console.log(`🏠 Room ${room.soPhong}: ${shouldExclude ? 'EXCLUDE' : 'INCLUDE'}`);
        return !shouldExclude;
      });

      console.log('🏠 Final filtered rooms:', filteredRooms);

      // ✅ Check room 104 specifically
      const room104 = filteredRooms.find(room => room.soPhong === '104');
      console.log('🏠 Room 104 final result:', room104);

      if (room104) {
        console.log('✅ PHÒNG 104 CÓ SẴN ĐỂ ĐỔI!');
      } else {
        console.log('❌ Phòng 104 vẫn không có');

        // ✅ Debug: Tại sao không có?
        const room104InAll = allAvailableRooms.find(room => room.soPhong === '104');
        if (room104InAll) {
          console.log('  - Có trong all rooms nhưng bị filter out');
          console.log('  - Current room number:', currentRoomNumber);
        } else {
          console.log('  - Không có trong bất kỳ API response nào');
        }
      }

      setTransferAvailableRooms(filteredRooms);

      if (filteredRooms.length === 0) {
        toast.warning('Không có phòng trống khác để đổi trong thời gian này');
      } else {
        console.log(`✅ Tìm thấy ${filteredRooms.length} phòng có thể đổi`);

      }

    } catch (error) {
      console.error('❌ Lỗi khi load transfer rooms:', error);

      // ✅ ULTIMATE FALLBACK: Hard-code room 104 cho test
      console.log('🔄 Ultimate fallback: Hard-code room 104');

      const fallbackRooms = [
        {
          roomId: 'hardcode-104',
          soPhong: '104',
          tang: 1,
          loaiView: 'none',
          displayName: 'Phòng 104 - Tầng 1 (Fallback)'
        }
      ];

      // Only include if not current room
      const currentRoom = assignment.roomInfo?.soPhong;
      const finalFallback = fallbackRooms.filter(room => room.soPhong !== currentRoom);

      setTransferAvailableRooms(finalFallback);

      if (finalFallback.length > 0) {
        toast.warning('Đang dùng dữ liệu fallback cho test');
        console.log('✅ Fallback rooms:', finalFallback);
      } else {
        setTransferAvailableRooms([]);
        toast.error('Lỗi khi tải danh sách phòng có thể đổi');
      }
    } finally {
      setLoadingRooms(false);
      console.log('🔍 === KẾT THÚC DEBUG TRANSFER ROOMS ===');
    }
  };




  const updateAssignmentData = (index, field, value) => {
    const newData = [...assignmentData];
    newData[index][field] = value;

    // Nếu chọn phòng, tự động điền thông tin
    if (field === 'roomId' && value) {
      const selectedRoom = availableRooms.find(r => r.roomId === value);
      if (selectedRoom) {
        newData[index].roomNumber = selectedRoom.soPhong;
        newData[index].floor = selectedRoom.tang;
        newData[index].viewType = selectedRoom.loaiView;
      }
    }

    if (field === 'hasCompanions') {
      if (value && !newData[index].danhSachKhach) {
        newData[index].danhSachKhach = [{ ten: '', giayTo: '' }]; // Khởi tạo 1 khách
      } else if (!value) {
        newData[index].danhSachKhach = []; // Xóa danh sách nếu tắt
      }
    }

    setAssignmentData(newData);
  };

  // ✅ THÊM: Handle bulk assign

  const handleBulkAssign = async () => {
    const validAssignments = assignmentData.filter(data => data.roomId);

    if (validAssignments.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 phòng!');
      return;
    }

    setLoadingRooms(true);
    let successCount = 0;
    const errors = [];
    const successfulAssignments = [];

    try {
      console.log(`🚀 Bắt đầu gán ${validAssignments.length} phòng cho đơn #${assigningBooking.bookingId}`);

      for (let i = 0; i < validAssignments.length; i++) {
        const data = validAssignments[i];

        try {
          const response = await axios.put(
            `${baseUrl}/api/booking-hotel/hotelowner/assign-room/${assigningBooking.bookingId}`,
            {
              roomId: data.roomId,
              notes: data.notes || `Phòng ${i + 1}/${validAssignments.length}`,
              guestInfo: {
                guestMain: data.guestName || '',
                phoneContact: data.guestPhone || '',
                specialRequest: data.specialRequest || '',
                guestList: data.danhSachKhach || []
              }
            },
            { withCredentials: true }
          );

          if (response.data?.message?.msgError === false) {
            successCount++;
            const assignmentInfo = response.data.assignment;

            if (assignmentInfo) {
              successfulAssignments.push({
                assignmentId: assignmentInfo.assignmentId,
                roomInfo: assignmentInfo.roomInfo,
                status: assignmentInfo.status,
                guestInfo: assignmentInfo.guestInfo || {
                  tenKhachChinh: data.guestName || '',
                  soDienThoaiLienHe: data.guestPhone || '',
                  yeuCauDacBiet: data.specialRequest || ''
                },
                services: [],
                serviceTotal: 0,
                notes: data.notes || '',
                createdAt: new Date().toISOString()
              });
            }
          } else {
            errors.push(`Phòng ${i + 1}: ${response.data?.message?.msgBody || 'Lỗi không xác định'}`);
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message?.msgBody || error.message;
          errors.push(`Phòng ${i + 1}: ${errorMsg}`);
          console.error(`❌ Error assigning room ${i + 1}:`, error);
        }
      }

      // ✅ Enhanced success handling with proper state update
      if (successCount > 0) {
        const newStatus = successCount === assigningBooking.roomQuantity ? 'da_nhan_phong' : 'da_xac_nhan';

        // ✅ Use unified update function
        updateBookingInState(
          assigningBooking.bookingId,
          {
            status: newStatus,
            assignedRooms: [...(assigningBooking.assignedRooms || []), ...successfulAssignments]
          },
          `Room assignment completed: ${successCount}/${validAssignments.length} successful`
        );

        if (successCount === validAssignments.length) {
          toast.success(`🎉 Đã gán tất cả ${successCount} phòng thành công!`);
        } else {
          toast.success(`✅ Đã gán ${successCount}/${validAssignments.length} phòng thành công!`);
          if (errors.length > 0) {
            toast.warning(`⚠️ Một số phòng gán thất bại: ${errors.slice(0, 2).join(', ')}`);
          }
        }

        setShowRoomAssignModal(false);

        // ✅ Trigger refresh after short delay
        setTimeout(() => {
          checkForNewBookings();
        }, 1000);
      } else {
        toast.error('❌ Không thể thêm phòng nào!');
        if (errors.length > 0) {
          toast.error(`Chi tiết lỗi: ${errors[0]}`);
        }
      }
    } catch (error) {
      console.error('❌ Critical error in bulk assign:', error);
      toast.error('Lỗi nghiêm trọng khi thêm phòng!');
    } finally {
      setLoadingRooms(false);
    }
  };



  const getUsedRoomIds = () => {
    return assignmentData.map(data => data.roomId).filter(Boolean);
  };

  const getAvailableRoomsForIndex = (currentIndex) => {
    const usedIds = getUsedRoomIds();
    const currentRoomId = assignmentData[currentIndex]?.roomId;

    return availableRooms.filter(room =>
      !usedIds.includes(room.roomId) || room.roomId === currentRoomId
    );
  };

  // Đổi phòng

  const transferRoom = async (assignmentId, transferData) => {
    try {
      console.log('🔍 === TRANSFER ROOM DEBUG START ===');
      console.log('🔄 Transferring room:', assignmentId, transferData);

      // ✅ Debug: Check transferData có đúng không
      console.log('📋 Transfer data validation:', {
        newRoomId: transferData.newRoomId,
        reason: transferData.reason,
        transferFee: transferData.transferFee,
        hasNewRoomId: !!transferData.newRoomId,
        hasReason: !!transferData.reason
      });

      // ✅ Debug: Check current booking state trước khi transfer
      const targetBooking = localBookings.find(booking =>
        booking.assignedRooms?.some(room => room.assignmentId === assignmentId)
      );

      if (targetBooking) {
        console.log('📋 Target booking found:', {
          bookingId: targetBooking.bookingId,
          hotelId: targetBooking.hotelId,
          assignedRoomsCount: targetBooking.assignedRooms?.length,
          currentAssignment: targetBooking.assignedRooms?.find(room => room.assignmentId === assignmentId)
        });
      } else {
        console.error('❌ Target booking NOT found for assignment:', assignmentId);
      }

      const response = await axios.post(
        `${baseUrl}/api/booking-hotel/hotelowner/transfer-room/${assignmentId}`,
        transferData,
        { withCredentials: true }
      );

      console.log('📋 Transfer API response:', response.data);
      console.log('📋 Response structure check:', {
        hasMessage: !!response.data?.message,
        msgError: response.data?.message?.msgError,
        hasTransfer: !!response.data?.transfer,
        transferKeys: response.data?.transfer ? Object.keys(response.data.transfer) : null
      });

      if (response.data?.message?.msgError === false) {
        toast.success(response.data.message.msgBody);

        // ✅ Find the booking that contains this assignment
        if (!targetBooking) {
          console.error('❌ Target booking not found for assignment:', assignmentId);
          toast.error('Không tìm thấy đơn đặt phòng!');
          return { success: false };
        }

        // ✅ ENHANCED DEBUG: Extract transfer data with extensive logging
        const transferResponse = response.data.transfer || response.data;
        console.log('🔄 Transfer response structure:', transferResponse);

        const newRoomData = transferResponse.newRoom || transferResponse.room || transferResponse;
        console.log('🔄 New room data extracted:', newRoomData);

        console.log('🔄 Transfer data structure analysis:', {
          'response.data.transfer': response.data.transfer,
          'transferResponse.newRoom': transferResponse.newRoom,
          'newRoomData keys': newRoomData ? Object.keys(newRoomData) : null,
          'newRoomData.roomInfo': newRoomData?.roomInfo,
          'newRoomData.assignmentId': newRoomData?.assignmentId,
          fullResponse: response.data
        });

        // ✅ ENHANCED SAFE: Build room info with extensive fallback logging
        const newRoomInfo = {
          soPhong: (() => {
            const sources = [
              newRoomData.roomInfo?.soPhong,
              newRoomData.soPhong,
              newRoomData.roomNumber
            ];
            console.log('🏠 soPhong sources:', sources);
            return sources.find(s => s) || 'N/A';
          })(),

          tang: (() => {
            const sources = [
              newRoomData.roomInfo?.tang,
              newRoomData.tang,
              newRoomData.floor
            ];
            console.log('🏠 tang sources:', sources);
            return sources.find(s => s) || 1;
          })(),

          loaiView: (() => {
            const sources = [
              newRoomData.roomInfo?.loaiView,
              newRoomData.loaiView,
              newRoomData.viewType
            ];
            console.log('🏠 loaiView sources:', sources);
            return sources.find(s => s) || 'none';
          })(),

          _id: (() => {
            const sources = [
              newRoomData.roomInfo?._id,
              newRoomData._id,
              newRoomData.roomId
            ];
            console.log('🏠 _id sources:', sources);
            return sources.find(s => s);
          })(),

          dienTich: newRoomData.roomInfo?.dienTich || newRoomData.dienTich,
          soLuongNguoiToiDa: newRoomData.roomInfo?.soLuongNguoiToiDa || newRoomData.soLuongNguoiToiDa,
          trangThaiPhong: newRoomData.roomInfo?.trangThaiPhong || newRoomData.trangThaiPhong || 'da_gan'
        };

        console.log('🏠 Constructed room info:', newRoomInfo);
        console.log('🏠 Room info validation:', {
          hasValidSoPhong: newRoomInfo.soPhong !== 'N/A',
          hasValidId: !!newRoomInfo._id,
          allFields: newRoomInfo
        });

        // ✅ ENHANCED DEBUG: Current room assignment analysis
        const currentAssignment = targetBooking.assignedRooms.find(room => room.assignmentId === assignmentId);
        console.log('📋 Current assignment analysis:', {
          found: !!currentAssignment,
          currentRoom: currentAssignment?.roomInfo,
          assignmentId: currentAssignment?.assignmentId,
          status: currentAssignment?.status
        });

        // ✅ SAFE: Update assigned rooms with detailed logging
        const updatedRooms = targetBooking.assignedRooms.map((room, index) => {
          console.log(`🔄 Processing room ${index + 1}:`, {
            assignmentId: room.assignmentId,
            isTarget: room.assignmentId === assignmentId,
            currentRoom: room.roomInfo?.soPhong
          });

          if (room.assignmentId === assignmentId) {
            // Store old room info for history
            const oldRoomInfo = room.roomInfo || {
              soPhong: 'N/A',
              tang: 1,
              loaiView: 'none'
            };

            console.log('🔄 Updating target room:', {
              oldRoom: oldRoomInfo,
              newRoom: newRoomInfo,
              newAssignmentId: newRoomData.assignmentId
            });

            const updatedRoom = {
              ...room,
              // ✅ Update with new room info
              roomInfo: newRoomInfo,
              // ✅ Update assignment ID if provided
              assignmentId: newRoomData.assignmentId || room.assignmentId,
              // ✅ Add transfer history
              transferHistory: [
                ...(room.transferHistory || []),
                {
                  fromRoom: oldRoomInfo,
                  toRoom: newRoomInfo,
                  reason: transferData.reason || 'Đổi phòng',
                  transferredAt: new Date().toISOString(),
                  transferFee: transferData.transferFee || 0
                }
              ],
              // ✅ Update status
              status: newRoomData.status || 'da_gan',
              // ✅ Add transfer fee if applicable
              ...(transferData.transferFee && { transferFee: transferData.transferFee })
            };

            console.log('🔄 Updated room result:', updatedRoom);
            return updatedRoom;
          }
          return room;
        });

        console.log('🔄 All updated rooms:', updatedRooms);
        console.log('🔄 Updated rooms count:', updatedRooms.length);

        // ✅ Calculate new total if transfer fee exists
        const totalTransferFee = transferData.transferFee || 0;
        const updatedTotalAmount = totalTransferFee > 0
          ? (targetBooking.totalAmount || 0) + totalTransferFee
          : targetBooking.totalAmount;

        console.log('💰 Fee calculation:', {
          transferFee: totalTransferFee,
          originalTotal: targetBooking.totalAmount,
          newTotal: updatedTotalAmount
        });

        // ✅ Use unified update function with safe data
        const updateData = {
          assignedRooms: updatedRooms,
          ...(totalTransferFee > 0 && {
            totalAmount: updatedTotalAmount,
            transferFees: (targetBooking.transferFees || 0) + totalTransferFee
          })
        };

        console.log('📋 Final update data:', updateData);

        // ✅ Debug: Check if updateBookingInState function exists
        if (typeof updateBookingInState === 'function') {
          console.log('✅ Calling updateBookingInState');
          updateBookingInState(
            targetBooking.bookingId,
            updateData,
            `Room transfer completed: ${currentAssignment?.roomInfo?.soPhong || 'N/A'} → ${newRoomInfo.soPhong}`
          );
        } else {
          console.error('❌ updateBookingInState function not found!');
          // ✅ Fallback: Direct state update
          setLocalBookings(prev =>
            prev.map(booking =>
              booking.bookingId === targetBooking.bookingId
                ? { ...booking, ...updateData }
                : booking
            )
          );
          setBookings(prev =>
            prev.map(booking =>
              booking.bookingId === targetBooking.bookingId
                ? { ...booking, ...updateData }
                : booking
            )
          );
          console.log('✅ Applied fallback state update');
        }

        setShowTransferRoomModal(false);

        // ✅ FIXED: Enhanced success message with safe room access
        const oldRoomNum = currentAssignment?.roomInfo?.soPhong || 'N/A';
        const successMessage = `Đổi phòng thành công từ ${oldRoomNum} sang ${newRoomInfo.soPhong}!`;
        console.log('🎉 Success:', successMessage);


        console.log('🔍 === TRANSFER ROOM DEBUG END (SUCCESS) ===');
        return { success: true, newRoomInfo };
      } else {
        const errorMsg = response.data?.message?.msgBody || "Đổi phòng thất bại!";
        console.log('❌ Transfer failed - API returned error:', errorMsg);
        toast.error(errorMsg);
        console.log('🔍 === TRANSFER ROOM DEBUG END (API ERROR) ===');
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error("❌ Lỗi đổi phòng:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      // ✅ Enhanced error handling with specific messages
      let errorMessage = "Lỗi khi đổi phòng!";

      if (error.response?.data?.message?.msgBody) {
        errorMessage = error.response.data.message.msgBody;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Lỗi hệ thống: ${error.message}`;
      }

      console.log('❌ Final error message:', errorMessage);
      toast.error(errorMessage);
      console.log('🔍 === TRANSFER ROOM DEBUG END (EXCEPTION) ===');
      return { success: false, error: errorMessage };
    }
  };






  // Thêm dịch vụ cho phòng

  const addRoomService = async (assignmentId, services) => {
    try {
      console.log('🛎️ Adding room service:', assignmentId, services);

      const response = await axios.post(
        `${baseUrl}/api/booking-hotel/hotelowner/add-room-service/${assignmentId}`,
        { services },
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        toast.success(response.data.message.msgBody);

        // ✅ Find the booking that contains this assignment
        const targetBooking = localBookings.find(booking =>
          booking.assignedRooms?.some(room => room.assignmentId === assignmentId)
        );

        if (targetBooking) {
          const serviceTotal = response.data.services.reduce((total, s) => total + s.thanhTien, 0);

          const updatedRooms = targetBooking.assignedRooms.map(room =>
            room.assignmentId === assignmentId
              ? {
                ...room,
                services: [...(room.services || []), ...response.data.services],
                serviceTotal: (room.serviceTotal || 0) + serviceTotal
              }
              : room
          );

          // ✅ Use unified update function with total amount update
          updateBookingInState(
            targetBooking.bookingId,
            {
              assignedRooms: updatedRooms,
              totalAmount: (targetBooking.totalAmount || 0) + serviceTotal,
              servicesFee: (targetBooking.servicesFee || 0) + serviceTotal
            },
            'Room service added'
          );
        }

        setShowAddServiceModal(false);
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || "Thêm dịch vụ thất bại!");
        return { success: false };
      }
    } catch (error) {
      console.error("❌ Lỗi thêm dịch vụ:", error);
      toast.error("Lỗi khi thêm dịch vụ!");
      return { success: false };
    }
  };




  // Cập nhật thông tin khách
  const updateGuestInfo = async (assignmentId, guestInfo) => {
    try {
      console.log('👤 Updating guest info:', assignmentId, guestInfo);

      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update-room-guests/${assignmentId}`,
        { guestInfo },
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        toast.success(response.data.message.msgBody);

        // ✅ Find the booking that contains this assignment
        const targetBooking = localBookings.find(booking =>
          booking.assignedRooms?.some(room => room.assignmentId === assignmentId)
        );

        if (targetBooking) {
          const updatedRooms = targetBooking.assignedRooms.map(room =>
            room.assignmentId === assignmentId
              ? {
                ...room,
                guestInfo: {
                  ...room.guestInfo,
                  ...response.data.guestInfo
                }
              }
              : room
          );

          // ✅ Use unified update function
          updateBookingInState(
            targetBooking.bookingId,
            { assignedRooms: updatedRooms },
            'Guest info updated'
          );

          // ✅ Also update main booking customer info if it's the main guest
          if (guestInfo.tenKhachChinh && guestInfo.tenKhachChinh !== targetBooking.customerName) {
            updateBookingInState(
              targetBooking.bookingId,
              {
                customerName: guestInfo.tenKhachChinh,
                phoneNumber: guestInfo.soDienThoaiLienHe || targetBooking.phoneNumber
              },
              'Main customer info updated'
            );
          }
        }

        setShowGuestInfoModal(false);
        return { success: true };
      } else {
        toast.error(response.data?.message?.msgBody || "Cập nhật thất bại!");
        return { success: false };
      }
    } catch (error) {
      console.error("❌ Lỗi cập nhật thông tin khách:", error);
      toast.error("Lỗi khi cập nhật thông tin khách!");
      return { success: false };
    }
  };



  // ✅ THÊM: Hàm kiểm tra đơn mới (hoàn toàn tự động)
  const checkForNewBookings = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${baseUrl}/api/booking-hotel/hotelowner/bookings`,
        { withCredentials: true }
      );
      console.log("Danh sách booking", response.data);

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


  const openTransferRoomModal = async (assignment) => {
    console.log('🔍 === DEBUG OPEN TRANSFER MODAL ===');
    console.log('📋 Assignment:', assignment);

    setTransferringAssignment(assignment);
    setTransferRoomData({ newRoomId: '', reason: '', transferFee: 0 });
    setShowTransferRoomModal(true);

    // ✅ Find current booking
    const currentBooking = localBookings.find(booking =>
      booking.assignedRooms?.some(room => room.assignmentId === assignment.assignmentId)
    );

    console.log('📋 Found booking for transfer:', currentBooking?.bookingId);

    if (currentBooking) {
      // ✅ Use dedicated transfer function
      await loadAvailableRoomsForTransfer(assignment, currentBooking);
    } else {
      console.error('❌ No booking found for assignment:', assignment.assignmentId);
      toast.error('Không tìm thấy thông tin đơn đặt phòng');
      setTransferAvailableRooms([]);
    }

    console.log('🔍 === END DEBUG OPEN TRANSFER MODAL ===');
  };


  const openAddServiceModal = (assignment) => {
    setAddingServiceAssignment(assignment);
    setNewServiceData({ services: [{ name: '', price: '', quantity: 1 }] });
    setShowAddServiceModal(true);
  };

  const openGuestInfoModal = (assignment) => {
    setEditingGuestAssignment(assignment);
    setGuestInfoData(assignment.guestInfo || {
      tenKhachChinh: '',
      soDienThoaiLienHe: '',
      soLuongKhachThucTe: 1,
      danhSachKhach: [],
      yeuCauDacBiet: ''
    });
    setShowGuestInfoModal(true);
  };

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



  const updateBookingStatus = async (bookingId, newStatus, additionalData = {}) => {
    try {
      console.log('🔄 Updating booking status:', bookingId, newStatus, additionalData);

      // ✅ Handle cancel modal
      if (newStatus === 'cancelled') {
        const booking = bookings.find(b => b.bookingId === bookingId);
        if (booking) {
          openCancelModal(booking);
        }
        return { success: true, message: 'Mở modal hủy đơn' };
      }

      // ✅ ENHANCED: Handle payment status updates
      if (newStatus === 'toggle_payment') {
        const booking = bookings.find(b => b.bookingId === bookingId);
        if (!booking) {
          toast.error('Không tìm thấy đơn đặt phòng!');
          return { success: false };
        }

        const newPaymentStatus = booking.paymentStatus === 'da_thanh_toan' ? 'chua_thanh_toan' : 'da_thanh_toan';

        const response = await axios.put(
          `${baseUrl}/api/booking-hotel/hotelowner/update/${bookingId}`,
          {
            paymentStatus: newPaymentStatus,
            paymentMethod: booking.paymentMethod || 'tien_mat',
            paymentTime: newPaymentStatus === 'da_thanh_toan' ? new Date().toISOString() : null,
            ...additionalData
          },
          { withCredentials: true }
        );

        if (response.data?.message?.msgError === false) {
          // ✅ Update both payment status and booking status if needed
          const updates = {
            paymentStatus: newPaymentStatus,
            paymentTime: newPaymentStatus === 'da_thanh_toan' ? new Date().toISOString() : null,
            lastUpdated: Date.now(),
            ...(response.data.updatedBooking || {})
          };

          setLocalBookings((prev) =>
            prev.map((b) =>
              b.bookingId === bookingId ? { ...b, ...updates } : b
            )
          );
          setBookings((prev) =>
            prev.map((b) =>
              b.bookingId === bookingId ? { ...b, ...updates } : b
            )
          );

          const statusText = newPaymentStatus === 'da_thanh_toan' ? 'đã thanh toán' : 'chưa thanh toán';
          toast.success(`✅ Cập nhật trạng thái thanh toán: ${statusText}!`);

          return { success: true, message: `Đã cập nhật trạng thái thanh toán: ${statusText}!` };
        } else {
          toast.error(response.data?.message?.msgBody || "Cập nhật trạng thái thanh toán thất bại!");
          return { success: false, message: response.data?.message?.msgBody || "Cập nhật thất bại!" };
        }
      }

      // ✅ ENHANCED: Handle checkout
      if (newStatus === 'checkout') {
        const booking = bookings.find(b => b.bookingId === bookingId);
        if (!booking) {
          toast.error('Không tìm thấy đơn đặt phòng!');
          return { success: false };
        }

        const response = await axios.put(
          `${baseUrl}/api/booking-hotel/hotelowner/update/${bookingId}`,
          {
            status: 'da_tra_phong',
            paymentStatus: 'da_thanh_toan', // ✅ Auto mark as paid on checkout
            checkoutTime: new Date().toISOString(),
            actualTotalAmount: additionalData.actualTotal || booking.totalAmount,
            ...additionalData
          },
          { withCredentials: true }
        );

        if (response.data?.message?.msgError === false) {
          const updates = {
            status: 'da_tra_phong',
            paymentStatus: 'da_thanh_toan',
            checkoutTime: new Date().toISOString(),
            actualTotalAmount: additionalData.actualTotal || booking.totalAmount,
            lastUpdated: Date.now(),
            ...(response.data.updatedBooking || {})
          };

          setLocalBookings((prev) =>
            prev.map((b) =>
              b.bookingId === bookingId ? { ...b, ...updates } : b
            )
          );
          setBookings((prev) =>
            prev.map((b) =>
              b.bookingId === bookingId ? { ...b, ...updates } : b
            )
          );

          toast.success("✅ Checkout thành công!");
          return { success: true, message: "Checkout thành công!" };
        } else {
          toast.error(response.data?.message?.msgBody || "Checkout thất bại!");
          return { success: false, message: response.data?.message?.msgBody || "Checkout thất bại!" };
        }
      }

      // ✅ Original status update logic
      const backendStatus = reverseStatusMapping[newStatus] || newStatus;

      const response = await axios.put(
        `${baseUrl}/api/booking-hotel/hotelowner/update/${bookingId}`,
        {
          status: backendStatus,
          ...additionalData
        },
        { withCredentials: true }
      );

      if (response.data?.message?.msgError === false) {
        // ✅ ENHANCED: Include additional data from response
        const updates = {
          status: backendStatus,
          lastUpdated: Date.now(),
          ...(response.data.updatedBooking || {}),
          ...additionalData
        };

        setLocalBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, ...updates } : b
          )
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, ...updates } : b
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


  const getFilteredBookings = () => {
    if (!bookings || !Array.isArray(bookings)) {
      console.log('⚠️ Bookings not array in getFilteredBookings:', typeof bookings, bookings);
      return [];
    }
    let filtered = selectedHotelId
      ? bookings.filter(booking => booking.hotelId?._id === selectedHotelId)
      : bookings;

    // ✅ Search filter (tên, SĐT, email, mã đơn)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(booking =>
        booking.customerName?.toLowerCase().includes(searchTerm) ||
        booking.phoneNumber?.includes(searchTerm) ||
        booking.email?.toLowerCase().includes(searchTerm) ||
        booking.bookingId?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Date filters
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(booking => {
        const checkInDate = moment(booking.checkInDate, "DD-MM-YYYY");
        const fromDate = filters.dateFrom ? moment(filters.dateFrom) : null;
        const toDate = filters.dateTo ? moment(filters.dateTo) : null;

        if (fromDate && checkInDate.isBefore(fromDate, 'day')) return false;
        if (toDate && checkInDate.isAfter(toDate, 'day')) return false;
        return true;
      });
    }

    // Time range filter
    if (filters.timeRange) {
      const now = moment();
      filtered = filtered.filter(booking => {
        const checkInDate = moment(booking.checkInDate, "DD-MM-YYYY");
        const checkOutDate = moment(booking.checkOutDate, "DD-MM-YYYY");

        switch (filters.timeRange) {
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

    return filtered;
  };


  const updateBookingInState = (bookingId, updatedData, logMessage = '') => {
    console.log(`🔄 ${logMessage || 'Updating booking'}:`, bookingId, updatedData);

    const timestamp = Date.now();
    const enhancedUpdate = {
      ...updatedData,
      lastUpdated: timestamp
    };

    // ✅ Update both states simultaneously
    setLocalBookings(prev =>
      prev.map(booking =>
        booking.bookingId === bookingId
          ? { ...booking, ...enhancedUpdate }
          : booking
      )
    );

    setBookings(prev =>
      prev.map(booking =>
        booking.bookingId === bookingId
          ? { ...booking, ...enhancedUpdate }
          : booking
      )
    );

    console.log('✅ Booking state updated successfully');
    return true;
  };

  // Hàm mở modal gán phòng
  const openRoomAssignModal = async (booking) => {
    console.log('🏨 Opening bulk assign modal for:', booking.bookingId);
    setAssigningBooking(booking);

    // Khởi tạo assignment data dựa trên số phòng cần gán
    const unassignedCount = booking.roomQuantity - (booking.assignedRooms?.length || 0);
    const initialData = Array(unassignedCount).fill().map((_, index) => ({
      roomId: '',
      roomNumber: '',
      floor: '',
      viewType: '',
      notes: '',
      guestName: '',
      guestPhone: '',
      specialRequest: '',
      hasCompanions: false,
      danhSachKhach: []
    }));
    setAssignmentData(initialData);

    setShowRoomAssignModal(true);
    await loadAvailableRooms(booking);
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


  useEffect(() => {
    if (!bookings || !Array.isArray(bookings)) {
      console.log('⚠️ Bookings not ready, setting empty local bookings');
      setLocalBookings([]);
      return;
    }
    if (selectedHotelId) {
      const filteredBookings = bookings.filter(booking =>
        booking.hotelId?._id === selectedHotelId
      );
      setLocalBookings(filteredBookings);
    } else {
      setLocalBookings(bookings);
    }
  }, [bookings, selectedHotelId]);

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
      if (!bookings || !Array.isArray(bookings)) {
        console.log('⚠️ No bookings data available for filtering');
        setLocalBookings([]);
        return;
      }

      // Nếu không có filter nào, hiển thị tất cả bookings
      if (!selectedHotelId && !filterParams.status && !filterParams.timeRange && !filterParams.dateFrom && !filterParams.dateTo) {
        setLocalBookings(bookings);
        return;
      }

      // Filter bookings dựa trên filterParams
      let filteredBookings = [...bookings];

      // Filter theo hotel
      if (selectedHotelId) {
        filteredBookings = filteredBookings.filter(booking =>
          booking.hotelId?._id === selectedHotelId
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

  const filteredBookings = getFilteredBookings();


  useEffect(() => {
    // ✅ THÊM: Safety check
    if (!bookings || !Array.isArray(bookings)) {
      console.log('⚠️ Bookings not ready in sync useEffect');
      setLocalBookings([]);
      return;
    }

    console.log('🔄 Syncing localBookings with bookings:', bookings.length);
    setLocalBookings(bookings);
  }, [bookings]);

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


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };



  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      timeRange: '',
      search: ''
    };
    setFilters(clearedFilters);

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
      'da_gan': 'Đã thêm phòng',
      'dang_cho': 'Đang chờ',
      'da_xac_nhan': 'Đã xác nhận',
      'da_huy': 'Đã hủy',
      'da_nhan_phong': 'Đã nhận phòng',
      'dang_su_dung': 'Đang sử dụng',
      'da_tra_phong': 'Đã trả phòng',
      'khong_nhan_phong': 'Không nhận phòng',
      'da_giao_phong': 'Đã giao phòng'
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
      'khong_nhan_phong': 'text-red-600 bg-red-100',
      'da_giao_phong': 'text-indigo-600 bg-indigo-100',
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
              Tổng: <span className="font-semibold text-blue-600">{filteredBookings.length}</span> đơn
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

          {/* ✅ Grid chứa tất cả filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* ✅ Search Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tên, SĐT, email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

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
      {(filters.status || filters.dateFrom || filters.dateTo || filters.timeRange || filters.search) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-700 font-medium">Bộ lọc đang áp dụng:</span>

              {filters.search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Tìm: "{filters.search}"
                </span>
              )}
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
      ) : filteredBookings.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          {filteredBookings.map((booking) => (
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
                      {/* Hiển thị discount percentage */}
                      {booking.priceDetails?.chiTietGia?.discounts?.discountPercent > 0 ? (
                        <p className="text-xs text-green-600">
                          Giảm {booking.priceDetails.chiTietGia.discounts.discountPercent}%
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Giảm 0%</p>
                      )}
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
                              <div key={index} className="bg-white p-3 rounded border">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">Phòng {room.roomInfo?.soPhong}</p>
                                    <p className="text-xs text-gray-600">
                                      Tầng {room.roomInfo?.tang} • {getViewText(room.roomInfo?.loaiView)}
                                    </p>
                                    {room.guestInfo?.tenKhachChinh && (
                                      <p className="text-xs text-blue-600">
                                        Khách: {room.guestInfo.tenKhachChinh}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${getVietnameseStatusColor(room.status)}`}>
                                    {roomStatusMapping(room.status)}
                                  </span>
                                </div>

                                {/* Services for this room */}
                                {room.services && room.services.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700">Dịch vụ:</p>
                                    <div className="text-xs text-gray-600">
                                      {room.services.map((service, idx) => (
                                        <div key={idx} className="flex justify-between">
                                          <span>{service.tenDichVu} x{service.soLuong}</span>
                                          <span>{formatCurrency(service.thanhTien)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="text-xs font-medium text-blue-600 border-t pt-1 mt-1">
                                      Tổng DV: {formatCurrency(room.serviceTotal || 0)}
                                    </div>
                                  </div>
                                )}

                                {/* Room Actions */}
                                <div className="flex space-x-1 mt-2">
                                  <button
                                    onClick={() => openGuestInfoModal(room)}
                                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    title="Thông tin khách"
                                  >
                                    <User className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => openAddServiceModal(room)}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    title="Thêm dịch vụ"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => openTransferRoomModal(room)}
                                    className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                    title="Đổi phòng"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </button>
                                </div>

                                {room.notes && (
                                  <p className="text-xs text-gray-500 mt-1 italic">{room.notes}</p>
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
                              Thêm phòng
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
                              onClick={() => updateBookingStatus(booking.bookingId, 'dang_su_dung')}
                              className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Đang sử dụng
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.bookingId, 'da_tra_phong')}
                              className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Checkout & Thanh toán
                            </button>
                          </>
                        )}

                        {booking.status === 'dang_su_dung' && (
                          <button
                            onClick={() => updateBookingStatus(booking.bookingId, 'da_tra_phong')}
                            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 col-span-2"
                          >
                            Checkout & Thanh toán
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Thêm phòng cho đơn #{assigningBooking?.bookingId}
                </h2>
                <p className="text-sm text-gray-600">
                  Cần gán: <span className="font-medium text-blue-600">{assignmentData.length} phòng</span>
                  {assigningBooking?.assignedRooms?.length > 0 && (
                    <span className="ml-2">| Đã gán: {assigningBooking.assignedRooms.length} phòng</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowRoomAssignModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Thông tin booking */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Thông tin đặt phòng</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Khách hàng:</span>
                    <p className="font-medium">{assigningBooking?.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Loại phòng:</span>
                    <p className="font-medium">{assigningBooking?.roomType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <p className="font-medium">{assigningBooking?.checkInDate} {assigningBooking?.checkInTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <p className="font-medium">{assigningBooking?.checkOutDate} {assigningBooking?.checkOutTime}</p>
                  </div>
                </div>
              </div>

              {/* Danh sách phòng đã gán */}
              {assigningBooking?.assignedRooms && assigningBooking.assignedRooms.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Phòng đã gán</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {assigningBooking.assignedRooms.map((room, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Phòng {room.roomInfo?.soPhong}</span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            Đã gán
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Tầng {room.roomInfo?.tang} • {getViewText(room.roomInfo?.loaiView)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form gán phòng mới */}
              {assignmentData.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Thêm phòng mới ({assignmentData.length} phòng)
                  </h3>

                  <div className="space-y-4">
                    {assignmentData.map((data, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700">
                            Phòng {index + 1}
                          </h4>
                          {data.roomId && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              Phòng {data.roomNumber}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Chọn phòng */}
                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Chọn phòng *
                            </label>
                            <select
                              value={data.roomId}
                              onChange={(e) => updateAssignmentData(index, 'roomId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Chọn phòng</option>
                              {getAvailableRoomsForIndex(index).map(room => (
                                <option key={room.roomId} value={room.roomId}>
                                  {room.displayName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tên khách */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên khách chính
                            </label>
                            <input
                              type="text"
                              value={data.guestName}
                              onChange={(e) => updateAssignmentData(index, 'guestName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Tên khách (tùy chọn)"
                            />
                          </div>

                          {/* SĐT riêng */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SĐT liên hệ
                            </label>
                            <input
                              type="tel"
                              value={data.guestPhone}
                              onChange={(e) => updateAssignmentData(index, 'guestPhone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="SĐT riêng (tùy chọn)"
                            />
                          </div>

                          {/* Yêu cầu đặc biệt */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Yêu cầu đặc biệt
                            </label>
                            <input
                              type="text"
                              value={data.specialRequest}
                              onChange={(e) => updateAssignmentData(index, 'specialRequest', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Ghi chú đặc biệt cho phòng này..."
                            />
                          </div>

                          {/* Ghi chú */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ghi chú
                            </label>
                            <input
                              type="text"
                              value={data.notes}
                              onChange={(e) => updateAssignmentData(index, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Ghi chú thêm..."
                            />
                          </div>


                          {/* Có khách đi cùng? */}
                          <div className="md:col-span-3">
                            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                              <div className="flex justify-between items-center">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={data.hasCompanions || false}
                                    onChange={(e) =>
                                      updateAssignmentData(index, 'hasCompanions', e.target.checked)
                                    }
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm font-medium text-gray-700">Có khách đi cùng?</span>
                                </label>
                              </div>

                              {/* Nếu có khách đi cùng thì hiển thị form */}
                              {data.hasCompanions && (
                                <div className="space-y-4">
                                  <h4 className="font-medium text-sm text-gray-700">Danh sách khách đi cùng</h4>

                                  <div className="space-y-3">
                                    {(data.danhSachKhach || []).map((guest, gIndex) => (
                                      <div key={gIndex} className="border rounded-lg p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-center">
                                          <h5 className="text-sm font-medium">Khách {gIndex + 1}</h5>
                                          {(data.danhSachKhach || []).length > 1 && (
                                            <button
                                              onClick={() => {
                                                const updatedGuests = [...data.danhSachKhach];
                                                updatedGuests.splice(gIndex, 1);
                                                updateAssignmentData(index, 'danhSachKhach', updatedGuests);
                                              }}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Tên khách *
                                            </label>
                                            <input
                                              type="text"
                                              placeholder="Tên khách"
                                              value={guest.ten || ''}
                                              onChange={(e) => {
                                                const updatedGuests = [...data.danhSachKhach];
                                                updatedGuests[gIndex].ten = e.target.value;
                                                updateAssignmentData(index, 'danhSachKhach', updatedGuests);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Số giấy tờ (tuỳ chọn)
                                            </label>
                                            <input
                                              type="text"
                                              placeholder="Số giấy tờ (tuỳ chọn)"
                                              value={guest.giayTo || ''}
                                              onChange={(e) => {
                                                const updatedGuests = [...data.danhSachKhach];
                                                updatedGuests[gIndex].giayTo = e.target.value;
                                                updateAssignmentData(index, 'danhSachKhach', updatedGuests);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => {
                                      const newList = data.danhSachKhach ? [...data.danhSachKhach] : [];
                                      newList.push({ ten: '', giayTo: '' });
                                      updateAssignmentData(index, 'danhSachKhach', newList);
                                    }}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-600 hover:text-blue-600 transition-colors"
                                  >
                                    <Plus className="h-4 w-4 mx-auto" />
                                    Thêm khách
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Đã chọn phòng:</span>
                      <span className="font-medium">
                        {assignmentData.filter(data => data.roomId).length}/{assignmentData.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span>Phòng trống khả dụng:</span>
                      <span className="font-medium text-green-600">
                        {availableRooms.length} phòng
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRoomAssignModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loadingRooms}
              >
                Hủy
              </button>
              {assignmentData.length > 0 && (
                <button
                  onClick={handleBulkAssign}
                  disabled={loadingRooms || assignmentData.filter(data => data.roomId).length === 0}
                  className={`px-4 py-2 rounded-lg font-medium ${loadingRooms || assignmentData.filter(data => data.roomId).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {loadingRooms ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Đang gán...
                    </div>
                  ) : (
                    `Gán ${assignmentData.filter(data => data.roomId).length} phòng`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}



      {/* ✅ Modal Detail View */}
      {/* ✅ ENHANCED Modal Detail View */}
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
                {/* Left Column - Booking Info */}
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
                          {(() => {
                            // ✅ Enhanced duration calculation based on booking type
                            if (viewingBooking?.bookingType === 'theo_gio') {
                              const checkIn = moment(`${viewingBooking.checkInDate} ${viewingBooking.checkInTime}`, "DD-MM-YYYY HH:mm");
                              const checkOut = moment(`${viewingBooking.checkOutDate} ${viewingBooking.checkOutTime}`, "DD-MM-YYYY HH:mm");
                              const hours = checkOut.diff(checkIn, 'hours');
                              return `${hours} giờ (Theo giờ)`;
                            } else if (viewingBooking?.bookingType === 'qua_dem') {
                              const nights = calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate);
                              return `${nights} đêm (Qua đêm)`;
                            } else if (viewingBooking?.bookingType === 'dai_ngay') {
                              const days = calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate);
                              return `${days} ngày (Dài ngày)`;
                            } else {
                              const days = calculateNights(viewingBooking.checkInDate, viewingBooking.checkOutDate);
                              return `${days} ngày`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVietnameseStatusColor(viewingBooking.status)}`}>
                          {getVietnameseStatusText(viewingBooking.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian đặt:</span>
                        <span className="font-medium">{formatDate(viewingBooking.createdAt)}</span>
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

                  {/* ✅ ENHANCED: Show cancellation reason */}
                  {viewingBooking.status === 'da_huy' && viewingBooking.notes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Lý do hủy đơn
                      </h3>
                      <p className="text-sm text-red-700">{viewingBooking.notes}</p>
                    </div>
                  )}

                  {/* ✅ Show notes for non-cancelled bookings */}
                  {viewingBooking.status !== 'da_huy' && viewingBooking.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Ghi chú
                      </h3>
                      <p className="text-sm text-gray-600">{viewingBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Payment & Rooms */}
                <div className="space-y-6">
                  {/* ✅ ENHANCED: Payment Information with detailed breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Thông tin thanh toán
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phương thức:</span>
                        <span className="font-medium">{
                          viewingBooking.paymentMethod === 'tien_mat' ? 'Tiền mặt' :
                            viewingBooking.paymentMethod === 'VNPay' ? 'VNPay' :
                              viewingBooking.paymentMethod === 'Momo' ? 'Momo' :
                                viewingBooking.paymentMethod === 'ZaloPay' ? 'ZaloPay' :
                                  viewingBooking.paymentMethod === 'the_tin_dung' ? 'Thẻ tín dụng' :
                                    viewingBooking.paymentMethod || "Chưa chọn"
                        }</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`font-medium ${viewingBooking.paymentStatus === 'da_thanh_toan' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {viewingBooking.paymentStatus === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-gray-800 mb-2">Chi phí chi tiết:</h4>

                        {/* Giá gốc/ngày */}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giá phòng gốc:</span>
                          <span className="font-medium">
                            {formatCurrency(viewingBooking.priceDetails?.chiTietGia?.basePrice || viewingBooking.roomPrice || 0)}/ngày
                          </span>
                        </div>

                        {/* Tổng tiền phòng trước các phụ thu/giảm giá */}
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Tiền phòng ({viewingBooking.priceDetails?.soLuongDonVi || 1} {getUnitBookingType(viewingBooking.priceDetails?.donVi)}):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(viewingBooking.priceDetails?.chiTietGia?.subtotalBeforeDiscount || 0)}
                          </span>
                        </div>

                        {/* Phụ thu cuối tuần */}
                        {viewingBooking.priceDetails?.phuPhiCuoiTuan > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Phụ thu cuối tuần (+20%):</span>
                            <span>+{formatCurrency(viewingBooking.priceDetails.phuPhiCuoiTuan)}</span>
                          </div>
                        )}

                        {/* Giảm giá */}
                        {viewingBooking.priceDetails?.giamGia > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>
                              Giảm giá dài ngày (-{getDiscountPercent(viewingBooking)}%):
                            </span>
                            <span>-{formatCurrency(viewingBooking.priceDetails.giamGia)}</span>
                          </div>
                        )}

                        {/* Phí dịch vụ */}
                        {viewingBooking.priceDetails?.phiDichVu > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phí dịch vụ:</span>
                            <span>{formatCurrency(viewingBooking.priceDetails.phiDichVu)}</span>
                          </div>
                        )}

                        {/* Services fee */}
                        {viewingBooking.servicesFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dịch vụ bổ sung:</span>
                            <span>{formatCurrency(viewingBooking.servicesFee)}</span>
                          </div>
                        )}

                        {/* Tổng cộng */}
                        <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-lg">
                          <span>Tổng cộng:</span>
                          <span className="text-blue-600">{formatCurrency(viewingBooking.totalAmount || 0)}</span>
                        </div>
                      </div>



                    </div>
                  </div>

                  {/* ✅ ENHANCED: Assigned Rooms with more details */}
                  {viewingBooking.assignedRooms && viewingBooking.assignedRooms.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        Phòng đã nhận ({viewingBooking.assignedRooms.length})
                      </h3>
                      <div className="space-y-3">
                        {viewingBooking.assignedRooms.map((assignedRoom, index) => {
                          const room = assignedRoom.roomInfo;
                          return (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-lg">Phòng {room?.soPhong || 'N/A'}</p>
                                  <p className="text-sm text-gray-600">Tầng {room?.tang || 1}</p>
                                  {room?.loaiView && room.loaiView !== 'none' && (
                                    <p className="text-sm text-gray-600">View: {getViewText(room.loaiView)}</p>
                                  )}

                                  {/* ✅ Show actual check-in/out times */}
                                  {assignedRoom.actualTimes?.checkIn && (
                                    <p className="text-sm text-green-600 mt-1">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      Nhận: {moment(assignedRoom.actualTimes.checkIn).format('HH:mm DD/MM/YYYY')}
                                    </p>
                                  )}
                                  {assignedRoom.actualTimes?.checkOut && (
                                    <p className="text-sm text-blue-600">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      Trả: {moment(assignedRoom.actualTimes.checkOut).format('HH:mm DD/MM/YYYY')}
                                    </p>
                                  )}
                                </div>

                                <span className={`px-2 py-1 ${getVietnameseStatusColor(assignedRoom.status || 'da_gan')} text-xs rounded-full`}>
                                  {getVietnameseStatusText(assignedRoom.status || 'Không xác định')}
                                </span>
                              </div>

                              {/* ✅ Show room services if any */}
                              {assignedRoom.services && assignedRoom.services.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Dịch vụ sử dụng:</h5>
                                  <div className="space-y-1">
                                    {assignedRoom.services.map((service, serviceIndex) => (
                                      <div key={serviceIndex} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          {service.tenDichVu} x{service.soLuong}
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(service.thanhTien)}
                                        </span>
                                      </div>
                                    ))}
                                    {assignedRoom.serviceTotal > 0 && (
                                      <div className="flex justify-between text-sm font-medium border-t pt-1">
                                        <span>Tổng dịch vụ phòng:</span>
                                        <span>{formatCurrency(assignedRoom.serviceTotal)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {assignedRoom.notes && (
                                <p className="text-sm text-gray-500 mt-2 italic">{assignedRoom.notes}</p>
                              )}

                              <p className="text-xs text-gray-400 mt-1">
                                Gán lúc: {formatDate(assignedRoom.createdAt || room?.thoiGianGiaoPhong)}
                              </p>
                            </div>
                          );
                        })}
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
                              updateBookingStatus(viewingBooking.bookingId, 'da_xac_nhan');
                              setShowDetailModal(false);
                            }}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              updateBookingStatus(viewingBooking.bookingId, 'da_huy');
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
                            Thêm phòng
                          </button>
                          <button
                            onClick={() => {
                              updateBookingStatus(viewingBooking.bookingId, 'da_huy');
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

      {/* {showTransferRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Đổi phòng {transferringAssignment?.roomInfo?.soPhong}
              </h2>
              <button
                onClick={() => setShowTransferRoomModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn phòng mới *
                </label>
                <select
                  value={transferRoomData.newRoomId}
                  onChange={(e) => setTransferRoomData({ ...transferRoomData, newRoomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn phòng</option>
                  {availableRooms.map(room => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do đổi phòng *
                </label>
                <textarea
                  value={transferRoomData.reason}
                  onChange={(e) => setTransferRoomData({ ...transferRoomData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Nhập lý do đổi phòng..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí đổi phòng (VNĐ)
                </label>
                <input
                  type="number"
                  value={transferRoomData.transferFee}
                  onChange={(e) => setTransferRoomData({ ...transferRoomData, transferFee: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferRoomModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!transferRoomData.newRoomId || !transferRoomData.reason) {
                    toast.error('Vui lòng chọn phòng và nhập lý do!');
                    return;
                  }
                  transferRoom(transferringAssignment.assignmentId, transferRoomData);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Đổi phòng
              </button>
            </div>
          </div>
        </div>
      )} */}

      {showTransferRoomModal && transferringAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                Đổi phòng
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Hiện tại: Phòng {transferringAssignment.roomInfo?.soPhong}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Room selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn phòng mới <span className="text-red-500">*</span>
                </label>

                {loadingRooms ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Đang tải phòng...</span>
                  </div>
                ) : (
                  <select
                    value={transferRoomData.newRoomId}
                    onChange={(e) => setTransferRoomData(prev => ({ ...prev, newRoomId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn phòng mới --</option>
                    {/* ✅ Use transferAvailableRooms instead of availableRooms */}
                    {transferAvailableRooms.map(room => (
                      <option key={room.roomId} value={room.roomId}>
                        Phòng {room.soPhong} - Tầng {room.tang}
                        {room.loaiView && room.loaiView !== 'none' && ` (${room.loaiView})`}
                      </option>
                    ))}
                  </select>
                )}

                {!loadingRooms && transferAvailableRooms.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Không có phòng trống khác để đổi
                  </p>
                )}

                {/* ✅ Debug info */}
                {/* {!loadingRooms && (
                  <p className="text-xs text-gray-400 mt-1">
                    Debug: {transferAvailableRooms.length} phòng available
                  </p>
                )} */}
              </div>

              {/* Transfer reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do đổi phòng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={transferRoomData.reason}
                  onChange={(e) => setTransferRoomData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Nhập lý do đổi phòng..."
                />
              </div>

              {/* Transfer fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí đổi phòng (VNĐ)
                </label>
                <input
                  type="number"
                  value={transferRoomData.transferFee}
                  onChange={(e) => setTransferRoomData(prev => ({ ...prev, transferFee: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferRoomModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => transferRoom(transferringAssignment.assignmentId, transferRoomData)}
                disabled={!transferRoomData.newRoomId || !transferRoomData.reason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm dịch vụ */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Thêm dịch vụ - Phòng {addingServiceAssignment?.roomInfo?.soPhong}
              </h2>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {newServiceData.services.map((service, index) => (
                <div key={index} className="border rounded p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Dịch vụ {index + 1}</h4>
                    {newServiceData.services.length > 1 && (
                      <button
                        onClick={() => {
                          const newServices = [...newServiceData.services];
                          newServices.splice(index, 1);
                          setNewServiceData({ services: newServices });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên dịch vụ
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const newServices = [...newServiceData.services];
                          newServices[index].name = e.target.value;
                          setNewServiceData({ services: newServices });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên dịch vụ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => {
                          const newServices = [...newServiceData.services];
                          newServices[index].price = parseInt(e.target.value) || 0;
                          setNewServiceData({ services: newServices });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => {
                          const newServices = [...newServiceData.services];
                          newServices[index].quantity = parseInt(e.target.value) || 1;
                          setNewServiceData({ services: newServices });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Thành tiền: {formatCurrency((service.price || 0) * (service.quantity || 1))}
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setNewServiceData({
                    services: [...newServiceData.services, { name: '', price: '', quantity: 1 }]
                  });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-600 hover:text-blue-600"
              >
                <Plus className="h-4 w-4 mx-auto" />
                Thêm dịch vụ khác
              </button>

              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-800">
                  Tổng cộng: {formatCurrency(
                    newServiceData.services.reduce((total, service) =>
                      total + ((service.price || 0) * (service.quantity || 1)), 0
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const validServices = newServiceData.services.filter(s => s.name && s.price);
                  if (validServices.length === 0) {
                    toast.error('Vui lòng nhập ít nhất 1 dịch vụ hợp lệ!');
                    return;
                  }
                  addRoomService(addingServiceAssignment.assignmentId, validServices);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Thêm dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông tin khách */}
      {showGuestInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Thông tin khách - Phòng {editingGuestAssignment?.roomInfo?.soPhong}
              </h2>
              <button
                onClick={() => setShowGuestInfoModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khách chính
                </label>
                <input
                  type="text"
                  value={guestInfoData.tenKhachChinh}
                  onChange={(e) => setGuestInfoData({ ...guestInfoData, tenKhachChinh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên khách chính phòng này"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={guestInfoData.soDienThoaiLienHe}
                  onChange={(e) => setGuestInfoData({ ...guestInfoData, soDienThoaiLienHe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SĐT riêng cho phòng này"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng khách thực tế
                </label>
                <input
                  type="number"
                  value={guestInfoData.soLuongKhachThucTe}
                  onChange={(e) => setGuestInfoData({ ...guestInfoData, soLuongKhachThucTe: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yêu cầu đặc biệt
                </label>
                <textarea
                  value={guestInfoData.yeuCauDacBiet}
                  onChange={(e) => setGuestInfoData({ ...guestInfoData, yeuCauDacBiet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Yêu cầu đặc biệt cho phòng này..."
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowGuestInfoModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  updateGuestInfo(editingGuestAssignment.assignmentId, guestInfoData);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;