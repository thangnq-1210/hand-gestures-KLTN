"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { ZoomIn, X, Image as ImageIcon, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

type HistoryItem = {
  id: number
  gesture_label: string
  predicted_text?: string | null
  confidence: number
  has_hand: boolean
  created_at: string
  image_url?: string | null
}

interface RecognitionHistoryProps {
  limit?: number
  pageSize?: number
  showPagination?: boolean
}

export default function RecognitionHistory({
  limit,
  pageSize = 6,
  showPagination = true,
}: RecognitionHistoryProps) {
  const { user, token, isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!success) return

    const timer = setTimeout(() => setSuccess(null), 3000)
    return () => clearTimeout(timer)
  }, [success])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadHistory = async () => {
    if (!token || !isAuthenticated || !user) return

    try {
      setLoading(true)
      setError(null)

      const offset = typeof limit === "number" ? 0 : (currentPage - 1) * pageSize
      const requestLimit = typeof limit === "number" ? limit : pageSize

      const res = await fetch(
        `${API_BASE_URL}/gesture/predictions/me?limit=${requestLimit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      setHistory(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e: any) {
      console.error("loadHistory error:", e)
      setError(e?.message || "Không tải được lịch sử nhận diện.")
      setHistory([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [token, isAuthenticated, user, currentPage, pageSize, limit])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleClearHistory = async () => {
    if (!token || !isAuthenticated) return

    try {
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/gesture/predictions/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(await res.text())

      setCurrentPage(1)
      await loadHistory()
      setSuccess("Đã xóa lịch sử nhận diện thành công.")
    } catch (e: any) {
      console.error("clear history error:", e)
      setError(e?.message || "Không thể xóa lịch sử.")
    }
  }

  const handleDeleteOne = async (itemId: number) => {
    if (!token || !isAuthenticated) return

    try {
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/gesture/predictions/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(await res.text())

      setSuccess("Đã xóa lịch sử nhận diện thành công.")
      await loadHistory()
    } catch (e: any) {
      console.error("delete one history error:", e)
      setError(e?.message || "Không thể xóa mục lịch sử.")
    }
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("vi-VN")
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Đang tải lịch sử nhận diện...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="p-6 space-y-4">
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <p className="text-sm text-muted-foreground">Chưa có lịch sử nhận diện.</p>
      </Card>
    )
  }



  return (
    <>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            {/* <h3 className="text-xl font-bold text-primary">Lịch sử nhận diện</h3> */}
            <p className="text-sm text-muted-foreground mt-1">
              Tổng số lịch sử: {total}
            </p>
          </div>
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa lịch sử
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa toàn bộ lịch sử?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ xóa toàn bộ lịch sử nhận diện của bạn.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearHistory}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Xóa
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl p-4 bg-background hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-56 shrink-0">
                  <div className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                    {item.image_url ? (
                      <>
                        <img
                          src={`${API_BASE_URL}${item.image_url}`}
                          alt={`Prediction ${item.id}`}
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9"
                            onClick={() => setViewingImage(`${API_BASE_URL}${item.image_url}`)}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa ảnh này?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ảnh nhận diện này sẽ bị xóa và không thể khôi phục.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="flex justify-end gap-2">
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOne(item.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-6 h-6 mb-2" />
                        <span className="text-xs">Không có ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Cử chỉ {item.gesture_label}</Badge>
                      <Badge variant="outline">
                        {(item.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatTime(item.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Văn bản nhận diện</p>
                    <div className="rounded-lg border p-3 font-semibold text-primary bg-primary/5">
                      {item.predicted_text || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              className="text-sm hover:bg-teal-600"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>

            <div className="text-sm text-muted-foreground px-2">
              Trang {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              className="text-sm hover:bg-teal-600"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          <div className="w-full h-full flex items-center justify-center p-4">
            {viewingImage && (
              <div className="relative inline-block">
                <DialogClose asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -top-3 -right-3 z-20 rounded-full shadow-md"
                    onClick={() => setViewingImage(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>

                <img
                  src={viewingImage}
                  alt="Xem chi tiết ảnh nhận diện"
                  className="w-[32vw] max-w-none max-h-[72vh] object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}