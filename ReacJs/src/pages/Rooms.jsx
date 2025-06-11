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

const Room = ({rooms,getRoomStatusColor, getRoomStatusText, formatCurrency, formatDate}) => {
    
     return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Quản Lý Phòng</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Thêm phòng
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                            src={room.image}
                            alt={room.type}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">Phòng {room.number}</h3>
                                    <p className="text-gray-600 text-sm">{room.type}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room.status)}`}>
                                    {getRoomStatusText(room.status)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Giá/đêm:</span>
                                    <span className="font-semibold">{formatCurrency(room.price)}</span>
                                </div>

                                {room.guest && (
                                    <div className="flex justify-between">
                                        <span>Khách:</span>
                                        <span className="font-medium">{room.guest}</span>
                                    </div>
                                )}

                                {room.checkOut && (
                                    <div className="flex justify-between">
                                        <span>Check-out:</span>
                                        <span>{formatDate(room.checkOut)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-2 mt-4">
                                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                    Chi tiết
                                </button>
                                <button className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50">
                                    Chỉnh sửa
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
     );
};

export default Room;