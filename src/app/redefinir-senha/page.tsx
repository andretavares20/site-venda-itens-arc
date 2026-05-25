import { Suspense } from "react"
import RedefinirSenhaForm from "./form"

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
