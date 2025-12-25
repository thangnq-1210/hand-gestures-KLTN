"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Hand, Zap, Users, BarChart3, Lock, Accessibility, Sparkles, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex items-center">
        {/* Background overlay pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-0 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 z-10">
            <div className="space-y-6">
              <p className="text-teal-400 font-semibold text-base">Hệ thống</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-white">
                Nhận Diện Cử Chỉ Tay Hỗ Trợ Người Khiếm Khuyết
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Công nghệ AI tiên tiến chuyển đổi cử chỉ tay thành văn bản và giọng nói tự nhiên. Hỗ trợ giao tiếp hiệu
                quả cho 230,000+ người khiếm khuyết tại Việt Nam.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/gesture-recognition" className="flex-1 sm:flex-none">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3 text-base font-semibold rounded-full bg-teal-500 hover:bg-teal-600 text-slate-900 group transition-all"
                >
                  Dùng thử miễn phí
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-slate-300 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Miễn phí hoàn toàn</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Không cài đặt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Bảo mật dữ liệu</span>
              </div>
            </div>
          </div>

          {/* Right Image Placeholder */}
          <Link href="/gesture-recognition">
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-sm h-96 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-2xl border-2 border-teal-500/30 flex items-center justify-center overflow-hidden group hover:border-teal-500/50 transition-colors">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute top-10 left-10 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-40"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-40"></div>
              </div>
              <div className="text-center z-10">
                <Hand className="w-32 h-32 text-teal-400/40 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Nhận diện cử chỉ tay theo thời gian thực</p>
              </div>
            </div>
          </div>
          </Link>
        </div>
      </section>

      <section className="py-24 px-4 bg-background border-y border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 rounded-full border border-teal-500/20">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-teal-500">Tính năng nổi bật</span>
            </div>
            <h2 className="text-5xl font-bold text-foreground">Công nghệ tiên tiến cho bạn</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tất cả công cụ bạn cần để giao tiếp hiệu quả, được thiết kế đặc biệt cho người khiếm khuyết
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Hand,
                title: "Nhận Diện Cử Chỉ Tay",
                description:
                  "AI nhận diện cử chỉ tay theo thời gian thực với độ chính xác cao, hỗ trợ 6+ cử chỉ cơ bản",
                color: "primary",
              },
              {
                icon: Zap,
                title: "Phát Âm Tự Động",
                description: "Chuyển đổi cử chỉ thành giọng nói tự nhiên bằng tiếng Việt, hỗ trợ nhiều giọng khác nhau",
                color: "secondary",
              },
              {
                icon: Accessibility,
                title: "Hỗ Trợ Tiếp Cận Toàn Diện",
                description: "Tùy chỉnh giao diện cho người khiếm khuyết, hỗ trợ 4 mức độ tiếp cận khác nhau",
                color: "accent",
              },
              {
                icon: Users,
                title: "Quản Lý Người Chăm Sóc",
                description:
                  "Người chăm sóc có thể quản lý nhiều người dùng, theo dõi tiến trình và tùy chỉnh trên cơ sở từng cá nhân",
                color: "primary",
              },
              {
                icon: BarChart3,
                title: "Thống Kê & Báo Cáo",
                description:
                  "Xem chi tiết thống kê sử dụng, cử chỉ được dùng nhiều nhất, và tiến trình cải thiện theo thời gian",
                color: "secondary",
              },
              {
                icon: Lock,
                title: "Bảo Mật & Riêng Tư",
                description: "Dữ liệu được mã hóa, không lưu trữ hình ảnh, kiểm soát quyền riêng tư hoàn toàn",
                color: "accent",
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              const colorClasses = {
                primary: "bg-primary/10 text-primary",
                secondary: "bg-secondary/10 text-secondary",
                accent: "bg-accent/10 text-accent",
              }
              return (
                <Card
                  key={i}
                  className="p-8 bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colorClasses[feature.color as "primary" | "secondary" | "accent"]} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link href="/gesture-recognition">
              <Button
                size="lg"
                className="px-8 py-6 text-base font-semibold rounded-lg bg-teal-500 hover:bg-teal-600"
              >
                Khám Phá Tất Cả Tính Năng
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Tại Sao Chọn Chúng Tôi?</h2>
            <p className="text-lg text-muted-foreground">Giải pháp toàn diện cho giao tiếp không giới hạn</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Công Nghệ AI Tiên Tiến",
                description:
                  "Sử dụng mô hình học máy hiện đại có độ chính xác cao, tốc độ xử lý nhanh, và độ trễ thấp hơn 100ms",
                icon: Sparkles,
              },
              {
                title: "Dễ Sử Dụng & Trực Quan",
                description:
                  "Giao diện đơn giản, không cần đào tạo, thích hợp với mọi độ tuổi từ trẻ em đến người lớn tuổi",
                icon: CheckCircle2,
              },
              {
                title: "Hỗ Trợ Người Khiếm Khuyết",
                description:
                  "Thiết kế đặc biệt cho người khiếm khuyết thính, khiếm khuyết vận động, khiếm khuyết nhận thức",
                icon: Accessibility,
              },
              {
                title: "Hoàn Toàn Miễn Phí",
                description:
                  "Không có chi phí ẩn, không có quảng cáo, không cần đăng ký thẻ tín dụng",
                icon: Lock,
              },
            ].map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="flex gap-6 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/20 text-primary font-bold group-hover:bg-primary/30 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-y border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-foreground">Sẵn Sàng Bắt Đầu?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Trải nghiệm công nghệ nhận diện cử chỉ tay ngay bây giờ. Hoàn toàn miễn phí, không cần đăng ký hay cài
              đặt.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/gesture-recognition" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg bg-teal-500 hover:bg-teal-600"
              >
                Dùng Thử Miễn Phí
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Sản Phẩm</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Nhận Diện Cử Chỉ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Hỗ Trợ Tiếp Cận
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Công Ty</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Tư vấn dịch vụ: 0388859175
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Về chúng tôi
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Hỗ Trợ</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Hướng Dẫn
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Câu Hỏi Thường Gặp
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Pháp Lý</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Quyền Riêng Tư
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Điều Khoản Dịch Vụ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <p>&copy; 2025 V - HAND. Hệ thống nhận diện cử chỉ tay hỗ trợ người khiếm khuyết</p>
            <p>Được xây dựng với mong muốn mang lại giá trị tích cực cho xã hội.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
