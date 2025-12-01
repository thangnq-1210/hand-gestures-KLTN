"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Users, Trash2, Edit2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CaregiverUsersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [managedUsers, setManagedUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    language: "vi",
    disabilityLevel: "light",
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!isAuthenticated || user?.role !== "caregiver") {
    router.push("/login")
    return null
  }

  const handleAddUser = () => {
    if (formData.name.trim()) {
      const newUser = {
        id: "user_" + Date.now(),
        name: formData.name,
        language: formData.language,
        disabilityLevel: formData.disabilityLevel,
      }
      setManagedUsers([...managedUsers, newUser])
      setFormData({ name: "", language: "vi", disabilityLevel: "light" })
    }
  }

  const handleDeleteUser = (userId: string) => {
    setManagedUsers(managedUsers.filter((u) => u.id !== userId))
  }

  const handleEditUser = (user: any) => {
    setFormData({
      name: user.name,
      language: user.language,
      disabilityLevel: user.disabilityLevel,
    })
    setEditingId(user.id)
  }

  const handleSaveEdit = () => {
    if (editingId && formData.name.trim()) {
      setManagedUsers(
        managedUsers.map((u) =>
          u.id === editingId
            ? {
                ...u,
                name: formData.name,
                language: formData.language,
                disabilityLevel: formData.disabilityLevel,
              }
            : u,
        ),
      )
      setFormData({ name: "", language: "vi", disabilityLevel: "light" })
      setEditingId(null)
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Quản Lý Người Dùng</h1>
          <p className="text-muted-foreground">Tạo và quản lý profile cho những người bạn chăm sóc</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingId ? "Chỉnh Sửa Người Dùng" : "Thêm Người Dùng Mới"}</CardTitle>
              <CardDescription>
                {editingId ? "Cập nhật thông tin người dùng" : "Tạo profile cho người dùng mới"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tên Người Dùng</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ngôn Ngữ Ưu Tiên</label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mức Độ Khiếm Khuyết</label>
                <Select
                  value={formData.disabilityLevel}
                  onValueChange={(value) => setFormData({ ...formData, disabilityLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không cần hỗ trợ</SelectItem>
                    <SelectItem value="light">Nhẹ</SelectItem>
                    <SelectItem value="moderate">Trung Bình</SelectItem>
                    <SelectItem value="severe">Nặng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {editingId ? (
                  <>
                    <Button className="flex-1" onClick={handleSaveEdit}>
                      Lưu Thay Đổi
                    </Button>
                    <Button
                      className="flex-1 bg-transparent"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null)
                        setFormData({ name: "", language: "vi", disabilityLevel: "light" })
                      }}
                    >
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={handleAddUser}>
                    Thêm Người Dùng
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Danh Sách Người Dùng ({managedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {managedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Chưa có người dùng nào được tạo</p>
                    <p className="text-sm">Thêm người dùng mới từ biểu mẫu bên cạnh</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {managedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Mức độ:{" "}
                            {
                              {
                                none: "Không cần hỗ trợ",
                                light: "Nhẹ",
                                moderate: "Trung Bình",
                                severe: "Nặng",
                              }[user.disabilityLevel]
                            }
                            | Ngôn ngữ: {user.language === "vi" ? "Tiếng Việt" : "English"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xoá Người Dùng</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xoá "{user.name}"? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Xoá</AlertDialogAction>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
