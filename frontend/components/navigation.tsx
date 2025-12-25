"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Settings, Home, BarChart3, Hand, Lock, BookOpen, Menu, Contact  } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image";
export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const userMenuItems = [
    { href: "/gestures", label: "Quản Lý Cử Chỉ", icon: BookOpen },
    { href: "/statistics", label: "Thống Kê", icon: BarChart3 },
    { href: "/settings", label: "Cài Đặt Hệ Thống", icon: Settings },
    { href: "/privacy", label: "Quyền Riêng Tư", icon: Lock },
    { href: "/profile", label: "Hồ Sơ Cá Nhân", icon: Contact },
  ]

  const caregiverMenuItems = [
    { href: "/caregiver", label: "Bảng Điều Khiển", icon: BarChart3 },
    { href: "/caregiver/users", label: "Quản Lý Người Dùng", icon: BookOpen },
    { href: "/caregiver/statistics", label: "Thống Kê Bệnh Nhân", icon: BarChart3 },
    { href: "/caregiver/privacy", label: "Quyền Riêng Tư", icon: Lock },
  ]

  const adminMenuItems = [
    { href: "/admin", label: "Bảng Điều Khiển" },
    { href: "/admin/gestures", label: "Quản Lý Cử Chỉ" },
    { href: "/admin/logs", label: "Nhật Ký Hệ Thống" },
  ]

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/logo_v_hand.png"
              alt="V HAND Logo"
              width={60}
              height={60}
              className="rounded"
              priority
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <Home className="w-4 h-4" />
                  Trang chủ
                </Button>
              </Link>

              <Link href="/gesture-recognition">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <Hand className="w-4 h-4 mr-2" />
                  Nhận diện
                </Button>
              </Link>

              <Link href="/statistics">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Thống kê
                </Button>
              </Link>

              {user.role === "caregiver" && (
                <Link href="/caregiver">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-teal-600">
                    Điều Khiển
                  </Button>
                </Link>
              )}

              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-teal-600">
                    <Settings className="w-4 h-4 mr-2" />
                    Quản trị
                  </Button>
                  
                </Link>
              )}
            </>
          ) : null}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 border border-transparent hover:bg-teal-600">
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground font-semibold">
                    NGƯỜI DÙNG
                  </DropdownMenuItem>
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}

                  {user.role === "caregiver" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground font-semibold">
                        CAREGIVER
                      </DropdownMenuItem>
                      {caregiverMenuItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="cursor-pointer">
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground font-semibold">
                        QUẢN TRỊ
                      </DropdownMenuItem>
                      {adminMenuItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="cursor-pointer">
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      router.push("/login")
                    }}
                    className="text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng Xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="hover:bg-teal-600">
                  Đăng Nhập
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600">Đăng Ký</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="space-y-4 mt-8">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/">
                      <Button variant="ghost" className="w-full justify-start">
                        <Home className="w-4 h-4 mr-2" />
                        Nhận Diện
                      </Button>
                    </Link>
                    {userMenuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button variant="ghost" className="w-full justify-start">
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    {user.role === "caregiver" && (
                      <>
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-semibold text-sm mb-2">Caregiver</h3>
                          {caregiverMenuItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <Button variant="ghost" className="w-full justify-start">
                                <item.icon className="w-4 h-4 mr-2" />
                                {item.label}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                    {user.role === "admin" && (
                      <>
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-semibold text-sm mb-2">Admin</h3>
                          {adminMenuItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <Button variant="ghost" className="w-full justify-start">
                                {item.label}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button className="w-full bg-transparent" variant="outline">
                        Đăng Nhập
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Đăng Ký</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
