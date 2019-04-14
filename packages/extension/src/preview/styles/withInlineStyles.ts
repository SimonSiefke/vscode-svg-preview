import { loadInlineStyles } from './loadInlineStyles'

const stylesheetRegex = /<\?\s*xml-stylesheet\s+.*href="(.+?)".*\s*\?>/gi

/**
 * Inline svg xml stylesheets because otherwise they won't work with html.
 */
export async function withInlineStyles(
  baseUrl: string,
  svg: string
): Promise<string> {
  const svgWithoutComments = svg.replace(/<!--(.*?)-->/g, '')
  const matches = svgWithoutComments.match(stylesheetRegex) || []
  if (matches.length === 0) {
    return svg
  }
  return loadInlineStyles(baseUrl, svg, matches)
}
