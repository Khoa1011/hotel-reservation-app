import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Settings } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const EditRoomModal = ({ showModal, onClose, onSuccess, roomTypes, room }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trangThaiPhong: 'trong',
    soPhong: '',
    tang: 1,
    loaiView: 'none',
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
  
  // ✅ THÊM: Amenities states
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [roomAmenities, setRoomAmenities] = useState([]); // Current room amenities
  const [newAmenities, setNewAmenities] = useState([]); // New amenities to add
  const [amenitiesToDelete, setAmenitiesToDelete] = useState([]); // Amenities to remove
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [showAmenitiesTab, setShowAmenitiesTab] = useState(false);
  
  const [originalRoomNumber, setOriginalRoomNumber] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Helper function để tạo image URL với fallback
  const getImageUrl = (imagePath, addTimestamp = true) => {
    const timestamp = addTimestamp ? `?t=${Date.now()}` : '';
    return `${baseUrl}${imagePath}${timestamp}`;
  };

  // Room status options
  const statusOptions = [
    { value: 'trong', label: 'Trống', color: 'text-green-600' },
    { value: 'da_dat', label: 'Đã đặt', color: 'text-red-600' },
    { value: 'dang_su_dung', label: 'Đang sử dụng', color: 'text-orange-600' },
    { value: 'bao_tri', label: 'Bảo trì', color: 'text-yellow-600' }
  ];

  const viewOptions = [
    { value: 'none', label: 'Không có view đặc biệt' },
    { value: 'sea_view', label: 'View biển' },
    { value: 'city_view', label: 'View thành phố' },
    { value: 'garden_view', label: 'View vườn' },
    { value: 'mountain_view', label: 'View núi' },
    { value: 'pool_view', label: 'View hồ bơi' }
  ];

  // ✅ SỬA: Fetch available amenities với better debugging
  const fetchAvailableAmenities = async () => {
    setLoadingAmenities(true);
    try {
      console.log('🔄 Fetching available amenities...');
      
      const response = await axios.get(
        `${baseUrl}/api/amenities-hotel/hotelowner/amenities`,
        { withCredentials: true }
      );

      console.log('📦 Amenities API response:', response.data);

      if (response.data?.success) {
        const amenities = response.data.data.amenities || [];
        console.log(`✅ Loaded ${amenities.length} available amenities`);
        
        if (amenities.length > 0) {
          console.log('🔍 Sample amenities:', amenities.slice(0, 2));
        }
        
        setAvailableAmenities(amenities);
      } else {
        console.warn('⚠️ API returned success: false', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching available amenities:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Không thể tải danh sách tiện nghi');
    } finally {
      setLoadingAmenities(false);
    }
  };

  // ✅ SỬA: Fetch room amenities với better debugging
  const fetchRoomAmenities = async (roomId) => {
    if (!roomId) return;
    
    try {
      console.log(`🔄 Fetching amenities for room ${roomId}...`);
      
      const response = await axios.get(
        `${baseUrl}/api/amenities-hotel/hotelowner/room-amenities/${roomId}`,
        { withCredentials: true }
      );

      console.log('📦 Room amenities API response:', response.data);

      if (response.data?.success) {
        const amenities = response.data.data.amenities || [];
        console.log(`✅ Loaded ${amenities.length} room amenities`);
        
        if (amenities.length > 0) {
          console.log('🔍 Sample room amenities:', amenities.slice(0, 2));
        }
        
        setRoomAmenities(amenities);
      } else {
        console.warn('⚠️ Room amenities API returned success: false');
        setRoomAmenities([]);
      }
    } catch (error) {
      console.error('❌ Error fetching room amenities:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setRoomAmenities([]);
      // Don't show error toast - amenities are optional
    }
  };

  // Initialize form data when room changes
  useEffect(() => {
    if (room && showModal) {
      console.log('🏨 Loading room data for edit:', room);
      
      setFormData({
        trangThaiPhong: room.trangThaiPhong || 'trong',
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
      
      // Load images
      const images = room.hinhAnh || [];
      console.log('🖼️ Loading existing images:', images);
      setExistingImages(images);
      
      // Reset states
      setImagesToDelete([]);
      setNewImageFiles([]);
      setPreviewNewImages([]);
      setAmenitiesToDelete([]);
      setNewAmenities([]);
      
      // Load amenities
      fetchAvailableAmenities();
      fetchRoomAmenities(room._id);
    }
  }, [room, showModal]);

  // Debug image URLs khi modal mở
  useEffect(() => {
    if (showModal && room && existingImages.length > 0) {
      console.log('🔍 Debug image URLs:', {
        baseUrl: baseUrl,
        sampleImage: existingImages[0],
        generatedUrl: getImageUrl(existingImages[0].url_anh)
      });
    }
  }, [showModal, room, existingImages]);

  // Cleanup preview URLs khi component unmount
  useEffect(() => {
    return () => {
      previewNewImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewNewImages]);

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

    // Cleanup old preview URLs
    previewNewImages.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    setNewImageFiles(files);
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

  // ✅ THÊM: Amenities management functions
  const addNewAmenity = () => {
    setNewAmenities(prev => [...prev, { 
      maTienNghi: '', 
      soLuong: 1, 
      trangThai: true, 
      moTa: '' 
    }]);
  };

  const removeNewAmenity = (index) => {
    setNewAmenities(prev => prev.filter((_, i) => i !== index));
  };

  const updateNewAmenity = (index, field, value) => {
    setNewAmenities(prev => prev.map((amenity, i) => 
      i === index ? { ...amenity, [field]: value } : amenity
    ));
  };

  const markAmenityForDeletion = (detailId) => {
    setAmenitiesToDelete(prev => [...prev, detailId]);
  };

  const unmarkAmenityForDeletion = (detailId) => {
    setAmenitiesToDelete(prev => prev.filter(id => id !== detailId));
  };

  const updateExistingAmenity = (detailId, field, value) => {
    setRoomAmenities(prev => prev.map(amenity => 
      amenity._id === detailId ? { ...amenity, [field]: value } : amenity
    ));
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

  // Validate số phòng
  const validateRoomNumber = (roomNumber) => {
    if (!roomNumber.trim()) return 'Vui lòng nhập số phòng';
    if (roomNumber.length < 1 || roomNumber.length > 10) return 'Số phòng phải từ 1-10 ký tự';
    if (!/^[A-Z0-9]+$/i.test(roomNumber)) return 'Số phòng chỉ được chứa chữ cái và số';
    return null;
  };

  // Force reload images function
  const forceReloadImages = () => {
    const images = document.querySelectorAll('img[src*="/uploads/"]');
    images.forEach(img => {
      const originalSrc = img.src.split('?')[0];
      img.src = `${originalSrc}?t=${Date.now()}`;
    });
    toast.info('Đang tải lại tất cả hình ảnh...');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate số phòng
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
      // STEP 1: Update room basic info
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'cauHinhGiuong') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      if (imagesToDelete.length > 0) {
        submitData.append('deleteImages', JSON.stringify(imagesToDelete));
      }

      newImageFiles.forEach(file => {
        submitData.append('hinhAnh', file);
      });

      console.log('📤 Updating room:', {
        roomId: room._id,
        soPhong: formData.soPhong,
        amenityChanges: {
          toDelete: amenitiesToDelete.length,
          toAdd: newAmenities.length,
          toUpdate: roomAmenities.filter(a => !amenitiesToDelete.includes(a._id)).length
        }
      });

      const response = await axios.put(
        `${baseUrl}/api/room-hotel/hotelowner/update-room/${room._id}`,
        submitData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Cập nhật phòng thất bại');
      }

      // STEP 2: Handle amenity deletions
      for (const detailId of amenitiesToDelete) {
        try {
          await axios.delete(
            `${baseUrl}/api/amenities-hotel/hotelowner/room-amenity-detail/${detailId}`,
            { withCredentials: true }
          );
        } catch (error) {
          console.error('Error deleting amenity:', error);
        }
      }

      // STEP 3: Handle amenity updates
      const amenitiesToUpdate = roomAmenities.filter(a => 
        !amenitiesToDelete.includes(a._id)
      );

      for (const amenity of amenitiesToUpdate) {
        try {
          await axios.put(
            `${baseUrl}/api/amenities-hotel/hotelowner/room-amenity-detail/${amenity._id}`,
            {
              soLuong: amenity.soLuong,
              trangThai: amenity.trangThai,
              moTa: amenity.moTa
            },
            { withCredentials: true }
          );
        } catch (error) {
          console.error('Error updating amenity:', error);
        }
      }

      // STEP 4: Add new amenities
      if (newAmenities.length > 0) {
        const validNewAmenities = newAmenities.filter(a => 
          a.maTienNghi && a.soLuong > 0
        );

        if (validNewAmenities.length > 0) {
          try {
            await axios.post(
              `${baseUrl}/api/amenities-hotel/hotelowner/room-amenities-bulk/${room._id}`,
              { amenities: validNewAmenities },
              { withCredentials: true }
            );
          } catch (error) {
            console.error('Error adding new amenities:', error);
          }
        }
      }

      toast.success(`Cập nhật phòng ${formData.soPhong} thành công!`);
      onSuccess();
      
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật phòng:', error);
      
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Sửa phòng</h2>
              <p className="text-sm text-gray-600">Phòng {originalRoomNumber}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ✅ THÊM: Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setShowAmenitiesTab(false)}
              className={`px-4 py-2 font-medium text-sm ${
                !showAmenitiesTab 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Thông tin phòng
            </button>
            <button
              onClick={() => setShowAmenitiesTab(true)}
              className={`px-4 py-2 font-medium text-sm ${
                showAmenitiesTab 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Tiện nghi ({roomAmenities.length})
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showAmenitiesTab ? (
              // ✅ TAB 1: Room Information
              <>
                {/* Room Type Info (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phòng
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {room.maLoaiPhong?.tenLoaiPhong} - {formatCurrency(room.maLoaiPhong?.giaCa || 0)}
                  </div>
                </div>

                {/* Room Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số phòng <span className="text-red-500">*</span>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tầng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formData.tang}
                      onChange={(e) => handleInputChange('tang', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Trạng thái phòng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.trangThaiPhong}
                    onChange={(e) => handleInputChange('trangThaiPhong', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Existing Images */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Hình ảnh hiện tại ({existingImages.length} ảnh)
                    </label>
                    <button
                      type="button"
                      onClick={forceReloadImages}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      🔄 Tải lại hình ảnh
                    </button>
                  </div>
                  
                  {existingImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {existingImages.map((image, index) => (
                        <div key={image._id || index} className="relative">
                          <img
                            src={getImageUrl(image.url_anh)}
                            alt={`Room ${formData.soPhong} image ${index + 1}`}
                            className={`w-full h-32 object-cover rounded-lg border ${
                              imagesToDelete.includes(image._id) ? 'opacity-50 grayscale' : ''
                            }`}
                            onError={(e) => {
                              e.target.src = getImageUrl(image.url_anh, false);
                              e.target.onerror = () => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              };
                            }}
                          />
                          
                          <div 
                            className="w-full h-32 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500"
                            style={{ display: 'none' }}
                          >
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-xs">Lỗi tải ảnh</span>
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            {imagesToDelete.includes(image._id) ? (
                              <button
                                type="button"
                                onClick={() => unmarkImageForDeletion(image._id)}
                                className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markImageForDeletion(image._id)}
                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Không có hình ảnh hiện tại</p>
                    </div>
                  )}
                </div>

                {/* New Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thêm hình ảnh mới
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleNewImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {previewNewImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng giường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.soLuongGiuong}
                      onChange={(e) => handleInputChange('soLuongGiuong', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số người tối đa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.soLuongNguoiToiDa}
                    onChange={(e) => handleInputChange('soLuongNguoiToiDa', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.moTa}
                    onChange={(e) => handleInputChange('moTa', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-300"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Thêm cấu hình giường
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // ✅ TAB 2: Amenities Management
              <div className="space-y-6">
                {/* Current Amenities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Tiện nghi hiện tại ({roomAmenities.length - amenitiesToDelete.length}/{roomAmenities.length})
                  </h3>
                  
                  {roomAmenities.length > 0 ? (
                    <div className="space-y-3">
                      {roomAmenities.map((amenity) => (
                        <div key={amenity._id} className={`border rounded-lg p-3 ${
                          amenitiesToDelete.includes(amenity._id) ? 'bg-red-50 border-red-200' : 'border-gray-200'
                        }`}>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div className="md:col-span-2">
                              <div className="font-medium text-gray-900">
                                {amenity.maTienNghi?.tenTienNghi}
                              </div>
                              <div className="text-sm text-gray-500">
                                {amenity.maTienNghi?.icon} {amenity.maTienNghi?.moTa}
                              </div>
                            </div>
                            
                            <div>
                              <input
                                type="number"
                                min="1"
                                value={amenity.soLuong}
                                onChange={(e) => updateExistingAmenity(amenity._id, 'soLuong', parseInt(e.target.value) || 1)}
                                disabled={amenitiesToDelete.includes(amenity._id)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={amenity.trangThai}
                                  onChange={(e) => updateExistingAmenity(amenity._id, 'trangThai', e.target.checked)}
                                  disabled={amenitiesToDelete.includes(amenity._id)}
                                  className="mr-1"
                                />
                                <span className="text-xs">Hoạt động</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => 
                                  amenitiesToDelete.includes(amenity._id) 
                                    ? unmarkAmenityForDeletion(amenity._id)
                                    : markAmenityForDeletion(amenity._id)
                                }
                                className={`px-2 py-1 rounded text-sm ${
                                  amenitiesToDelete.includes(amenity._id)
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {amenitiesToDelete.includes(amenity._id) ? (
                                  <Plus className="w-4 h-4" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Mô tả */}
                          <div className="mt-2">
                            <input
                              type="text"
                              value={amenity.moTa || ''}
                              onChange={(e) => updateExistingAmenity(amenity._id, 'moTa', e.target.value)}
                              disabled={amenitiesToDelete.includes(amenity._id)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                              placeholder="Mô tả chi tiết"
                            />
                          </div>
                          
                          {amenitiesToDelete.includes(amenity._id) && (
                            <div className="mt-2 text-center">
                              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                Sẽ xóa tiện nghi này
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Phòng chưa có tiện nghi nào</p>
                    </div>
                  )}
                </div>

                {/* Add New Amenities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Thêm tiện nghi mới ({newAmenities.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {newAmenities.map((amenity, index) => (
                      <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div className="md:col-span-2">
                            <select
                              value={amenity.maTienNghi}
                              onChange={(e) => updateNewAmenity(index, 'maTienNghi', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Chọn tiện nghi</option>
                              {availableAmenities
                                .filter(a => 
                                  // Loại bỏ tiện nghi đã có trong phòng
                                  !roomAmenities.some(existing => 
                                    existing.maTienNghi?._id === a._id && 
                                    !amenitiesToDelete.includes(existing._id)
                                  ) &&
                                  // Loại bỏ tiện nghi đã chọn trong new amenities
                                  !newAmenities.some((newA, i) => 
                                    i !== index && newA.maTienNghi === a._id
                                  )
                                )
                                .map((a) => (
                                  <option key={a._id} value={a._id}>
                                    {a.tenTienNghi} {a.maNhomTienNghi?.tenNhomTienNghi ? `(${a.maNhomTienNghi.tenNhomTienNghi})` : ''}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          <div>
                            <input
                              type="number"
                              min="1"
                              value={amenity.soLuong}
                              onChange={(e) => updateNewAmenity(index, 'soLuong', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Số lượng"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={amenity.trangThai}
                                onChange={(e) => updateNewAmenity(index, 'trangThai', e.target.checked)}
                                className="mr-1"
                              />
                              <span className="text-xs">Hoạt động</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeNewAmenity(index)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Mô tả */}
                        <div className="mt-2">
                          <input
                            type="text"
                            value={amenity.moTa}
                            onChange={(e) => updateNewAmenity(index, 'moTa', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả chi tiết (tùy chọn)"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addNewAmenity}
                      disabled={loadingAmenities}
                      className="w-full px-3 py-2 border-2 border-dashed border-green-300 text-green-600 rounded-lg hover:border-green-400 hover:text-green-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      {loadingAmenities ? 'Đang tải tiện nghi...' : 'Thêm tiện nghi mới'}
                    </button>
                  </div>
                </div>

                {/* Amenities Summary */}
                {(amenitiesToDelete.length > 0 || newAmenities.length > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Tóm tắt thay đổi:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {amenitiesToDelete.length > 0 && (
                        <div>• Sẽ xóa {amenitiesToDelete.length} tiện nghi</div>
                      )}
                      {newAmenities.filter(a => a.maTienNghi).length > 0 && (
                        <div>• Sẽ thêm {newAmenities.filter(a => a.maTienNghi).length} tiện nghi mới</div>
                      )}
                      <div>• Tổng tiện nghi sau khi cập nhật: {
                        roomAmenities.length - amenitiesToDelete.length + newAmenities.filter(a => a.maTienNghi).length
                      }</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
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