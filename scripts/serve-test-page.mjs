import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const port = 4173;
const fixture = path.resolve('test/manual-fixture.html');
const server = createServer((request, response) => {
    if (request.url !== '/' && request.url !== '/manual-fixture.html') {
        response.writeHead(404).end('Not found');
        return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(fixture).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Manual test page: http://127.0.0.1:${port}/`);
});

