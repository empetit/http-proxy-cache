// --------------------------------
// IMPORTS
// --------------------------------

const colors = require('colors'),
    request = require('request')
    app = require('express')();
    mcache = require('memory-cache');

app.set('port', (process.env.PORT || 5000));

// --------------------------------
// CONSTANTS
// --------------------------------
const PORT = process.env.PORT || 3000;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const API_URL = 'http://www.recipepuppy.com';

console.log([
    '#    # ##### ##### #####        #####  #####   ####  #    # #   #',
    '#    #   #     #   #    #       #    # #    # #    #  #  #   # # ',
    '######   #     #   #    # ##### #    # #    # #    #   ##     #  ',
    '#    #   #     #   #####        #####  #####  #    #   ##     #  ',
    '#    #   #     #   #            #      #   #  #    #  #  #    #  ',
    '#    #   #     #   #            #      #    #  ####  #    #   #  '
].join('\n').rainbow.bold)


// --------------------------------
// FUNCTIONS
// --------------------------------

/**
 * Middleware handling the http cache 
 * Use in memory cache to store requests
 * @param {number} duration 
 */
var cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;

        // find the cached call 
        let cachedBody = mcache.get(key);

        // return json format
        res.setHeader('content-type', 'application/json');

        if (cachedBody) {
            // The "key" is already in the cache, respond
            console.log('Valid entry found in cache : '.green + key.yellow + (' - [' + cachedBody.length +' bytes]').green);
            return res.send(cachedBody);
        } else {
            // The "key" is not present : process the request
            console.log('No valid entry found in cache - continue ...'.yellow);
            
            //override send method to add caching
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, CACHE_DURATION);
                res.sendResponse(body)
            }
            next();
        }
    }
}


// --------------------------------
// ROUTES
// --------------------------------

/** Main route
 * Proxy redirects all request to the API
 * If the route has called in the last CACHE_DURATION seconds,
 * the cached result will be returned
 */
app.get('*', cache(CACHE_DURATION), (req, res) => {

    // build final url
    var url = API_URL + req.url;

    console.log('Proxying request : '.green + (url).yellow);

    // call the api
    request.get(url, function (error, response, body) {
        if(error){
            console.error('Error: ', error); // Print the error if one occurred
            res.status(500);
            res.end('{"error": "'+error+'"}');
        }else{
            //finalise the request
            res.send(body);
        }
    })
});

// Handle Errors
app.use((req, res) => {
    res.status(404);
});

// --------------------------------
// INIT
// --------------------------------


app.listen(app.get('port'), function() {
    console.log('Example app listening on port '.green + PORT.toString().yellow)
});