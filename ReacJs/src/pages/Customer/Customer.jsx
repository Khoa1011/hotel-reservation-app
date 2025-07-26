import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    Eye,
    Phone,
    Mail,
    User,
    Calendar,
    DollarSign,
    TrendingUp,
    Award,
    Filter,
    ChevronDown,
    ChevronRight,
    MapPin,
    Clock,
    X,
    Star,
    Bed
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from 'moment';

const Customer = ({ selectedHotelId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCustomers: 0,
        limit: 20
    });
    const ITEMS_PER_PAGE = 20;
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [customerDetail, setCustomerDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // Fetch customers
    const fetchCustomers = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: ITEMS_PER_PAGE,
                ...(selectedHotelId && { hotelId: selectedHotelId }),
                ...(search && { search })
            };
            console.log('📤 Sending params:', params);
            console.log('🏨 Selected Hotel ID:', selectedHotelId);

            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/customers`, {
                params,
                withCredentials: true
            });
            console.log("Danh sách khách hàng", response.data.data);
            if (response.data.success) {
                console.log('👥 Customers set:', response.data.data.customers);
                console.log('📊 Pagination set:', response.data.data.pagination);



                setCustomers(response.data.data.customers);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách khách hàng:', error);
            toast.error('Không thể lấy danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    }, [selectedHotelId, baseUrl]);

    // Fetch customer detail
    const fetchCustomerDetail = async (customerId) => {
        setDetailLoading(true);
        try {
            const params = selectedHotelId ? { hotelId: selectedHotelId } : {};

            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/customers/${customerId}`, {
                params,
                withCredentials: true
            });

            if (response.data.success) {
                setCustomerDetail(response.data.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết khách hàng:', error);
            toast.error('Không thể lấy chi tiết khách hàng');
        } finally {
            setDetailLoading(false);
        }
    };

    // Search customers
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchCustomers(1, value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        fetchCustomers(page, searchTerm);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Get loyalty color
    const getLoyaltyColor = (level) => {
        switch (level) {
            case 'VIP': return 'bg-purple-100 text-purple-800';
            case 'Gold': return 'bg-yellow-100 text-yellow-800';
            case 'Silver': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    // Get booking type text
    const getBookingTypeText = (types) => {
        const typeTexts = {
            'theo_gio': 'Theo giờ',
            'qua_dem': 'Qua đêm',
            'dai_ngay': 'Dài ngày'
        };
        return types.map(type => typeTexts[type] || type).join(', ');
    };

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Khách Hàng</h2>
                    <p className="text-gray-600">Quản lý và theo dõi khách hàng của khách sạn</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Tổng: {pagination.totalCustomers || 0} khách hàng</span>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex space-x-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    fetchCustomers(1, '');
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Customers List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Đang tải...</p>
                    </div>
                ) : customers.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Khách hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hạng thành viên
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số đơn
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng chi tiêu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lần cuối đặt
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customers.map((customer) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8">
                                                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.customerName || 'Khách lẻ'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{customer.email}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{customer.phoneNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLoyaltyColor(customer.loyaltyLevel)}`}>
                                                    <Award className="w-3 h-3 mr-1" />
                                                    {customer.loyaltyLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <div className="font-medium">{customer.totalBookings} đơn</div>
                                                    <div className="text-xs text-green-600">
                                                        {customer.completedBookings} hoàn thành
                                                    </div>
                                                    {customer.cancelledBookings > 0 && (
                                                        <div className="text-xs text-red-600">
                                                            {customer.cancelledBookings} đã hủy
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <div className="font-semibold text-green-600">
                                                        {formatCurrency(customer.totalAmount)}
                                                    </div>
                                                    {customer.totalDiscount > 0 && (
                                                        <div className="text-xs text-blue-600">
                                                            Tiết kiệm: {formatCurrency(customer.totalDiscount)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {moment(customer.lastBooking).format('DD/MM/YYYY')}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Thành viên từ {customer.customerSince}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => fetchCustomerDetail(customer.customerId)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                                    disabled={detailLoading}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span>Xem chi tiết</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Hiển thị{' '}
                                            <span className="font-medium">
                                                {(pagination.currentPage - 1) * pagination.limit + 1}
                                            </span>{' '}
                                            đến{' '}
                                            <span className="font-medium">
                                                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCustomers)}
                                            </span>{' '}
                                            trong{' '}
                                            <span className="font-medium">{pagination.totalCustomers}</span> khách hàng
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                                .filter(page =>
                                                    page === 1 ||
                                                    page === pagination.totalPages ||
                                                    Math.abs(page - pagination.currentPage) <= 2
                                                )
                                                .map((page, index, array) => (
                                                    <React.Fragment key={page}>
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                ...
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handlePageChange(page)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    </React.Fragment>
                                                ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Chưa có khách hàng</h3>
                        <p className="text-gray-500 mt-2">
                            {searchTerm ? 'Không tìm thấy khách hàng nào phù hợp' : 'Chưa có khách hàng nào đặt phòng'}
                        </p>
                    </div>
                )}
            </div>

            {/* Customer Detail Modal */}
            {showDetailModal && customerDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center rounded-t-lg">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Chi tiết khách hàng: {customerDetail.customer.customerName}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Thành viên từ {customerDetail.customer.memberSince}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Customer Summary */}
                                <div className="lg:col-span-1">
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <User className="h-5 w-5 mr-2" />
                                            Thông tin tổng quan
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{customerDetail.customer.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{customerDetail.customer.phoneNumber}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {customerDetail.customer.totalBookings}
                                                </div>
                                                <div className="text-xs text-gray-600">Tổng đơn</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-lg font-bold text-green-600">
                                                    {formatCurrency(customerDetail.customer.totalSpent)}
                                                </div>
                                                <div className="text-xs text-gray-600">Tổng chi tiêu</div>
                                            </div>
                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <div className="text-lg font-bold text-yellow-600">
                                                    {formatCurrency(customerDetail.customer.totalDiscount)}
                                                </div>
                                                <div className="text-xs text-gray-600">Tiết kiệm</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <div className="text-lg font-bold text-purple-600">
                                                    {formatCurrency(customerDetail.customer.totalServiceSpent)}
                                                </div>
                                                <div className="text-xs text-gray-600">Dịch vụ</div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <h4 className="font-medium text-gray-800 mb-2">Thống kê đơn hàng</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Hoàn thành:</span>
                                                    <span className="font-medium text-green-600">
                                                        {customerDetail.customer.completedBookings}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Đã hủy:</span>
                                                    <span className="font-medium text-red-600">
                                                        {customerDetail.customer.cancelledBookings}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Tỷ lệ hoàn thành:</span>
                                                    <span className="font-medium">
                                                        {customerDetail.customer.totalBookings > 0
                                                            ? Math.round((customerDetail.customer.completedBookings / customerDetail.customer.totalBookings) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking History */}
                                <div className="lg:col-span-2">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Lịch sử đặt phòng ({customerDetail.bookings.length})
                                    </h3>

                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {customerDetail.bookings.map((booking) => (
                                            <div key={booking.bookingId} className="bg-white border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">
                                                            {booking.hotelName}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {booking.roomType} • {booking.checkInDate} - {booking.checkOutDate}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-lg text-green-600">
                                                            {formatCurrency(booking.totalAmount)}
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'da_tra_phong' ? 'bg-green-100 text-green-800' :
                                                                booking.status === 'da_huy' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {booking.status === 'da_tra_phong' ? 'Hoàn thành' :
                                                                booking.status === 'da_huy' ? 'Đã hủy' : 'Đang xử lý'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Room Details */}
                                                {booking.rooms && booking.rooms.length > 0 && (
                                                    <div className="mt-3">
                                                        <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                                                            <Bed className="h-4 w-4 mr-1" />
                                                            Phòng đã sử dụng
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {booking.rooms.map((room, index) => (
                                                                <div key={index} className="bg-gray-50 p-3 rounded">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="font-medium">
                                                                            Phòng {room.roomNumber}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            Tầng {room.floor}
                                                                        </span>
                                                                    </div>

                                                                    {room.guestInfo?.tenKhachChinh && (
                                                                        <p className="text-xs text-blue-600 mb-1">
                                                                            Khách: {room.guestInfo.tenKhachChinh}
                                                                        </p>
                                                                    )}

                                                                    {room.services && room.services.length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="text-xs font-medium text-gray-700 mb-1">Dịch vụ:</p>
                                                                            <div className="space-y-1">
                                                                                {room.services.map((service, serviceIndex) => (
                                                                                    <div key={serviceIndex} className="flex justify-between text-xs">
                                                                                        <span className="text-gray-600">
                                                                                            {service.tenDichVu} x{service.soLuong}
                                                                                        </span>
                                                                                        <span className="font-medium">
                                                                                            {formatCurrency(service.thanhTien)}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                                {room.serviceTotal > 0 && (
                                                                                    <div className="border-t pt-1 flex justify-between text-xs font-medium">
                                                                                        <span>Tổng DV:</span>
                                                                                        <span className="text-blue-600">
                                                                                            {formatCurrency(room.serviceTotal)}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pricing Breakdown */}
                                                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                                                    <div className="text-center">
                                                        <span className="text-gray-600">Loại đặt:</span>
                                                        <p className="font-medium">{
                                                            booking.bookingType === 'theo_gio' ? 'Theo giờ' :
                                                                booking.bookingType === 'qua_dem' ? 'Qua đêm' : 'Dài ngày'
                                                        }</p>
                                                    </div>
                                                    {booking.discount > 0 && (
                                                        <div className="text-center">
                                                            <span className="text-gray-600">Giảm giá:</span>
                                                            <p className="font-medium text-green-600">
                                                                -{formatCurrency(booking.discount)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {booking.surcharge > 0 && (
                                                        <div className="text-center">
                                                            <span className="text-gray-600">Phụ thu:</span>
                                                            <p className="font-medium text-orange-600">
                                                                +{formatCurrency(booking.surcharge)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-2 text-xs text-gray-500 text-right">
                                                    Đặt lúc: {moment(booking.createdAt).format('HH:mm DD/MM/YYYY')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;