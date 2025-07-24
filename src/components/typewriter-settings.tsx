"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Settings, Zap, Turtle, Timer } from "lucide-react"

interface TypewriterSettingsProps {
  speed: number
  variableSpeed: boolean
  onSpeedChange: (speed: number) => void
  onVariableSpeedChange: (enabled: boolean) => void
  className?: string
}

export function TypewriterSettings({
  speed,
  variableSpeed,
  onSpeedChange,
  onVariableSpeedChange,
  className
}: TypewriterSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const speedPresets = [
    { name: "Lightning", value: 10, icon: Zap, color: "text-yellow-500" },
    { name: "Fast", value: 20, icon: Timer, color: "text-green-500" },
    { name: "Normal", value: 50, icon: Settings, color: "text-blue-500" },
    { name: "Slow", value: 100, icon: Turtle, color: "text-orange-500" },
  ]

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Typewriter Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Settings Panel */}
          <div className="absolute right-0 top-12 z-50 w-64 bg-background border border-border rounded-lg shadow-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="w-4 h-4" />
              Typewriter Settings
            </div>
            
            {/* Speed Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Typing Speed
              </label>
              <div className="grid grid-cols-2 gap-2">
                {speedPresets.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <button
                      key={preset.value}
                      onClick={() => onSpeedChange(preset.value)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                        speed === preset.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <Icon className={cn("w-3 h-3", preset.color)} />
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Speed Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Custom Speed: {speed}ms
              </label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Variable Speed Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Natural Rhythm
              </label>
              <button
                onClick={() => onVariableSpeedChange(!variableSpeed)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  variableSpeed ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    variableSpeed ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Natural rhythm adds realistic pauses at punctuation and slight speed variations.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
