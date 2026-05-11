"use client"

import { useState, useEffect, useCallback } from "react"
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
import { useAuth } from "@/lib/auth-context"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"
interface User {
  id: string
  email: string
  name: string
  role: "user" | "caregiver" | "admin"
  isLocked: boolean
  createdAt: string | Date
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [userToToggleLock, setUserToToggleLock] = useState<string | null>(null)
  const { token } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const loadUsers = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users?limit=200&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const data: User[] = await res.json()
      setUsers(data)
    } catch (e) {
      console.error("load users failed:", e)
      setUsers([])
      setError("Không tải được danh sách người dùng.")
    } finally {
      setIsLoading(false)
    }
  }, [token])
  useEffect(() => {
    void loadUsers()
  }, [loadUsers])


  const handleChangeRole = async (userId: string, newRole: "user" | "caregiver" | "admin") => {
    if (!token) return
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) throw new Error(await res.text())

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      setSuccess("Đã cập nhật vai trò người dùng.")
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật vai trò.")
    }
  }


  const handleResetPassword = async (userId: string) => {
    if (!token) return
    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.")
      return
    }

    try {
      setIsResettingPassword(true)
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      setSuccess("Đặt lại mật khẩu thành công.")
      setSelectedUser(null)
      setNewPassword("")
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể đặt lại mật khẩu.")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleLockUser = async (userId: string, locked: boolean) => {
    if (!token) return
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ locked }),
      })

      if (!res.ok) throw new Error(await res.text())

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isLocked: locked } : u)))
      setUserToToggleLock(null)
      setSuccess(locked ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.")
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật trạng thái tài khoản.")
    }
  }

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return dateObj.toLocaleDateString("vi-VN")
    } catch {
      return "N/A"
    }
  }
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "caregiver" | "admin",
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const handleCreateUser = async () => {
    if (!token) return

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.")
      return
    }

    try {
      setIsCreatingUser(true)
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      setSuccess("Đã tạo người dùng mới thành công.")
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "user",
      })
      setOpenCreateDialog(false)
      await loadUsers()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể tạo người dùng.")
    } finally {
      setIsCreatingUser(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</div>
  }

  return (
    <Card className="border-2 border-primary/20 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Quản Lý Tài Khoản Người Dùng</h2>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>Thêm người dùng</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Họ tên</label>
                  <Input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nhập họ tên"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mật khẩu</label>
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Vai trò</label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        role: value as "user" | "caregiver" | "admin",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenCreateDialog(false)
                    setCreateForm({
                      name: "",
                      email: "",
                      password: "",
                      role: "user",
                    })
                  }}
                  disabled={isCreatingUser}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                  {isCreatingUser ? "Đang tạo..." : "Tạo người dùng"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

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
                    onValueChange={(value) => handleChangeRole(user.id, value as "user" | "caregiver" | "admin")}
                  >
                    <SelectTrigger className="w-24 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded ${user.isLocked ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
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
                          <Button
                            onClick={() => handleResetPassword(user.id)}
                            className="w-full"
                            disabled={isResettingPassword}
                          >
                            {isResettingPassword ? "Đang cập nhật..." : "Đặt Lại Mật Khẩu"}
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
                        <div className="flex justify-end gap-3">
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleLockUser(user.id, !user.isLocked)}
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
