"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "customer" | "staff" | "owner" | "admin";

type Order = {
  id: string | number;
  user_id?: string | null;
  total_amount?: number | string | null;
  total_price?: number | string | null;
  total?: number | string | null;
  total_money?: number | string | null;
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
};

type OrderItem = {
  id?: string | number;
  order_id?: string | number | null;
  component_id?: string | number | null;
  component_name?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
  unit_price?: number | string | null;
  subtotal?: number | string | null;
  total_price?: number | string | null;
};

type ComponentItem = {
  id: string | number;
  name?: string | null;
  category?: string | null;
  stock?: number | string | null;
  price?: number | string | null;
};

type TopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};

function toNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

function getPaymentMethodLabel(value?: string | null) {
  if (value === "cash") return "Tiền mặt";
  if (value === "bank_transfer") return "Chuyển khoản";
  return "Chưa xác định";
}

function getStatusLabel(value?: string | null) {
  if (value === "pending") return "Đang chờ";
  if (value === "processing") return "Đang xử lý";
  if (value === "done") return "Hoàn thành";
  if (value === "cancelled") return "Đã hủy";
  return "Không rõ";
}

function getOrderTotal(order: Order, orderItems: OrderItem[]) {
  const directTotal =
    toNumber(order.total_amount) ||
    toNumber(order.total_price) ||
    toNumber(order.total) ||
    toNumber(order.total_money);

  if (directTotal > 0) {
    return directTotal;
  }

  return orderItems
    .filter((item) => String(item.order_id) === String(order.id))
    .reduce((sum, item) => {
      const quantity = toNumber(item.quantity);
      const price = toNumber(item.price) || toNumber(item.unit_price);
      const subtotal = toNumber(item.subtotal) || toNumber(item.total_price);

      return sum + (subtotal > 0 ? subtotal : quantity * price);
    }, 0);
}

function getItemName(item: OrderItem) {
  return (
    item.component_name ||
    item.name ||
    String(item.component_id || "") ||
    "Linh kiện chưa xác định"
  );
}

