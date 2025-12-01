"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Edit2, RotateCcw } from "lucide-react"
import Link from "next/link"

interface Gesture {
  id: string
  name: string
  defaultText: string
  userText?: string
  isEnabled: boolean
}

export default function GesturesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [gestures, setGestures] = useState<Gesture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGesture, setEditingGesture] = useState<Gesture | null>(null)
  const [newGestureName, setNewGestureName] = useState("")
  const [newGestureText, setNewGestureText] = useState("")
  const [gestureToDelete, setGestureToDelete] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState("basic")

  // Default gestures
  const defaultGestures: Gesture[] = [
    { id: "0", name: "Cử chỉ 0", defaultText: "Xin chào", isEnabled: true },
    { id: "1", name: "Cử chỉ 1", defaultText: "Tôi cần giúp đỡ", isEnabled: true },
    { id: "2", name: "Cử chỉ 2", defaultText: "Vâng", isEnabled: true },
    { id: "3", name: "Cử chỉ 3", defaultText: "Không", isEnabled: true },
    { id: "4", name: "Cử chỉ 4", defaultText: "Cảm ơn", isEnabled: true },
    { id: "5", name: "Cử chỉ 5", defaultText: "Tôi đang đau", isEnabled: true },
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Load user's gesture configuration
    const storedGestures = localStorage.getItem(`gestures_${user?.id}`)
    if (storedGestures) {
      setGestures(JSON.parse(storedGestures))
    } else {
      setGestures(defaultGestures)
    }
    setIsLoading(false)
  }, [user?.id, isAuthenticated, router])

  const saveGestures = (updatedGestures: Gesture[]) => {
    setGestures(updatedGestures)
    localStorage.setItem(`gestures_${user?.id}`, JSON.stringify(updatedGestures))
  }

  const handleUpdateGestureText = (gestureId: string, newText: string) => {
    const updated = gestures.map((g) => (g.id === gestureId ? { ...g, userText: newText } : g))
    saveGestures(updated)
    setEditingGesture(null)
  }

  const handleToggleGesture = (gestureId: string) => {
    const updated = gestures.map((g) => (g.id === gestureId ? { ...g, isEnabled: !g.isEnabled } : g))
    saveGestures(updated)
  }

  const handleDeleteGesture = (gestureId: string) => {
    const updated = gestures.map((g) => (g.id === gestureId ? { ...g, userText: undefined, isEnabled: false } : g))
    saveGestures(updated)
    setGestureToDelete(null)
  }

  const handleResetGesture = (gestureId: string) => {
    const updated = gestures.map((g) => (g.id === gestureId ? { ...g, userText: undefined } : g))
    saveGestures(updated)
  }

  const handleResetAll = () => {
    saveGestures(defaultGestures)
  }

  const handleApplyProfile = (profileName: string) => {
    let profileGestures = defaultGestures

    if (profileName === "advanced") {
      profileGestures = [
        ...defaultGestures,
        { id: "6", name: "Cử chỉ 6", defaultText: "Tôi muốn nước", isEnabled: true },
        { id: "7", name: "Cử chỉ 7", defaultText: "Tôi muốn thực phẩm", isEnabled: true },
      ]
    }

    saveGestures(profileGestures)
    setSelectedProfile(profileName)
  }

  const getDisplayText = (gesture: Gesture) => {
    return gesture.userText || gesture.defaultText
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Quản Lý Từ Vựng Cử Chỉ</h1>
          <p className="text-muted-foreground">
            Tùy chỉnh cử chỉ và các câu nói tương ứng để phù hợp với nhu cầu của bạn
          </p>
        </div>

        <Tabs defaultValue="mygestures" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mygestures">Cử Chỉ Của Tôi</TabsTrigger>
            <TabsTrigger value="profiles">Gói Cấu Hình</TabsTrigger>
          </TabsList>

          {/* My Gestures Tab */}
          <TabsContent value="mygestures" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gestures.map((gesture) => (
                <Card
                  key={gesture.id}
                  className={`border-2 p-6 transition-opacity ${
                    gesture.isEnabled ? "border-primary/20 opacity-100" : "border-muted/20 opacity-50"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                            {gesture.id}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{gesture.name}</p>
                            <p className="font-semibold text-primary">Mặc định: {gesture.defaultText}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingGesture(gesture)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Sửa Cử Chỉ {gesture.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Câu nói tùy chỉnh</Label>
                                <Input
                                  defaultValue={getDisplayText(gesture)}
                                  placeholder="Nhập câu nói tùy chỉnh"
                                  onChange={(e) => setNewGestureText(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => {
                                    handleUpdateGestureText(gesture.id, newGestureText || gesture.defaultText)
                                    setNewGestureText("")
                                  }}
                                  className="flex-1"
                                >
                                  Cập Nhật
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    handleResetGesture(gesture.id)
                                    setNewGestureText("")
                                  }}
                                >
                                  Đặt Lại
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Xoá Cử Chỉ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn vô hiệu hoá cử chỉ này không? Bạn có thể kích hoạt lại sau.
                            </AlertDialogDescription>
                            <div className="flex gap-3">
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGesture(gesture.id)}
                                className="bg-destructive"
                              >
                                Xoá
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {gesture.userText && (
                      <div className="text-lg font-semibold text-primary">Tùy chỉnh: "{gesture.userText}"</div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {gesture.isEnabled ? "Kích hoạt" : "Vô hiệu hoá"}
                      </span>
                      <button
                        onClick={() => handleToggleGesture(gesture.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          gesture.isEnabled ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            gesture.isEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={handleResetAll} variant="outline" className="w-full bg-transparent">
              <RotateCcw className="w-4 h-4 mr-2" />
              Đặt Lại Tất Cả Cử Chỉ
            </Button>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  selectedProfile === "basic" ? "border-primary" : "border-border"
                }`}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Gói Cơ Bản</h3>
                <p className="text-muted-foreground mb-4">
                  6 cử chỉ cơ bản cho người mới bắt đầu: xin chào, giúp đỡ, vâng, không, cảm ơn, tôi đang đau.
                </p>
                <Button
                  onClick={() => handleApplyProfile("basic")}
                  variant={selectedProfile === "basic" ? "default" : "outline"}
                  className="w-full"
                >
                  {selectedProfile === "basic" ? "Đang Sử Dụng" : "Áp Dụng"}
                </Button>
              </Card>

              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  selectedProfile === "advanced" ? "border-primary" : "border-border"
                }`}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Gói Nâng Cao</h3>
                <p className="text-muted-foreground mb-4">
                  8 cử chỉ bao gồm gói cơ bản + 2 cử chỉ bổ sung: tôi muốn nước, tôi muốn thực phẩm.
                </p>
                <Button
                  onClick={() => handleApplyProfile("advanced")}
                  variant={selectedProfile === "advanced" ? "default" : "outline"}
                  className="w-full"
                >
                  {selectedProfile === "advanced" ? "Đang Sử Dụng" : "Áp Dụng"}
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
