export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[1.35rem] font-[680] tracking-[0.14em] ${className}`} aria-label="FORMORA">
      FORMORA
    </span>
  );
}
