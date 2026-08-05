type CaptionEditorProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  rows?: number
}

export function CaptionEditor({
  value,
  onChange,
  label = 'Caption (editable)',
  rows = 8,
}: CaptionEditorProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40 resize-y"
      />
    </label>
  )
}
