import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RoleActions from "./RoleActions";
import AddToCartButton from "./AddToCartButton";

type ComponentItem = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  stock: number | null;
  location: string | null;
  description: string | null;
  datasheet_url: string | null;
  image_url: string | null;
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
}>;

const categories = [
  "Tất cả",
  "Điện trở",
  "Tụ điện",
  "IC",
  "Cảm biến",
  "Module",
  "Diode",
  "Transistor",
  "Relay",
];

function formatPrice(price: number) {
  return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const selectedCategory = params.category || "Tất cả";

  let request = supabase
    .from("components")
    .select(
      "id, name, code, category, price, stock, location, description, datasheet_url, image_url"
    )
    .order("name", { ascending: true });

  if (query) {
    request = request.or(
      `name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  if (selectedCategory && selectedCategory !== "Tất cả") {
    request = request.eq("category", selectedCategory);
  }

  const { data, error } = await request;

  const components = ((data || []) as ComponentItem[]).filter(Boolean);
  const totalItems = components.length;
  const lowStockCount = components.filter(
    (item) => Number(item.stock || 0) < 10
  ).length;
  const categoryCount = new Set(
    components.map((item) => item.category).filter(Boolean)
  ).size;

  return (
    <main className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">
          <Link href="/" className="text-xl font-extrabold text-blue-700">
            Linh Kiện Hub
          </Link>

          <RoleActions />
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 text-center text-white">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-100">
            Hệ thống tra cứu linh kiện điện tử
          </p>

          <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-extrabold leading-tight md:text-6xl">
            Tìm linh kiện nhanh, quản lý kho chuyên nghiệp.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Tìm theo tên, mã linh kiện, loại linh kiện. Xem giá, tồn kho, vị trí
            lưu trữ, datasheet và đặt mua trực tiếp trên hệ thống.
          </p>

          <form
            action="/tim-kiem"
            className="mx-auto mt-9 flex max-w-4xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl md:flex-row"
          >
            <input
              name="q"
              type="text"
              defaultValue={query}
              placeholder="Tìm theo tên, mã linh kiện, ví dụ: NE555, LM358, DHT11..."
              className="min-h-14 flex-1 rounded-xl border border-slate-200 bg-white px-5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              name="category"
              defaultValue={selectedCategory}
              className="min-h-14 rounded-xl border border-slate-200 bg-white px-5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-56"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button className="min-h-14 rounded-xl bg-blue-600 px-8 font-bold text-white transition hover:bg-blue-700">
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200">
            <p className="text-3xl font-extrabold text-blue-700">
              {totalItems}
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              Kết quả tìm kiếm
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200">
            <p className="text-3xl font-extrabold text-blue-700">
              {categoryCount}
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              Nhóm linh kiện
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200">
            <p className="text-3xl font-extrabold text-red-600">
              {lowStockCount}
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              Sắp hết hàng
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-950">
              Danh sách linh kiện
            </h2>

            <p className="mt-2 text-slate-600">
              Chọn linh kiện để xem chi tiết hoặc thêm vào mục mua hàng.
            </p>
          </div>

          <Link
            href="/tim-kiem"
            className="rounded-xl border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Xóa bộ lọc
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700 ring-1 ring-red-200">
            Không tải được danh sách linh kiện: {error.message}
          </div>
        )}

        {!error && components.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-700">
              Không tìm thấy linh kiện phù hợp.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {components.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
         {item.image_url && (
  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <img
      src={item.image_url}
      alt={item.name}
      className="h-full w-full object-cover"
    />
  </div>
)}

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-blue-700">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Mã: {item.code || "Chưa có mã"}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.category || "Khác"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 min-h-12 text-slate-600">
                  {item.description || "Chưa có mô tả cho linh kiện này."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Giá bán</p>
                    <p className="font-extrabold text-slate-950">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Tồn kho</p>
                    <p
                      className={`font-extrabold ${
                        Number(item.stock || 0) < 10
                          ? "text-red-600"
                          : "text-slate-950"
                      }`}
                    >
                      {item.stock ?? 0}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Vị trí lưu kho</p>
                    <p className="font-semibold text-slate-900">
                      {item.location || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <AddToCartButton
                    item={{
                      id: item.id,
                      name: item.name,
                      price: Number(item.price || 0),
                    }}
                  />

                  <Link
                    href={`/linh-kien/${item.id}`}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-blue-600 bg-white font-bold text-blue-600 transition hover:bg-blue-50"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}