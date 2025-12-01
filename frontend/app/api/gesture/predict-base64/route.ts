import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

const GESTURE_TEXTS: Record<string, string> = {
  "0": "Xin chào",
  "1": "Tôi cần giúp đỡ",
  "2": "Vâng",
  "3": "Không",
  "4": "Cảm ơn",
  "5": "Tôi đang đau",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: "Field 'image' is required" },
        { status: 400 },
      )
    }

    // gọi backend FastAPI
    const backendRes = await fetch(
      `${BACKEND_URL}/gesture/predict-base64`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: image }),
      },
    )

    const textBody = await backendRes.text()

    if (!backendRes.ok) {
      console.error(
        "[frontend] backend error:",
        backendRes.status,
        textBody,
      )
      return NextResponse.json(
        {
          error: "Backend error",
          status: backendRes.status,
          detail: textBody,
        },
        { status: 500 },
      )
    }

    const parsed = JSON.parse(textBody) as {
      gesture: string
      confidence: number
    }

    const gesture = parsed.gesture
    const confidence = parsed.confidence
    const text = GESTURE_TEXTS[gesture] ?? `Cử chỉ ${gesture}`

    return NextResponse.json({
      gesture,
      confidence,
      text,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[frontend] route /api/gesture/predict-base64 error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
