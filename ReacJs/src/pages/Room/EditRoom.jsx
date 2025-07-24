import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const EditRoomModal = ({ showModal, onClose, onSuccess, roomTypes, room }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trangThaiPhong: false,
    soPhong: '',              // ✅ THÊM
    tang: 1,                 // ✅ THÊM
    loaiView: 'none',        // ✅ THÊM
    dienTich: '',
    moTa: '',
    soLuongGiuong: '',
    soLuongNguoiToiDa: '',
    cauHinhGiuong: []
  });
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [previewNewImages, setPreviewNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  // ✅ THÊM: Original room number để detect changes
  const [originalRoomNumber, setOriginalRoomNumber] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // ✅ THÊM: View options
  const viewOptions = [
    { value: 'none', label: 'Không có view đặc biệt' },
    { value: 'sea_view', label: 'View biển' },
    { value: 'city_view', label: 'View thành phố' },
    { value: 'garden_view', label: 'View vườn' },
    { value: 'mountain_view', label: 'View núi' },
    { value: 'pool_view', label: 'View hồ bơi' }
  ];

  // Initialize form data when room changes
  useEffect(() => {
    if (room && showModal) {
      setFormData({
        trangThaiPhong: room.trangThaiPhong || false,
        soPhong: room.soPhong || '',                   
        tang: room.tang || 1,                          
        loaiView: room.loaiView || 'none',             
        dienTich: room.dienTich?.toString() || '',
        moTa: room.moTa || '',
        soLuongGiuong: room.soLuongGiuong?.toString() || '',
        soLuongNguoiToiDa: room.soLuongNguoiToiDa?.toString() || '',
        cauHinhGiuong: room.cauHinhGiuong || []
      });
      setOriginalRoomNumber(room.soPhong || '');       
      setExistingImages(room.hinhAnh || []);
      setImagesToDelete([]);
      setNewImageFiles([]);
      setPreviewNewImages([]);
    }
  }, [room, showModal]);

  // Utility function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new image upload
  const handleNewImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + existingImages.length - imagesToDelete.length > 10) {
      toast.error('Tổng số hình ảnh không được vượt quá 10');
      return;
    }

    setNewImageFiles(files);

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewNewImages(previews);
  };

  // Handle existing image deletion
  const markImageForDeletion = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const unmarkImageForDeletion = (imageId) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId));
  };

  // Handle bed configuration
  const addBedConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      cauHinhGiuong: [...prev.cauHinhGiuong, { loaiGiuong: '', soLuong: 1 }]
    }));
  };

  const removeBedConfiguration = (index) => {
    setFormData(prev => ({
      ...prev,
      cauHinhGiuong: prev.cauHinhGiuong.filter((_, i) => i !== index)
    }));
  };

  const updateBedConfiguration = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cauHinhGiuong: prev.cauHinhGiuong.map((bed, i) => 
        i === index ? { ...bed, [field]: value } : bed
      )
    }));
  };

  // ✅ THÊM: Validate số phòng
  const validateRoomNumber = (roomNumber) => {
    if (!roomNumber.trim()) return 'Vui lòng nhập số phòng';
    if (roomNumber.length < 1 || roomNumber.length > 10) return 'Số phòng phải từ 1-10 ký tự';
    if (!/^[A-Z0-9]+$/i.test(roomNumber)) return 'Số phòng chỉ được chứa chữ cái và số';
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate số phòng
    const roomNumberError = validateRoomNumber(formData.soPhong);
    if (roomNumberError) {
      toast.error(roomNumberError);
      return;
    }
    
    const remainingImages = existingImages.length - imagesToDelete.length + newImageFiles.length;
    if (remainingImages === 0) {
      toast.error('Phòng phải có ít nhất 1 hình ảnh');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key === 'cauHinhGiuong') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append images to delete
      if (imagesToDelete.length > 0) {
        submitData.append('deleteImages', JSON.stringify(imagesToDelete));
      }

      // Append new images
      newImageFiles.forEach(file => {
        submitData.append('hinhAnh', file);
      });

      const response = await axios.put(
        `${baseUrl}/api/room-hotel/hotelowner/update-room/${room._id}`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data?.success) {
        toast.success(`Cập nhật phòng ${formData.soPhong} thành công!`);
        onSuccess();
      } else {
        toast.error(response.data?.message || 'Cập nhật phòng thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật phòng:', error);
      
      // ✅ Handle duplicate room number error
      if (error.response?.status === 400 && error.response?.data?.message?.includes('đã tồn tại')) {
        toast.error(`Số phòng ${formData.soPhong} đã tồn tại. Vui lòng chọn số phòng khác.`);
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật phòng');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!showModal || !room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Sửa phòng</h2>
              <p className="text-sm text-gray-600">Phòng {originalRoomNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Type Info (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại phòng
              </label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                {room.maLoaiPhong?.tenLoaiPhong} - {formatCurrency(room.maLoaiPhong?.giaCa || 0)}
              </div>
            </div>

            {/* ✅ THÊM: Room Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số phòng *
                </label>
                <input
                  type="text"
                  required
                  value={formData.soPhong}
                  onChange={(e) => handleInputChange('soPhong', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 101, A01"
                  maxLength="10"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ chữ cái và số, tối đa 10 ký tự</p>
                {/* {formData.soPhong !== originalRoomNumber && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Đang thay đổi từ "{originalRoomNumber}"
                  </p>
                )} */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tầng *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.tang}
                  onChange={(e) => handleInputChange('tang', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại view
                </label>
                <select
                  value={formData.loaiView}
                  onChange={(e) => handleInputChange('loaiView', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {viewOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái phòng
              </label>
              <select
                value={formData.trangThaiPhong}
                onChange={(e) => handleInputChange('trangThaiPhong', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={false}>Trống</option>
                <option value={true}>Đã đặt</option>
              </select>
            </div>

            {/* Existing Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh hiện tại
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {existingImages.map((image, index) => (
                  <div key={image._id} className="relative">
                    <img
                      src={`${baseUrl}${image.url_anh}`}
                      alt={`Room ${formData.soPhong} image ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-lg border ${
                        imagesToDelete.includes(image._id) ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    <div className="absolute top-2 right-2">
                      {imagesToDelete.includes(image._id) ? (
                        <button
                          type="button"
                          onClick={() => unmarkImageForDeletion(image._id)}
                          className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600"
                          title="Khôi phục ảnh"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markImageForDeletion(image._id)}
                          className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {imagesToDelete.includes(image._id) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                          Sẽ xóa
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* New Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thêm hình ảnh mới
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {previewNewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewNewImages.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`New preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Room Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diện tích (m²)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.dienTich}
                  onChange={(e) => handleInputChange('dienTich', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 35"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng giường *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.soLuongGiuong}
                  onChange={(e) => handleInputChange('soLuongGiuong', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số người tối đa *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.soLuongNguoiToiDa}
                onChange={(e) => handleInputChange('soLuongNguoiToiDa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả *
              </label>
              <textarea
                required
                rows={4}
                value={formData.moTa}
                onChange={(e) => handleInputChange('moTa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Mô tả chi tiết về phòng ${formData.soPhong}...`}
              />
            </div>

            {/* Bed Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cấu hình giường
              </label>
              <div className="space-y-2">
                {formData.cauHinhGiuong.map((bed, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={bed.loaiGiuong}
                      onChange={(e) => updateBedConfiguration(index, 'loaiGiuong', e.target.value)}
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
                      onChange={(e) => updateBedConfiguration(index, 'soLuong', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SL"
                    />
                    <button
                      type="button"
                      onClick={() => removeBedConfiguration(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBedConfiguration}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Thêm cấu hình giường
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  `Cập nhật phòng ${formData.soPhong}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;