export default async function handler(request: any, response: any) {
  try {
    const { default: app } = await import('../server/index');
    return app(request, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Lleken API boot failed:', error);
    return response.status(500).json({
      ok: false,
      error: 'Lleken API boot failed',
      message,
    });
  }
}
