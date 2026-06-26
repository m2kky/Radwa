'use client'

import { useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'

interface MediaUploadFieldProps {
  value: string
  onChange: (value: string) => void
  folder: string
  name?: string
  placeholder?: string
  inputClassName?: string
  buttonClassName?: string
  accept?: string
}

const defaultInputClass =
  'w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 transition-colors'

const defaultButtonClass =
  'inline-flex items-center justify-center gap-2 bg-cold-black border border-border px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer hover:border-cyan-glow/40 transition-colors whitespace-nowrap'

export default function MediaUploadField({
  value,
  onChange,
  folder,
  name,
  placeholder = 'https://... أو /api/media?path=...',
  inputClassName = defaultInputClass,
  buttonClassName = defaultButtonClass,
  accept = 'image/*',
}: MediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', folder)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: data,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'فشل رفع الصورة')
      onChange(body.data?.url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col md:flex-row gap-2">
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          placeholder={placeholder}
          dir="ltr"
        />
        <label className={buttonClassName}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'جاري الرفع...' : 'رفع صورة'}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
