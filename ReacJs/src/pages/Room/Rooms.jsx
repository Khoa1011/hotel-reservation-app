import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  BedDouble
} from 'lucide-react';

const RoomManagement = () => {
  const [roomTypes] = useState([
    {
      _id: '1',
      tenLoaiPhong: 'Phòng Deluxe',
      giaCa: 1500000
    },
    {
      _id: '2',
      tenLoaiPhong: 'Phòng Suite',
      giaCa: 3000000
    }
  ]);

  const [rooms, setRooms] = useState([
    {
      _id: '1',
      maLoaiPhong: { _id: '1', tenLoaiPhong: 'Phòng Deluxe', giaCa: 1500000 },
      hinhAnh: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
      trangThaiPhong: false,
      dienTich: 35,
      moTa: 'Phòng deluxe với view biển tuyệt đẹp',
      soLuongGiuong: 1,
      soLuongNguoiToiDa: 2,
      cauHinhGiuong: [{ loaiGiuong: 'king', soLuong: 1 }],
      cacViewPhong: []
    },
    {
      _id: '2',
      maLoaiPhong: { _id: '1', tenLoaiPhong: 'Phòng Deluxe', giaCa: 1500000 },
      hinhAnh: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400',
      trangThaiPhong: true,
      dienTich: 35,
      moTa: 'Phòng deluxe với ban công riêng',
      soLuongGiuong: 1,
      soLuongNguoiToiDa: 2,
      cauHinhGiuong: [{ loaiGiuong: 'queen', soLuong: 1 }],
      cacViewPhong: []
    }
  ]);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [roomForm, setRoomForm] = useState({
    maLoaiPhong: '',
    hinhAnh: '',
    dienTich: '',
    moTa: '',
    soLuongGiuong: '',
    soLuongNguoiToiDa: '',
    cauHinhGiuong: [],
    cacViewPhong: []
  });

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoomStatusColor = (status) => {
    return status 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800';
  };

  const getRoomStatusText = (status) => {
    return status ? 'Đã đặt' : 'Trống';
  };

  // Filter functions
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.moTa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.maLoaiPhong.tenLoaiPhong.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'available') return matchesSearch && !room.trangThaiPhong;
    if (filterStatus === 'occupied') return matchesSearch && room.trangThaiPhong;
    
    return matchesSearch;
  });

  // Room Modal handlers
  const openRoomModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        maLoaiPhong: room.maLoaiPhong._id,
        hinhAnh: room.hinhAnh,
        dienTich: room.dienTich.toString(),
        moTa: room.moTa,
        soLuongGiuong: room.soLuongGiuong.toString(),
        soLuongNguoiToiDa: room.soLuongNguoiToiDa.toString(),
        cauHinhGiuong: room.cauHinhGiuong,
        cacViewPhong: room.cacViewPhong
      });
    } else {
      setEditingRoom(null);
      setRoomForm({
        maLoaiPhong: '',
        hinhAnh: '',
        dienTich: '',
        moTa: '',
        soLuongGiuong: '',
        soLuongNguoiToiDa: '',
        cauHinhGiuong: [],
        cacViewPhong: []
      });
    }
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    
    const roomTypeData = roomTypes.find(rt => rt._id === roomForm.maLoaiPhong);
    
    if (editingRoom) {
      setRooms(prev => prev.map(r => 
        r._id === editingRoom._id 
          ? { 
              ...r, 
              ...roomForm, 
              dienTich: parseFloat(roomForm.dienTich),
              soLuongGiuong: parseInt(roomForm.soLuongGiuong),
              soLuongNguoiToiDa: parseInt(roomForm.soLuongNguoiToiDa),
              maLoaiPhong: roomTypeData
            }
          : r
      ));
    } else {
      const newRoom = {
        _id: Date.now().toString(),
        ...roomForm,
        dienTich: parseFloat(roomForm.dienTich),
        soLuongGiuong: parseInt(roomForm.soLuongGiuong),
        soLuongNguoiToiDa: parseInt(roomForm.soLuongNguoiToiDa),
        trangThaiPhong: false,
        maLoaiPhong: roomTypeData
      };
      setRooms(prev => [...prev, newRoom]);
    }
    
    closeRoomModal();
  };

  const deleteRoom = (roomId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      setRooms(prev => prev.filter(r => r._id !== roomId));
    }
  };

  const toggleRoomStatus = (roomId) => {
    setRooms(prev => prev.map(r => 
      r._id === roomId ? { ...r, trangThaiPhong: !r.trangThaiPhong } : r
    ));
  };

  return (
   <>
   {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm phòng..."
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
            onClick={() => openRoomModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm phòng
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={room.hinhAnh}
                alt={room.maLoaiPhong.tenLoaiPhong}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{room.maLoaiPhong.tenLoaiPhong}</h3>
                    <p className="text-gray-600 text-sm">Phòng #{room._id.slice(-4)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room.trangThaiPhong)}`}>
                    {getRoomStatusText(room.trangThaiPhong)}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Giá/đêm:</span>
                    <span className="font-semibold">{formatCurrency(room.maLoaiPhong.giaCa)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diện tích:</span>
                    <span>{room.dienTich}m²</span>
                  </div>
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
                    onClick={() => toggleRoomStatus(room._id)}
                    className={`flex-1 px-3 py-2 text-sm rounded ${
                      room.trangThaiPhong
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {room.trangThaiPhong ? 'Trả phòng' : 'Đặt phòng'}
                  </button>
                  <button
                    onClick={() => openRoomModal(room)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRoom(room._id)}
                    className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Room Modal */}
        {showRoomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại phòng *
                    </label>
                    <select
                      required
                      value={roomForm.maLoaiPhong}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, maLoaiPhong: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn loại phòng</option>
                      {roomTypes.map((roomType) => (
                        <option key={roomType._id} value={roomType._id}>
                          {roomType.tenLoaiPhong} - {formatCurrency(roomType.giaCa)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh (URL) *
                    </label>
                    <input
                      type="url"
                      required
                      value={roomForm.hinhAnh}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, hinhAnh: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diện tích (m²)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={roomForm.dienTich}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, dienTich: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: 35"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng giường *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={roomForm.soLuongGiuong}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, soLuongGiuong: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: 1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số người tối đa *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={roomForm.soLuongNguoiToiDa}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, soLuongNguoiToiDa: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VD: 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={roomForm.moTa}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, moTa: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mô tả chi tiết về phòng..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cấu hình giường
                    </label>
                    <div className="space-y-2">
                      {roomForm.cauHinhGiuong.map((bed, index) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={bed.loaiGiuong}
                            onChange={(e) => {
                              const newBeds = [...roomForm.cauHinhGiuong];
                              newBeds[index].loaiGiuong = e.target.value;
                              setRoomForm(prev => ({ ...prev, cauHinhGiuong: newBeds }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Chọn loại giường</option>
                            <option value="single">Giường đơn</option>
                            <option value="double">Giường đôi</option>
                            <option value="queen">Giường Queen</option>
                            <option value="king">Giường King</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={bed.soLuong}
                            onChange={(e) => {
                              const newBeds = [...roomForm.cauHinhGiuong];
                              newBeds[index].soLuong = parseInt(e.target.value);
                              setRoomForm(prev => ({ ...prev, cauHinhGiuong: newBeds }));
                            }}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="SL"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBeds = roomForm.cauHinhGiuong.filter((_, i) => i !== index);
                              setRoomForm(prev => ({ ...prev, cauHinhGiuong: newBeds }));
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setRoomForm(prev => ({ 
                            ...prev, 
                            cauHinhGiuong: [...prev.cauHinhGiuong, { loaiGiuong: '', soLuong: 1 }] 
                          }));
                        }}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Thêm giường
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeRoomModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleRoomSubmit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingRoom ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' 
                : 'Tạo phòng đầu tiên cho khách sạn của bạn'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => openRoomModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tạo phòng đầu tiên
              </button>
            )}
          </div>
        )}
   </>
  );
};

export default RoomManagement;