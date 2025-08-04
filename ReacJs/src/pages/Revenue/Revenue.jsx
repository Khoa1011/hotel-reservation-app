import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    PieChart,
    BarChart3,
    Users,
    XCircle,
    CheckCircle,
    Clock,
    Target,
    AlertCircle,
    Filter,
    Download
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from 'moment';

const Revenue = ({ selectedHotelId }) => {
    const [overview, setOverview] = useState({});
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [yearlyRevenue, setYearlyRevenue] = useState([]);
    const [orderStats, setOrderStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // Fetch overview data
// ✅ Debug version - Thêm vào fetchOverview
const fetchOverview = useCallback(async () => {
    try {
        const params = selectedHotelId ? { hotelId: selectedHotelId } : {};
        const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/revenue/overview`, {
            params,
            withCredentials: true
        });

        console.log('📊 FULL Overview response:', JSON.stringify(response.data, null, 2));
        console.log('📊 Response success:', response.data.success);
        console.log('📊 Response data:', response.data.data);
        console.log('📊 Response overview:', response.data.data?.overview);

        if (response.data.success) {
            // ✅ Try different data access patterns
            const overviewData = response.data.data?.overview || response.data.overview || response.data.data || {};
            console.log('📊 Setting overview data:', overviewData);
            setOverview(overviewData);
        }
    } catch (error) {
        console.error('❌ Overview error:', error);
        console.error('❌ Error response:', error.response?.data);
        toast.error('Không thể lấy tổng quan doanh thu');
    }
}, [selectedHotelId, baseUrl]);

// ✅ Tương tự cho các fetch functions khác
const fetchMonthlyRevenue = useCallback(async (year) => {
    try {
        const params = {
            year,
            ...(selectedHotelId && { hotelId: selectedHotelId })
        };
        const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/revenue/monthly`, {
            params,
            withCredentials: true
        });

        console.log('📅 FULL Monthly response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            const monthlyData = response.data.data?.monthlyRevenue || response.data.monthlyRevenue || response.data.data || [];
            console.log('📅 Setting monthly data:', monthlyData);
            setMonthlyRevenue(monthlyData);
        }
    } catch (error) {
        console.error('❌ Monthly error:', error);
        console.error('❌ Error response:', error.response?.data);
        toast.error('Không thể lấy doanh thu theo tháng');
    }
}, [selectedHotelId, baseUrl]);



    // Fetch yearly revenue
    const fetchYearlyRevenue = useCallback(async () => {
        try {
            const params = selectedHotelId ? { hotelId: selectedHotelId } : {};
            // ✅ Fixed URL - thêm /hotelowner
            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/revenue/yearly`, {
                params,
                withCredentials: true
            });

            console.log('📆 Yearly response:', response.data);

            if (response.data.success) {
                // ✅ Fixed data access
                setYearlyRevenue(response.data.data?.yearlyRevenue || []);
            }
        } catch (error) {
            console.error('Lỗi khi lấy doanh thu theo năm:', error);
            toast.error('Không thể lấy doanh thu theo năm');
        }
    }, [selectedHotelId, baseUrl]);

    // Fetch order statistics
    const fetchOrderStats = useCallback(async () => {
        try {
            const params = selectedHotelId ? { hotelId: selectedHotelId } : {};
            // ✅ Fixed URL - thêm /hotelowner
            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/revenue/orders`, {
                params,
                withCredentials: true
            });

            console.log('📋 Orders response:', response.data);

            if (response.data.success) {
                // ✅ Fixed data access
                setOrderStats(response.data.data || {});
            }
        } catch (error) {
            console.error('Lỗi khi lấy thống kê đơn hàng:', error);
            toast.error('Không thể lấy thống kê đơn hàng');
        }
    }, [selectedHotelId, baseUrl]);

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        if (!selectedHotelId) {
            // Reset data when no hotel selected
            setOverview({});
            setMonthlyRevenue([]);
            setYearlyRevenue([]);
            setOrderStats({});
            return;
        }

        setLoading(true);
        try {
            await Promise.all([
                fetchOverview(),
                fetchMonthlyRevenue(selectedYear),
                fetchYearlyRevenue(),
                fetchOrderStats()
            ]);
        } finally {
            setLoading(false);
        }
    }, [fetchOverview, fetchMonthlyRevenue, fetchYearlyRevenue, fetchOrderStats, selectedYear, selectedHotelId]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    // Format number
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    // Get percentage color
    const getPercentageColor = (percentage) => {
        if (percentage >= 0) return 'text-green-600';
        return 'text-red-600';
    };

    // Get status color for booking types
    const getStatusColor = (status) => {
        switch (status) {
            case 'da_tra_phong': return 'text-green-600 bg-green-100';
            case 'da_huy': return 'text-red-600 bg-red-100';
            case 'da_xac_nhan': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    // Render pie chart (simplified)
    const renderPieChart = (data, total) => {
        if (!data || total === 0) return null;

        let currentAngle = 0;
        const radius = 80;
        const centerX = 100;
        const centerY = 100;

        return (
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                {data.map((item, index) => {
                    const percentage = (item.count / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
                    const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
                    const x2 = centerX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                    const y2 = centerY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                    ].join(' ');

                    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
                    
                    currentAngle += angle;
                    
                    return (
                        <path
                            key={index}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            className="opacity-80 hover:opacity-100 transition-opacity"
                        />
                    );
                })}
                <circle cx={centerX} cy={centerY} r="30" fill="white" />
                <text x={centerX} y={centerY} textAnchor="middle" dy=".3em" className="font-bold text-gray-800">
                    {total}
                </text>
            </svg>
        );
    };

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: Target },

    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Thống Kê Doanh Thu</h2>
                    <p className="text-gray-600">Theo dõi và phân tích doanh thu khách sạn</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Xuất báo cáo</span>
                    </button>
                </div>
            </div>

            {/* ✅ No Hotel Selected State */}
            {!selectedHotelId ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chọn khách sạn để xem doanh thu
                    </h3>
                    <p className="text-gray-600">
                        Vui lòng chọn khách sạn từ menu bên trái để xem thống kê doanh thu
                    </p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                                activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600 mt-4">Đang tải...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Overview Tab */}
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* Key Metrics */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-blue-100">Tổng doanh thu</p>
                                                            <p className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</p>
                                                        </div>
                                                        <DollarSign className="h-8 w-8 text-blue-200" />
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-green-100">Đơn hoàn thành</p>
                                                            <p className="text-2xl font-bold">{formatNumber(overview.completedBookings)}</p>
                                                            <p className="text-green-100 text-sm">
                                                                {overview.completionRate || 0}% tổng đơn
                                                            </p>
                                                        </div>
                                                        <CheckCircle className="h-8 w-8 text-green-200" />
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-red-100">Đơn đã hủy</p>
                                                            <p className="text-2xl font-bold">{formatNumber(overview.cancelledBookings)}</p>
                                                            <p className="text-red-100 text-sm">
                                                                {overview.cancellationRate || 0}% tổng đơn
                                                            </p>
                                                        </div>
                                                        <XCircle className="h-8 w-8 text-red-200" />
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-yellow-100">Đơn chờ xử lý</p>
                                                            <p className="text-2xl font-bold">{formatNumber(overview.pendingBookings)}</p>
                                                        </div>
                                                        <Clock className="h-8 w-8 text-yellow-200" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revenue Breakdown */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="bg-gray-50 rounded-lg p-6">
                                                    <h3 className="font-semibold text-gray-800 mb-4">Chi tiết doanh thu</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Tiền phòng:</span>
                                                            <span className="font-medium">{formatCurrency(overview.roomRevenue)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Dịch vụ bổ sung:</span>
                                                            <span className="font-medium">{formatCurrency(overview.serviceRevenue)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Phụ thu:</span>
                                                            <span className="font-medium text-orange-600">
                                                                +{formatCurrency(overview.totalSurcharge)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Giảm giá:</span>
                                                            <span className="font-medium text-green-600">
                                                                -{formatCurrency(overview.totalDiscount)}
                                                            </span>
                                                        </div>
                                                        <div className="border-t pt-3 flex justify-between">
                                                            <span className="font-semibold text-gray-800">Tổng doanh thu:</span>
                                                            <span className="font-bold text-blue-600">
                                                                {formatCurrency(overview.totalRevenue)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-6">
                                                    <h3 className="font-semibold text-gray-800 mb-4">Hiệu suất</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-gray-600">Tỷ lệ hoàn thành</span>
                                                                <span className="font-medium">{overview.completionRate || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-green-500 h-2 rounded-full" 
                                                                    style={{ width: `${overview.completionRate || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-gray-600">Tỷ lệ hủy</span>
                                                                <span className="font-medium">{overview.cancellationRate || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-red-500 h-2 rounded-full" 
                                                                    style={{ width: `${overview.cancellationRate || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Monthly Tab */}
                                    {/* {activeTab === 'monthly' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Doanh thu theo tháng năm {selectedYear}
                                                </h3>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => {
                                                        const year = parseInt(e.target.value);
                                                        setSelectedYear(year);
                                                        fetchMonthlyRevenue(year);
                                                    }}
                                                    className="px-3 py-1 border border-gray-300 rounded"
                                                >
                                                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {monthlyRevenue.length > 0 ? (
                                                <>
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-blue-600">
                                                                    {formatCurrency(monthlyRevenue.reduce((sum, m) => sum + (m.totalRevenue || 0), 0))}
                                                                </p>
                                                                <p className="text-gray-600">Tổng doanh thu</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-green-600">
                                                                    {formatNumber(monthlyRevenue.reduce((sum, m) => sum + (m.totalBookings || 0), 0))}
                                                                </p>
                                                                <p className="text-gray-600">Tổng đơn</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-orange-600">
                                                                    {formatCurrency(monthlyRevenue.reduce((sum, m) => sum + (m.totalSurcharge || 0), 0))}
                                                                </p>
                                                                <p className="text-gray-600">Phụ thu</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-purple-600">
                                                                    {formatCurrency(monthlyRevenue.reduce((sum, m) => sum + (m.totalDiscount || 0), 0))}
                                                                </p>
                                                                <p className="text-gray-600">Giảm giá</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full bg-white border border-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tháng</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảm giá</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phụ thu</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TB/Đơn</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {monthlyRevenue.map((month) => (
                                                                    <tr key={month.month} className="hover:bg-gray-50">
                                                                        <td className="px-4 py-3 font-medium">{month.monthName}</td>
                                                                        <td className="px-4 py-3">{formatNumber(month.totalBookings)}</td>
                                                                        <td className="px-4 py-3 font-semibold text-green-600">
                                                                            {formatCurrency(month.totalRevenue)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-red-600">
                                                                            {formatCurrency(month.totalDiscount)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-orange-600">
                                                                            {formatCurrency(month.totalSurcharge)}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            {formatCurrency(month.avgBookingValue)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                    <h3 className="text-xl font-semibold text-gray-600">Chưa có dữ liệu</h3>
                                                    <p className="text-gray-500 mt-2">
                                                        Chưa có doanh thu nào trong năm {selectedYear}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )} */}

                                    {/* Yearly Tab */}
                                    {/* {activeTab === 'yearly' && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-800">Doanh thu theo năm</h3>
                                            
                                            {yearlyRevenue.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {yearlyRevenue.map((year) => (
                                                        <div key={year.year} className="bg-white border rounded-lg p-6">
                                                            <div className="text-center">
                                                                <h4 className="text-xl font-bold text-gray-800 mb-2">
                                                                    Năm {year.year}
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className="text-2xl font-bold text-green-600">
                                                                            {formatCurrency(year.totalRevenue)}
                                                                        </p>
                                                                        <p className="text-gray-600 text-sm">Doanh thu</p>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <p className="font-semibold">{formatNumber(year.totalBookings)}</p>
                                                                            <p className="text-gray-600">Tổng đơn</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold">{formatCurrency(year.avgBookingValue)}</p>
                                                                            <p className="text-gray-600">TB/Đơn</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                    <h3 className="text-xl font-semibold text-gray-600">Chưa có dữ liệu</h3>
                                                    <p className="text-gray-500 mt-2">
                                                        Chưa có doanh thu theo năm
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )} */}

                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Revenue;