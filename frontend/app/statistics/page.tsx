"use client"

import { useAuth } from "@/lib/auth-context"
import ProtectedPage from "@/components/auth/protected-page"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Calendar, Clock, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface GestureStats {
  gesture: string
  count: number
}

interface TimeStats {
  time: string
  predictions: number
}

export default function StatisticsPage() {
  const { user, isAuthenticated, token } = useAuth()
  const [gestureStats, setGestureStats] = useState<GestureStats[]>([])
  const pieData = gestureStats.map((g) => ({
    name: g.gesture,
    value: g.count,
  }))
  const [timeStats, setTimeStats] = useState<TimeStats[]>([])
  const [totalPredictions, setTotalPredictions] = useState(0)
  const [mostUsedGesture, setMostUsedGesture] = useState("")
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"
  type StatsSummary = {
    gesture_stats: { gesture: string; count: number }[]
    time_stats: { time: string; predictions: number }[]
    total_predictions: number
    most_used_gesture: string
    days: number
  }

  useEffect(() => {
    // if (!isAuthenticated) {
    //   router.push("/login")
    //   return
    // }
    // if (!token) return

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats/summary?days=7`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()

        setGestureStats(data.gesture_stats ?? [])
        setTimeStats(data.time_stats ?? [])
        setTotalPredictions(data.total_predictions ?? 0)
        setMostUsedGesture(data.most_used_gesture ?? "")
      } catch (e) {
        console.error("stats fetch failed:", e)
        setGestureStats([])
        setTimeStats([])
        setTotalPredictions(0)
        setMostUsedGesture("")
      }
    }

    run()
  }, [isAuthenticated, token])


  const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <ProtectedPage allowRoles={["user", "caregiver", "admin"]}>
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Thống Kê Sử Dụng</h1>
          <p className="text-muted-foreground">Xem thống kê và biểu đồ sử dụng của bạn</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-primary/20 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tổng Lần Dự Đoán</p>
                <p className="text-4xl font-bold text-primary">{totalPredictions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/50" />
            </div>
          </Card>

          <Card className="border-2 border-secondary/20 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Cử Chỉ Sử Dụng Nhiều Nhất</p>
                <p className="text-2xl font-bold text-secondary truncate">{mostUsedGesture}</p>
              </div>
              <Zap className="w-8 h-8 text-secondary/50" />
            </div>
          </Card>

          <Card className="border-2 border-accent/20 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Trung Bình/Ngày</p>
                <p className="text-4xl font-bold text-accent">{(totalPredictions / 7).toFixed(0)}</p>
              </div>
              <Calendar className="w-8 h-8 text-accent/50" />
            </div>
          </Card>

          <Card className="border-2 border-green-500/20 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Thời Gian Hoạt Động</p>
                <p className="text-2xl font-bold text-green-600">3 giờ</p>
              </div>
              <Clock className="w-8 h-8 text-green-500/50" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="gestures" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gestures">Cử Chỉ Phổ Biến</TabsTrigger>
            <TabsTrigger value="timeline">Thời Gian</TabsTrigger>
            <TabsTrigger value="details">Chi Tiết</TabsTrigger>
          </TabsList>

          {/* Gestures Tab */}
          <TabsContent value="gestures" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card className="border-2 border-primary/20 p-6">
                <h2 className="text-xl font-bold text-primary mb-4">Biểu Đồ Cột</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gestureStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="gesture" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Pie Chart */}
              <Card className="border-2 border-primary/20 p-6">
                <h2 className="text-xl font-bold text-primary mb-4">Biểu Đồ Hình Tròn</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // entry ở đây là 1 điểm data đã map: { name, value }
                      label={(entry: any) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>

                </ResponsiveContainer>
              </Card>
            </div>

            {/* Gesture List */}
            <Card className="border-2 border-primary/20 p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Danh Sách Chi Tiết</h2>
              <div className="space-y-3">
                {gestureStats.map((stat, index) => (
                  <div
                    key={stat.gesture}
                    className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg border border-secondary/20"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{stat.gesture}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{stat.count}</p>
                      <p className="text-xs text-muted-foreground">
                        {((stat.count / totalPredictions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Hoạt Động Theo Giờ</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predictions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Lần Dự Đoán"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="border-2 border-primary/20 p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Phân Tích Thời Gian</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg">
                  <span className="text-foreground">Giờ cao điểm</span>
                  <span className="text-xl font-bold text-primary">15:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg">
                  <span className="text-foreground">Thời gian sử dụng nhiều nhất</span>
                  <span className="text-xl font-bold text-primary">Chiều (12:00-18:00)</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg">
                  <span className="text-foreground">Hoạt động trung bình/giờ</span>
                  <span className="text-xl font-bold text-primary">{(totalPredictions / 24).toFixed(1)} lần</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <Card className="border-2 border-primary/20 p-6">
                <h2 className="text-xl font-bold text-primary mb-4">Thống Kê Cá Nhân</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-secondary/5 rounded">
                    <span className="text-muted-foreground">Ngôn ngữ ưu tiên</span>
                    <span className="font-semibold text-foreground">
                      {user.preferredLanguage === "vi" ? "Tiếng Việt" : "English"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/5 rounded">
                    <span className="text-muted-foreground">Vai trò</span>
                    <span className="font-semibold text-foreground">
                      {user.role === "admin" ? "Admin" : "Người Dùng"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/5 rounded">
                    <span className="text-muted-foreground">Hỗ trợ tiếp cận</span>
                    <span className="font-semibold text-foreground">{user.disabilityLevel || "Không"}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/5 rounded">
                    <span className="text-muted-foreground">Ngày tạo tài khoản</span>
                    <span className="font-semibold text-foreground">
                      {user.createdAt instanceof Date
                        ? user.createdAt.toLocaleDateString("vi-VN")
                        : new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
    </ProtectedPage>
  )
}
