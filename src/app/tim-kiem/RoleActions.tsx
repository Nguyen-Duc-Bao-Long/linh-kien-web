"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  type UserRole,
  roleLabel,
  canUseChat,
  canBuy,
  canViewOrders,
  canViewLowStock,
  canManageComponents,
  canViewStatistics,
  canManageUsers,
} from "@/lib/permissions";


const navButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100";

const logoutButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700";

const primaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700";

const roleClass =
  "inline-flex h-10 items-center justify-center rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 ring-1 ring-blue-100";

const buttonResetClass = "appearance-none border-0 font-sans outline-none";

export default function RoleActions() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  async function loadUserRole() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoggedIn(false);
      setRole(null);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole((profile?.role as UserRole) || "customer");
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/tim-kiem";
  }

  if (loading) {
    return <div className={roleClass}>Đang tải...</div>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isLoggedIn && role && (
        <div className={roleClass}>Vai trò: {roleLabel[role]}</div>
      )}

      {isLoggedIn && (
        <Link href="/tai-khoan" className={navButtonClass}>
          Tài khoản
        </Link>
      )}

      {isLoggedIn && role && canUseChat(role) && (
        <Link href="/chat" className={navButtonClass}>
          Chat
        </Link>
      )}

      {isLoggedIn && role && canViewOrders(role) && (
        <Link href="/don-hang" className={navButtonClass}>
          Đơn hàng
        </Link>
      )}

      {isLoggedIn && role && canManageComponents(role) && (
        <Link href="/quan-ly-linh-kien" className={navButtonClass}>
          Linh kiện
        </Link>
      )}

      {isLoggedIn && role && canViewLowStock(role) && (
        <Link href="/sap-het-hang" className={navButtonClass}>
          Sắp hết hàng
        </Link>
      )}

      {isLoggedIn && role && canViewStatistics(role) && (
        <Link href="/thong-ke" className={navButtonClass}>
          Thống kê
        </Link>
      )}

      {isLoggedIn && role && canManageUsers(role) && (
        <Link href="/dashboard" className={navButtonClass}>
          Phân quyền
        </Link>
      )}

      {isLoggedIn && role && canBuy(role) && (
        <Link href="/mua-hang" className={primaryButtonClass}>
          Mua hàng
        </Link>
      )}

      {!isLoggedIn && (
        <Link href="/dang-nhap" className={primaryButtonClass}>
          Đăng nhập
        </Link>
      )}

      {isLoggedIn && (
  <button
    type="button"
    onClick={handleLogout}
    className={`${logoutButtonClass} ${buttonResetClass}`}
  >
    Đăng xuất
  </button>
)}
    </div>
  );
}