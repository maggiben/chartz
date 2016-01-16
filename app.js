var mysql       = require('mysql');
var fs = require("fs");
var extend = require('util')._extend;
//var unserialize = require("php-serialization").unserialize;

function unserialize(data) {
  //  discuss at: http://phpjs.org/functions/unserialize/
  // original by: Arpad Ray (mailto:arpad@php.net)
  // improved by: Pedro Tainha (http://www.pedrotainha.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Chris
  // improved by: James
  // improved by: Le Torbi
  // improved by: Eli Skeggs
  // bugfixed by: dptr1988
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //  revised by: d3x
  //    input by: Brett Zamir (http://brett-zamir.me)
  //    input by: Martin (http://www.erlenwiese.de/)
  //    input by: kilops
  //    input by: Jaroslaw Czarniak
  //        note: We feel the main purpose of this function should be to ease the transport of data between php & js
  //        note: Aiming for PHP-compatibility, we have to translate objects to arrays
  //   example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}');
  //   returns 1: ['Kevin', 'van', 'Zonneveld']
  //   example 2: unserialize('a:3:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";s:7:"surName";s:9:"Zonneveld";}');
  //   returns 2: {firstName: 'Kevin', midName: 'van', surName: 'Zonneveld'}

  var that = this,
    utf8Overhead = function(chr) {
      // http://phpjs.org/functions/unserialize:571#comment_95906
      var code = chr.charCodeAt(0);
      if (  code < 0x0080 
            || 0x00A0 <= code && code <= 0x00FF 
            || [338,339,352,353,376,402,8211,8212,8216,8217,8218,8220,8221,8222,8224,8225,8226,8230,8240,8364,8482].indexOf(code)!=-1) 
      {
        return 0;
      }
      if (code < 0x0800) {
        return 1;
      }
      return 2;
    };
  error = function(type, msg, filename, line) {
    throw new that.window[type](msg, filename, line);
  };
  read_until = function(data, offset, stopchr) {
    var i = 2,
      buf = [],
      chr = data.slice(offset, offset + 1);

    while (chr != stopchr) {
      if ((i + offset) > data.length) {
        error('Error', 'Invalid');
      }
      buf.push(chr);
      chr = data.slice(offset + (i - 1), offset + i);
      i += 1;
    }
    return [buf.length, buf.join('')];
  };
  read_chrs = function(data, offset, length) {
    var i, chr, buf;

    buf = [];
    for (i = 0; i < length; i++) {
      chr = data.slice(offset + (i - 1), offset + i);
      buf.push(chr);
      length -= utf8Overhead(chr);
    }
    return [buf.length, buf.join('')];
  };
  _unserialize = function(data, offset) {
    var dtype, dataoffset, keyandchrs, keys, contig,
      length, array, readdata, readData, ccount,
      stringlength, i, key, kprops, kchrs, vprops,
      vchrs, value, chrs = 0,
      typeconvert = function(x) {
        return x;
      };

    if (!offset) {
      offset = 0;
    }
    dtype = (data.slice(offset, offset + 1))
      .toLowerCase();

    dataoffset = offset + 2;

    switch (dtype) {
    case 'i':
      typeconvert = function(x) {
        return parseInt(x, 10);
      };
      readData = read_until(data, dataoffset, ';');
      chrs = readData[0];
      readdata = readData[1];
      dataoffset += chrs + 1;
      break;
    case 'b':
      typeconvert = function(x) {
        return parseInt(x, 10) !== 0;
      };
      readData = read_until(data, dataoffset, ';');
      chrs = readData[0];
      readdata = readData[1];
      dataoffset += chrs + 1;
      break;
    case 'd':
      typeconvert = function(x) {
        return parseFloat(x);
      };
      readData = read_until(data, dataoffset, ';');
      chrs = readData[0];
      readdata = readData[1];
      dataoffset += chrs + 1;
      break;
    case 'n':
      readdata = null;
      break;
    case 's':
      ccount = read_until(data, dataoffset, ':');
      chrs = ccount[0];
      stringlength = ccount[1];
      dataoffset += chrs + 2;

      readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
      chrs = readData[0];
      readdata = readData[1];
      dataoffset += chrs + 2;
      if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
        error('SyntaxError', 'String length mismatch');
      }
      break;
    case 'a':
      readdata = {};

      keyandchrs = read_until(data, dataoffset, ':');
      chrs = keyandchrs[0];
      keys = keyandchrs[1];
      dataoffset += chrs + 2;

      length = parseInt(keys, 10);
      contig = true;

      for (i = 0; i < length; i++) {
        kprops = _unserialize(data, dataoffset);
        kchrs = kprops[1];
        key = kprops[2];
        dataoffset += kchrs;

        vprops = _unserialize(data, dataoffset);
        vchrs = vprops[1];
        value = vprops[2];
        dataoffset += vchrs;

        if (key !== i)
          contig = false;

        readdata[key] = value;
      }

      if (contig) {
        array = new Array(length);
        for (i = 0; i < length; i++)
          array[i] = readdata[i];
        readdata = array;
      }

      dataoffset += 1;
      break;
    default:
      error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
      break;
    }
    return [dtype, dataoffset - offset, typeconvert(readdata)];
  };

  return _unserialize((data + ''), 0)[2];
}

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
var writerStream = fs.createWriteStream('output');
var stream = new Stream();

var data = '';
connection.query('select meta_key, meta_value, meta_id, post_id from wp_postmeta where meta_key in ("chart_type", "chart_format", "chart_grouping", "series", "chart_subtitle", "data_timeseries") group by meta_id')
.stream({
    highWaterMark: 1,
    encoding: 'utf8',
    objectMode: false
})
.on('data', (chunk) => {
    data = extend({}, chunk);
})
.on('end', () => {
  console.log(data);
})
.pipe(function() {

})
.pipe(writerStream);

connection.end();

