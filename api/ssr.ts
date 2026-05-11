export const config = {
  runtime: 'nodejs',
};

function normalizeServerModule(serverModule: any) {
  if (!serverModule) return null;
  if (typeof serverModule === 'function') return serverModule;
  if (typeof serverModule.fetch === 'function') return serverModule.fetch.bind(serverModule);
  if (serverModule.default && typeof serverModule.default === 'function') return serverModule.default;
  if (serverModule.default?.fetch) return serverModule.default.fetch.bind(serverModule.default);
  return null;
}

async function loadServerHandler() {
  try {
    // @ts-expect-error - dist/server/server.js is the Vite SSR build output (no .d.ts file).
    // It is guaranteed to exist at runtime thanks to vercel.json includeFiles + build order.
    const imported = await import('../dist/server/server.js');
    return normalizeServerModule(imported);
  } catch (error: unknown) {
    console.error('Failed to load server module:', error);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const serverHandler = await loadServerHandler();

  if (!serverHandler) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Server initialization failed');
    return;
  }

  try {
    const host = req.headers.host ?? 'localhost';
    const protocol = req.headers['x-forwarded-proto'] ?? 'https';
    const url = new URL(req.url ?? '/', `${protocol}://${host}`);

    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : req,
    });

    const response = await serverHandler(request);

    res.statusCode = response.status;
    response.headers.forEach((value: string, name: string) => {
      res.setHeader(name, value);
    });

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (error: unknown) {
    console.error('SSR handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}