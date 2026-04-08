export default function Api(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  return `${baseUrl}${path}`
}
