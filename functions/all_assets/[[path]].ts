export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const targetUrl = new URL(url.pathname + url.search, 'https://biowira.dpdns.org')
  const newRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers
  })
  const response = await fetch(newRequest)
  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', '*')
  newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
