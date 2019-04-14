import { fetchRemote } from './fetchRemote'
import { fetchLocal } from './fetchLocal'
import { Fetch } from './types'

const remoteRegex = /^https?/

export const fetch: Fetch = async (url, encoding): Promise<string> => {
  const isRemote = remoteRegex.test(url)
  if (isRemote) {
    return fetchRemote(url, encoding)
  }
  return fetchLocal(url, encoding)
}
