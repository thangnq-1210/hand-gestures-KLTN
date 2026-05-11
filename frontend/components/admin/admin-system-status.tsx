"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

type TrainingJob = {
  id: number
  status: string
  include_trained?: boolean
  sample_ids?: number[]
  created_at?: string | null
  started_at?: string | null
  finished_at?: string | null
  error_message?: string | null
}

type ModelInfo = {
  source?: string | null
}

type Overview = {
  total_users: number
  users_added_7d: number
  active_users_24h: number
  predictions_24h: number
  error_rate_pct: number
  as_of: string
}

export default function AdminSystemStatus() {
  const { token } = useAuth()

  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const run = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [jobRes, modelRes, overviewRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/training-jobs?limit=20&offset=0`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/model-info`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!jobRes.ok) throw new Error(await jobRes.text())
        if (!modelRes.ok) throw new Error(await modelRes.text())
        if (!overviewRes.ok) throw new Error(await overviewRes.text())

        setJobs(await jobRes.json())
        setModelInfo(await modelRes.json())
        setOverview(await overviewRes.json())
      } catch (e: any) {
        console.error("load admin system status failed:", e)
        setError(e?.message || "Không tải được trạng thái hệ thống.")
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [token])

  const runningJobs = jobs.filter((j) => j.status === "running").length
  const queuedJobs = jobs.filter((j) => j.status === "queued").length
  const failedJobs = jobs.filter((j) => j.status === "failed").slice(0, 5)

  const systemStatus = [
    {
      name: "Admin API",
      status: "online",
      info: "Kết nối backend hoạt động",
    },
    {
      name: "Model hiện tại",
      status: modelInfo?.source ? "online" : "warning",
      info: modelInfo?.source || "Chưa xác định nguồn model",
    },
    {
      name: "Training jobs",
      status: runningJobs > 0 || queuedJobs > 0 ? "online" : "idle",
      info: `${runningJobs} đang chạy, ${queuedJobs} đang chờ`,
    },
    {
      name: "Người dùng hoạt động 24h",
      status: "online",
      info: overview ? `${overview.active_users_24h} người dùng` : "Chưa có dữ liệu",
    },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-primary mb-4">Trạng Thái Hệ Thống</h3>

        {isLoading ? (
          <Card className="border-2 border-border p-6">
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu hệ thống...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemStatus.map((service) => (
              <Card key={service.name} className="border-2 border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {service.status === "warning" ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}

                    <div>
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.info}</p>
                    </div>
                  </div>

                  <span
                    className={`text-sm px-3 py-1 rounded font-medium ${
                      service.status === "warning"
                        ? "bg-yellow-500/10 text-yellow-600"
                        : service.status === "idle"
                        ? "bg-slate-500/10 text-slate-600"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {service.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-primary mb-4">Chỉ số nhanh</h3>

        {isLoading ? (
          <Card className="border-2 border-border p-6">
            <p className="text-sm text-muted-foreground">Đang tải chỉ số...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-border p-4">
              <p className="text-sm text-muted-foreground">Tổng users</p>
              <p className="text-2xl font-bold text-primary">{overview?.total_users ?? 0}</p>
            </Card>

            <Card className="border border-border p-4">
              <p className="text-sm text-muted-foreground">Users mới 7 ngày</p>
              <p className="text-2xl font-bold text-primary">{overview?.users_added_7d ?? 0}</p>
            </Card>

            <Card className="border border-border p-4">
              <p className="text-sm text-muted-foreground">Predictions 24h</p>
              <p className="text-2xl font-bold text-primary">{overview?.predictions_24h ?? 0}</p>
            </Card>

            <Card className="border border-border p-4">
              <p className="text-sm text-muted-foreground">Error rate</p>
              <p className="text-2xl font-bold text-primary">
                {overview ? `${overview.error_rate_pct}%` : "0%"}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* <div>
        <h3 className="text-xl font-bold text-primary mb-4">Job lỗi gần đây</h3>

        <Card className="border-2 border-border p-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải job...</p>
          ) : failedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có job thất bại gần đây.</p>
          ) : (
            <div className="space-y-3">
              {failedJobs.map((job) => (
                <div key={job.id} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Training job #{job.id} thất bại</p>
                    <p className="text-sm text-muted-foreground">
                      {job.error_message || "Không có thông tin lỗi"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div> */}
    </div>
  )
}