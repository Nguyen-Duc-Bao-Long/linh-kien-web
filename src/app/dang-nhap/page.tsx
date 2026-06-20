"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "admin" | "staff" | "customer";

const roleLabels: Record<UserRole, string> = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMessage("Email hoặc mật khẩu không đúng.");
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setLoading(false);
      setErrorMessage("Không lấy được thông tin tài khoản.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      setErrorMessage("Không tìm thấy thông tin vai trò của tài khoản.");
      return;
    }

    if (profile.role !== role) {
      await supabase.auth.signOut();
      setLoading(false);
      setErrorMessage(
        `Tài khoản này không thuộc vai trò ${roleLabels[role]}. Vui lòng chọn đúng vai trò.`
      );
      return;
    }

    setMessage(`Đăng nhập thành công với vai trò ${roleLabels[role]}.`);

    router.push("/tim-kiem");
    return;
  }

  async function handleForgotPassword() {
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email trước khi bấm quên mật khẩu.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/doi-mat-khau`,
    });

    setResetLoading(false);

    if (error) {
      setErrorMessage("Không gửi được email đặt lại mật khẩu.");
      return;
    }

    setMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Đăng nhập hệ thống
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
            Truy cập tài khoản để tra cứu và quản lý linh kiện.
          </h1>

<div className="mt-8 space-y-3">
  <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div className="w-36 shrink-0 text-lg font-extrabold text-blue-600">
      Khách hàng
    </div>
    <p className="text-sm leading-6 text-slate-700">
      Tìm kiếm linh kiện, xem giá, thêm vào giỏ hàng, đặt mua và chat hỗ trợ.
    </p>
  </div>

  <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div className="w-36 shrink-0 text-lg font-extrabold text-blue-600">
      Nhân viên
    </div>
    <p className="text-sm leading-6 text-slate-700">
      Xem đơn hàng, xác nhận thanh toán, hỗ trợ khách hàng và kiểm tra hàng sắp hết.
    </p>
  </div>

  <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div className="w-36 shrink-0 text-lg font-extrabold text-blue-600">
      Chủ cửa hàng
    </div>
    <p className="text-sm leading-6 text-slate-700">
      Quản lý linh kiện, cập nhật giá bán, tồn kho, vị trí lưu trữ và thống kê.
    </p>
  </div>

  <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div className="w-36 shrink-0 text-lg font-extrabold text-blue-600">
      Admin
    </div>
    <p className="text-sm leading-6 text-slate-700">
      Quản lý tài khoản, phân quyền người dùng, khóa tài khoản và kiểm soát hệ thống.
    </p>
  </div>
</div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-3xl font-bold text-slate-950">Đăng nhập</h2>

          <p className="mt-2 text-slate-600">
            Nhập email, mật khẩu và chọn đúng vai trò.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Vai trò
              </label>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="customer">Khách hàng</option>
                <option value="staff">Nhân viên</option>
                <option value="owner">Chủ cửa hàng</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="w-full rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Đang gửi email..." : "Quên mật khẩu?"}
            </button>

            {message && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
                {message}
              </p>
            )}

            {errorMessage && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                {errorMessage}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Chưa có tài khoản?{" "}
            <Link href="/dang-ky" className="font-semibold text-blue-600">
              Đăng ký ngay
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-500">
            Khi nhập mật khẩu xong, bấm Enter là form sẽ tự đăng nhập.
          </p>
        </div>
      </section>
    </main>
  );
}