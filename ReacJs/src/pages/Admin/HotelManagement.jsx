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
  Building2,
  MapPin,
  Star,
  DollarSign,
  Users,
  Phone,
  Mail,
  Calendar,
  Loader,
  X,
  MoreHorizontal,
  User,
  Home
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
const ImageWithFallback = ({ src, alt, className, fallback = null, showIcon = false, iconType = 'hotel' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imageUrl = getImageUrl(src);

  // Nếu không có URL hợp lệ hoặc có lỗi, hiển thị fallback
  if (!imageUrl || imageError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        {showIcon ? (
          iconType === 'user' ? (
            <User className="w-6 h-6 text-gray-400" />
          ) : (
            <Home className="w-6 h-6 text-gray-400" />
          )
        ) : fallback ? (
          <img
            src={fallback}
            alt={alt}
            className={className}
            onError={() => setImageError(true)}
          />
        ) : (
          iconType === 'user' ? (
            <User className="w-6 h-6 text-gray-400" />
          ) : (
            <Home className="w-6 h-6 text-gray-400" />
          )
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

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
    totalRecords: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'tenKhachSan',
    sortOrder: 'asc'
  });

  useEffect(() => {
    fetchHotels();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get(`${baseUrl}/api/hotels-management/admin/hotels`, { params });

      if (response.data.success) {
        setHotels(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalRecords: response.data.pagination.totalRecords
        }));
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Lỗi khi lấy danh sách khách sạn');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelDetail = async (hotelId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/hotels-management/admin/hotels/${hotelId}`);

      if (response.data.success) {
        setSelectedHotel(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching hotel detail:', error);
      toast.error('Không thể tải chi tiết khách sạn');
    }
  };

  const toggleHotelStatus = async (hotelId, currentStatus) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus === 'hoatDong' ? 'cấm' : 'bỏ cấm'} khách sạn này?`)) {
      return;
    }

    try {
      const response = await axios.put(`${baseUrl}/api/hotels-management/admin/hotels/${hotelId}/toggle-status`, {
        reason: currentStatus === 'hoatDong' ? 'Vi phạm quy định' : 'Đã khắc phục'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchHotels();
      }
    } catch (error) {
      console.error('Error toggling hotel status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const deleteHotel = async (hotelId) => {
    if (!confirm('Bạn có chắc muốn xóa khách sạn này?')) {
      return;
    }

    try {
      const response = await axios.delete(`${baseUrl}/api/hotels-management/admin/hotels/${hotelId}`);

      if (response.data.success) {
        toast.success('Đã xóa khách sạn thành công');
        fetchHotels();
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể xóa khách sạn');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VNĐ';
  };

  const formatHotelType = (type) => {
    const types = {
      'khachSan': 'Khách sạn',
      'khuNghiDuong': 'Khu nghỉ dưỡng',
      'nhaNghi': 'Nhà nghỉ',
      'kyTucXa': 'Ký túc xá',
      'canHo': 'Căn hộ',
      'bietThu': 'Biệt thự',
      'homestay': 'Homestay'
    };
    return types[type] || type;
  };

  const formatAddress = (address) => {
    if (!address) return 'Chưa cập nhật';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [];
      if (address.soNha) parts.push(address.soNha);
      if (address.tenDuong) parts.push(address.tenDuong);
      if (address.phuong) parts.push(address.phuong);
      if (address.quan) parts.push(address.quan);
      if (address.tinhThanh) parts.push(address.tinhThanh);
      if (address.quocGia) parts.push(address.quocGia);
      return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
    }
    return 'Chưa cập nhật';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    // Xử lý định dạng ngày khác nhau
    let date;
    if (dateString.includes('/')) {
      // Định dạng DD/MM/YYYY từ Flutter
      const [day, month, year] = dateString.split('/');
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('vi-VN');
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

  const renderActionsDropdown = (hotel) => {
    return (
      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
        <button
          onClick={() => {
            fetchHotelDetail(hotel._id);
            setShowActionsDropdown(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Xem chi tiết
        </button>

        <hr className="my-1" />

        <button
          onClick={() => {
            toggleHotelStatus(hotel._id, hotel.trangThai);
            setShowActionsDropdown(null);
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${hotel.trangThai === 'hoatDong' ? 'text-red-600' : 'text-green-600'
            }`}
        >
          {hotel.trangThai === 'hoatDong' ? (
            <>
              <Ban className="w-4 h-4 mr-2" />
              Cấm khách sạn
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Bỏ cấm khách sạn
            </>
          )}
        </button>

        <button
          onClick={() => {
            deleteHotel(hotel._id);
            setShowActionsDropdown(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa khách sạn
        </button>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedHotel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ImageWithFallback
                  src={selectedHotel.hinhAnhDayDu?.[0] || selectedHotel.hinhAnh}
                  alt={selectedHotel.tenKhachSan}
                  className="w-16 h-16 rounded-lg object-cover"
                  showIcon={true}
                  iconType="hotel"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedHotel.tenKhachSan || 'Chưa có tên'}
                  </h2>
                  <p className="text-sm text-gray-500">{formatHotelType(selectedHotel.loaiKhachSan)}</p>
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
            {/* Hotel Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Thông tin khách sạn</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Tên:</span>
                    <span>{selectedHotel.tenKhachSan || 'Chưa có tên'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">Loại:</span>
                    <span>{formatHotelType(selectedHotel.loaiKhachSan)}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Số sao:</span>
                    <span>{selectedHotel.soSao || 0}/5</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <span className="font-medium mr-2">Địa chỉ:</span>
                    <span className="flex-1">
                      {selectedHotel.diaChiDayDu || formatAddress(selectedHotel.diaChi)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Email:</span>
                    <span>{selectedHotel.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">SĐT:</span>
                    <span>{selectedHotel.soDienThoai || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedHotel.trangThai === 'hoatDong' ? 'bg-green-100 text-green-800' :
                        selectedHotel.trangThai === 'biCam' ? 'bg-red-100 text-red-800' :
                          selectedHotel.trangThai === 'ngungKinhDoanh' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                      }`}>
                      {selectedHotel.trangThai === 'hoatDong' ? 'Hoạt động' :
                        selectedHotel.trangThai === 'biCam' ? 'Bị cấm' :
                          selectedHotel.trangThai === 'ngungKinhDoanh' ? 'Ngừng kinh doanh' : 'Tạm nghỉ'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Thông tin chủ sở hữu</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <ImageWithFallback
                      src={selectedHotel.chuKhachSan?.hinhDaiDien}
                      alt={selectedHotel.chuKhachSan?.tenNguoiDung}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                      showIcon={true}
                      iconType="user"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedHotel.chuKhachSan?.tenNguoiDung || 'Chưa cập nhật'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedHotel.chuKhachSan?.email || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">SĐT:</span>
                    <span>{selectedHotel.chuKhachSan?.soDienThoai || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">CCCD:</span>
                    <span>{selectedHotel.chuKhachSan?.cccd || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium mr-2">Ngày tạo TK:</span>
                    <span>{formatDate(selectedHotel.chuKhachSan?.ngayTao)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2 ml-6">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedHotel.chuKhachSan?.trangThaiTaiKhoan === 'hoatDong'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedHotel.chuKhachSan?.trangThaiTaiKhoan === 'hoatDong' ? 'Hoạt động' : 'Bị cấm'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Stats */}
            {(selectedHotel.thongKe || selectedHotel.tongDoanhThu !== undefined) && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Thống kê doanh thu</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Tổng doanh thu</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedHotel.thongKe?.tongDoanhThu || selectedHotel.tongDoanhThu || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Số đơn đặt</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedHotel.thongKe?.soLuongDonDat || selectedHotel.soLuongDonDat || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Doanh thu tháng</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {formatCurrency(selectedHotel.thongKe?.doanhThuThang || selectedHotel.doanhThuThang || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Revenue Chart Data */}
                {selectedHotel.thongKe?.doanhThuTheoThang && selectedHotel.thongKe.doanhThuTheoThang.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Doanh thu 6 tháng gần nhất</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                        {selectedHotel.thongKe.doanhThuTheoThang.map((item, index) => (
                          <div key={index} className="text-center">
                            <div className="font-medium">{item._id.month}/{item._id.year}</div>
                            <div className="text-green-600">{formatCurrency(item.doanhThu)}</div>
                            <div className="text-gray-500">{item.soDon} đơn</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedHotel.moTa && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Mô tả</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {selectedHotel.moTa}
                </p>
              </div>
            )}

            {/* Hotel Images */}
            {selectedHotel.hinhAnhDayDu && selectedHotel.hinhAnhDayDu.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Hình ảnh khách sạn</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedHotel.hinhAnhDayDu.slice(0, 8).map((image, index) => (
                    <ImageWithFallback
                      key={index}
                      src={image}
                      alt={`Hotel ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      showIcon={true}
                      iconType="hotel"
                    />
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
                placeholder="Tìm kiếm khách sạn, chủ sở hữu..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="hoatDong">Hoạt động</option>
              <option value="biCam">Bị cấm</option>
              <option value="ngungKinhDoanh">Ngừng kinh doanh</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tenKhachSan">Tên khách sạn</option>
              <option value="tongDoanhThu">Doanh thu</option>
              <option value="soLuongDonDat">Số đơn đặt</option>
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
              onClick={fetchHotels}
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

      {/* Hotels Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Khách sạn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Chủ sở hữu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50">
                    {/* Hotel Info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={hotel.hinhAnhDayDu?.[0] || hotel.hinhAnh}
                          alt={hotel.tenKhachSan}
                          className="w-12 h-12 rounded-lg object-cover mr-3 flex-shrink-0"
                          showIcon={true}
                          iconType="hotel"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {hotel.tenKhachSan || 'Chưa có tên'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatHotelType(hotel.loaiKhachSan)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {hotel.soSao || 0}/5
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={hotel.chuKhachSan?.hinhDaiDien}
                          alt="Owner"
                          className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                          showIcon={true}
                          iconType="user"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {hotel.chuKhachSan?.tenNguoiDung || 'Chưa có tên'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {hotel.chuKhachSan?.email || 'Chưa có email'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {formatCurrency(hotel.tongDoanhThu || 0)}
                        </div>
                        <div className="text-gray-500">
                          Tháng: {formatCurrency(hotel.doanhThuThang || 0)}
                        </div>
                        <div className="text-gray-500">
                          {hotel.soLuongDonDat || 0} đơn
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${hotel.trangThai === 'hoatDong' ? 'bg-green-100 text-green-800' :
                            hotel.trangThai === 'biCam' ? 'bg-red-100 text-red-800' :
                              hotel.trangThai === 'ngungKinhDoanh' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                          }`}>
                          {hotel.trangThai === 'hoatDong' ? 'Hoạt động' :
                            hotel.trangThai === 'biCam' ? 'Bị cấm' :
                              hotel.trangThai === 'ngungKinhDoanh' ? 'Ngừng KD' : 'Tạm nghỉ'}
                        </span>

                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${hotel.chuKhachSan?.trangThaiTaiKhoan === 'hoatDong'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          Chủ: {hotel.chuKhachSan?.trangThaiTaiKhoan === 'hoatDong' ? 'OK' : 'Cấm'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center relative">
                      <button
                        onClick={() => setShowActionsDropdown(showActionsDropdown === hotel._id ? null : hotel._id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {showActionsDropdown === hotel._id && renderActionsDropdown(hotel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && hotels.length > 0 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.totalRecords)} trong tổng số {pagination.totalRecords} khách sạn
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
      {!loading && hotels.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Không có khách sạn nào</h3>
          <p className="text-sm text-gray-500">Chưa có khách sạn nào phù hợp với bộ lọc</p>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showActionsDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsDropdown(null)}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && renderDetailModal()}
    </div>
  );
};

export default HotelManagement; 