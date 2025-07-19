import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const EditRoomTypeModal = ({ showModal, roomType, onClose, onSubmit }) => {
  const [roomTypeForm, setRoomTypeForm] = useState({
    tenLoaiPhong: '',
    giaCa: '',
    moTa: '',
    tienNghiDacBiet: [],
    tongSoPhong: ''
  });

  // Cập nhật form khi roomType thay đổi
  useEffect(() => {
    if (roomType) {
      setRoomTypeForm({
        tenLoaiPhong: roomType.tenLoaiPhong,
        giaCa: roomType.giaCa.toString(),
        moTa: roomType.moTa,
        tienNghiDacBiet: roomType.tienNghiDacBiet,
        tongSoPhong: roomType.tongSoPhong.toString()
      });
    }
  }, [roomType]);

  if (!showModal || !roomType) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedRoomType = {
      ...roomType,
      ...roomTypeForm,
      giaCa: parseFloat(roomTypeForm.giaCa),
      tongSoPhong: parseInt(roomTypeForm.tongSoPhong)
    };
    
    onSubmit(updatedRoomType);
    onClose();
  };

  const handleClose = () => {
    // Reset form về giá trị ban đầu khi đóng modal
    if (roomType) {
      setRoomTypeForm({
        tenLoaiPhong: roomType.tenLoaiPhong,
        giaCa: roomType.giaCa.toString(),
        moTa: roomType.moTa,
        tienNghiDacBiet: roomType.tienNghiDacBiet,
        tongSoPhong: roomType.tongSoPhong.toString()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Sửa loại phòng</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên loại phòng *
              </label>
              <input
                type="text"
                required
                value={roomTypeForm.tenLoaiPhong}
                onChange={(e) => setRoomTypeForm(prev => ({ ...prev, tenLoaiPhong: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: Phòng Deluxe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá phòng/đêm *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={roomTypeForm.giaCa}
                  onChange={(e) => setRoomTypeForm(prev => ({ ...prev, giaCa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 1500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng số phòng
                </label>
                <input
                  type="number"
                  min="0"
                  value={roomTypeForm.tongSoPhong}
                  onChange={(e) => setRoomTypeForm(prev => ({ ...prev, tongSoPhong: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                rows={3}
                value={roomTypeForm.moTa}
                onChange={(e) => setRoomTypeForm(prev => ({ ...prev, moTa: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về loại phòng..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiện nghi đặc biệt
              </label>
              <div className="space-y-2">
                {roomTypeForm.tienNghiDacBiet.map((amenity, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={amenity}
                      onChange={(e) => {
                        const newAmenities = [...roomTypeForm.tienNghiDacBiet];
                        newAmenities[index] = e.target.value;
                        setRoomTypeForm(prev => ({ ...prev, tienNghiDacBiet: newAmenities }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VD: Wifi miễn phí"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newAmenities = roomTypeForm.tienNghiDacBiet.filter((_, i) => i !== index);
                        setRoomTypeForm(prev => ({ ...prev, tienNghiDacBiet: newAmenities }));
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
                    setRoomTypeForm(prev => ({ 
                      ...prev, 
                      tienNghiDacBiet: [...prev.tienNghiDacBiet, ''] 
                    }));
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Thêm tiện nghi
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomTypeModal;