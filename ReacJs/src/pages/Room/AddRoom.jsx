import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Image } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const AddRoomModal = ({ showModal, onClose, onSuccess, roomTypes, selectedRoomType }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maLoaiPhong: selectedRoomType || '',
    soPhong: '',              // ✅ THÊM
    tang: 1,                 // ✅ THÊM
    loaiView: 'none',        // ✅ THÊM
    dienTich: '',
    moTa: '',
    soLuongGiuong: '',
    soLuongNguoiToiDa: '',
    cauHinhGiuong: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // ✅ THÊM: Danh sách view options
  const viewOptions = [
    { value: 'none', label: 'Không có view đặc biệt' },
    { value: 'sea_view', label: 'View biển' },
    { value: 'city_view', label: 'View thành phố' },
    { value: 'garden_view', label: 'View vườn' },
    { value: 'mountain_view', label: 'View núi' },
    { value: 'pool_view', label: 'View hồ bơi' }
  ];

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

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 10) {
      toast.error('Chỉ được upload tối đa 10 hình ảnh');
      return;
    }

    setImageFiles(files);

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
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
    
    if (imageFiles.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 hình ảnh phòng');
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

      // Append images
      imageFiles.forEach(file => {
        submitData.append('hinhAnh', file);
      });

      const response = await axios.post(
        `${baseUrl}/api/room-hotel/hotelowner/create-room`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data?.success) {
        toast.success(`Tạo phòng ${formData.soPhong} thành công!`);
        onSuccess();
        resetForm();
      } else {
        toast.error(response.data?.message || 'Tạo phòng thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi tạo phòng:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      maLoaiPhong: selectedRoomType || '',
      soPhong: '',
      tang: 1,
      loaiView: 'none',
      dienTich: '',
      moTa: '',
      soLuongGiuong: '',
      soLuongNguoiToiDa: '',
      cauHinhGiuong: []
    });
    setImageFiles([]);
    setPreviewImages([]);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Thêm phòng mới</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại phòng *
              </label>
              <select
                required
                value={formData.maLoaiPhong}
                onChange={(e) => handleInputChange('maLoaiPhong', e.target.value)}
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

            {/* ✅ THÊM: Room Number và Room Info */}
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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh phòng * (Tối đa 10 ảnh)
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                          <Image className="w-4 h-4 text-gray-600" />
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
                placeholder={`Mô tả chi tiết về phòng ${formData.soPhong || ''}...`}
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
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  `Tạo phòng ${formData.soPhong || ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;