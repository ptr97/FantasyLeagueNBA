const http = require('http');

function httpRequest(url) {
    return new Promise((resolve, reject) => {
        let req = http.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            let error;
            if(statusCode !== 200) {
                return reject(new Error('Request Failed.\n' + `Status Code: ${statusCode}`));
            } else if(!/^application\/json/.test(contentType)) {
                return reject(new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`));
            }
            if(error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                return reject(error);
            }

            res.setEncoding('utf8');
            let rawData = '';
            let parsedData;

            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    parsedData = JSON.parse(rawData);
                    // console.log(parsedData);
                    
                } catch(e) {
                    console.error(e.message);
                    reject(e);
                }
                resolve(parsedData);
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    });
}

module.exports = httpRequest;
