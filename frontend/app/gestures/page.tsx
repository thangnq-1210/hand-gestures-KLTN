"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { AlertCircle, Edit2, RotateCcw, Trash2, CheckCircle2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"

interface GestureMapping {
  model_label: string
  default_text: string
  custom_text?: string | null
  effective_text: string
}

interface GestureUI extends GestureMapping {
  // UI-only
  id: string
  name: string
  isEnabled: boolean
}

export default function GesturesPage() {
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<GestureMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // dialog edit
  const [editingGesture, setEditingGesture] = useState<GestureUI | null>(null)
  const [newGestureText, setNewGestureText] = useState("")

  // enable/disable local
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({})
  const [selectedProfile, setSelectedProfile] = useState<"basic" | "advanced">("basic")

  // notify
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [savingLabel, setSavingLabel] = useState<string | null>(null)

  const enabledStorageKey = useMemo(() => {
    return user?.id ? `gesture_enabled_${user.id}` : "gesture_enabled_guest"
  }, [user?.id])

  // Redirect nếu chưa login (để tránh lỗi hydration / rules of hooks)
  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
  }, [isAuthenticated, router])

  // Load enabled map (localStorage)
  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(enabledStorageKey)
      if (raw) setEnabledMap(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [enabledStorageKey, user?.id])

  // Fetch mapping từ backend
  useEffect(() => {
    if (!isAuthenticated || !token) return

    const fetchData = async () => {
      setIsLoading(true)
      setError("")
      setSuccess("")
      try {
        const res = await fetch(`${API_BASE_URL}/gestures/my-mapping`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || "Không tải được danh sách cử chỉ")
        }

        const data: GestureMapping[] = await res.json()
        setItems(data)

        // Tự chọn profile dựa theo dữ liệu hiện có (nếu có label >= 6)
        const hasAdvanced = data.some((x) => Number(x.model_label) >= 6)
        setSelectedProfile(hasAdvanced ? "advanced" : "basic")
      } catch (e) {
        console.error(e)
        setError("Không tải được danh sách cử chỉ")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [isAuthenticated, token])

  // Build UI list (merge enabledMap + items)
  const gesturesUI: GestureUI[] = useMemo(() => {
    const sorted = [...items].sort((a, b) => Number(a.model_label) - Number(b.model_label))

    return sorted.map((g) => {
      const label = g.model_label
      const enabled = enabledMap[label]
      const isEnabled = enabled === undefined ? true : enabled // default: true

      return {
        ...g,
        id: label,
        name: `Cử chỉ ${label}`,
        isEnabled,
      }
    })
  }, [items, enabledMap])

  const persistEnabledMap = (next: Record<string, boolean>) => {
    setEnabledMap(next)
    try {
      localStorage.setItem(enabledStorageKey, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const handleToggleGesture = (label: string) => {
    const next = { ...enabledMap, [label]: !(enabledMap[label] ?? true) }
    persistEnabledMap(next)
  }

  const handleApplyProfile = (profile: "basic" | "advanced") => {
    // basic: enable 0-5; advanced: enable 0-7
    const max = profile === "basic" ? 5 : 7
    const next: Record<string, boolean> = { ...enabledMap }

    for (const g of gesturesUI) {
      const n = Number(g.model_label)
      next[g.model_label] = n <= max
    }

    persistEnabledMap(next)
    setSelectedProfile(profile)
    setSuccess(profile === "basic" ? "Đã áp dụng gói Cơ Bản" : "Đã áp dụng gói Nâng Cao")
    setError("")
  }

  const handleSave = async (label: string) => {
    if (!token) return
    setError("")
    setSuccess("")
    setSavingLabel(label)

    try {
      const body = { custom_text: newGestureText.trim() }
      const res = await fetch(`${API_BASE_URL}/gestures/my-mapping/${label}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Lưu thất bại")
      }

      const updated: GestureMapping = await res.json()
      setItems((prev) => prev.map((it) => (it.model_label === label ? updated : it)))

      setSuccess("Đã lưu cử chỉ thành công")
      setEditingGesture(null)
      setNewGestureText("")
    } catch (e) {
      console.error(e)
      setError("Lưu thất bại, vui lòng thử lại")
    } finally {
      setSavingLabel(null)
    }
  }

  const handleReset = async (label: string) => {
    if (!token) return
    setError("")
    setSuccess("")
    setSavingLabel(label)

    try {
      const res = await fetch(`${API_BASE_URL}/gestures/my-mapping/${label}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || "Reset thất bại")
      }

      // cập nhật UI: custom_text -> null, effective_text -> default_text
      setItems((prev) =>
        prev.map((it) =>
          it.model_label === label
            ? { ...it, custom_text: null, effective_text: it.default_text }
            : it
        )
      )

      setSuccess("Đã reset về câu mặc định")
    } catch (e) {
      console.error(e)
      setError("Reset thất bại, vui lòng thử lại")
    } finally {
      setSavingLabel(null)
    }
  }

  // “Xoá cử chỉ” theo UI mẫu = vô hiệu hoá (local) + xoá custom_text (backend)
  const handleDisableGesture = async (label: string) => {
    // disable local
    const next = { ...enabledMap, [label]: false }
    persistEnabledMap(next)

    // optional: xóa custom_text để “trở về mặc định”
    await handleReset(label)
  }

  const handleResetAll = async () => {
    if (!token) return
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // reset toàn bộ custom_text (chỉ gọi delete cho những cái có custom_text)
      const needReset = items.filter((x) => x.custom_text)
      await Promise.allSettled(
        needReset.map((x) =>
          fetch(`${API_BASE_URL}/gestures/my-mapping/${x.model_label}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      )

      // refresh items (đơn giản nhất: fetch lại)
      const res = await fetch(`${API_BASE_URL}/gestures/my-mapping`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Không tải lại được danh sách sau khi reset")
      const data: GestureMapping[] = await res.json()
      setItems(data)

      // enable all
      const next: Record<string, boolean> = {}
      data.forEach((g) => (next[g.model_label] = true))
      persistEnabledMap(next)

      setSelectedProfile("basic")
      setSuccess("Đã đặt lại tất cả cử chỉ")
    } catch (e) {
      console.error(e)
      setError("Không thể đặt lại tất cả, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  const getDisplayText = (g: GestureUI) => g.custom_text ?? g.default_text

  if (!isAuthenticated || !user) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Quản Lý Từ Vựng Cử Chỉ</h1>
          <p className="text-muted-foreground">
            Tùy chỉnh câu nói tương ứng với từng cử chỉ tay. Thay đổi này chỉ áp dụng cho tài khoản của bạn.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500/80 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-100">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="mygestures" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mygestures">Cử Chỉ Của Tôi</TabsTrigger>
            <TabsTrigger value="profiles">Gói Cấu Hình</TabsTrigger>
          </TabsList>

          {/* My Gestures Tab */}
          <TabsContent value="mygestures" className="space-y-6">
            {isLoading ? (
              <Card className="border-2 border-primary/20 p-6">Đang tải...</Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gesturesUI.map((gesture) => (
                  <Card
                    key={gesture.id}
                    className={`border-2 p-6 transition-opacity ${gesture.isEnabled ? "border-primary/20 opacity-100" : "border-muted/20 opacity-50"
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
                              <p className="font-semibold text-primary">Mặc định: {gesture.default_text}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* Edit dialog */}
                          {/* <Dialog
                            open={editingGesture?.model_label === gesture.model_label}
                            onOpenChange={(open) => {
                              if (open) {
                                setEditingGesture(gesture)
                                setNewGestureText(getDisplayText(gesture))
                              } else {
                                setEditingGesture(null)
                                setNewGestureText("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Sửa {gesture.name}</DialogTitle>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Câu nói tùy chỉnh</Label>
                                  <Input
                                    value={newGestureText}
                                    onChange={(e) => setNewGestureText(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Mặc định: <span className="font-medium">{gesture.default_text}</span>
                                  </p>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleSave(gesture.model_label)}
                                    className="flex-1"
                                    disabled={savingLabel === gesture.model_label}
                                  >
                                    {savingLabel === gesture.model_label ? "Đang lưu..." : "Cập Nhật"}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => handleReset(gesture.model_label)}
                                    disabled={savingLabel === gesture.model_label || !gesture.custom_text}
                                  >
                                    Đặt Lại
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog> */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingGesture(gesture)
                              setNewGestureText(getDisplayText(gesture))
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          {/* Delete/Disable with confirm */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogTitle>Vô hiệu hoá {gesture.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn vô hiệu hoá cử chỉ này không? Bạn có thể bật lại sau.
                                (Thao tác này cũng reset câu tùy chỉnh về mặc định.)
                              </AlertDialogDescription>

                              <div className="flex gap-3">
                                <AlertDialogCancel className="hover:bg-primary/10 hover:text-primary">Huỷ</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDisableGesture(gesture.model_label)}
                                  className="bg-destructive"
                                >
                                  Xoá
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {gesture.custom_text && (
                        <div className="text-lg font-semibold text-primary">
                          Tùy chỉnh: "{gesture.custom_text}"
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">
                          {gesture.isEnabled ? "Kích hoạt" : "Vô hiệu hoá"}
                        </span>

                        <button
                          onClick={() => handleToggleGesture(gesture.model_label)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gesture.isEnabled ? "bg-primary" : "bg-muted"
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gesture.isEnabled ? "translate-x-6" : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Dialog
              open={!!editingGesture}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingGesture(null)
                  setNewGestureText("")
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Sửa {editingGesture?.name ?? ""}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Câu nói tuỳ chỉnh</Label>
                    <Input
                      value={newGestureText}
                      onChange={(e) => setNewGestureText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mặc định:{" "}
                      <span className="font-medium">
                        {editingGesture?.default_text ?? ""}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      disabled={!editingGesture || savingLabel === editingGesture.model_label}
                      onClick={() => editingGesture && handleSave(editingGesture.model_label)}
                    >
                      {editingGesture && savingLabel === editingGesture.model_label ? "Đang lưu..." : "Cập Nhật"}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!editingGesture || savingLabel === editingGesture.model_label || !editingGesture.custom_text}
                      onClick={() => editingGesture && handleReset(editingGesture.model_label)}
                    >
                      Đặt Lại
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Đặt Lại Tất Cả Cử Chỉ
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogTitle>Đặt lại tất cả cử chỉ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ:
                  <br />• Reset toàn bộ câu tuỳ chỉnh về mặc định
                  <br />• Bật lại tất cả cử chỉ
                  <br />
                  Bạn có chắc muốn tiếp tục không?
                </AlertDialogDescription>

                <div className="flex gap-3">
                  <AlertDialogCancel className="hover:bg-primary/10 hover:text-primary">Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>
                    Đặt lại
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${selectedProfile === "basic" ? "border-primary" : "border-border"
                  }`}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Gói Cơ Bản</h3>
                <p className="text-muted-foreground mb-4">
                  Bật các cử chỉ 0–5. Các cử chỉ khác sẽ được tắt (nếu có).
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
                className={`border-2 p-6 cursor-pointer transition-all ${selectedProfile === "advanced" ? "border-primary" : "border-border"
                  }`}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Gói Nâng Cao</h3>
                <p className="text-muted-foreground mb-4">
                  Bật các cử chỉ 0–7 (nếu backend có). Các cử chỉ khác sẽ được tắt.
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
