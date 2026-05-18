"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type OrderItem = {
  id: number;
  component_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type OrderStatus = "pending" | "processing" | "done" | "cancelled";
type StaffEditableStatus = "pending" | "processing" | "cancelled";
type PaymentStatus = "unpaid" | "paid";
type PaymentMethod = "cash" | "bank_transfer";

type Order = {
  id: number;
  customer_email: string | null;
  customer_name: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  payment_method: PaymentMethod | null;
  payment_confirmed_at: string | null;
  payment_confirmed_by: string | null;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  done: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: "Chưa xác nhận thanh toán",
  paid: "Đã xác nhận thanh toán",
};

const paymentStyles: Record<PaymentStatus, string> = {
  unpaid: "bg-orange-50 text-orange-700",
  paid: "bg-green-50 text-green-700",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setForbidden(false);
    setErrorMessage("");
    setMessage("");

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
      setErrorMessage("Chỉ Nhân viên hoặc Quản trị viên được xem đơn hàng.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_email, customer_name, status, payment_status, payment_method, payment_confirmed_at, payment_confirmed_by, total_amount, created_at, order_items(id, component_name, quantity, unit_price, line_total)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLoading(false);
  }

  async function updateStatus(orderId: number, status: StaffEditableStatus) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .neq("status", "done");

    if (error) {
      setErrorMessage("Không cập nhật được trạng thái đơn hàng.");
      return;
    }

    setOrders((oldOrders) =>
      oldOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    setMessage(`Đã cập nhật trạng thái đơn hàng #${orderId}.`);
  }

  async function handleConfirmPayment(
    orderId: number,
    currentStatus: OrderStatus
  ) {
    const confirmPayment = window.confirm(
      `Bạn xác nhận đơn hàng #${orderId} đã thanh toán?`
    );

    if (!confirmPayment) return;

    setMessage("");
    setErrorMessage("");
    setConfirmingPaymentId(orderId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextStatus: OrderStatus =
      currentStatus === "pending" ? "processing" : currentStatus;

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user?.id || null,
        status: nextStatus,
      })
      .eq("id", orderId)
      .neq("status", "done")
      .neq("status", "cancelled");

    setConfirmingPaymentId(null);

    if (error) {
      setErrorMessage("Không xác nhận được thanh toán.");
      return;
    }

    setOrders((oldOrders) =>
      oldOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              payment_status: "paid",
              payment_confirmed_at: new Date().toISOString(),
              payment_confirmed_by: user?.id || null,
              status: nextStatus,
            }
          : order
      )
    );

    setMessage(`Đã xác nhận thanh toán cho đơn hàng #${orderId}.`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <p className="text-center text-slate-600">Đang tải đơn hàng...</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">
            Không có quyền truy cập
          </h1>

          <p className="mt-3 text-slate-600">{errorMessage}</p>

          <Link
            href="/dang-nhap"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang đăng nhập
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
              Quản lý đơn hàng
            </h1>

            <p className="mt-2 text-slate-600">
              Nhân viên xác nhận thanh toán, xem phương thức thanh toán và xử lý
              đơn hàng.
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

        {orders.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold">Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => {
              const paymentStatus: PaymentStatus =
                order.payment_status === "paid" ? "paid" : "unpaid";

              const paymentMethod: PaymentMethod =
                order.payment_method === "bank_transfer"
                  ? "bank_transfer"
                  : "cash";

              const canConfirmPayment =
                paymentStatus === "unpaid" &&
                order.status !== "cancelled" &&
                order.status !== "done";

              const canStaffEditStatus = order.status !== "done";

              return (
                <article
                  key={order.id}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-blue-700">
                        Đơn hàng #{order.id}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        Khách hàng: {order.customer_name || "Chưa có tên"} -{" "}
                        {order.customer_email || "Chưa có email"}
                      </p>

                      <p className="mt-1 text-slate-600">
                        Ngày tạo:{" "}
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {paymentMethodLabels[paymentMethod]}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${paymentStyles[paymentStatus]}`}
                      >
                        {paymentLabels[paymentStatus]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 rounded-2xl bg-slate-100 p-4 md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Tổng tiền:{" "}
                        {Number(order.total_amount).toLocaleString("vi-VN")}đ
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Phương thức:{" "}
                        <span className="font-semibold text-slate-900">
                          {paymentMethodLabels[paymentMethod]}
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Xác nhận thanh toán:{" "}
                        {order.payment_confirmed_at
                          ? new Date(
                              order.payment_confirmed_at
                            ).toLocaleString("vi-VN")
                          : "Chưa xác nhận"}
                      </p>

                      {order.status === "done" && (
                        <p className="mt-1 text-sm font-semibold text-green-700">
                          Khách hàng đã xác nhận nhận hàng.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
                      {canConfirmPayment && (
                        <button
                          type="button"
                          onClick={() =>
                            handleConfirmPayment(order.id, order.status)
                          }
                          disabled={confirmingPaymentId === order.id}
                          className="rounded-xl border border-blue-700 bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-300 disabled:bg-blue-300 disabled:text-white"
                        >
                          {confirmingPaymentId === order.id
                            ? "Đang xác nhận..."
                            : paymentMethod === "bank_transfer"
                            ? "Xác nhận chuyển khoản"
                            : "Xác nhận đã thu tiền"}
                        </button>
                      )}

                      {canStaffEditStatus ? (
                        <select
                          value={
                            order.status === "done" ? "processing" : order.status
                          }
                          onChange={(event) =>
                            updateStatus(
                              order.id,
                              event.target.value as StaffEditableStatus
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      ) : (
                        <div className="rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-700">
                          Hoàn thành
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_100px_160px]"
                      >
                        <p className="font-semibold text-slate-900">
                          {item.component_name}
                        </p>

                        <p>Số lượng: {item.quantity}</p>

                        <p>
                          {Number(item.line_total).toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}