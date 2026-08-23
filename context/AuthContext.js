"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const STORAGE_KEY = "bachelor_auth_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("signin"); // "signin" | "signup"

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      }
    } catch (e) {
      console.warn("Failed to load auth state", e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      setIsLoginModalOpen(false);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function register(formData) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign-up failed");
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function updateUserSession(updatedUserData) {
    setUser(updatedUserData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
    } catch (e) {}
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const isSuperAdmin =
    user?.role === "super_admin" || user?.username?.toLowerCase() === "asif";
  const isAdmin = isSuperAdmin || user?.role === "admin";
  const isSubManager = user?.role === "sub_manager";
  const isMember = user?.role === "member";
  const isApprovedMember =
    user?.status === "approved" || isMember || isSuperAdmin || isAdmin || isSubManager;
  const isAdminOrManager = isSuperAdmin || isAdmin || isSubManager;

  // STRICT REQUIREMENT: Only Admin and Super Admin can add member and edit meal
  const canManageMembersAndMeals = isSuperAdmin || isAdmin;

  // STRICT REQUIREMENT: Only approved flat members, managers, and Super Admin can add to Bajar list
  const canAddBajar = !!user && (isSuperAdmin || isAdmin || isSubManager || user?.status === "approved" || isMember);

  function openLoginModal(tab = "signin") {
    setAuthModalTab(tab);
    setIsLoginModalOpen(true);
  }

  function openSignUpModal() {
    setAuthModalTab("signup");
    setIsLoginModalOpen(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        isSuperAdmin,
        isAdmin,
        isSubManager,
        isMember,
        isApprovedMember,
        isAdminOrManager,
        canManageMembersAndMeals,
        canAddBajar,
        login,
        register,
        logout,
        updateUserSession,
        isLoginModalOpen,
        setIsLoginModalOpen,
        authModalTab,
        setAuthModalTab,
        openLoginModal,
        openSignUpModal,
        closeLoginModal: () => setIsLoginModalOpen(false),
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
