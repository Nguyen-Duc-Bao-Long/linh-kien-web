import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AddToCartButton from "./AddToCartButton";
import RoleActions from "./RoleActions";

type ComponentItem = {
  id: string;
  name: string;
  price: number | string | null;
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const keyword = (params.q || "").trim();
  const selectedCategory = params.category || "Tất cả";

  let query = supabase
    .from("components")
    .select("id, name, price")
    .order("name", { ascending: true });

  if (keyword !== "") {
    query = query.or(
      `name.ilike.%${keyword}%,code.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
    );
  }

  if (selectedCategory !== "Tất cả") {
    query = query.eq("category", selectedCategory);
  }

  const { data: results, error } = await query;

  const { data: categoryRows } = await supabase
    .from("components")
    .select("category");

  const categories = [
    "Tất cả",
    ...Array.from(
      new Set(
        (categoryRows || [])
          .map((item) => item.category)
          .filter((item): item is string => Boolean(item))
      )
    ),
  ];

  const isFiltering = keyword !== "" || selectedCategory !== "Tất cả";

  return (
    <main
  className="min-h-screen px-6 py-10 text-slate-900"
  style={{
    backgroundImage:
      "linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.88)), url('/bg-linh-kien.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}
>
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Tìm kiếm linh kiện
            </h1>

            <p className="mt-3 text-lg text-slate-600">
              Tìm theo tên, mã linh kiện, từ khóa hoặc loại linh kiện.
            </p>
          </div>

          <RoleActions />
        </div>

        <form
          action="/tim-kiem"
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_240px_160px]">
            <div className="relative">
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Ví dụ: NE555, LM358, DHT11, điện trở..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {isFiltering && (
                <Link
                  href="/tim-kiem"
                  title="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </Link>
              )}
            </div>

            <select
              name="category"
              defaultValue={selectedCategory}
              className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button className="rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700">
              Tìm kiếm
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">
            <p className="font-semibold">Lỗi lấy dữ liệu từ Supabase</p>
            <p className="mt-1 text-sm">{error.message}</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-950">
            Kết quả tìm kiếm: {results?.length || 0}
          </h2>

          {isFiltering && (
            <Link
              href="/tim-kiem"
              className="rounded-lg px-3 py-2 font-medium text-blue-600 hover:bg-blue-50"
            >
              Xóa bộ lọc
            </Link>
          )}
        </div>

        {!error && (!results || results.length === 0) ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-900">
              Không tìm thấy linh kiện phù hợp.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(results as ComponentItem[] | null)?.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md"
              >
                <h3 className="text-xl font-bold text-blue-700">
                  {item.name}
                </h3>

                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Giá:{" "}
                  {item.price !== null && item.price !== undefined
                    ? `${Number(item.price).toLocaleString("vi-VN")}đ`
                    : "Chưa cập nhật"}
                </p>

                <AddToCartButton item={item} />

                <Link
                  href={`/linh-kien/${item.id}`}
                  className="mt-3 block w-full rounded-xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}