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
import { Download, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataStats {
  userId: string
  userName: string
  samplesCount: number
  lastCollected: Date
}

export default function AdminDataCollection() {
  const [stats, setStats] = useState<DataStats[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    const mockStats: DataStats[] = [
      {
        userId: "1",
        userName: "Người Dùng 1",
        samplesCount: 156,
        lastCollected: new Date("2024-11-24"),
      },
      {
        userId: "2",
        userName: "Người Dùng 2",
        samplesCount: 89,
        lastCollected: new Date("2024-11-23"),
      },
    ]
    setStats(mockStats)
  }, [])

  const handleDownloadDataset = (userId: string) => {
    console.log("Downloading dataset for user:", userId)
    // Mock download
    alert("Dataset download initiated for user " + userId)
  }

  const handleDeleteUserData = (userId: string) => {
    const updated = stats.filter((s) => s.userId !== userId)
    setStats(updated)
    setSelectedUser(null)
    alert("Dữ liệu người dùng đã được xoá")
  }

  return (
    <Card className="border-2 border-primary/20 p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Quản Lý Thu Thập Dữ Liệu</h2>

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
              {stats.length > 0
                ? new Date(Math.max(...stats.map((s) => s.lastCollected.getTime()))).toLocaleDateString("vi-VN")
                : "N/A"}
            </p>
          </Card>
        </div>

        {/* User Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Người Dùng</TableHead>
                <TableHead>Số Mẫu</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {stat.lastCollected.toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadDataset(stat.userId)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>Xoá Dữ Liệu Người Dùng?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này sẽ xoá tất cả {stat.samplesCount} mẫu của {stat.userName}. Không thể hoàn tác.
                          </AlertDialogDescription>
                          <div className="flex gap-3">
                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUserData(stat.userId)}
                              className="bg-destructive"
                            >
                              Xoá
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
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
