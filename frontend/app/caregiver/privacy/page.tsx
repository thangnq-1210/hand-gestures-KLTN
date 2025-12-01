"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Switch } from "@/components/ui/switch"
import { Lock, AlertTriangle, Download, Trash2 } from "lucide-react"

export default function CaregiverPrivacyPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated || user?.role !== "caregiver") {
    router.push("/login")
    return null
  }

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Quản Lý Quyền Riêng Tư</h1>
          <p className="text-muted-foreground">Quản lý cài đặt quyền riêng tư cho người dùng bạn chăm sóc</p>
        </div>

        <Tabs defaultValue="privacy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="privacy">Cài Đặt Quyền Riêng Tư</TabsTrigger>
            <TabsTrigger value="data">Quản Lý Dữ Liệu</TabsTrigger>
            <TabsTrigger value="policy">Chính Sách</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cài Đặt Quyền Riêng Tư
                </CardTitle>
                <CardDescription>Quản lý quyền riêng tư cho từng người dùng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Cho Phép Thu Thập Dữ Liệu</h3>
                      <p className="text-sm text-muted-foreground">
                        Cho phép hệ thống ghi lại dữ liệu cử chỉ của người dùng
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Sử Dụng Để Huấn Luyện Model</h3>
                      <p className="text-sm text-muted-foreground">
                        Cho phép sử dụng dữ liệu để cải thiện độ chính xác của model
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Phân Tích Sử Dụng</h3>
                      <p className="text-sm text-muted-foreground">
                        Cho phép phân tích các mẫu sử dụng để cải thiện hệ thống
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quản Lý Dữ Liệu</CardTitle>
                <CardDescription>Xuất hoặc xoá dữ liệu của người dùng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-900">
                    Bạn có thể thay mặt người dùng yêu cầu xuất hoặc xoá dữ liệu của họ. Các yêu cầu này sẽ được ghi lại
                    cho mục đích kiểm toán.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full gap-2 bg-transparent" variant="outline">
                    <Download className="w-4 h-4" />
                    Xuất Dữ Liệu Của Người Dùng
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full gap-2" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                        Xoá Dữ Liệu
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Xoá Dữ Liệu
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xoá tất cả dữ liệu của người dùng này? Hành động này không thể hoàn tác
                          và sẽ xoá tất cả các mẫu cử chỉ, lịch sử và thống kê.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogAction className="bg-destructive">Xoá</AlertDialogAction>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chính Sách Quyền Riêng Tư</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none text-sm">
                <div className="space-y-4 text-muted-foreground">
                  <p>Hệ thống Nhận Diện Cử Chỉ cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của người dùng.</p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Thu Thập Dữ Liệu</h4>
                    <p>
                      Chúng tôi chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ và cải thiện trải nghiệm người dùng.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Bảo Mật Dữ Liệu</h4>
                    <p>Tất cả dữ liệu được mã hóa và lưu trữ an toàn trên các máy chủ được bảo vệ.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Quyền Người Dùng</h4>
                    <p>Người dùng có quyền truy cập, chỉnh sửa và xoá dữ liệu cá nhân của họ bất kỳ lúc nào.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Vai Trò Caregiver</h4>
                    <p>Caregiver có thể quản lý dữ liệu thay mặt người dùng nhưng chỉ trong phạm vi quản lý của họ.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
