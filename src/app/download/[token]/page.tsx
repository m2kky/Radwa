import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

export default async function DownloadPage({ params }: Props) {
  const { token } = await params
  redirect(`/api/download/${token}`)
}
