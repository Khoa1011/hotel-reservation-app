import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  BedDouble,
  Users,
  Eye,
  History,
  Wifi,
  Coffee
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const RoomDetailModal = ({ showModal, onClose, roomId }) => {
  const [roomDetail, setRoomDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'da_xac_nhan':
        return 'bg-blue-100 text-blue-800';
      case 'da_nhan_phong':
        return 'bg-green-100 text-green-800';
      case 'dang_su_dung':
        return 'bg-purple-100 text-purple-800';
      case 'da_tra_phong':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'da_xac_nhan':
        return 'Đã xác nhận';
      case 'da_nhan_phong':
        return 'Đã nhận phòng';
      case 'dang_su_dung':
        return 'Đang sử dụng';
      case 'da_tra_phong':
        return 'Đã trả phòng';
      default:
        return 'Không xác định';
    }
  };

  const getBookingTypeText = (type) => {
    switch (type) {
      case 'theo_gio':
        return 'Theo giờ';
      case 'qua_dem':
        return 'Qua đêm';
      case 'dai_ngay':
        return 'Theo ngày';
      default:
        return 'Không xác định';
    }
  };

  const getViewText = (viewType) => {
    const viewTexts = {
      'sea_view': 'View biển',
      'city_view': 'View thành phố',
      'garden_view': 'View vườn',
      'mountain_view': 'View núi',
      'pool_view': 'View hồ bơi',
      'none': 'Không có view đặc biệt'
    };
    return viewTexts[viewType] || 'Không xác định';
  };

  const fetchRoomDetail = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      console.log("Mã phòng: ", roomId);
      const response = await axios.get(
        `${baseUrl}/api/room-hotel/hotelowner/room-detail/${roomId}`,
        { withCredentials: true }
      );

      console.log("Chi tiết phòng: ", response.data);
      if (response.data?.success) {
        // Kiểm tra nếu API trả về data với structure mới (có currentGuest, currentBooking)
        if (response.data.data) {
          setRoomDetail(response.data.data);
        } else {
          // Nếu API trả về structure cũ (chỉ có room info)
          setRoomDetail({
            room: {
              roomId: response.data.room._id,
              roomNumber: response.data.room.soPhong,
              floor: response.data.room.tang,
              viewType: response.data.room.loaiView,
              area: response.data.room.dienTich,
              maxGuests: response.data.room.soLuongNguoiToiDa,
              bedCount: response.data.room.soLuongGiuong,
              bedConfig: response.data.room.cauHinhGiuong,
              description: response.data.room.moTa,
              status: response.data.room.trangThaiPhong,
              images: response.data.room.hinhAnh || []
            },
            roomType: {
              name: response.data.room.maLoaiPhong?.tenLoaiPhong,
              basePrice: response.data.room.maLoaiPhong?.giaCa,
              capacity: response.data.room.maLoaiPhong?.soLuongKhach,
              description: response.data.room.maLoaiPhong?.moTa
            },
            currentGuest: null,
            currentBooking: null,
            duration: null,
            pricing: null,
            services: [],
            recentHistory: []
          });
        }
      } else {
        toast.error('Không thể lấy chi tiết phòng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết phòng:', error);
      toast.error('Lỗi khi lấy chi tiết phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && roomId) {
      fetchRoomDetail();
    }
  }, [showModal, roomId]);

  const handleClose = () => {
    setRoomDetail(null);
    onClose();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Chi tiết phòng {roomDetail?.room?.roomNumber || ''}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Đang tải chi tiết phòng...</p>
          </div>
        )}

        {/* Content */}
        {!loading && roomDetail && (
          <div className="p-6 space-y-6">
            {/* Room Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Room Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BedDouble className="w-5 h-5" />
                  Thông tin phòng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Số phòng:</span>
                    <span className="font-medium">{roomDetail.room.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tầng:</span>
                    <span>{roomDetail.room.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loại phòng:</span>
                    <span>{roomDetail.roomType?.name || 'Không có thông tin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diện tích:</span>
                    <span>{roomDetail.room.area}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sức chứa:</span>
                    <span>{roomDetail.room.maxGuests} người</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số giường:</span>
                    <span>{roomDetail.room.bedCount} giường</span>
                  </div>
                  <div className="flex justify-between">
                    <span>View:</span>
                    <span>{getViewText(roomDetail.room.viewType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá cơ bản:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(roomDetail.roomType?.basePrice || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Room Image */}
              {roomDetail.room.images && roomDetail.room.images.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Hình ảnh phòng
                  </h3>
                  <img
                    src={`${baseUrl}${roomDetail.room.images[0].url_anh}`}
                    alt={`Phòng ${roomDetail.room.roomNumber}`}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Hiển thị cảnh báo nếu không có thông tin booking */}
            {!roomDetail.currentGuest && !roomDetail.currentBooking && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  <h3 className="font-medium text-yellow-800">Thông tin booking không khả dụng</h3>
                </div>
                <p className="text-yellow-700 mt-1 text-sm">
                  API hiện tại chỉ trả về thông tin phòng. Để hiển thị thông tin khách hàng và booking, 
                  bạn cần cập nhật API endpoint để trả về thông tin booking và khách hàng đang sử dụng phòng.
                </p>
                <p className="text-yellow-700 mt-2 text-sm font-medium">
                  Phòng hiện tại: <span className="px-2 py-1 bg-yellow-200 rounded text-xs">
                    {roomDetail.room.status === 'da_dat' ? 'Đã đặt' : 'Đang sử dụng'}
                  </span>
                </p>
              </div>
            )}

            {/* Current Guest Info - chỉ hiển thị nếu có data */}
            {roomDetail.currentGuest && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin khách hiện tại
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{roomDetail.currentGuest.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{roomDetail.currentGuest.phoneNumber}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{roomDetail.currentGuest.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span>{roomDetail.currentGuest.cccd}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Booking Info - chỉ hiển thị nếu có data */}
            {roomDetail.currentBooking && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Thông tin đặt phòng hiện tại
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mã đặt phòng:</span>
                      <span className="font-medium">{roomDetail.currentBooking.bookingId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loại đặt:</span>
                      <span>{getBookingTypeText(roomDetail.currentBooking.bookingType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(roomDetail.currentBooking.status)}`}>
                        {getStatusText(roomDetail.currentBooking.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày tạo:</span>
                      <span>{roomDetail.currentBooking.createdAt}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nhận phòng:</span>
                      <span>{roomDetail.currentBooking.checkInDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trả phòng:</span>
                      <span>{roomDetail.currentBooking.checkOutDate}</span>
                    </div>
                    {roomDetail.currentBooking.checkInTime && (
                      <div className="flex justify-between">
                        <span>Giờ nhận:</span>
                        <span>{roomDetail.currentBooking.checkInTime}</span>
                      </div>
                    )}
                    {roomDetail.currentBooking.checkOutTime && (
                      <div className="flex justify-between">
                        <span>Giờ trả:</span>
                        <span>{roomDetail.currentBooking.checkOutTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                {roomDetail.currentBooking.notes && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <span className="text-sm font-medium">Ghi chú: </span>
                    <span className="text-sm">{roomDetail.currentBooking.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Duration & Pricing Info - chỉ hiển thị nếu có data */}
            {(roomDetail.duration || roomDetail.pricing) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                {roomDetail.duration && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Thời gian sử dụng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tổng thời gian:</span>
                        <span className="font-medium">{roomDetail.duration.total} {roomDetail.duration.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đã sử dụng:</span>
                        <span>{roomDetail.duration.elapsed} {roomDetail.duration.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Còn lại:</span>
                        <span className="text-blue-600 font-medium">{roomDetail.duration.remaining} {roomDetail.duration.unit}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {roomDetail.pricing && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Thông tin giá
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Giá cơ bản:</span>
                        <span>{formatCurrency(roomDetail.pricing.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giá theo {roomDetail.duration?.unit || 'đơn vị'}:</span>
                        <span>{formatCurrency(roomDetail.pricing.unitPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiền phòng:</span>
                        <span>{formatCurrency(roomDetail.pricing.roomPrice)}</span>
                      </div>
                      {roomDetail.pricing.serviceCharges > 0 && (
                        <div className="flex justify-between">
                          <span>Phí dịch vụ:</span>
                          <span>{formatCurrency(roomDetail.pricing.serviceCharges)}</span>
                        </div>
                      )}
                      {roomDetail.pricing.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá:</span>
                          <span>-{formatCurrency(roomDetail.pricing.discount)}</span>
                        </div>
                      )}
                      {roomDetail.pricing.surcharge > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Phụ phí cuối tuần:</span>
                          <span>+{formatCurrency(roomDetail.pricing.surcharge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Tổng tiền:</span>
                        <span className="text-blue-600">{formatCurrency(roomDetail.pricing.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services Used - chỉ hiển thị nếu có data */}
            {roomDetail.services && roomDetail.services.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Dịch vụ đang sử dụng
                </h3>
                <div className="space-y-2">
                  {roomDetail.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white rounded p-2">
                      <span>{service.tenDichVu}</span>
                      <div className="text-right">
                        <div>SL: {service.soLuong}</div>
                        <div className="font-medium">{formatCurrency(service.thanhTien)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent History - chỉ hiển thị nếu có data */}
            {roomDetail.recentHistory && roomDetail.recentHistory.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Lịch sử gần đây
                </h3>
                <div className="space-y-2">
                  {roomDetail.recentHistory.slice(0, 3).map((booking, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white rounded p-2">
                      <div>
                        <div className="font-medium">{booking.guestName}</div>
                        <div className="text-gray-500">{booking.checkIn} - {booking.checkOut}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(booking.amount)}</div>
                        <div className="text-gray-500">{getBookingTypeText(booking.bookingType)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;