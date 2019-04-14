export type Fetch = (
  url: string,
  encoding?: 'utf-8' | 'base64'
) => Promise<string>
