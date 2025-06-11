

export const rooms = [
  {
    id: 'R301',
    number: '301',
    type: 'Deluxe Double',
    status: 'occupied',
    guest: 'Nguyễn Văn An',
    checkOut: '2025-06-18',
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=300&h=200&fit=crop'
  },
  {
    id: 'R302',
    number: '302',
    type: 'Deluxe Double',
    status: 'available',
    guest: null,
    checkOut: null,
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=300&h=200&fit=crop'
  },
  {
    id: 'R205',
    number: '205',
    type: 'Superior Single',
    status: 'maintenance',
    guest: null,
    checkOut: null,
    price: 1000000,
    image: 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=300&h=200&fit=crop'
  },
  {
    id: 'R401',
    number: '401',
    type: 'Family Suite',
    status: 'reserved',
    guest: 'Lê Minh Cường',
    checkOut: '2025vuex: -06-25',
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=200&fit=crop'
  }
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