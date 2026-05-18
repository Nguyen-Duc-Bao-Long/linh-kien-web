"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "admin" | "staff" | "customer";
type ResponseStatus = "no_message" | "waiting" | "replied";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
};

type ChatThread = {
  id: number;
  customer_id: string;
  customer_email: string | null;
  customer_name: string | null;
  status: "open" | "closed";
  response_status: ResponseStatus | null;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: number;
  thread_id: number;
  sender_id: string | null;
  sender_role: UserRole;
  message: string;
  image_url: string | null;
  image_name: string | null;
  created_at: string;
};

const roleLabels: Record<UserRole, string> = {
  admin: "QTV",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

const responseLabels: Record<ResponseStatus, string> = {
  no_message: "Chưa có tin nhắn",
  waiting: "Đang chờ phản hồi",
  replied: "Đã phản hồi",
};

const responseStyles: Record<ResponseStatus, string> = {
  no_message: "bg-slate-100 text-slate-600",
  waiting: "bg-orange-50 text-orange-700",
  replied: "bg-green-50 text-green-700",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isStaff = profile?.role === "admin" || profile?.role === "staff";

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedThread) return;

    loadMessages(selectedThread.id);

    const timer = setInterval(() => {
      loadMessages(selectedThread.id);
      if (isStaff) {
        loadThreads();
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [selectedThread, isStaff]);

  async function loadInitialData() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Bạn cần đăng nhập để dùng chức năng chat.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      setErrorMessage("Không tìm thấy thông tin tài khoản.");
      setLoading(false);
      return;
    }

    const currentProfile = profileData as Profile;
    setProfile(currentProfile);

    if (currentProfile.role === "admin" || currentProfile.role === "staff") {
      await loadThreads();
    } else {
      await loadOrCreateCustomerThread(currentProfile);
    }

    setLoading(false);
  }

  async function loadThreads() {
    const { data, error } = await supabase
      .from("chat_threads")
      .select(
        "id, customer_id, customer_email, customer_name, status, response_status, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage("Không tải được danh sách cuộc chat.");
      return;
    }

    const threadList = (data || []) as ChatThread[];
    setThreads(threadList);

    if (!selectedThread && threadList.length > 0) {
      setSelectedThread(threadList[0]);
    }

    if (selectedThread) {
      const updatedSelectedThread = threadList.find(
        (thread) => thread.id === selectedThread.id
      );

      if (updatedSelectedThread) {
        setSelectedThread(updatedSelectedThread);
      }
    }
  }

  async function loadOrCreateCustomerThread(currentProfile: Profile) {
    const { data: existingThreads } = await supabase
      .from("chat_threads")
      .select(
        "id, customer_id, customer_email, customer_name, status, response_status, created_at, updated_at"
      )
      .eq("customer_id", currentProfile.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingThreads && existingThreads.length > 0) {
      setSelectedThread(existingThreads[0] as ChatThread);
      return;
    }

    const { data: newThread, error } = await supabase
      .from("chat_threads")
      .insert({
        customer_id: currentProfile.id,
        customer_email: currentProfile.email,
        customer_name: currentProfile.full_name || "Khách hàng",
        status: "open",
        response_status: "no_message",
      })
      .select(
        "id, customer_id, customer_email, customer_name, status, response_status, created_at, updated_at"
      )
      .single();

    if (error || !newThread) {
      setErrorMessage("Không tạo được cuộc chat.");
      return;
    }

    setSelectedThread(newThread as ChatThread);
  }

  async function loadMessages(threadId: number) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        "id, thread_id, sender_id, sender_role, message, image_url, image_name, created_at"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage("Không tải được tin nhắn.");
      return;
    }

    setMessages((data || []) as ChatMessage[]);
  }

  function handleSelectImage(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage("");

    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
  }

  function removeSelectedImage() {
    setSelectedImage(null);
    setFileInputKey((oldKey) => oldKey + 1);
  }

  function validateImageBeforeSend(file: File) {
    if (!allowedImageTypes.includes(file.type)) {
      setErrorMessage("Ảnh không hợp lệ. Chỉ nhận JPG, PNG hoặc WEBP.");
      setSelectedImage(null);
      setFileInputKey((oldKey) => oldKey + 1);
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Ảnh quá lớn. Dung lượng tối đa là 5MB.");
      setSelectedImage(null);
      setFileInputKey((oldKey) => oldKey + 1);
      return false;
    }

    return true;
  }

  async function uploadChatImage(file: File, threadId: number) {
    if (!profile) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const filePath = `thread-${threadId}/${profile.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file);

    if (error) {
      throw new Error("Không upload được ảnh.");
    }

    const { data } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    return {
      imageUrl: data.publicUrl,
      imageName: file.name,
    };
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile || !selectedThread) return;

    const content = messageText.trim();

    if (!content && !selectedImage) {
      setErrorMessage("Vui lòng nhập tin nhắn hoặc chọn ảnh linh kiện.");
      return;
    }

    if (selectedImage && !validateImageBeforeSend(selectedImage)) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      let imageUrl: string | null = null;
      let imageName: string | null = null;

      if (selectedImage) {
        const uploadedImage = await uploadChatImage(
          selectedImage,
          selectedThread.id
        );

        imageUrl = uploadedImage?.imageUrl || null;
        imageName = uploadedImage?.imageName || null;
      }

      const nextResponseStatus: ResponseStatus = isStaff
        ? "replied"
        : "waiting";

      const { error } = await supabase.from("chat_messages").insert({
        thread_id: selectedThread.id,
        sender_id: profile.id,
        sender_role: profile.role,
        message: content || "Đã gửi ảnh linh kiện.",
        image_url: imageUrl,
        image_name: imageName,
      });

      if (error) {
        setErrorMessage("Không gửi được tin nhắn.");
        setSending(false);
        return;
      }

      await supabase
        .from("chat_threads")
        .update({
          updated_at: new Date().toISOString(),
          status: "open",
          response_status: nextResponseStatus,
        })
        .eq("id", selectedThread.id);

      setSelectedThread({
        ...selectedThread,
        response_status: nextResponseStatus,
        updated_at: new Date().toISOString(),
      });

      setMessageText("");
      setSelectedImage(null);
      setFileInputKey((oldKey) => oldKey + 1);
      setSending(false);

      await loadMessages(selectedThread.id);

      if (isStaff) {
        await loadThreads();
      }
    } catch {
      setErrorMessage("Không gửi được ảnh. Hãy thử lại.");
      setSending(false);
    }
  }

  async function handleSelectThread(thread: ChatThread) {
    setSelectedThread(thread);
    setSelectedImage(null);
    setFileInputKey((oldKey) => oldKey + 1);
    await loadMessages(thread.id);
  }

  function getThreadResponseStatus(thread: ChatThread): ResponseStatus {
    if (thread.response_status === "replied") return "replied";
    if (thread.response_status === "waiting") return "waiting";
    return "no_message";
  }

  function getCurrentResponseStatus(): ResponseStatus {
    if (messages.length === 0) return "no_message";
    if (selectedThread?.response_status === "replied") return "replied";
    if (selectedThread?.response_status === "waiting") return "waiting";
    return "no_message";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <p className="text-center text-slate-600">Đang tải chat...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-red-600">Chưa đăng nhập</h1>

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

  const currentResponseStatus = getCurrentResponseStatus();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-950">
              Chat hỗ trợ khách hàng
            </h1>

            <p className="mt-2 text-slate-600">
              {isStaff
                ? "Nhân viên xem và phản hồi tin nhắn từ khách hàng."
                : "Khách hàng có thể nhắn tin và gửi ảnh linh kiện để được hỗ trợ."}
            </p>
          </div>

          <Link
            href="/tim-kiem"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Về trang tìm kiếm
          </Link>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <div
          className={
            isStaff
              ? "mt-8 grid gap-6 lg:grid-cols-[340px_1fr]"
              : "mt-8 grid gap-6"
          }
        >
          {isStaff && (
            <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">
                  Cuộc chat
                </h2>

                <button
                  type="button"
                  onClick={loadThreads}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Tải lại
                </button>
              </div>

              {threads.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center">
                  <p className="font-semibold text-slate-600">
                    Chưa có khách hàng nào nhắn.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {threads.map((thread) => {
                    const threadResponseStatus =
                      getThreadResponseStatus(thread);

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => handleSelectThread(thread)}
                        className={`w-full rounded-2xl border p-4 text-left hover:bg-blue-50 ${
                          selectedThread?.id === thread.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <p className="font-bold text-slate-950">
                          {thread.customer_name || "Khách hàng"}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {thread.customer_email || "Chưa có email"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${responseStyles[threadResponseStatus]}`}
                          >
                            {responseLabels[threadResponseStatus]}
                          </span>

                          <span className="text-xs text-slate-500">
                            {new Date(thread.updated_at).toLocaleString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>
          )}

          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            {selectedThread ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      {isStaff
                        ? selectedThread.customer_name || "Khách hàng"
                        : "Tin nhắn với nhân viên"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {isStaff
                        ? selectedThread.customer_email || "Chưa có email"
                        : `Vai trò của bạn: ${roleLabels[profile.role]}`}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${responseStyles[currentResponseStatus]}`}
                  >
                    {responseLabels[currentResponseStatus]}
                  </span>
                </div>

                <div className="h-[520px] overflow-y-auto bg-slate-50 p-5">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="font-semibold text-slate-500">
                        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((item) => {
                        const isMine = item.sender_id === profile.id;

                        return (
                          <div
                            key={item.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                isMine
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-slate-900 ring-1 ring-slate-200"
                              }`}
                            >
                              <p className="text-xs font-semibold opacity-80">
                                {isMine
                                  ? "Bạn"
                                  : roleLabels[item.sender_role]}
                              </p>

                              {item.image_url && (
                                <a
                                  href={item.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 block"
                                >
                                  <img
                                    src={item.image_url}
                                    alt={item.image_name || "Ảnh linh kiện"}
                                    className="max-h-72 rounded-xl object-contain"
                                  />
                                </a>
                              )}

                              <p className="mt-2 whitespace-pre-wrap leading-6">
                                {item.message}
                              </p>

                              <p className="mt-2 text-xs opacity-70">
                                {new Date(item.created_at).toLocaleString(
                                  "vi-VN"
                                )}
                                {isMine ? " · Đã gửi" : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 p-5"
                >
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="min-w-[260px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <label
                      htmlFor="chat-image-input"
                      className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Chọn ảnh
                    </label>

                    <input
  key={fileInputKey}
  id="chat-image-input"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleSelectImage}
  style={{
    display: "none",
    visibility: "hidden",
    width: 0,
    height: 0,
    opacity: 0,
    position: "absolute",
    pointerEvents: "none",
  }}
/>

                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {sending ? "Đang gửi..." : "Gửi"}
                    </button>
                  </div>

                  {selectedImage && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Đã chọn ảnh: {selectedImage.name}
                      </p>

                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Bỏ ảnh
                      </button>
                    </div>
                  )}

                  <p className="mt-3 text-sm text-slate-500">
                    Có thể gửi ảnh linh kiện để nhân viên nhận diện. Hệ thống sẽ
                    kiểm tra định dạng JPG, PNG, WEBP và dung lượng tối đa 5MB
                    khi bấm Gửi.
                  </p>
                </form>
              </>
            ) : (
              <div className="flex h-[640px] items-center justify-center p-8 text-center">
                <p className="font-semibold text-slate-500">
                  Hãy chọn một cuộc chat để xem tin nhắn.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}