"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export default function TopLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(true)
    setProgress(20)

    const t1 = setTimeout(() => setProgress(60), 100)
    const t2 = setTimeout(() => setProgress(80), 300)
    const t3 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => { setLoading(false); setProgress(0) }, 300)
    }, 500)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname])

  if (!loading && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-0.5 transition-all duration-300"
      style={{
        width: `${progress}%`,
        background: "var(--accent)",
        boxShadow: "0 0 8px var(--accent-glow)",
        opacity: loading ? 1 : 0,
      }}
    />
  )
}
