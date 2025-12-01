"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LogEntry {
  id: string
  timestamp: Date
  type: "error" | "warning" | "info" | "success"
  message: string
  userId?: string
}

export default function AdminLogsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated || user?.role !== "admin") {
    router.push("/")
    return null
  }

  const mockLogs: LogEntry[] = [
    {
      id: "1",
      timestamp: new Date("2024-11-24 16:30"),
      type: "info",
      message: "User login: user@example.com",
      userId: "user1",
    },
    {
      id: "2",
      timestamp: new Date("2024-11-24 16:15"),
      type: "success",
      message: "Gesture prediction completed with 95% confidence",
    },
    {
      id: "3",
      timestamp: new Date("2024-11-24 15:45"),
      type: "warning",
      message: "Low confidence gesture detection: 42%",
    },
    {
      id: "4",
      timestamp: new Date("2024-11-24 15:20"),
      type: "error",
      message: "Camera access denied for user",
      userId: "user2",
    },
    {
      id: "5",
      timestamp: new Date("2024-11-24 14:50"),
      type: "info",
      message: "Data collection enabled for user",
      userId: "user3",
    },
  ]

  const getIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getBgColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "bg-destructive/10"
      case "warning":
        return "bg-yellow-500/10"
      case "success":
        return "bg-green-500/10"
      default:
        return "bg-blue-500/10"
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại Admin
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Nhật Ký Hệ Thống</h1>
          <p className="text-muted-foreground">Xem lịch sử lỗi, cảnh báo, và hoạt động hệ thống</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tất Cả</TabsTrigger>
            <TabsTrigger value="errors">Lỗi</TabsTrigger>
            <TabsTrigger value="warnings">Cảnh Báo</TabsTrigger>
            <TabsTrigger value="success">Thành Công</TabsTrigger>
            <TabsTrigger value="info">Thông Tin</TabsTrigger>
          </TabsList>

          {["all", "errors", "warnings", "success", "info"].map((tab) => {
            let filteredLogs = mockLogs
            if (tab === "errors") filteredLogs = mockLogs.filter((l) => l.type === "error")
            else if (tab === "warnings") filteredLogs = mockLogs.filter((l) => l.type === "warning")
            else if (tab === "success") filteredLogs = mockLogs.filter((l) => l.type === "success")
            else if (tab === "info") filteredLogs = mockLogs.filter((l) => l.type === "info")

            return (
              <TabsContent key={tab} value={tab}>
                <Card className="border-2 border-primary/20 p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại</TableHead>
                          <TableHead>Thời Gian</TableHead>
                          <TableHead>Tin Nhắn</TableHead>
                          <TableHead>User ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <TableRow key={log.id} className={getBgColor(log.type)}>
                            <TableCell>{getIcon(log.type)}</TableCell>
                            <TableCell className="text-sm">{log.timestamp.toLocaleString("vi-VN")}</TableCell>
                            <TableCell className="text-sm">{log.message}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.userId || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </main>
  )
}
