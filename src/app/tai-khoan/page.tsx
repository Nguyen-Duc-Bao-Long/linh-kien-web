"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "staff" | "customer";
  phone: string | null;
  address: string | null;
};

const roleLabels = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setErrorMessage("Bạn cần đăng nhập để xem thông tin tài khoản.");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, phone, address")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      setLoading(false);
      setErrorMessage("Không tìm thấy thông tin tài khoản.");
      return;
    }

    const currentProfile = profileData as Profile;

    setProfile(currentProfile);
    setFullName(currentProfile.full_name || "");
    setPhone(currentProfile.phone || "");
    setAddress(currentProfile.address || "");

    setLoading(false);
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setMessage("");
    setErrorMessage("");
    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })
      .eq("id", profile.id);

    setSavingProfile(false);

    if (error) {
      setErrorMessage("Không cập nhật được thông tin tài khoản.");
      return;
    }

    setProfile({
      ...profile,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    setMessage("Cập nhật thông tin tài khoản thành công.");
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (error) {
      setErrorMessage("Không đổi được mật khẩu.");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Đổi mật khẩu thành công.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/dang-nhap";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">
          Đang tải thông tin tài khoản...
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">Chưa đăng nhập</h1>

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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Thông tin tài khoản
            </h1>

            <p className="mt-2 text-slate-600">
              Xem và cập nhật thông tin cá nhân, số điện thoại, địa chỉ và mật khẩu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tim-kiem"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Về trang tìm kiếm
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-green-700 ring-1 ring-green-200">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">
              Hồ sơ cá nhân
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-500">UUID</p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                  {profile.id}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-500">Email</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {profile.email || "Chưa có email"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-500">Vai trò</p>
                <p className="mt-2 font-semibold text-blue-700">
                  {roleLabels[profile.role]}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Trạng thái
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  Đang hoạt động
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Họ tên
                </label>

                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập họ tên"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Số điện thoại
                </label>

                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Địa chỉ
                </label>

                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Nhập địa chỉ nhận hàng"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </form>
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">
              Đổi mật khẩu
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Nhập mật khẩu mới để cập nhật tài khoản.
            </p>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Nhập lại mật khẩu mới
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
              >
                {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}