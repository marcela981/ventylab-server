const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/simulation/status',
    method: 'GET',
    // Assuming we need a token? Actually wait, we'll get a 401 Unauthorized if we don't pass a token. 
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { console.log("Status Object:", data); });
});

req.on('error', (e) => { console.error(`Problem: ${e.message}`); });
req.end();
