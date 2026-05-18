"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Profile = {
  full_name: string | null;
  email: string | null;
};

type OrderStatus = "pending" | "processing" | "done" | "cancelled";
type PaymentStatus = "unpaid" | "paid";
type PaymentMethod = "cash" | "bank_transfer";

type OrderItem = {
  id: number;
  component_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Order = {
  id: number;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  payment_method: PaymentMethod | null;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Đã nhận hàng",
  cancelled: "Đã hủy",
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  done: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
};

const bankInfo = {
  bankName: "Techcombank",
  accountNumber: "19029482185011",
  accountName: "NGUYEN DUC BAO LONG",
  qrImageUrl: "/qr-chuyen-khoan.png",
};

export default function PurchasePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [orders, setOrders] = useState<Order[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCart();
    loadOrders();
  }, []);

  function loadCart() {
    const savedCart = localStorage.getItem("cart");
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }

  function saveCart(newCart: CartItem[]) {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity < 1) return;

    const newCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );

    saveCart(newCart);
  }

  function removeItem(id: string) {
    const newCart = cart.filter((item) => item.id !== id);
    saveCart(newCart);
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function loadOrders() {
    setLoadingOrders(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, status, payment_status, payment_method, total_amount, created_at, order_items(id, component_name, quantity, unit_price, line_total)"
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setOrders((data || []) as Order[]);
    }

    setLoadingOrders(false);
  }

  async function handleCreateOrder() {
    setMessage("");
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      return;
    }

    setCreatingOrder(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCreatingOrder(false);
      setErrorMessage("Bạn cần đăng nhập trước khi đặt mua.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single<Profile>();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        customer_email: profile?.email || user.email,
        customer_name: profile?.full_name || "Khách hàng",
        total_amount: totalAmount,
        status: "pending",
        payment_status: "unpaid",
        payment_method: paymentMethod,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setCreatingOrder(false);
      setErrorMessage("Không tạo được đơn hàng.");
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      component_id: item.id,
      component_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    setCreatingOrder(false);

    if (itemsError) {
      setErrorMessage("Tạo đơn hàng thành công nhưng lỗi khi lưu chi tiết đơn.");
      return;
    }

    localStorage.removeItem("cart");
    setCart([]);
    setMessage(`Đặt mua thành công. Mã đơn hàng: #${order.id}`);

    await loadOrders();
  }

  async function handleCancelOrder(orderId: number) {
    const confirmCancel = window.confirm(
      `Bạn có chắc muốn hủy đơn hàng #${orderId} không?`
    );

    if (!confirmCancel) return;

    setMessage("");
    setErrorMessage("");
    setCancelingOrderId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("payment_status", "unpaid")
      .in("status", ["pending", "processing"]);

    setCancelingOrderId(null);

    if (error) {
      setErrorMessage(
        "Không hủy được đơn hàng. Đơn có thể đã thanh toán, đã hoàn thành hoặc đã bị hủy."
      );
      return;
    }

    setOrders((oldOrders) =>
      oldOrders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      )
    );

    setMessage(`Đã hủy đơn hàng #${orderId}.`);
  }

  async function handleConfirmReceived(orderId: number) {
    const confirmReceived = window.confirm(
      `Bạn xác nhận đã nhận được đơn hàng #${orderId}?`
    );

    if (!confirmReceived) return;

    setMessage("");
    setErrorMessage("");
    setConfirmingOrderId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: "done" })
      .eq("id", orderId)
      .eq("status", "processing")
      .eq("payment_status", "paid");

    setConfirmingOrderId(null);

    if (error) {
      setErrorMessage(
        "Không xác nhận được đơn hàng. Đơn hàng có thể chưa được nhân viên xác nhận thanh toán hoặc đã bị hủy."
      );
      return;
    }

    setOrders((oldOrders) =>
      oldOrders.map((order) =>
        order.id === orderId ? { ...order, status: "done" } : order
      )
    );

    setMessage(`Bạn đã xác nhận nhận được đơn hàng #${orderId}.`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">Mua hàng</h1>

            <p className="mt-2 text-slate-600">
              Quản lý giỏ hàng, đặt mua và theo dõi lịch sử giao dịch.
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
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-green-700 ring-1 ring-green-200">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-950">Giỏ hàng</h2>

          <p className="mt-2 text-slate-600">
            Kiểm tra linh kiện và chọn phương thức thanh toán trước khi đặt mua.
          </p>

          {cart.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center">
              <p className="font-semibold text-slate-700">
                Giỏ hàng đang trống.
              </p>

              <Link
                href="/tim-kiem"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Đi tìm linh kiện
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl bg-slate-100 p-4 md:grid-cols-[1fr_140px_160px_100px]"
                >
                  <div>
                    <h3 className="font-bold text-blue-700">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Đơn giá: {item.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.id, Number(event.target.value))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2"
                  />

                  <p className="font-semibold text-slate-900">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-xl border border-red-300 bg-white px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <div className="border-t border-slate-200 pt-6">
                <div className="mb-5 rounded-2xl bg-slate-100 p-5">
                  <p className="font-bold text-slate-950">
                    Phương thức thanh toán
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label
                      className={`cursor-pointer rounded-xl border px-4 py-4 ${
                        paymentMethod === "cash"
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={() => setPaymentMethod("cash")}
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Thanh toán tiền mặt
                      </span>

                      <p className="mt-1 text-sm text-slate-600">
                        Khách thanh toán trực tiếp khi nhận hàng hoặc tại cửa hàng.
                      </p>
                    </label>

                    <label
                      className={`cursor-pointer rounded-xl border px-4 py-4 ${
                        paymentMethod === "bank_transfer"
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Chuyển khoản
                      </span>

                      <p className="mt-1 text-sm text-slate-600">
                        Quét mã QR để chuyển khoản. Nhân viên sẽ kiểm tra giao dịch
                        và xác nhận thanh toán.
                      </p>

                      {paymentMethod === "bank_transfer" && (
                        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-blue-200">
                          <p className="font-bold text-slate-950">
                            Thông tin chuyển khoản
                          </p>

                          <div className="mt-3 grid gap-4 md:grid-cols-[180px_1fr]">
                            <img
                              src={bankInfo.qrImageUrl}
                              alt="QR chuyển khoản"
                              className="h-44 w-44 rounded-xl border border-slate-200 bg-white object-contain p-2"
                            />

                            <div className="space-y-2 text-sm text-slate-700">
                              <p>
                                <span className="font-semibold">Ngân hàng:</span>{" "}
                                {bankInfo.bankName}
                              </p>

                              <p>
                                <span className="font-semibold">Số tài khoản:</span>{" "}
                                {bankInfo.accountNumber}
                              </p>

                              <p>
                                <span className="font-semibold">Chủ tài khoản:</span>{" "}
                                {bankInfo.accountName}
                              </p>

                              <p>
                                <span className="font-semibold">Số tiền:</span>{" "}
                                {totalAmount.toLocaleString("vi-VN")}đ
                              </p>

                              <p className="rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-700">
                                Sau khi đặt hàng, nội dung chuyển khoản sẽ là mã đơn hàng.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-2xl font-bold text-slate-950">
                    Tổng tiền: {totalAmount.toLocaleString("vi-VN")}đ
                  </p>

                  <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {creatingOrder ? "Đang tạo đơn..." : "Đặt mua"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-950">
            Lịch sử giao dịch
          </h2>

          <p className="mt-2 text-slate-600">
            Theo dõi các đơn hàng đã đặt, hủy đơn hoặc xác nhận khi đã nhận hàng.
          </p>

          {loadingOrders ? (
            <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center">
              <p className="font-semibold text-slate-700">
                Đang tải lịch sử giao dịch...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center">
              <p className="font-semibold text-slate-700">
                Chưa có đơn hàng nào.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {orders.map((order) => {
                const paymentStatus: PaymentStatus =
                  order.payment_status === "paid" ? "paid" : "unpaid";

                const orderPaymentMethod: PaymentMethod =
                  order.payment_method === "bank_transfer"
                    ? "bank_transfer"
                    : "cash";

                const isCompleted =
                  order.status === "done" && paymentStatus === "paid";

                const displayStatus = isCompleted
                  ? "Hoàn thành"
                  : statusLabels[order.status];

                const displayStatusClass = isCompleted
                  ? "bg-green-50 text-green-700"
                  : statusStyles[order.status];

                const canCancel =
                  paymentStatus === "unpaid" &&
                  (order.status === "pending" ||
                    order.status === "processing");

                const canConfirmReceived =
                  paymentStatus === "paid" && order.status === "processing";

                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-700">
                          Đơn hàng #{order.id}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          Ngày đặt:{" "}
                          {new Date(order.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${displayStatusClass}`}
                        >
                          {displayStatus}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {paymentMethodLabels[orderPaymentMethod]}
                        </span>

                        {paymentStatus === "paid" && !isCompleted && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                            Đã thanh toán
                          </span>
                        )}

                        {paymentStatus === "unpaid" &&
                          order.status !== "cancelled" && (
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                              Chưa thanh toán
                            </span>
                          )}

                        {canConfirmReceived && (
                          <button
                            type="button"
                            onClick={() => handleConfirmReceived(order.id)}
                            disabled={confirmingOrderId === order.id}
                            className="rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {confirmingOrderId === order.id
                              ? "Đang xác nhận..."
                              : "Xác nhận đã nhận hàng"}
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingOrderId === order.id}
                            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cancelingOrderId === order.id
                              ? "Đang hủy..."
                              : "Hủy đơn"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="grid gap-2 rounded-xl bg-slate-100 p-3 md:grid-cols-[1fr_100px_140px]"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.component_name}
                          </p>

                          <p>Số lượng: {item.quantity}</p>

                          <p className="font-semibold">
                            {Number(item.line_total).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      ))}
                    </div>

                    {orderPaymentMethod === "bank_transfer" &&
                      paymentStatus === "unpaid" &&
                      order.status !== "cancelled" && (
                        <div className="mt-4 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
                          <p className="font-bold text-blue-700">
                            Quét QR để thanh toán đơn hàng #{order.id}
                          </p>

                          <div className="mt-3 grid gap-4 md:grid-cols-[180px_1fr]">
                            <img
                              src={bankInfo.qrImageUrl}
                              alt="QR chuyển khoản"
                              className="h-44 w-44 rounded-xl border border-slate-200 bg-white object-contain p-2"
                            />

                            <div className="space-y-2 text-sm text-slate-700">
                              <p>
                                <span className="font-semibold">Ngân hàng:</span>{" "}
                                {bankInfo.bankName}
                              </p>

                              <p>
                                <span className="font-semibold">Số tài khoản:</span>{" "}
                                {bankInfo.accountNumber}
                              </p>

                              <p>
                                <span className="font-semibold">Chủ tài khoản:</span>{" "}
                                {bankInfo.accountName}
                              </p>

                              <p>
                                <span className="font-semibold">Số tiền:</span>{" "}
                                {Number(order.total_amount).toLocaleString("vi-VN")}đ
                              </p>

                              <p className="rounded-xl bg-white px-3 py-2 font-semibold text-blue-700">
                                Nội dung chuyển khoản: DH{order.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <p className="mt-4 text-right text-lg font-bold text-slate-950">
                      Tổng tiền:{" "}
                      {Number(order.total_amount).toLocaleString("vi-VN")}đ
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}