const https = require('https');
const http = require('http');

const urls = [
    { name: 'Prod Backend', url: 'https://fluxornews-backend-production-3ba8.up.railway.app/api/health' },
    { name: 'Prod Frontend', url: 'https://www.fluxornews.com' },
    { name: 'Local Backend', url: 'http://localhost:5000/api/health' },
    { name: 'Local Frontend', url: 'http://localhost:3000' }
];

async function checkUrl(item) {
    return new Promise((resolve) => {
        const client = item.url.startsWith('https') ? https : http;
        const req = client.get(item.url, (res) => {
            console.log(`[${res.statusCode === 200 ? '✅' : '❌'}] ${item.name}: Status ${res.statusCode}`);
            resolve();
        });

        req.on('error', (e) => {
            console.log(`[❌] ${item.name}: Error - ${e.message}`);
            resolve();
        });

        req.setTimeout(5000, () => {
            console.log(`[❌] ${item.name}: Timeout`);
            req.abort();
            resolve();
        });
    });
}

async function run() {
    console.log('🔍 Starting Diagnostics...');
    for (const item of urls) {
        await checkUrl(item);
    }
}

run();
