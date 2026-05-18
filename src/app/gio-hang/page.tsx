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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCart();
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

  async function handleCreateOrder() {
    setMessage("");
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
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
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setLoading(false);
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

    setLoading(false);

    if (itemsError) {
      setErrorMessage("Tạo đơn hàng thành công nhưng lỗi khi lưu chi tiết đơn.");
      return;
    }

    localStorage.removeItem("cart");
    setCart([]);
    setMessage(`Đặt mua thành công. Mã đơn hàng: #${order.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">Giỏ hàng</h1>
            <p className="mt-2 text-slate-600">
              Kiểm tra linh kiện trước khi đặt mua.
            </p>
          </div>

          <Link
            href="/tim-kiem"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tiếp tục mua
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

        {cart.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-900">
              Giỏ hàng đang trống.
            </p>

            <Link
              href="/tim-kiem"
              className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Đi tìm linh kiện
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl bg-slate-100 p-4 md:grid-cols-[1fr_140px_160px_100px]"
                >
                  <div>
                    <h2 className="font-bold text-blue-700">{item.name}</h2>
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
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <p className="text-2xl font-bold text-slate-950">
                Tổng tiền: {totalAmount.toLocaleString("vi-VN")}đ
              </p>

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Đang tạo đơn..." : "Đặt mua"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}