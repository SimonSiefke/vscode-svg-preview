export function isRemote(url: string): boolean {
  return /^https?/.test(url)
}
