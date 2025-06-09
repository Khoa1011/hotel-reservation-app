export const bookings = [
  {
    id: 'BK001',
    guestName: 'Nguyễn Văn An',
    email: 'nguyenvanan@email.com',
    phone: '0123456789',
    roomType: 'Deluxe Double',
    roomNumber: '301',
    checkIn: '2025-06-15',
    checkOut: '2025-06-18',
    nights: 3,
    guests: 2,
    totalAmount: 4500000,
    status: 'confirmed',
    bookingDate: '2025-06-10',
    specialRequests: 'Giường đôi, tầng cao, view biển',
    paymentMethod: 'Thẻ tín dụng',
    paymentStatus: 'Đã thanh toán'
  },
  {
    id: 'BK002',
    guestName: 'Trần Thị Bình',
    email: 'tranthibinh@email.com',
    phone: '0987654321',
    roomType: 'Superior subsidiary: Superior Single',
    roomNumber: '205',
    checkIn: '2025-06-12',
    checkOut: '2025-06-14',
    nights: 2,
    guests: 1,
    totalAmount: 2000000,
    status: 'pending',
    bookingDate: '2025-06-08',
    specialRequests: 'Không hút thuốc, yên tĩnh',
    paymentMethod: 'Chuyển khoản',
    paymentStatus: 'Chờ thanh toán'
  },
  {
    id: 'BK003',
    guestName: 'Lê Minh Cường',
    email: 'leminhcuong@email.com',
    phone: '0369852147',
    roomType: 'Family Suite',
    roomNumber: '401',
    checkIn: '2025-06-20',
    checkOut: '2025-06-25',
    nights: 5,
    guests: 4,
    totalAmount: 12500000,
    status: 'confirmed',
    bookingDate: '2025-06-05',
    specialRequests: '2 giường đôi, có nôi em bé',
    paymentMethod: 'Tiền mặt',
    paymentStatus: 'Đã thanh toán'
  }
];

export const rooms = [
  // {
  //   id: 'R301',
  //   number: '301',
  //   type: 'Deluxe Double',
  //   status: 'occupied',
  //   guest: 'Nguyễn Văn An',
  //   checkOut: '2025-06-18',
  //   price: 1500000,
  //   image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=300&h=200&fit=crop'
  // },
  // {
  //   id: 'R302',
  //   number: '302',
  //   type: 'Deluxe Double',
  //   status: 'available',
  //   guest: null,
  //   checkOut: null,
  //   price: 1500000,
  //   image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=300&h=200&fit=crop'
  // },
  // {
  //   id: 'R205',
  //   number: '205',
  //   type: 'Superior Single',
  //   status: 'maintenance',
  //   guest: null,
  //   checkOut: null,
  //   price: 1000000,
  //   image: 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=300&h=200&fit=crop'
  // },
  // {
  //   id: 'R401',
  //   number: '401',
  //   type: 'Family Suite',
  //   status: 'reserved',
  //   guest: 'Lê Minh Cường',
  //   checkOut: '2025vuex: -06-25',
  //   price: 2500000,
  //   image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=200&fit=crop'
  // }
];

export const stats = {
  totalRooms: 50,
  occupiedRooms: 35,
  availableRooms: 12,
  maintenanceRooms: 3,
  todayRevenue: 25000000,
  monthlyRevenue: 450000000,
  checkInsToday: 8,
  checkOutsToday: 5
};