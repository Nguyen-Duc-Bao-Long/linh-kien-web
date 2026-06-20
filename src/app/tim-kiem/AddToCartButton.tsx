"use client";

import { supabase } from "@/lib/supabaseClient";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type AddToCartButtonProps = {
  item: {
    id: string;
    name: string;
    price: number | string | null;
  };
};

export default function AddToCartButton({ item }: AddToCartButtonProps) {
  async function handleAddToCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Bạn cần đăng nhập để sử dụng tính năng thêm vào giỏ hàng.");
      return;
    }

    const oldCart = localStorage.getItem("cart");
    const cart: CartItem[] = oldCart ? JSON.parse(oldCart) : [];

    const itemPrice = Number(item.price || 0);

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: itemPrice,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Đã thêm linh kiện vào giỏ hàng.");
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
    >
      Thêm vào giỏ hàng
    </button>
  );
}