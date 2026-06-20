"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImageSearchResult = {
  keyword: string;
  category: string;
  confidence: number;
  description: string;
};

export default function ImageSearchBox() {
  const router = useRouter();

  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setResult(null);
    setErrorMessage("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ảnh không được vượt quá 5MB.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleImageSearch() {
    if (!selectedFile) {
      setErrorMessage("Vui lòng chọn ảnh linh kiện trước.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch("/api/image-search", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setErrorMessage(data.error || "Không nhận diện được ảnh.");
      return;
    }

    setResult(data);

    const keyword = encodeURIComponent(data.keyword || "");
    const category = encodeURIComponent(data.category || "Tất cả");

    router.push(`/tim-kiem?q=${keyword}&category=${category}`);
  }

  return (
    <section className="mt-8 rounded-3xl bg-white p-5 text-left shadow-2xl ring-1 ring-white/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">
            Tìm kiếm bằng hình ảnh
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Tải ảnh linh kiện lên, hệ thống sẽ nhận diện loại linh kiện hoặc mã
            linh kiện và tự tìm trong cơ sở dữ liệu.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
          AI nhận diện
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Ảnh linh kiện đã chọn"
              className="h-full max-h-56 w-full object-contain p-3"
            />
          ) : (
            <p className="px-4 text-center text-sm font-semibold text-slate-400">
              Chưa chọn ảnh
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div>
            <input
              id="image-search-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChooseFile}
              className="hidden"
            />

            <label
              htmlFor="image-search-input"
              className="inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Chọn ảnh linh kiện
            </label>

            <button
              type="button"
              onClick={handleImageSearch}
              disabled={loading}
              className="ml-3 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Đang nhận diện..." : "Tìm bằng ảnh"}
            </button>
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
              {errorMessage}
            </p>
          )}

          {result && (
            <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
              <p className="font-bold text-blue-700">
                Kết quả nhận diện: {result.keyword}
              </p>

              <p className="mt-1 text-sm text-slate-700">
                Loại linh kiện: {result.category}
              </p>

              <p className="mt-1 text-sm text-slate-700">
                Độ tin cậy: {Math.round(result.confidence * 100)}%
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {result.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}