"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface UserAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  isVerified?: boolean;
  addresses?: UserAddress[];
  createdAt?: string;
}

export interface RegisterResult {
  success: boolean;
  requiresVerification?: boolean;
  email?: string;
  devOtp?: string;
  message?: string;
}

export interface LoginResult {
  success: boolean;
  requiresVerification?: boolean;
  email?: string;
  devOtp?: string;
  message?: string;
  role?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<RegisterResult>;
  verifyEmail: (email: string, otp?: string, token?: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<User | null>;
  updateProfile: (data: { name?: string; phone?: string; password?: string }) => Promise<User>;
  addAddress: (address: Omit<UserAddress, "_id">) => Promise<UserAddress[]>;
  deleteAddress: (addressId: string) => Promise<UserAddress[]>;
  setDefaultAddress: (addressId: string) => Promise<UserAddress[]>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "nk_shoes_auth_user";
const TOKEN_STORAGE_KEY = "nk_shoes_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch {
      // Ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(api.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          return {
            success: false,
            requiresVerification: true,
            email: data.email || email,
            devOtp: data.devOtp,
            message: data.message,
          };
        }
        throw new Error(data.message || "Login failed");
      }
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, isVerified: data.isVerified };
      setUser(userData);
      setToken(data.accessToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
      return { success: true, role: data.role, user: userData };
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string): Promise<RegisterResult> => {
    try {
      const res = await fetch(api.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }
      return {
        success: true,
        requiresVerification: Boolean(data.requiresVerification),
        email: data.email || email,
        devOtp: data.devOtp,
        message: data.message,
      };
    } catch (error) {
      throw error;
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, otp?: string, token?: string) => {
    try {
      const res = await fetch(api.auth.verifyEmail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Email verification failed");
      }
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, isVerified: true };
      setUser(userData);
      setToken(data.accessToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    try {
      const res = await fetch(api.auth.resendOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification code");
      }
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(api.auth.logout, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore
    }
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) return null;
      const res = await fetch(api.auth.me, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // Ignore
    }
    return null;
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string; password?: string }): Promise<User> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const res = await fetch(api.auth.profile, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message || "Failed to update profile");
    }
    setUser(resData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resData));
    return resData;
  }, []);

  const addAddress = useCallback(async (address: Omit<UserAddress, "_id">): Promise<UserAddress[]> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const res = await fetch(api.auth.addresses, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(address),
    });
    const addresses = await res.json();
    if (!res.ok) {
      throw new Error(addresses.message || "Failed to add address");
    }
    setUser((prev) => (prev ? { ...prev, addresses } : prev));
    return addresses;
  }, []);

  const deleteAddress = useCallback(async (addressId: string): Promise<UserAddress[]> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const res = await fetch(`${api.auth.addresses}/${addressId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });
    const addresses = await res.json();
    if (!res.ok) {
      throw new Error(addresses.message || "Failed to delete address");
    }
    setUser((prev) => (prev ? { ...prev, addresses } : prev));
    return addresses;
  }, []);

  const setDefaultAddress = useCallback(async (addressId: string): Promise<UserAddress[]> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const res = await fetch(`${api.auth.addresses}/${addressId}/default`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });
    const addresses = await res.json();
    if (!res.ok) {
      throw new Error(addresses.message || "Failed to set default address");
    }
    setUser((prev) => (prev ? { ...prev, addresses } : prev));
    return addresses;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        token,
        isHydrated,
        login,
        register,
        verifyEmail,
        resendOtp,
        refreshUser,
        updateProfile,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
