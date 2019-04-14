import * as http from 'http'
import * as https from 'https'
import { Fetch } from './types'

export const fetchRemote: Fetch = async (
  url,
  encoding = 'utf-8'
): Promise<string> => {
  const promise = new Promise<string>((resolve, reject) => {
    const agent = url.startsWith('https') ? https : http
    const req = agent
      .get(url, res => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Status code ${res.statusCode} returned when trying to fetch file`
            )
          )
          return false
        }
        res.setEncoding(encoding)
        let body = ''
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          resolve(body)
          req.end()
        })
        res.resume()
        return true
      })
      .on('error', error => {
        reject(error)
      })
    req.end()
  })
  return promise
}
