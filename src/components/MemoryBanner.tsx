interface MemoryBannerProps {
  memoryContext: string | null;
}

// formatMemoryContext() (src/lib/memory.ts) bakes a deterministic prefix per
// trend — ⚠️ for increasing risk, ✅ for decreasing — so color can be read
// straight off the string without a separate trend prop.
export default function MemoryBanner({ memoryContext }: MemoryBannerProps) {
  if (!memoryContext) return null;

  const colorClass = memoryContext.startsWith('⚠️')
    ? 'text-yellow'
    : memoryContext.startsWith('✅')
      ? 'text-green'
      : 'text-muted';

  return (
    <div className={`w-full border border-border bg-surface px-4 py-2 font-mono text-sm ${colorClass}`}>
      {memoryContext}
    </div>
  );
}
