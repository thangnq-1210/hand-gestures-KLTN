"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
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
import { Plus, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"

interface GestureClass {
  id: string
  name: string
  defaultText: string
}

export default function AdminGesturesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [gestures, setGestures] = useState<GestureClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGesture, setEditingGesture] = useState<GestureClass | null>(null)
  const [formData, setFormData] = useState({ id: "", name: "", defaultText: "" })
  const [gestureToDelete, setGestureToDelete] = useState<string | null>(null)

  const defaultGestures: GestureClass[] = [
    { id: "0", name: "Cử chỉ 0", defaultText: "Xin chào" },
    { id: "1", name: "Cử chỉ 1", defaultText: "Tôi cần giúp đỡ" },
    { id: "2", name: "Cử chỉ 2", defaultText: "Vâng" },
    { id: "3", name: "Cử chỉ 3", defaultText: "Không" },
    { id: "4", name: "Cử chỉ 4", defaultText: "Cảm ơn" },
    { id: "5", name: "Cử chỉ 5", defaultText: "Tôi đang đau" },
  ]

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/")
      return
    }

    const storedGestures = localStorage.getItem("system_gestures")
    if (storedGestures) {
      setGestures(JSON.parse(storedGestures))
    } else {
      setGestures(defaultGestures)
      localStorage.setItem("system_gestures", JSON.stringify(defaultGestures))
    }
    setIsLoading(false)
  }, [user?.role, isAuthenticated, router])

  const saveGestures = (updatedGestures: GestureClass[]) => {
    setGestures(updatedGestures)
    localStorage.setItem("system_gestures", JSON.stringify(updatedGestures))
  }

  const handleAddGesture = () => {
    if (!formData.id || !formData.name || !formData.defaultText) return

    if (editingGesture) {
      const updated = gestures.map((g) =>
        g.id === editingGesture.id ? { id: formData.id, name: formData.name, defaultText: formData.defaultText } : g,
      )
      saveGestures(updated)
      setEditingGesture(null)
    } else {
      const newGesture: GestureClass = {
        id: formData.id,
        name: formData.name,
        defaultText: formData.defaultText,
      }
      saveGestures([...gestures, newGesture])
    }

    setFormData({ id: "", name: "", defaultText: "" })
    setIsDialogOpen(false)
  }

  const handleEditGesture = (gesture: GestureClass) => {
    setEditingGesture(gesture)
    setFormData({ id: gesture.id, name: gesture.name, defaultText: gesture.defaultText })
    setIsDialogOpen(true)
  }

  const handleDeleteGesture = (gestureId: string) => {
    const updated = gestures.filter((g) => g.id !== gestureId)
    saveGestures(updated)
    setGestureToDelete(null)
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại Admin
        </Link>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Quản Lý Từ Vựng Hệ Thống</h1>
            <p className="text-muted-foreground">Cấu hình các cử chỉ và câu nói mặc định cho tất cả người dùng</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90"
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
                        <div className="flex gap-3">
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGesture(gesture.id)} className="bg-destructive">
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
  )
}
