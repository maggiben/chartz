var mysql       = require('mysql');
var through = require('through')
var fs = require("fs");
var extend = require('util')._extend;
var JSONStream = require('JSONStream');
var Parser = require('binary-parser').Parser;
var Stream = require('stream');
var async = require('async');
var request = require('request');
var moment = require('moment');
var fred = require('fred')('46951ae4f75944c72b2d2810aa8d9778');
var xignite = require('./datasources/xignite')('mike@marketrealist.com');


var unserialize = require('phpunserialize');

var exporters = {
    disk: require('./exporters/disk'),
    mongodb: null
};

var connection = mysql.createConnection({
    host     : '192.168.50.10',
    port     : 3306,
    user     : 'vagrant',
    password : 'vagrant',
    database : 'marketrealist'
});

connection.connect();

function getChartData(id, callback) {
    var fields = ['chart_type', 'chart_format', 'chart_grouping', 'series', 'chart_subtitle', 'data_timeseries'];
    connection.query('select meta_value from wp_postmeta where post_id = 665684 and meta_key = "data_timeseries"', function(err, rows, fields) {
        if (err) throw err;

        var metaValues = rows.map(function(row) {
            return unserialize(row.meta_value);
        });
        console.log('The solution is: ', JSON.stringify(metaValues, null, 4));
    });
}

var schema = {
    'chart_type': {
        unserialize: false
    },
    'chart_format': {
        unserialize: false
    },
    'chart_grouping':{
        unserialize: false
    },
    'chart_subtitle':{
        unserialize: false
    },
    'series':{
        unserialize: true
    },
    'data_timeseries': {
        unserialize: true
    }
};

function getChartRange(timeseries) {
    return timeseries.map(function (series) {
        return {
            from: new Date(series.start * 1000),
            end: new Date(series.end * 1000)
        }
    });
}

function getCharts(posts) {
    async.mapSeries(posts, function (post, callback) {

        getPostMeta(post, function (error, result) {
            return callback(error, result);
        });

    }, function (error, result) {
        var merged = [].concat.apply([], result);
        exporters.disk.writeFileSync('output.json', merged.filter(Boolean), {spaces: 4});
        connection.end();
    });
}

connection.query('select distinct(post_id) from wp_postmeta where meta_key = "chart_type"', function(err, rows, fields) {
    if (err) throw err;
    console.log("total charts: ", rows.length);
    return
    return getCharts(rows.map(function(row) {
        return row.post_id;
    }));
});

fixTimeSeries = function (timeseries) {
    timeseries['data_timeseries'].map(function (serie) {
        console.log("Start: ", timeseries['post_id'], moment(serie.start * 1000).utc().format('M/D/YY h:mmA'))
    });
}

function getPostMeta(id, callback) {
    var query = 'select meta_key, meta_value, meta_id, post_id from wp_postmeta where post_id in ('+id+') and meta_key in ("chart_type", "chart_format", "chart_grouping", "series", "chart_subtitle", "data_timeseries") group by meta_id';
    connection.query(query, function(err, rows, fields) {
        if (err || !rows || !rows.length) {
            return callback(err);
        }
        var metaValues = rows.reduce(function (previous, current, index, array) {
            var post = previous.find(function(post) {
                return post.post_id == current.post_id;
            }) || {};
            try {
                post[current.meta_key] = schema[current.meta_key].unserialize ? unserialize(current.meta_value) : current.meta_value;
            } catch(error) {
                console.log('Error parsing chart: ', current.post_id, error)
                post[current.meta_key] = current.meta_value;
            }
            if(!post.post_id) {
                post.post_id = current.post_id;
                previous.push(post);
            }
            return previous;
        }, []);
        if(metaValues[0]['chart_format'] == 'time-series')
            fixTimeSeries(metaValues[0])
        return callback(null, metaValues);
    });
}

