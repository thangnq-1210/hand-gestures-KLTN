"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

type Job = {
  id: number
  status: string
  sample_ids: number[]
  include_trained: boolean
  created_at?: string | null
  started_at?: string | null
  finished_at?: string | null
  error_message?: string | null
}

function AuthedImage({ url, token, className }: { url: string; token: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    let objUrl: string | null = null
    setSrc(null);

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
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingSamples, setLoadingSamples] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(false)

  const [filterTrained, setFilterTrained] = useState<"all" | "trained" | "untrained">("all")
  const [filterLabel, setFilterLabel] = useState<string>("")
  const [filterUserId, setFilterUserId] = useState<string>("")

  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  )

  const [logOpen, setLogOpen] = useState(false)
  const [logText, setLogText] = useState("")
  const [logJobId, setLogJobId] = useState<number | null>(null)

  const fetchSamples = async () => {
    if (!token) return
    setLoadingSamples(true)
    try {
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
    } finally {
      setLoadingSamples(false)
    }
  }

  const fetchJobs = async () => {
    if (!token) return
    setLoadingJobs(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/training-jobs?limit=50&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const data: Job[] = await res.json()
      setJobs(data)
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    fetchSamples()
    fetchJobs()
  }, [token])

  const toggleSelect = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const createTrainJobSelected = async () => {
    if (!token || selectedIds.length === 0) return
    await fetch(`${API_BASE_URL}/admin/training-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sample_ids: selectedIds, include_trained: false }),
    })
    await fetchJobs()
    alert("Đã tạo job huấn luyện (selected).")
  }

  const createTrainJobAllUntrained = async () => {
    if (!token) return
    // sample_ids = [] => worker sẽ lấy all untrained (include_trained=false)
    await fetch(`${API_BASE_URL}/admin/training-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sample_ids: null, include_trained: false }),
    })
    await fetchJobs()
    alert("Đã tạo job huấn luyện (all untrained).")
  }

  const markSelectedUntrained = async () => {
    if (!token || selectedIds.length === 0) return
    await fetch(`${API_BASE_URL}/admin/samples/mark-untrained`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(selectedIds),
    })
    await fetchSamples()
    alert("Đã đặt về chưa huấn luyện.")
  }

  const reloadModel = async () => {
    if (!token) return
    const res = await fetch(`${API_BASE_URL}/admin/reload-model`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) alert(await res.text())
    else alert("Đã reload model.")
  }

  const openLog = async (jobId: number) => {
    if (!token) return
    setLogJobId(jobId)
    setLogText("Loading...")
    setLogOpen(true)

    const res = await fetch(`${API_BASE_URL}/admin/training-jobs/${jobId}/log?tail_lines=400`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setLogText(data.log ?? "")
  }

  const cancelJob = async (jobId: number) => {
    if (!token) return
    await fetch(`${API_BASE_URL}/admin/training-jobs/${jobId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    await fetchJobs()
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-secondary/10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Quản lý dữ liệu huấn luyện</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSamples} disabled={loadingSamples}>Tải samples</Button>
            <Button variant="outline" onClick={fetchJobs} disabled={loadingJobs}>Tải jobs</Button>
          </div>
        </div>

        <Tabs defaultValue="samples">
          <TabsList>
            <TabsTrigger value="samples">Dữ liệu huấn luyện</TabsTrigger>
            <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="samples" className="space-y-4">
            <Card className="p-4 border-2 border-primary/20 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 bg-background"
                  value={filterTrained}
                  onChange={(e) => setFilterTrained(e.target.value as any)}
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
                <input
                  className="border rounded px-2 py-1 bg-background"
                  placeholder="Filter user_id"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                />

                <Button onClick={fetchSamples} disabled={loadingSamples}>Áp dụng</Button>

                <div className="flex-1" />

                <Badge variant="secondary">Đã chọn: {selectedIds.length}</Badge>
                <Button className="bg-green-500 hover:bg-green-600" onClick={createTrainJobSelected} disabled={selectedIds.length === 0}>
                  Huấn luyện dữ liệu đã chọn
                </Button>
                <Button variant="default" onClick={createTrainJobAllUntrained}>
                  Huấn luyện toàn bộ dữ liệu
                </Button>
                <Button variant="default" className="bg-blue-500 hover:bg-blue-600" onClick={markSelectedUntrained} disabled={selectedIds.length === 0}>
                  Đánh dấu chưa huấn luyện (retrain)
                </Button>
                <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600" onClick={reloadModel}>
                  Reload model
                </Button>
              </div>
            </Card>

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
          </TabsContent>

          <TabsContent value="jobs" className="space-y-3">
            {jobs.map((j) => (
              <Card key={j.id} className="p-4 border-2 border-primary/10 flex flex-wrap gap-3 items-center justify-between">
                <div className="space-y-1">
                  <div className="font-semibold">Job #{j.id}</div>
                  <div className="text-sm text-muted-foreground">
                    status: <b>{j.status}</b> · samples: {j.sample_ids?.length ?? 0}
                  </div>
                  {j.error_message ? (
                    <div className="text-sm text-destructive">{j.error_message}</div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openLog(j.id)}>Log</Button>
                  {(j.status === "queued" || j.status === "running") ? (
                    <Button variant="destructive" onClick={() => cancelJob(j.id)}>Cancel</Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Job log {logJobId ? `#${logJobId}` : ""}</DialogTitle>
            </DialogHeader>
            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded max-h-[60vh] overflow-auto">
              {logText}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
