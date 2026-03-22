"use client"

import { useRef, useState, useCallback, useEffect } from "react"

interface ResizablePanelsProps {
  left: React.ReactNode
  right: React.ReactNode
}

export function ResizablePanels({ left, right }: ResizablePanelsProps) {
  const [leftPct, setLeftPct] = useState(58)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(75, Math.max(30, pct)))
    }

    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex h-full">
      <div style={{ width: `${leftPct}%` }} className="flex flex-col min-w-0">
        {left}
      </div>
      <div
        className="w-1 bg-[#313244] hover:bg-[#585b70] cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={onMouseDown}
      />
      <div style={{ width: `${100 - leftPct - 0.5}%` }} className="flex flex-col min-w-0">
        {right}
      </div>
    </div>
  )
}
