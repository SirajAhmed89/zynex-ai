"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VisualizerProps {
  isActive: boolean
  className?: string
}

export default function Visualizer({ isActive, className }: VisualizerProps) {
  const animationRef = useRef<number | undefined>(undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [barHeights, setBarHeights] = useState<number[]>(Array(12).fill(0))

  const animate = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    // Calculate bar heights based on frequency data
    const newBarHeights = Array(12).fill(0).map((_, index) => {
      const dataIndex = Math.floor((index * dataArrayRef.current!.length) / 12)
      const value = dataArrayRef.current![dataIndex] || 0
      return (value / 255) * 100 // Convert to percentage
    })

    setBarHeights(newBarHeights)
    animationRef.current = requestAnimationFrame(animate)
  }, [])

  const stopVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    dataArrayRef.current = null
    setBarHeights(Array(12).fill(0))
  }, [])

  const startVisualization = useCallback(async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const audioContext = audioContextRef.current

      // Create analyser
      analyserRef.current = audioContext.createAnalyser()
      const analyser = analyserRef.current
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Create data array
      const bufferLength = analyser.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      // Start animation
      animate()
    } catch (error) {
      console.error('Error starting audio visualization:', error)
    }
  }, [animate])

  useEffect(() => {
    if (isActive) {
      startVisualization()
    } else {
      stopVisualization()
    }

    return () => {
      stopVisualization()
    }
  }, [isActive, startVisualization, stopVisualization])

  if (!isActive) return null

  return (
    <div className={cn("flex items-center justify-center gap-1 px-3 py-2", className)}>
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="bg-red-500 rounded-full transition-all duration-100 ease-out"
          style={{
            width: '3px',
            height: `${Math.max(4, height * 0.4 + 4)}px`, // Minimum height of 4px, max around 44px
            opacity: 0.8 + (height / 100) * 0.2 // Dynamic opacity based on height
          }}
        />
      ))}
    </div>
  )
}
