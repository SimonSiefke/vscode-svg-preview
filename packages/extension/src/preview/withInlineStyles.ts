import mime from 'mime-types'
import { fetch } from '../fetch/fetch'
import { isRemote } from '../util'

const stylesheetRegex = /<\?\s*xml-stylesheet\s+.*href="(.+?)".*\s*\?>/gi
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

/**
 * Inline svg xml stylesheets because otherwise they won't work with html.
 */
export async function withInlineStyles(
  baseUrl: string,
  svg: string
): Promise<string> {
  const svgWithoutComments = svg.replace(/<!--(.*?)-->/g, '')
  const styleUrls: string[] = (svgWithoutComments.match(stylesheetRegex) || [])
    .map(match => match.replace(stylesheetRegex, '$1'))
    .map(url => {
      if (isRemote(url)) {
        return url
      }
      return `${baseUrl}/${url}`
    })
  const defsEndIndex = svg.toLowerCase().indexOf('</defs>')
  if (defsEndIndex === -1) {
    const svgEndIndex = svg.toLowerCase().indexOf('</svg>')
    return `${svg.slice(0, svgEndIndex)}<defs>${await loadCss(
      styleUrls
    )}</defs>${svg.slice(svgEndIndex, svg.length)}`
  }
  return `${svg.slice(0, defsEndIndex)}${await loadCss(styleUrls)}${svg.slice(
    defsEndIndex,
    svg.length
  )}`
}
