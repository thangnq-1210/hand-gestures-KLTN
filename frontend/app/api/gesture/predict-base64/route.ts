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

    // 🔑 Lấy header Authorization từ client
    const authHeader = request.headers.get("authorization")
    console.log("▶ [API route] Authorization nhận được:", authHeader)

    // Gọi backend FastAPI
    const backendRes = await fetch(
      `${BACKEND_URL}/gesture/predict-base64`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔑 FORWARD Authorization xuống backend
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        // ⚠️ GesturePredictRequest có field "image"
        body: JSON.stringify({ image }),
      },
    )

    const textBody = await backendRes.text()

    if (!backendRes.ok) {
      console.error("[frontend] backend error:", backendRes.status, textBody)
      // Trả đúng status backend (401 thì frontend cũng 401)
      return new NextResponse(textBody, {
        status: backendRes.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const parsed = JSON.parse(textBody) as {
      gesture: string
      confidence: number
      text?: string
      has_hand?: boolean
    }

    const gesture = parsed.gesture
    const confidence = parsed.confidence
    const text =
      parsed.text ?? GESTURE_TEXTS[gesture] ?? `Cử chỉ ${gesture}`

    return NextResponse.json({
      ...parsed,
      text,
    })
  } catch (err) {
    console.error("[frontend] route /api/gesture/predict-base64 error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
