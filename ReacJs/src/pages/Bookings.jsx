import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Bed, 
  DollarSign, 
  Settings, 
  Bell, 
  ChevronDown, 
  ChevronRight,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Booking = ({bookings, expandedBooking, setExpandedBooking, formatCurrency, formatDate, getStatusColor, getStatusText}) =>{

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Đơn Đặt Phòng</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Đơn mới
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Lọc
            </button>
          </div>
        </div>
  
        <div className="bg-white rounded-lg shadow">
          {bookings.map((booking) => (
            <div key={booking.id} className="border-b border-gray-200 last:border-b-0">
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {expandedBooking === booking.id ? 
                        <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{booking.guestName}</h3>
                      <p className="text-sm text-gray-600">Mã: {booking.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.roomType}</p>
                      <p className="text-sm text-gray-600">Phòng {booking.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                      <p className="text-sm text-gray-600">{booking.nights} đêm • {booking.guests} khách</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(booking.totalAmount)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedBooking === booking.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Thông tin khách hàng
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{booking.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{booking.phone}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-800 flex items-center mt-4">
                        <Bed className="h-4 w-4 mr-2" />
                        Yêu cầu đặc biệt
                      </h4>
                      <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Thông tin thanh toán
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Phương thức:</span>
                          <span className="font-medium">{booking.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trạng thái:</span>
                          <span className={`font-medium ${booking.paymentStatus === 'Đã thanh toán' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {booking.paymentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ngày đặt:</span>
                          <span>{formatDate(booking.bookingDate)}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          Xác nhận
                        </button>
                        <button className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Hủy đơn
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
  );
}

export default Booking;