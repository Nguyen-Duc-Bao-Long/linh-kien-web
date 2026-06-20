"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "customer" | "staff" | "owner" | "admin";

type ProfileItem = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole | null;
  is_locked: boolean | null;
  lock_reason: string | null;
  created_at: string | null;
};

const roleLabel: Record<UserRole, string> = {
  customer: "Khách hàng",
  staff: "Nhân viên",
  owner: "Chủ cửa hàng",
  admin: "Admin",
};

const roleOptions: UserRole[] = ["customer", "staff", "owner", "admin"];

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(
    null
  );

  const [currentUserId, setCurrentUserId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setForbidden(false);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setForbidden(true);
      setErrorMessage("Bạn cần đăng nhập bằng tài khoản admin.");
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentProfileError || currentProfile?.role !== "admin") {
      setForbidden(true);
      setErrorMessage("Chỉ Admin mới được quản lý tài khoản người dùng.");
      setLoading(false);
      return;
    }

    await loadProfiles();
    setLoading(false);
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, address, role, is_locked, lock_reason, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const list = (data || []) as ProfileItem[];
    setProfiles(list);

    if (selectedProfile) {
      const updatedSelected = list.find(
        (profile) => profile.id === selectedProfile.id
      );
      setSelectedProfile(updatedSelected || null);
    }
  }

  const filteredProfiles = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    if (!value) return profiles;

    return profiles.filter((profile) => {
      const text = [
        profile.full_name,
        profile.email,
        profile.phone,
        profile.address,
        profile.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [keyword, profiles]);

  async function handleChangeRole(profile: ProfileItem, newRole: UserRole) {
    setMessage("");
    setErrorMessage("");
    setSavingId(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);

    setSavingId(null);

    if (error) {
      setErrorMessage("Không cập nhật được vai trò tài khoản.");
      return;
    }

    setMessage("Cập nhật vai trò tài khoản thành công.");
    await loadProfiles();
  }

  async function handleToggleLock(profile: ProfileItem) {
    if (profile.id === currentUserId) {
      setErrorMessage("Bạn không thể tự khóa tài khoản admin đang đăng nhập.");
      return;
    }

    const nextLockedState = !profile.is_locked;

    const confirmMessage = nextLockedState
      ? `Bạn có chắc muốn khóa tài khoản ${profile.email || profile.id} không?`
      : `Bạn có chắc muốn mở khóa tài khoản ${
          profile.email || profile.id
        } không?`;

    const confirmAction = window.confirm(confirmMessage);

    if (!confirmAction) return;

    setMessage("");
    setErrorMessage("");
    setSavingId(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        is_locked: nextLockedState,
        lock_reason: nextLockedState
          ? "Tài khoản bị khóa bởi quản trị viên."
          : null,
      })
      .eq("id", profile.id);

    setSavingId(null);

    if (error) {
      setErrorMessage("Không cập nhật được trạng thái tài khoản.");
      return;
    }

    setMessage(
      nextLockedState
        ? "Đã khóa tài khoản thành công."
        : "Đã mở khóa tài khoản thành công."
    );

    await loadProfiles();
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">
          Đang tải trang quản lý tài khoản...
        </p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-extrabold text-red-600">
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
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-950">
              Quản lý tài khoản người dùng
            </h1>

            <p className="mt-2 text-slate-600">
              Admin có thể tìm kiếm, xem chi tiết, phân quyền, khóa hoặc mở khóa
              tài khoản.
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

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Danh sách tài khoản
              </h2>

              <p className="mt-1 text-slate-600">
                Tổng số tài khoản: {profiles.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfiles}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tải lại
            </button>
          </div>

          <div className="mt-5">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo email, họ tên, số điện thoại, địa chỉ hoặc vai trò..."
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
  <div className="min-w-0 space-y-4">
    {filteredProfiles.map((profile) => (
      <div
        key={profile.id}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr] xl:items-center">
          <div>
            <p className="text-lg font-extrabold text-slate-950">
              {profile.full_name || "Chưa cập nhật họ tên"}
            </p>

            <p className="mt-1 break-all text-sm text-slate-500">
              ID: {profile.id}
            </p>
          </div>

          <div>
            <p className="break-all font-bold text-slate-800">
              {profile.email || "Chưa có email"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {profile.phone || "Chưa có số điện thoại"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Vai trò
            </p>

            <select
              value={profile.role || "customer"}
              disabled={savingId === profile.id}
              onChange={(event) =>
                handleChangeRole(profile, event.target.value as UserRole)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabel[role]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Trạng thái
            </p>

            {profile.is_locked ? (
              <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600 ring-1 ring-red-200">
                Đã khóa
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700 ring-1 ring-green-200">
                Đang hoạt động
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedProfile(profile)}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Xem chi tiết
          </button>

          <button
            type="button"
            onClick={() => handleToggleLock(profile)}
            disabled={savingId === profile.id || profile.id === currentUserId}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              profile.is_locked
                ? "border border-green-300 bg-white text-green-700 hover:bg-green-50"
                : "border border-red-300 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {profile.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          </button>
        </div>
      </div>
    ))}

    {filteredProfiles.length === 0 && (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-semibold text-slate-500 ring-1 ring-slate-200">
        Không tìm thấy tài khoản phù hợp.
      </div>
    )}
  </div>

  <aside className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
    <h3 className="text-2xl font-extrabold text-slate-950">
      Chi tiết tài khoản
    </h3>

    {!selectedProfile ? (
      <p className="mt-4 text-slate-600">
        Chọn một tài khoản trong danh sách để xem thông tin chi tiết.
      </p>
    ) : (
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Họ tên</p>
          <p className="font-bold text-slate-950">
            {selectedProfile.full_name || "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Email</p>
          <p className="break-all font-bold text-slate-950">
            {selectedProfile.email || "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Số điện thoại</p>
          <p className="font-bold text-slate-950">
            {selectedProfile.phone || "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Địa chỉ</p>
          <p className="font-bold text-slate-950">
            {selectedProfile.address || "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Vai trò</p>
          <p className="font-bold text-blue-700">
            {selectedProfile.role
              ? roleLabel[selectedProfile.role]
              : "Khách hàng"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Trạng thái</p>
          <p
            className={`font-bold ${
              selectedProfile.is_locked ? "text-red-600" : "text-green-700"
            }`}
          >
            {selectedProfile.is_locked
              ? "Tài khoản đang bị khóa"
              : "Tài khoản đang hoạt động"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Lý do khóa</p>
          <p className="font-bold text-slate-950">
            {selectedProfile.lock_reason || "Không có"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">Ngày tạo</p>
          <p className="font-bold text-slate-950">
            {formatDate(selectedProfile.created_at)}
          </p>
        </div>
      </div>
    )}
  </aside>
</div>
        </section>
      </section>
    </main>
  );
}