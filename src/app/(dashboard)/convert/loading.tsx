// Instant loading skeleton shown while page JS loads
// Next.js shows this file automatically during navigation
export default function Loading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-brand-card border border-brand-border" />
      <div className="h-36 rounded-2xl bg-brand-card border border-brand-border" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-brand-card border border-brand-border" />
        <div className="h-20 rounded-2xl bg-brand-card border border-brand-border" />
      </div>
      <div className="h-48 rounded-2xl bg-brand-card border border-brand-border" />
      <div className="h-12 rounded-xl bg-brand-card border border-brand-border" />
    </div>
  );
}
