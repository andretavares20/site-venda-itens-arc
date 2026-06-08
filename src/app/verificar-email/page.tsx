import { Suspense } from "react"
import VerificarEmailForm from "./form"

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <VerificarEmailForm />
    </Suspense>
  )
}
