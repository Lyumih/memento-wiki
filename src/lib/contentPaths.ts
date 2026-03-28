/** Relative path inside content/, forward slashes, ends with .mdx */
export function pathFromContentMdx(posixRel: string): string {
  if (!posixRel.endsWith('.mdx')) {
    throw new Error(`Expected .mdx file, got: ${posixRel}`)
  }
  let rel = posixRel.slice(0, -4)
  if (rel === 'index') return '/'
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length)
  return `/${rel}`
}

export function globKeyToRelMdx(globKey: string): string {
  const n = globKey.replace(/\\/g, '/')
  const i = n.indexOf('/content/')
  if (i < 0) {
    throw new Error(`No /content/ in ${globKey}`)
  }
  return n.slice(i + '/content/'.length)
}
