"use client"

import React from "react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, className, ...rest }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
    if (rest.onChange) rest.onChange(e)
  }

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    ...rest,
    className,
    onChange: handleChange,
  }

  if (typeof checked !== "undefined") {
    ;(inputProps as any).checked = checked
  }

  return <input type="checkbox" {...inputProps} />
}

export default Checkbox
