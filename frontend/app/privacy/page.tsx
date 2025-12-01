"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { Lock, Trash2, Eye, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [dataCollection, setDataCollection] = useState(true)
  const [dataTraining, setDataTraining] = useState(true)
  const [analytics, setAnalytics] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDataExport, setShowDataExport] = useState(false)

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  if (!user) {
    return null
  }

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
    // Clear all user data from localStorage
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

              {/* Data Collection */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base font-semibold">Cho Phép Thu Thập Dữ Liệu</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ứng dụng lưu trữ các mẫu cử chỉ của bạn để cải thiện kết quả nhận diện
                  </p>
                </div>
                <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
              </div>

              {/* Data Training */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base font-semibold">Sử Dụng Dữ Liệu Để Huấn Luyện</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cho phép sử dụng dữ liệu cử chỉ của bạn để huấn luyện model cải tiến
                  </p>
                </div>
                <Switch checked={dataTraining} onCheckedChange={setDataTraining} />
              </div>

              {/* Analytics */}
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
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Quản Lý Dữ Liệu Của Bạn
              </h2>

              {/* Data Export */}
              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Xuất Dữ Liệu Cá Nhân</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tải xuống bản sao của tất cả dữ liệu cá nhân của bạn ở định dạng JSON
                  </p>
                  <AlertDialog>
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowDataExport(true)}>
                      Xuất Dữ Liệu
                    </Button>
                  </AlertDialog>
                </div>
              </div>

              {/* Data Storage Info */}
              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Dữ Liệu Được Lưu Trữ</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Thông tin tài khoản</span>
                      <span className="text-foreground font-semibold">~5 KB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cài đặt hệ thống</span>
                      <span className="text-foreground font-semibold">~3 KB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lịch sử nhận diện</span>
                      <span className="text-foreground font-semibold">~50 KB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mẫu cử chỉ (nếu có)</span>
                      <span className="text-foreground font-semibold">~2 MB</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2 flex justify-between items-center font-semibold">
                      <span>Tổng cộng</span>
                      <span className="text-primary">~2 MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Thời Gian Lưu Trữ</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chúng tôi lưu trữ dữ liệu của bạn theo chính sách sau:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Thông tin tài khoản: Cho đến khi bạn xoá tài khoản</li>
                    <li>• Lịch sử nhận diện: 90 ngày (có thể xoá thủ công)</li>
                    <li>• Mẫu cử chỉ: 180 ngày (có thể xoá thủ công hoặc khi yêu cầu)</li>
                    <li>• Bản ghi hoạt động: 30 ngày</li>
                  </ul>
                </div>
              </div>

              {/* Delete Data */}
              <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div>
                  <h3 className="font-semibold text-destructive mb-2">Xoá Tất Cả Dữ Liệu</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Xoá vĩnh viễn tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
                  </p>
                  <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <Button variant="destructive" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xoá Tất Cả Dữ Liệu
                    </Button>
                    <AlertDialogContent>
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
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Bảo Mật Tài Khoản
              </h2>

              {/* Current Security Status */}
              <div className="space-y-3">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="font-semibold text-green-600 mb-1">Trạng Thái Bảo Mật: Tốt</p>
                  <p className="text-sm text-muted-foreground">Tài khoản của bạn được bảo vệ tốt</p>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <h3 className="font-semibold text-foreground mb-3">Cài Đặt Bảo Mật</h3>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Xác thực hai lớp</span>
                  <span className="text-sm text-muted-foreground">Chưa bật</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Mật khẩu</span>
                  <Link href="/profile" className="text-primary hover:underline text-sm">
                    Thay đổi
                  </Link>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-foreground">Phiên hoạt động</span>
                  <span className="text-sm text-muted-foreground">1 phiên</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <h3 className="font-semibold text-foreground mb-3">Hoạt Động Gần Đây</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đăng nhập lần cuối</span>
                    <span className="text-foreground">Hôm nay 14:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thay đổi mật khẩu gần nhất</span>
                    <span className="text-foreground">30 ngày trước</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cài đặt thay đổi gần nhất</span>
                    <span className="text-foreground">Hôm nay 10:15</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Policy Tab */}
          <TabsContent value="policy" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary mb-4">Chính Sách Quyền Riêng Tư</h2>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Dữ Liệu Chúng Tôi Thu Thập</h3>
                  <p>
                    Ứng dụng thu thập: thông tin tài khoản, mẫu cử chỉ, lịch sử nhận diện, cài đặt người dùng, và dữ
                    liệu phân tích sử dụng.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Cách Chúng Tôi Sử Dụng Dữ Liệu</h3>
                  <p>
                    Dữ liệu được sử dụng để cải thiện dịch vụ, cá nhân hóa trải nghiệm, và giúp bạn nhận được tính năng
                    phù hợp nhất.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. Bảo Vệ Dữ Liệu</h3>
                  <p>
                    Dữ liệu của bạn được mã hóa và lưu trữ an toàn. Chúng tôi tuân thủ các tiêu chuẩn bảo mật quốc tế.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4. Chia Sẻ Dữ Liệu</h3>
                  <p>
                    Dữ liệu cá nhân của bạn không bao giờ được chia sẻ với bên thứ ba mà không có sự đồng ý của bạn.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5. Quyền Của Bạn</h3>
                  <p>Bạn có quyền truy cập, sửa, xuất hoặc xoá dữ liệu cá nhân của mình bất kỳ lúc nào.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6. Liên Hệ</h3>
                  <p>
                    Nếu có câu hỏi về quyền riêng tư, vui lòng liên hệ với chúng tôi tại privacy@gesturerecognition.app
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
