import axios from "axios";
import Cookies from 'js-cookie';

// ✅ Tạo axios instance với cấu hình CORS phù hợp
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true, // Quan trọng: gửi cookies và credentials
  timeout: 10000, // Timeout 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Thêm header cho ngrok để skip browser warning
    'ngrok-skip-browser-warning': 'true'
  }
});

// ✅ Request interceptor - xử lý token
instance.interceptors.request.use(
  (config) => {
    // Lấy token từ cả cookies và localStorage để đảm bảo
    const tokenFromCookie = Cookies.get("token");
    const tokenFromStorage = localStorage.getItem('token');
    const token = tokenFromCookie || tokenFromStorage;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request:', token.substring(0, 20) + '...');
    }

    // Log request để debug
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - xử lý response và lỗi
instance.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response interceptor error:', error);

    // Xử lý lỗi CORS
    if (error.code === 'ERR_NETWORK') {
      console.error('🚫 Network Error - Possible CORS issue or server down');
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
    }

    // Xử lý lỗi 401 - Token hết hạn
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - Token may be expired');
      // Xóa token và redirect to login
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_activeMenu');
      localStorage.removeItem('hotel_activeMenu');
      localStorage.removeItem('hotel_selectedHotelId');
      localStorage.removeItem('hotel_selectedHotelName');
      window.location.href = '/';
    }

    // Xử lý lỗi 403 - CORS
    if (error.response?.status === 403) {
      console.error('🚫 Forbidden - CORS or permission issue');
    }

    return Promise.reject(error);
  }
);

// ✅ Helper function để check connection
export const checkConnection = async () => {
  try {
    const response = await instance.get('/health');
    console.log('✅ Connection check successful');
    return response.data;
  } catch (error) {
    console.error('❌ Connection check failed:', error);
    throw error;
  }
};

export default instance;