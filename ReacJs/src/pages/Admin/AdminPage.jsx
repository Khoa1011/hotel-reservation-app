import React, { useState, useEffect } from 'react';
import {
    Shield,
    Building2,
    Users,
    FileCheck,
    BarChart3,
    Settings,
    Bell,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar,
    Mail,
    Phone,
    MapPin,
    FileText,
    Download,
    MoreHorizontal,
    Globe,
    Activity,
    Loader,
    Image as ImageIcon,
    ZoomIn,
    X
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import HotelManagement from './HotelManagement';
import UserManagement from './userManagement';
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
    const [activeMenu, setActiveMenu] = useState(() => {
        const savedMenu = localStorage.getItem('admin_activeMenu');
        console.log('👑 Loading saved admin menu:', savedMenu);
        return savedMenu || 'overview';
    });
    const [registrations, setRegistrations] = useState([]);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'supplement'
    const [actionReason, setActionReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        current: 1,
        total: 1,
        count: 0,
        totalRecords: 0
    });

    // Helper function to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        // Remove leading slash if exists and prepend baseUrl
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${baseUrl}/${cleanPath}`;
    };

    // Component for displaying a single image with preview
    const ImagePreview = ({ src, alt, className = "w-16 h-16", onClick, aspectRatio = "square" }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);

        if (!src || imageError) {
            return (
                <div className={`${className} bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center`}>
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                </div>
            );
        }

        const getObjectFit = () => {
            switch (aspectRatio) {
                case 'landscape': return 'object-cover';
                case 'portrait': return 'object-contain';
                case 'document': return 'object-contain';
                default: return 'object-cover';
            }
        };

        return (
            <div className={`${className} relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200`} onClick={onClick}>
                <img
                    src={getImageUrl(src)}
                    alt={alt}
                    className={`w-full h-full ${getObjectFit()} transition-transform duration-200 group-hover:scale-105`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                    }}
                />
                {imageLoading && (
                    <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
            </div>
        );
    };

    // Image Modal Component
    const ImageModal = () => {
        if (!showImageModal || !selectedImage) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                <div className="relative w-full h-full max-w-7xl max-h-[95vh] flex items-center justify-center">
                    <button
                        onClick={() => {
                            setShowImageModal(false);
                            setSelectedImage(null);
                        }}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={getImageUrl(selectedImage.src)}
                        alt={selectedImage.alt}
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        style={{
                            maxWidth: 'calc(100vw - 2rem)',
                            maxHeight: 'calc(100vh - 8rem)'
                        }}
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                        <p className="text-sm font-medium">{selectedImage.alt}</p>
                    </div>
                </div>
            </div>
        );
    };

    const getTextHotelTypeMapping = (type) => {
        const viewType = {
            'khachSan': 'Khách sạn',
            'khuNghiDuong': 'Khu nghỉ dưỡng',
            'nhaNghi': 'Nhà nghỉ',
            'kyTucXa': 'Ký túc xá',
            'canHo': 'Căn hộ',
            'bietThu': 'Biệt thự',
            'homestay': 'Homestay'
        };
        return viewType[type] || "Không xác định";
    }
    useEffect(() => {
        console.log('👑 Admin Dashboard mounted');
        
        // ✅ Optional: Clear hotel-specific localStorage để tránh conflict
        localStorage.removeItem('hotel_activeMenu');
        localStorage.removeItem('hotel_selectedHotelId');
        localStorage.removeItem('hotel_selectedHotelName');
        
        return () => {
            console.log('👑 Admin Dashboard cleanup');
        };
    }, []);

    const handleAdminMenuChange = (menuId) => {
        console.log('👑 Admin switching to menu:', menuId);
        setActiveMenu(menuId);
        localStorage.setItem('admin_activeMenu', menuId); // ✅ Thêm prefix
    };

    // Fetch dashboard stats
    const fetchStats = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/registration/admin/dashboard/stats`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Không thể tải thống kê dashboard');
        }
    };

    // Fetch registrations
    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.search) queryParams.append('search', filters.search);
            queryParams.append('page', filters.page.toString());
            queryParams.append('limit', filters.limit.toString());

            const response = await axios.get(`${baseUrl}/api/registration/admin/registrations?${queryParams}`);

            if (response.data.success) {
                setRegistrations(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching registrations:', error);
            toast.error('Lỗi khi tải danh sách đăng ký');
        } finally {
            setLoading(false);
        }
    };

    // Fetch registration detail
    const fetchRegistrationDetail = async (id) => {
        try {
            const response = await axios.get(`${baseUrl}/api/registration/admin/registrations-details/${id}`);
            console.log("id người dùng", id);
            if (response.data.success) {
                setSelectedRegistration(response.data.data);
                setShowRegistrationModal(true);
            }
        } catch (error) {
            console.error('Error fetching registration detail:', error);
            toast.error('Lỗi khi tải chi tiết đăng ký');
        }
    };

    // Handle registration actions
    const handleRegistrationAction = async () => {
        if (!selectedRegistration) return;

        setLoading(true);
        try {
            let endpoint = '';
            let body = {};

            console.log('🔍 FRONTEND DEBUG:');
            console.log('  - selectedRegistration:', selectedRegistration);
            console.log('  - selectedRegistration._id:', selectedRegistration._id);

            switch (actionType) {
                case 'approve':
                    console.log("id chấp nhận", selectedRegistration._id);
                    endpoint = `${baseUrl}/api/registration/admin/registrations/${selectedRegistration._id}/approve`;
                    body = { adminNote: actionReason };
                    break;
                case 'reject':
                    endpoint = `${baseUrl}/api/registration/admin/registrations/${selectedRegistration._id}/reject`;
                    body = { reason: actionReason };
                    break;
                case 'supplement':
                    endpoint = `${baseUrl}/api/registration/admin/registrations/${selectedRegistration._id}/supplement`;
                    body = { supplementNote: actionReason };
                    break;
                default:
                    return;
            }

            const response = await axios.put(endpoint, body);

            if (response.data.success) {
                toast.success(response.data.message);
                setShowActionModal(false);
                setShowRegistrationModal(false);
                setActionReason('');
                await fetchRegistrations();
                await fetchStats();
            } else {
                toast.error(response.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error handling action:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Lỗi khi xử lý yêu cầu');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeMenu === 'registrations') {
            fetchRegistrations();
        }
    }, [activeMenu, filters]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeMenu === 'registrations') {
                fetchRegistrations();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters.search]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'dang_cho_duyet': return 'bg-yellow-100 text-yellow-800';
            case 'da_duyet': return 'bg-green-100 text-green-800';
            case 'tu_choi': return 'bg-red-100 text-red-800';
            case 'can_bo_sung': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'dang_cho_duyet': return 'Chờ duyệt';
            case 'da_duyet': return 'Đã duyệt';
            case 'tu_choi': return 'Từ chối';
            case 'can_bo_sung': return 'Cần bổ sung';
            default: return 'Không xác định';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const menuItems = [
        { id: 'overview', label: 'Tổng Quan', icon: BarChart3 },
        { id: 'registrations', label: 'Đăng Ký Khách Sạn', icon: Building2 },
        { id: 'hotels', label: 'Quản Lý Khách Sạn', icon: Globe },
        { id: 'users', label: 'Người Dùng', icon: Users },
        { id: 'analytics', label: 'Phân Tích', icon: Activity },
        { id: 'settings', label: 'Cài Đặt', icon: Settings }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Tổng Khách Sạn</p>
                            <p className="text-2xl font-semibold">{stats.totalHotels?.toLocaleString() || 0}</p>
                        </div>
                        <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        <span>Đã được phê duyệt</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Chờ Phê Duyệt</p>
                            <p className="text-2xl font-semibold">{stats.pendingRegistrations || 0}</p>
                        </div>
                        <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                        <span>Cần xử lý trong 24h</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Người Dùng</p>
                            <p className="text-2xl font-semibold">{stats.totalUsers?.toLocaleString() || 0}</p>
                        </div>
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        <span>Tổng người dùng</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Tỷ Lệ Duyệt</p>
                            <p className="text-2xl font-semibold">{stats.approvalRate || 0}%</p>
                        </div>
                        <BarChart3 className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        <span>Hiệu quả phê duyệt</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Hành Động Nhanh</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setActiveMenu('registrations')}
                        className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                        <FileCheck className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="text-left">
                            <p className="font-medium text-gray-800">Duyệt Đăng Ký</p>
                            <p className="text-sm text-gray-500">{stats.pendingRegistrations || 0} đơn chờ duyệt</p>
                        </div>
                    </button>

                    <button className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                        <Users className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="text-left">
                            <p className="font-medium text-gray-800">Quản Lý User</p>
                            <p className="text-sm text-gray-500">Xem hoạt động người dùng</p>
                        </div>
                    </button>

                    <button className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                        <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="text-left">
                            <p className="font-medium text-gray-800">Xem Báo Cáo</p>
                            <p className="text-sm text-gray-500">Thống kê chi tiết</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tóm Tắt Đăng Ký</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalRegistrations || 0}</div>
                        <div className="text-sm text-gray-500">Tổng đăng ký</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.approvedRegistrations || 0}</div>
                        <div className="text-sm text-gray-500">Đã duyệt</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingRegistrations || 0}</div>
                        <div className="text-sm text-gray-500">Chờ duyệt</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.rejectedRegistrations || 0}</div>
                        <div className="text-sm text-gray-500">Từ chối</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRegistrations = () => (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Đăng Ký Khách Sạn</h2>
                <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm đăng ký..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="dang_cho_duyet">Chờ duyệt</option>
                        <option value="da_duyet">Đã duyệt</option>
                        <option value="tu_choi">Từ chối</option>
                        <option value="can_bo_sung">Cần bổ sung</option>
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            )}

            {/* Registration Cards */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {registrations.map((registration) => (
                        <div key={registration._id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-gray-800">{registration.tenKhachSan}</h3>
                                    <p className="text-xs text-gray-500">#{registration._id.slice(-8)}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.trangThai)}`}>
                                    {getStatusText(registration.trangThai)}
                                </span>
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="flex items-center text-sm">
                                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-700">{registration.maNguoiDung?.tenNguoiDung}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-600">{registration.maNguoiDung?.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-600">
                                        {[registration.diaChi?.quan, registration.diaChi?.tinhThanh].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-600">
                                        {new Date(registration.ngayDangKy).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>

                            {/* Hotel Images Preview */}
                            {registration.hinhAnh?.anhMatTienKhachSan && registration.hinhAnh.anhMatTienKhachSan.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Hình ảnh khách sạn:</p>
                                    <div className="flex space-x-2 overflow-x-auto">
                                        {registration.hinhAnh.anhMatTienKhachSan.slice(0, 3).map((image, index) => (
                                            <ImagePreview
                                                key={index}
                                                src={image}
                                                alt={`Ảnh khách sạn ${index + 1}`}
                                                className="w-14 h-14 flex-shrink-0"
                                                aspectRatio="square"
                                                onClick={() => {
                                                    setSelectedImage({
                                                        src: image,
                                                        alt: `Ảnh khách sạn ${registration.tenKhachSan} - ${index + 1}`
                                                    });
                                                    setShowImageModal(true);
                                                }}
                                            />
                                        ))}
                                        {registration.hinhAnh.anhMatTienKhachSan.length > 3 && (
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                                                +{registration.hinhAnh.anhMatTienKhachSan.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Document Status */}
                            <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 mb-1">Tài liệu:</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className={`flex items-center ${registration.hinhAnh?.cccdMatTruoc ? 'text-green-600' : 'text-red-600'}`}>
                                        {registration.hinhAnh?.cccdMatTruoc ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                        CCCD MT
                                    </span>
                                    <span className={`flex items-center ${registration.hinhAnh?.cccdMatSau ? 'text-green-600' : 'text-red-600'}`}>
                                        {registration.hinhAnh?.cccdMatSau ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                        CCCD MS
                                    </span>
                                    <span className={`flex items-center ${registration.hinhAnh?.giayPhepKinhDoanh ? 'text-green-600' : 'text-red-600'}`}>
                                        {registration.hinhAnh?.giayPhepKinhDoanh ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                        GPKD
                                    </span>
                                    <span className="text-blue-600">
                                        {registration.hinhAnh?.anhMatTienKhachSan?.length || 0} ảnh KS
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => fetchRegistrationDetail(registration._id)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Xem Chi Tiết
                                </button>
                                {registration.trangThai === 'dang_cho_duyet' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSelectedRegistration(registration);
                                                setActionType('approve');
                                                setShowActionModal(true);
                                            }}
                                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRegistration(registration);
                                                setActionType('reject');
                                                setShowActionModal(true);
                                            }}
                                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && registrations.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-500">
                        Hiển thị {((pagination.current - 1) * filters.limit) + 1} - {Math.min(pagination.current * filters.limit, pagination.totalRecords)} trong tổng số {pagination.totalRecords} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.current <= 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <span className="text-sm">
                            Trang {pagination.current} / {pagination.total}
                        </span>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.current >= pagination.total}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && registrations.length === 0 && (
                <div className="text-center py-12">
                    <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-gray-700 mb-1">Không có đăng ký nào</h3>
                    <p className="text-sm text-gray-500">Chưa có đăng ký nào phù hợp với bộ lọc</p>
                </div>
            )}
        </div>
    );

    const renderRegistrationModal = () => {
        if (!selectedRegistration) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Chi Tiết Đăng Ký - {selectedRegistration.tenKhachSan}
                            </h2>
                            <button
                                onClick={() => setShowRegistrationModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Hotel Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Thông tin khách sạn</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Tên:</span> {selectedRegistration.tenKhachSan}</div>
                                    <div><span className="font-medium">Loại:</span> {getTextHotelTypeMapping(selectedRegistration.loaiKhachSan)}</div>
                                    <div><span className="font-medium">Địa chỉ:</span> {[
                                        selectedRegistration.diaChi?.soNha,
                                        selectedRegistration.diaChi?.tenDuong,
                                        selectedRegistration.diaChi?.phuong,
                                        selectedRegistration.diaChi?.quan,
                                        selectedRegistration.diaChi?.tinhThanh
                                    ].filter(Boolean).join(', ')}</div>
                                    <div><span className="font-medium">GPKD:</span> {selectedRegistration.giayTo?.maSoGPKD}</div>
                                    <div><span className="font-medium">Mã số thuế:</span> {selectedRegistration.giayTo?.maSoThue}</div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Thông tin chủ sở hữu</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Họ tên:</span> {selectedRegistration.maNguoiDung?.tenNguoiDung}</div>
                                    <div><span className="font-medium">Email:</span> {selectedRegistration.maNguoiDung?.email}</div>
                                    <div><span className="font-medium">SĐT:</span> {selectedRegistration.maNguoiDung?.soDienThoai}</div>
                                    <div><span className="font-medium">CCCD:</span> {selectedRegistration.maNguoiDung?.cccd}</div>
                                    <div><span className="font-medium">Ngày đăng ký:</span> {new Date(selectedRegistration.ngayDangKy).toLocaleDateString('vi-VN')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hotel Images */}
                        {selectedRegistration.hinhAnh?.anhMatTienKhachSan && selectedRegistration.hinhAnh.anhMatTienKhachSan.length > 0 && (
                            <div>
                                <h3 className="font-medium text-gray-800 mb-3">Hình ảnh khách sạn ({selectedRegistration.hinhAnh.anhMatTienKhachSan.length} ảnh)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                                    {selectedRegistration.hinhAnh.anhMatTienKhachSan.map((image, index) => (
                                        <ImagePreview
                                            key={index}
                                            src={image}
                                            alt={`Ảnh khách sạn ${index + 1}`}
                                            className="w-full aspect-square"
                                            aspectRatio="square"
                                            onClick={() => {
                                                setSelectedImage({
                                                    src: image,
                                                    alt: `Ảnh khách sạn ${selectedRegistration.tenKhachSan} - ${index + 1}`
                                                });
                                                setShowImageModal(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Documents Preview */}
                        <div>
                            <h3 className="font-medium text-gray-800 mb-3">Tài liệu đính kèm</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* CCCD Front */}
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">CCCD Mặt trước</h4>
                                    {selectedRegistration.hinhAnh?.cccdMatTruoc ? (
                                        <ImagePreview
                                            src={selectedRegistration.hinhAnh.cccdMatTruoc}
                                            alt="CCCD Mặt trước"
                                            className="w-full aspect-[3/2]"
                                            aspectRatio="document"
                                            onClick={() => {
                                                setSelectedImage({
                                                    src: selectedRegistration.hinhAnh.cccdMatTruoc,
                                                    alt: `CCCD Mặt trước`
                                                });
                                                setShowImageModal(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs text-red-600">Chưa có</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CCCD Back */}
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">CCCD Mặt sau</h4>
                                    {selectedRegistration.hinhAnh?.cccdMatSau ? (
                                        <ImagePreview
                                            src={selectedRegistration.hinhAnh.cccdMatSau}
                                            alt="CCCD Mặt sau"
                                            className="w-full h-32"
                                            onClick={() => {
                                                setSelectedImage({
                                                    src: selectedRegistration.hinhAnh.cccdMatSau,
                                                    alt: `CCCD Mặt sau`
                                                });
                                                setShowImageModal(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs text-red-600">Chưa có</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Business License */}
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Giấy phép kinh doanh</h4>
                                    {selectedRegistration.hinhAnh?.giayPhepKinhDoanh ? (
                                        <ImagePreview
                                            src={selectedRegistration.hinhAnh.giayPhepKinhDoanh}
                                            alt="Giấy phép kinh doanh"
                                            className="w-full h-32"
                                            onClick={() => {
                                                setSelectedImage({
                                                    src: selectedRegistration.hinhAnh.giayPhepKinhDoanh,
                                                    alt: `Giấy phép kinh doanh - ${selectedRegistration.tenKhachSan}`
                                                });
                                                setShowImageModal(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs text-red-600">Chưa có</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(selectedRegistration.lyDoTuChoi || selectedRegistration.ghiChuBoSung) && (
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Ghi chú</h3>
                                {selectedRegistration.lyDoTuChoi && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                        <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                                        <p className="text-sm text-red-700">{selectedRegistration.lyDoTuChoi}</p>
                                    </div>
                                )}
                                {selectedRegistration.ghiChuBoSung && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm font-medium text-blue-800">Yêu cầu bổ sung:</p>
                                        <p className="text-sm text-blue-700">{selectedRegistration.ghiChuBoSung}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowRegistrationModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Đóng
                            </button>
                            {selectedRegistration.trangThai === 'dang_cho_duyet' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setActionType('supplement');
                                            setShowActionModal(true);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        Yêu cầu bổ sung
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('reject');
                                            setShowActionModal(true);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('approve');
                                            setShowActionModal(true);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                        Phê duyệt
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderActionModal = () => {
        const getActionTitle = () => {
            switch (actionType) {
                case 'approve': return 'Phê duyệt đăng ký';
                case 'reject': return 'Từ chối đăng ký';
                case 'supplement': return 'Yêu cầu bổ sung';
                default: return '';
            }
        };

        const getActionColor = () => {
            switch (actionType) {
                case 'approve': return 'bg-green-600 hover:bg-green-700';
                case 'reject': return 'bg-red-600 hover:bg-red-700';
                case 'supplement': return 'bg-blue-600 hover:bg-blue-700';
                default: return 'bg-gray-600 hover:bg-gray-700';
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">{getActionTitle()}</h3>
                    </div>

                    <div className="p-5">
                        <p className="text-sm text-gray-600 mb-4">
                            {actionType === 'approve' && 'Bạn có chắc chắn muốn phê duyệt đăng ký này? Hệ thống sẽ tự động tạo tài khoản và gửi email thông báo.'}
                            {actionType === 'reject' && 'Vui lòng nhập lý do từ chối để gửi thông báo cho chủ khách sạn.'}
                            {actionType === 'supplement' && 'Vui lòng nhập yêu cầu bổ sung tài liệu hoặc thông tin.'}
                        </p>

                        {(actionType === 'reject' || actionType === 'supplement') && (
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder={actionType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập yêu cầu bổ sung...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                rows="4"
                                required
                            />
                        )}

                        {actionType === 'approve' && (
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Ghi chú của admin (tùy chọn)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                            />
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setShowActionModal(false);
                                setActionReason('');
                            }}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleRegistrationAction}
                            disabled={loading || ((actionType === 'reject' || actionType === 'supplement') && !actionReason.trim())}
                            className={`px-4 py-2 text-white rounded-lg text-sm ${getActionColor()} disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeMenu) {
            case 'overview':
                return renderOverview();
            case 'registrations':
                return renderRegistrations();
            case 'hotels':
                return <HotelManagement key="admin-hotel-management" />;
            case 'users':
                return <UserManagement key="admin-user-management" />;
            case 'analytics':
                return (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-base font-medium text-gray-700">Phân tích & Báo cáo</h3>
                        <p className="text-sm text-gray-500">Tính năng đang phát triển...</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="text-center py-12">
                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-base font-medium text-gray-700">Cài đặt hệ thống</h3>
                        <p className="text-sm text-gray-500">Tính năng đang phát triển...</p>
                    </div>
                );
            default:
                return renderOverview();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-800">Trang Admin</h1>
                            <p className="text-xs text-gray-500">Staytion</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-5 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleAdminMenuChange(item.id)}
                                className={`w-full flex items-center px-3 py-2 mb-1 text-left rounded-lg transition-colors ${activeMenu === item.id
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 mr-3 ${activeMenu === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.id === 'registrations' && stats.pendingRegistrations > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {stats.pendingRegistrations}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Quản lý hệ thống Staytion
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Notifications */}
                            <button className="relative p-1 text-gray-500 hover:text-gray-700">
                                <Bell className="w-5 h-5" />
                                {stats.pendingRegistrations > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                                        {stats.pendingRegistrations}
                                    </span>
                                )}
                            </button>

                            {/* Quick Stats */}
                            <div className="hidden md:flex items-center space-x-3 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500">Tỷ lệ duyệt</div>
                                    <div className="font-medium text-green-600">{stats.approvalRate}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500">Tổng KS</div>
                                    <div className="font-medium text-blue-600">{stats.totalHotels}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-5">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showRegistrationModal && renderRegistrationModal()}
            {showActionModal && renderActionModal()}
            <ImageModal />
        </div>
    );
};

export default AdminDashboard;