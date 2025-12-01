"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, changePassword } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [language, setLanguage] = useState<"vi" | "en">("vi")
  const [disabilityLevel, setDisabilityLevel] = useState<"none" | "light" | "moderate" | "severe">("none")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user) {
      setName(user.name)
      setLanguage(user.preferredLanguage)
      setDisabilityLevel(user.disabilityLevel || "none")
    }
  }, [user, isAuthenticated, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      await updateProfile({
        name,
        preferredLanguage: language,
        disabilityLevel,
      })
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" })
    } catch (err) {
      setMessage({ type: "error", text: "Cập nhật hồ sơ thất bại. Vui lòng thử lại." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự" })
      return
    }

    setIsLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setMessage({ type: "error", text: "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại
        </Link>

        <h1 className="text-4xl font-bold text-primary mb-8">Hồ Sơ Cá Nhân</h1>

        {message && (
          <Alert className={`mb-6 ${message.type === "success" ? "border-green-600" : "border-red-600"}`}>
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card className="border-2 border-primary/20">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Thông Tin Cá Nhân</h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Tên đầy đủ</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ ưu tiên</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as "vi" | "en")}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disability">Mức độ hỗ trợ tiếp cận</Label>
                  <Select value={disabilityLevel} onValueChange={(value) => setDisabilityLevel(value as any)}>
                    <SelectTrigger id="disability">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không cần</SelectItem>
                      <SelectItem value="light">Nhẹ - Font to hơn, ít chức năng</SelectItem>
                      <SelectItem value="moderate">Trung bình - Giao diện đơn giản, icon lớn</SelectItem>
                      <SelectItem value="severe">Nặng - Giao diện tối giản, tất cả text-to-speech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang cập nhật..." : "Cập Nhật Hồ Sơ"}
                </Button>
              </form>
            </div>
          </Card>

          {/* Change Password */}
          <Card className="border-2 border-secondary/20">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Đổi Mật Khẩu</h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang cập nhật..." : "Đổi Mật Khẩu"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
