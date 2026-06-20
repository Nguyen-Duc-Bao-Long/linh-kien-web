import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type ImageSearchResult = {
  keyword: string;
  category: string;
  confidence: number;
  description: string;
};

function safeParseJson(text: string): ImageSearchResult {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fallback
      }
    }

    return {
      keyword: "linh kiện điện tử",
      category: "Tất cả",
      confidence: 0,
      description: "Không nhận diện được linh kiện từ ảnh.",
    };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Thiếu OPENAI_API_KEY trong file .env.local hoặc Vercel." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20000,
  maxRetries: 0,
});

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng chọn ảnh linh kiện." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ảnh không được vượt quá 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    const prompt = `
Bạn là hệ thống nhận diện linh kiện điện tử từ ảnh.

Chỉ trả về JSON hợp lệ, không giải thích thêm.

Các category hợp lệ:
Tất cả, Điện trở, Tụ điện, IC, Cảm biến, Module, Diode, Transistor, Relay

Quy tắc:
- Nếu thấy điện trở: keyword là "điện trở", category là "Điện trở".
- Nếu thấy tụ: keyword là "tụ điện", category là "Tụ điện".
- Nếu thấy LED hoặc diode: keyword là "diode" hoặc "LED", category là "Diode".
- Nếu thấy IC: keyword là mã IC nếu đọc được, ví dụ NE555, LM358, L293D; category là "IC".
- Nếu thấy cảm biến: keyword là tên/mã cảm biến nếu đọc được, ví dụ DHT11, DHT22, HC-SR04; category là "Cảm biến".
- Nếu không chắc mã cụ thể, trả về loại linh kiện gần đúng.

Định dạng JSON:
{
  "keyword": "từ khóa tìm kiếm ngắn",
  "category": "một category hợp lệ",
  "confidence": 0.8,
  "description": "mô tả ngắn linh kiện trong ảnh"
}
`.trim();

    const responsePromise = openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_output_tokens: 200,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "low",
            },
          ],
        },
      ],
    });

    const response = await withTimeout(responsePromise, 25000);

    const rawText = response.output_text || "";
    const result = safeParseJson(rawText);

    return NextResponse.json({
      keyword: result.keyword || "linh kiện điện tử",
      category: result.category || "Tất cả",
      confidence: Number(result.confidence || 0),
      description: result.description || "",
    });
  } catch (error) {
    console.error("IMAGE_SEARCH_ERROR:", error);

    if (error instanceof Error && error.message === "TIMEOUT") {
      return NextResponse.json(
        {
          error:
            "Nhận diện ảnh quá lâu. Vui lòng thử lại với ảnh nhỏ hơn hoặc kiểm tra API key.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Không nhận diện được ảnh. Kiểm tra API key, billing/quota hoặc thử lại ảnh khác.",
      },
      { status: 500 }
    );
  }
}