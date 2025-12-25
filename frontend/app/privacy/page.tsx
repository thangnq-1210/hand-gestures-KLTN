"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Trash2, Eye, Shield, AlertCircle, ChevronRight, X, ZoomIn } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

type SampleSource = "manual_collect" | "feedback_wrong" | "other"

interface Sample {
  id: number
  user_id: number
  label: string
  filename: string
  image_url: string
  source?: SampleSource
  created_at?: string | null
}

export default function PrivacyPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // ✅ Hooks luôn nằm trước mọi return để tránh lỗi “Rendered more hooks than during the previous render”
  const [dataCollection, setDataCollection] = useState(true)
  const [dataTraining, setDataTraining] = useState(true)
  const [analytics, setAnalytics] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDataExport, setShowDataExport] = useState(false)

  const [samples, setSamples] = useState<Sample[]>([])
  const [isSamplesLoading, setIsSamplesLoading] = useState(false)
  const [samplesError, setSamplesError] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  const gestureClasses = [
    { id: "0", name: "Cử chỉ 0", text: "Xin chào" },
    { id: "1", name: "Cử chỉ 1", text: "Tôi cần giúp đỡ" },
    { id: "2", name: "Cử chỉ 2", text: "Vâng" },
    { id: "3", name: "Cử chỉ 3", text: "Không" },
    { id: "4", name: "Cử chỉ 4", text: "Cảm ơn" },
    { id: "5", name: "Cử chỉ 5", text: "Tôi đang đau" },
  ]

  const [sampleToDelete, setSampleToDelete] = useState<Sample | null>(null)
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Redirect an toàn (không push trong render)
  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
  }, [isAuthenticated, router])

  const fetchSamples = useCallback(async () => {
    if (!user?.id) return
    setIsSamplesLoading(true)
    setSamplesError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/collect/my-samples?user_id=${user.id}`)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Không thể tải danh sách mẫu.")
      }
      const data: Sample[] = await res.json()
      setSamples(data)
    } catch (e) {
      console.error(e)
      setSamplesError("Không thể tải danh sách mẫu.")
    } finally {
      setIsSamplesLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSamples()
  }, [fetchSamples])

  const samplesByLabel = useMemo(() => {
    const map: Record<string, Sample[]> = {}
    for (const s of samples) {
      const key = String(s.label)
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return map
  }, [samples])

  const confirmDeleteSample = useCallback(async () => {
    if (!user?.id || !sampleToDelete) return

    setIsDeleting(true)
    setSamplesError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/collect/sample-file/${user.id}/${sampleToDelete.label}/${sampleToDelete.filename}`,
        { method: "DELETE" }
      )

      if (!res.ok) throw new Error(await res.text())

      await fetchSamples()
      showSuccess("Đã xoá mẫu thành công!")
      setSampleToDelete(null) // đóng dialog
    } catch (e) {
      console.error(e)
      setSamplesError("Không thể xoá mẫu.")
    } finally {
      setIsDeleting(false)
    }
  }, [user?.id, sampleToDelete, fetchSamples])



  const confirmDeleteAllForGesture = useCallback(async () => {
    if (!user?.id || !labelToDelete) return

    const list = samplesByLabel[labelToDelete] ?? []
    if (list.length === 0) {
      setLabelToDelete(null)
      return
    }

    setIsDeleting(true)
    setSamplesError(null)
    setSuccessMessage(null)
    try {
      const results = await Promise.all(
        list.map((s) =>
          fetch(`${API_BASE_URL}/collect/sample-file/${user.id}/${labelToDelete}/${s.filename}`, {
            method: "DELETE",
          })
        )
      )

      // nếu có request nào fail
      if (results.some((r) => !r.ok)) throw new Error("Delete failed")

      await fetchSamples()
      showSuccess(`Đã xoá tất cả mẫu của cử chỉ ${labelToDelete}!`)
      setLabelToDelete(null) // đóng dialog
    } catch (e) {
      console.error(e)
      setSamplesError("Không thể xoá tất cả mẫu của cử chỉ này.")
    } finally {
      setIsDeleting(false)
    }
  }, [user?.id, labelToDelete, samplesByLabel, fetchSamples])



  if (!isAuthenticated) return null
  if (!user) return null

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }, [])

  const handleExportData = () => {
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      disabilityLevel: user.disabilityLevel,
      createdAt: user.createdAt,
      exportDate: new Date(),
    }
    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `user-data-${user.id}.json`
    link.click()
    setShowDataExport(false)
  }

  const handleDeleteAllData = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.includes(user.id) || key.includes("user")) {
        localStorage.removeItem(key)
      }
    })
    alert("Tất cả dữ liệu của bạn đã được xoá.")
    setShowDeleteConfirm(false)
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Bảo Mật & Quyền Riêng Tư</h1>
          <p className="text-muted-foreground">Quản lý dữ liệu cá nhân của bạn và cài đặt quyền riêng tư</p>
        </div>

        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="privacy">Quyền Riêng Tư</TabsTrigger>
            <TabsTrigger value="data">Dữ Liệu</TabsTrigger>
            <TabsTrigger value="security">Bảo Mật</TabsTrigger>
            <TabsTrigger value="policy">Chính Sách</TabsTrigger>
          </TabsList>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Cài Đặt Quyền Riêng Tư
              </h2>

              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base font-semibold">Cho Phép Thu Thập Dữ Liệu</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ứng dụng lưu trữ các mẫu cử chỉ của bạn để cải thiện kết quả nhận diện
                  </p>
                </div>
                <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base font-semibold">Sử Dụng Dữ Liệu Để Huấn Luyện</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cho phép sử dụng dữ liệu cử chỉ của bạn để huấn luyện model cải tiến
                  </p>
                </div>
                <Switch checked={dataTraining} onCheckedChange={setDataTraining} />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base font-semibold">Cho Phép Phân Tích Sử Dụng</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Giúp chúng tôi hiểu cách bạn sử dụng ứng dụng để cải thiện nó
                  </p>
                </div>
                <Switch checked={analytics} onCheckedChange={setAnalytics} />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bạn có thể thay đổi các cài đặt này bất kỳ lúc nào. Quyết định của bạn được lưu trữ an toàn và không
                  được chia sẻ với bất kỳ bên thứ ba nào.
                </AlertDescription>
              </Alert>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Quản Lý Dữ Liệu Của Bạn
                </h2>
                <Button variant="outline" onClick={fetchSamples} disabled={isSamplesLoading}>
                  Tải lại
                </Button>
              </div>

              {samplesError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{samplesError}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
                  <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <h3 className="font-semibold text-foreground mb-3">Dữ Liệu Cử Chỉ Thu Thập</h3>

                {isSamplesLoading ? (
                  <p className="text-sm text-muted-foreground">Đang tải danh sách mẫu...</p>
                ) : (
                  <div className="grid gap-3">
                    {gestureClasses.map((gesture) => {
                      const list = samplesByLabel[gesture.id] ?? []
                      return (
                        <Dialog key={gesture.id}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-4 h-auto border border-border bg-background hover:bg-secondary/20"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Eye className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold">{gesture.name}</p>
                                  <p className="text-xs text-muted-foreground">{gesture.text}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{list.length} mẫu</Badge>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex justify-between items-center pr-8">
                                <span>
                                  Mẫu cử chỉ: {gesture.name} ({list.length})
                                </span>
                                {list.length > 0 && (
                                  <Button variant="destructive" size="sm" onClick={() => setLabelToDelete(gesture.id)}>
                                    Xóa tất cả
                                  </Button>
                                )}
                              </DialogTitle>
                            </DialogHeader>

                            {list.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                Chưa có mẫu nào được thu thập cho cử chỉ này.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
                                {list.map((s) => {
                                  const fullUrl = `${API_BASE_URL}${s.image_url}`
                                  return (
                                    <div
                                      key={s.id}
                                      className="group relative aspect-video rounded-md overflow-hidden border bg-muted"
                                    >
                                      <img src={fullUrl} alt={`Sample ${s.id}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                          size="icon"
                                          variant="secondary"
                                          className="h-8 w-8"
                                          onClick={() => setViewingImage(fullUrl)}
                                        >
                                          <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          className="h-8 w-8"
                                          onClick={() => setSampleToDelete(s)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* (Giữ lại các phần khác của bạn nếu cần) */}
              <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div>
                  <h3 className="font-semibold text-destructive mb-2">Xoá Tất Cả Dữ Liệu</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Xoá vĩnh viễn tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
                  </p>
                  {/* <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}> */}
                  <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
                    <Button variant="destructive" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xoá Tất Cả Dữ Liệu
                    </Button>
                    {/* <AlertDialogContent>
                      <AlertDialogTitle>Xoá Tất Cả Dữ Liệu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này sẽ xoá vĩnh viễn tất cả dữ liệu của bạn bao gồm lịch sử, mẫu, và cài đặt. Bạn sẽ
                        không thể khôi phục.
                      </AlertDialogDescription>
                      <div className="flex gap-3">
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive">
                          Xoá Vĩnh Viễn
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent> */}
                    {/* </AlertDialog> */}
                  </Dialog>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ===== Confirm delete ONE sample ===== */}
          <AlertDialog open={!!sampleToDelete} onOpenChange={(open) => !open && setSampleToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogTitle>Xoá mẫu này?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xoá mẫu <b>{sampleToDelete?.filename}</b> (nhãn <b>{sampleToDelete?.label}</b>) không?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>

              <div className="flex gap-3">
                <AlertDialogCancel className="hover:bg-primary/10 hover:text-primary" disabled={isDeleting}>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteSample}
                  className="bg-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xoá..." : "Xoá"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* ===== Confirm delete ALL samples of a gesture ===== */}
          <AlertDialog open={!!labelToDelete} onOpenChange={(open) => !open && setLabelToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogTitle>Xoá tất cả mẫu của cử chỉ này?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xoá{" "}
                <b>{labelToDelete ? (samplesByLabel[labelToDelete]?.length ?? 0) : 0}</b>{" "}
                mẫu của cử chỉ <b>{labelToDelete}</b> không?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>

              <div className="flex gap-3">
                <AlertDialogCancel className="hover:bg-primary/10 hover:text-primary" disabled={isDeleting}>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteAllForGesture}
                  className="bg-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xoá..." : "Xoá tất cả"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>


          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Bảo Mật Tài Khoản
              </h2>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="font-semibold text-green-600 mb-1">Trạng Thái Bảo Mật: Tốt</p>
                <p className="text-sm text-muted-foreground">Tài khoản của bạn được bảo vệ tốt</p>
              </div>
            </Card>
          </TabsContent>

          {/* Policy Tab */}
          <TabsContent value="policy" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary mb-4">Chính Sách Quyền Riêng Tư</h2>
              <p className="text-sm text-muted-foreground">...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Zoom dialog */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          {/* [&>button]:hidden => ẩn nút X mặc định của DialogContent */}

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Nút X của bạn */}
            <DialogClose asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                onClick={() => setViewingImage(null)}
              >
                <X className="h-6 w-6 " />
              </Button>
            </DialogClose>

            {viewingImage && (
              <img
                src={viewingImage}
                alt="Full size preview"
                className="max-w-[90vw] max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
