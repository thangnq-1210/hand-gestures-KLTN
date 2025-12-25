"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/10">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-teal-500 mb-2 text-center">Đăng nhập</h1>
          {/* <p className="text-muted-foreground text-center mb-6">Đăng nhập để sử dụng hệ thống nhận diện cử chỉ</p> */}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-teal-500 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-teal-500 hover:underline">
              Đăng ký tại đây
            </Link>
          </div>

          
        </div>
      </Card>
    </main>
  )
}
