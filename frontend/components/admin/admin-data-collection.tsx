"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Download, Trash2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"
interface DataStats {
  userId: string
  userName: string
  samplesCount: number
  trainedCount: number
  untrainedCount: number
  lastCollected: Date | null
}
type AdminSample = {
  id: number
  user_id: number
  label: string
  filename: string
  image_url?: string | null
  trained: boolean
  trained_at?: string | null
  created_at?: string | null
}

export default function AdminDataCollection() {
  const { token } = useAuth()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [samples, setSamples] = useState<AdminSample[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [labelFilter, setLabelFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [trainedFilter, setTrainedFilter] = useState("all")



  useEffect(() => {
    if (!token) return

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_BASE_URL}/admin/samples?limit=1000&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error(await res.text())

        const data: AdminSample[] = await res.json()
        setSamples(data)
      } catch (e: any) {
        console.error("load admin samples failed:", e)
        setError(e?.message || "Không tải được dữ liệu thu thập.")
        setSamples([])
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [token])

  const filteredSamples = samples.filter((sample) => {
    const matchLabel = labelFilter === "all" ? true : sample.label === labelFilter
    const matchUser = userFilter === "all" ? true : String(sample.user_id) === userFilter

    let matchTrained = true
    if (trainedFilter === "trained") matchTrained = sample.trained === true
    if (trainedFilter === "untrained") matchTrained = sample.trained === false

    return matchLabel && matchUser && matchTrained
  })

  const stats: DataStats[] = Object.values(
    filteredSamples.reduce((acc, sample) => {
      const key = String(sample.user_id)
      const createdAt = sample.created_at ? new Date(sample.created_at) : null

      if (!acc[key]) {
        acc[key] = {
          userId: key,
          userName: `User ${sample.user_id}`,
          samplesCount: 0,
          trainedCount: 0,
          untrainedCount: 0,
          lastCollected: createdAt,
        }
      }

      acc[key].samplesCount += 1
      if (sample.trained) {
        acc[key].trainedCount += 1
      } else {
        acc[key].untrainedCount += 1
      }

      if (
        createdAt &&
        (!acc[key].lastCollected || createdAt.getTime() > acc[key].lastCollected!.getTime())
      ) {
        acc[key].lastCollected = createdAt
      }

      return acc
    }, {} as Record<string, DataStats>)
  )

  const uniqueLabels = Array.from(new Set(samples.map((s) => s.label))).sort()
  const uniqueUsers = Array.from(new Set(samples.map((s) => String(s.user_id)))).sort()

  return (
    <Card className="border-2 border-primary/20 p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-primary">Quản Lý Thu Thập Dữ Liệu</h2>

        <Link href="/admin/samples">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white">Xem trang mẫu chi tiết</Button>
        </Link>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-border p-4">
            <p className="text-sm text-muted-foreground">Tổng Mẫu</p>
            <p className="text-3xl font-bold text-primary">{stats.reduce((sum, s) => sum + s.samplesCount, 0)}</p>
          </Card>
          <Card className="border border-border p-4">
            <p className="text-sm text-muted-foreground">Tổng Người Dùng</p>
            <p className="text-3xl font-bold text-primary">{stats.length}</p>
          </Card>
          <Card className="border border-border p-4">
            <p className="text-sm text-muted-foreground">Thu Thập Gần Nhất</p>
            <p className="text-lg font-semibold text-primary">
              {stats.length > 0 && stats.some((s) => s.lastCollected)
                ? new Date(
                  Math.max(
                    ...stats
                      .filter((s) => s.lastCollected)
                      .map((s) => s.lastCollected!.getTime())
                  )
                ).toLocaleDateString("vi-VN")
                : "N/A"}
            </p>
          </Card>
        </div>
        <Card className="border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Lọc theo cử chỉ</p>
              <select
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                {uniqueLabels.map((label) => (
                  <option key={label} value={label}>
                    Cử chỉ {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Lọc theo user</p>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                {uniqueUsers.map((userId) => (
                  <option key={userId} value={userId}>
                    User {userId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Trạng thái train</p>
              <select
                value={trainedFilter}
                onChange={(e) => setTrainedFilter(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="trained">Đã train</option>
                <option value="untrained">Chưa train</option>
              </select>
            </div>
          </div>
        </Card>

        {/* User Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Người Dùng</TableHead>
                <TableHead>Tổng Mẫu</TableHead>
                <TableHead>Đã Train</TableHead>
                <TableHead>Chưa Train</TableHead>
                <TableHead>Thu Thập Gần Nhất</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.userId}>
                  <TableCell className="font-medium">{stat.userName}</TableCell>

                  <TableCell>
                    <span className="text-lg font-bold text-primary">{stat.samplesCount}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">{stat.trainedCount}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{stat.untrainedCount}</Badge>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {stat.lastCollected ? stat.lastCollected.toLocaleDateString("vi-VN") : "N/A"}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <Download className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive bg-transparent" disabled>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}
