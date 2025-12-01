"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  isLocked: boolean
  createdAt: string | Date
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [userToToggleLock, setUserToToggleLock] = useState<string | null>(null)

  useEffect(() => {
    // Mock loading users from localStorage
    const storedUsers = localStorage.getItem("app_users")
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    } else {
      const mockUsers: User[] = [
        {
          id: "1",
          email: "user@example.com",
          name: "Người Dùng 1",
          role: "user",
          isLocked: false,
          createdAt: new Date("2024-01-15").toISOString(),
        },
        {
          id: "2",
          email: "admin@example.com",
          name: "Admin",
          role: "admin",
          isLocked: false,
          createdAt: new Date("2024-01-01").toISOString(),
        },
      ]
      setUsers(mockUsers)
      localStorage.setItem("app_users", JSON.stringify(mockUsers))
    }
    setIsLoading(false)
  }, [])

  const handleLockUser = (userId: string) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, isLocked: !u.isLocked } : u))
    setUsers(updated)
    localStorage.setItem("app_users", JSON.stringify(updated))
    setUserToToggleLock(null)
  }

  const handleResetPassword = (userId: string) => {
    if (!newPassword) return
    // In real app, send reset email
    console.log(`Password reset for user ${userId}: ${newPassword}`)
    setSelectedUser(null)
    setNewPassword("")
  }

  const handleChangeRole = (userId: string, newRole: "user" | "admin") => {
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    setUsers(updated)
    localStorage.setItem("app_users", JSON.stringify(updated))
  }

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return dateObj.toLocaleDateString("vi-VN")
    } catch {
      return "N/A"
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</div>
  }

  return (
    <Card className="border-2 border-primary/20 p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Quản Lý Tài Khoản Người Dùng</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead>Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleChangeRole(user.id, value as "user" | "admin")}
                  >
                    <SelectTrigger className="w-24 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      user.isLocked ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {user.isLocked ? "Bị Khoá" : "Hoạt Động"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Mật Khẩu - {user.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Mật khẩu tạm thời</Label>
                            <Input
                              type="password"
                              placeholder="Nhập mật khẩu tạm thời"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <Button onClick={() => handleResetPassword(user.id)} className="w-full">
                            Gửi Yêu Cầu Reset
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={user.isLocked ? "default" : "destructive"}
                          size="sm"
                          onClick={() => setUserToToggleLock(user.id)}
                        >
                          {user.isLocked ? "Mở" : "Khoá"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>{user.isLocked ? "Mở Khoá Tài Khoản?" : "Khoá Tài Khoản?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.isLocked
                            ? `Người dùng ${user.name} sẽ có thể đăng nhập lại.`
                            : `Người dùng ${user.name} sẽ không thể đăng nhập.`}
                        </AlertDialogDescription>
                        <div className="flex gap-3">
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleLockUser(user.id)}
                            className={user.isLocked ? "bg-primary" : "bg-destructive"}
                          >
                            {user.isLocked ? "Mở Khoá" : "Khoá"}
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
    </Card>
  )
}
