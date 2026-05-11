// "use client"

// import type React from "react"

// import { useState } from "react"
// import { useAuth } from "@/lib/auth-context"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Link from "next/link"
// import { AlertCircle } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// export default function RegisterPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [name, setName] = useState("")
//   const [error, setError] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const { register } = useAuth()
//   const router = useRouter()

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError("")

//     if (password !== confirmPassword) {
//       setError("Mật khẩu không khớp")
//       return
//     }

//     if (password.length < 6) {
//       setError("Mật khẩu phải có ít nhất 6 ký tự")
//       return
//     }

//     setIsLoading(true)
//     try {
//       await register(email, password, name)
//       router.push("/")
//     } catch (err) {
//       if (err instanceof Error) {
//         setError(err.message)
//       } else {
//         setError("Đăng ký thất bại. Vui lòng thử lại.")
//       }
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/10">
//       <Card className="w-full max-w-md border-2 border-primary/20">
//         <div className="p-8">
//           <h1 className="text-3xl font-bold text-teal-500 mb-2 text-center">Đăng ký</h1>
//           <p className="text-muted-foreground text-center mb-6">Tạo tài khoản để bắt đầu sử dụng</p>

//           {error && (
//             <Alert variant="destructive" className="mb-6">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Tên đầy đủ</Label>
//               <Input
//                 id="name"
//                 type="text"
//                 placeholder="Nguyễn Văn A"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="your@email.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Mật khẩu</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
//               <Input
//                 id="confirmPassword"
//                 type="password"
//                 placeholder="••••••••"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isLoading}>
//               {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
//             </Button>
//           </form>

//           <div className="mt-6 text-center text-sm text-muted-foreground">
//             Đã có tài khoản?{" "}
//             <Link href="/login" className="text-teal-500 hover:underline">
//               Đăng nhập tại đây
//             </Link>
//           </div>
//         </div>
//       </Card>
//     </main>
//   )
// }

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const router = useRouter()
  const { register, user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && user) {
      router.replace("/")
    }
  }, [authLoading, isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên.")
      return
    }

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.")
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }

    setIsLoading(true)

    try {
      await register(name.trim(), email.trim(), password)
      router.replace("/")
    } catch (err: any) {
      const msg = String(err?.message || "").trim()
      setError(msg || "Đăng ký thất bại. Vui lòng thử lại.")
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
            alt="Register cover"
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
                Đăng ký tài khoản hệ thống <span className="font-bold">V - HAND</span>
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
                  type="text"
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-14 rounded-xl border border-[#d8d8d8] text-base px-4 shadow-none focus-visible:ring-0 focus-visible:border-teal-500"
                />
              </div>

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

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-14 rounded-xl border border-[#d8d8d8] text-base px-4 pr-14 shadow-none focus-visible:ring-0 focus-visible:border-teal-500"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-lg font-semibold"
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </form>

            <div className="mt-10 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-teal-500 hover:underline font-medium">
                Đăng nhập tại đây
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
