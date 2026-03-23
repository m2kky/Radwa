import { redirect } from 'next/navigation'
import DownloadRedirectClient from '@/components/features/download-redirect-client'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function DownloadPage({ params, searchParams }: Props) {
  const { token } = await params
  const { from } = await searchParams

  if (from === 'success') {
    return <DownloadRedirectClient token={token} />
  }

  redirect(`/api/download/${token}`)
}
