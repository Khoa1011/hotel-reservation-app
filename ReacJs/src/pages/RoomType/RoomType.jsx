import React, { useState } from 'react';
import { 
  DollarSign, 
  CheckCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Home
} from 'lucide-react';
import AddRoomTypeModal from './AddRoomTypeModal';
import EditRoomTypeModal from './EditRoomTypeModal';

const RoomTypeManagement = () => {
  const [roomTypes, setRoomTypes] = useState([
    {
      _id: '1',
      tenLoaiPhong: 'Phòng Deluxe',
      giaCa: 1500000,
      moTa: 'Phòng cao cấp với view đẹp',
      tienNghiDacBiet: ['Wifi miễn phí', 'TV 55 inch', 'Minibar'],
      tongSoPhong: 10,
      maKhachSan: { tenKhachSan: 'Hotel Paradise' }
    },
    {
      _id: '2',
      tenLoaiPhong: 'Phòng Suite',
      giaCa: 3000000,
      moTa: 'Phòng suite sang trọng',
      tienNghiDacBiet: ['Jacuzzi', 'Ban công riêng', 'Butler service'],
      tongSoPhong: 5,
      maKhachSan: { tenKhachSan: 'Hotel Paradise' }
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Filter functions
  const filteredRoomTypes = roomTypes.filter(roomType =>
    roomType.tenLoaiPhong.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal handlers
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

  // CRUD handlers
  const handleAddRoomType = (newRoomType) => {
    setRoomTypes(prev => [...prev, newRoomType]);
  };

  const handleEditRoomType = (updatedRoomType) => {
    setRoomTypes(prev => prev.map(rt => 
      rt._id === updatedRoomType._id ? updatedRoomType : rt
    ));
  };

  const deleteRoomType = (roomTypeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa loại phòng này?')) {
      setRoomTypes(prev => prev.filter(rt => rt._id !== roomTypeId));
    }
  };

  return (
    <>
      {/* Search and Add */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm loại phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm loại phòng
        </button>
      </div>

      {/* Room Types Grid */}
      <div className="grid gap-6">
        {filteredRoomTypes.map((roomType) => (
          <div key={roomType._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{roomType.tenLoaiPhong}</h3>
                <p className="text-gray-600">{roomType.maKhachSan.tenKhachSan}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Giá phòng</p>
                  <p className="font-semibold">{formatCurrency(roomType.giaCa)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Tổng số phòng</p>
                  <p className="font-semibold">{roomType.tongSoPhong} phòng</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Tiện nghi</p>
                  <p className="font-semibold">{roomType.tienNghiDacBiet.length} tiện nghi</p>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-3">{roomType.moTa}</p>

            {roomType.tienNghiDacBiet.length > 0 && (
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
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRoomTypes.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy loại phòng' : 'Chưa có loại phòng nào'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo loại phòng đầu tiên cho khách sạn của bạn'}
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
    </>
  );
};

export default RoomTypeManagement;