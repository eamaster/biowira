export const onRequest: PagesFunction = async (context) => {
  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    return new Response('Asset not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }
  return response
}
