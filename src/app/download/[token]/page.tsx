import { redirect } from 'next/navigation'
import DownloadRedirectClient from '@/components/features/download-redirect-client'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function DownloadPage({ params, searchParams }: Props) {
  const { token } = await params
  const { from } = await searchParams

  if (from === 'success') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return <DownloadRedirectClient token={token} isGuest={!user} />
  }

  redirect(`/api/download/${token}`)
}
