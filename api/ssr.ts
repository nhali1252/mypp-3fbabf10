import serverEntry from '../dist/server/index.js';

const server = serverEntry?.fetch ? serverEntry : serverEntry?.default ?? serverEntry;

function setNodeResponse(res: any, response: Response) {
  res.statusCode = response.status;

  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
      res.setHeader(name, value);
    } else {
      res.setHeader(name, value);
    }
  });
}

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  try {
    if (!server || typeof server.fetch !== 'function') {
      console.error('Server entry point not found or missing fetch method');
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Server initialization failed');
      return;
    }

    const host = req.headers.host ?? 'localhost';
    const protocol = req.headers['x-forwarded-proto'] ?? 'https';
    const url = new URL(req.url ?? '/', `${protocol}://${host}`);

    const init: RequestInit = {
      method: req.method || 'GET',
      headers: req.headers as HeadersInit,
    };

    if (!['GET', 'HEAD'].includes(req.method || 'GET') && req.body) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(url.toString(), init);
    const response = await server.fetch(request);

    setNodeResponse(res, response);

    if (response.body) {
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    } else {
      res.end();
    }
  } catch (error: unknown) {
    console.error('SSR handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}
