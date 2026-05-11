"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import ProtectedPage from "@/components/auth/protected-page"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Edit2, ArrowLeft } from "lucide-react"
import Link from "next/link"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"
interface GestureClass {
  id: string
  name: string
  defaultText: string
  isActive?: boolean
}

export default function AdminGesturesPage() {
  // const { user, isAuthenticated, token } = useAuth()
  const { token } = useAuth()
  const [gestures, setGestures] = useState<GestureClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGesture, setEditingGesture] = useState<GestureClass | null>(null)
  const [formData, setFormData] = useState({ id: "", name: "", defaultText: "" })
  const [gestureToDelete, setGestureToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // if (!isAuthenticated || user?.role !== "admin") {
    //   router.push("/")
    //   return
    // }

    if (!token) return

    const run = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/admin/gestures`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error(await res.text())

        const data: GestureClass[] = await res.json()
        setGestures(data)
      } catch (e: any) {
        console.error("load gestures failed:", e)
        setError(e?.message || "Không tải được danh sách cử chỉ.")
        setGestures([])
      } finally {
        setIsLoading(false)
      }
    }

    run()
  // }, [user?.role, isAuthenticated, router, token])
    }, [token])


  const handleAddGesture = async () => {
    if (!token) return
    if (!formData.id || !formData.name || !formData.defaultText) return

    try {
      setError(null)
      setSuccess(null)

      if (editingGesture) {
        const res = await fetch(`${API_BASE_URL}/admin/gestures/${editingGesture.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            defaultText: formData.defaultText,
          }),
        })

        if (!res.ok) throw new Error(await res.text())

        const updatedGesture: GestureClass = await res.json()
        setGestures((prev) =>
          prev.map((g) => (g.id === editingGesture.id ? updatedGesture : g))
        )
        setSuccess("Đã cập nhật cử chỉ.")
        setEditingGesture(null)
      } else {
        const res = await fetch(`${API_BASE_URL}/admin/gestures`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: formData.id,
            name: formData.name,
            defaultText: formData.defaultText,
          }),
        })

        if (!res.ok) throw new Error(await res.text())

        const newGesture: GestureClass = await res.json()
        setGestures((prev) => [...prev, newGesture])
        setSuccess("Đã thêm cử chỉ mới.")
      }

      setFormData({ id: "", name: "", defaultText: "" })
      setIsDialogOpen(false)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể lưu cử chỉ.")
    }
  }

  const handleEditGesture = (gesture: GestureClass) => {
    setEditingGesture(gesture)
    setFormData({ id: gesture.id, name: gesture.name, defaultText: gesture.defaultText })
    setIsDialogOpen(true)
  }

  const handleDeleteGesture = async (gestureId: string) => {
    if (!token) return

    try {
      setError(null)
      setSuccess(null)

      const res = await fetch(`${API_BASE_URL}/admin/gestures/${gestureId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(await res.text())

      setGestures((prev) => prev.filter((g) => g.id !== gestureId))
      setGestureToDelete(null)
      setSuccess("Đã xóa cử chỉ.")
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể xóa cử chỉ.")
    }
  }

  // if (!isAuthenticated || user?.role !== "admin") {
  //   return null
  // }

  return (
    <ProtectedPage allowRoles={["admin"]}>
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Quản Lý Từ Vựng Hệ Thống</h1>
            <p className="text-muted-foreground">Cấu hình các cử chỉ và câu nói mặc định cho tất cả người dùng</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => {
                  setEditingGesture(null)
                  setFormData({ id: "", name: "", defaultText: "" })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm Cử Chỉ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGesture ? "Sửa Cử Chỉ" : "Thêm Cử Chỉ Mới"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="id">ID Cử Chỉ</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="0, 1, 2..."
                    disabled={!!editingGesture}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên Cử Chỉ</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Cử chỉ 0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultText">Câu Nói Mặc Định</Label>
                  <Input
                    id="defaultText"
                    value={formData.defaultText}
                    onChange={(e) => setFormData({ ...formData, defaultText: e.target.value })}
                    placeholder="Xin chào"
                  />
                </div>
                <Button onClick={handleAddGesture} className="w-full">
                  {editingGesture ? "Cập Nhật" : "Thêm"}
                </Button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gestures.map((gesture) => (
            <Card key={gesture.id} className="border-2 border-primary/20 p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                      {gesture.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{gesture.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditGesture(gesture)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Xoá Cử Chỉ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này sẽ xoá cử chỉ này khỏi hệ thống. Điều này không thể hoàn tác.
                        </AlertDialogDescription>
                        <div className="flex justify-end gap-3">
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGesture(gesture.id)} className="bg-red-500 hover:bg-red-600">
                            Xoá
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="text-lg font-semibold text-primary">"{gesture.defaultText}"</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
    </ProtectedPage>
  )
}
