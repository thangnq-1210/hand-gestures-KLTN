"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminSystemStatus() {
  const systemStatus = [
    { name: "API Server", status: "online", responseTime: "45ms" },
    { name: "Database", status: "online", responseTime: "12ms" },
    { name: "Cache", status: "online", responseTime: "2ms" },
    { name: "Storage", status: "online", responseTime: "89ms" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-primary mb-4">Trạng Thái Hệ Thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemStatus.map((service) => (
            <Card key={service.name} className="border-2 border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-foreground">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.responseTime}</p>
                  </div>
                </div>
                <span className="text-sm px-3 py-1 rounded bg-green-500/10 text-green-600 font-medium">
                  {service.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <h3 className="text-xl font-bold text-primary mb-4">Lỗi Gần Đây</h3>
        <Card className="border-2 border-border p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Camera Permission Denied</p>
                <p className="text-sm text-muted-foreground">Người dùng: user@example.com | 2024-11-24 10:23</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
