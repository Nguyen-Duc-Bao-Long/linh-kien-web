import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ComponentDetail = {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  description: string | null;
  datasheet_url: string | null;
  image_url: string | null;
  stock: number | null;
};

type DetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ComponentDetailPage({ params }: DetailPageProps) {
  const { id } = await params;

  const { data: component, error } = await supabase
    .from("components")
    .select(
      "id, name, code, category, price, location, description, datasheet_url, image_url, stock"
    )
    .eq("id", id)
    .single();

  if (error || !component) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">
            Không tìm thấy linh kiện
          </h1>

          <Link
            href="/tim-kiem"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Quay lại tìm kiếm
          </Link>
        </section>
      </main>
    );
  }

  const item = component as ComponentDetail;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/tim-kiem"
          className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
        >
          ← Quay lại tìm kiếm
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-8 md:grid-cols-[320px_1fr]">
            <div>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-72 w-full rounded-2xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-slate-100 text-center font-semibold text-slate-500">
                  Chưa có ảnh linh kiện
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Chi tiết linh kiện
              </p>

              <h1 className="mt-3 text-4xl font-bold text-slate-950">
                {item.name}
              </h1>

              <p className="mt-4 text-2xl font-bold text-blue-700">
                {item.price !== null && item.price !== undefined
                  ? `${Number(item.price).toLocaleString("vi-VN")}đ`
                  : "Chưa cập nhật giá"}
              </p>

              {item.category && (
                <span className="mt-4 inline-block rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Mã linh kiện
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {item.code || "Chưa cập nhật"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Loại linh kiện
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {item.category || "Chưa cập nhật"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">Tồn kho</p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {item.stock ?? "Chưa cập nhật"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Vị trí lưu trữ
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {item.location || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-950">Mô tả</h2>

            <p className="mt-3 leading-7 text-slate-700">
              {item.description || "Chưa có mô tả cho linh kiện này."}
            </p>
          </div>

          <div className="mt-8">
            {item.datasheet_url ? (
              <a
                href={item.datasheet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-slate-900 px-5 py-4 text-center font-semibold text-white hover:bg-slate-700"
              >
                Xem datasheet
              </a>
            ) : (
              <div className="rounded-xl bg-slate-100 px-5 py-4 text-center font-semibold text-slate-500">
                Chưa có datasheet
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}