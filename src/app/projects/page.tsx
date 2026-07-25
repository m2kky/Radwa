import { redirect } from 'next/navigation'

export default async function ProjectsAliasPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
    } else if (typeof value === 'string') {
      query.set(key, value)
    }
  }

  const queryString = query.toString()
  redirect(queryString ? `/portfolio?${queryString}` : '/portfolio')
}
