var request = require('request')

var Xignite = function(apiKey) {
    if (!(this instanceof Xignite)) {
        return new Xignite(apiKey)
    }

    this._api = {
        protocol: 'http://',
        host: 'xignite.com',
        Header_Username: 'mike@marketrealist.com',
        key: apiKey
    }

    //this.xigniteBATSRealTime.children = Xignite.prototype.xigniteBATSRealTime.listTradedSymbols.bind(this)
}

Xignite.prototype.xigniteBATSRealTime = function(categoryId, done) {
    var service = 'xBATSRealTime.json'
    var api = 'ListTradedSymbols'
        // ListTradedSymbols
    request({
        url: `http://batsrealtime.xignite.com/${service}/${api}`, //URL to hit
        qs: {
            'NumberOfDays': 100,
            'StartSymbol': 'A',
            'EndSymbol': 'Z',
            'Header_Username': 'mike@marketrealist.com'
        }, //Query string data*/
        method: 'GET',
        //Lets post the following key/values as form
    }, function(error, response, body) {
        if (err) return done(err)
        if (res.statusCode != 200) return done(new Error(body.error_message))

        done(null, body.categories[0])
    });
}


Xignite.prototype.get = function(serviceTag, api, query, done) {
    function getServiceMeta(serviceTag) {
        var meta = {
            'batsrealtime': {
                name: 'batsrealtime.',
                format: 'xBATSRealTime.json'
            },
            'fundfundamentals': {
                name: 'fundfundamentals.',
                format: 'xBATSRealTime.json'
            },
            'fundamentals': {
                name: 'fundamentals.',
                format: 'xFundamentals.json'
            },
            'globalhistorical': {
                name: '',
                format: 'xGlobalHistorical.json'
            }
        };

        return meta[serviceTag];
    }
    query['Header_Username'] = this._api.key;
    var service = getServiceMeta(serviceTag);

    console.log("serive", query, `http://${service.name}xignite.com/${service.format}/${api}`)

    request({
        uri: `http://${service.name}xignite.com/${service.format}/${api}`, //URL to hit
        qs: query,
        json: true
    }, function(err, res, body) {
        if (err) return done(err)
        if (res.statusCode != 200) return done(new Error(body.error_message))

        done(null, body)
    })
}

module.exports = Xignite