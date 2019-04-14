import { fetchRemote } from './fetchRemote'
import { fetchLocal } from './fetchLocal'
import { Fetch } from './types'
import { isRemote } from '../shared/isRemote';

export const fetch: Fetch = async (url, encoding): Promise<string> =>
  isRemote(url) ? fetchRemote(url, encoding) : fetchLocal(url, encoding)
