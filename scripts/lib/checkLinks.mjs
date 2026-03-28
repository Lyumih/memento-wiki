/**
 * @param {{ knownPaths: Set<string>, files: { path: string, text: string }[] }} opts
 */
export function checkLinks(opts) {
  const { knownPaths, files } = opts
  const re = /\]\(\/[^)]+\)/g
  for (const file of files) {
    let m
    while ((m = re.exec(file.text)) !== null) {
      const href = m[0].slice(2, -1)
      const pathOnly = href.split(/[?#]/)[0]
      if (!pathOnly.startsWith('/')) continue
      const normalized = pathOnly.replace(/\/$/, '') || '/'
      if (!knownPaths.has(normalized)) {
        console.warn(`[checkLinks] Unknown internal link ${href} in ${file.path}`)
      }
    }
  }
}
