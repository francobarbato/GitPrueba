"use client"

import { useCallback } from "react"

type ToastOptions = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = useCallback((opts: ToastOptions) => {
    if (typeof window === "undefined") {
      console.log("toast", opts)
      return
    }

    const containerId = "app-toast-container"
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement("div")
      container.id = containerId
      container.style.position = "fixed"
      container.style.top = "1rem"
      container.style.right = "1rem"
      container.style.zIndex = "9999"
      document.body.appendChild(container)
    }

    const el = document.createElement("div")
    el.style.padding = "8px 12px"
    el.style.marginTop = "8px"
    el.style.borderRadius = "6px"
    el.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)"
    el.style.maxWidth = "320px"
    el.style.fontSize = "14px"
    el.style.lineHeight = "1.2"
    el.style.color = "#0f172a"
    el.style.background = opts.variant === "destructive" ? "#fee2e2" : "#f0fdf4"

    const title = document.createElement("div")
    title.style.fontWeight = "600"
    title.textContent = opts.title

    el.appendChild(title)

    if (opts.description) {
      const desc = document.createElement("div")
      desc.style.marginTop = "4px"
      desc.textContent = opts.description
      el.appendChild(desc)
    }

    container.appendChild(el)

    // Auto-remove
    setTimeout(() => {
      el.style.opacity = "0"
      el.style.transition = "opacity 250ms"
      setTimeout(() => {
        if (el.parentElement) el.parentElement.removeChild(el)
        // remove container if empty
        if (container && container.childElementCount === 0 && container.parentElement) container.parentElement.removeChild(container)
      }, 260)
    }, 3000)
  }, [])

  return { toast }
}

export default useToast
