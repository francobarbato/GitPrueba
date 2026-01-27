"use client"

import React from "react"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | null | undefined
  onSelect?: (date: Date | null) => void
  initialFocus?: boolean
  locale?: any
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect }) => {
  const value = selected ? selected.toISOString().slice(0, 10) : ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!v) return onSelect?.(null)
    const d = new Date(v + "T00:00:00")
    onSelect?.(d)
  }

  return (
    <div className="p-4">
      <input
        type="date"
        value={value}
        onChange={handleChange}
        className="border rounded px-2 py-1"
        aria-label="Seleccionar fecha"
      />
    </div>
  )
}

export default Calendar
