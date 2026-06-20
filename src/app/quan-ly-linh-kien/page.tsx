"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "admin" | "owner" | "staff" | "customer";

type ComponentItem = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  location: string | null;
  description: string | null;
  usage_guide: string | null;
  datasheet_url: string | null;
  image_url: string | null;
};

type ComponentForm = {
  name: string;
  code: string;
  category: string;
  price: string;
  stock: string;
  location: string;
  description: string;
  usage_guide: string;
  datasheet_url: string;
  image_url: string;
};

const emptyForm: ComponentForm = {
  name: "",
  code: "",
  category: "",
  price: "",
  stock: "",
  location: "",
  description: "",
  usage_guide: "",
  datasheet_url: "",
  image_url: "",
};

export default function ManageComponentsPage() {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [form, setForm] = useState<ComponentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [forbidden, setForbidden] = useState(false);
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
      setErrorMessage("Bạn cần đăng nhập trước.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as UserRole | undefined;

    if (!role || !["admin", "owner"].includes(role)) {
      setForbidden(true);
      setErrorMessage("Chỉ Chủ cửa hàng hoặc Quản trị viên được quản lý linh kiện.");
      setLoading(false);
      return;
    }

    await loadComponents();
    setLoading(false);
  }

  async function loadComponents() {
    const { data, error } = await supabase
      .from("components")
      .select(
        "id, name, code, category, price, stock, location, description, usage_guide, datasheet_url, image_url"
      )
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setComponents((data || []) as ComponentItem[]);
  }

  function updateForm(field: keyof ComponentForm, value: string) {
    setForm((oldForm) => ({
      ...oldForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(item: ComponentItem) {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      code: item.code || "",
      category: item.category || "",
      price:
        item.price !== null && item.price !== undefined
          ? String(item.price)
          : "",
      stock:
        item.stock !== null && item.stock !== undefined
          ? String(item.stock)
          : "",
      location: item.location || "",
      description: item.description || "",
      usage_guide: item.usage_guide || "",
      datasheet_url: item.datasheet_url || "",
      image_url: item.image_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setMessage("");
  setErrorMessage("");

  const nameValue = form.name.trim();
  const codeValue = form.code.trim();
  const categoryValue = form.category.trim();

  if (!nameValue) {
    setErrorMessage("Vui lòng nhập tên linh kiện.");
    return;
  }

  if (!codeValue) {
    setErrorMessage("Vui lòng nhập mã linh kiện.");
    return;
  }

  if (!categoryValue) {
    setErrorMessage("Vui lòng nhập loại linh kiện.");
    return;
  }

  setSaving(true);

  let duplicateData: { id: string }[] | null = null;
  let duplicateError = null;

  if (editingId) {
    const result = await supabase
      .from("components")
      .select("id")
      .eq("code", codeValue)
      .neq("id", editingId)
      .limit(1);

    duplicateData = result.data;
    duplicateError = result.error;
  } else {
    const result = await supabase
      .from("components")
      .select("id")
      .eq("code", codeValue)
      .limit(1);

    duplicateData = result.data;
    duplicateError = result.error;
  }

  if (duplicateError) {
    setSaving(false);
    setErrorMessage("Không kiểm tra được mã linh kiện. Vui lòng thử lại.");
    return;
  }

  if (duplicateData && duplicateData.length > 0) {
    setSaving(false);
    setErrorMessage("Mã linh kiện bị trùng. Vui lòng nhập mã linh kiện khác.");
    return;
  }

  const payload = {
    name: nameValue,
    code: codeValue,
    category: categoryValue,
    price: form.price.trim() ? Number(form.price) : 0,
    stock: form.stock.trim() ? Number(form.stock) : 0,
    location: form.location.trim(),
    description: form.description.trim(),
    usage_guide: form.usage_guide.trim(),
    datasheet_url: form.datasheet_url.trim(),
    image_url: form.image_url.trim(),
  };

  if (editingId) {
    const { error } = await supabase
      .from("components")
      .update(payload)
      .eq("id", editingId);

    setSaving(false);

    if (error) {
      setErrorMessage("Không cập nhật được linh kiện.");
      return;
    }

    setMessage("Cập nhật linh kiện thành công.");
    resetForm();
    await loadComponents();
    return;
  }

  const { error } = await supabase.from("components").insert(payload);

  setSaving(false);

  if (error) {
    setErrorMessage("Không thêm được linh kiện.");
    return;
  }

  setMessage("Thêm linh kiện thành công.");
  resetForm();
  await loadComponents();
}

  async function handleDelete(item: ComponentItem) {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa linh kiện "${item.name}" không?`
    );

    if (!confirmDelete) return;

    setMessage("");
    setErrorMessage("");
    setDeletingId(item.id);

    const { error } = await supabase
      .from("components")
      .delete()
      .eq("id", item.id);

    setDeletingId(null);

    if (error) {
      setErrorMessage(
        "Không xóa được linh kiện. Linh kiện có thể đang nằm trong đơn hàng."
      );
      return;
    }

    setComponents((oldComponents) =>
      oldComponents.filter((component) => component.id !== item.id)
    );

    setMessage(`Đã xóa linh kiện "${item.name}".`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">
          Đang tải trang quản lý linh kiện...
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
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Quản lý linh kiện
            </h1>

            <p className="mt-2 text-slate-600">
              Thêm, chỉnh sửa hoặc xóa linh kiện trong kho.
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
          <h2 className="text-2xl font-bold text-slate-950">
            {editingId ? "Chỉnh sửa linh kiện" : "Thêm linh kiện mới"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tên linh kiện
              </label>

              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Ví dụ: IC NE555"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Mã linh kiện
              </label>

              <input
                value={form.code}
                onChange={(event) => updateForm("code", event.target.value)}
                placeholder="Ví dụ: NE555"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Loại linh kiện
              </label>

              <input
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                placeholder="Ví dụ: IC, Điện trở, Cảm biến"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Giá
              </label>

              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                placeholder="Ví dụ: 5000"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tồn kho
              </label>

              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(event) => updateForm("stock", event.target.value)}
                placeholder="Ví dụ: 100"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Vị trí lưu trữ
              </label>

              <input
                value={form.location}
                onChange={(event) => updateForm("location", event.target.value)}
                placeholder="Ví dụ: Kệ A1 - Ngăn 2"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Mô tả
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Nhập mô tả cơ bản về linh kiện"
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Hướng dẫn sử dụng / nhận biết
              </label>

              <textarea
                value={form.usage_guide}
                onChange={(event) =>
                  updateForm("usage_guide", event.target.value)
                }
                placeholder="Ví dụ: Cách đọc trị số điện trở, cách xác định cực LED, cách nhận biết chiều tụ hóa..."
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Link datasheet
              </label>

              <input
                value={form.datasheet_url}
                onChange={(event) =>
                  updateForm("datasheet_url", event.target.value)
                }
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Link ảnh linh kiện
              </label>

              <input
                value={form.image_url}
                onChange={(event) => updateForm("image_url", event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                  ? "Cập nhật linh kiện"
                  : "Thêm linh kiện"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Danh sách linh kiện
              </h2>

              <p className="mt-2 text-slate-600">
                Tổng số linh kiện: {components.length}
              </p>
            </div>

            <button
              onClick={loadComponents}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tải lại
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Tên
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Mã
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Giá
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Vị trí
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {components.map((item) => (
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

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.price !== null && item.price !== undefined
                        ? `${Number(item.price).toLocaleString("vi-VN")}đ`
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {item.stock ?? 0}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {item.location || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {components.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center font-semibold text-slate-500"
                    >
                      Chưa có linh kiện nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}