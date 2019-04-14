import * as mime from 'mime-types'
import { fetch } from '../fetch/fetch'
import { isRemote } from '../shared/isRemote'

const urlRegex = /url\((.*?)\)/gi

// TODO show error message when fetch fails

async function loadCss(stylesheetUrls: string[]): Promise<string> {
  return (await Promise.all(
    stylesheetUrls.map(async stylesheetUrl => {
      try {
        const css = await fetch(stylesheetUrl)
        const urls = (css.match(urlRegex) || []).map(match =>
          match.replace(urlRegex, '$1')
        )
        let result = css
        await Promise.all(
          urls.map(async url => {
            const base64 = await fetch(url, 'base64')
            const mimeType = mime.lookup(url)
            result = result.replace(url, `data:${mimeType};base64,${base64}`)
          })
        )
        return `<style type="text/css"><![CDATA[${result}]]></style>`
      } catch (error) {
        console.error(error)
      }
      return ''
    })
  )).join('')
}

const stylesheetRegex = /<\?\s*xml-stylesheet\s+.*href="(.+?)".*\s*\?>/gi

export async function loadInlineStyles(
  baseUrl: string,
  svg: string,
  matches: string[]
): Promise<string> {
  const styleUrls: string[] = matches
    .map(match => match.replace(stylesheetRegex, '$1'))
    .map(url => {
      if (isRemote(url)) {
        return url
      }
      return `${baseUrl}/${url}`
    })
  const defsEndIndex = svg.toLowerCase().indexOf('</defs>')
  const $styles = await loadCss(styleUrls)
  if (defsEndIndex === -1) {
    const svgEndIndex = svg.toLowerCase().indexOf('</svg>')
    return `${svg.slice(0, svgEndIndex)}<defs>${$styles}</defs>${svg.slice(
      svgEndIndex,
      svg.length
    )}`
  }
  return `${svg.slice(0, defsEndIndex)}${$styles}${svg.slice(
    defsEndIndex,
    svg.length
  )}`
}
