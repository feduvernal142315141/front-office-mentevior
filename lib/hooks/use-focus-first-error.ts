"use client"

import { useEffect, useRef } from "react"
import type { FieldErrors } from "react-hook-form"

type FocusableRef = React.RefObject<HTMLInputElement | HTMLButtonElement | null>

interface FieldEntry {
  key: string
  ref: FocusableRef
}

export function useFocusFirstError(
  errors: FieldErrors,
  submitCount: number,
  fields: FieldEntry[],
) {
  const lastSubmitCount = useRef(0)

  useEffect(() => {
    if (submitCount === 0 || submitCount === lastSubmitCount.current) return
    lastSubmitCount.current = submitCount

    const firstErrorField = fields.find(({ key }) => {
      const parts = key.split(".")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let node: any = errors
      for (const part of parts) {
        if (node == null) return false
        node = node[part]
      }
      return node != null
    })

    if (firstErrorField?.ref.current) {
      firstErrorField.ref.current.focus()
    }
  }, [submitCount, errors, fields])
}
