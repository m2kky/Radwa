'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo, ImagePlus, Loader2 } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const buttonClass =
  'inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-cyan-glow/50'

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب المحتوى...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const sync = () => {
    onChange(editorRef.current?.innerHTML ?? '')
  }

  const run = (command: string, promptText?: string) => {
    if (command === 'createLink') {
      const url = window.prompt(promptText ?? 'ضع الرابط')
      if (!url) return
      document.execCommand(command, false, url)
    } else {
      document.execCommand(command)
    }
    sync()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'portfolio/content')

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: data,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'فشل رفع الصورة')
      
      const url = body.data?.url
      if (url) {
        document.execCommand('insertImage', false, url)
        sync()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const isEmpty = !value || value === '<p><br></p>' || value === '<br>'

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-cold-black">
      <div className="flex flex-wrap gap-2 p-2 border-b border-border bg-cold-dark">
        <button type="button" className={buttonClass} onClick={() => run('bold')}>
          <Bold size={14} />
        </button>
        <button type="button" className={buttonClass} onClick={() => run('italic')}>
          <Italic size={14} />
        </button>
        <button type="button" className={buttonClass} onClick={() => run('insertUnorderedList')}>
          <List size={14} />
        </button>
        <button type="button" className={buttonClass} onClick={() => run('insertOrderedList')}>
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => run('createLink', 'أدخل رابط القسم أو المقال')}
        >
          <LinkIcon size={14} />
        </button>
        <label className={`${buttonClass} cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
        </label>
        <button type="button" className={buttonClass} onClick={() => run('undo')}>
          <Undo size={14} />
        </button>
        <button type="button" className={buttonClass} onClick={() => run('redo')}>
          <Redo size={14} />
        </button>
      </div>

      <div className="relative">
        {isEmpty && (
          <span className="absolute top-3 right-4 text-xs text-muted-foreground pointer-events-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          dir="rtl"
          onInput={sync}
          className="min-h-60 p-4 text-sm text-foreground focus:outline-none prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-img:rounded-xl prose-img:max-h-[500px] prose-img:object-cover prose-img:my-4"
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}
