"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Vui lòng nhập họ tên.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Đăng ký thành công. Tài khoản của bạn mặc định là Khách hàng."
    );

    setTimeout(() => {
      router.push("/dang-nhap");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-950">
          Đăng ký tài khoản
        </h1>

        <p className="mt-2 text-slate-600">
          Tạo tài khoản mới để sử dụng hệ thống tra cứu linh kiện.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Họ tên
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
              placeholder="Ít nhất 6 ký tự"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
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
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-semibold text-blue-600">
            Đăng nhập
          </Link>
        </p>
      </section>
    </main>
  );
}