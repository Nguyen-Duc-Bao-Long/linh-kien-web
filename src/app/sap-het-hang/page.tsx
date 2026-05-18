"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ComponentItem = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  location: string | null;
};

export default function LowStockPage() {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadLowStockComponents();
  }, []);

  async function loadLowStockComponents() {
    setLoading(true);
    setForbidden(false);
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      setForbidden(true);
      setErrorMessage(
        "Chỉ Nhân viên hoặc Quản trị viên được xem linh kiện sắp hết hàng."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("components")
      .select("id, name, code, category, price, stock, location")
      .lt("stock", 10)
      .order("stock", { ascending: true });

    if (error) {
      setErrorMessage("Không tải được danh sách linh kiện sắp hết hàng.");
      setLoading(false);
      return;
    }

    setComponents((data || []) as ComponentItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">
          Đang tải danh sách linh kiện sắp hết hàng...
        </p>
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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Linh kiện sắp hết hàng
            </h1>

            <p className="mt-2 text-slate-600">
              Danh sách các linh kiện có số lượng tồn kho dưới 10.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quan-ly-linh-kien"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Quản lý linh kiện
            </Link>

            <Link
              href="/tim-kiem"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Về trang tìm kiếm
            </Link>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Cần nhập thêm
              </h2>

              <p className="mt-2 text-slate-600">
                Tổng số linh kiện sắp hết hàng: {components.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadLowStockComponents}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tải lại
            </button>
          </div>

          {components.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-green-50 p-6 text-center ring-1 ring-green-200">
              <p className="text-lg font-bold text-green-700">
                Hiện chưa có linh kiện nào sắp hết hàng.
              </p>

              <p className="mt-2 text-green-700">
                Tất cả linh kiện đều có tồn kho từ 10 trở lên.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Tên linh kiện
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Mã
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Loại
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Tồn kho
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Giá
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Vị trí
                    </th>

                    <th className="px-4 py-3 text-sm font-bold text-slate-700">
                      Gợi ý
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {components.map((item) => {
                    const stock = item.stock ?? 0;

                    return (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="px-4 py-4 font-semibold text-blue-700">
                          {item.name}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {item.code || "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {item.category || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              stock === 0
                                ? "bg-red-50 text-red-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {stock}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {item.price !== null && item.price !== undefined
                            ? `${Number(item.price).toLocaleString("vi-VN")}đ`
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {item.location || "—"}
                        </td>

                        <td className="px-4 py-4">
                          {stock === 0 ? (
                            <span className="font-semibold text-red-600">
                              Hết hàng, cần nhập gấp
                            </span>
                          ) : (
                            <span className="font-semibold text-orange-600">
                              Sắp hết, nên nhập thêm
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}