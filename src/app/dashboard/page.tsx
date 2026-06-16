"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { type UserRole, roleLabel } from "@/lib/permissions";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
};

const roleOptions: UserRole[] = ["customer", "staff", "owner", "admin"];

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setForbidden(false);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setForbidden(true);
      setErrorMessage("Bạn cần đăng nhập trước.");
      setLoading(false);
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = myProfile?.role as UserRole | undefined;

    if (role !== "admin") {
      setForbidden(true);
      setErrorMessage("Chỉ Admin mới được phân quyền tài khoản.");
      setLoading(false);
      return;
    }

    setCurrentRole(role);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, phone, address")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Không tải được danh sách tài khoản.");
      setLoading(false);
      return;
    }

    setProfiles((data || []) as Profile[]);
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: UserRole) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setErrorMessage("Không cập nhật được vai trò.");
      return;
    }

    setProfiles((oldProfiles) =>
      oldProfiles.map((profile) =>
        profile.id === userId ? { ...profile, role: newRole } : profile
      )
    );

    setMessage("Đã cập nhật vai trò người dùng.");
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">Đang tải dữ liệu...</p>
      </main>
    );
  }

  if (forbidden || currentRole !== "admin") {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-3xl bg-white/90 p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">
            Không có quyền truy cập
          </h1>

          <p className="mt-3 text-slate-600">{errorMessage}</p>

          <Link
            href="/tim-kiem"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang tìm kiếm
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Phân quyền người dùng
            </h1>

            <p className="mt-2 text-slate-600">
              Admin có thể phân quyền Khách hàng, Nhân viên, Chủ cửa hàng hoặc
              Admin cho từng tài khoản.
            </p>
          </div>

          <Link
            href="/tim-kiem"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang tìm kiếm
          </Link>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 font-medium text-green-700 ring-1 ring-green-200">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-4">Họ tên</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Số điện thoại</th>
                <th className="px-5 py-4">Địa chỉ</th>
                <th className="px-5 py-4">Vai trò</th>
              </tr>
            </thead>

            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-slate-200">
                  <td className="px-5 py-4 font-semibold">
                    {profile.full_name || "Chưa có tên"}
                  </td>

                  <td className="px-5 py-4">{profile.email || "Chưa có email"}</td>

                  <td className="px-5 py-4">
                    {profile.phone || "Chưa cập nhật"}
                  </td>

                  <td className="px-5 py-4">
                    {profile.address || "Chưa cập nhật"}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={profile.role}
                      onChange={(event) =>
                        updateRole(profile.id, event.target.value as UserRole)
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-900"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel[role]}
                        </option>
                      ))}
                    </select>
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