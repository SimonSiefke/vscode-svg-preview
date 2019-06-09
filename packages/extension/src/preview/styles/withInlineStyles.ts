const stylesheetRegex = /<\?\s*xml-stylesheet\s+.*href="(.+?)".*\s*\?>/gi

/**
 * Inline svg xml stylesheets because otherwise they won't work with html.
 */
export async function withInlineStyles(
  baseUrl: string,
  svg: string
): Promise<string> {
  if (!svg) {
    return ''
  }
  const svgWithoutComments = svg.replace(/<!--(.*?)-->/g, '')
  const matches = svgWithoutComments.match(stylesheetRegex)
  if (!matches) {
    return svg
  }
  const { loadInlineStyles } = await import('./loadInlineStyles')
  return loadInlineStyles(baseUrl, svg, matches)
}
