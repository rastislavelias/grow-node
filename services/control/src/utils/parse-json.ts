export function parseJson(value: Buffer): unknown {
  try {
    return JSON.parse(value.toString('utf8')) as unknown
  } catch {
    return null
  }
}
