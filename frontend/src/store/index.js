import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Auth Store
export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user, token } = response.data.data;
                    set({ user, token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return { success: false, error: error.response?.data?.error?.message || 'Login failed' };
                }
            },

            register: async (userData) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', userData);
                    const { user, token } = response.data.data;
                    set({ user, token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return { success: false, error: error.response?.data?.error?.message || 'Registration failed' };
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            },

            updateProfile: async (data) => {
                try {
                    const response = await api.put('/auth/profile', data);
                    set({ user: { ...get().user, ...response.data.data } });
                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.response?.data?.error?.message };
                }
            },

            initAuth: () => {
                const token = get().token;
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
        }
    )
);

// Equipment Store
export const useEquipmentStore = create((set, get) => ({
    equipment: [],
    currentEquipment: null,
    categories: [],
    filters: {
        search: '',
        category: '',
        city: '',
        minPrice: '',
        maxPrice: '',
        hasOperator: false
    },
    pagination: {
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
    },
    isLoading: false,

    setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

    fetchEquipment: async (params = {}) => {
        set({ isLoading: true });
        try {
            const { filters, pagination } = get();
            const queryParams = {
                page: params.page || pagination.page,
                limit: pagination.limit,
                ...filters,
                ...params
            };

            // Remove empty values
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] === false) {
                    delete queryParams[key];
                }
            });

            const response = await api.get('/equipment', { params: queryParams });
            set({
                equipment: response.data.data,
                pagination: response.data.pagination,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            console.error('Failed to fetch equipment:', error);
        }
    },

    fetchEquipmentById: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/equipment/${id}`);
            set({ currentEquipment: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchCategories: async () => {
        try {
            const response = await api.get('/equipment/categories');
            set({ categories: response.data.data });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    },

    clearCurrentEquipment: () => set({ currentEquipment: null })
}));

// Booking Store
export const useBookingStore = create((set, get) => ({
    bookings: [],
    currentBooking: null,
    isLoading: false,

    fetchBookings: async (params = {}) => {
        set({ isLoading: true });
        try {
            const response = await api.get('/bookings', { params });
            set({ bookings: response.data.data, isLoading: false });
            return response.data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchBookingById: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/bookings/${id}`);
            set({ currentBooking: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createBooking: async (bookingData) => {
        try {
            const response = await api.post('/bookings', bookingData);
            return { success: true, data: response.data.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error?.message };
        }
    },

    updateBookingStatus: async (id, status, data = {}) => {
        try {
            const response = await api.patch(`/bookings/${id}/status`, { status, ...data });
            // Update booking in list
            set({
                bookings: get().bookings.map(b =>
                    b.id === id ? { ...b, status: response.data.data.status } : b
                )
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error?.message };
        }
    }
}));

// Notification Store
export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        try {
            const response = await api.get('/notifications');
            set({
                notifications: response.data.data,
                unreadCount: response.data.unreadCount
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            set({
                notifications: get().notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, get().unreadCount - 1)
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await api.patch('/notifications/read-all');
            set({
                notifications: get().notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    },

    addNotification: (notification) => {
        set({
            notifications: [notification, ...get().notifications],
            unreadCount: get().unreadCount + 1
        });
    }
}));

// UI Store
export const useUIStore = create((set) => ({
    sidebarOpen: true,
    modalOpen: null,

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    openModal: (modalId) => set({ modalOpen: modalId }),
    closeModal: () => set({ modalOpen: null })
}));
