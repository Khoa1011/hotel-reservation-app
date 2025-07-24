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
  MapPin
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import AddRoomModal from './AddRoom';
import EditRoomModal from './EditRoom';

const RoomManagement = ({ selectedHotelId }) => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRoomType, setSelectedRoomType] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoomStatusColor = (status) => {
    // ✅ LOGIC: "trong" = green, "da_dat" = red  
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
    // ✅ LOGIC: Status string mapping
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

  // ✅ THÊM: Get view text
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

  // Lấy danh sách loại phòng
  const fetchRoomTypes = async () => {
    if (!selectedHotelId) return;

    try {
      const response = await axios.get(
        `${baseUrl}/api/roomType-hotel/hotelowner/roomtypes/${selectedHotelId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setRoomTypes(response.data.data?.loaiPhong || []);
      }
    } catch (error) {
      console.error('Lỗi khi lấy loại phòng:', error);
      toast.error('Không thể lấy danh sách loại phòng');
    }
  };

  // Lấy danh sách phòng của loại
  const fetchRooms = async (roomTypeId = selectedRoomType) => {
    if (!roomTypeId) {
      setRooms([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/room-hotel/hotelowner/rooms/${roomTypeId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setRooms(response.data.data?.rooms || []);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng:', error);
      toast.error('Không thể lấy danh sách phòng');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete room
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
        fetchRooms(); // Reload danh sách
      } else {
        toast.error(response.data?.message || 'Xóa phòng thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xóa phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa phòng');
    }
  };

  // ✅ Toggle room status (dummy - cần API riêng)
  const toggleRoomStatus = async (roomId, currentStatus, roomNumber) => {
    try {
      console.log(`🔄 Toggling room ${roomNumber} from ${currentStatus}`);

      // ✅ Logic chuyển đổi đúng
      let newStatus;
      if (currentStatus === 'trong') {
        newStatus = 'da_dat';      // Trống → Đặt
      } else if (currentStatus === 'da_dat') {
        newStatus = 'trong';       // Đặt → Trống  
      } else {
        toast.error(`Không thể thay đổi trạng thái "${currentStatus}"`);
        return;
      }

      // ✅ Call API update room status (cần tạo API này)
      const response = await axios.put(
        `${baseUrl}/api/room-hotel/hotelowner/update-room-status/${roomId}`,
        { trangThaiPhong: newStatus },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // ✅ Update local state
        setRooms(prev => prev.map(room =>
          room._id === roomId
            ? { ...room, trangThaiPhong: newStatus }
            : room
        ));

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
      fetchRoomTypes();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedRoomType) {
      fetchRooms();
    }
  }, [selectedRoomType]);

  // Filter functions - include room number
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.moTa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.maLoaiPhong?.tenLoaiPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.soPhong?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'available') return matchesSearch && room.trangThaiPhong === 'trong';     
    if (filterStatus === 'occupied') return matchesSearch && room.trangThaiPhong !== 'trong';     

    return matchesSearch;
  });

  // Modal handlers
  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRoom(null);
  };

  const handleRoomAdded = () => {
    fetchRooms(); // Reload danh sách sau khi thêm
    closeAddModal();
  };

  const handleRoomUpdated = () => {
    fetchRooms(); // Reload danh sách sau khi sửa
    closeEditModal();
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
      {/* Room Type Selection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn loại phòng để quản lý
        </label>
        <select
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Chọn loại phòng --</option>
          {roomTypes.map((roomType) => (
            <option key={roomType._id} value={roomType._id}>
              {roomType.tenLoaiPhong} - {formatCurrency(roomType.giaCa)}
            </option>
          ))}
        </select>
      </div>

      {selectedRoomType && (
        <>
          {/* Search and Filters */}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Phòng trống</option>
              <option value="occupied">Đã đặt</option>
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
                        {/* ✅ SỬA: Hiển thị số phòng */}
                        <h3 className="font-bold text-lg">Phòng {room.soPhong}</h3>
                        <p className="text-gray-600 text-sm">{room.maLoaiPhong?.tenLoaiPhong}</p>
                        {/* ✅ THÊM: Hiển thị tầng và view */}
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
                      <button
                        onClick={() => toggleRoomStatus(room._id, room.trangThaiPhong, room.soPhong)}
                        className={`flex-1 px-3 py-2 text-sm rounded flex items-center justify-center gap-1 text-white ${room.trangThaiPhong === 'trong'
                          ? 'bg-blue-500 hover:bg-blue-600'      // Trống → Button xanh "Đặt phòng"
                          : 'bg-green-500 hover:bg-green-600'    // Đã đặt → Button xanh lá "Trả phòng"
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

          {/* Empty State */}
          {!loading && filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Tạo phòng đầu tiên cho loại phòng này'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo phòng đầu tiên
                </button>
              )}
            </div>
          )}
        </>
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
    </div>
  );
};

export default RoomManagement;