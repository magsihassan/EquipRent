import axios from 'axios';

// Use environment variable for production, fallback to '/api' for development
// Use environment variable for production, fallback to Railway URL directly
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://equiprent-production.up.railway.app';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Token is already set in auth store
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - clear auth and redirect
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const equipmentAPI = {
    getAll: (params) => api.get('/equipment', { params }),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    uploadImages: (id, formData) => api.post(`/equipment/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getMyEquipment: (params) => api.get('/equipment/my/list', { params }),
    setAvailability: (id, dates) => api.post(`/equipment/${id}/availability`, { dates }),
    getCategories: () => api.get('/equipment/categories')
};

export const bookingAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    updateStatus: (id, status, data) => api.patch(`/bookings/${id}/status`, { status, ...data })
};

export const reviewAPI = {
    getAll: (params) => api.get('/reviews', { params }),
    create: (data) => api.post('/reviews', data),
    getMyReviews: () => api.get('/reviews/my')
};

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: (params) => api.get('/admin/users', { params }),
    verifyUser: (id, data) => api.patch(`/admin/users/${id}/verify`, data),
    getPendingEquipment: () => api.get('/admin/equipment/pending'),
    approveEquipment: (id, data) => api.patch(`/admin/equipment/${id}/approve`, data),
    getAllBookings: (params) => api.get('/admin/bookings', { params }),
    createCategory: (data) => api.post('/admin/categories', data)
};

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    requestPasswordChangeOTP: () => api.post('/auth/request-password-change-otp'),
    changePasswordWithOTP: (data) => api.post('/auth/change-password-otp', data),
    uploadCNIC: (formData) => api.post('/auth/upload-cnic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadProfileImage: (formData) => api.post('/auth/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const logisticsAPI = {
    createTransportRequest: (data) => api.post('/logistics/transportation', data),
    getTransportRequests: (params) => api.get('/logistics/transportation', { params }),
    getOperators: (params) => api.get('/logistics/operators', { params }),
    createOperator: (data) => api.post('/logistics/operators', data)
};

export const checklistAPI = {
    create: (data) => api.post('/checklists', data),
    getByBooking: (bookingId) => api.get(`/checklists/booking/${bookingId}`),
    uploadImages: (checklistId, formData) => api.post(`/checklists/${checklistId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    createMaintenanceLog: (data) => api.post('/checklists/maintenance', data),
    getMaintenanceLogs: (equipmentId) => api.get(`/checklists/maintenance/${equipmentId}`)
};
