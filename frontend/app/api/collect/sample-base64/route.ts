import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const body = await req.json();

  const res = await fetch(`${API_BASE_URL}/collect/sample-base64`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new NextResponse(text, { status: res.status });
}
