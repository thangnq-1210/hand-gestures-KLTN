import { NextResponse } from "next/server"

/**
 * Get available gesture classes
 * Returns: { classes: Array<{ id, name, text }> }
 */
export async function GET() {
  const gestureClasses = [
    { id: 0, name: "Cử chỉ 0", text: "Xin chào" },
    { id: 1, name: "Cử chỉ 1", text: "Tôi cần giúp đỡ" },
    { id: 2, name: "Cử chỉ 2", text: "Vâng" },
    { id: 3, name: "Cử chỉ 3", text: "Không" },
    { id: 4, name: "Cử chỉ 4", text: "Cảm ơn" },
    { id: 5, name: "Cử chỉ 5", text: "Tôi đang đau" },
  ]

  return NextResponse.json({
    classes: gestureClasses,
    total: gestureClasses.length,
  })
}
