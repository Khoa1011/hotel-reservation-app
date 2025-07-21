import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const EditRoomTypeModal = ({ showModal, roomType, onClose, onSubmit }) => {
  const [roomTypeForm, setRoomTypeForm] = useState({
    tenLoaiPhong: '',
    giaCa: '',
    moTa: '',
    tienNghiDacBiet: [],
    // tongSoPhong: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Cập nhật form khi roomType thay đổi
  useEffect(() => {
    if (roomType) {
      setRoomTypeForm({
        tenLoaiPhong: roomType.tenLoaiPhong || '',
        giaCa: roomType.giaCa?.toString() || '',
        moTa: roomType.moTa || '',
        tienNghiDacBiet: roomType.tienNghiDacBiet || [],
        // tongSoPhong: roomType.tongSoPhong?.toString() || ''
      });
    }
  }, [roomType]);

  if (!showModal || !roomType) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    setSubmitting(true);

    try {
      const updatedData = {
        tenLoaiPhong: roomTypeForm.tenLoaiPhong.trim(),
        giaCa: parseFloat(roomTypeForm.giaCa),
        moTa: roomTypeForm.moTa.trim(),
        tienNghiDacBiet: roomTypeForm.tienNghiDacBiet.filter(item => item.trim() !== ''),
        // tongSoPhong: parseInt(roomTypeForm.tongSoPhong) || 0
      };

      const response = await axios.put(
        `${baseUrl}/api/roomType-hotel/hotelowner/update-roomtype/${roomType._id}`,
        updatedData,
        { withCredentials: true }
      );

      if (response.data?.success) {
        toast.success(response.data.message || 'Cập nhật loại phòng thành công!');
        
        // Gọi callback để parent component xử lý
        if (onSubmit) {
          onSubmit(response.data.loaiPhong);
        }
        
        onClose();
      } else {
        toast.error(response.data?.message || 'Cập nhật loại phòng không thành công!');
      }
    } catch (error) {
      console.error('Lỗi cập nhật loại phòng:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Lỗi khi cập nhật loại phòng!';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    
    // Reset form về giá trị ban đầu khi đóng modal
    if (roomType) {
      setRoomTypeForm({
        tenLoaiPhong: roomType.tenLoaiPhong || '',
        giaCa: roomType.giaCa?.toString() || '',
        moTa: roomType.moTa || '',
        tienNghiDacBiet: roomType.tienNghiDacBiet || [],
        // tongSoPhong: roomType.tongSoPhong?.toString() || ''
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
                disabled={submitting}
                value={roomTypeForm.tenLoaiPhong}
                onChange={(e) => setRoomTypeForm(prev => ({ ...prev, tenLoaiPhong: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={submitting}
                  value={roomTypeForm.giaCa}
                  onChange={(e) => setRoomTypeForm(prev => ({ ...prev, giaCa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="VD: 1500000"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng số phòng
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={submitting}
                  value={roomTypeForm.tongSoPhong}
                  onChange={(e) => setRoomTypeForm(prev => ({ ...prev, tongSoPhong: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="VD: 10"
                />
              </div> */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                rows={3}
                disabled={submitting}
                value={roomTypeForm.moTa}
                onChange={(e) => setRoomTypeForm(prev => ({ ...prev, moTa: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={submitting}
                      value={amenity}
                      onChange={(e) => {
                        const newAmenities = [...roomTypeForm.tienNghiDacBiet];
                        newAmenities[index] = e.target.value;
                        setRoomTypeForm(prev => ({ ...prev, tienNghiDacBiet: newAmenities }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="VD: Wifi miễn phí"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        const newAmenities = roomTypeForm.tienNghiDacBiet.filter((_, i) => i !== index);
                        setRoomTypeForm(prev => ({ ...prev, tienNghiDacBiet: newAmenities }));
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setRoomTypeForm(prev => ({ 
                      ...prev, 
                      tienNghiDacBiet: [...prev.tienNghiDacBiet, ''] 
                    }));
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Thêm tiện nghi
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomTypeModal;