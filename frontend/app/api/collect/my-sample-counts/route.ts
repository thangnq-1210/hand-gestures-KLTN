import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";

  const res = await fetch(`${API_BASE_URL}/collect/my-sample-counts`, {
    headers: { Authorization: auth },
  });

  const text = await res.text();
  return new NextResponse(text, { status: res.status });
}