export default function StatisticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setForbidden(true);
      setErrorMessage("Không kiểm tra được quyền truy cập.");
      setLoading(false);
      return;
    }

    const role = profile?.role as UserRole | undefined;

    if (role !== "owner") {
      setForbidden(true);
      setErrorMessage("Chỉ Chủ cửa hàng mới có thể xem thống kê mua bán.");
      setLoading(false);
      return;
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      setErrorMessage(`Không tải được dữ liệu đơn hàng: ${ordersError.message}`);
      setLoading(false);
      return;
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*");

    if (orderItemsError) {
      setErrorMessage(
        `Không tải được dữ liệu chi tiết đơn hàng: ${orderItemsError.message}`
      );
      setLoading(false);
      return;
    }

    const { data: componentsData, error: componentsError } = await supabase
      .from("components")
      .select("*");

    if (componentsError) {
      setErrorMessage(
        `Không tải được dữ liệu linh kiện: ${componentsError.message}`
      );
      setLoading(false);
      return;
    }

    setOrders((ordersData || []) as Order[]);
    setOrderItems((orderItemsData || []) as OrderItem[]);
    setComponents((componentsData || []) as ComponentItem[]);
    setLoading(false);
  }

  const statistics = useMemo(() => {
    const paidOrders = orders.filter(
      (order) => order.payment_status === "paid" || order.status === "done"
    );

    const unpaidOrders = orders.filter(
      (order) =>
        order.payment_status !== "paid" &&
        order.status !== "done" &&
        order.status !== "cancelled"
    );

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    );

    const revenue = paidOrders.reduce((sum, order) => {
      return sum + getOrderTotal(order, orderItems);
    }, 0);

    const soldQuantity = orderItems.reduce((sum, item) => {
      return sum + toNumber(item.quantity);
    }, 0);

    const lowStockCount = components.filter(
      (component) => toNumber(component.stock) < 10
    ).length;

    const cashRevenue = paidOrders
      .filter((order) => order.payment_method === "cash")
      .reduce((sum, order) => sum + getOrderTotal(order, orderItems), 0);

    const bankRevenue = paidOrders
      .filter((order) => order.payment_method === "bank_transfer")
      .reduce((sum, order) => sum + getOrderTotal(order, orderItems), 0);

    const productMap = new Map<string, TopProduct>();

    orderItems.forEach((item) => {
      const name = getItemName(item);
      const quantity = toNumber(item.quantity);
      const price = toNumber(item.price) || toNumber(item.unit_price);
      const subtotal = toNumber(item.subtotal) || toNumber(item.total_price);
      const itemRevenue = subtotal > 0 ? subtotal : quantity * price;

      const oldProduct = productMap.get(name);

      if (oldProduct) {
        oldProduct.quantity += quantity;
        oldProduct.revenue += itemRevenue;
      } else {
        productMap.set(name, {
          name,
          quantity,
          revenue: itemRevenue,
        });
      }
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      revenue,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
      cancelledOrders: cancelledOrders.length,
      soldQuantity,
      lowStockCount,
      cashRevenue,
      bankRevenue,
      topProducts,
    };
  }, [orders, orderItems, components]);

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">
          Đang tải thống kê mua bán...
        </p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-900">
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
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-950">
              Thống kê mua bán
            </h1>

            <p className="mt-2 text-slate-600">
              Tổng hợp doanh thu, đơn hàng và linh kiện bán chạy trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadStatistics}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tải lại
            </button>

            <Link
              href="/tim-kiem"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Về trang tìm kiếm
            </Link>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Tổng doanh thu
            </p>

            <p className="mt-3 text-3xl font-extrabold text-blue-700">
              {formatMoney(statistics.revenue)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Tính theo đơn đã thanh toán hoặc hoàn thành.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Tổng đơn hàng
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-950">
              {statistics.totalOrders}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Bao gồm tất cả trạng thái đơn hàng.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Sản phẩm đã bán
            </p>

            <p className="mt-3 text-3xl font-extrabold text-green-700">
              {statistics.soldQuantity}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Tổng số lượng linh kiện trong các đơn.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Sắp hết hàng
            </p>

            <p className="mt-3 text-3xl font-extrabold text-red-600">
              {statistics.lowStockCount}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Linh kiện có tồn kho dưới 10.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-950">
              Trạng thái đơn hàng
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-green-50 p-5 ring-1 ring-green-100">
                <p className="text-sm font-semibold text-green-700">
                  Đã thanh toán
                </p>

                <p className="mt-2 text-3xl font-extrabold text-green-700">
                  {statistics.paidOrders}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-100">
                <p className="text-sm font-semibold text-orange-700">
                  Chưa thanh toán
                </p>

                <p className="mt-2 text-3xl font-extrabold text-orange-700">
                  {statistics.unpaidOrders}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
                <p className="text-sm font-semibold text-red-700">Đã hủy</p>

                <p className="mt-2 text-3xl font-extrabold text-red-700">
                  {statistics.cancelledOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-950">
              Doanh thu theo thanh toán
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">Tiền mặt</p>
                  <p className="font-bold text-slate-950">
                    {formatMoney(statistics.cashRevenue)}
                  </p>
                </div>

                <div className="h-4 rounded-full bg-slate-100">
                  <div
                    className="h-4 rounded-full bg-blue-600"
                    style={{
                      width:
                        statistics.revenue > 0
                          ? `${Math.min(
                              (statistics.cashRevenue / statistics.revenue) *
                                100,
                              100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">Chuyển khoản</p>
                  <p className="font-bold text-slate-950">
                    {formatMoney(statistics.bankRevenue)}
                  </p>
                </div>

                <div className="h-4 rounded-full bg-slate-100">
                  <div
                    className="h-4 rounded-full bg-green-600"
                    style={{
                      width:
                        statistics.revenue > 0
                          ? `${Math.min(
                              (statistics.bankRevenue / statistics.revenue) *
                                100,
                              100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-950">
              Top linh kiện bán chạy
            </h2>

            {statistics.topProducts.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-center font-semibold text-slate-500">
                Chưa có dữ liệu bán hàng.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {statistics.topProducts.map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-blue-700">
                          {index + 1}. {product.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Đã bán: {product.quantity} sản phẩm
                        </p>
                      </div>

                      <p className="font-bold text-slate-950">
                        {formatMoney(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-950">
              Đơn hàng gần đây
            </h2>

            {orders.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-center font-semibold text-slate-500">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="px-4 py-3 text-sm font-bold text-slate-700">
                        Mã đơn
                      </th>

                      <th className="px-4 py-3 text-sm font-bold text-slate-700">
                        Tổng tiền
                      </th>

                      <th className="px-4 py-3 text-sm font-bold text-slate-700">
                        Thanh toán
                      </th>

                      <th className="px-4 py-3 text-sm font-bold text-slate-700">
                        Trạng thái
                      </th>

                      <th className="px-4 py-3 text-sm font-bold text-slate-700">
                        Thời gian
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 8).map((order) => (
                      <tr
                        key={String(order.id)}
                        className="border-b border-slate-200"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-blue-700">
                            #{String(order.id).slice(0, 8)}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-950">
                          {formatMoney(getOrderTotal(order, orderItems))}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {getPaymentMethodLabel(order.payment_method)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              order.payment_status === "paid" ||
                              order.status === "done"
                                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                : order.status === "cancelled"
                                ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                            }`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}