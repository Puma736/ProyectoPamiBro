const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.m4a': 'audio/mp4',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
    try {
        let reqUrl = decodeURI(req.url.split('?')[0]);
        if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';
        
        let relative = reqUrl.replace(/^[/\\]+/, '');
        let filePath = path.resolve(ROOT, relative);

        if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) {
            res.writeHead(403);
            return res.end('Access Denied');
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('404 Not Found');
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            const range = req.headers.range;
            if (range && (ext === '.m4a' || ext === '.mp3' || ext === '.mp4')) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                });
                file.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': stats.size,
                    'Cache-Control': 'no-cache'
                });
                fs.createReadStream(filePath).pipe(res);
            }
        });
    } catch(e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + e.message);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
