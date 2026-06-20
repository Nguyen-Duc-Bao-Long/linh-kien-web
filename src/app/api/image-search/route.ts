import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Thiếu OPENAI_API_KEY trong file .env.local." },
        { status: 500 }
      );
    }

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

Nhiệm vụ:
- Nhìn ảnh và đoán linh kiện trong ảnh.
- Trả về keyword để tìm kiếm trong cơ sở dữ liệu.
- Trả về category phù hợp với hệ thống.
- Chỉ trả về JSON, không giải thích thêm.

Các category hợp lệ:
Tất cả, Điện trở, Tụ điện, IC, Cảm biến, Module, Diode, Transistor, Relay

Quy tắc:
- Nếu thấy điện trở: keyword có thể là "điện trở" hoặc mã nếu đọc được.
- Nếu thấy tụ: keyword là "tụ điện", "tụ hóa", "tụ gốm" hoặc mã nếu đọc được.
- Nếu thấy LED/diode: keyword là "diode" hoặc "LED".
- Nếu thấy IC: keyword là mã IC đọc được, ví dụ NE555, LM358, L293D.
- Nếu thấy cảm biến: keyword là tên/mã cảm biến nếu đọc được, ví dụ DHT11, DHT22, HC-SR04.
- Nếu không chắc mã cụ thể, trả về loại linh kiện gần đúng.

Định dạng JSON:
{
  "keyword": "từ khóa tìm kiếm ngắn",
  "category": "một category hợp lệ",
  "confidence": số từ 0 đến 1,
  "description": "mô tả ngắn linh kiện trong ảnh"
}
`.trim();

    const response = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
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
              detail: "auto",
            },
          ],
        },
      ],
    });

    const rawText = response.output_text || "";
    const result = safeParseJson(rawText);

    return NextResponse.json({
      keyword: result.keyword || "",
      category: result.category || "Tất cả",
      confidence: Number(result.confidence || 0),
      description: result.description || "",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Không nhận diện được ảnh. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}