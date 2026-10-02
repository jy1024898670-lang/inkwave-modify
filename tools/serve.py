#!/usr/bin/env python3
"""INKWAVE dev/LAN server: static files from the repo root on 0.0.0.0 (reachable from other machines on the network).

Every response carries `Cache-Control: no-cache`, so browsers revalidate each module on load (cheap 304s via
Last-Modified) and can never mix a fresh main.js with a stale cached module — plain `python -m http.server` sends no
cache headers and browsers apply heuristic caching to ES modules.

usage: python3 tools/serve.py [port=8490] [--dir <root>]
"""
import http.server
import json
import os
import socket
import sys
import threading
from datetime import datetime, timezone
from functools import partial

port = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8490
root = sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
diag_log = os.path.join(root, 'diag-log.jsonl')
diag_lock = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
        '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):   # quiet: only errors
        if args and str(args[1] if len(args) > 1 else '').startswith(('4', '5')):
            super().log_message(fmt, *args)

    def do_POST(self):
        # black-frame diagnostics from the running game (src/core/diag.js): append the batch to diag-log.jsonl
        if self.path.rstrip('/') not in ('/diag', 'diag'):
            self.send_error(404, 'unknown endpoint')
            return
        try:
            n = int(self.headers.get('Content-Length') or 0)
            body = self.rfile.read(n) if n else b'{}'
            batch = json.loads(body or b'{}')
        except Exception as exc:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(str(exc).encode()[:200])
            return
        with diag_lock:
            with open(diag_log, 'a', encoding='utf-8') as f:
                f.write(json.dumps({'srv': datetime.now(timezone.utc).isoformat(), 'batch': batch}, ensure_ascii=False) + '\n')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"ok":1}')


class Server(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True

    def handle_error(self, request, client_address):
        # a browser cancelling a download (tab closed, reload) is normal — don't print a traceback for it
        import sys as _s
        if isinstance(_s.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)

    def server_bind(self):
        # dual-stack: IPv6 + IPv4 on one socket, so both http://localhost and http://<lan-ip> work
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def lan_ips():
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return sorted(ips)


if __name__ == '__main__':
    httpd = Server(('::', port), partial(Handler, directory=root))
    print(f'INKWAVE serving {root}')
    print(f'  this machine : http://localhost:{port}')
    for ip in lan_ips():
        print(f'  your network : http://{ip}:{port}')
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
