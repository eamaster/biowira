export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const targetUrl = new URL(url.pathname + url.search, 'https://biowira-api.smah0085.workers.dev')
  const newRequest = new Request(targetUrl.toString(), context.request)
  return fetch(newRequest)
}

