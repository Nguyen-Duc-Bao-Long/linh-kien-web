import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AddToCartButton from "@/app/tim-kiem/AddToCartButton";

type ComponentItem = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  stock: number | null;
  location: string | null;
  description: string | null;
  usage_guide: string | null;
  datasheet_url: string | null;
  image_url: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatPrice(price: number) {
  return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

function getRecommendCategories(item: ComponentItem) {
  const category = (item.category || "").toLowerCase();
  const name = (item.name || "").toLowerCase();

  if (
    category.includes("điện trở") ||
    name.includes("điện trở") ||
    name.includes("res")
  ) {
    return ["Điện trở"];
  }

  if (
    category.includes("tụ") ||
    name.includes("tụ") ||
    name.includes("capacitor")
  ) {
    return ["Tụ điện"];
  }

  if (
    category.includes("cảm biến") ||
    name.includes("cảm biến") ||
    name.includes("sensor") ||
    name.includes("dht")
  ) {
    return ["Cảm biến", "Module", "IC"];
  }

  if (category.includes("ic") || name.includes("ic")) {
    return ["IC"];
  }

  if (category.includes("diode") || name.includes("diode")) {
    return ["Diode"];
  }

  if (category.includes("transistor") || name.includes("transistor")) {
    return ["Transistor"];
  }

  if (category.includes("module") || name.includes("module")) {
    return ["Module", "Cảm biến"];
  }

  return item.category ? [item.category] : [];
}

export default async function ComponentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("components")
    .select(
      "id, name, code, category, price, stock, location, description, usage_guide, datasheet_url, image_url"
    )
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  const component = item as ComponentItem;

  const recommendCategories = getRecommendCategories(component);

  let recommendedComponents: ComponentItem[] = [];

  if (recommendCategories.length > 0) {
    const { data: recommendedData } = await supabase
      .from("components")
      .select(
        "id, name, code, category, price, stock, location, description, usage_guide, datasheet_url, image_url"
      )
      .neq("id", component.id)
      .in("category", recommendCategories)
      .limit(6);

    recommendedComponents = (recommendedData || []) as ComponentItem[];
  }

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/tim-kiem"
          className="mb-6 inline-flex rounded-xl border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          ← Quay lại tìm kiếm
        </Link>

        <section className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          {component.image_url && (
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <img
                src={component.image_url}
                alt={component.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                  Chi tiết linh kiện
                </p>

                <h1 className="text-4xl font-extrabold text-slate-950">
                  {component.name}
                </h1>

                <p className="mt-2 font-semibold text-slate-500">
                  Mã linh kiện: {component.code || "Chưa cập nhật"}
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-4 py-2 font-bold text-blue-700">
                {component.category || "Khác"}
              </span>
            </div>

            <p className="mb-7 text-lg leading-8 text-slate-700">
              {component.description || "Chưa có mô tả cho linh kiện này."}
            </p>

            <div className="mb-7 rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-100">
              <h2 className="mb-3 text-xl font-extrabold text-blue-700">
                Hướng dẫn sử dụng / nhận biết linh kiện
              </h2>

              <p className="whitespace-pre-line leading-8 text-slate-700">
                {component.usage_guide ||
                  "Chưa có hướng dẫn chi tiết cho linh kiện này. Nội dung sẽ được cập nhật sau."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Giá bán</p>

                <p className="mt-1 text-2xl font-extrabold text-slate-950">
                  {formatPrice(component.price)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Tồn kho</p>

                <p
                  className={`mt-1 text-2xl font-extrabold ${
                    Number(component.stock || 0) < 10
                      ? "text-red-600"
                      : "text-slate-950"
                  }`}
                >
                  {component.stock ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Vị trí lưu kho
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-950">
                  {component.location || "Chưa cập nhật"}
                </p>
              </div>
            </div>

          <div className="mt-8 grid items-center gap-5 md:grid-cols-2">
           <div className="[&_button]:!m-0 [&_button]:!h-[64px] [&_button]:!w-full [&_button]:!rounded-xl [&_button]:!text-base [&_button]:!font-bold">
            <AddToCartButton
             item={{
              id: component.id,
              name: component.name,
              price: Number(component.price || 0),
            }}
            />
          </div>

          {component.datasheet_url ? (
            <a
            href={component.datasheet_url}
            target="_blank"
            rel="noreferrer"
            className="flex h-[64px] w-full items-center justify-center rounded-xl border border-blue-600 bg-white text-base font-bold text-blue-600 transition hover:bg-blue-50"
          >
            Xem datasheet
         </a>
      ) : (
          <div className="flex h-[64px] w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-base font-bold text-slate-500">
            Chưa có datasheet
          </div>
        )}
        </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">
                Linh kiện đề xuất
              </h2>

              <p className="mt-1 text-slate-600">
                Gợi ý một số linh kiện cùng loại hoặc có chức năng liên quan.
              </p>
            </div>
          </div>

          {recommendedComponents.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center font-semibold text-slate-600">
              Chưa có linh kiện đề xuất phù hợp.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommendedComponents.map((recommended) => (
                <article
                  key={recommended.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-blue-700">
                        {recommended.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Mã: {recommended.code || "Chưa có mã"}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {recommended.category || "Khác"}
                    </span>
                  </div>

                  <p className="line-clamp-2 min-h-12 text-slate-600">
                    {recommended.description ||
                      "Chưa có mô tả cho linh kiện này."}
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Giá bán</p>

                    <p className="font-extrabold text-slate-950">
                      {formatPrice(recommended.price)}
                    </p>
                  </div>

                  <Link
                    href={`/linh-kien/${recommended.id}`}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
                  >
                    Xem linh kiện này
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}