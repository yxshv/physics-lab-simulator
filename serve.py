#!/usr/bin/env python3
"""Local server for the Physics Lab Simulator (no caching, so edits show up on reload).
Run:  python3 serve.py   then open http://localhost:8765
"""
import http.server, functools, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
    def log_message(self, *a):
        pass

root = os.path.dirname(os.path.abspath(__file__))
handler = functools.partial(NoCache, directory=root)
with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler) as s:
    print(f'Physics Lab Simulator on http://localhost:{PORT}')
    s.serve_forever()
