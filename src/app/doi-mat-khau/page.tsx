"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage("Không đổi được mật khẩu. Link có thể đã hết hạn.");
      return;
    }

    setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-950">Đổi mật khẩu</h1>

        <p className="mt-2 text-slate-600">
          Nhập mật khẩu mới sau khi mở link khôi phục từ email.
        </p>

        <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Mật khẩu mới
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              placeholder="Nhập lại mật khẩu mới"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
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

        <Link
          href="/dang-nhap"
          className="mt-6 block text-center font-semibold text-blue-600"
        >
          Quay lại đăng nhập
        </Link>
      </section>
    </main>
  );
}