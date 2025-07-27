import { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText, Building, Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';


const HotelPartnerForm = ({ onBackToLogin }) => {
    const [registrationStep, setRegistrationStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false); // Thêm state này

    // States cho địa chỉ API
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState({
        provinces: false,
        districts: false,
        wards: false
    });
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const [hotelFormData, setHotelFormData] = useState({
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerCCCD: '',
        hotelName: '',
        hotelType: 'khachSan',
        businessLicense: '',
        taxCode: '',
        address: {
            soNha: '',
            tenDuong: '',
            phuong: '',
            phuongId: '',
            quan: '',
            quanId: '',
            thanhPho: '',
            thanhPhoId: '',
            tinhThanh: '',
            tinhThanhId: ''
        },
        documents: {
            cccdFront: null,
            cccdBack: null,
            businessLicense: null,
            hotelPhoto: null,
            hotelPhotos: [],
            fireCertificate: null
        }
    });

    // Fetch provinces khi component mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        setLoadingLocation(prev => ({ ...prev, provinces: true }));
        try {
            const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
            const data = await response.json();
            if (data.error === 0) {
                setProvinces(data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách tỉnh thành:', error);
            toast.error('Không thể tải danh sách tỉnh thành');
        } finally {
            setLoadingLocation(prev => ({ ...prev, provinces: false }));
        }
    };

    const fetchDistricts = async (provinceId) => {
        setLoadingLocation(prev => ({ ...prev, districts: true }));
        try {
            const response = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
            const data = await response.json();
            if (data.error === 0) {
                setDistricts(data.data);
                setWards([]); // Reset wards khi thay đổi tỉnh
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách quận huyện:', error);
            toast.error('Không thể tải danh sách quận huyện');
        } finally {
            setLoadingLocation(prev => ({ ...prev, districts: false }));
        }
    };

    const fetchWards = async (districtId) => {
        setLoadingLocation(prev => ({ ...prev, wards: true }));
        try {
            const response = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
            const data = await response.json();
            if (data.error === 0) {
                setWards(data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách phường xã:', error);
            toast.error('Không thể tải danh sách phường xã');
        } finally {
            setLoadingLocation(prev => ({ ...prev, wards: false }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!hotelFormData.ownerName.trim()) {
                newErrors.ownerName = 'Vui lòng nhập họ tên chủ khách sạn';
            }
            if (!hotelFormData.ownerEmail.trim()) {
                newErrors.ownerEmail = 'Vui lòng nhập email';
            } else if (!/^\S+@\S+\.\S+$/.test(hotelFormData.ownerEmail)) {
                newErrors.ownerEmail = 'Email không hợp lệ';
            }
            if (!hotelFormData.ownerPhone.trim()) {
                newErrors.ownerPhone = 'Vui lòng nhập số điện thoại';
            } else if (!/^\d{10,11}$/.test(hotelFormData.ownerPhone)) {
                newErrors.ownerPhone = 'Số điện thoại không hợp lệ';
            }
            if (!hotelFormData.ownerCCCD.trim()) {
                newErrors.ownerCCCD = 'Vui lòng nhập số CCCD/CMND';
            }
        }

        if (step === 2) {
            if (!hotelFormData.hotelName.trim()) {
                newErrors.hotelName = 'Vui lòng nhập tên khách sạn';
            }
            if (!hotelFormData.businessLicense.trim()) {
                newErrors.businessLicense = 'Vui lòng nhập số giấy phép kinh doanh';
            }
            if (!hotelFormData.address.quanId) {
                newErrors['address.quan'] = 'Vui lòng chọn quận/huyện';
            }
            if (!hotelFormData.address.tinhThanhId) {
                newErrors['address.tinhThanh'] = 'Vui lòng chọn tỉnh/thành phố';
            }
        }

        if (step === 3) {
            if (!hotelFormData.documents.cccdFront) {
                newErrors.cccdFront = 'Vui lòng tải lên CCCD mặt trước';
            }
            if (!hotelFormData.documents.cccdBack) {
                newErrors.cccdBack = 'Vui lòng tải lên CCCD mặt sau';
            }
            if (!hotelFormData.documents.businessLicense) {
                newErrors.businessLicenseFile = 'Vui lòng tải lên giấy phép kinh doanh';
            }
            if (!hotelFormData.documents.hotelPhoto) {
                newErrors.hotelPhoto = 'Vui lòng tải lên hình ảnh khách sạn';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep(registrationStep)) {
            setRegistrationStep(registrationStep + 1);
            // Clear lỗi khi chuyển step và reset hasAttemptedSubmit
            setErrors({});
            setHasAttemptedSubmit(false);
        }
    };

    const handlePrevStep = () => {
        setRegistrationStep(registrationStep - 1);
        // Clear lỗi khi quay lại step trước và reset hasAttemptedSubmit
        setErrors({});
        setHasAttemptedSubmit(false);
    };

    const handleHotelInputChange = (e) => {
        const { name, value } = e.target;

        // Clear error khi người dùng bắt đầu nhập
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setHotelFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setHotelFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleLocationChange = (e, type) => {
        const { value } = e.target;
        const selectedOption = e.target.selectedOptions[0];
        const selectedText = selectedOption ? selectedOption.text : '';

        // Clear errors
        if (errors[`address.${type}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`address.${type}`];
                return newErrors;
            });
        }

        if (type === 'tinhThanh') {
            setHotelFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    tinhThanhId: value,
                    tinhThanh: selectedText,
                    quanId: '', // Reset district
                    quan: '',
                    phuongId: '', // Reset ward
                    phuong: ''
                }
            }));
            if (value) {
                fetchDistricts(value);
            } else {
                setDistricts([]);
                setWards([]);
            }
        } else if (type === 'quan') {
            setHotelFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    quanId: value,
                    quan: selectedText,
                    phuongId: '', // Reset ward
                    phuong: ''
                }
            }));
            if (value) {
                fetchWards(value);
            } else {
                setWards([]);
            }
        } else if (type === 'phuong') {
            setHotelFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    phuongId: value,
                    phuong: selectedText
                }
            }));
        }
    };

    const handleFileUpload = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File không được vượt quá 5MB');
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Chỉ chấp nhận file JPG, PNG hoặc PDF');
                return;
            }

            setHotelFormData(prev => ({
                ...prev,
                documents: {
                    ...prev.documents,
                    [fieldName]: file
                }
            }));

            // Clear error khi file được chọn
            if (errors[fieldName]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldName];
                    return newErrors;
                });
            }
        }
    };

    const uploadFileToServer = async (file, fieldName) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fieldName);

        try {
            // Giả sử bạn có endpoint upload file
            const response = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.fileUrl; // Trả về URL của file đã upload
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error(`Không thể tải lên ${fieldName}`);
        }
    };

    const handleHotelRegistration = async () => {
        // Đặt flag để biết đã attempt submit
        setHasAttemptedSubmit(true);

        if (!validateStep(3)) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            
            // Thêm thông tin cơ bản
            formData.append('ownerName', hotelFormData.ownerName);
            formData.append('ownerEmail', hotelFormData.ownerEmail);
            formData.append('ownerPhone', hotelFormData.ownerPhone);
            formData.append('ownerCCCD', hotelFormData.ownerCCCD);
            formData.append('hotelName', hotelFormData.hotelName);
            formData.append('hotelType', hotelFormData.hotelType);
            formData.append('businessLicense', hotelFormData.businessLicense);
            formData.append('taxCode', hotelFormData.taxCode || '');

            // Thêm địa chỉ
            formData.append('address[soNha]', hotelFormData.address.soNha || '');
            formData.append('address[tenDuong]', hotelFormData.address.tenDuong || '');
            formData.append('address[phuong]', hotelFormData.address.phuong || '');
            formData.append('address[quan]', hotelFormData.address.quan || '');
            formData.append('address[tinhThanh]', hotelFormData.address.tinhThanh || '');

            // ✅ Thêm các file thực sự
            if (hotelFormData.documents.cccdFront) {
                formData.append('cccdFront', hotelFormData.documents.cccdFront);
            }
            if (hotelFormData.documents.cccdBack) {
                formData.append('cccdBack', hotelFormData.documents.cccdBack);
            }
            if (hotelFormData.documents.businessLicense) {
                formData.append('businessLicenseFile', hotelFormData.documents.businessLicense);
            }
            if (hotelFormData.documents.hotelPhoto) {
                formData.append('hotelPhoto', hotelFormData.documents.hotelPhoto);
            }

            console.log("🚀 Sending FormData with files to server...", hotelFormData);

            // ✅ Gọi API với FormData (không cần set Content-Type, browser tự set)

            
            const response = await axios.post(
                `${baseUrl}/api/registration/admin/registrations-create`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                       'Content-Type': 'multipart/form-data'
                    },
                    // Theo dõi progress upload (optional)
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`📤 Upload progress: ${percentCompleted}%`);
                    }
                }
            );

            if (response.data.success) {
                toast.success('Đơn đăng ký khách sạn đã được gửi thành công! Chúng tôi sẽ liên hệ trong 24-48h.');

                // Reset form
                setHotelFormData({
                    ownerName: '',
                    ownerEmail: '',
                    ownerPhone: '',
                    ownerCCCD: '',
                    hotelName: '',
                    hotelType: 'khachSan',
                    businessLicense: '',
                    taxCode: '',
                    address: {
                        soNha: '',
                        tenDuong: '',
                        phuong: '',
                        phuongId: '',
                        quan: '',
                        quanId: '',
                        thanhPho: '',
                        thanhPhoId: '',
                        tinhThanh: '',
                        tinhThanhId: ''
                    },
                    documents: {
                        cccdFront: null,
                        cccdBack: null,
                        businessLicense: null,
                        hotelPhoto: null,
                        hotelPhotos: [],
                        fireCertificate: null
                    }
                });

                setRegistrationStep(1);
                setErrors({});
                setHasAttemptedSubmit(false);

                // Hiển thị thông tin file đã upload (nếu có)
                if (response.data.uploadedFiles) {
                    console.log("📁 Files uploaded:", response.data.uploadedFiles);
                }

                // Chuyển về trang login sau 3 giây
                setTimeout(() => {
                    onBackToLogin();
                }, 3000);

            } else {
                toast.error(response.data.message || 'Có lỗi xảy ra khi gửi đơn đăng ký');
            }
        } catch (error) {
            console.error('❌ Error submitting hotel registration:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.status === 400) {
                toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
            } else if (error.response?.status === 413) {
                toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn.');
            } else if (error.response?.status === 415) {
                toast.error('Định dạng file không được hỗ trợ.');
            } else if (error.response?.status === 409) {
                toast.error('Email đã được sử dụng bởi tài khoản khác.');
            } else if (error.response?.status >= 500) {
                toast.error('Lỗi hệ thống. Vui lòng thử lại sau.');
            } else {
                toast.error('Không thể gửi đơn đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (registrationStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin chủ khách sạn</h3>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="ownerName"
                                placeholder="Họ và tên chủ khách sạn"
                                value={hotelFormData.ownerName}
                                onChange={handleHotelInputChange}
                                className={`w-full pl-12 pr-4 py-3 border ${errors.ownerName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                required
                            />
                            {errors.ownerName && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" /> {errors.ownerName}
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="ownerEmail"
                                placeholder="Email liên hệ"
                                value={hotelFormData.ownerEmail}
                                onChange={handleHotelInputChange}
                                className={`w-full pl-12 pr-4 py-3 border ${errors.ownerEmail ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                required
                            />
                            {errors.ownerEmail && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" /> {errors.ownerEmail}
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="tel"
                                name="ownerPhone"
                                placeholder="Số điện thoại"
                                value={hotelFormData.ownerPhone}
                                onChange={handleHotelInputChange}
                                className={`w-full pl-12 pr-4 py-3 border ${errors.ownerPhone ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                required
                            />
                            {errors.ownerPhone && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" /> {errors.ownerPhone}
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="ownerCCCD"
                                placeholder="Số CCCD/CMND"
                                value={hotelFormData.ownerCCCD}
                                onChange={handleHotelInputChange}
                                className={`w-full pl-12 pr-4 py-3 border ${errors.ownerCCCD ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                required
                            />
                            {errors.ownerCCCD && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" /> {errors.ownerCCCD}
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin khách sạn</h3>

                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="hotelName"
                                placeholder="Tên khách sạn"
                                value={hotelFormData.hotelName}
                                onChange={handleHotelInputChange}
                                className={`w-full pl-12 pr-4 py-3 border ${errors.hotelName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                required
                            />
                            {errors.hotelName && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" /> {errors.hotelName}
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                name="hotelType"
                                value={hotelFormData.hotelType}
                                onChange={handleHotelInputChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            >
                                <option value="khachSan">Khách sạn</option>
                                <option value="khuNghiDuong">Khu nghỉ dương</option>
                                <option value="nhaNghi">Nhà nghỉ</option>
                                <option value="kyTucXa">Ký túc xá</option>
                                <option value="canHo">Căn hộ</option>
                                <option value="bietThu">Biệt thự</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="businessLicense"
                                    placeholder="Số giấy phép KD"
                                    value={hotelFormData.businessLicense}
                                    onChange={handleHotelInputChange}
                                    className={`w-full pl-12 pr-4 py-3 border ${errors.businessLicense ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                    required
                                />
                                {errors.businessLicense && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center">
                                        <XCircle className="w-3 h-3 mr-1" /> {errors.businessLicense}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="taxCode"
                                    placeholder="Mã số thuế"
                                    value={hotelFormData.taxCode}
                                    onChange={handleHotelInputChange}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            <div className={`border-2 ${(hasAttemptedSubmit && errors.hotelPhoto) ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Hình ảnh khách sạn</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'hotelPhoto')}
                                        className="hidden"
                                        id="hotel-photo"
                                    />
                                    <label
                                        htmlFor="hotel-photo"
                                        className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                                    >
                                        Chọn file
                                    </label>
                                    {hotelFormData.documents.hotelPhoto ? (
                                        <p className="text-green-600 text-xs mt-1">
                                            ✓ {hotelFormData.documents.hotelPhoto.name}
                                        </p>
                                    ) : (hasAttemptedSubmit && errors.hotelPhoto) && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                            <XCircle className="w-3 h-3 mr-1" /> {errors.hotelPhoto}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Địa chỉ khách sạn:</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        name="address.soNha"
                                        placeholder="Số nhà"
                                        value={hotelFormData.address.soNha}
                                        onChange={handleHotelInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        name="address.tenDuong"
                                        placeholder="Tên đường"
                                        value={hotelFormData.address.tenDuong}
                                        onChange={handleHotelInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <select
                                    value={hotelFormData.address.tinhThanhId}
                                    onChange={(e) => handleLocationChange(e, 'tinhThanh')}
                                    className={`w-full px-4 py-2 border ${errors['address.tinhThanh'] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    required
                                    disabled={loadingLocation.provinces}
                                >
                                    <option value="">
                                        {loadingLocation.provinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}
                                    </option>
                                    {provinces.map((province) => (
                                        <option key={province.id} value={province.id}>
                                            {province.full_name}
                                        </option>
                                    ))}
                                </select>
                                {errors['address.tinhThanh'] && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center">
                                        <XCircle className="w-3 h-3 mr-1" /> {errors['address.tinhThanh']}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <select
                                        value={hotelFormData.address.quanId}
                                        onChange={(e) => handleLocationChange(e, 'quan')}
                                        className={`w-full px-4 py-2 border ${errors['address.quan'] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        required
                                        disabled={!hotelFormData.address.tinhThanhId || loadingLocation.districts}
                                    >
                                        <option value="">
                                            {loadingLocation.districts ? 'Đang tải...' : 'Chọn Quận/Huyện'}
                                        </option>
                                        {districts.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.full_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors['address.quan'] && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <XCircle className="w-3 h-3 mr-1" /> {errors['address.quan']}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <select
                                        value={hotelFormData.address.phuongId}
                                        onChange={(e) => handleLocationChange(e, 'phuong')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!hotelFormData.address.quanId || loadingLocation.wards}
                                    >
                                        <option value="">
                                            {loadingLocation.wards ? 'Đang tải...' : 'Chọn Phường/Xã'}
                                        </option>
                                        {wards.map((ward) => (
                                            <option key={ward.id} value={ward.id}>
                                                {ward.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tài liệu đính kèm</h3>

                        <div className="space-y-4">
                            <div className={`border-2 ${(hasAttemptedSubmit && errors.cccdFront) ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">CCCD/CMND mặt trước</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'cccdFront')}
                                        className="hidden"
                                        id="cccd-front"
                                    />
                                    <label
                                        htmlFor="cccd-front"
                                        className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                                    >
                                        Chọn file
                                    </label>
                                    {hotelFormData.documents.cccdFront ? (
                                        <p className="text-green-600 text-xs mt-1">
                                            ✓ {hotelFormData.documents.cccdFront.name}
                                        </p>
                                    ) : (hasAttemptedSubmit && errors.cccdFront) && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                            <XCircle className="w-3 h-3 mr-1" /> {errors.cccdFront}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={`border-2 ${(hasAttemptedSubmit && errors.cccdBack) ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">CCCD/CMND mặt sau</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'cccdBack')}
                                        className="hidden"
                                        id="cccd-back"
                                    />
                                    <label
                                        htmlFor="cccd-back"
                                        className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                                    >
                                        Chọn file
                                    </label>
                                    {hotelFormData.documents.cccdBack ? (
                                        <p className="text-green-600 text-xs mt-1">
                                            ✓ {hotelFormData.documents.cccdBack.name}
                                        </p>
                                    ) : (hasAttemptedSubmit && errors.cccdBack) && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                            <XCircle className="w-3 h-3 mr-1" /> {errors.cccdBack}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={`border-2 ${(hasAttemptedSubmit && errors.businessLicenseFile) ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
                                <div className="text-center">
                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Giấy phép kinh doanh</p>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileUpload(e, 'businessLicense')}
                                        className="hidden"
                                        id="business-license"
                                    />
                                    <label
                                        htmlFor="business-license"
                                        className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                                    >
                                        Chọn file
                                    </label>
                                    {hotelFormData.documents.businessLicense ? (
                                        <p className="text-green-600 text-xs mt-1">
                                            ✓ {hotelFormData.documents.businessLicense.name}
                                        </p>
                                    ) : (hasAttemptedSubmit && errors.businessLicenseFile) && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                            <XCircle className="w-3 h-3 mr-1" /> {errors.businessLicenseFile}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Tất cả tài liệu phải rõ ràng, không bị mờ</li>
                                        <li>• Giấy phép kinh doanh phải còn hiệu lực</li>
                                        <li>• Chúng tôi sẽ xem xét trong vòng 24-48h</li>
                                        <li>• Bạn sẽ nhận email thông báo kết quả</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-4">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= registrationStep
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                                }`}>
                                {step}
                            </div>
                            {step < 3 && (
                                <div className={`w-16 h-1 mx-2 ${step < registrationStep ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {renderStep()}

            <div className="flex justify-between pt-4">
                {registrationStep > 1 && (
                    <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={isSubmitting}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Quay lại
                    </button>
                )}

                {registrationStep < 3 ? (
                    <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                        className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Tiếp theo
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleHotelRegistration}
                        disabled={isSubmitting}
                        className="ml-auto px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                Đang gửi...
                            </>
                        ) : (
                            'Gửi đơn đăng ký'
                        )}
                    </button>
                )}
            </div>

            <div className="mt-6 text-center">
                <span className="text-gray-600 text-sm">
                    Đã có tài khoản đối tác?
                </span>
                <button
                    type="button"
                    onClick={onBackToLogin}
                    disabled={isSubmitting}
                    className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm disabled:opacity-50"
                >
                    Đăng nhập
                </button>
            </div>
        </div>
    );
};

export default HotelPartnerForm;