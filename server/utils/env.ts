export function getEnv(event: any) {
  // Production: Cloudflare Workers bindings
  const cf = (event.context as any)?.cloudflare?.env
  if (cf) return cf

  // Dev: process.env fallback (wrangler .dev.vars or shell env)
  return process.env
}
