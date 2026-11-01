const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:5000/api");

export const api = {
  auth: {
    register: `${API_URL}/auth/register`,
    verifyEmail: `${API_URL}/auth/verify-email`,
    resendOtp: `${API_URL}/auth/resend-otp`,
    login: `${API_URL}/auth/login`,
    logout: `${API_URL}/auth/logout`,
    me: `${API_URL}/auth/me`,
    profile: `${API_URL}/auth/profile`,
    addresses: `${API_URL}/auth/addresses`,
  },
  products: `${API_URL}/products`,
  categories: `${API_URL}/categories`,
  cart: `${API_URL}/cart`,
  orders: `${API_URL}/orders`,
  settings: `${API_URL}/settings`,
  pages: `${API_URL}/pages`,
  admin: {
    base: `${API_URL}/admin`,
    stats: `${API_URL}/admin/stats`,
    products: `${API_URL}/admin/products`,
    categories: `${API_URL}/admin/categories`,
    orders: `${API_URL}/admin/orders`,
    reviews: `${API_URL}/admin/reviews`,
    pages: `${API_URL}/admin/pages`,
    users: `${API_URL}/admin/users`,
    settings: `${API_URL}/admin/settings`,
  },
};

export default API_URL;
