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

const buttonClass =
  "rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700";

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
    return (
      <div className="w-full">
        <div className="mb-8 flex justify-end">
          <div className="rounded-2xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 shadow-sm">
            Đang tải...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-end">
        {isLoggedIn && role && (
          <div className="rounded-2xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 shadow-sm">
            Vai trò: {roleLabel[role]}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {isLoggedIn && (
          <Link href="/tai-khoan" className={buttonClass}>
            Tài khoản
          </Link>
        )}

        {isLoggedIn && role && canUseChat(role) && (
          <Link href="/chat" className={buttonClass}>
            Chat
          </Link>
        )}

        {isLoggedIn && role && canViewOrders(role) && (
          <Link href="/don-hang" className={buttonClass}>
            Xem đơn hàng
          </Link>
        )}

        {isLoggedIn && role && canManageComponents(role) && (
          <Link href="/quan-ly-linh-kien" className={buttonClass}>
            Quản lý linh kiện
          </Link>
        )}

        {isLoggedIn && role && canViewLowStock(role) && (
          <Link href="/sap-het-hang" className={buttonClass}>
            Sắp hết hàng
          </Link>
        )}

        {isLoggedIn && role && canViewStatistics(role) && (
          <Link href="/thong-ke" className={buttonClass}>
            Thống kê
          </Link>
        )}

        {isLoggedIn && role && canManageUsers(role) && (
          <Link href="/dashboard" className={buttonClass}>
            Phân quyền
          </Link>
        )}

        {isLoggedIn && role && canBuy(role) && (
          <Link href="/mua-hang" className={buttonClass}>
            Mua hàng
          </Link>
        )}

        <Link href="/" className={buttonClass}>
          Về trang chủ
        </Link>

        {isLoggedIn ? (
          <button type="button" onClick={handleLogout} className={buttonClass}>
            Đăng xuất
          </button>
        ) : (
          <Link href="/dang-nhap" className={buttonClass}>
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}