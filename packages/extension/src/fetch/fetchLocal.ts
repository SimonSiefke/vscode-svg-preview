import * as fs from 'fs'
import * as util from 'util'
import { Fetch } from './types'

const readFile = util.promisify(fs.readFile)

export const fetchLocal: Fetch = async (
  path,
  encoding = 'utf-8'
): Promise<string> => {
  const content = await readFile(path)
  return content.toString(encoding)
}