var entityType = {
    'macroeconomic': function (entity, callback) {
        async.mapSeries(entity, function (post, callback) {

        }, function (error, result) {
            var merged = [].concat.apply([], result);
            exporters.disk.writeFileSync('output.json', merged.filter(Boolean), {spaces: 4});
            connection.end();
        });
        /*
        fred.series.observations({ 
            'file_type': 'json',
            'series_id': 'DGS1',
            'observation_start': moment().subtract(1000, 'days').format('YYYY-MM-DD'),
            'observation_end': moment().format('YYYY-MM-DD'),
            'frequency': 'm',
            'aggregation_method': 'avg'
        }, function(err, result) {
          return callback(err, result);
        });
        */
    },
    'historical-quotes': function () {

    }
}

function xigniteX () {

    var service = 'xBATSRealTime.json'
    var api = 'ListTradedSymbols'
    // ListTradedSymbols
    request({
            url: `http://batsrealtime.xignite.com/${service}/${api}`, //URL to hit
            qs: {
                'NumberOfDays': 100,
                'StartSymbol' : 'A',
                'EndSymbol'   : 'Z',
                'Header_Username': 'mike@marketrealist.com'
            }, //Query string data*/
            method: 'GET',
            //Lets post the following key/values as form
        }, function(error, response, body){
            if(error) {
                console.log(error);
            } else {
                console.log(response.statusCode, body);
        }
    });
}

/*fred.series.observations({ 
    'file_type': 'json',
    'series_id': 'DGS1',
    'observation_start': moment().subtract(1000, 'days').format('YYYY-MM-DD'),
    'observation_end': moment().format('YYYY-MM-DD'),
    'frequency': 'm',
    'aggregation_method': 'avg'
}, function(err, result) {
  if (!err) console.log(result);
  process.exit()
});*/

fred.category.children({ 
    'file_type': 'json',
    'category_id': '10',
}, function(err, result) {
   // console.log(err, result);
});

fred.category.series({ 
    'file_type': 'json',
    'category_id': '100',
}, function(err, result) {
  console.log(err, result);
  process.exit()
});

/*
xignite.get('batsrealtime', 'ListTradedSymbols', {
    'NumberOfDays': 10,
    'StartSymbol' : 'A',
    'EndSymbol'   : 'Z'
}, function (error, result) {
    console.log("xignite: ", result)
});
*/

getQuotes = function (symbols, callback) {
    xignite.get('batsrealtime', 'GetRealQuotes', {
        'Symbols': symbols.join( ',' ),
    }, function (error, result) {
        console.log("getQuotes: ", result);
        callback(error, result);
    });
}

getBars = function( options, callback ) {

    xignite.get('batsrealtime', 'GetBars', {
        'Symbol'    : options.symbol,
        'StartTime' : moment(options.startTime).format('M/D/YY h:mmA'),
        'EndTime'   : moment(options.endTime).format('M/D/YY h:mmA'),
        'Precision' : options.precision,
        'Period'    : options.period
    }, function (error, result) {
        console.log("getBars: ", result);
        callback(error, result);
    });
}

historicalQuote = function( quote, startTime, endTime, callback ) {

    var AdjustmentMethod = ['None', 'SplitOnly', 'CashDividendOnly', 'SplitAndProportionalCashDividend', 'SplitAndCashDividend', 'All', 'DefaultValue'];
    
    xignite.get('globalhistorical', 'GetGlobalHistoricalQuotesRange', {
        Identifier       : quote,
        AdjustmentMethod : 'SplitAndProportionalCashDividend',
        IdentifierType   : 'Symbol',
        StartDate        : moment(startTime).format('M/D/YY h:mmA'),
        EndDate          : moment(endTime).format('M/D/YY h:mmA'),
    }, function (error, result) {
        console.log("historicalQuote: ", result);
        callback(error, result);
    });
}

//getQuotes(['aapl', 'ibm'], function() {})

/*getBars({
    symbol: 'IBM',
    startTime: moment().subtract(4, 'days'),
    endTime: moment(),
    precision: 'Minutes',
    period: 10
}, function() {})
*/

