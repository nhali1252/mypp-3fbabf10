let serverEntry: any;

try {
  serverEntry = require('../dist/server/server.js');
} catch (e) {
  // Fallback for ESM environments
  console.log('Failed to require server, will attempt dynamic import on request');
}

export const config = {
  runtime: 'nodejs',
};

async function getServer() {
  if (serverEntry) {
    if (serverEntry?.fetch) return serverEntry;
    if (serverEntry?.default?.fetch) return serverEntry.default;
    return serverEntry;
  }

  try {
    const imported = await import('../dist/server/server.js');
    if (imported?.fetch) return imported;
    if (imported?.default?.fetch) return imported.default;
    return imported;
  } catch (e) {
    console.error('Failed to import server:', e);
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const server = await getServer();
    
    if (!server || typeof server.fetch !== 'function') {
      console.error('Server entry not found or invalid:', { hasServer: !!server, hasFetch: server?.fetch ? true : false });
      return new Response('Server initialization failed', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const response = await server.fetch(request);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('SSR handler error:', {
      message: errorMessage,
      stack: errorStack,
      url: request.url,
      method: request.method
    });

    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
