import Link from "next/link";

const categories = [
  "Điện trở",
  "Tụ điện",
  "IC",
  "Cảm biến",
  "Module",
  "Diode",
  "Transistor",
  "Relay",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Hệ thống tra cứu linh kiện điện tử
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
            Tìm kiếm linh kiện nhanh, xem thông số rõ, quản lý kho dễ dàng.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Web hỗ trợ tìm kiếm linh kiện theo tên, mã hoặc từ khóa. Người dùng
            có thể xem giá, số lượng tồn kho, vị trí lưu trữ và thông tin kỹ
            thuật cơ bản.
          </p>

          <form action="/tim-kiem" className="mt-8 flex max-w-2xl gap-3">
            <input
              name="q"
              type="text"
              placeholder="Nhập tên hoặc mã linh kiện, ví dụ: ESP32, LM358, DHT11..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
              Tìm kiếm
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tim-kiem"
              className="rounded-xl border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
            >
              Xem tất cả linh kiện
            </Link>

            <Link
              href="/dang-nhap"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Đăng nhập / Đăng ký
            </Link>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-bold text-slate-950">
            Danh mục linh kiện
          </h2>

          <p className="mt-2 text-slate-600">
            Chọn nhanh nhóm linh kiện để xem danh sách phù hợp.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {categories.map((item) => (
              <Link
                key={item}
                href={`/tim-kiem?category=${encodeURIComponent(item)}`}
                className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md"
              >
                <h3 className="text-xl font-bold text-slate-950">{item}</h3>

                <p className="mt-3 leading-6 text-slate-700">
                  Xem các linh kiện thuộc nhóm {item.toLowerCase()}.
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}