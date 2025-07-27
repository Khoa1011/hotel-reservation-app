import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BedDouble,
  Eye,
  ToggleLeft,
  ToggleRight,
  MapPin,
  BarChart3,
  Filter,
  Users,
  Home
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import AddRoomModal from './AddRoom';
import EditRoomModal from './EditRoom';
import RoomDetailModal from './RoomDetails';

const RoomManagement = ({ selectedHotelId }) => {
  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoomStatusColor = (status) => {
    switch (status) {
      case 'trong':
        return 'bg-green-100 text-green-800';
      case 'da_dat':
      case 'dang_su_dung':
        return 'bg-red-100 text-red-800';
      case 'bao_tri':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomStatusText = (status) => {
    switch (status) {
      case 'trong':
        return 'Trống';
      case 'da_dat':
        return 'Đã đặt';
      case 'dang_su_dung':
        return 'Đang sử dụng';
      case 'bao_tri':
        return 'Bảo trì';
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
      'none': ''
    };
    return viewTexts[viewType] || '';
  };

  // Fetch all hotel rooms with statistics
  const fetchHotelRooms = async (page = 1) => {
    if (!selectedHotelId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (selectedRoomType) params.append('roomTypeId', selectedRoomType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await axios.get(
        `${baseUrl}/api/room-hotel/hotelowner/hotel-rooms/${selectedHotelId}?${params}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        const data = response.data.data;
        setHotelData(data.hotel);
        setRoomTypes(data.roomTypes || []);
        setRooms(data.rooms || []);
        setStatistics(data.statistics);
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        setRooms([]);
        setStatistics(null);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng:', error);
      toast.error('Không thể lấy danh sách phòng');
      setRooms([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  // Delete room
  const deleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomNumber}?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${baseUrl}/api/room-hotel/hotelowner/delete-room/${roomId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        toast.success(`Xóa phòng ${roomNumber} thành công!`);
        fetchHotelRooms(currentPage);
      } else {
        toast.error(response.data?.message || 'Xóa phòng thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xóa phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa phòng');
    }
  };

  // Toggle room status
  const toggleRoomStatus = async (roomId, currentStatus, roomNumber) => {
    try {
      let newStatus;
      if (currentStatus === 'trong') {
        newStatus = 'da_dat';
      } else if (currentStatus === 'da_dat') {
        newStatus = 'trong';
      } else {
        toast.error(`Không thể thay đổi trạng thái "${currentStatus}"`);
        return;
      }

      const response = await axios.put(
        `${baseUrl}/api/room-hotel/hotelowner/update-room-status/${roomId}`,
        { trangThaiPhong: newStatus },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Update local state
        setRooms(prev => prev.map(room =>
          room._id === roomId
            ? { ...room, trangThaiPhong: newStatus }
            : room
        ));

        // Update statistics
        fetchHotelRooms(currentPage);

        toast.success(`${newStatus === 'trong' ? 'Trả' : 'Đặt'} phòng ${roomNumber} thành công!`);
      } else {
        toast.error(response.data?.message || 'Cập nhật trạng thái thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thay đổi trạng thái phòng');
    }
  };

  // Effects
  useEffect(() => {
    if (selectedHotelId) {
      fetchHotelRooms(1);
    }
  }, [selectedHotelId, selectedRoomType, filterStatus]);

  // Filter rooms by search term
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.moTa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.maLoaiPhong?.tenLoaiPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.soPhong?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Modal handlers
  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);
  const openEditModal = (room) => {
    setEditingRoom(room);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRoom(null);
  };
  
  // Room detail modal handlers
  const openDetailModal = (roomId) => {
    setSelectedRoomId(roomId);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRoomId(null);
  };

  const handleRoomAdded = () => {
    fetchHotelRooms(currentPage);
    closeAddModal();
  };

  const handleRoomUpdated = () => {
    fetchHotelRooms(currentPage);
    closeEditModal();
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    fetchHotelRooms(newPage);
  };

  if (!selectedHotelId) {
    return (
      <div className="text-center py-12">
        <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chọn khách sạn để quản lý phòng
        </h3>
        <p className="text-gray-600">
          Vui lòng chọn khách sạn từ menu bên trái để bắt đầu quản lý phòng
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hotel Info */}
      {hotelData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{hotelData.tenKhachSan}</h2>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BedDouble className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tổng phòng</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Phòng trống</p>
                <p className="text-2xl font-semibold text-green-600">{statistics.availableRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Đã đặt</p>
                <p className="text-2xl font-semibold text-red-600">{statistics.occupiedRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tỷ lệ lấp đầy</p>
                <p className="text-2xl font-semibold text-purple-600">{statistics.occupancyRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng (số phòng, mô tả...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((roomType) => (
            <option key={roomType._id} value={roomType._id}>
              {roomType.tenLoaiPhong}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Phòng trống</option>
          <option value="occupied">Đã đặt</option>
          <option value="maintenance">Bảo trì</option>
        </select>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm phòng
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải danh sách phòng...</p>
        </div>
      )}

      {/* Rooms Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Room Image */}
              {room.hinhAnh && room.hinhAnh.length > 0 && (
                <img
                  src={`${baseUrl}${room.hinhAnh[0].url_anh}`}
                  alt={`Phòng ${room.soPhong}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400';
                  }}
                />
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">Phòng {room.soPhong}</h3>
                    <p className="text-gray-600 text-sm">{room.maLoaiPhong?.tenLoaiPhong}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>Tầng {room.tang}</span>
                      {room.loaiView && room.loaiView !== 'none' && (
                        <>
                          <span>•</span>
                          <span>{getViewText(room.loaiView)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room.trangThaiPhong)}`}>
                    {getRoomStatusText(room.trangThaiPhong)}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Giá/đêm:</span>
                    <span className="font-semibold">{formatCurrency(room.maLoaiPhong?.giaCa || 0)}</span>
                  </div>
                  {room.dienTich && (
                    <div className="flex justify-between">
                      <span>Diện tích:</span>
                      <span>{room.dienTich}m²</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tối đa:</span>
                    <span>{room.soLuongNguoiToiDa} người</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giường:</span>
                    <span>{room.soLuongGiuong} giường</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.moTa}</p>

                <div className="flex gap-2">
                  {/* Nút Chi tiết - chỉ hiển thị cho phòng đã đặt hoặc đang sử dụng */}
                  {(room.trangThaiPhong === 'da_dat' || room.trangThaiPhong === 'dang_su_dung') && (
                    <button
                      onClick={() => openDetailModal(room._id)}
                      className="px-3 py-2 border border-blue-300 text-blue-600 text-sm rounded hover:bg-blue-50 flex items-center gap-1"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleRoomStatus(room._id, room.trangThaiPhong, room.soPhong)}
                    className={`flex-1 px-3 py-2 text-sm rounded flex items-center justify-center gap-1 text-white ${room.trangThaiPhong === 'trong'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-green-500 hover:bg-green-600'
                      }`}
                    disabled={room.trangThaiPhong === 'dang_su_dung' || room.trangThaiPhong === 'bao_tri'}
                  >
                    {room.trangThaiPhong === 'trong' ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Đặt phòng
                      </>
                    ) : room.trangThaiPhong === 'da_dat' ? (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Trả phòng
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        {getRoomStatusText(room.trangThaiPhong)}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(room)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    title="Sửa phòng"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteRoom(room._id, room.soPhong)}
                    className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                    title="Xóa phòng"
                    disabled={room.trangThaiPhong !== 'trong'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong{' '}
              {pagination.totalItems} phòng
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            
            {[...Array(pagination.totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.currentPage - 2 && page <= pagination.currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === pagination.currentPage
                        ? 'text-blue-600 bg-blue-50 border border-blue-300'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === pagination.currentPage - 3 ||
                page === pagination.currentPage + 3
              ) {
                return (
                  <span key={page} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' || selectedRoomType ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' || selectedRoomType
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Tạo phòng đầu tiên cho khách sạn này'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && !selectedRoomType && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo phòng đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddRoomModal
        showModal={showAddModal}
        onClose={closeAddModal}
        onSuccess={handleRoomAdded}
        roomTypes={roomTypes}
        selectedRoomType={selectedRoomType}
      />

      <EditRoomModal
        showModal={showEditModal}
        onClose={closeEditModal}
        onSuccess={handleRoomUpdated}
        roomTypes={roomTypes}
        room={editingRoom}
      />

      <RoomDetailModal
        showModal={showDetailModal}
        onClose={closeDetailModal}
        roomId={selectedRoomId}
      />
    </div>
  );
};

export default RoomManagement;