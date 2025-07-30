import React, { useState, useEffect, useCallback } from 'react';
import {
    Star,
    MessageSquare,
    User,
    Calendar,
    Filter,
    TrendingUp,
    BarChart3,
    Eye,
    X
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import moment from 'moment';

const Reviews = ({ selectedHotelId }) => {
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({
        stats: [],
        summary: { totalReviews: 0, averageRating: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [selectedStars, setSelectedStars] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
        limit: 20
    });

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // Fetch reviews
    const fetchReviews = useCallback(async (page = 1, stars = '') => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...(selectedHotelId && { hotelId: selectedHotelId }),
                ...(stars && { stars })
            };

            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/reviews`, {
                params,
                withCredentials: true
            });

            console.log('📥 Reviews response:', response.data);

            if (response.data.success) {

                setReviews(response.data.data?.reviews || []);
                setPagination(response.data.data?.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalReviews:0,
                    limit: 20
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đánh giá:', error);
            toast.error('Không thể lấy danh sách đánh giá');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [selectedHotelId, baseUrl]);

    // Fetch review statistics
    const fetchReviewStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const params = selectedHotelId ? { hotelId: selectedHotelId } : {};

            const response = await axios.get(`${baseUrl}/api/statistic-hotel/hotelowner/reviews/stats`, {
                params,
                withCredentials: true
            });

            console.log('📊 Stats response:', response.data);

            if (response.data.success) {

                setReviewStats(response.data.data || {
                    stats: [],
                    summary: { totalReviews: 0, averageRating: 0 }
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy thống kê đánh giá:', error);
            toast.error('Không thể lấy thống kê đánh giá');
        } finally {
            setStatsLoading(false);
        }
    }, [selectedHotelId, baseUrl]);

    // Handle stars filter
    const handleStarsFilter = (stars) => {
        setSelectedStars(stars);
        fetchReviews(1, stars);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        fetchReviews(page, selectedStars);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Render stars
    const renderStars = (rating, size = 'w-4 h-4') => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${size} ${
                            star <= rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    // Get rating color
    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-green-600 bg-green-100';
        if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
        if (rating >= 2) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    useEffect(() => {
        if (selectedHotelId) {
            fetchReviews();
            fetchReviewStats();
        } else {
            setReviews([]);
            setReviewStats({
                stats: [],
                summary: { totalReviews: 0, averageRating: 0 }
            });
        }
    }, [selectedHotelId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Đánh Giá Khách Hàng</h2>
                    <p className="text-gray-600">Quản lý và theo dõi đánh giá của khách sạn</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>Tổng: {pagination.totalReviews || 0} đánh giá</span>
                </div>
            </div>

            {/* Review Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Rating */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Điểm trung bình</h3>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-500 mb-2">
                            {reviewStats.summary?.averageRating || 0}
                        </div>
                        <div className="flex justify-center mb-2">
                            {renderStars(Math.round(reviewStats.summary?.averageRating || 0), 'w-6 h-6')}
                        </div>
                        <p className="text-gray-600">
                            Từ {reviewStats.summary?.totalReviews || 0} đánh giá
                        </p>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Phân bố đánh giá</h3>
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                    
                    {statsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : reviewStats.stats?.length > 0 ? (
                        <div className="space-y-3">
                            {reviewStats.stats.slice().reverse().map((stat) => (
                                <div key={stat.stars} className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1 w-16">
                                        <span className="text-sm font-medium">{stat.stars}</span>
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${stat.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-12 text-sm text-gray-600">
                                        {stat.count}
                                    </div>
                                    <div className="w-12 text-sm text-gray-500">
                                        {stat.percentage}%
                                    </div>
                                    <button
                                        onClick={() => handleStarsFilter(stat.stars.toString())}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có dữ liệu thống kê
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            {selectedHotelId && (
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleStarsFilter('')}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    selectedStars === '' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Tất cả
                            </button>
                            {[5, 4, 3, 2, 1].map((stars) => (
                                <button
                                    key={stars}
                                    onClick={() => handleStarsFilter(stars.toString())}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                                        selectedStars === stars.toString()
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>{stars}</span>
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                </button>
                            ))}
                        </div>

                        {selectedStars && (
                            <button
                                onClick={() => handleStarsFilter('')}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Đang tải...</p>
                    </div>
                ) : !selectedHotelId ? (
                    <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chọn khách sạn để xem đánh giá
                        </h3>
                        <p className="text-gray-600">
                            Vui lòng chọn khách sạn từ menu bên trái để xem đánh giá
                        </p>
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="divide-y divide-gray-200">
                            {reviews.map((review) => (
                                <div key={review.reviewId} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                        {/* Customer Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-600" />
                                            </div>
                                        </div>

                                        {/* Review Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-medium text-gray-900">
                                                        {review.customer?.name || 'Khách ẩn danh'}
                                                    </h4>
                                                    <div className="flex items-center space-x-1">
                                                        {renderStars(review.stars)}
                                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.stars)}`}>
                                                            {review.stars}/5
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {moment(review.reviewDate).format('DD/MM/YYYY')}
                                                </div>
                                            </div>

                                            {/* Review Comment */}
                                            {review.comment && (
                                                <div className="mb-3">
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        "{review.comment}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Booking Info */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Khách sạn:</span>
                                                        <p className="font-medium text-gray-900">{review.hotel?.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Thời gian lưu trú:</span>
                                                        <p className="font-medium text-gray-900">
                                                            {moment(review.booking?.checkInDate).format('DD/MM/YYYY')} - {moment(review.booking?.checkOutDate).format('DD/MM/YYYY')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Giá trị đơn hàng:</span>
                                                        <p className="font-medium text-green-600">
                                                            {formatCurrency(review.booking?.totalAmount || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                                {Math.min(pagination.currentPage * pagination.limit, pagination.totalReviews)}
                                            </span>{' '}
                                            trong{' '}
                                            <span className="font-medium">{pagination.totalReviews}</span> đánh giá
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Chưa có đánh giá</h3>
                        <p className="text-gray-500 mt-2">
                            Khách sạn chưa nhận được đánh giá nào từ khách hàng
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reviews;