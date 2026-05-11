"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (authLoading) return

    if (isAuthenticated && user) {
      const next = searchParams.get("next")

      if (next && next.startsWith("/")) {
        router.replace(next)
        return
      }

      if (user.role === "admin") {
        router.replace("/admin")
        return
      }

      if (user.role === "caregiver") {
        router.replace("/caregiver")
        return
      }

      router.replace("/gesture-recognition")
    }
  }, [authLoading, isAuthenticated, user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      const next = searchParams.get("next")

      if (next && next.startsWith("/")) {
        router.replace(next)
        return
      }

      router.replace("/")
    } catch (err: any) {
      const msg = String(err?.message || "").trim()

      if (msg.toLowerCase().includes("khóa")) {
        setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.")
      } else if (msg) {
        setError(msg)
      } else {
        setError("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
      </main>
    )
  }

  if (isAuthenticated && user) return null

  return (
    <main className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-7xl rounded-[28px] bg-white shadow-xl overflow-hidden min-h-[680px] grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Left side */}
        <div className="relative hidden lg:block overflow-hidden min-h-[680px]">
          <img
            src="/login_nen.png"
            alt="Login cover"
            className="absolute inset-0 w-full h-full object-cover object-[0%_center]"
          />
        </div>

        {/* Right side */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-8 md:px-10 lg:pl-6 lg:pr-12">
          <div className="w-full max-w-[600px]">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-4 mb-5">
                <img
                  src="/logo-it.png"
                  alt="Logo IT"
                  className="w-20 h-20 object-contain"
                />
                <img
                  src="/logo_v_hand.png"
                  alt="Logo V-HAND"
                  className="w-20 h-20 object-contain"
                />
              </div>

              <h1 className="text-center text-[28px] font-semibold text-[#222] whitespace-nowrap">
                Đăng nhập hệ thống <span className="font-bold">V - HAND</span>
              </h1>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Địa chỉ email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-xl border border-[#d8d8d8] text-base px-4 shadow-none focus-visible:ring-0 focus-visible:border-teal-500"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-xl border border-[#d8d8d8] text-base px-4 pr-14 shadow-none focus-visible:ring-0 focus-visible:border-teal-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-lg font-semibold"
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {/* <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-teal-500 hover:underline text-base"
                >
                  Quên mật khẩu
                </Link>
              </div> */}
            </form>

            <div className="mt-10 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-teal-500 hover:underline font-medium">
                Đăng ký tại đây
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-sm text-[#555] text-center px-4">
        Copyright © 2022 - 2026 NguyenQuyThang K72E4 CNTT
      </div>
    </main>
  )
}