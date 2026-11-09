import app from '../../worker/src/index'

export const onRequest: PagesFunction<{ DB: D1Database; GEMINI_API_KEY?: string; ELEVENLABS_API_KEY?: string }> = async (context) => {
  return app.fetch(context.request, context.env, context)
}

