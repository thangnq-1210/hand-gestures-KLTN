"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Volume2, Palette, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UISettings {
  theme: "light" | "dark" | "system"
  fontSize: number
  buttonSize: "small" | "medium" | "large"
  layout: "simple" | "full"
  highContrast: boolean
  reduceMotion: boolean
}

interface AudioSettings {
  autoSpeak: boolean
  repeatCount: number
  volume: number
  voiceGender: "male" | "female"
  voiceSpeed: number
}

export default function SettingsPage() {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const router = useRouter()
  const [uiSettings, setUiSettings] = useState<UISettings>({
    theme: "system",
    fontSize: 1,
    buttonSize: "medium",
    layout: "full",
    highContrast: false,
    reduceMotion: false,
  })
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    autoSpeak: true,
    repeatCount: 1,
    volume: 100,
    voiceGender: "female",
    voiceSpeed: 1,
  })
  const [disabilityProfile, setDisabilityProfile] = useState<"none" | "light" | "moderate" | "severe">("none")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Load settings from localStorage
    const savedUISettings = localStorage.getItem("ui_settings")
    const savedAudioSettings = localStorage.getItem("audio_settings")

    if (savedUISettings) {
      setUiSettings(JSON.parse(savedUISettings))
    }
    if (savedAudioSettings) {
      setAudioSettings(JSON.parse(savedAudioSettings))
    }
    if (user?.disabilityLevel) {
      setDisabilityProfile(user.disabilityLevel)
    }
  }, [user, isAuthenticated, router])

  const saveUISettings = (settings: UISettings) => {
    setUiSettings(settings)
    localStorage.setItem("ui_settings", JSON.stringify(settings))
    // Apply theme immediately
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark")
    }
  }

  const saveAudioSettings = (settings: AudioSettings) => {
    setAudioSettings(settings)
    localStorage.setItem("audio_settings", JSON.stringify(settings))
  }

  const handleApplyProfile = async (profile: "light" | "moderate" | "severe") => {
    setIsSaving(true)
    try {
      // Auto-configure UI based on profile
      let autoSettings: UISettings = {
        theme: "system",
        fontSize: 1,
        buttonSize: "medium",
        layout: "full",
        highContrast: false,
        reduceMotion: false,
      }

      if (profile === "light") {
        autoSettings = {
          ...autoSettings,
          fontSize: 1.1,
          highContrast: true,
        }
      } else if (profile === "moderate") {
        autoSettings = {
          ...autoSettings,
          fontSize: 1.3,
          buttonSize: "large",
          layout: "simple",
          highContrast: true,
          reduceMotion: true,
        }
      } else if (profile === "severe") {
        autoSettings = {
          ...autoSettings,
          fontSize: 1.5,
          buttonSize: "large",
          layout: "simple",
          highContrast: true,
          reduceMotion: true,
        }
        setAudioSettings((prev) => ({
          ...prev,
          autoSpeak: true,
          volume: 100,
        }))
      }

      saveUISettings(autoSettings)
      setDisabilityProfile(profile)

      await updateProfile({
        disabilityLevel: profile,
      })

      alert(`Đã áp dụng profile hỗ trợ tiếp cận: ${profile}`)
    } finally {
      setIsSaving(false)
    }
  }

  const testVoice = (text = "Xin chào") => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = audioSettings.voiceSpeed
    utterance.volume = audioSettings.volume / 100
    window.speechSynthesis.speak(utterance)
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Quay lại
        </Link>

        <h1 className="text-4xl font-bold text-primary mb-2">Cài Đặt Tiếp Cận</h1>
        <p className="text-muted-foreground mb-8">Tùy chỉnh giao diện và âm thanh để phù hợp với nhu cầu của bạn</p>

        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles">Profile</TabsTrigger>
            <TabsTrigger value="ui">Giao Diện</TabsTrigger>
            <TabsTrigger value="audio">Âm Thanh</TabsTrigger>
            <TabsTrigger value="help">Trợ Giúp</TabsTrigger>
          </TabsList>

          {/* Accessibility Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Chọn một profile hỗ trợ tiếp cận để tự động điều chỉnh giao diện phù hợp với nhu cầu của bạn.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  disabilityProfile === "none" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleApplyProfile("light")}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Không Cần Hỗ Trợ</h3>
                <p className="text-muted-foreground text-sm mb-4">Giao diện tiêu chuẩn với tất cả tính năng</p>
                <Button className="w-full" variant={disabilityProfile === "none" ? "default" : "outline"}>
                  {disabilityProfile === "none" ? "Đang Sử Dụng" : "Chọn"}
                </Button>
              </Card>

              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  disabilityProfile === "light" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleApplyProfile("light")}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Hỗ Trợ Nhẹ</h3>
                <p className="text-muted-foreground text-sm mb-4">Font chữ to hơn, độ tương phản cao</p>
                <Button
                  className="w-full"
                  variant={disabilityProfile === "light" ? "default" : "outline"}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang áp dụng..." : disabilityProfile === "light" ? "Đang Sử Dụng" : "Chọn"}
                </Button>
              </Card>

              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  disabilityProfile === "moderate" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleApplyProfile("moderate")}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Hỗ Trợ Trung Bình</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Giao diện đơn giản, nút to, ít chức năng, không hoạt ảnh
                </p>
                <Button
                  className="w-full"
                  variant={disabilityProfile === "moderate" ? "default" : "outline"}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang áp dụng..." : disabilityProfile === "moderate" ? "Đang Sử Dụng" : "Chọn"}
                </Button>
              </Card>

              <Card
                className={`border-2 p-6 cursor-pointer transition-all ${
                  disabilityProfile === "severe" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleApplyProfile("severe")}
              >
                <h3 className="text-xl font-bold text-primary mb-3">Hỗ Trợ Nặng</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Tối giản, text-to-speech tự động, tất cả nút lớn tối đa
                </p>
                <Button
                  className="w-full"
                  variant={disabilityProfile === "severe" ? "default" : "outline"}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang áp dụng..." : disabilityProfile === "severe" ? "Đang Sử Dụng" : "Chọn"}
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* UI Settings Tab */}
          <TabsContent value="ui" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Palette className="w-6 h-6" />
                Cài Đặt Giao Diện
              </h2>

              {/* Theme */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <Label className="text-base">Chủ Đề</Label>
                <Select
                  value={uiSettings.theme}
                  onValueChange={(value) => saveUISettings({ ...uiSettings, theme: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Sáng</SelectItem>
                    <SelectItem value="dark">Tối</SelectItem>
                    <SelectItem value="system">Theo Hệ Thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Kích Thước Chữ</Label>
                  <span className="text-lg font-bold text-primary">{(uiSettings.fontSize * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[uiSettings.fontSize]}
                  onValueChange={(value) => saveUISettings({ ...uiSettings, fontSize: value[0] })}
                  min={0.8}
                  max={1.5}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">Xem trước: Đây là kích thước chữ hiện tại</p>
              </div>

              {/* Button Size */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <Label className="text-base">Kích Thước Nút</Label>
                <Select
                  value={uiSettings.buttonSize}
                  onValueChange={(value) => saveUISettings({ ...uiSettings, buttonSize: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Nhỏ</SelectItem>
                    <SelectItem value="medium">Vừa</SelectItem>
                    <SelectItem value="large">To</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Layout */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <Label className="text-base">Bố Cục</Label>
                <Select
                  value={uiSettings.layout}
                  onValueChange={(value) => saveUISettings({ ...uiSettings, layout: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Đơn Giản (Ít Chức Năng)</SelectItem>
                    <SelectItem value="full">Đầy Đủ (Tất Cả Chức Năng)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base">Độ Tương Phản Cao</Label>
                  <p className="text-sm text-muted-foreground">Tăng độ tương phản cho dễ nhìn</p>
                </div>
                <Switch
                  checked={uiSettings.highContrast}
                  onCheckedChange={(checked) => saveUISettings({ ...uiSettings, highContrast: checked })}
                />
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base">Giảm Hoạt Ảnh</Label>
                  <p className="text-sm text-muted-foreground">Tắt hoạt ảnh và chuyển động</p>
                </div>
                <Switch
                  checked={uiSettings.reduceMotion}
                  onCheckedChange={(checked) => saveUISettings({ ...uiSettings, reduceMotion: checked })}
                />
              </div>
            </Card>
          </TabsContent>

          {/* Audio Settings Tab */}
          <TabsContent value="audio" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Volume2 className="w-6 h-6" />
                Cài Đặt Âm Thanh
              </h2>

              {/* Auto Speak */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div>
                  <Label className="text-base">Đọc Tự Động</Label>
                  <p className="text-sm text-muted-foreground">Phát âm khi nhận diện cử chỉ</p>
                </div>
                <Switch
                  checked={audioSettings.autoSpeak}
                  onCheckedChange={(checked) => saveAudioSettings({ ...audioSettings, autoSpeak: checked })}
                />
              </div>

              {/* Volume */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Âm Lượng</Label>
                  <span className="text-lg font-bold text-primary">{audioSettings.volume}%</span>
                </div>
                <Slider
                  value={[audioSettings.volume]}
                  onValueChange={(value) => saveAudioSettings({ ...audioSettings, volume: value[0] })}
                  min={0}
                  max={100}
                  step={10}
                />
              </div>

              {/* Voice Speed */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Tốc Độ Đọc</Label>
                  <span className="text-lg font-bold text-primary">{audioSettings.voiceSpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[audioSettings.voiceSpeed]}
                  onValueChange={(value) => saveAudioSettings({ ...audioSettings, voiceSpeed: value[0] })}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>

              {/* Repeat Count */}
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <Label className="text-base">Số Lần Phát Lại</Label>
                <Select
                  value={audioSettings.repeatCount.toString()}
                  onValueChange={(value) =>
                    saveAudioSettings({
                      ...audioSettings,
                      repeatCount: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 lần</SelectItem>
                    <SelectItem value="2">2 lần</SelectItem>
                    <SelectItem value="3">3 lần</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Voice */}
              <Button
                onClick={() => testVoice("Xin chào, đây là giọng đọc của bạn")}
                className="w-full bg-accent hover:bg-accent/90 text-white py-6 font-bold text-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Nghe Thử Giọng Đọc
              </Button>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card className="border-2 border-primary/20 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-primary mb-4">Trợ Giúp Tiếp Cận</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Phím Tắt Bàn Phím</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <kbd className="px-2 py-1 bg-muted rounded">Tab</kbd> - Di chuyển giữa các nút
                    </li>
                    <li>
                      <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> - Kích hoạt nút hiện tại
                    </li>
                    <li>
                      <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> - Kích hoạt switch/checkbox
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2">Độ Tương Phản</h3>
                  <p className="text-sm text-muted-foreground">
                    Bật "Độ Tương Phản Cao" để tăng độ phân biệt giữa màu sắc, giúp dễ nhìn hơn.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2">Text-to-Speech</h3>
                  <p className="text-sm text-muted-foreground">
                    Bật "Đọc Tự Động" trong cài đặt Âm Thanh để ứng dụng tự động đọc lên kết quả nhận diện.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2">Hỗ Trợ Trình Đọc Màn Hình</h3>
                  <p className="text-sm text-muted-foreground">
                    Ứng dụng hỗ trợ các trình đọc màn hình phổ biến. Tất cả các phần tử UI đều có ARIA labels.
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
