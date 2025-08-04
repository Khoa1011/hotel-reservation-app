import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Star,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Loader,
  X,
  AlertTriangle,
  History,
  CreditCard,
  Building2,
  Award,
  Clock,
  MoreHorizontal,
  User
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Hàm xử lý URL hình ảnh được cải thiện
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Nếu đã là URL đầy đủ (http/https)
  if (imagePath.startsWith('http')) return imagePath;

  // Nếu là path từ mobile app, trả về null để dùng fallback
  if (imagePath.includes('/data/user/') || 
      imagePath.includes('/cache/') || 
      imagePath.includes('com.example.')) {
    return null;
  }

  // Nếu là path server uploads
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }

  // Path khác, thêm baseUrl
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

// Component hiển thị hình ảnh với fallback
const ImageWithFallback = ({ src, alt, className, fallback = null, showIcon = false }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imageUrl = getImageUrl(src);

  // Nếu không có URL hợp lệ hoặc có lỗi, hiển thị fallback
  if (!imageUrl || imageError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        {showIcon ? (
          <User className="w-6 h-6 text-gray-400" />
        ) : fallback ? (
          <img
            src={fallback}
            alt={alt}
            className={className}
            onError={() => setImageError(true)}
          />
        ) : (
          <User className="w-6 h-6 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={`${className} bg-gray-100 flex items-center justify-center absolute inset-0`}>
          <Loader className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
    totalRecords: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sortBy: 'ngayTao',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get(`${baseUrl}/api/users-management/admin/users`, { params });

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalRecords: response.data.pagination.totalRecords
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Lỗi khi lấy danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/users-management/admin/users/${userId}`);

      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast.error('Không thể tải chi tiết người dùng');
    }
  };

  const fetchBookingHistory = async (userId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/users-management/admin/users/${userId}/booking-history`);

      if (response.data.success) {
        setBookingHistory(response.data.data);
        setShowBookingModal(true);
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
      toast.error('Không thể tải lịch sử đặt phòng');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus === 'hoatDong' ? 'cấm' : 'bỏ cấm'} người dùng này?`)) {
      return;
    }

    try {
      const response = await axios.put(`${baseUrl}/api/users-management/admin/users/${userId}/toggle-status`, {
        reason: currentStatus === 'hoatDong' ? 'Vi phạm quy định' : 'Đã khắc phục'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleBanBooking = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }

    try {
      const body = { reason: banReason };
      if (banDuration) body.duration = parseInt(banDuration);

      const response = await axios.put(`${baseUrl}/api/users-management/admin/users/${selectedUser._id}/toggle-booking`, body);

      if (response.data.success) {
        toast.success(response.data.message);
        setShowBanModal(false);
        setBanReason('');
        setBanDuration('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error banning booking:', error);
      toast.error('Không thể cập nhật quyền đặt phòng');
    }
  };

  const resetNoShow = async (userId) => {
    if (!confirm('Bạn có chắc muốn reset số lần không nhận phòng?')) {
      return;
    }

    try {
      const response = await axios.put(`${baseUrl}/api/users-management/admin/users/${userId}/reset-no-show`);

      if (response.data.success) {
        toast.success('Đã reset số lần không nhận phòng');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error resetting no show:', error);
      toast.error('Không thể reset số lần không nhận phòng');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VNĐ';
  };

  const formatRole = (role) => {
    const roles = {
      'nguoiDung': 'Người dùng',
      'chuKhachSan': 'Chủ khách sạn',
      'admin': 'Admin',
      'nhanVienKhachSan': 'Nhân viên'
    };
    return roles[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    // Xử lý định dạng ngày khác nhau
    let date;
    if (dateString.includes('/')) {
      // Định dạng DD/MM/YYYY
      const [day, month, year] = dateString.split('/');
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('vi-VN');
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') return 'Chưa cập nhật';

    const parts = [];
    if (address.soNha) parts.push(address.soNha);
    if (address.tenDuong) parts.push(address.tenDuong);
    if (address.phuong) parts.push(address.phuong);
    if (address.quan) parts.push(address.quan);
    if (address.tinhThanh) parts.push(address.tinhThanh);
    if (address.quocGia) parts.push(address.quocGia);

    return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'dang_cho': return 'bg-yellow-100 text-yellow-800';
      case 'da_xac_nhan': return 'bg-blue-100 text-blue-800';
      case 'da_nhan_phong': return 'bg-green-100 text-green-800';
      case 'dang_su_dung': return 'bg-green-100 text-green-800';
      case 'da_tra_phong': return 'bg-gray-100 text-gray-800';
      case 'da_huy': return 'bg-red-100 text-red-800';
      case 'khong_nhan_phong': return 'bg-orange-100 text-orange-800';
      case 'qua_gio': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'dang_cho': return 'Đang chờ';
      case 'da_xac_nhan': return 'Đã xác nhận';
      case 'da_nhan_phong': return 'Đã nhận phòng';
      case 'dang_su_dung': return 'Đang sử dụng';
      case 'da_tra_phong': return 'Đã trả phòng';
      case 'da_huy': return 'Đã hủy';
      case 'khong_nhan_phong': return 'Không nhận phòng';
      case 'qua_gio': return 'Quá giờ';
      default: return status;
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);

  const renderDetailModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ImageWithFallback
                  src={selectedUser.hinhDaiDien}
                  alt={selectedUser.tenNguoiDung}
                  className="w-16 h-16 rounded-full object-cover"
                  showIcon={true}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedUser.tenNguoiDung}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Thông tin cá nhân</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Họ tên:</span>
                    <span>{selectedUser.tenNguoiDung}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">SĐT:</span>
                    <span>{selectedUser.soDienThoai}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">CCCD:</span>
                    <span>{selectedUser.cccd || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">Giới tính:</span>
                    <span>{selectedUser.gioiTinh ? 'Nam' : 'Nữ'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Ngày sinh:</span>
                    <span>{formatDate(selectedUser.ngaySinh)}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <span className="font-medium mr-2">Địa chỉ:</span>
                    <span className="flex-1">{formatAddress(selectedUser.diaChi)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Thông tin tài khoản</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Vai trò:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedUser.vaiTro === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedUser.vaiTro === 'chuKhachSan' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                      {formatRole(selectedUser.vaiTro)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedUser.trangThaiTaiKhoan === 'hoatDong'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedUser.trangThaiTaiKhoan === 'hoatDong' ? 'Hoạt động' : 'Bị cấm'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Ngày tạo:</span>
                    <span>{formatDate(selectedUser.ngayTao)}</span>
                  </div>
                  {selectedUser.ngayCamDatPhong && new Date(selectedUser.ngayCamDatPhong) > new Date() && (
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-orange-400 mr-2" />
                      <span className="font-medium mr-2">Cấm đặt phòng đến:</span>
                      <span className="text-orange-600">{formatDate(selectedUser.ngayCamDatPhong)}</span>
                    </div>
                  )}
                  {selectedUser.soLanKhongNhanPhong > 0 && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2 ml-6">Cảnh báo không nhận phòng:</span>
                      <span className="text-red-600">{selectedUser.soLanKhongNhanPhong} lần</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Stats */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Thống kê đặt phòng</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.tongSoDonDat || 0}</div>
                  <div className="text-sm text-gray-600">Tổng đơn đặt</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedUser.donDatThanhCong || 0}</div>
                  <div className="text-sm text-gray-600">Thành công</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedUser.donDatHuy || 0}</div>
                  <div className="text-sm text-gray-600">Đã hủy</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedUser.soLanKhongNhanPhong || 0}</div>
                  <div className="text-sm text-gray-600">Không nhận phòng</div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền đã thanh toán</p>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrency(selectedUser.tongTienDaThanhToan || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* No Show History */}
            {selectedUser.lichSuKhongNhanPhong && selectedUser.lichSuKhongNhanPhong.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Lịch sử không nhận phòng</h3>
                <div className="space-y-2">
                  {selectedUser.lichSuKhongNhanPhong.map((item, index) => (
                    <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">
                            {formatDate(item.thoiGianQuaHan)}
                          </p>
                          <p className="text-sm text-orange-700">{item.lyDo}</p>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owned Hotels */}
            {selectedUser.vaiTro === 'chuKhachSan' && selectedUser.khachSanSoHuu && selectedUser.khachSanSoHuu.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Khách sạn sở hữu</h3>
                <div className="space-y-3">
                  {selectedUser.khachSanSoHuu.map((hotel, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <ImageWithFallback
                            src={hotel.hinhAnhKhachSan?.[0]}
                            alt={hotel.tenKhachSan}
                            className="w-12 h-12 rounded-lg object-cover"
                            showIcon={true}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{hotel.tenKhachSan || 'Chưa có tên'}</h4>
                          <p className="text-sm text-gray-600">
                            Địa chỉ: {typeof hotel.diaChi === 'object' ? formatAddress(hotel.diaChi) : (hotel.diaChi || 'Chưa cập nhật')}
                          </p>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-600">{hotel.soSao || 0}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Lịch sử đặt phòng</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách sạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày nhận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày trả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookingHistory.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={booking.maKhachSan?.hinhAnhKhachSan?.[0]}
                            alt={booking.maKhachSan?.tenKhachSan}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                            showIcon={true}
                          />
                          <div className="text-sm text-gray-900">
                            {booking.maKhachSan?.tenKhachSan}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.ngayNhanPhong)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.ngayTraPhong)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.thongTinGia?.tongDonDat)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.trangThai)}`}>
                          {getStatusText(booking.trangThai)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.thoiGianTaoDon)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBanModal = () => {
    const isBannedFromBooking = selectedUser?.ngayCamDatPhong && new Date(selectedUser.ngayCamDatPhong) > new Date();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {isBannedFromBooking ? 'Bỏ cấm đặt phòng' : 'Cấm đặt phòng'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số ngày cấm (để trống = vĩnh viễn)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Số ngày"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do *
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Nhập lý do cấm/bỏ cấm đặt phòng"
                required
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowBanModal(false);
                setBanReason('');
                setBanDuration('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleBanBooking}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderActionsDropdown = (user) => {
    const isBannedFromBooking = user.ngayCamDatPhong && new Date(user.ngayCamDatPhong) > new Date();

    return (
      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
        <button
          onClick={() => {
            fetchUserDetail(user._id);
            setShowActionsDropdown(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Xem chi tiết
        </button>

        <button
          onClick={() => {
            fetchBookingHistory(user._id);
            setShowActionsDropdown(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <History className="w-4 h-4 mr-2" />
          Lịch sử đặt phòng
        </button>

        <hr className="my-1" />

        <button
          onClick={() => {
            toggleUserStatus(user._id, user.trangThaiTaiKhoan);
            setShowActionsDropdown(null);
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${user.trangThaiTaiKhoan === 'hoatDong' ? 'text-red-600' : 'text-green-600'
            }`}
        >
          {user.trangThaiTaiKhoan === 'hoatDong' ? (
            <>
              <Ban className="w-4 h-4 mr-2" />
              Cấm tài khoản
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Bỏ cấm tài khoản
            </>
          )}
        </button>

        <button
          onClick={() => {
            setSelectedUser(user);
            setShowBanModal(true);
            setShowActionsDropdown(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 flex items-center"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {isBannedFromBooking ? 'Bỏ cấm đặt phòng' : 'Cấm đặt phòng'}
        </button>

        {user.soLanKhongNhanPhong > 0 && (
          <button
            onClick={() => {
              resetNoShow(user._id);
              setShowActionsDropdown(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset cảnh báo ({user.soLanKhongNhanPhong})
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm tên, email, SĐT, CCCD..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả vai trò</option>
              <option value="nguoiDung">Người dùng</option>
              <option value="chuKhachSan">Chủ khách sạn</option>
              <option value="admin">Admin</option>
              <option value="nhanVienKhachSan">Nhân viên</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="hoatDong">Hoạt động</option>
              <option value="cam">Bị cấm</option>
              <option value="khongHoatDong">Không hoạt động</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ngayTao">Ngày tạo</option>
              <option value="tenNguoiDung">Tên</option>
              <option value="tongSoDonDat">Số đơn đặt</option>
              <option value="tongTienDaThanhToan">Tổng tiền</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>

            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    {/* User Info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={user.hinhDaiDien}
                          alt={user.tenNguoiDung}
                          className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
                          showIcon={true}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {user.tenNguoiDung}
                          </div>
                          {user.cccd && (
                            <div className="text-xs text-gray-500 truncate">
                              CCCD: {user.cccd}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.soDienThoai}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.vaiTro === 'admin' ? 'bg-red-100 text-red-800' :
                          user.vaiTro === 'chuKhachSan' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {formatRole(user.vaiTro)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.trangThaiTaiKhoan === 'hoatDong'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {user.trangThaiTaiKhoan === 'hoatDong' ? 'Hoạt động' : 'Bị cấm'}
                        </span>

                        {user.ngayCamDatPhong && new Date(user.ngayCamDatPhong) > new Date() && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Cấm đặt phòng
                          </span>
                        )}

                        {user.soLanKhongNhanPhong >= 3 && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Cảnh báo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(user.tongTienDaThanhToan || 0)}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.ngayTao)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center relative">
                      <button
                        onClick={() => setShowActionsDropdown(showActionsDropdown === user._id ? null : user._id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {showActionsDropdown === user._id && renderActionsDropdown(user)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.totalRecords)} trong tổng số {pagination.totalRecords} người dùng
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              disabled={pagination.current <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {pagination.current} / {totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              disabled={pagination.current >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center"
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Không có người dùng nào</h3>
          <p className="text-sm text-gray-500">Chưa có người dùng nào phù hợp với bộ lọc</p>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showActionsDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsDropdown(null)}
        />
      )}

      {/* Modals */}
      {showDetailModal && renderDetailModal()}
      {showBookingModal && renderBookingModal()}
      {showBanModal && renderBanModal()}
    </div>
  );
};

export default UserManagement;