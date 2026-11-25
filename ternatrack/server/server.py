# -*- coding: utf-8 -*-
"""
TERNATRACK - Jython static web server.

Serves the HTML/CSS/JS front-end using the JDK's built-in HTTP server,
so it needs nothing except Jython 2.7 and Java 8+.

Run from the project root:
    jython server/server.py            # http://localhost:8080
    jython server/server.py 9000       # custom port
"""
from __future__ import print_function
import sys
import os

from java.net import InetSocketAddress
from java.nio.file import Files, Paths
from java.util.concurrent import Executors
from com.sun.net.httpserver import HttpServer, HttpHandler

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.woff2': 'font/woff2',
}

# Only these folders/files are ever served (keeps server/, .git, etc. private).
PUBLIC = ('index.html', 'css', 'js', 'assets')


def send(exchange, code, body, ctype='text/plain; charset=utf-8'):
    if isinstance(body, unicode):
        body = body.encode('utf-8')
    exchange.getResponseHeaders().add('Content-Type', ctype)
    exchange.getResponseHeaders().add('X-Content-Type-Options', 'nosniff')
    exchange.sendResponseHeaders(code, len(body))
    out = exchange.getResponseBody()
    out.write(body)
    out.close()


class StaticHandler(HttpHandler):
    def handle(self, exchange):
        try:
            if exchange.getRequestMethod() not in ('GET', 'HEAD'):
                return send(exchange, 405, 'Method not allowed')
            path = exchange.getRequestURI().getPath()
            if path == '/' or path == '':
                path = '/index.html'
            rel = os.path.normpath(path.lstrip('/'))
            full = os.path.abspath(os.path.join(ROOT, rel))
            # block path traversal and anything outside the public list
            if not full.startswith(ROOT + os.sep):
                return send(exchange, 403, 'Forbidden')
            top = rel.replace('\\', '/').split('/')[0]
            if top not in PUBLIC or not os.path.isfile(full):
                return send(exchange, 404, 'Not found')
            ext = os.path.splitext(full)[1].lower()
            data = Files.readAllBytes(Paths.get(full))
            exchange.getResponseHeaders().add('Content-Type', MIME.get(ext, 'application/octet-stream'))
            exchange.getResponseHeaders().add('Cache-Control', 'no-cache')
            exchange.sendResponseHeaders(200, len(data))
            out = exchange.getResponseBody()
            if exchange.getRequestMethod() == 'GET':
                out.write(data)
            out.close()
        except Exception as e:
            try:
                send(exchange, 500, 'Server error: %s' % e)
            except Exception:
                pass


def main():
    server = HttpServer.create(InetSocketAddress(PORT), 0)
    server.createContext('/', StaticHandler())
    server.setExecutor(Executors.newFixedThreadPool(4))
    server.start()
    print('TERNATRACK running at http://localhost:%d  (Ctrl+C to stop)' % PORT)


if __name__ == '__main__':
    main()