/*

    //Lets configure and request
request({
    url: 'https://modulus.io/contact/demo', //URL to hit
    qs: {from: 'blog example', time: +new Date()}, //Query string data
    method: 'POST',
    //Lets post the following key/values as form
    json: {
        field1: 'data',
        field2: 'data'
    }
}, function(error, response, body){
    if(error) {
        console.log(error);
    } else {
        console.log(response.statusCode, body);
}
});

    self.fundFundamentalsUrl     = 'https://fundfundamentals.xignite.com/xfundfundamentals.json/GetFundsFundamentalList';
    self.fundamentalsUrl         = 'https://fundamentals.xignite.com/xFundamentals.json/GetCompaniesFundamentalList';
    self.quotesUrl               = 'https://batsrealtime.xignite.com/xBATSRealTime.json/GetRealQuotes';
    self.getBarsUrl              = 'https://batsrealtime.xignite.com/xBATSRealTime.json/GetBars';
    self.historicalQuotesUrl     = 'https://www.xignite.com/xGlobalHistorical.json/GetGlobalHistoricalQuotesRange';
    self.paramsDefault           = { Header_Username: 'mike@marketrealist.com' };


    historicalQuote = function( quote, from, to, callback ) {

        var fromString = (from.getMonth() + 1) + '/' + from.getDate() + '/' + from.getFullYear();
        var toString   = (to.getMonth() + 1) + '/' + to.getDate() + '/' + to.getFullYear();

        self.request( self.historicalQuotesUrl, {
            Identifier       : quote,
            AdjustmentMethod : 'SplitAndProportionalCashDividend',
            IdentifierType   : 'Symbol',
            StartDate        : fromString,
            EndDate          : toString,
        }, function( data ) {
            callback( data );
        });
    }
*/

/*connection.query('select meta_key, meta_value, meta_id, post_id from wp_postmeta where post_id in (665247) and meta_key in ("chart_type", "chart_format", "chart_grouping", "series", "chart_subtitle", "data_timeseries") group by meta_id', function(err, rows, fields) {
    if (err) throw err;

    var metaValues = rows
    .reduce(function (previous, current, index, array) {
        var post = previous.find(function(post) {
            return post.post_id == current.post_id;
        }) || {};
        post[current.meta_key] = schema[current.meta_key].unserialize ? unserialize(current.meta_value) : current.meta_value;
        if(!post.post_id) {
            post.post_id = current.post_id;
            previous.push(post);
        }
        return previous;
    }, []);
    console.log(JSON.stringify(metaValues, null, 4));
});
*/

/*connection.query('select meta_key, meta_value, meta_id, post_id from wp_postmeta where post_id in (665247, 665191) and meta_key in ("chart_type", "chart_format", "chart_grouping", "series", "chart_subtitle", "data_timeseries") group by meta_id', function(err, rows, fields) {
    if (err) throw err;

    var metaValues = rows
    .reduce(function (previous, current, index, array) {
        var post = previous.find(function(post) {
            return post.post_id == current.post_id;
        }) || {};
        post[current.meta_key] = schema[current.meta_key].unserialize ? unserialize(current.meta_value) : current.meta_value;
        if(!post.post_id) {
            post.post_id = current.post_id;
            previous.push(post);
        }
        return previous;
    }, []);
    console.log(JSON.stringify(metaValues, null, 4));
});*/

// Create a writable stream
/*
var writerStream = fs.createWriteStream('output');
var file = fs.createWriteStream('example.txt');

var MsgExtractStream = function() {
    Stream.Transform.call(this,{
        objectMode: true
    });
}

MsgExtractStream.prototype = Object.create(Stream.Transform.prototype, {
    constructor: {
        value: MsgExtractStream
    }
});

MsgExtractStream.prototype._transform = function(chunk, encoding, callback) {
    var result = {'the website is': chunk};
    this.push(JSON.stringify(chunk, null, 4));
}

MsgExtractStream.prototype.write = function () {
    this._transform.apply(this, arguments);
};

MsgExtractStream.prototype.end = function () {
    this._transform.apply(this, arguments);
    this.emit("end");
};

var buf = new Buffer('450002c5939900002c06ef98adc24f6c850186d1', 'hex');
var msgPage = new MsgExtractStream();
var data = '';
connection.query('select meta_key, meta_value, meta_id, post_id from wp_postmeta where meta_key in ("chart_type", "chart_format", "chart_grouping", "series", "chart_subtitle", "data_timeseries") group by meta_id')
.stream({
    highWaterMark: 5,
    objectMode: true
})
.pipe(JSONStream.stringify())
.pipe(writerStream);
*/

//connection.end();

