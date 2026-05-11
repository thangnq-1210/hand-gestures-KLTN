"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"


const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

type Sample = {
  id: number
  user_id: number
  label: string
  image_url: string
  trained: boolean
  trained_at?: string | null
  created_at?: string | null
}

function AuthedImage({ url, token, className }: { url: string; token: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    let objUrl: string | null = null
    setSrc(null)

      ; (async () => {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const blob = await res.blob()
        objUrl = URL.createObjectURL(blob)
        if (alive) setSrc(objUrl)
      })()

    return () => {
      alive = false
      if (objUrl) URL.revokeObjectURL(objUrl)
    }
  }, [url, token])

  if (!src) return <div className={className ?? "w-full h-full bg-muted animate-pulse"} />
  return <img src={src} alt="" className={className ?? "w-full h-full object-cover"} />
}

export default function AdminSampleManager() {
  const { token } = useAuth()

  const [samples, setSamples] = useState<Sample[]>([])
  const [loadingSamples, setLoadingSamples] = useState(false)

  const [filterTrained, setFilterTrained] = useState<"all" | "trained" | "untrained">("all")
  const [filterLabel, setFilterLabel] = useState<string>("")
  const [filterUserId, setFilterUserId] = useState<string>("")

  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  )

  const allVisibleSelected =
    samples.length > 0 && samples.every((s) => selected[s.id])

  const hasAnyVisibleSelected =
    samples.some((s) => selected[s.id])

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submittingAction, setSubmittingAction] = useState<string | null>(null)

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 3000)
    return () => clearTimeout(timer)
  }, [success])

  const fetchSamples = async (options?: { showSuccess?: boolean; successMessage?: string }) => {
    if (!token) return
    setLoadingSamples(true)

    try {
      setError(null)

      const params = new URLSearchParams()
      params.set("limit", "120")
      params.set("offset", "0")
      if (filterLabel.trim()) params.set("label", filterLabel.trim())
      if (filterUserId.trim()) params.set("user_id", filterUserId.trim())
      if (filterTrained === "trained") params.set("trained", "true")
      if (filterTrained === "untrained") params.set("trained", "false")

      const res = await fetch(`${API_BASE_URL}/admin/samples?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(await res.text())

      const data: Sample[] = await res.json()
      setSamples(data)
      setSelected({})

      if (options?.showSuccess) {
        setSuccess(options.successMessage ?? `Đã tải ${data.length} mẫu.`)
      }
    } catch (e: any) {
      console.error("fetchSamples failed:", e)
      setError(e?.message || "Không tải được danh sách mẫu.")
      setSamples([])
    } finally {
      setLoadingSamples(false)
    }
  }

  useEffect(() => {
    if (!token) return
    void fetchSamples()
  }, [token])

  const toggleSelect = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAllVisible = () => {
    const next: Record<number, boolean> = {}
    samples.forEach((s) => {
      next[s.id] = true
    })
    setSelected(next)
  }

  const clearAllVisible = () => {
    setSelected({})
  }

  const markSelectedUntrained = async () => {
    if (!token || selectedIds.length === 0) return

    try {
      setSubmittingAction("mark-untrained")
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/samples/mark-untrained`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedIds),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      await fetchSamples()
      setSuccess(`Đã đánh dấu ${data.updated ?? selectedIds.length} mẫu về trạng thái chưa huấn luyện.`)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể đánh dấu mẫu chưa huấn luyện.")
    } finally {
      setSubmittingAction(null)
    }
  }

  const downloadSelectedSamples = async () => {
    if (!token || selectedIds.length === 0) return

    try {
      setSubmittingAction("download-selected")
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/samples/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedIds),
      })

      if (!res.ok) throw new Error(await res.text())

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const disposition = res.headers.get("Content-Disposition")
      let filename = "selected_samples.zip"

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match?.[1]) filename = match[1]
      }

      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()

      window.URL.revokeObjectURL(url)

      setSuccess(`Đã tải xuống ${selectedIds.length} mẫu.`)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể tải xuống dữ liệu.")
    } finally {
      setSubmittingAction(null)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-secondary/10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-3">
          <div>
            <Link href="/privacy">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Quản lý dữ liệu huấn luyện</h1>

            <div className="flex gap-2">
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={downloadSelectedSamples}
                disabled={selectedIds.length === 0 || submittingAction !== null}
              >
                {submittingAction === "download-selected"
                  ? "Đang tải xuống..."
                  : "Tải xuống dữ liệu"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <Card className="p-4 border-2 border-primary/20 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border rounded px-2 py-1 bg-background"
                value={filterTrained}
                onChange={(e) => setFilterTrained(e.target.value as "all" | "trained" | "untrained")}
              >
                <option value="all">Tất cả</option>
                <option value="untrained">Chưa huấn luyện</option>
                <option value="trained">Đã huấn luyện</option>
              </select>

              <input
                className="border rounded px-2 py-1 bg-background"
                placeholder="Filter label (0..5)"
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
              />
              {/* 
              <input
                className="border rounded px-2 py-1 bg-background"
                placeholder="Filter user_id"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              /> */}

              <Button onClick={() => fetchSamples()} disabled={loadingSamples}>
                {loadingSamples ? "Đang tải..." : "Áp dụng"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">

              <Button
                variant="outline"
                onClick={selectAllVisible}
                disabled={samples.length === 0 || allVisibleSelected}
                className="min-w-[110px]"
              >
                Chọn tất cả
              </Button>

              <Button
                variant="outline"
                onClick={clearAllVisible}
                disabled={!hasAnyVisibleSelected}
                className="min-w-[120px]"
              >
                Bỏ chọn tất cả
              </Button>

              <Badge variant="secondary" className="min-w-[96px] justify-center">
                Đã chọn: {selectedIds.length}
              </Badge>
            </div>
          </div>
        </Card>


        {loadingSamples ? (
          <Card className="p-4 border-2 border-primary/10">
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu mẫu...</p>
          </Card>
        ) : samples.length === 0 ? (
          <Card className="p-4 border-2 border-primary/10">
            <p className="text-sm text-muted-foreground">Không có mẫu nào phù hợp.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {samples.map((s) => {
              const fullUrl = s.image_url ? `${API_BASE_URL}${s.image_url}` : ""
              const isSel = !!selected[s.id]

              return (
                <div key={s.id} className="relative border rounded overflow-hidden bg-muted">
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="absolute top-2 right-2 z-10">
                    {s.trained ? (
                      <Badge className="bg-green-600 text-white">Trained</Badge>
                    ) : (
                      <Badge variant="secondary">Untrained</Badge>
                    )}
                  </div>

                  <div className="aspect-video">
                    {token && s.image_url ? (
                      <AuthedImage url={fullUrl} token={token} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  <div className="p-2 text-xs bg-background">
                    <div>ID: {s.id} · user: {s.user_id}</div>
                    <div>label: {s.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}