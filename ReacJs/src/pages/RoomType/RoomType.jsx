import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  CheckCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Home,
  Users
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import AddRoomTypeModal from './AddRoomTypeModal';
import EditRoomTypeModal from './EditRoomTypeModal';

const RoomTypeManagement = ({ selectedHotelId }) => {
  console.log('🏨 RoomTypeManagement render:', { selectedHotelId });

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // ✅ Thêm ref để track API calls và prevent duplicate calls
  const lastFetchedHotelId = useRef(null);
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // ✅ Fetch danh sách loại phòng từ API với duplicate prevention
  const fetchRoomTypes = async (hotelId) => {
    if (!hotelId) {
      setRoomTypes([]);
      lastFetchedHotelId.current = null;
      return;
    }

    // ✅ Prevent duplicate API calls for same hotel
    if (lastFetchedHotelId.current === hotelId && !isInitialMount.current) {
      console.log('🚫 Skipping duplicate fetch for hotel:', hotelId);
      return;
    }

    console.log('🔍 Fetching room types for hotel:', hotelId);
    lastFetchedHotelId.current = hotelId;
    setLoading(true);

    try {
      const response = await axios.get(
        `${baseUrl}/api/roomType-hotel/hotelowner/roomtypes/${hotelId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        setRoomTypes(response.data.data?.loaiPhong || []);
      } else {
        console.error('Lỗi fetch room types:', response.data?.message);
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách loại phòng:', error);
      toast.error('Không thể lấy danh sách loại phòng');
      setRoomTypes([]);
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  // ✅ Search loại phòng với debounce
  const searchRoomTypes = async (hotelId, searchQuery) => {
    if (!hotelId) {
      setRoomTypes([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/roomType-hotel/hotelowner/search-roomtypes`,
        {
          params: {
            hotelId: hotelId,
            search: searchQuery,
            limit: 100
          },
          withCredentials: true
        }
      );

      if (response.data?.success) {
        setRoomTypes(response.data.data?.loaiPhong || []);
      } else {
        console.error('Lỗi search room types:', response.data?.message);
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm loại phòng:', error);
      toast.error('Lỗi khi tìm kiếm');
      setRoomTypes([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ Effect để fetch data khi selectedHotelId thay đổi (chỉ 1 lần)
  useEffect(() => {
    console.log('🏨 selectedHotelId effect triggered:', selectedHotelId);

    if (selectedHotelId) {
      // Clear search when hotel changes
      setSearchTerm('');
      fetchRoomTypes(selectedHotelId);
    } else {
      console.log('❌ No hotel selected, clearing room types');
      setRoomTypes([]);
      lastFetchedHotelId.current = null;
    }
  }, [selectedHotelId]); // Only depend on selectedHotelId

  // ✅ Effect để search với debounce
  useEffect(() => {
    if (!selectedHotelId) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        console.log('🔍 Searching with term:', searchTerm);
        searchRoomTypes(selectedHotelId, searchTerm);
      } else {
        // Only fetch if we haven't already loaded data for this hotel
        if (lastFetchedHotelId.current !== selectedHotelId) {
          console.log('📋 Refetching all room types');
          fetchRoomTypes(selectedHotelId);
        }
      }
    }, 500); // Debounce 500ms

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedHotelId]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Modal handlers
  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openEditModal = (roomType) => {
    setEditingRoomType(roomType);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRoomType(null);
  };

  // ✅ CRUD handlers
  const handleAddRoomType = (newRoomType) => {
    setRoomTypes(prev => [newRoomType, ...prev]);
  };

  const handleEditRoomType = async (updatedRoomType) => {
    try {
      setRoomTypes(prev => prev.map(rt =>
        rt._id === updatedRoomType._id ? updatedRoomType : rt
      ));
      closeEditModal();
    } catch (error) {
      console.error('Lỗi cập nhật loại phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật loại phòng');
    }
  };

  const deleteRoomType = async (roomTypeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại phòng này?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${baseUrl}/api/roomType-hotel/hotelowner/delete-roomtype/${roomTypeId}`,
        { withCredentials: true }
      );

      if (response.data?.success) {
        toast.success('Xóa loại phòng thành công!');
        setRoomTypes(prev => prev.filter(rt => rt._id !== roomTypeId));
      } else {
        toast.error(response.data?.message || 'Xóa không thành công');
      }
    } catch (error) {
      console.error('Lỗi xóa loại phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa loại phòng');
    }
  };

  // ✅ Filtered room types (local filter for instant feedback)
  const filteredRoomTypes = roomTypes.filter(roomType =>
    roomType.tenLoaiPhong?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm loại phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedHotelId}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <button
          onClick={openAddModal}
          disabled={!selectedHotelId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Thêm loại phòng
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải danh sách loại phòng...</p>
        </div>
      )}

      {/* Room Types Grid */}
      {!loading && selectedHotelId && (
        <div className="grid gap-6">
          {filteredRoomTypes.map((roomType) => (
            <div key={roomType._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{roomType.tenLoaiPhong}</h3>
                  <p className="text-gray-600">{roomType.maKhachSan?.tenKhachSan || "N/A"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(roomType)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRoomType(roomType._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ✅ SỬA: Statistics Grid với 4 columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Giá phòng</p>
                    <p className="font-semibold">{formatCurrency(roomType.giaCa)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tổng phòng</p>
                    <p className="font-semibold">{roomType.thongKePhong?.tongSoPhong || 0} phòng</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phòng trống</p>
                    <p className="font-semibold text-green-600">{roomType.thongKePhong?.phongTrong || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Đã đặt</p>
                    <p className="font-semibold text-red-600">
                      {(roomType.thongKePhong?.phongDaDat || 0) + (roomType.thongKePhong?.phongDangSuDung || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ THÊM: Detailed Room Status Bar */}
              {roomType.thongKePhong && roomType.thongKePhong.tongSoPhong > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Trạng thái phòng</span>
                    <span className="text-sm text-gray-500">
                      Tỷ lệ đặt phòng: {roomType.thongKePhong.tyLeLapDay}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      {/* Phòng trống */}
                      {roomType.thongKePhong.phongTrong > 0 && (
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(roomType.thongKePhong.phongTrong / roomType.thongKePhong.tongSoPhong) * 100}%`
                          }}
                        ></div>
                      )}

                      {/* Đã đặt */}
                      {roomType.thongKePhong.phongDaDat > 0 && (
                        <div
                          className="bg-orange-500"
                          style={{
                            width: `${(roomType.thongKePhong.phongDaDat / roomType.thongKePhong.tongSoPhong) * 100}%`
                          }}
                        ></div>
                      )}

                      {/* Đang sử dụng */}
                      {roomType.thongKePhong.phongDangSuDung > 0 && (
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(roomType.thongKePhong.phongDangSuDung / roomType.thongKePhong.tongSoPhong) * 100}%`
                          }}
                        ></div>
                      )}

                      {/* Bảo trì */}
                      {roomType.thongKePhong.phongBaoTri > 0 && (
                        <div
                          className="bg-yellow-500"
                          style={{
                            width: `${(roomType.thongKePhong.phongBaoTri / roomType.thongKePhong.tongSoPhong) * 100}%`
                          }}
                        ></div>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Trống ({roomType.thongKePhong.phongTrong})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Đã đặt ({roomType.thongKePhong.phongDaDat})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Đang sử dụng ({roomType.thongKePhong.phongDangSuDung})</span>
                    </div>
                    {roomType.thongKePhong.phongBaoTri > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>Bảo trì ({roomType.thongKePhong.phongBaoTri})</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-gray-700 mb-3">{roomType.moTa}</p>

              {roomType.tienNghiDacBiet && roomType.tienNghiDacBiet.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tiện nghi đặc biệt:</p>
                  <div className="flex flex-wrap gap-2">
                    {roomType.tienNghiDacBiet.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ THÊM: Quick Actions */}
              {roomType.thongKePhong && roomType.thongKePhong.tongSoPhong > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Navigate to room management with this room type selected
                        // This would depend on your routing setup
                        console.log('Navigate to rooms for room type:', roomType._id);
                      }}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Xem phòng ({roomType.thongKePhong.tongSoPhong})
                    </button>

                    {roomType.thongKePhong.phongTrong > 0 && (
                      <button
                        onClick={() => {
                          // Quick action for available rooms
                          console.log('Show available rooms for:', roomType._id);
                        }}
                        className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                      >
                        Phòng trống ({roomType.thongKePhong.phongTrong})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && selectedHotelId && filteredRoomTypes.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy loại phòng' : 'Chưa có loại phòng nào'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Tạo loại phòng đầu tiên cho khách sạn của bạn'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo loại phòng đầu tiên
            </button>
          )}
        </div>
      )}

      {/* No Hotel Selected State */}
      {!loading && !selectedHotelId && (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chọn khách sạn để quản lý
          </h3>
          <p className="text-gray-600">
            Vui lòng chọn khách sạn từ menu bên trái để bắt đầu quản lý loại phòng
          </p>
        </div>
      )}

      {/* Modals */}
      <AddRoomTypeModal
        showModal={showAddModal}
        onClose={closeAddModal}
        onSubmit={handleAddRoomType}
      />

      <EditRoomTypeModal
        showModal={showEditModal}
        roomType={editingRoomType}
        onClose={closeEditModal}
        onSubmit={handleEditRoomType}
      />
    </div>
  );
};

export default RoomTypeManagement;