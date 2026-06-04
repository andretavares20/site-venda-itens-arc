type UserTier = "PARTNER" | "VERIFIED_TRADER" | "ELITE_RIDER"

const TIER_CONFIG: Record<UserTier, { label: string; color: string; bg: string }> = {
  PARTNER:         { label: "DropBay Partner",  color: "#0071e3", bg: "rgba(0,113,227,0.12)" },
  VERIFIED_TRADER: { label: "Verified Trader",  color: "#30d158", bg: "rgba(48,209,88,0.12)" },
  ELITE_RIDER:     { label: "Elite Rider",      color: "#bf5af2", bg: "rgba(191,90,242,0.12)" },
}

export function TierBadge({ tier, size = "sm" }: { tier: UserTier | null | undefined; size?: "xs" | "sm" | "md" }) {
  if (!tier) return null
  const cfg = TIER_CONFIG[tier]
  const styles: Record<string, { fontSize: string; px: string; py: string; gap: string }> = {
    xs: { fontSize: "9px",  px: "px-1.5", py: "py-0.5", gap: "gap-0.5" },
    sm: { fontSize: "11px", px: "px-2",   py: "py-0.5", gap: "gap-1" },
    md: { fontSize: "13px", px: "px-2.5", py: "py-1",   gap: "gap-1.5" },
  }
  const s = styles[size]
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap ${s.px} ${s.py}`}
      style={{ background: cfg.bg, color: cfg.color, fontSize: s.fontSize }}
    >
      {cfg.label}
    </span>
  )
}
