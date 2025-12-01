"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export default function AdminSettings() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6)
  const [defaultLanguage, setDefaultLanguage] = useState("vi")
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(true)
  const [defaultVoiceGender, setDefaultVoiceGender] = useState("female")
  const [voiceSpeed, setVoiceSpeed] = useState(1)

  const handleSaveSettings = () => {
    const settings = {
      confidenceThreshold,
      defaultLanguage,
      realTimeEnabled,
      dataCollectionEnabled,
      defaultVoiceGender,
      voiceSpeed,
    }
    localStorage.setItem("system_settings", JSON.stringify(settings))
    alert("Cài đặt đã được lưu thành công!")
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">Cài Đặt Hệ Thống</h2>

        <div className="space-y-8">
          {/* Gesture Recognition Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Nhận Diện Cử Chỉ</h3>

            <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="flex justify-between items-center">
                <Label className="text-base">Ngưỡng Confidence Mặc Định</Label>
                <span className="text-lg font-bold text-primary">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={(value) => setConfidenceThreshold(value[0])}
                min={0.3}
                max={0.95}
                step={0.05}
              />
              <p className="text-sm text-muted-foreground">Ngưỡng tối thiểu để chấp nhận một cử chỉ</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div>
                <Label className="text-base">Bật Chế Độ Real-Time</Label>
                <p className="text-sm text-muted-foreground">Nhận diện tự động liên tục</p>
              </div>
              <Switch checked={realTimeEnabled} onCheckedChange={setRealTimeEnabled} />
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div>
                <Label className="text-base">Cho Phép Thu Thập Dữ Liệu</Label>
                <p className="text-sm text-muted-foreground">Cho phép người dùng ghi mẫu</p>
              </div>
              <Switch checked={dataCollectionEnabled} onCheckedChange={setDataCollectionEnabled} />
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4 border-t border-border pt-8">
            <h3 className="text-lg font-semibold text-primary">Cài Đặt Giọng Đọc</h3>

            <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <Label className="text-base">Ngôn Ngữ Mặc Định</Label>
              <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <Label className="text-base">Giới Tính Giọng Đọc</Label>
              <Select value={defaultVoiceGender} onValueChange={setDefaultVoiceGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="flex justify-between items-center">
                <Label className="text-base">Tốc Độ Đọc</Label>
                <span className="text-lg font-bold text-primary">{voiceSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[voiceSpeed]}
                onValueChange={(value) => setVoiceSpeed(value[0])}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
          </div>

          {/* Gesture Dictionary Management */}
          <div className="space-y-4 border-t border-border pt-8">
            <h3 className="text-lg font-semibold text-primary">Quản Lý Từ Điển</h3>
            <Link href="/admin/gestures">
              <Button className="w-full bg-primary hover:bg-primary/90">Quản Lý Cử Chỉ &amp; Câu Nói</Button>
            </Link>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 font-bold text-lg"
          >
            Lưu Cài Đặt
          </Button>
        </div>
      </Card>
    </div>
  )
}
