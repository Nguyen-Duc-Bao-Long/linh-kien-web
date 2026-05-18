"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "admin" | "staff" | "customer";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string | null;
};

const roleLabels: Record<UserRole, string> = {
  admin: "QTV",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setForbidden(false);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setForbidden(true);
      setErrorMessage("Bạn cần đăng nhập trước.");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile, error: myProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (myProfileError || !myProfile || myProfile.role !== "admin") {
      setLoading(false);
      setForbidden(true);
      setErrorMessage("Chỉ Quản trị viên mới được phân quyền tài khoản.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setProfiles((data || []) as Profile[]);
    setLoading(false);
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setErrorMessage("Không thể cập nhật vai trò.");
      return;
    }

    setProfiles((oldProfiles) =>
      oldProfiles.map((profile) =>
        profile.id === userId ? { ...profile, role: newRole } : profile
      )
    );

    setMessage("Cập nhật vai trò thành công.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/dang-nhap";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">Đang tải dashboard...</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">
            Không có quyền truy cập
          </h1>

          <p className="mt-3 text-slate-600">{errorMessage}</p>

          <Link
            href="/dang-nhap"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang đăng nhập
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Dashboard phân quyền
            </h1>

            <p className="mt-2 text-slate-600">
              Chỉ Quản trị viên được thay đổi vai trò của tài khoản khác.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đăng xuất
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/don-hang"
            className="inline-block rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Xem đơn hàng
          </Link>

          <Link
            href="/tim-kiem"
            className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang tìm kiếm
          </Link>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-4 text-sm font-bold text-slate-700">
                  Họ tên
                </th>

                <th className="px-5 py-4 text-sm font-bold text-slate-700">
                  Email
                </th>

                <th className="px-5 py-4 text-sm font-bold text-slate-700">
                  Vai trò hiện tại
                </th>

                <th className="px-5 py-4 text-sm font-bold text-slate-700">
                  Phân quyền
                </th>
              </tr>
            </thead>

            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-slate-200">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {profile.full_name || "Chưa cập nhật"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {profile.email || "Chưa có email"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {roleLabels[profile.role]}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={profile.role}
                      disabled={profile.id === currentUserId}
                      onChange={(event) =>
                        handleChangeRole(
                          profile.id,
                          event.target.value as UserRole
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="admin">QTV</option>
                      <option value="staff">Nhân viên</option>
                      <option value="customer">Khách hàng</option>
                    </select>

                    {profile.id === currentUserId && (
                      <p className="mt-1 text-xs text-slate-500">
                        Không đổi quyền tài khoản đang đăng nhập.
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}