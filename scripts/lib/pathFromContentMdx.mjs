import path from 'node:path'

/**
 * @param {string} posixRel path relative to content/, using forward slashes, ending in .mdx
 * @returns {string} URL path e.g. /players/foo
 */
export function pathFromContentMdx(posixRel) {
  if (!posixRel.endsWith('.mdx')) {
    throw new Error(`Expected .mdx file, got: ${posixRel}`)
  }
  let rel = posixRel.slice(0, -4)
  if (rel === 'index') return '/'
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length)
  return `/${rel}`
}

/**
 * @param {string} absFile absolute path to file under content/
 * @param {string} contentDir absolute path to content/
 */
export function pathFromContentFile(absFile, contentDir) {
  const rel = path.relative(contentDir, absFile).split(path.sep).join('/')
  return pathFromContentMdx(rel)
}
