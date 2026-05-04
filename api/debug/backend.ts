export default async function handler(_request: any, response: any) {
  try {
    const server = await import('../../server/index');
    return response.status(200).json({
      ok: true,
      exports: Object.keys(server).sort(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Backend import debug failed:', error);
    return response.status(500).json({
      ok: false,
      message,
      stack: stack?.split('\n').slice(0, 8),
    });
  }
}
