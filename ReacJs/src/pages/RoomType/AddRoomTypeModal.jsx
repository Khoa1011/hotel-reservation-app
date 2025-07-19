import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const AddRoomTypeModal = ({ showModal, onClose, onSubmit }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const hotelId = localStorage.getItem("selectedHotelId");
  const [roomTypeForm, setRoomTypeForm] = useState({
    tenLoaiPhong: '',
    giaCa: '',
    moTa: '',
    tienNghiDacBiet: [],
    tongSoPhong: ''
  });

  const [submitting, setSubmitting] = useState(false);

  if (!showModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return; // Prevent double submission
    setSubmitting(true);

    try {
      const newRoomType = {
        maKhachSan: hotelId,
        tenLoaiPhong: roomTypeForm.tenLoaiPhong,
        giaCa: parseFloat(roomTypeForm.giaCa),
        moTa: roomTypeForm.moTa,
        tienNghiDacBiet: roomTypeForm.tienNghiDacBiet,
        tongSoPhong: parseInt(roomTypeForm.tongSoPhong),
      };

      const response = await axios.post(
        `${baseUrl}/api/roomType-hotel/hotelowner/create-roomtype`,
        newRoomType,
        { withCredentials: true }
      );

      console.log(response.data);

      if (response.data?.success === true) {
        toast.success(response.data.message || 'Tạo loại phòng thành công!');
        
        
        if (onSubmit) {
          onSubmit(response.data.loaiPhong); // Pass data từ API response
        }
        
        // Reset form và đóng modal
        setRoomTypeForm({
          tenLoaiPhong: '',
          giaCa: '',
          moTa: '',
          tienNghiDacBiet: [],
          tongSoPhong: ''
        });
        
        onClose(); // ✅ Sửa từ onclose thành onClose
        
      } else {
        toast.error(response.data.message || 'Tạo loại phòng không thành công!');
      }
    } catch (error) {
      console.error('Lỗi tạo loại phòng', error);
      
      // Handle error response từ server
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Lỗi tạo loại phòng!';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return; // Prevent closing while submitting
    
    // Reset form khi đóng modal
    setRoomTypeForm({
      tenLoaiPhong: '',
      giaCa: '',
      moTa: '',
      tienNghiDacBiet: [],
      tongSoPhong: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Thêm loại phòng mới</h2>
          
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
              <div>
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
              </div>
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
                {submitting ? 'Đang tạo...' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRoomTypeModal;