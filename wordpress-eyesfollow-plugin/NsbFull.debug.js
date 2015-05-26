(function($) {
//! Script# Core Runtime
//! More information at http://projects.nikhilk.net/ScriptSharp
//!

///////////////////////////////////////////////////////////////////////////////
// Globals

(function () {
  var globals = {
    version: '0.7.4.0',

    isUndefined: function (o) {
      return (o === undefined);
    },

    isNull: function (o) {
      return (o === null);
    },

    isNullOrUndefined: function (o) {
      return (o === null) || (o === undefined);
    },

    isValue: function (o) {
      return (o !== null) && (o !== undefined);
    }
  };

  var started = false;
  var startCallbacks = [];

  function onStartup(cb) {
    startCallbacks ? startCallbacks.push(cb) : setTimeout(cb, 0);
  }
  function startup() {
    if (startCallbacks) {
      var callbacks = startCallbacks;
      startCallbacks = null;
      for (var i = 0, l = callbacks.length; i < l; i++) {
        callbacks[i]();
      }
    }
  }
  if (document.addEventListener) {
    document.readyState == 'complete' ? startup() : document.addEventListener('DOMContentLoaded', startup, false);
  }
  else if (window.attachEvent) {
    window.attachEvent('onload', function () {
      startup();
    });
  }

  var ss = window.ss;
  if (!ss) {
    window.ss = ss = {
      init: onStartup,
      ready: onStartup
    };
  }
  for (var n in globals) {
    ss[n] = globals[n];
  }
})();

///////////////////////////////////////////////////////////////////////////////
// Object Extensions

Object.__typeName = 'Object';
Object.__baseType = null;

Object.clearKeys = function Object$clearKeys(d) {
    for (var n in d) {
        delete d[n];
    }
}

Object.keyExists = function Object$keyExists(d, key) {
    return d[key] !== undefined;
}

if (!Object.keys) {
    Object.keys = function Object$keys(d) {
        var keys = [];
        for (var n in d) {
            keys.push(n);
        }
        return keys;
    }

    Object.getKeyCount = function Object$getKeyCount(d) {
        var count = 0;
        for (var n in d) {
            count++;
        }
        return count;
    }
}
else {
    Object.getKeyCount = function Object$getKeyCount(d) {
        return Object.keys(d).length;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Boolean Extensions

Boolean.__typeName = 'Boolean';

Boolean.parse = function Boolean$parse(s) {
    return (s.toLowerCase() == 'true');
}

///////////////////////////////////////////////////////////////////////////////
// Number Extensions

Number.__typeName = 'Number';

Number.parse = function Number$parse(s) {
    if (!s || !s.length) {
        return 0;
    }
    if ((s.indexOf('.') >= 0) || (s.indexOf('e') >= 0) ||
        s.endsWith('f') || s.endsWith('F')) {
        return parseFloat(s);
    }
    return parseInt(s, 10);
}

Number.prototype.format = function Number$format(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
        return this.toString();
    }
    return this._netFormat(format, false);
}

Number.prototype.localeFormat = function Number$format(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
        return this.toLocaleString();
    }
    return this._netFormat(format, true);
}

Number._commaFormat = function Number$_commaFormat(number, groups, decimal, comma) {
    var decimalPart = null;
    var decimalIndex = number.indexOf(decimal);
    if (decimalIndex > 0) {
        decimalPart = number.substr(decimalIndex);
        number = number.substr(0, decimalIndex);
    }

    var negative = number.startsWith('-');
    if (negative) {
        number = number.substr(1);
    }

    var groupIndex = 0;
    var groupSize = groups[groupIndex];
    if (number.length < groupSize) {
        return decimalPart ? number + decimalPart : number;
    }

    var index = number.length;
    var s = '';
    var done = false;
    while (!done) {
        var length = groupSize;
        var startIndex = index - length;
        if (startIndex < 0) {
            groupSize += startIndex;
            length += startIndex;
            startIndex = 0;
            done = true;
        }
        if (!length) {
            break;
        }
        
        var part = number.substr(startIndex, length);
        if (s.length) {
            s = part + comma + s;
        }
        else {
            s = part;
        }
        index -= length;

        if (groupIndex < groups.length - 1) {
            groupIndex++;
            groupSize = groups[groupIndex];
        }
    }

    if (negative) {
        s = '-' + s;
    }    
    return decimalPart ? s + decimalPart : s;
}

Number.prototype._netFormat = function Number$_netFormat(format, useLocale) {
    var nf = useLocale ? ss.CultureInfo.CurrentCulture.numberFormat : ss.CultureInfo.InvariantCulture.numberFormat;

    var s = '';    
    var precision = -1;
    
    if (format.length > 1) {
        precision = parseInt(format.substr(1));
    }

    var fs = format.charAt(0);
    switch (fs) {
        case 'd': case 'D':
            s = parseInt(Math.abs(this)).toString();
            if (precision != -1) {
                s = s.padLeft(precision, '0');
            }
            if (this < 0) {
                s = '-' + s;
            }
            break;
        case 'x': case 'X':
            s = parseInt(Math.abs(this)).toString(16);
            if (fs == 'X') {
                s = s.toUpperCase();
            }
            if (precision != -1) {
                s = s.padLeft(precision, '0');
            }
            break;
        case 'e': case 'E':
            if (precision == -1) {
                s = this.toExponential();
            }
            else {
                s = this.toExponential(precision);
            }
            if (fs == 'E') {
                s = s.toUpperCase();
            }
            break;
        case 'f': case 'F':
        case 'n': case 'N':
            if (precision == -1) {
                precision = nf.numberDecimalDigits;
            }
            s = this.toFixed(precision).toString();
            if (precision && (nf.numberDecimalSeparator != '.')) {
                var index = s.indexOf('.');
                s = s.substr(0, index) + nf.numberDecimalSeparator + s.substr(index + 1);
            }
            if ((fs == 'n') || (fs == 'N')) {
                s = Number._commaFormat(s, nf.numberGroupSizes, nf.numberDecimalSeparator, nf.numberGroupSeparator);
            }
            break;
        case 'c': case 'C':
            if (precision == -1) {
                precision = nf.currencyDecimalDigits;
            }
            s = Math.abs(this).toFixed(precision).toString();
            if (precision && (nf.currencyDecimalSeparator != '.')) {
                var index = s.indexOf('.');
                s = s.substr(0, index) + nf.currencyDecimalSeparator + s.substr(index + 1);
            }
            s = Number._commaFormat(s, nf.currencyGroupSizes, nf.currencyDecimalSeparator, nf.currencyGroupSeparator);
            if (this < 0) {
                s = String.format(nf.currencyNegativePattern, s);
            }
            else {
                s = String.format(nf.currencyPositivePattern, s);
            }
            break;
        case 'p': case 'P':
            if (precision == -1) {
                precision = nf.percentDecimalDigits;
            }
            s = (Math.abs(this) * 100.0).toFixed(precision).toString();
            if (precision && (nf.percentDecimalSeparator != '.')) {
                var index = s.indexOf('.');
                s = s.substr(0, index) + nf.percentDecimalSeparator + s.substr(index + 1);
            }
            s = Number._commaFormat(s, nf.percentGroupSizes, nf.percentDecimalSeparator, nf.percentGroupSeparator);
            if (this < 0) {
                s = String.format(nf.percentNegativePattern, s);
            }
            else {
                s = String.format(nf.percentPositivePattern, s);
            }
            break;
    }

    return s;
}

///////////////////////////////////////////////////////////////////////////////
// String Extensions

String.__typeName = 'String';
String.Empty = '';

String.compare = function String$compare(s1, s2, ignoreCase) {
    if (ignoreCase) {
        if (s1) {
            s1 = s1.toUpperCase();
        }
        if (s2) {
            s2 = s2.toUpperCase();
        }
    }
    s1 = s1 || '';
    s2 = s2 || '';

    if (s1 == s2) {
        return 0;
    }
    if (s1 < s2) {
        return -1;
    }
    return 1;
}

String.prototype.compareTo = function String$compareTo(s, ignoreCase) {
    return String.compare(this, s, ignoreCase);
}

String.concat = function String$concat() {
    if (arguments.length === 2) {
        return arguments[0] + arguments[1];
    }
    return Array.prototype.join.call(arguments, '');
}

String.prototype.endsWith = function String$endsWith(suffix) {
    if (!suffix.length) {
        return true;
    }
    if (suffix.length > this.length) {
        return false;
    }
    return (this.substr(this.length - suffix.length) == suffix);
}

String.equals = function String$equals1(s1, s2, ignoreCase) {
    return String.compare(s1, s2, ignoreCase) == 0;
}

String._format = function String$_format(format, values, useLocale) {
    if (!String._formatRE) {
        String._formatRE = /(\{[^\}^\{]+\})/g;
    }

    return format.replace(String._formatRE,
                          function(str, m) {
                              var index = parseInt(m.substr(1));
                              var value = values[index + 1];
                              if (ss.isNullOrUndefined(value)) {
                                  return '';
                              }
                              if (value.format) {
                                  var formatSpec = null;
                                  var formatIndex = m.indexOf(':');
                                  if (formatIndex > 0) {
                                      formatSpec = m.substring(formatIndex + 1, m.length - 1);
                                  }
                                  return useLocale ? value.localeFormat(formatSpec) : value.format(formatSpec);
                              }
                              else {
                                  return useLocale ? value.toLocaleString() : value.toString();
                              }
                          });
}

String.format = function String$format(format) {
    return String._format(format, arguments, /* useLocale */ false);
}

String.fromChar = function String$fromChar(ch, count) {
    var s = ch;
    for (var i = 1; i < count; i++) {
        s += ch;
    }
    return s;
}

String.prototype.htmlDecode = function String$htmlDecode() {
    var div = document.createElement('div');
    div.innerHTML = this;
    return div.textContent || div.innerText;
}

String.prototype.htmlEncode = function String$htmlEncode() {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(this));
    return div.innerHTML.replace(/\"/g, '&quot;');
}

String.prototype.indexOfAny = function String$indexOfAny(chars, startIndex, count) {
    var length = this.length;
    if (!length) {
        return -1;
    }

    startIndex = startIndex || 0;
    count = count || length;

    var endIndex = startIndex + count - 1;
    if (endIndex >= length) {
        endIndex = length - 1;
    }

    for (var i = startIndex; i <= endIndex; i++) {
        if (chars.indexOf(this.charAt(i)) >= 0) {
            return i;
        }
    }
    return -1;
}

String.prototype.insert = function String$insert(index, value) {
    if (!value) {
        return this;
    }
    if (!index) {
        return value + this;
    }
    var s1 = this.substr(0, index);
    var s2 = this.substr(index);
    return s1 + value + s2;
}

String.isNullOrEmpty = function String$isNullOrEmpty(s) {
    return !s || !s.length;
}

String.prototype.lastIndexOfAny = function String$lastIndexOfAny(chars, startIndex, count) {
    var length = this.length;
    if (!length) {
        return -1;
    }

    startIndex = startIndex || length - 1;
    count = count || length;

    var endIndex = startIndex - count + 1;
    if (endIndex < 0) {
        endIndex = 0;
    }

    for (var i = startIndex; i >= endIndex; i--) {
        if (chars.indexOf(this.charAt(i)) >= 0) {
            return i;
        }
    }
    return -1;
}

String.localeFormat = function String$localeFormat(format) {
    return String._format(format, arguments, /* useLocale */ true);
}

String.prototype.padLeft = function String$padLeft(totalWidth, ch) {
    if (this.length < totalWidth) {
        ch = ch || ' ';
        return String.fromChar(ch, totalWidth - this.length) + this;
    }
    return this;
}

String.prototype.padRight = function String$padRight(totalWidth, ch) {
    if (this.length < totalWidth) {
        ch = ch || ' ';
        return this + String.fromChar(ch, totalWidth - this.length);
    }
    return this;
}

String.prototype.remove = function String$remove(index, count) {
    if (!count || ((index + count) > this.length)) {
        return this.substr(0, index);
    }
    return this.substr(0, index) + this.substr(index + count);
}

String.prototype.replaceAll = function String$replaceAll(oldValue, newValue) {
    newValue = newValue || '';
    return this.split(oldValue).join(newValue);
}

String.prototype.startsWith = function String$startsWith(prefix) {
    if (!prefix.length) {
        return true;
    }
    if (prefix.length > this.length) {
        return false;
    }
    return (this.substr(0, prefix.length) == prefix);
}

if (!String.prototype.trim) {
    String.prototype.trim = function String$trim() {
        return this.trimEnd().trimStart();
    }
}

String.prototype.trimEnd = function String$trimEnd() {
    return this.replace(/\s*$/, '');
}

String.prototype.trimStart = function String$trimStart() {
    return this.replace(/^\s*/, '');
}

///////////////////////////////////////////////////////////////////////////////
// Array Extensions

Array.__typeName = 'Array';
Array.__interfaces = [ ss.IEnumerable ];

Array.prototype.add = function Array$add(item) {
    this[this.length] = item;
}

Array.prototype.addRange = function Array$addRange(items) {
    this.push.apply(this, items);
}

Array.prototype.aggregate = function Array$aggregate(seed, callback, instance) {
    var length = this.length;
    for (var i = 0; i < length; i++) {
        if (i in this) {
            seed = callback.call(instance, seed, this[i], i, this);
        }
    }
    return seed;
}

Array.prototype.clear = function Array$clear() {
    this.length = 0;
}

Array.prototype.clone = function Array$clone() {
    if (this.length === 1) {
        return [this[0]];
    }
    else {
        return Array.apply(null, this);
    }
}

Array.prototype.contains = function Array$contains(item) {
    var index = this.indexOf(item);
    return (index >= 0);
}

Array.prototype.dequeue = function Array$dequeue() {
    return this.shift();
}

Array.prototype.enqueue = function Array$enqueue(item) {
    // We record that this array instance is a queue, so we
    // can implement the right behavior in the peek method.
    this._queue = true;
    this.push(item);
}

Array.prototype.peek = function Array$peek() {
    if (this.length) {
        var index = this._queue ? 0 : this.length - 1;
        return this[index];
    }
    return null;
}

if (!Array.prototype.every) {
    Array.prototype.every = function Array$every(callback, instance) {
        var length = this.length;
        for (var i = 0; i < length; i++) {
            if (i in this && !callback.call(instance, this[i], i, this)) {
                return false;
            }
        }
        return true;
    }
}

Array.prototype.extract = function Array$extract(index, count) {
    if (!count) {
        return this.slice(index);
    }
    return this.slice(index, index + count);
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function Array$filter(callback, instance) {
        var length = this.length;    
        var filtered = [];
        for (var i = 0; i < length; i++) {
            if (i in this) {
                var val = this[i];
                if (callback.call(instance, val, i, this)) {
                    filtered.push(val);
                }
            }
        }
        return filtered;
    }
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function Array$forEach(callback, instance) {
        var length = this.length;
        for (var i = 0; i < length; i++) {
            if (i in this) {
                callback.call(instance, this[i], i, this);
            }
        }
    }
}

Array.prototype.getEnumerator = function Array$getEnumerator() {
    return new ss.ArrayEnumerator(this);
}

Array.prototype.groupBy = function Array$groupBy(callback, instance) {
    var length = this.length;
    var groups = [];
    var keys = {};
    for (var i = 0; i < length; i++) {
        if (i in this) {
            var key = callback.call(instance, this[i], i);
            if (String.isNullOrEmpty(key)) {
                continue;
            }
            var items = keys[key];
            if (!items) {
                items = [];
                items.key = key;

                keys[key] = items;
                groups.add(items);
            }
            items.add(this[i]);
        }
    }
    return groups;
}

Array.prototype.index = function Array$index(callback, instance) {
    var length = this.length;
    var items = {};
    for (var i = 0; i < length; i++) {
        if (i in this) {
            var key = callback.call(instance, this[i], i);
            if (String.isNullOrEmpty(key)) {
                continue;
            }
            items[key] = this[i];
        }
    }
    return items;
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function Array$indexOf(item, startIndex) {
        startIndex = startIndex || 0;
        var length = this.length;
        if (length) {
            for (var index = startIndex; index < length; index++) {
                if (this[index] === item) {
                    return index;
                }
            }
        }
        return -1;
    }
}

Array.prototype.insert = function Array$insert(index, item) {
    this.splice(index, 0, item);
}

Array.prototype.insertRange = function Array$insertRange(index, items) {
    if (index === 0) {
        this.unshift.apply(this, items);
    }
    else {
        for (var i = 0; i < items.length; i++) {
            this.splice(index + i, 0, items[i]);
        }
    }
}

if (!Array.prototype.map) {
    Array.prototype.map = function Array$map(callback, instance) {
        var length = this.length;
        var mapped = new Array(length);
        for (var i = 0; i < length; i++) {
            if (i in this) {
                mapped[i] = callback.call(instance, this[i], i, this);
            }
        }
        return mapped;
    }
}

Array.parse = function Array$parse(s) {
    return eval('(' + s + ')');
}

Array.prototype.remove = function Array$remove(item) {
    var index = this.indexOf(item);
    if (index >= 0) {
        this.splice(index, 1);
        return true;
    }
    return false;
}

Array.prototype.removeAt = function Array$removeAt(index) {
    this.splice(index, 1);
}

Array.prototype.removeRange = function Array$removeRange(index, count) {
    return this.splice(index, count);
}

if (!Array.prototype.some) {
    Array.prototype.some = function Array$some(callback, instance) {
        var length = this.length;
        for (var i = 0; i < length; i++) {
            if (i in this && callback.call(instance, this[i], i, this)) {
                return true;
            }
        }
        return false;
    }
}

Array.toArray = function Array$toArray(obj) {
    return Array.prototype.slice.call(obj);
}

///////////////////////////////////////////////////////////////////////////////
// RegExp Extensions

RegExp.__typeName = 'RegExp';

RegExp.parse = function RegExp$parse(s) {
    if (s.startsWith('/')) {
        var endSlashIndex = s.lastIndexOf('/');
        if (endSlashIndex > 1) {
            var expression = s.substring(1, endSlashIndex);
            var flags = s.substr(endSlashIndex + 1);
            return new RegExp(expression, flags);
        }
    }

    return null;    
}

///////////////////////////////////////////////////////////////////////////////
// Date Extensions

Date.__typeName = 'Date';

Date.empty = null;

Date.get_now = function Date$get_now() {
    return new Date();
}

Date.get_today = function Date$get_today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

Date.isEmpty = function Date$isEmpty(d) {
    return (d === null) || (d.valueOf() === 0);
}

Date.prototype.format = function Date$format(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
        return this.toString();
    }
    if (format == 'id') {
        return this.toDateString();
    }
    if (format == 'it') {
        return this.toTimeString();
    }

    return this._netFormat(format, false);
}

Date.prototype.localeFormat = function Date$localeFormat(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
        return this.toLocaleString();
    }
    if (format == 'id') {
        return this.toLocaleDateString();
    }
    if (format == 'it') {
        return this.toLocaleTimeString();
    }

    return this._netFormat(format, true);
}

Date.prototype._netFormat = function Date$_netFormat(format, useLocale) {
    var dt = this;
    var dtf = useLocale ? ss.CultureInfo.CurrentCulture.dateFormat : ss.CultureInfo.InvariantCulture.dateFormat;

    if (format.length == 1) {
        switch (format) {
            case 'f': format = dtf.longDatePattern + ' ' + dtf.shortTimePattern; break;
            case 'F': format = dtf.dateTimePattern; break;

            case 'd': format = dtf.shortDatePattern; break;
            case 'D': format = dtf.longDatePattern; break;

            case 't': format = dtf.shortTimePattern; break;
            case 'T': format = dtf.longTimePattern; break;

            case 'g': format = dtf.shortDatePattern + ' ' + dtf.shortTimePattern; break;
            case 'G': format = dtf.shortDatePattern + ' ' + dtf.longTimePattern; break;

            case 'R': case 'r':
                dtf = ss.CultureInfo.InvariantCulture.dateFormat;
                format = dtf.gmtDateTimePattern;
                break;
            case 'u': format = dtf.universalDateTimePattern; break;
            case 'U':
                format = dtf.dateTimePattern;
                dt = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(),
                              dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds(), dt.getUTCMilliseconds());
                break;

            case 's': format = dtf.sortableDateTimePattern; break;
        }
    }

    if (format.charAt(0) == '%') {
        format = format.substr(1);
    }

    if (!Date._formatRE) {
        Date._formatRE = /'.*?[^\\]'|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z/g;
    }

    var re = Date._formatRE;
    var sb = new ss.StringBuilder();

    re.lastIndex = 0;
    while (true) {
        var index = re.lastIndex;
        var match = re.exec(format);

        sb.append(format.slice(index, match ? match.index : format.length));
        if (!match) {
            break;
        }

        var fs = match[0];
        var part = fs;
        switch (fs) {
            case 'dddd':
                part = dtf.dayNames[dt.getDay()];
                break;
            case 'ddd':
                part = dtf.shortDayNames[dt.getDay()];
                break;
            case 'dd':
                part = dt.getDate().toString().padLeft(2, '0');
                break;
            case 'd':
                part = dt.getDate();
                break;
            case 'MMMM':
                part = dtf.monthNames[dt.getMonth()];
                break;
            case 'MMM':
                part = dtf.shortMonthNames[dt.getMonth()];
                break;
            case 'MM':
                part = (dt.getMonth() + 1).toString().padLeft(2, '0');
                break;
            case 'M':
                part = (dt.getMonth() + 1);
                break;
            case 'yyyy':
                part = dt.getFullYear();
                break;
            case 'yy':
                part = (dt.getFullYear() % 100).toString().padLeft(2, '0');
                break;
            case 'y':
                part = (dt.getFullYear() % 100);
                break;
            case 'h': case 'hh':
                part = dt.getHours() % 12;
                if (!part) {
                    part = '12';
                }
                else if (fs == 'hh') {
                    part = part.toString().padLeft(2, '0');
                }
                break;
            case 'HH':
                part = dt.getHours().toString().padLeft(2, '0');
                break;
            case 'H':
                part = dt.getHours();
                break;
            case 'mm':
                part = dt.getMinutes().toString().padLeft(2, '0');
                break;
            case 'm':
                part = dt.getMinutes();
                break;
            case 'ss':
                part = dt.getSeconds().toString().padLeft(2, '0');
                break;
            case 's':
                part = dt.getSeconds();
                break;
            case 't': case 'tt':
                part = (dt.getHours() < 12) ? dtf.amDesignator : dtf.pmDesignator;
                if (fs == 't') {
                    part = part.charAt(0);
                }
                break;
            case 'fff':
                part = dt.getMilliseconds().toString().padLeft(3, '0');
                break;
            case 'ff':
                part = dt.getMilliseconds().toString().padLeft(3).substr(0, 2);
                break;
            case 'f':
                part = dt.getMilliseconds().toString().padLeft(3).charAt(0);
                break;
            case 'z':
                part = dt.getTimezoneOffset() / 60;
                part = ((part >= 0) ? '-' : '+') + Math.floor(Math.abs(part));
                break;
            case 'zz': case 'zzz':
                part = dt.getTimezoneOffset() / 60;
                part = ((part >= 0) ? '-' : '+') + Math.floor(Math.abs(part)).toString().padLeft(2, '0');
                if (fs == 'zzz') {
                    part += dtf.timeSeparator + Math.abs(dt.getTimezoneOffset() % 60).toString().padLeft(2, '0');
                }
                break;
            default:
                if (part.charAt(0) == '\'') {
                    part = part.substr(1, part.length - 2).replace(/\\'/g, '\'');
                }
                break;
        }
        sb.append(part);
    }

    return sb.toString();
}

Date.parseDate = function Date$parse(s) {
    // Date.parse returns the number of milliseconds
    // so we use that to create an actual Date instance
    return new Date(Date.parse(s));
}

///////////////////////////////////////////////////////////////////////////////
// Error Extensions

Error.__typeName = 'Error';

Error.prototype.popStackFrame = function Error$popStackFrame() {
    if (ss.isNullOrUndefined(this.stack) ||
        ss.isNullOrUndefined(this.fileName) ||
        ss.isNullOrUndefined(this.lineNumber)) {
        return;
    }

    var stackFrames = this.stack.split('\n');
    var currentFrame = stackFrames[0];
    var pattern = this.fileName + ':' + this.lineNumber;
    while (!ss.isNullOrUndefined(currentFrame) &&
           currentFrame.indexOf(pattern) === -1) {
        stackFrames.shift();
        currentFrame = stackFrames[0];
    }

    var nextFrame = stackFrames[1];
    if (isNullOrUndefined(nextFrame)) {
        return;
    }

    var nextFrameParts = nextFrame.match(/@(.*):(\d+)$/);
    if (ss.isNullOrUndefined(nextFrameParts)) {
        return;
    }

    stackFrames.shift();
    this.stack = stackFrames.join("\n");
    this.fileName = nextFrameParts[1];
    this.lineNumber = parseInt(nextFrameParts[2]);
}

Error.createError = function Error$createError(message, errorInfo, innerException) {
    var e = new Error(message);
    if (errorInfo) {
        for (var v in errorInfo) {
            e[v] = errorInfo[v];
        }
    }
    if (innerException) {
        e.innerException = innerException;
    }

    e.popStackFrame();
    return e;
}

///////////////////////////////////////////////////////////////////////////////
// Debug Extensions

ss.Debug = window.Debug || function() {};
ss.Debug.__typeName = 'Debug';

if (!ss.Debug.writeln) {
    ss.Debug.writeln = function Debug$writeln(text) {
        if (window.console) {
            if (window.console.debug) {
                window.console.debug(text);
                return;
            }
            else if (window.console.log) {
                window.console.log(text);
                return;
            }
        }
        else if (window.opera &&
            window.opera.postError) {
            window.opera.postError(text);
            return;
        }
    }
}

ss.Debug._fail = function Debug$_fail(message) {
    ss.Debug.writeln(message);
    eval('debugger;');
}

ss.Debug.assert = function Debug$assert(condition, message) {
    if (!condition) {
        message = 'Assert failed: ' + message;
        if (confirm(message + '\r\n\r\nBreak into debugger?')) {
            ss.Debug._fail(message);
        }
    }
}

ss.Debug.fail = function Debug$fail(message) {
    ss.Debug._fail(message);
}

///////////////////////////////////////////////////////////////////////////////
// Type System Implementation

window.Type = Function;
Type.__typeName = 'Type';

window.__Namespace = function(name) {
    this.__typeName = name;
}
__Namespace.prototype = {
    __namespace: true,
    getName: function() {
        return this.__typeName;
    }
}

Type.registerNamespace = function Type$registerNamespace(name) {
    if (!window.__namespaces) {
        window.__namespaces = {};
    }
    if (!window.__rootNamespaces) {
        window.__rootNamespaces = [];
    }

    if (window.__namespaces[name]) {
        return;
    }

    var ns = window;
    var nameParts = name.split('.');

    for (var i = 0; i < nameParts.length; i++) {
        var part = nameParts[i];
        var nso = ns[part];
        if (!nso) {
            ns[part] = nso = new __Namespace(nameParts.slice(0, i + 1).join('.'));
            if (i == 0) {
                window.__rootNamespaces.add(nso);
            }
        }
        ns = nso;
    }

    window.__namespaces[name] = ns;
}

Type.prototype.registerClass = function Type$registerClass(name, baseType, interfaceType) {
    this.prototype.constructor = this;
    this.__typeName = name;
    this.__class = true;
    this.__baseType = baseType || Object;
    if (baseType) {
        this.__basePrototypePending = true;
    }

    if (interfaceType) {
        this.__interfaces = [];
        for (var i = 2; i < arguments.length; i++) {
            interfaceType = arguments[i];
            this.__interfaces.add(interfaceType);
        }
    }
}

Type.prototype.registerInterface = function Type$createInterface(name) {
    this.__typeName = name;
    this.__interface = true;
}

Type.prototype.registerEnum = function Type$createEnum(name, flags) {
    for (var field in this.prototype) {
         this[field] = this.prototype[field];
    }

    this.__typeName = name;
    this.__enum = true;
    if (flags) {
        this.__flags = true;
    }
}

Type.prototype.setupBase = function Type$setupBase() {
    if (this.__basePrototypePending) {
        var baseType = this.__baseType;
        if (baseType.__basePrototypePending) {
            baseType.setupBase();
        }

        for (var memberName in baseType.prototype) {
            var memberValue = baseType.prototype[memberName];
            if (!this.prototype[memberName]) {
                this.prototype[memberName] = memberValue;
            }
        }

        delete this.__basePrototypePending;
    }
}

if (!Type.prototype.resolveInheritance) {
    // This function is not used by Script#; Visual Studio relies on it
    // for JavaScript IntelliSense support of derived types.
    Type.prototype.resolveInheritance = Type.prototype.setupBase;
}

Type.prototype.initializeBase = function Type$initializeBase(instance, args) {
    if (this.__basePrototypePending) {
        this.setupBase();
    }

    if (!args) {
        this.__baseType.apply(instance);
    }
    else {
        this.__baseType.apply(instance, args);
    }
}

Type.prototype.callBaseMethod = function Type$callBaseMethod(instance, name, args) {
    var baseMethod = this.__baseType.prototype[name];
    if (!args) {
        return baseMethod.apply(instance);
    }
    else {
        return baseMethod.apply(instance, args);
    }
}

Type.prototype.get_baseType = function Type$get_baseType() {
    return this.__baseType || null;
}

Type.prototype.get_fullName = function Type$get_fullName() {
    return this.__typeName;
}

Type.prototype.get_name = function Type$get_name() {
    var fullName = this.__typeName;
    var nsIndex = fullName.lastIndexOf('.');
    if (nsIndex > 0) {
        return fullName.substr(nsIndex + 1);
    }
    return fullName;
}

Type.prototype.getInterfaces = function Type$getInterfaces() {
    return this.__interfaces;
}

Type.prototype.isInstanceOfType = function Type$isInstanceOfType(instance) {
    if (ss.isNullOrUndefined(instance)) {
        return false;
    }
    if ((this == Object) || (instance instanceof this)) {
        return true;
    }

    var type = Type.getInstanceType(instance);
    return this.isAssignableFrom(type);
}

Type.prototype.isAssignableFrom = function Type$isAssignableFrom(type) {
    if ((this == Object) || (this == type)) {
        return true;
    }
    if (this.__class) {
        var baseType = type.__baseType;
        while (baseType) {
            if (this == baseType) {
                return true;
            }
            baseType = baseType.__baseType;
        }
    }
    else if (this.__interface) {
        var interfaces = type.__interfaces;
        if (interfaces && interfaces.contains(this)) {
            return true;
        }

        var baseType = type.__baseType;
        while (baseType) {
            interfaces = baseType.__interfaces;
            if (interfaces && interfaces.contains(this)) {
                return true;
            }
            baseType = baseType.__baseType;
        }
    }
    return false;
}

Type.isClass = function Type$isClass(type) {
    return (type.__class == true);
}

Type.isEnum = function Type$isEnum(type) {
    return (type.__enum == true);
}

Type.isFlags = function Type$isFlags(type) {
    return ((type.__enum == true) && (type.__flags == true));
}

Type.isInterface = function Type$isInterface(type) {
    return (type.__interface == true);
}

Type.isNamespace = function Type$isNamespace(object) {
    return (object.__namespace == true);
}

Type.canCast = function Type$canCast(instance, type) {
    return type.isInstanceOfType(instance);
}

Type.safeCast = function Type$safeCast(instance, type) {
    if (type.isInstanceOfType(instance)) {
        return instance;
    }
    return null;
}

Type.getInstanceType = function Type$getInstanceType(instance) {
    var ctor = null;

    // NOTE: We have to catch exceptions because the constructor
    //       cannot be looked up on native COM objects
    try {
        ctor = instance.constructor;
    }
    catch (ex) {
    }
    if (!ctor || !ctor.__typeName) {
        ctor = Object;
    }
    return ctor;
}

Type.getType = function Type$getType(typeName) {
    if (!typeName) {
        return null;
    }

    if (!Type.__typeCache) {
        Type.__typeCache = {};
    }

    var type = Type.__typeCache[typeName];
    if (!type) {
        type = eval(typeName);
        Type.__typeCache[typeName] = type;
    }
    return type;
}

Type.parse = function Type$parse(typeName) {
    return Type.getType(typeName);
}

///////////////////////////////////////////////////////////////////////////////
// Delegate

ss.Delegate = function Delegate$() {
}
ss.Delegate.registerClass('Delegate');

ss.Delegate.empty = function() { }

ss.Delegate._contains = function Delegate$_contains(targets, object, method) {
    for (var i = 0; i < targets.length; i += 2) {
        if (targets[i] === object && targets[i + 1] === method) {
            return true;
        }
    }
    return false;
}

ss.Delegate._create = function Delegate$_create(targets) {
    var delegate = function() {
        if (targets.length == 2) {
            return targets[1].apply(targets[0], arguments);
        }
        else {
            var clone = targets.clone();
            for (var i = 0; i < clone.length; i += 2) {
                if (ss.Delegate._contains(targets, clone[i], clone[i + 1])) {
                    clone[i + 1].apply(clone[i], arguments);
                }
            }
            return null;
        }
    };
    delegate._targets = targets;

    return delegate;
}

ss.Delegate.create = function Delegate$create(object, method) {
    if (!object) {
        return method;
    }
    return ss.Delegate._create([object, method]);
}

ss.Delegate.combine = function Delegate$combine(delegate1, delegate2) {
    if (!delegate1) {
        if (!delegate2._targets) {
            return ss.Delegate.create(null, delegate2);
        }
        return delegate2;
    }
    if (!delegate2) {
        if (!delegate1._targets) {
            return ss.Delegate.create(null, delegate1);
        }
        return delegate1;
    }

    var targets1 = delegate1._targets ? delegate1._targets : [null, delegate1];
    var targets2 = delegate2._targets ? delegate2._targets : [null, delegate2];

    return ss.Delegate._create(targets1.concat(targets2));
}

ss.Delegate.remove = function Delegate$remove(delegate1, delegate2) {
    if (!delegate1 || (delegate1 === delegate2)) {
        return null;
    }
    if (!delegate2) {
        return delegate1;
    }

    var targets = delegate1._targets;
    var object = null;
    var method;
    if (delegate2._targets) {
        object = delegate2._targets[0];
        method = delegate2._targets[1];
    }
    else {
        method = delegate2;
    }

    for (var i = 0; i < targets.length; i += 2) {
        if ((targets[i] === object) && (targets[i + 1] === method)) {
            if (targets.length == 2) {
                return null;
            }
            targets.splice(i, 2);
            return ss.Delegate._create(targets);
        }
    }

    return delegate1;
}

ss.Delegate.createExport = function Delegate$createExport(delegate, multiUse, name) {
    // Generate a unique name if one is not specified
    name = name || '__' + (new Date()).valueOf();

    // Exported delegates go on window (so they are callable using a simple identifier).

    // Multi-use delegates are exported directly; for the rest a stub is exported, and the stub
    // first deletes, and then invokes the actual delegate.
    window[name] = multiUse ? delegate : function() {
      try { delete window[name]; } catch(e) { window[name] = undefined; }
      delegate.apply(null, arguments);
    };

    return name;
}

ss.Delegate.deleteExport = function Delegate$deleteExport(name) {
    delete window[name];
}

ss.Delegate.clearExport = function Delegate$clearExport(name) {
    window[name] = ss.Delegate.empty;
}

///////////////////////////////////////////////////////////////////////////////
// CultureInfo

ss.CultureInfo = function CultureInfo$(name, numberFormat, dateFormat) {
    this.name = name;
    this.numberFormat = numberFormat;
    this.dateFormat = dateFormat;
}
ss.CultureInfo.registerClass('CultureInfo');

ss.CultureInfo.InvariantCulture = new ss.CultureInfo('en-US',
    {
        naNSymbol: 'NaN',
        negativeSign: '-',
        positiveSign: '+',
        negativeInfinityText: '-Infinity',
        positiveInfinityText: 'Infinity',
        
        percentSymbol: '%',
        percentGroupSizes: [3],
        percentDecimalDigits: 2,
        percentDecimalSeparator: '.',
        percentGroupSeparator: ',',
        percentPositivePattern: '{0} %',
        percentNegativePattern: '-{0} %',

        currencySymbol:'$',
        currencyGroupSizes: [3],
        currencyDecimalDigits: 2,
        currencyDecimalSeparator: '.',
        currencyGroupSeparator: ',',
        currencyNegativePattern: '(${0})',
        currencyPositivePattern: '${0}',

        numberGroupSizes: [3],
        numberDecimalDigits: 2,
        numberDecimalSeparator: '.',
        numberGroupSeparator: ','
    },
    {
        amDesignator: 'AM',
        pmDesignator: 'PM',

        dateSeparator: '/',
        timeSeparator: ':',

        gmtDateTimePattern: 'ddd, dd MMM yyyy HH:mm:ss \'GMT\'',
        universalDateTimePattern: 'yyyy-MM-dd HH:mm:ssZ',
        sortableDateTimePattern: 'yyyy-MM-ddTHH:mm:ss',
        dateTimePattern: 'dddd, MMMM dd, yyyy h:mm:ss tt',

        longDatePattern: 'dddd, MMMM dd, yyyy',
        shortDatePattern: 'M/d/yyyy',

        longTimePattern: 'h:mm:ss tt',
        shortTimePattern: 'h:mm tt',

        firstDayOfWeek: 0,
        dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        shortDayNames: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
        minimizedDayNames: ['Su','Mo','Tu','We','Th','Fr','Sa'],

        monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December',''],
        shortMonthNames: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','']
    });
ss.CultureInfo.CurrentCulture = ss.CultureInfo.InvariantCulture;

///////////////////////////////////////////////////////////////////////////////
// IEnumerator

ss.IEnumerator = function IEnumerator$() { };
ss.IEnumerator.prototype = {
    get_current: null,
    moveNext: null,
    reset: null
}

ss.IEnumerator.getEnumerator = function ss_IEnumerator$getEnumerator(enumerable) {
    if (enumerable) {
        return enumerable.getEnumerator ? enumerable.getEnumerator() : new ss.ArrayEnumerator(enumerable);
    }
    return null;
}

ss.IEnumerator.registerInterface('IEnumerator');

///////////////////////////////////////////////////////////////////////////////
// IEnumerable

ss.IEnumerable = function IEnumerable$() { };
ss.IEnumerable.prototype = {
    getEnumerator: null
}
ss.IEnumerable.registerInterface('IEnumerable');

///////////////////////////////////////////////////////////////////////////////
// ArrayEnumerator

ss.ArrayEnumerator = function ArrayEnumerator$(array) {
    this._array = array;
    this._index = -1;
    this.current = null;
}
ss.ArrayEnumerator.prototype = {
    moveNext: function ArrayEnumerator$moveNext() {
        this._index++;
        this.current = this._array[this._index];
        return (this._index < this._array.length);
    },
    reset: function ArrayEnumerator$reset() {
        this._index = -1;
        this.current = null;
    }
}

ss.ArrayEnumerator.registerClass('ArrayEnumerator', null, ss.IEnumerator);

///////////////////////////////////////////////////////////////////////////////
// IDisposable

ss.IDisposable = function IDisposable$() { };
ss.IDisposable.prototype = {
    dispose: null
}
ss.IDisposable.registerInterface('IDisposable');

///////////////////////////////////////////////////////////////////////////////
// StringBuilder

ss.StringBuilder = function StringBuilder$(s) {
    this._parts = !ss.isNullOrUndefined(s) ? [s] : [];
    this.isEmpty = this._parts.length == 0;
}
ss.StringBuilder.prototype = {
    append: function StringBuilder$append(s) {
        if (!ss.isNullOrUndefined(s)) {
            this._parts.add(s);
            this.isEmpty = false;
        }
        return this;
    },

    appendLine: function StringBuilder$appendLine(s) {
        this.append(s);
        this.append('\r\n');
        this.isEmpty = false;
        return this;
    },

    clear: function StringBuilder$clear() {
        this._parts = [];
        this.isEmpty = true;
    },

    toString: function StringBuilder$toString(s) {
        return this._parts.join(s || '');
    }
};

ss.StringBuilder.registerClass('StringBuilder');

///////////////////////////////////////////////////////////////////////////////
// EventArgs

ss.EventArgs = function EventArgs$() {
}
ss.EventArgs.registerClass('EventArgs');

ss.EventArgs.Empty = new ss.EventArgs();

///////////////////////////////////////////////////////////////////////////////
// XMLHttpRequest

if (!window.XMLHttpRequest) {
    window.XMLHttpRequest = function() {
        var progIDs = [ 'Msxml2.XMLHTTP', 'Microsoft.XMLHTTP' ];

        for (var i = 0; i < progIDs.length; i++) {
            try {
                var xmlHttp = new ActiveXObject(progIDs[i]);
                return xmlHttp;
            }
            catch (ex) {
            }
        }

        return null;
    }
}

///////////////////////////////////////////////////////////////////////////////
// XmlDocumentParser

ss.parseXml = function(markup) {
    try {
        if (DOMParser) {
            var domParser = new DOMParser();
            return domParser.parseFromString(markup, 'text/xml');
        }
        else {
            var progIDs = [ 'Msxml2.DOMDocument.3.0', 'Msxml2.DOMDocument' ];
        
            for (var i = 0; i < progIDs.length; i++) {
                var xmlDOM = new ActiveXObject(progIDs[i]);
                xmlDOM.async = false;
                xmlDOM.loadXML(markup);
                xmlDOM.setProperty('SelectionLanguage', 'XPath');
                
                return xmlDOM;
            }
        }
    }
    catch (ex) {
    }

    return null;
}

///////////////////////////////////////////////////////////////////////////////
// CancelEventArgs

ss.CancelEventArgs = function CancelEventArgs$() {
    ss.CancelEventArgs.initializeBase(this);
    this.cancel = false;
}
ss.CancelEventArgs.registerClass('CancelEventArgs', ss.EventArgs);

///////////////////////////////////////////////////////////////////////////////
// Tuple

ss.Tuple = function (first, second, third) {
  this.first = first;
  this.second = second;
  if (arguments.length == 3) {
    this.third = third;
  }
}
ss.Tuple.registerClass('Tuple');

///////////////////////////////////////////////////////////////////////////////
// Observable

ss.Observable = function(v) {
    this._v = v;
    this._observers = null;
}
ss.Observable.prototype = {

  getValue: function () {
    this._observers = ss.Observable._captureObservers(this._observers);
    return this._v;
  },
  setValue: function (v) {
    if (this._v !== v) {
      this._v = v;

      var observers = this._observers;
      if (observers) {
        this._observers = null;
        ss.Observable._invalidateObservers(observers);
      }
    }
  }
};

ss.Observable._observerStack = [];
ss.Observable._observerRegistration = {
  dispose: function () {
    ss.Observable._observerStack.pop();
  }
}
ss.Observable.registerObserver = function (o) {
  ss.Observable._observerStack.push(o);
  return ss.Observable._observerRegistration;
}
ss.Observable._captureObservers = function (observers) {
  var registeredObservers = ss.Observable._observerStack;
  var observerCount = registeredObservers.length;

  if (observerCount) {
    observers = observers || [];
    for (var i = 0; i < observerCount; i++) {
      var observer = registeredObservers[i];
      if (!observers.contains(observer)) {
        observers.push(observer);
      }
    }
    return observers;
  }
  return null;
}
ss.Observable._invalidateObservers = function (observers) {
  for (var i = 0, len = observers.length; i < len; i++) {
    observers[i].invalidateObserver();
  }
}

ss.Observable.registerClass('Observable');


ss.ObservableCollection = function (items) {
  this._items = items || [];
  this._observers = null;
}
ss.ObservableCollection.prototype = {

  get_item: function (index) {
    this._observers = ss.Observable._captureObservers(this._observers);
    return this._items[index];
  },
  set_item: function (index, item) {
    this._items[index] = item;
    this._updated();
  },
  get_length: function () {
    this._observers = ss.Observable._captureObservers(this._observers);
    return this._items.length;
  },
  add: function (item) {
    this._items.push(item);
    this._updated();
  },
  clear: function () {
    this._items.clear();
    this._updated();
  },
  contains: function (item) {
    return this._items.contains(item);
  },
  getEnumerator: function () {
    this._observers = ss.Observable._captureObservers(this._observers);
    return this._items.getEnumerator();
  },
  indexOf: function (item) {
    return this._items.indexOf(item);
  },
  insert: function (index, item) {
    this._items.insert(index, item);
    this._updated();
  },
  remove: function (item) {
    if (this._items.remove(item)) {
      this._updated();
      return true;
    }
    return false;
  },
  removeAt: function (index) {
    this._items.removeAt(index);
    this._updated();
  },
  toArray: function () {
    return this._items;
  },
  _updated: function() {
    var observers = this._observers;
    if (observers) {
      this._observers = null;
      ss.Observable._invalidateObservers(observers);
    }
  }
}
ss.ObservableCollection.registerClass('ObservableCollection', null, ss.IEnumerable);

///////////////////////////////////////////////////////////////////////////////
// Interfaces

ss.IApplication = function() { };
ss.IApplication.registerInterface('IApplication');

ss.IContainer = function () { };
ss.IContainer.registerInterface('IContainer');

ss.IObjectFactory = function () { };
ss.IObjectFactory.registerInterface('IObjectFactory');

ss.IEventManager = function () { };
ss.IEventManager.registerInterface('IEventManager');

ss.IInitializable = function () { };
ss.IInitializable.registerInterface('IInitializable');
//! Nsb.debug.js
//

(function() {

////////////////////////////////////////////////////////////////////////////////
// ExpandoPlugin

jQuery.fn.expando = function ExpandoPlugin$expando(customOptions) {
    /// <param name="customOptions" type="Object">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    var leftMark = '&#x25C4;';
    var rightMark = '&#x25BA;';
    var downMark = '&#x25BC;';
    var eMarkClass = 'expandoPluginMark';
    var defaultOptions = { side: 'left', initiallyClosed: true, fullSurface: false };
    var options = $.extend({}, defaultOptions, customOptions);
    if (ss.isNullOrUndefined(options.openMark)) {
        options.openMark = downMark;
    }
    if (ss.isNullOrUndefined(options.closedMark)) {
        options.closedMark = (options.side === 'left') ? rightMark : leftMark;
    }
    return this.each(function(i, element) {
        var expando = $('<span/>').css({ color: '#008', padding: ((options.side === 'left') ? '0 5px 0 0' : '0 0 0 5px') }).addClass(eMarkClass).html((options.initiallyClosed) ? options.closedMark : options.openMark);
        options.clickOpen = function(e) {
            $(this).unbind('click').click(options.clickClosed).closest('dl').children('dd').show();
            $(this).parent().find('.' + eMarkClass).html(options.openMark);
            e.stopImmediatePropagation();
            e.preventDefault();
        };
        options.clickClosed = function(e) {
            $(this).unbind('click').click(options.clickOpen).closest('dl').children('dd').hide();
            $(this).parent().find('.' + eMarkClass).html(options.closedMark);
            e.stopImmediatePropagation();
            e.preventDefault();
        };
        if (options.side === 'left') {
            expando.prependTo($(this).children('dt'));
        }
        else {
            expando.appendTo($(this).children('dt'));
        }
        ((options.fullSurface) ? expando.parent() : expando).click(function(e) {
            var dd = $(this).closest('dt').next('dd');
            if (dd.is(':visible')) {
                (options.clickClosed).call(this, e);
            }
            else {
                (options.clickOpen).call(this, e);
            }
        }).css('cursor', 'pointer');
        if (options.initiallyClosed) {
            $(this).children('dd').hide();
        }
        else {
            $(this).children('dd').show();
        }
    });
}


////////////////////////////////////////////////////////////////////////////////
// jQueryJewlExtensions

jQuery.fn.endEvent = function jQueryJewlExtensions$endEvent(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    DomElement.cancelEvent(e);
    return this;
}
jQuery.fn.getContent = function jQueryJewlExtensions$getContent() {
    /// <returns type="String"></returns>
    if (this.is('input[type=text],input[type=password],textarea,select')) {
        return this.val() || '';
    }
    if (this.is('input[type=checkbox]')) {
        return this.is(':checked').toString();
    }
    return this.html() || '';
}
jQuery.fn.setContent = function jQueryJewlExtensions$setContent(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    if (this.is('input[type=text],input[type=password],textarea,select')) {
        if (this.is('textarea,')) {
            this.html(txt);
        }
        else {
            this.attr('value', txt);
        }
        return this.val(txt);
    }
    if (this.is('input[type=checkbox]')) {
        if (Boolean.parse(txt)) {
            return this.attr('checked', 'checked');
        }
        return this.removeAttr('checked');
    }
    return this.html(txt);
}
jQuery.fn.fValueString = function jQueryJewlExtensions$fValueString(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    if (this.is('input[type=password]')) {
        return this.val(txt);
    }
    txt = ThemeBase.parseAnchorsToEdit(txt);
    txt = txt.replace(/&nbsp;/g, ' ');
    txt = txt.replace(/<br\/?>/g, '\n');
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&amp;/g, '&');
    txt = txt.replace(/<span style=["']float:right["']>(.*?)<\/span>/g, '<right>$1');
    if (this.is('input[type=text],textarea,select')) {
        return this.val(txt);
    }
    if (this.is('input[type=checkbox]')) {
        if (Boolean.parse(txt)) {
            return this.attr('checked', 'checked');
        }
        return this.removeAttr('checked');
    }
    return this.html(txt);
}
jQuery.fn.fValue = function jQueryJewlExtensions$fValue(dta) {
    /// <param name="dta" type="Object">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    if (this.is('input[type=checkbox]')) {
        if (dta) {
            return this.attr('checked', 'checked');
        }
        return this.removeAttr('checked');
    }
    dta = (dta == null) ? '' : dta.toString();
    return this.fValueString(dta);
}
jQuery.fn.getFValue = function jQueryJewlExtensions$getFValue() {
    /// <returns type="Object"></returns>
    if (!this.length) {
        return '';
    }
    var txt;
    if (this.is('input[type=text],textarea,select')) {
        txt = this.val();
    }
    else if (this.is('input[type=password]')) {
        return this.val();
    }
    else if (this.is('input[type=checkbox]')) {
        return this.is(':checked');
    }
    else {
        return this.html();
    }
    txt = txt.trim();
    txt = txt.replace(/<right>(.*?)(\r?\n|$)/g, '<span style="float:right">$1</span>\n');
    txt = txt.replace(/<smile>/g, '&#9786;');
    txt = txt.replace(/<ball>/g, '&#9679;');
    txt = txt.replace(/<heart>/g, '&hearts;');
    txt = txt.replace(/<spade>/g, '&spades;');
    txt = txt.replace(/<club>/g, '&clubs;');
    txt = txt.replace(/<diamond>/g, '&diams;');
    txt = txt.replace(/<sun>/g, '&#9788;');
    txt = txt.replace(/<line>/g, '&#8212;');
    txt = txt.replace(/<leftarrow>/g, '&#8592;');
    txt = txt.replace(/<rightarrow>/g, '&#8594;');
    txt = txt.replace(/<dbllfarrow>/g, '&#8656;');
    txt = txt.replace(/<dblrtarrow>/g, '&#8658;');
    txt = Strings.sanitizeTags(txt);
    txt = ThemeBase.parseEditToAnchors(txt);
    txt = txt.replace(/\r/g, '');
    txt = txt.replace(/\n/g, '<br>');
    txt = txt.replace(/  /g, '&nbsp; ');
    txt = txt.replace(/  /g, ' &nbsp;');
    return txt.trim();
}
jQuery.fn.getFValueString = function jQueryJewlExtensions$getFValueString() {
    /// <returns type="String"></returns>
    return this.getFValue().toString();
}
jQuery.fn.getFEditString = function jQueryJewlExtensions$getFEditString() {
    /// <returns type="String"></returns>
    var txt1 = this.val();
    var txt2 = this.getFValue().toString();
    if (Rx.hasEndSpace.test(txt1)) {
        txt2 += ' ';
    }
    return txt2;
}
jQuery.fn.reFocus = function jQueryJewlExtensions$reFocus() {
    /// <returns type="jQueryObject"></returns>
    var ths = this;
    window.setTimeout(function() {
        ths.focus();
    }, 1);
    return this;
}
jQuery.fn.swallowAllMouseEvents = function jQueryJewlExtensions$swallowAllMouseEvents() {
    /// <returns type="jQueryObject"></returns>
    return this.bind('click.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('doubleclick.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('mousedown.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('mouseup.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('mouseover.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('mouseenter.swallowed', function(e) {
        DomElement.cancelEvent(e);
    }).bind('mouseleave.swallowed', function(e) {
        DomElement.cancelEvent(e);
    });
}
jQuery.fn.swallowClick = function jQueryJewlExtensions$swallowClick(fn) {
    /// <param name="fn" type="Function">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    return this.click(fn).mousedown(DomElement.cancelEvent).dblclick(DomElement.cancelEvent).mouseup(DomElement.cancelEvent);
}
jQuery.fn.vertHtml = function jQueryJewlExtensions$vertHtml() {
    /// <returns type="jQueryObject"></returns>
    var value = this.getFValueString();
    var f = $('<p/>').html(value);
    return this.fValueString(f.html());
}
jQuery.fn.fitIntoWindow = function jQueryJewlExtensions$fitIntoWindow() {
    /// <returns type="jQueryObject"></returns>
    var sctop = $(window.document).scrollTop();
    var scleft = $(window.document).scrollLeft();
    var top = this.offset().top;
    var left = this.offset().left;
    top = Math.max(top, sctop);
    left = Math.max(left, scleft);
    top = Math.min(top, sctop + $(window.self).innerHeight() - this.outerHeight());
    left = Math.min(left, scleft + $(window.self).innerWidth() - this.outerWidth());
    this.css('top', top + 'px');
    return this.css('left', left + 'px');
}
jQuery.fn.cloneToBody = function jQueryJewlExtensions$cloneToBody(element) {
    /// <param name="element" type="jQueryObject">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    var ths = this;
    var el = $("<div class='GigMu MenuZee'/>").appendTo(document.body).offset(element.offset());
    ths.appendTo(el).show();
    if (ths.data('GigMu1') == null) {
        ths.bind('mouseleave.Gears', function() {
            ths.detach();
            var fnOff = ths.data('GearsOff');
            if (fnOff != null) {
                fnOff();
            }
            el.remove();
        });
    }
    ths.data('GigMu1', ths);
    ths.data('GigMu2', el);
    return ths;
}
jQuery.fn.getSelection = function jQueryJewlExtensions$getSelection() {
    /// <returns type="Object"></returns>
    var el = this[0];
    var start = 0;
    var end = 0;
    if (typeof el.selectionStart == 'number' && typeof el.selectionEnd == 'number') {
        start = el.selectionStart;
        end = el.selectionEnd;
    }
    else {
        var range = document.selection.createRange();
        if (!!range && range.parentElement() == el) {
            var len = el.value.length;
            var normalizedValue = el.value.replace(/\r\n/g, '\n');
            var textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());
            var endRange = el.createTextRange();
            endRange.collapse(false);
            if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                start = end = len;
            }
            else {
                start = -textInputRange.moveStart('character', -len);
                start += normalizedValue.slice(0, start).split('\n').length - 1;
                if (textInputRange.compareEndPoints('EndToEnd', endRange) > -1) {
                    end = len;
                }
                else {
                    end = -textInputRange.moveEnd('character', -len);
                    end += normalizedValue.slice(0, end).split('\n').length - 1;
                }
            }
        }
    }
    return { start: start, end: end };
}
jQuery.fn.cloneEditCSS = function jQueryJewlExtensions$cloneEditCSS() {
    /// <returns type="Object"></returns>
    var el = this;
    var p = el.offset();
    return { position: 'absolute', margin: 0, top: p.top, left: p.left, width: el.innerWidth(), height: el.innerHeight(), border: 'none', background: '#FFC', 'font-family': el.css('font-family'), 'font-size': el.css('font-size'), 'font-weight': el.css('font-weight'), 'text-decoration': el.css('text-decoration'), 'padding-top': el.css('padding-top'), 'padding-left': el.css('padding-left'), 'padding-right': el.css('padding-right'), 'padding-bottom': el.css('padding-bottom'), overflow: 'hidden' };
}
jQuery.fn.disableLink = function jQueryJewlExtensions$disableLink(disable, title) {
    /// <param name="disable" type="Boolean">
    /// </param>
    /// <param name="title" type="String">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    if (disable) {
        this.data('href', this.attr('href')).removeAttr('href');
    }
    else {
        this.attr('href', this.data('href'));
    }
    return this.attr('title', title);
}
jQuery.fn.fadeInW = function jQueryJewlExtensions$fadeInW(ms, fn) {
    /// <param name="ms" type="Number" integer="true">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    FileBlobBase.svCnt++;
    return this.fadeIn(ms, function() {
        if (fn != null) {
            fn();
        }
        FileBlobBase.svCnt--;
    });
}
jQuery.fn.fadeOutW = function jQueryJewlExtensions$fadeOutW(ms, fn) {
    /// <param name="ms" type="Number" integer="true">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    FileBlobBase.svCnt++;
    return this.fadeOut(ms, function() {
        if (fn != null) {
            fn();
        }
        FileBlobBase.svCnt--;
    });
}
jQuery.fn.info = function jQueryJewlExtensions$info(msg) {
    /// <param name="msg" type="String">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    Inform.log('Jewl.Inform: ' + msg);
    return this;
}
jQuery.fn.copyRadius = function jQueryJewlExtensions$copyRadius(css, xtra, units) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="xtra" type="Number" integer="true">
    /// </param>
    /// <param name="units" type="String">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    units = units || ThemeBase.stdUnits;
    var css2 = {};
    var rad = parseInt(css['border-radius'] || '0') + xtra;
    css2['border-radius'] = rad + units;
    css2['-moz-border-radius'] = rad + units;
    css2['-webkit-border-radius'] = rad + units;
    return this.css(css2);
}


////////////////////////////////////////////////////////////////////////////////
// jQueryUiObject

window.jQueryUiObject = function jQueryUiObject() {
    /// <field name="draggable" type="jQueryObject">
    /// </field>
    /// <field name="helper" type="jQueryObject">
    /// </field>
    /// <field name="position" type="jQueryPosition">
    /// </field>
    /// <field name="offset" type="jQueryPosition">
    /// </field>
    /// <field name="e" type="jQueryEvent">
    /// </field>
}
jQueryUiObject.prototype = {
    draggable: null,
    helper: null,
    position: null,
    offset: null,
    e: null
}


Type.registerNamespace('Nsb.Classes');

////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.ResponseType

Nsb.Classes.ResponseType = function() { 
    /// <field name="empty" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="evoke" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="respond" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="notFound" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="failed" type="Number" integer="true" static="true">
    /// </field>
};
Nsb.Classes.ResponseType.prototype = {
    empty: 0, 
    evoke: 1, 
    respond: 2, 
    notFound: 3, 
    failed: 4
}
Nsb.Classes.ResponseType.registerEnum('Nsb.Classes.ResponseType', false);


////////////////////////////////////////////////////////////////////////////////
// Actor

Actor = function Actor() {
    /// <field name="_frames$2" type="Array">
    /// </field>
    /// <field name="fadeIn" type="Number" integer="true">
    /// </field>
    /// <field name="fadeOut" type="Number" integer="true">
    /// </field>
    /// <field name="_stopDetectInterval$2" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="acting" type="Boolean">
    /// </field>
    /// <field name="followDelegate" type="Function">
    /// </field>
    /// <field name="isFollowable" type="Boolean">
    /// </field>
    /// <field name="lastStopTime" type="Number" integer="true">
    /// </field>
    /// <field name="mouseX" type="Number" integer="true">
    /// </field>
    /// <field name="mouseY" type="Number" integer="true">
    /// </field>
    /// <field name="_scriptTmr$2" type="Number" integer="true">
    /// </field>
    /// <field name="_trackingDone$2" type="Boolean">
    /// </field>
    /// <field name="waitTmr" type="Number" integer="true">
    /// </field>
    /// <field name="_lastMouseX$2" type="Number" integer="true">
    /// </field>
    /// <field name="_lastMouseY$2" type="Number" integer="true">
    /// </field>
    /// <field name="_lastSameTime$2" type="Number" integer="true">
    /// </field>
    this._frames$2 = [];
    Actor.initializeBase(this);
}
Actor._shaker$2 = function Actor$_shaker$2(x, t, b, c, d) {
    /// <param name="x" type="Number" integer="true">
    /// </param>
    /// <param name="t" type="Number" integer="true">
    /// </param>
    /// <param name="b" type="Number" integer="true">
    /// </param>
    /// <param name="c" type="Number" integer="true">
    /// </param>
    /// <param name="d" type="Number" integer="true">
    /// </param>
    /// <returns type="Number"></returns>
    return c * Math.sin(t / d * 3 * 4 * (Math.PI / 2)) + b;
}
Actor.prototype = {
    fadeIn: 200,
    fadeOut: 200,
    
    recordFrame: function Actor$recordFrame() {
        var aa = $.extend(new Actor(), this);
        aa.element = this.element.clone(true, true);
        this._frames$2.add(aa);
    },
    
    rewindTo: function Actor$rewindTo(idx) {
        /// <param name="idx" type="Number" integer="true">
        /// </param>
        /// <returns type="Actor"></returns>
        var aa = this._frames$2[idx];
        if (aa != null) {
            var pr = this.element;
            var el = aa.element.clone(true, true);
            this.element.replaceWith(el);
            this.element = el;
            var $dict1 = Cluster.elements;
            for (var $key2 in $dict1) {
                var p = { key: $key2, value: $dict1[$key2] };
                if (p.value === pr) {
                    Cluster.elements[p.key] = el;
                }
            }
        }
        return this;
    },
    
    shake: function Actor$shake(ms) {
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        /// <returns type="Actor"></returns>
        if (this.acting) {
            return this;
        }
        this.acting = true;
        ms = (ms || 200);
        jQuery.easing.shaker = Actor._shaker$2;
        var p = this.element.position();
        this.element.css(p);
        var props = { top: p.top + 5 + 'px', left: p.left + 5 + 'px' };
        var opts = { duration: ms, easing: 'shaker', complete: ss.Delegate.create(this, function() {
            this.element.css(p);
        }) };
        new Await().addAw(ss.Delegate.create(this, this.animateAw), props, opts).addDx(ss.Delegate.create(this, function() {
            this.acting = false;
        })).commit();
        return this;
    },
    
    animateAw: function Actor$animateAw(awp, props, opts) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="props" type="Object">
        /// </param>
        /// <param name="opts" type="Object">
        /// </param>
        var op = (opts || {});
        var pp = (props || {});
        var cp = (op['complete'] || function() {
        });
        op['complete'] = function() {
            cp();
            awp.done();
        };
        this.element.animate(pp, op);
    },
    
    slideInAw: function Actor$slideInAw(awp, el) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="el" type="jQueryObject">
        /// </param>
        el = el || this.element;
        if (el != null) {
            var lf = Math.max(el.position().left, parseInt(el.css('left')));
            el.show().css({ left: (Math.min(10, lf - 150) + 'px'), visibility: 'visible' }).animate({ left: lf + 'px' }, 150, 'swing', function() {
                awp.done();
            });
        }
    },
    
    viewit: function Actor$viewit(url) {
        /// <param name="url" type="String">
        /// </param>
        /// <returns type="Actor"></returns>
        return new Actor().fromHtml('<div/>').html("<iframe src='" + url + '&output=embed' + "' frameborder='0' width='480' height='389' allowfullscreen='false' webkitallowfullscreen='false'></iframe>").appendTo(this.element);
    },
    
    html: function Actor$html(html) {
        /// <param name="html" type="String">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'html', [ html ]);
    },
    
    append: function Actor$append(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'append', [ el ]);
    },
    
    prepend: function Actor$prepend(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'prepend', [ el ]);
    },
    
    appendTo: function Actor$appendTo(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'appendTo', [ el ]);
    },
    
    prependTo: function Actor$prependTo(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'prependTo', [ el ]);
    },
    
    addClass: function Actor$addClass(classNames) {
        /// <param name="classNames" type="String">
        /// </param>
        /// <returns type="Actor"></returns>
        return Actor.callBaseMethod(this, 'addClass', [ classNames ]);
    },
    
    acting: false,
    followDelegate: null,
    isFollowable: true,
    lastStopTime: 0,
    mouseX: 0,
    mouseY: 0,
    _scriptTmr$2: 0,
    _trackingDone$2: false,
    waitTmr: 0,
    _lastMouseX$2: 0,
    _lastMouseY$2: 0,
    _lastSameTime$2: 0,
    
    get_trackingDone: function Nsb_Classes_Actor$get_trackingDone() {
        /// <value type="Boolean"></value>
        return this._trackingDone$2;
    },
    set_trackingDone: function Nsb_Classes_Actor$set_trackingDone(value) {
        /// <value type="Boolean"></value>
        this._trackingDone$2 = value;
        return value;
    },
    
    followMouse: function Nsb_Classes_Actor$followMouse() {
        /// <returns type="Actor"></returns>
        this.unfollowMouse();
        this.followDelegate = ss.Delegate.create(this, this._followDelegate2$2);
        $(window.self).bind('mousemove.actor', this.followDelegate);
        this._followable$2();
        this.startActing();
        this.element.fadeIn(this.fadeIn);
        this._startScript$2();
        this.whenMouseStarts();
        return this;
    },
    
    unfollowMouse: function Nsb_Classes_Actor$unfollowMouse() {
        /// <returns type="Actor"></returns>
        this.resetTimers();
        if (this.followDelegate != null) {
            this.followDelegate = null;
            $(window.self).unbind('mousemove.actor');
        }
        return this;
    },
    
    _followDelegate2$2: function Nsb_Classes_Actor$_followDelegate2$2(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.mouseY = e.pageY;
        this.mouseX = e.pageX;
        if (this.lastStopTime > 0) {
            this.resetTimers();
        }
        this.startActing();
    },
    
    _followPauseCheck$2: function Nsb_Classes_Actor$_followPauseCheck$2() {
        if (this.acting) {
            this.follow();
        }
        if (!this.lastStopTime) {
            if (this._lastMouseX$2 === this.mouseX && this._lastMouseY$2 === this.mouseY) {
                var now = new Date().getTime();
                if (!this._lastSameTime$2) {
                    this._lastSameTime$2 = now;
                }
                else {
                    if (now - this._lastSameTime$2 > 500) {
                        this.lastStopTime = now;
                        this.whenMouseStops();
                    }
                }
            }
            else {
                this._lastSameTime$2 = 0;
                this._lastMouseX$2 = this.mouseX;
                this._lastMouseY$2 = this.mouseY;
            }
        }
    },
    
    resetTimers: function Nsb_Classes_Actor$resetTimers() {
        window.clearTimeout(this.waitTmr);
        this.waitTmr = 0;
        this.lastStopTime = this._lastSameTime$2 = 0;
    },
    
    _followable$2: function Nsb_Classes_Actor$_followable$2() {
        this.isFollowable = true;
    },
    
    startActing: function Nsb_Classes_Actor$startActing() {
        this.acting = true;
        this.set_trackingDone(false);
    },
    
    stopActing: function Nsb_Classes_Actor$stopActing() {
        this.acting = false;
    },
    
    _startScript$2: function Nsb_Classes_Actor$_startScript$2() {
        this._stopScript$2();
        this._scriptTmr$2 = window.setInterval(ss.Delegate.create(this, this.scriptLoop), 30);
    },
    
    _stopScript$2: function Nsb_Classes_Actor$_stopScript$2() {
        window.clearInterval(this._scriptTmr$2);
    },
    
    scriptLoop: function Nsb_Classes_Actor$scriptLoop() {
        this._followPauseCheck$2();
    },
    
    follow: function Nsb_Classes_Actor$follow() {
        this.element.css('top', this.mouseY + 'px').css('left', this.mouseX + 'px');
    },
    
    whenMouseStarts: function Nsb_Classes_Actor$whenMouseStarts() {
    },
    
    whenMouseStops: function Nsb_Classes_Actor$whenMouseStops() {
    },
    
    waitTrackingDoneAw: function Nsb_Classes_Actor$waitTrackingDoneAw(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        if (!this.get_trackingDone()) {
            window.clearTimeout(this.waitTmr);
            this.waitTmr = window.setTimeout(ss.Delegate.create(this, function() {
                this.waitTrackingDoneAw(awp);
            }), 13);
            return;
        }
        awp.done();
    }
}


////////////////////////////////////////////////////////////////////////////////
// Ask

Ask = function Ask() {
    /// <field name="FadeSpeed" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="Attr" type="Object">
    /// </field>
    /// <field name="CancelFace" type="String">
    /// </field>
    /// <field name="Complete" type="Function">
    /// </field>
    /// <field name="Css" type="Object">
    /// </field>
    /// <field name="Customize" type="Function">
    /// </field>
    /// <field name="Finally" type="Function">
    /// </field>
    /// <field name="Html" type="jQueryObject">
    /// </field>
    /// <field name="InputType" type="String">
    /// </field>
    /// <field name="Message" type="String">
    /// </field>
    /// <field name="Msg" type="String">
    /// </field>
    /// <field name="OkFace" type="String">
    /// </field>
    /// <field name="SkipFace" type="String">
    /// </field>
    /// <field name="Title" type="String">
    /// </field>
    /// <field name="Value" type="String">
    /// </field>
    /// <field name="Verify" type="Function">
    /// </field>
    /// <field name="_awp$3" type="Await">
    /// </field>
    Ask.initializeBase(this);
    this.element = $("<div class='Ask AboveHider'/>").css({ position: 'absolute' }).draggable({});
    $(document).trigger('Asking');
}
Ask.ok = function Ask$ok(properties) {
    /// <param name="properties" type="Object">
    /// </param>
    if (typeof(properties) === 'string') {
        properties = { Msg: properties };
    }
    new Await().addAw(ss.Delegate.create(new Ask(), new Ask().okAw), properties).commit();
}
Ask.prototype = {
    Attr: null,
    CancelFace: 'Cancel',
    Complete: null,
    Css: null,
    Customize: null,
    Finally: null,
    Html: null,
    InputType: null,
    Message: null,
    Msg: null,
    OkFace: 'OK',
    SkipFace: 'Skip',
    Title: '',
    Value: null,
    Verify: null,
    _awp$3: null,
    
    get_cancelBtn: function Ask$get_cancelBtn() {
        /// <value type="jQueryObject"></value>
        return $('.CancelBtn', this.element);
    },
    
    okAw: function Ask$okAw(awp, properties) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="properties" type="Object">
        /// </param>
        this.stdTitle(awp, properties);
        this.stdContent();
        this.stdBtns(ss.Delegate.create(this, this.okEv));
        DomElement.focusElementAw(Await.get_asyncAw(), $('.OkBtn', this.element));
    },
    
    okCancelAw: function Ask$okCancelAw(awp, properties) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="properties" type="Object">
        /// </param>
        this.stdTitle(awp, properties);
        this.stdContent();
        this.stdBtns(ss.Delegate.create(this, this.okEv), ss.Delegate.create(this, this.cancelEv));
        DomElement.focusElementAw(Await.get_asyncAw(), $('.OkBtn', this.element));
    },
    
    textAw: function Ask$textAw(awp, properties) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="properties" type="Object">
        /// </param>
        this.InputType = this.InputType || 'text';
        this.stdTitle(awp, properties);
        $("<input type='" + this.InputType + "' class='Content'/>").appendTo(this.element).val(this.Value || '').css(this.Css || {}).attr(this.Attr || {});
        this.stdBtns(ss.Delegate.create(this, this.okTextEv), ss.Delegate.create(this, this.cancelEv));
        DomElement.focusElementAw(Await.get_asyncAw(), $('input[type=' + this.InputType + ']', this.element));
    },
    
    textAreaAw: function Ask$textAreaAw(awp, properties) {
        /// <summary>
        /// Ask to change text offerred in a pop up textarea box
        /// </summary>
        /// <param name="awp" type="Await">
        /// Awaiter
        /// </param>
        /// <param name="properties" type="Object">
        /// Dictionary including Msg and Value fields
        /// </param>
        this.stdTitle(awp, properties);
        var textarea = $("<textarea class='Content' wrap='hard'/>").appendTo(this.element).val(this.Value || '').css(this.Css || { height: '50px' }).attr(this.Attr || {});
        this.stdBtns(ss.Delegate.create(this, this.okTextAreaEv), ss.Delegate.create(this, this.cancelEv));
        this.element.unbind('keydown.ret').bind('keydown.ask', function(e) {
            if (e.which === 9) {
                DomElement.cancelEvent(e);
                Helpers.insertText(textarea, '\t');
            }
        });
        Keys.filterAll(this.element);
        DomElement.focusElementAw(Await.get_asyncAw(), textarea);
    },
    
    fileUploadAw: function Ask$fileUploadAw(awp, properties) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="properties" type="Object">
        /// </param>
        this.stdTitle(awp, properties);
        if (properties['action'] != null) {
            ThemeBase.pageAction(properties['action']);
        }
        var form = $("<form enctype='multipart/form-data' action='" + Uri.join(ThemeBase.appUri, '/upload.php') + "' method='POST'/>").appendTo(this.element);
        $(String.format("<input type='hidden' name='goto' value='{0}'/>", Uri.path(window.location.href))).appendTo(form);
        $(String.format("<input type='hidden' name='password' value='{0}'/>", properties['password'])).appendTo(form);
        $(String.format("<input type='hidden' name='path' value='{0}'/>", properties['path'])).appendTo(form);
        $(String.format("<input type='hidden' name='filename' value='{0}'/>", properties['filename'])).appendTo(form);
        $("<input type='file' name='thefile' class='Content'/>").appendTo(form);
        this.stdBtns(ss.Delegate.create(this, this.okFileUploadEv), ss.Delegate.create(this, this.cancelFileUploadEv));
        DomElement.focusElementAw(Await.get_asyncAw(), $('input[type=text]', this.element));
    },
    
    stdTitle: function Ask$stdTitle(awp, properties) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="properties" type="Object">
        /// </param>
        this._awp$3 = awp;
        if (!this.tryLoadProperties(properties)) {
            this.Message = properties.toString();
        }
        $('<h1/>').appendTo(this.element).html(this.Msg || this.Message);
        if (this.Html != null) {
            this.Html.appendTo(this.element);
            window.setTimeout(ss.Delegate.create(this, function() {
                $('input', this.Html).first().focus();
            }), 1);
        }
    },
    
    stdContent: function Ask$stdContent() {
        $("<div class='Content'/>").appendTo(this.element);
    },
    
    stdBtns: function Ask$stdBtns(okEv, cancelEv) {
        /// <param name="okEv" type="Function">
        /// </param>
        /// <param name="cancelEv" type="Function">
        /// </param>
        if (cancelEv != null) {
            $("<button class='CancelBtn'/>").appendTo(this.element).html(this.CancelFace).click(cancelEv);
        }
        $("<button class='OkBtn'/>").appendTo(this.element).html(this.OkFace).click(okEv);
        Cluster.hider(true);
        this.element.hide().appendTo(document.body).bind('keydown.ret', function(e) {
            Keys.retKey(e, okEv);
        }).bind('keydown.shiftret', function(e) {
            Keys.shiftRetKey(e, okEv);
        }).bind('keydown.esc', ss.Delegate.create(this, function(e) {
            Keys.escKey(e, cancelEv || ss.Delegate.create(this, this.cancelEv));
        })).fadeInW(250).position({ my: 'center top', at: 'center top', of: window.self, offset: '0 200', collision: 'fit fit' });
        Keys.filterAll(this.element);
        if (this.Customize != null) {
            this.Customize();
        }
    },
    
    okTextEv: function Ask$okTextEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.destroyEv(e, $('input[type=' + this.InputType + ']', this.element).val().trim());
    },
    
    okTextAreaEv: function Ask$okTextAreaEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.destroyEv(e, $('textarea', this.element).val());
    },
    
    okFileUploadEv: function Ask$okFileUploadEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        if (this.Finally != null) {
            this.Finally();
        }
        var name = $('input[type=file]', this.element);
        if (String.isNullOrEmpty(name.val())) {
            Ask.ok('Please choose a file to upload.');
            return;
        }
        var form = $('form', this.element);
        form.submit();
    },
    
    okEv: function Ask$okEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.destroyEv(e, true);
    },
    
    cancelEv: function Ask$cancelEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.destroyEv(e, false);
    },
    
    cancelFileUploadEv: function Ask$cancelFileUploadEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        Nsb.Storage.removeSession('PageAction');
        this.destroyEv(e, false);
    },
    
    destroyEv: function Ask$destroyEv(e, value) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        if (typeof(value) !== 'boolean' || value) {
            if (this.Verify != null && !this.Verify(value)) {
                return;
            }
            if (this.Complete != null) {
                value = this.Complete(value);
            }
        }
        if (this.Finally != null) {
            this.Finally();
        }
        DomElement.cancelEvent(e);
        Cluster.hider(false);
        this.element.fadeOutW(250, ss.Delegate.create(this, function() {
            this.element.remove();
            this._awp$3.doneWith('result', value);
            $(document).trigger('AskingDone');
            $(document).trigger('PageDefaultFocus');
        }));
    }
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.BoxEdit

Nsb.Classes.BoxEdit = function Nsb_Classes_BoxEdit() {
    /// <field name="_el$3" type="jQueryObject">
    /// </field>
    /// <field name="_ta$3" type="jQueryObject">
    /// </field>
    /// <field name="_storeFn$3" type="System.Action`1">
    /// </field>
    /// <field name="_originalContent$3" type="String">
    /// </field>
    /// <field name="_css$3" type="String" static="true">
    /// </field>
    Nsb.Classes.BoxEdit.initializeBase(this);
    this.element = $("<div class='BoxEdit'/>");
    this._ta$3 = $("<textarea class='BoxEditTa'/>").appendTo(this.element).bind('keydown.boxedit', ss.Delegate.create(this, this.keyDownEv));
}
Nsb.Classes.BoxEdit.edit = function Nsb_Classes_BoxEdit$edit(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    /// <returns type="Nsb.Classes.BoxEdit"></returns>
    return new Nsb.Classes.BoxEdit().cloneOf(el).fillFrom(el).glassOn().show();
}
Nsb.Classes.BoxEdit.prototype = {
    _el$3: null,
    _ta$3: null,
    _storeFn$3: null,
    _originalContent$3: null,
    
    show: function Nsb_Classes_BoxEdit$show() {
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this.element.appendTo(document.body);
        window.setTimeout(ss.Delegate.create(this, function() {
            this._ta$3.click().focus().carotToEnd();
        }), 1);
        return this;
    },
    
    hide: function Nsb_Classes_BoxEdit$hide() {
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this.element.remove();
        return this;
    },
    
    storeFn: function Nsb_Classes_BoxEdit$storeFn(storeFn) {
        /// <param name="storeFn" type="System.Action`1">
        /// </param>
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this._storeFn$3 = storeFn;
        return this;
    },
    
    cloneOf: function Nsb_Classes_BoxEdit$cloneOf(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this._el$3 = el;
        var p = el.offset();
        var css = { top: p.top - 4, left: p.left - 4, width: el.outerWidth(true) + 8, height: el.outerHeight(true) + 8 };
        this.element.css(css);
        this._el$3.css({ visibility: 'hidden' });
        return this;
    },
    
    fillFrom: function Nsb_Classes_BoxEdit$fillFrom(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this._originalContent$3 = el.html();
        this._ta$3.val(this._originalContent$3);
        return this;
    },
    
    glassOn: function Nsb_Classes_BoxEdit$glassOn() {
        /// <returns type="Nsb.Classes.BoxEdit"></returns>
        this.element.addClass('AboveHider');
        Cluster.glass(ss.Delegate.create(this, this._enterEv$3));
        return this;
    },
    
    keyDownEv: function Nsb_Classes_BoxEdit$keyDownEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        switch (e.which) {
            case 8:
                break;
            case 13:
                this._enterEv$3(e);
                break;
            case 27:
                this._finishEv$3(e);
                break;
        }
    },
    
    _enterEv$3: function Nsb_Classes_BoxEdit$_enterEv$3(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        Inform.debug('EnterEv()');
        if (e != null && e.shiftKey) {
            return;
        }
        var result = this._ta$3.val();
        if (result !== this._originalContent$3) {
            if (this._el$3 != null) {
                this._el$3.html(result);
            }
            if (this._storeFn$3 != null) {
                this._storeFn$3(result);
            }
        }
        this._finishEv$3(e);
    },
    
    _finishEv$3: function Nsb_Classes_BoxEdit$_finishEv$3(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        DomElement.cancelEvent(e);
        this.hide();
        if (this._el$3 != null) {
            this._el$3.css({ visibility: 'visible' });
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// Css

Css = function Css() {
    /// <field name="white" type="String" static="true">
    /// </field>
    /// <field name="black" type="String" static="true">
    /// </field>
}
Css.resetCss = function Css$resetCss(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    if (el == null) {
        return;
    }
    var deef = '';
    el.css({ color: deef, 'background-color': deef, 'border-color': deef, 'border-size': deef, 'font-size': '100%', font: 'inherit', 'vertical-align': 'baseline' });
}
Css.clone = function Css$clone(from, to, props) {
    /// <param name="from" type="jQueryObject">
    /// </param>
    /// <param name="to" type="jQueryObject">
    /// </param>
    /// <param name="props" type="Array" elementType="String">
    /// </param>
    if (props == null) {
        to.css(from.getStyles());
        return;
    }
    var $enum1 = ss.IEnumerator.getEnumerator(props);
    while ($enum1.moveNext()) {
        var p = $enum1.current;
        to.css(p, from.css(p));
    }
}
Css.unitsOf = function Css$unitsOf(v) {
    /// <param name="v" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return v.substr(v.length - 2, 2);
}
Css.alphaPercent = function Css$alphaPercent(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    if (txt == null) {
        return null;
    }
    var c = Css.getColor(txt);
    return parseInt(c.opacity * 100).toString();
}
Css.isPartialColor = function Css$isPartialColor(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (txt == null) {
        return false;
    }
    var c = Css.getColor(txt);
    return c.opacity < 1 && c.opacity > 0;
}
Css.realBgColor = function Css$realBgColor(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    /// <returns type="String"></returns>
    var c = el.css('background-color');
    while (!parseInt(Css.alphaPercent(c))) {
        el = el.parent();
        if (el == null) {
            return $('body').css('background-color');
        }
        c = el.css('background-color');
    }
    return c;
}
Css.borderWidth = function Css$borderWidth(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var bs = css['border-style'];
    if (bs == null || bs === 'none') {
        return 0;
    }
    var bwt = (css['border-width'] || css['border-left-width']) || ((arguments.length > 1) ? deef.toString() : null) || '0';
    return parseInt(bwt);
}
Css.paddingTop = function Css$paddingTop(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var p = (css['padding-top'] || deef || 0).toString();
    return parseInt(p);
}
Css.paddingLeft = function Css$paddingLeft(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var p = (css['padding-left'] || deef || 0).toString();
    return parseInt(p);
}
Css.paddingRight = function Css$paddingRight(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var p = (css['padding-right'] || deef || 0).toString();
    return parseInt(p);
}
Css.paddingBottom = function Css$paddingBottom(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var p = (css['padding-bottom'] || deef || 0).toString();
    return parseInt(p);
}
Css.paddingHorz = function Css$paddingHorz(css) {
    /// <param name="css" type="Object">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    return Css.paddingLeft(css) + Css.paddingRight(css);
}
Css.paddingVert = function Css$paddingVert(css) {
    /// <param name="css" type="Object">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    return Css.paddingTop(css) + Css.paddingBottom(css);
}
Css.offsetVert = function Css$offsetVert(css, deef) {
    /// <param name="css" type="Object">
    /// </param>
    /// <param name="deef" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    return Css.paddingTop(css, deef) + Css.paddingBottom(css, deef) + Css.borderWidth(css) * 2;
}
Css.getColor = function Css$getColor(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="Nsb.Classes.Color"></returns>
    var c = new Nsb.Classes.Color();
    txt = (txt === 'transparent') ? 'rgba(0, 0, 0, 0)' : txt;
    var cs = (/rgb\s*?\(\s*?(\d+)\s*?,\s*?(\d+)\s*?\,\s*?(\d+)\s*?\)|rgba\s*?\(\s*?(\d+)\s*?,\s*?(\d+)\s*?\,\s*?(\d+)\s*?,\s*?([\d.]+)\s*?\)/).exec(txt);
    if (cs == null) {
        cs = (/#([\da-f])([\da-f])([\da-f])/i).exec(txt);
        if (cs == null) {
            cs = (/#([\da-f][\da-f])([\da-f][\da-f])([\da-f][\da-f])/i).exec(txt);
        }
        if (cs != null) {
            cs[1] = parseInt(cs[1], 16).toString();
            cs[2] = parseInt(cs[2], 16).toString();
            cs[3] = parseInt(cs[3], 16).toString();
        }
    }
    if (cs == null) {
        c.red = c.green = c.blue = 0;
        c.opacity = 1;
    }
    else if (cs[1] != null) {
        c.red = parseInt(cs[1]);
        c.green = parseInt(cs[2]);
        c.blue = parseInt(cs[3]);
        c.opacity = 1;
    }
    else {
        c.red = parseInt(cs[4] || '0');
        c.green = parseInt(cs[5] || '0');
        c.blue = parseInt(cs[6] || '0');
        c.opacity = Math.round(parseFloat((cs[7] || '1')) * 100) / 100;
    }
    return c;
}
Css.fade = function Css$fade(c, percent) {
    /// <param name="c" type="String">
    /// </param>
    /// <param name="percent" type="Number">
    /// </param>
    /// <returns type="String"></returns>
    var cc = Css.getColor(c);
    cc.opacity = Math.round(Math.min(Math.max(cc.opacity - percent, 0), 1) * 100) / 100;
    return cc.toString();
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.Color

Nsb.Classes.Color = function Nsb_Classes_Color() {
    /// <field name="blue" type="Number" integer="true">
    /// </field>
    /// <field name="green" type="Number" integer="true">
    /// </field>
    /// <field name="opacity" type="Number">
    /// </field>
    /// <field name="red" type="Number" integer="true">
    /// </field>
}
Nsb.Classes.Color.prototype = {
    blue: 0,
    green: 0,
    opacity: 0,
    red: 0,
    
    toString: function Nsb_Classes_Color$toString() {
        /// <returns type="String"></returns>
        return 'rgba(' + this.red + ', ' + this.green + ', ' + this.blue + ', ' + this.opacity + ')';
    }
}


////////////////////////////////////////////////////////////////////////////////
// DropTarget

DropTarget = function DropTarget() {
}
DropTarget.dragOverEv = function DropTarget$dragOverEv(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    DomElement.cancelEvent(e);
}
DropTarget.dropObject = function DropTarget$dropObject(e) {
    /// <summary>
    /// Creates a dicitonary of the drop attributes.
    /// Most useful are "url" and "html".
    /// </summary>
    /// <param name="e" type="jQueryEvent">
    /// The event
    /// </param>
    /// <returns type="Object"></returns>
    DomElement.cancelEvent(e);
    var result = {};
    var target = $(e.target);
    result['mouseX'] = e.pageX || e.originalEvent.pageX;
    result['mouseY'] = e.pageY || e.originalEvent.pageY;
    result['target'] = target;
    result['selectTo'] = target.selecTo();
    try {
        var types = e.originalEvent.dataTransfer.types;
        result['types'] = types;
        if (types.contains('url')) {
            var data = e.originalEvent.dataTransfer.getData('url');
            if (data != null) {
                result['imgurl'] = DropTarget._getUrl(data);
            }
        }
        if (types.contains('text/html')) {
            var data = e.originalEvent.dataTransfer.getData('text/html').toLocaleString();
            result['html'] = data;
            var el = $(data);
            var src = el.find('img').attr('src');
            if (String.isNullOrEmpty(src)) {
                src = el.attr('src');
            }
            result['srcurl'] = src;
            var idx = data.indexOf('imgurl=');
            if (idx > 0) {
                var u = data.substr(idx + 7).split('&')[0];
                result['htmlurl'] = decodeURIComponent(u);
            }
        }
        if (types.contains('text/uri-list')) {
            var data = e.originalEvent.dataTransfer.getData('text/uri-list');
            result['uriurl'] = DropTarget._getUrl(data);
        }
        if (types.contains('text')) {
            var data = e.originalEvent.dataTransfer.getData('text');
            result['texturl'] = DropTarget._getUrl(data);
        }
        if (types.contains('text/plain')) {
            var data = e.originalEvent.dataTransfer.getData('text/plain');
            result['texturl2'] = DropTarget._getUrl(data);
        }
    }
    catch ($e1) {
    }
    result['url'] = result['imgurl'] || result['htmlurl'] || result['texturl'] || result['texturl2'] || result['uriurl'] || result['srcurl'];
    if (!ss.isValue(result['url'])) {
        result['url'] = null;
    }
    else if (!/^https?:/.test(result['url'])) {
        result['url'] = 'http://' + result['url'];
    }
    return result;
}
DropTarget._getUrl = function DropTarget$_getUrl(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var q = txt.split('?')[1] || txt;
    var p = Uri.pairs(q);
    return p['imgurl'] || txt;
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.Evo

Nsb.Classes.Evo = function Nsb_Classes_Evo() {
    /// <field name="name" type="String">
    /// </field>
    /// <field name="result" type="Nsb.Classes.ResponseType">
    /// </field>
    /// <field name="value" type="Object">
    /// </field>
    /// <field name="event" type="jQueryEvent">
    /// </field>
    /// <field name="_awp" type="Await">
    /// </field>
    /// <field name="_delayResponse" type="Boolean">
    /// </field>
    /// <field name="_evoke" type="Object">
    /// </field>
    /// <field name="_evokeName" type="String">
    /// </field>
    /// <field name="_fn" type="Object">
    /// </field>
    /// <field name="_response" type="Object">
    /// </field>
    /// <field name="_responseName" type="String">
    /// </field>
    /// <field name="_ckFailed" type="Boolean">
    /// </field>
    /// <field name="storeBlobAw" type="String" static="true">
    /// </field>
    /// <field name="_evoEvents" type="Object" static="true">
    /// </field>
    /// <field name="data" type="Object" static="true">
    /// </field>
    /// <field name="noEvoWarnings" type="Boolean" static="true">
    /// </field>
}
Nsb.Classes.Evo.tryEv = function Nsb_Classes_Evo$tryEv(className, methodName, e) {
    /// <param name="className" type="String">
    /// </param>
    /// <param name="methodName" type="String">
    /// </param>
    /// <param name="e" type="jQueryEvent">
    /// </param>
    if ((className in window.self) && (typeof(window.self[className][methodName]) === 'function')) {
        window[className][methodName](e);
    }
    else {
        Inform.warn('failed to find {0}.{1}()', className, methodName);
    }
}
Nsb.Classes.Evo.bind = function Nsb_Classes_Evo$bind(name, evo) {
    /// <param name="name" type="String">
    /// </param>
    /// <param name="evo" type="Nsb.Classes.Evo">
    /// </param>
    Nsb.Classes.Evo._evoEvents[name] = evo;
}
Nsb.Classes.Evo.trigger = function Nsb_Classes_Evo$trigger(name, value) {
    /// <param name="name" type="String">
    /// </param>
    /// <param name="value" type="Object">
    /// </param>
    try {
        if (arguments.length > 1) {
            Nsb.Classes.Evo._evoEvents[name].setValue(value).fire();
        }
        else {
            Nsb.Classes.Evo._evoEvents[name].fire();
        }
    }
    catch (ex) {
        if (!(name in Nsb.Classes.Evo._evoEvents)) {
            Inform.warn('Evo.Trigger({0}) event unavailable', name);
        }
        else {
            throw ex;
        }
    }
}
Nsb.Classes.Evo.triggerAw = function Nsb_Classes_Evo$triggerAw(awp, name, value) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="name" type="String">
    /// </param>
    /// <param name="value" type="Object">
    /// </param>
    try {
        Nsb.Classes.Evo._evoEvents[name].setValue(value).fire(awp);
    }
    catch (ex) {
        if (!(name in Nsb.Classes.Evo._evoEvents)) {
            if (!Nsb.Classes.Evo.noEvoWarnings) {
                Inform.warn('Evo.TriggerAw({0}) event missing', name);
            }
        }
        else {
            throw ex;
        }
    }
}
Nsb.Classes.Evo.set = function Nsb_Classes_Evo$set(name, value) {
    /// <param name="name" type="String">
    /// </param>
    /// <param name="value" type="Object">
    /// </param>
    Nsb.Classes.Evo.data[name] = value;
}
Nsb.Classes.Evo.get = function Nsb_Classes_Evo$get(name) {
    /// <param name="name" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return Nsb.Classes.Evo.data[name];
}
Nsb.Classes.Evo.prototype = {
    name: null,
    result: 0,
    value: null,
    event: null,
    _awp: null,
    _delayResponse: false,
    _evoke: null,
    _evokeName: null,
    _fn: null,
    _response: null,
    _responseName: null,
    _ckFailed: false,
    
    setValue: function Nsb_Classes_Evo$setValue(name, value) {
        /// <param name="name" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        this.name = (arguments.length > 1) ? name : '';
        this.value = (arguments.length > 1) ? value : name || null;
        return this;
    },
    
    evoke: function Nsb_Classes_Evo$evoke(ob, name) {
        /// <param name="ob" type="Object">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        this._evoke = ob;
        this._evokeName = name || '';
        return this;
    },
    
    response: function Nsb_Classes_Evo$response(ob, name) {
        /// <param name="ob" type="Object">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        this._response = ob;
        this._responseName = name || '';
        return this;
    },
    
    fn: function Nsb_Classes_Evo$fn(fn, name) {
        /// <param name="fn" type="Object">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        this._fn = fn;
        this._evokeName = name || '';
        return this;
    },
    
    ev: function Nsb_Classes_Evo$ev(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        this.event = e;
        return this;
    },
    
    ck: function Nsb_Classes_Evo$ck(fn) {
        /// <summary>
        /// Prevents fireing if the check clause is false.
        /// Only runs the check on creaton so does not re check on cached Evo's
        /// </summary>
        /// <param name="fn" type="Function">
        /// bool check function
        /// </param>
        /// <returns type="Nsb.Classes.Evo"></returns>
        if (typeof(fn) !== 'function') {
            this._ckFailed = fn == null;
        }
        else {
            this._ckFailed = fn();
        }
        return this;
    },
    
    fireWith: function Nsb_Classes_Evo$fireWith(fn, name, value) {
        /// <param name="fn" type="System.Action`1">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        this.evoke(fn);
        if (arguments.length > 2) {
            this.name = name;
            this.setValue(value);
        }
        else if (arguments.length > 1) {
            this.setValue(name);
        }
        this.fire();
    },
    
    fireOn: function Nsb_Classes_Evo$fireOn(ob, method, name, value) {
        /// <param name="ob" type="Object">
        /// </param>
        /// <param name="method" type="String">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        this.evoke(ob, method);
        if (arguments.length > 3) {
            this.setValue(name, value);
        }
        else {
            this.setValue(name);
        }
        this.fire();
    },
    
    fireAsync: function Nsb_Classes_Evo$fireAsync(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        this._awp = awp || null;
        this.result = 1;
        window.setTimeout(ss.Delegate.create(this, function() {
            this.fire();
        }), 0);
    },
    
    fire: function Nsb_Classes_Evo$fire(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        if (this._ckFailed) {
            return;
        }
        this._awp = awp || null;
        this.result = 1;
        if (this._evoke == null && this._fn == null) {
            this.respond();
            return;
        }
        if (String.isNullOrEmpty(this._evokeName)) {
            if (this._evoke != null) {
                var fn = this._evoke;
                fn(this);
            }
            else if (this._fn != null) {
                if (awp != null) {
                    this._awp = null;
                    var fn = this._fn;
                    fn(awp, this.value);
                }
                else {
                    var fn = this._fn;
                    fn(this.value);
                }
            }
        }
        else {
            if (this._evoke != null && (typeof(this._evoke[this._evokeName]) === 'function')) {
                this._evoke[this._evokeName](this);
            }
            else if (this._fn != null && (typeof(this._fn[this._evokeName]) === 'function')) {
                this._fn[this._evokeName](this.value);
            }
            else {
                this.result = 3;
            }
        }
        this._tryRespond();
    },
    
    _tryRespond: function Nsb_Classes_Evo$_tryRespond() {
        if (this._delayResponse) {
            return;
        }
        this.result = (this.result === 1) ? 2 : this.result;
        if (this._response == null) {
            this.destroy();
            return;
        }
        if (String.isNullOrEmpty(this._responseName)) {
            var fn = this._response;
            fn(this);
        }
        else {
            if ((typeof(this._response[this._responseName]) === 'function')) {
                this._response[this._responseName](this);
            }
        }
        this.done();
    },
    
    respond: function Nsb_Classes_Evo$respond() {
        this._delayResponse = false;
        this._tryRespond();
        this.destroy();
    },
    
    takeAndOwnResponse: function Nsb_Classes_Evo$takeAndOwnResponse() {
        /// <returns type="Await"></returns>
        var awp = this._awp;
        this._awp = null;
        this._delayResponse = true;
        return awp;
    },
    
    done: function Nsb_Classes_Evo$done() {
        if (this._awp != null) {
            this._awp.done();
            this._awp = null;
        }
    },
    
    destroy: function Nsb_Classes_Evo$destroy() {
        this.done();
        this._evoke = this._response = this.value = null;
        this.result = 0;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Helpers

Helpers = function Helpers() {
}
Helpers.noOp = function Helpers$noOp() {
}
Helpers.methodName = function Helpers$methodName(o) {
    /// <param name="o" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    var s = (o).split('.');
    return s[s.length - 1];
}
Helpers.closureEv = function Helpers$closureEv(fn, arg1, arg2, arg3) {
    /// <param name="fn" type="System.Action`4">
    /// </param>
    /// <param name="arg1" type="Function">
    /// </param>
    /// <param name="arg2" type="Object">
    /// </param>
    /// <param name="arg3" type="Object">
    /// </param>
    /// <returns type="Function"></returns>
    return function(e) {
        fn(e, arg1, arg2, arg3);
    };
}
Helpers.staticInheritClass = function Helpers$staticInheritClass(cls1, cls2) {
    /// <param name="cls1" type="String">
    /// </param>
    /// <param name="cls2" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    jQuery.extend(window[cls2], window[cls1]);
    window[cls1] = window[cls2];
    return true;
}
Helpers.insertText = function Helpers$insertText(tx, text) {
    /// <param name="tx" type="jQueryObject">
    /// </param>
    /// <param name="text" type="String">
    /// </param>
    var input = tx[0];
    if (typeof(input.selectionStart) !== 'undefined') {
        var top = input.scrollTop;
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var value = tx.val();
        tx.val(value.substr(0, start) + text + value.substr(end));
        input.selectionStart = start + text.length;
        input.selectionEnd = start + text.length;
        input.scrollTop = top;
        tx.focus();
    }
    else {
        Inform.error('InsertText has no selectionStart');
    }
}


////////////////////////////////////////////////////////////////////////////////
// Keys

Keys = function Keys() {
    /// <field name="_arrowCodes" type="Array" elementType="Number" elementInteger="true" static="true">
    /// </field>
    /// <field name="_visibleCodes" type="Array" elementType="Number" elementInteger="true" static="true">
    /// </field>
    /// <field name="_blackCodes" type="Array" elementType="Number" elementInteger="true" static="true">
    /// </field>
}
Keys.mapKey = function Keys$mapKey(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="String"></returns>
    return ((Keys._isKey(e.which, Keys._visibleCodes)) ? String.fromCharCode(e.which) : e.which.toString() + ':') + ((e.ctrlKey) ? 'c' : '') + ((e.shiftKey) ? 's' : '') + ((e.altKey) ? 'a' : '');
}
Keys.doKeys = function Keys$doKeys(e, map) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="map" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    var k = Keys.mapKey(e);
    var ka = map[k];
    if (ka != null) {
        ka(e);
        return null;
    }
    Inform.debug('Unknown MapKey={0}', k);
    return k;
}
Keys.filterAll = function Keys$filterAll(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    el.bind('keydown.filterkeysdown', function(e) {
        e.stopPropagation();
    });
    el.bind('keyup.filterkeysup', function(e) {
        e.stopPropagation();
    });
}
Keys.retKey = function Keys$retKey(e, fn) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    Keys.onKey(e, 13, true, fn);
}
Keys.shiftRetKey = function Keys$shiftRetKey(e, fn) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    Keys.onKey(e, 13, e.shiftKey, fn);
}
Keys.escKey = function Keys$escKey(e, fn) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    Keys.onKey(e, 27, true, fn);
}
Keys.tabKey = function Keys$tabKey(e, fn) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="fn" type="Function">
    /// </param>
    Keys.onKey(e, 9, true, fn);
}
Keys.docKeyDown = function Keys$docKeyDown(ns, code, quals, handler) {
    /// <param name="ns" type="String">
    /// </param>
    /// <param name="code" type="Number" integer="true">
    /// </param>
    /// <param name="quals" type="Boolean">
    /// </param>
    /// <param name="handler" type="Function">
    /// </param>
    $(document).bind('keydown' + ns, function(e) {
        Keys.onKey(e, code, quals, handler);
    });
}
Keys.docKeyReleaseAll = function Keys$docKeyReleaseAll(ns) {
    /// <param name="ns" type="String">
    /// </param>
    $(document).unbind(ns);
}
Keys.onKey = function Keys$onKey(e, code, quals, handler) {
    /// <summary>
    /// Call a handler for the given key
    /// </summary>
    /// <param name="e" type="jQueryEvent">
    /// Key event
    /// </param>
    /// <param name="code" type="Number" integer="true">
    /// Key code
    /// </param>
    /// <param name="quals" type="Boolean">
    /// key code qualifiers or'd together or just true for all qualifiers
    /// </param>
    /// <param name="handler" type="Function">
    /// handler function
    /// </param>
    if (e.which === code && quals) {
        DomElement.cancelEvent(e);
        handler(e);
    }
}
Keys._isKey = function Keys$_isKey(k, codes) {
    /// <param name="k" type="Number" integer="true">
    /// </param>
    /// <param name="codes" type="Array" elementType="Number" elementInteger="true">
    /// </param>
    /// <returns type="Boolean"></returns>
    for (var i = 0; i < codes.length; i += 2) {
        if (k >= codes[i] && k <= codes[i + 1]) {
            return true;
        }
    }
    return false;
}
Keys.arrowKey = function Keys$arrowKey(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="Boolean"></returns>
    return Keys._isKey(e.which, Keys._arrowCodes);
}
Keys.blackKey = function Keys$blackKey(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="Boolean"></returns>
    return Keys._isKey(e.which, Keys._blackCodes);
}
Keys.changeKey = function Keys$changeKey(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="Boolean"></returns>
    switch (e.target.tagName.toLowerCase()) {
        case 'select':
            return Keys.arrowKey(e);
    }
    return Keys.blackKey(e);
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.Text

Nsb.Classes.Text = function Nsb_Classes_Text() {
}
Nsb.Classes.Text.getSelectedText = function Nsb_Classes_Text$getSelectedText() {
    /// <returns type="String"></returns>
    var t = '';
    if (window.getSelection) {
        t = window.getSelection();
    }
    else if (document.getSelection) {
        t = document.getSelection();
    }
    else if (document.selection) {
        t = document.selection.createRange().text;
    }
    return t.toString();
}


////////////////////////////////////////////////////////////////////////////////
// Undo

Undo = function Undo() {
    /// <field name="_st" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_at" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_was" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_max" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_max" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="bypassUndo" type="Boolean" static="true">
    /// </field>
    /// <field name="allowUndo" type="Boolean" static="true">
    /// </field>
}
Undo._key = function Undo$_key(dbKey, idx) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <param name="idx" type="Number" integer="true">
    /// </param>
    /// <returns type="String"></returns>
    return 'UndoBuffer' + '.' + dbKey + '.' + idx;
}
Undo._idxKey = function Undo$_idxKey(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return 'UndoBuffer' + '.' + dbKey + '#idxs';
}
Undo._loadIndexes = function Undo$_loadIndexes(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    var sv = Nsb.Storage.getSession(Undo._idxKey(dbKey));
    if (ss.isValue(sv)) {
        Undo._st = sv['_st'];
        Undo._at = sv['_at'];
        Undo._max = sv['_max'];
    }
    else {
        Undo._st = Undo._at = 0;
        Undo._max = 10;
    }
}
Undo._saveIndexes = function Undo$_saveIndexes(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    Nsb.Storage.setSession(Undo._idxKey(dbKey), { _st: Undo._st, _at: Undo._at, _max: Undo._max });
}
Undo.prior = function Undo$prior(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    Undo._loadIndexes(dbKey);
    Undo._was = Undo._at;
    Undo._at = (Undo._at <= 0) ? Undo._max : Undo._at - 1;
    if (Undo._at === Undo._st) {
        Undo._at = Undo._was;
        return null;
    }
    var key = Undo._key(dbKey, Undo._at);
    var content = Nsb.Storage.getSession(key);
    if (!ss.isValue(content)) {
        Undo._at = Undo._was;
        return null;
    }
    Undo._saveIndexes(dbKey);
    return content;
}
Undo.next = function Undo$next(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    Undo._loadIndexes(dbKey);
    Undo._was = Undo._at;
    if (Undo._at === Undo._st) {
        Undo._at = Undo._was;
        return null;
    }
    Undo._at = (Undo._at >= Undo._max) ? 0 : Undo._at + 1;
    var key = Undo._key(dbKey, Undo._at);
    var content = Nsb.Storage.getSession(key);
    if (!ss.isValue(content)) {
        Undo._at = Undo._was;
        return null;
    }
    Undo._saveIndexes(dbKey);
    return content;
}
Undo.save = function Undo$save(buff, dbKey) {
    /// <param name="buff" type="Object">
    /// </param>
    /// <param name="dbKey" type="String">
    /// </param>
    Undo._loadIndexes(dbKey);
    Undo._purge(dbKey);
    Undo._saveThis(buff, dbKey);
}
Undo.start = function Undo$start(buff, dbKey) {
    /// <param name="buff" type="Object">
    /// </param>
    /// <param name="dbKey" type="String">
    /// </param>
    if (!ss.isValue(Nsb.Storage.getSession(Undo._idxKey(dbKey)))) {
        Undo._clear(dbKey);
        Undo._saveThis(buff, dbKey);
    }
}
Undo._saveThis = function Undo$_saveThis(buff, dbKey) {
    /// <param name="buff" type="Object">
    /// </param>
    /// <param name="dbKey" type="String">
    /// </param>
    Undo._at = Undo._st = (Undo._at >= Undo._max) ? 0 : Undo._at + 1;
    var key = Undo._key(dbKey, Undo._at);
    Nsb.Storage.setSession(key, buff);
    Undo._saveIndexes(dbKey);
}
Undo.hasPrior = function Undo$hasPrior(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return Undo._has(Undo.prior(dbKey), dbKey);
}
Undo.hasNext = function Undo$hasNext(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return Undo._has(Undo.next(dbKey), dbKey);
}
Undo._has = function Undo$_has(tst, dbKey) {
    /// <param name="tst" type="Object">
    /// </param>
    /// <param name="dbKey" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    Undo._at = Undo._was;
    Undo._saveIndexes(dbKey);
    return ss.isValue(tst);
}
Undo._purge = function Undo$_purge(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    Undo._was = Undo._at;
    while (Undo._at !== Undo._st) {
        Undo._at = (Undo._at >= Undo._max) ? 0 : Undo._at + 1;
        var key = Undo._key(dbKey, Undo._at);
        try {
            window.sessionStorage.removeItem(key);
        }
        catch ($e1) {
            window.sessionStorage[key] = '';
        }
    }
    Undo._at = Undo._st = Undo._was;
}
Undo._clear = function Undo$_clear(dbKey) {
    /// <param name="dbKey" type="String">
    /// </param>
    Undo._clearFor('UndoBuffer' + '.' + dbKey + '.');
}
Undo.clearAll = function Undo$clearAll() {
    Undo._clearFor('UndoBuffer' + '.');
}
Undo._clearFor = function Undo$_clearFor(key) {
    /// <param name="key" type="String">
    /// </param>
    Undo._st = Undo._at = 0;
    Undo._max = 10;
    var keys = [];
    for (var i = 0; i < window.sessionStorage.length; i++) {
        if (window.sessionStorage.key(i).substr(0, key.length) === key) {
            keys.add(window.sessionStorage.key(i));
        }
    }
    var $enum1 = ss.IEnumerator.getEnumerator(keys);
    while ($enum1.moveNext()) {
        var k = $enum1.current;
        try {
            window.sessionStorage.removeItem(k);
        }
        catch ($e2) {
            window.sessionStorage[k] = '';
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// Uri

Uri = function Uri() {
    /// <field name="queryData" type="Object" static="true">
    /// </field>
}
Uri.get_masterVersion = function Uri$get_masterVersion() {
    /// <value type="String"></value>
    return Nsb.Storage.getLocal('MasterVersionId') || Uri.bumpVersion();
}
Uri.relative = function Uri$relative(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return uri;
}
Uri.isHttp = function Uri$isHttp(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return (/^https?:\/\//i).test(uri);
}
Uri.uniqueify = function Uri$uniqueify(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.addPair(Uri.relative(uri), '_', new Date().getTime().toString());
}
Uri.img = function Uri$img(path) {
    /// <param name="path" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.join(ThemeBase.mediaImgUri, path);
}
Uri.dbPath = function Uri$dbPath(path) {
    /// <param name="path" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.debugJs(Uri.join(ThemeBase.dbPath, path));
}
Uri.app = function Uri$app(path) {
    /// <param name="path" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.debugJs(Uri.join(ThemeBase.appUri, path));
}
Uri.scripts = function Uri$scripts(path) {
    /// <param name="path" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.debugJs(Uri.join(ThemeBase.scriptsUri, path));
}
Uri.appNd = function Uri$appNd(path) {
    /// <summary>
    /// App without .debug. added to .js files
    /// </summary>
    /// <param name="path" type="String">
    /// The path.
    /// </param>
    /// <returns type="String"></returns>
    return Uri.versionize(Uri.join(ThemeBase.appUri, path));
}
Uri.scriptsNd = function Uri$scriptsNd(path) {
    /// <summary>
    /// Scripts without .debug. added to .js files
    /// </summary>
    /// <param name="path" type="String">
    /// The path.
    /// </param>
    /// <returns type="String"></returns>
    return Uri.versionize(Uri.join(ThemeBase.scriptsUri, path));
}
Uri.debugJs = function Uri$debugJs(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Uri.versionize((ThemeBase.devServer) ? Uri.relative(uri).replace(/\.js$|\.js(\?)/, '.debug.js$1') : Uri.relative(uri));
}
Uri.smart = function Uri$smart(path) {
    /// <param name="path" type="String">
    /// </param>
    /// <returns type="String"></returns>
    if (!path.indexOf('Scripts/')) {
        return Uri.scripts(path.substr(8));
    }
    if (!path.indexOf('data/')) {
        return Uri.app(path.substr(5));
    }
    if (!path.indexOf('app/')) {
        return Uri.app(path.substr(4));
    }
    return Uri.debugJs(path);
}
Uri.path = function Uri$path(uri) {
    /// <summary>
    /// All of the uri before the question mark (?)
    /// </summary>
    /// <param name="uri" type="String">
    /// The URI.
    /// </param>
    /// <returns type="String"></returns>
    return (Uri.relative(uri) || '').split('?')[0];
}
Uri.query = function Uri$query(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return (uri || '').split('?')[1] || '';
}
Uri.front = function Uri$front(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var f = Uri.path(uri);
    return f.substr(0, f.length - Uri.end(uri).length - 1);
}
Uri.end = function Uri$end(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var p = Uri.path(uri).split('/');
    return p[p.length - 1];
}
Uri.ext = function Uri$ext(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var sa = Uri.end(uri).split('.');
    return (sa.length === 1) ? '' : '.' + sa[sa.length - 1];
}
Uri.removeExt = function Uri$removeExt(name) {
    /// <param name="name" type="String">
    /// </param>
    /// <returns type="String"></returns>
    name = name || '';
    var ns = name.split('.');
    return (ns.length > 1) ? name.substr(0, name.length - ns[ns.length - 1].length - 1) : name;
}
Uri.join = function Uri$join(u1, u2, u3, u4) {
    /// <summary>
    /// Joins paths with slashes.
    /// </summary>
    /// <param name="u1" type="String">
    /// path part
    /// </param>
    /// <param name="u2" type="String">
    /// path part
    /// </param>
    /// <param name="u3" type="String">
    /// path part
    /// </param>
    /// <param name="u4" type="String">
    /// path part
    /// </param>
    /// <returns type="String"></returns>
    var s1 = !String.isNullOrEmpty(u1);
    var s2 = !String.isNullOrEmpty(u2);
    var s3 = !String.isNullOrEmpty(u3);
    var s4 = !String.isNullOrEmpty(u4);
    return (((!s1) ? '' : u1.trim()) + ((!s2) ? '' : ((s1) ? '/' : '') + u2.trim()) + ((!s3) ? '' : ((s1 || s2) ? '/' : '') + u3.trim()) + ((!s4) ? '' : ((s1 || s2 || s3) ? '/' : '') + u4.trim())).replace(/\/+/g, '/').replace(/^(https?:)\//g, '$1//');
}
Uri.pairs = function Uri$pairs(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    var d = {};
    if (txt.substr(0, 1) === '?') {
        txt = txt.substr(1);
    }
    var pairs = txt.split('&');
    if (pairs.length > 0) {
        var $enum1 = ss.IEnumerator.getEnumerator(pairs);
        while ($enum1.moveNext()) {
            var pair = $enum1.current;
            var p = pair.split('=');
            if (String.isNullOrEmpty(p[0])) {
                continue;
            }
            if (p.length >= 2) {
                d[decodeURIComponent(p[0])] = decodeURIComponent(pair.substr(p[0].length + 1));
            }
            else {
                d[decodeURIComponent(p[0])] = '';
            }
        }
    }
    return d;
}
Uri.getValue = function Uri$getValue(url, nm) {
    /// <param name="url" type="String">
    /// </param>
    /// <param name="nm" type="String">
    /// </param>
    /// <returns type="String"></returns>
    try {
        return Uri.pairs(Uri.query(url))[nm];
    }
    catch ($e1) {
        return null;
    }
}
Uri.serialize = function Uri$serialize(d) {
    /// <param name="d" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    var ot = '';
    var $dict1 = d;
    for (var $key2 in $dict1) {
        var pair = { key: $key2, value: $dict1[$key2] };
        ot += ((ot.length > 0) ? '&' : '') + encodeURIComponent(pair.key) + '=' + encodeURIComponent((pair.value || '').toString());
    }
    return ot;
}
Uri.addPair = function Uri$addPair(uri, name, value) {
    /// <param name="uri" type="String">
    /// </param>
    /// <param name="name" type="String">
    /// </param>
    /// <param name="value" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var d = Uri.pairs(Uri.query(uri));
    d[name] = value;
    return Uri.path(uri) + '?' + Uri.serialize(d);
}
Uri.parseFromCss = function Uri$parseFromCss(css) {
    /// <param name="css" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return ((/url\((.*)\)/g).exec(css || '')[1] || '').trim();
}
Uri.bumpVersion = function Uri$bumpVersion() {
    /// <returns type="String"></returns>
    var v = new Date().getTime().toString();
    Nsb.Storage.setLocal('MasterVersionId', v);
    return v;
}
Uri.versionize = function Uri$versionize(uri) {
    /// <param name="uri" type="String">
    /// </param>
    /// <returns type="String"></returns>
    uri = Uri.relative(uri) || '';
    if (uri.indexOf('.') === -1) {
        return uri;
    }
    var rx = /url\([^\)]+\)/;
    if (rx.test(uri)) {
        return uri.replace(rx, 'url(' + Uri.addPair(Uri.parseFromCss(uri), '_', Uri.get_masterVersion()) + ')');
    }
    return Uri.addPair(uri, '_', Uri.get_masterVersion());
}


////////////////////////////////////////////////////////////////////////////////
// DDict

DDict = function DDict() {
    /// <field name="_dict" type="Object">
    /// </field>
    this._dict = {};
}
DDict.prototype = {
    
    add: function DDict$add(key, dj) {
        /// <param name="key" type="String">
        /// </param>
        /// <param name="dj" type="Object">
        /// </param>
        /// <returns type="DDict"></returns>
        this._dict[key] = dj;
        return this;
    },
    
    end: function DDict$end() {
        /// <returns type="Object"></returns>
        return this._dict;
    }
}


////////////////////////////////////////////////////////////////////////////////
// DList

DList = function DList() {
    /// <field name="_list" type="Array">
    /// </field>
    this._list = [];
}
DList.prototype = {
    
    add: function DList$add(dj) {
        /// <param name="dj" type="Object">
        /// </param>
        /// <returns type="DList"></returns>
        this._list.add(dj);
        return this;
    },
    
    end: function DList$end() {
        /// <returns type="Array"></returns>
        return this._list;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Cluster

Cluster = function Cluster() {
    /// <field name="truples" type="Object" static="true">
    /// </field>
    /// <field name="elements" type="Object" static="true">
    /// </field>
    /// <field name="hiderElement" type="jQueryObject" static="true">
    /// </field>
    /// <field name="_hiderCount$1" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_spinnerTgB$1" type="Boolean" static="true">
    /// </field>
    /// <field name="_spinnerCnt$1" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="ClassName" type="String">
    /// </field>
    Cluster.initializeBase(this);
}
Cluster.glassCss = function Cluster$glassCss(bkgnd) {
    /// <param name="bkgnd" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return { position: 'absolute', top: 0, left: 0, width: DomElement.documentWidth(), height: DomElement.documentHeight(), margin: 0, padding: 0, background: bkgnd };
}
Cluster.hider = function Cluster$hider(hiderOn, opacity) {
    /// <param name="hiderOn" type="Boolean">
    /// </param>
    /// <param name="opacity" type="Number">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    opacity = (opacity || 0.55);
    if (hiderOn) {
        if (Cluster._hiderCount$1++ > 0) {
            return $('#HiderSurface');
        }
        Cluster.hiderElement = $("<div id='HiderSurface'/>").appendTo(document.body).css(Cluster.glassCss('#000')).css({ opacity: opacity }).addClass('HiderZee').show();
        Cluster.hiderElement.swallowAllMouseEvents();
        return Cluster.hiderElement;
    }
    if (--Cluster._hiderCount$1 > 0) {
        return $('#HiderSurface');
    }
    $('.HiderSpinner').remove();
    var el = Cluster.hiderElement;
    Cluster.hiderElement = null;
    if (el != null) {
        FileBlobBase.svCnt++;
        el.fadeOut(200, function() {
            $('#HiderSurface').unbind('.swallowed').remove();
            FileBlobBase.svCnt--;
        });
    }
    return null;
}
Cluster._addSpinner$1 = function Cluster$_addSpinner$1() {
    /// <returns type="Boolean"></returns>
    $(document).bind('Spinner', Cluster.spinnerTg);
    return !Cluster._spinnerTgB$1;
}
Cluster.spinnerTg = function Cluster$spinnerTg(e, oon, opacity) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <param name="oon" type="Boolean">
    /// </param>
    /// <param name="opacity" type="Number">
    /// </param>
    if (oon) {
        if (Cluster._spinnerCnt$1++ > 0) {
            return;
        }
        Cluster.hider(true, (typeof(opacity) === 'number') ? opacity : 0.8);
        $("<div id='HiderSpinner' class='AboveHider'><img src='" + Uri.img('Common/spinner30.gif') + "'></div>").appendTo(document.body).position({ my: 'center', at: 'center', of: window.self });
    }
    else if (--Cluster._spinnerCnt$1 <= 0) {
        Cluster._spinnerCnt$1 = 0;
        Cluster.hider(false);
        $('#HiderSpinner').remove();
    }
}
Cluster.spinner = function Cluster$spinner(oon, opacity) {
    /// <param name="oon" type="Boolean">
    /// </param>
    /// <param name="opacity" type="Number">
    /// </param>
    Cluster.spinnerTg(null, oon, opacity);
}
Cluster.glass = function Cluster$glass(clickFn) {
    /// <param name="clickFn" type="Function">
    /// </param>
    /// <returns type="jQueryObject"></returns>
    Cluster.glassOff();
    var glass = $("<div class='VirtualGlass'/>");
    glass.appendTo(document.body).css(Cluster.glassCss('transparent')).addClass('GlassZee').mousedown(function(e) {
        if (e.target === glass[0]) {
            Cluster.glassOff();
        }
        DomElement.cancelEvent(e);
    });
    glass.data('GlassOffFn', clickFn);
    $(window).unbind('resize.Glass').bind('resize.Glass', function() {
        var vg = $('body > .VirtualGlass');
        var fn = vg.data('GlassOffFn');
        vg.removeData('GlassOffFn');
        Cluster.glassOff();
        Cluster.glass(fn);
    });
    return glass;
}
Cluster.glassOff = function Cluster$glassOff(noClick) {
    /// <summary>
    /// Turns off the glass firing the click function unless noClick=true
    /// </summary>
    /// <param name="noClick" type="Boolean">
    /// if set to <c>true</c> don't fire the click function.
    /// </param>
    var glass = $('body > .VirtualGlass');
    if (glass.length > 0) {
        glass.each(function(i, domEl) {
            var ths = $(domEl);
            var clickFn = ths.data('GlassOffFn');
            if (!noClick && clickFn != null) {
                clickFn();
            }
            if (!ths.data('GlassStay')) {
                $(window).unbind('.Glass');
                ths.removeData('GlassOffFn');
                ths.removeData('GlassStay');
                ths.remove();
            }
        });
    }
}
Cluster.glassStay = function Cluster$glassStay(stay) {
    /// <param name="stay" type="Boolean">
    /// </param>
    stay = arguments.length <= 0 || stay;
    var glass = $('body > .VirtualGlass');
    if (glass.length > 0) {
        glass.each(function(i, domEl) {
            var ths = $(domEl);
            ths.data('GlassStay', stay);
        });
    }
}
Cluster.flashWindow = function Cluster$flashWindow(color) {
    /// <param name="color" type="String">
    /// </param>
    color = color || 'rgba(255,255,0,.3)';
    var fade = 40;
    $("<div id='FlashGlass' class='HiderZee'/>").appendTo(document.body).css(Cluster.glassCss(color)).hide().fadeIn(fade, function() {
        $('#FlashGlass').fadeOut(fade, function() {
            $('#FlashGlass').remove();
        });
    });
}
Cluster.prototype = {
    ClassName: null,
    
    tryLoadProperties: function Cluster$tryLoadProperties(properties) {
        /// <param name="properties" type="Object">
        /// </param>
        /// <returns type="Boolean"></returns>
        if (typeof(properties) === 'object') {
            if (ss.isValue(properties)) {
                var $dict1 = properties;
                for (var $key2 in $dict1) {
                    var kv = { key: $key2, value: $dict1[$key2] };
                    try {
                        var d = this;
                        d[kv.key] = kv.value;
                    }
                    catch ($e3) {
                    }
                }
            }
            return true;
        }
        return false;
    },
    
    hiderAw: function Cluster$hiderAw(awp, hiderOn, opacity) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="hiderOn" type="Boolean">
        /// </param>
        /// <param name="opacity" type="Number">
        /// </param>
        Cluster.hider(hiderOn, opacity);
        if (this.element != null) {
            if (hiderOn) {
                this.element.addClass('AboveHider');
            }
            else {
                this.element.removeClass('AboveHider');
            }
        }
        awp.done();
    }
}


////////////////////////////////////////////////////////////////////////////////
// EditHtml

EditHtml = function EditHtml(awp, edEl) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="edEl" type="jQueryObject">
    /// </param>
    /// <field name="eAwp" type="Await">
    /// </field>
    /// <field name="_eCss$3" type="Object">
    /// </field>
    /// <field name="edEl" type="jQueryObject">
    /// </field>
    /// <field name="textIn" type="String">
    /// </field>
    /// <field name="textarea" type="jQueryObject">
    /// </field>
    /// <field name="_autoErDiv$3" type="jQueryObject" static="true">
    /// </field>
    /// <field name="_autoEr$3" type="jQueryObject">
    /// </field>
    /// <field name="_regExLf$3" type="RegExp" static="true">
    /// </field>
    EditHtml.initializeBase(this);
    this.eAwp = awp;
    this.edEl = edEl;
    this.element = $("<div class='EditContent'/>").appendTo(document.body).bind('keydown.esc', ss.Delegate.create(this, function(e) {
        Keys.escKey(e, ss.Delegate.create(this, this.cancel));
    }));
    this.textIn = edEl.getFValueString();
    this.textarea = $('<textarea/>').appendTo(this.element).fValueString(this.textIn).blur(ss.Delegate.create(this, this.ok));
    this._eCss$3 = edEl.cloneEditCSS();
    this.textarea.css(this._eCss$3).bind('keyup.EditHtml', ss.Delegate.create(this, function(e) {
        if (Keys.blackKey(e) || (e.which === 13 && e.shiftKey)) {
            this.textarea.css('height', this._autoHeight$3(this.textarea) + 'px');
        }
    })).bind('keydown.EditHtml', ss.Delegate.create(this, function(e) {
        if (e.which === 9) {
            this.next(e);
        }
        else if (e.which === 13) {
            if (e.shiftKey) {
                return;
            }
            DomElement.cancelEvent(e);
            this.textarea.blur();
            this.cont(e);
        }
        else if (e.which === 40) {
            window.setTimeout(ss.Delegate.create(this, function() {
                if (this.textarea.getSelection()['start'] === this.textarea.val().length) {
                    this.next(e);
                }
            }), 1);
        }
        else if (e.which === 38) {
            var sel = this.textarea.getSelection()['start'];
            window.setTimeout(ss.Delegate.create(this, function() {
                if (this.textarea.getSelection()['start'] === sel) {
                    this.prior(e);
                }
            }), 1);
        }
    }));
    Keys.filterAll(this.element);
    new Await().addDx(ss.Delegate.create(this, function() {
        this.textarea.focus();
    })).commit();
}
EditHtml.prototype = {
    eAwp: null,
    _eCss$3: null,
    edEl: null,
    textIn: null,
    textarea: null,
    _autoEr$3: null,
    
    destroy: function EditHtml$destroy() {
        this.element.remove();
    },
    
    ok: function EditHtml$ok(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        var txtOut = this.textarea.getFValueString();
        this.eAwp.set_item('changed', this.textIn !== txtOut);
        this.edEl.fValueString(txtOut);
        this.destroy();
        this.eAwp.done();
    },
    
    cancel: function EditHtml$cancel(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this.destroy();
        throw new Error('User Cancelled');
    },
    
    cont: function EditHtml$cont(e) {
        /// <summary>
        /// What to do when shift-enter is pressed to signify edit is done
        /// and move on to possibly create a new list item.
        /// </summary>
        /// <param name="e" type="jQueryEvent">
        /// jQueryEvent
        /// </param>
    },
    
    next: function EditHtml$next(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
    },
    
    prior: function EditHtml$prior(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
    },
    
    _autoHeight$3: function EditHtml$_autoHeight$3(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="Number" integer="true"></returns>
        if (this._autoEr$3 == null) {
            if (EditHtml._autoErDiv$3 == null) {
                EditHtml._autoErDiv$3 = $("<div style='position:absolute;visibility:hidden'/>").appendTo(document.body);
            }
            this._autoEr$3 = $('<div/>').css(this._eCss$3).prependTo(EditHtml._autoErDiv$3);
            this._autoEr$3.css({ top: 0, height: 'auto', position: 'relative', overflow: 'visible' });
        }
        this._autoEr$3.html(el.val().replace(EditHtml._regExLf$3, '<br>'));
        return this._autoEr$3.height();
    }
}


////////////////////////////////////////////////////////////////////////////////
// Exceptions

Exceptions = function Exceptions() {
    /// <field name="isLoggedTxt" type="String" static="true">
    /// </field>
    /// <field name="missingAwaitDoneEr" type="String" static="true">
    /// </field>
    /// <field name="missingDomElement" type="String" static="true">
    /// </field>
    /// <field name="argumentNull" type="String" static="true">
    /// </field>
    /// <field name="nullReference" type="String" static="true">
    /// </field>
    /// <field name="recordNotExists" type="String" static="true">
    /// </field>
    /// <field name="newRecordExists" type="String" static="true">
    /// </field>
    /// <field name="invalidName" type="String" static="true">
    /// </field>
    /// <field name="userCancelled" type="String" static="true">
    /// </field>
    /// <field name="blobLoadError" type="String" static="true">
    /// </field>
    /// <field name="blobSaveError" type="String" static="true">
    /// </field>
    /// <field name="serviceLoginFailure" type="String" static="true">
    /// </field>
    /// <field name="fileIsNewer" type="String" static="true">
    /// </field>
    /// <field name="newUser" type="String" static="true">
    /// </field>
    /// <field name="invalidPageException" type="String" static="true">
    /// </field>
    /// <field name="sendMailError" type="String" static="true">
    /// </field>
    /// <field name="invalidTestCaseName" type="String" static="true">
    /// </field>
    /// <field name="invalidTestSuiteName" type="String" static="true">
    /// </field>
    /// <field name="invalidDataOperation" type="String" static="true">
    /// </field>
    /// <field name="notImplementedExceptionString" type="String" static="true">
    /// </field>
}
Exceptions.get_nullReferenceException = function Exceptions$get_nullReferenceException() {
    /// <value type="Object"></value>
    throw new Error('Null Reference');
}
Exceptions.notImplementedException = function Exceptions$notImplementedException() {
    /// <returns type="Error"></returns>
    return new Error('Not Implimented');
}
Exceptions.format = function Exceptions$format(ex, msg) {
    /// <param name="ex" type="String">
    /// </param>
    /// <param name="msg" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return ex + ' : ' + msg;
}
Exceptions.fn = function Exceptions$fn(args) {
    /// <param name="args" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    return args.callee.name || 'unknown';
}
Exceptions.error = function Exceptions$error(exname, msg, fnargs) {
    /// <param name="exname" type="String">
    /// </param>
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="fnargs" type="Object">
    /// </param>
    /// <returns type="Error"></returns>
    if (Nsb.Storage.getLocal('DevStopOnError')) {
        debugger;
    }
    var fnm = '';
    if (typeof(fnargs) === 'string') {
        fnm = (fnargs || 'anonymous') + '() ';
    }
    else if (typeof(fnargs) === 'object') {
        fnm = (fnargs != null) ? ((fnargs.callee.name) || 'anonymous') + '() ' : '';
    }
    var ot = '';
    var ex = new Error(exname + ': ' + msg + ' (LOGGED=true)');
    var trace = printStackTrace({ e: ex, guess: true });
    if (trace.length > 0 && trace[trace.length - 1].indexOf('XMLHttpRequest') === -1) {
        var $enum1 = ss.IEnumerator.getEnumerator(trace);
        while ($enum1.moveNext()) {
            var line = $enum1.current;
            ot += line + '\n';
        }
    }
    msg = fnm + ex + ((!String.isNullOrEmpty(ot)) ? '\n' + ot : '');
    ex.mylogged = true;
    Inform.rawError(msg);
    Exceptions.SaveLog('errors', msg);
    return ex;
}
Exceptions.ajaxError = function Exceptions$ajaxError(exname, msg, request, textStatus, error, fnargs) {
    /// <param name="exname" type="String">
    /// </param>
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="request" type="jQueryXmlHttpRequest">
    /// </param>
    /// <param name="textStatus" type="String">
    /// </param>
    /// <param name="error" type="Error">
    /// </param>
    /// <param name="fnargs" type="Object">
    /// </param>
    /// <returns type="Error"></returns>
    if (textStatus !== 'error' && textStatus !== request.statusText) {
        return Exceptions.error(exname, String.format('{0}: ({1}) {2} {3}', msg, request.status, request.statusText, textStatus), fnargs);
    }
    return Exceptions.error(exname, String.format('{0}: ({1}) {2}', msg, request.status, request.statusText), fnargs);
}
Exceptions.logException = function Exceptions$logException(ex, msg) {
    /// <param name="ex" type="Error">
    /// </param>
    /// <param name="msg" type="String">
    /// </param>
    if (Nsb.Storage.getLocal('DevStopOnError')) {
        debugger;
    }
    if (!ex.mylogged && ex.message.indexOf(' (LOGGED=true)') === -1) {
        try {
            if (msg.indexOf(ex.toString()) === -1) {
                msg = msg + ' : ' + ex;
            }
            Inform.error(msg);
            ex.mylogged = true;
            msg += ' (LOGGED=true)';
            Exceptions.SaveLog('errors', msg);
            ex.message = msg;
        }
        catch ($e1) {
        }
    }
}
Exceptions.SaveLog = function Exceptions$SaveLog(log, msg) {
    /// <param name="log" type="String">
    /// </param>
    /// <param name="msg" type="String">
    /// </param>
    var d = new Date();
    msg = JSON.stringify({ t: d.getTime(), d: d.toDateString() + ' ' + d.toTimeString(), i: ThemeBase.userId, e: ThemeBase.email, u: window.location.href, m: msg, b: window.navigator.userAgent });
    var args = { password: FileBlobBase.password, path: Uri.dbPath('logs'), file: log + '.txt', content: msg, createPath: true, createFile: true };
    var options = {};
    options.url = Uri.app('file.app.php');
    options.dataType = 'jsonp';
    options.data = args;
    options.type = 'POST';
    options.success = function() {
    };
    options.error = function() {
    };
    $.ajax(options);
}


////////////////////////////////////////////////////////////////////////////////
// FileBlobBase

FileBlobBase = function FileBlobBase() {
    /// <field name="_encodeLzw64" type="String" static="true">
    /// </field>
    /// <field name="_fileExt" type="String" static="true">
    /// </field>
    /// <field name="retrieveBlobStringAwName" type="String" static="true">
    /// </field>
    /// <field name="outPkgStringAwName" type="String" static="true">
    /// </field>
    /// <field name="password" type="String" static="true">
    /// </field>
    /// <field name="svCnt" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_modTime" type="Object" static="true">
    /// </field>
    /// <field name="_xfr" type="Object" static="true">
    /// </field>
}
FileBlobBase.get__getUrl = function FileBlobBase$get__getUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.get.php');
}
FileBlobBase.get__putUrl = function FileBlobBase$get__putUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.put.php');
}
FileBlobBase.get__delUrl = function FileBlobBase$get__delUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.del.php');
}
FileBlobBase.get__apnUrl = function FileBlobBase$get__apnUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.app.php');
}
FileBlobBase.get__dirUrl = function FileBlobBase$get__dirUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.dir.php');
}
FileBlobBase.get__xstUrl = function FileBlobBase$get__xstUrl() {
    /// <value type="String"></value>
    return Uri.join(ThemeBase.appUri, '/file.exists.php');
}
FileBlobBase.retrieveBlobAw = function FileBlobBase$retrieveBlobAw(awp, partitionKey, rowKey) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    new Await().addDl(function(aw) {
        FileBlobBase.retrieveBlobStringAw(aw, partitionKey, rowKey);
    }).handleDl('Blob Load Error', Await.rethrowAw).addDx(function(aw) {
        awp.set_result(FileBlobBase._unpackage(aw.get_result()));
    }).commit(awp);
}
FileBlobBase.storeBlobAw = function FileBlobBase$storeBlobAw(awp, partitionKey, rowKey, rxKey, blob) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    /// <param name="rxKey" type="String">
    /// </param>
    /// <param name="blob" type="Object">
    /// </param>
    new Await().addDl(function(aw) {
        FileBlobBase.storeBlobStringAw(aw, { partitionKey: partitionKey, rowKey: rowKey, rxKey: rxKey, content: FileBlobBase._repackage(blob) });
    }).handleDl('Blob Save Error', Await.rethrowAw).addDx(function(aw) {
        awp.set_item(rxKey, aw.get_item(rxKey));
    }).commit(awp);
}
FileBlobBase.getBlobAw = function FileBlobBase$getBlobAw(awp, data) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="data" type="Object">
    /// </param>
    FileBlobBase.retrieveBlobAw(awp, data['PartitionKey'], data['RowKey']);
}
FileBlobBase.putBlobAw = function FileBlobBase$putBlobAw(awp, blob, data) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="blob" type="Object">
    /// </param>
    /// <param name="data" type="Object">
    /// </param>
    FileBlobBase.storeBlobAw(awp, data['PartitionKey'], data['RowKey'], 'result', blob);
}
FileBlobBase.retrieveBlobStringAw = function FileBlobBase$retrieveBlobStringAw(awp, partitionKey, rowKey, opts) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    /// <param name="opts" type="Object">
    /// </param>
    var fnargs = 'FileBlobBase.RetrieveBlobStringAw';
    ss.Debug.assert(rowKey != null, 'rowKey != null');
    var fullKey = FileBlobBase._fullKey(partitionKey, rowKey);
    if (FileBlobBase._xfr[fullKey]) {
        window.setTimeout(function() {
            FileBlobBase.retrieveBlobStringAw(awp, partitionKey, rowKey);
        }, 13);
        return;
    }
    var payload = opts || {};
    payload['password'] = FileBlobBase.password;
    payload['path'] = partitionKey;
    payload['file'] = rowKey + (((rowKey || '').indexOf('.') === -1) ? '.txt' : '');
    var devPassword = Nsb.Storage.getLocal('DevPassword');
    if (!String.isNullOrEmpty(devPassword)) {
        payload['devPassword'] = devPassword;
    }
    var options = {};
    options.url = FileBlobBase.get__getUrl();
    options.data = payload;
    options.dataType = 'jsonp';
    options.type = 'GET';
    options.success = function(fbo, textStatus, request1) {
        FileBlobBase._xfr[fullKey] = false;
        awp.set_item('Data', fbo);
        var msg = '';
        try {
            var pr = fbo;
            msg = pr.msg;
            if (pr.result !== true) {
                if (pr.inactive === true) {
                    $(document).trigger('InactiveCredentials');
                }
                throw new Error('Blob Load Error');
            }
            awp.set_result(FileBlobBase._decode(pr.content));
            if (pr.exists) {
                FileBlobBase._modTime[fullKey] = pr.lastChanged;
            }
        }
        catch (ex) {
            options.error(request1, msg, ex);
            return;
        }
        FileBlobBase.svCnt--;
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        FileBlobBase._xfr[fullKey] = false;
        var ex = Exceptions.ajaxError('Blob Load Error', fullKey, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase._xfr[fullKey] = true;
    FileBlobBase.svCnt++;
    $.ajax(options);
}
FileBlobBase.appendBlobStringAw = function FileBlobBase$appendBlobStringAw(awp, partitionKey, rowKey, rxKey, content) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    /// <param name="rxKey" type="String">
    /// </param>
    /// <param name="content" type="String">
    /// </param>
    FileBlobBase.outPkgStringAw(awp, { partitionKey: partitionKey, rowKey: rowKey, rxKey: rxKey, content: content, url: FileBlobBase.get__apnUrl(), append: true });
}
FileBlobBase.storeBlobStringAw = function FileBlobBase$storeBlobStringAw(awp, prms) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="prms" type="StoreParams">
    /// </param>
    prms.url = FileBlobBase.get__putUrl();
    FileBlobBase.outPkgStringAw(awp, prms);
}
FileBlobBase.outPkgStringAw = function FileBlobBase$outPkgStringAw(awp, pm) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="pm" type="StoreParams">
    /// </param>
    var fnargs = 'FileBlobBase.OutPkgStringAw';
    pm.partitionKey = pm.partitionKey || '.';
    pm.rowKey = pm.rowKey || '';
    pm.rxKey = pm.rxKey || 'result';
    pm.content = pm.content || '';
    pm.url = pm.url || FileBlobBase.get__putUrl();
    pm.append = (pm.append || false);
    pm.backup = (pm.backup || false);
    ss.Debug.assert(pm.rowKey != null, 'rowKey != null');
    var fullKey = FileBlobBase._fullKey(pm.partitionKey, pm.rowKey);
    if (FileBlobBase._xfr[fullKey]) {
        window.setTimeout(function() {
            FileBlobBase.outPkgStringAw(awp, pm);
        }, 13);
        return;
    }
    var payload = {};
    payload['password'] = FileBlobBase.password;
    payload['createFile'] = 'true';
    payload['createPath'] = 'true';
    payload['path'] = pm.partitionKey;
    payload['file'] = pm.rowKey + (((pm.rowKey || '').indexOf('.') === -1) ? '.txt' : '');
    payload['priorTime'] = (FileBlobBase._modTime[FileBlobBase._fullKey(pm.partitionKey, pm.rowKey)] || 0);
    payload['forceSave'] = pm.append;
    payload['createBackup'] = pm.backup;
    payload['backupName'] = pm.rowKey + '-' + new Date().getTime() + '.txt';
    payload['content64'] = Nsb.Encoder.encode64(FileBlobBase.encode(pm.content));
    var devPassword = Nsb.Storage.getLocal('DevPassword');
    if (!String.isNullOrEmpty(devPassword)) {
        payload['devPassword'] = devPassword;
    }
    var options = {};
    options.url = pm.url;
    options.data = payload;
    options.type = 'POST';
    options.success = function(fbo, textStatus, request1) {
        FileBlobBase.svCnt--;
        var msg = null;
        try {
            $(document).trigger('SaveSpinnerOff');
            if (!fbo.result) {
                if (fbo.fileNewer) {
                    Inform.warn('Trying to write to a newer file {0}', FileBlobBase._fullKey(pm.partitionKey, pm.rowKey));
                    throw new Error('File is newer');
                }
                msg = (ss.isNullOrUndefined(fbo)) ? '' : fbo.msg;
                throw new Error('Blob Save Error');
            }
            FileBlobBase._modTime[FileBlobBase._fullKey(pm.partitionKey, pm.rowKey)] = fbo.lastChanged;
        }
        catch (ex) {
            Ask.ok(String.format('File write failed \n{0}', ex));
            switch (ex.message) {
                case 'File is newer':
                    FileBlobBase._xfr[fullKey] = false;
                    awp.handle(ex);
                    return;
            }
            Inform.warn('Not able to send pkg {0}, error={1}', FileBlobBase._fullKey(pm.partitionKey, pm.rowKey), (msg || ex.toString()));
            FileBlobBase._xfr[fullKey] = false;
            awp.handle(new Error('Blob Save Error'));
            return;
        }
        FileBlobBase._xfr[fullKey] = false;
        awp.set_item(pm.rxKey, true);
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        FileBlobBase._xfr[fullKey] = false;
        $(document).trigger('SaveSpinnerOff');
        var ex = Exceptions.ajaxError('Blob Load Error', fullKey, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase.svCnt++;
    FileBlobBase._xfr[fullKey] = true;
    $.ajax(options);
    $(document).trigger('SaveSpinnerOn');
}
FileBlobBase.deleteItemAw = function FileBlobBase$deleteItemAw(awp, partitionKey, rowKey) {
    /// <summary>
    /// Deletes the item on the server
    /// </summary>
    /// <param name="awp" type="Await">
    /// The awp.
    /// </param>
    /// <param name="partitionKey" type="String">
    /// The partition key.
    /// </param>
    /// <param name="rowKey" type="String">
    /// The row key. If no extension then FileExt will be appended to it.
    /// </param>
    var fnargs = 'FileBlobBase.DeleteItemAw';
    var fullKey = FileBlobBase._fullKey(partitionKey, rowKey);
    rowKey = rowKey || '';
    var payload = {};
    payload['password'] = FileBlobBase.password;
    payload['path'] = partitionKey;
    payload['file'] = rowKey + (((rowKey || '').indexOf('.') === -1) ? '.txt' : '');
    var devPassword = Nsb.Storage.getLocal('DevPassword');
    if (!String.isNullOrEmpty(devPassword)) {
        payload['devPassword'] = devPassword;
    }
    var options = {};
    options.url = FileBlobBase.get__delUrl();
    options.data = payload;
    options.dataType = 'jsonp';
    options.type = 'GET';
    options.success = function(fbo, textStatus, request1) {
        FileBlobBase.svCnt--;
        try {
            if (ss.isNullOrUndefined(fbo) || !fbo.result) {
                throw new Error('Blob Load Error' + ':' + fullKey);
            }
        }
        catch (ex) {
            Inform.trace('Unable to delete pkg {0}/{1}, exception={3}', partitionKey, rowKey, ex);
            awp.handle(new Error('Blob Load Error' + ':' + fullKey));
            return;
        }
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        var ex = Exceptions.ajaxError('Blob Load Error', fullKey, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase.svCnt++;
    $.ajax(options);
}
FileBlobBase.emptyFolderAw = function FileBlobBase$emptyFolderAw(awp, path, removeRoot) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="path" type="String">
    /// </param>
    /// <param name="removeRoot" type="Boolean">
    /// </param>
    var fnargs = 'FileBlobBase.EmptyFolderAw';
    var fullKey = path;
    var payload = {};
    payload['password'] = FileBlobBase.password;
    payload['path'] = path;
    payload['file'] = '';
    payload['rmDir'] = (removeRoot) ? 'true' : 'false';
    var devPassword = Nsb.Storage.getLocal('DevPassword');
    if (!String.isNullOrEmpty(devPassword)) {
        payload['devPassword'] = devPassword;
    }
    var options = {};
    options.url = FileBlobBase.get__delUrl();
    options.data = payload;
    options.dataType = 'jsonp';
    options.type = 'GET';
    options.success = function(fbo, textStatus, request1) {
        FileBlobBase.svCnt--;
        try {
            if (ss.isNullOrUndefined(fbo) || !fbo.result) {
                throw new Error('Blob Load Error' + ':' + fullKey);
            }
        }
        catch (ex) {
            Inform.trace('Unable to empty folder {0}, exception={1}', path, ex);
            awp.handle(new Error('Blob Load Error' + ':' + fullKey));
            return;
        }
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        var ex = Exceptions.ajaxError('Blob Load Error', fullKey, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase.svCnt++;
    $.ajax(options);
}
FileBlobBase.existsAw = function FileBlobBase$existsAw(awp, path) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="path" type="String">
    /// </param>
    var fnargs = 'FileBlobBase.ExistsAw';
    var payload = {};
    payload['password'] = FileBlobBase.password;
    payload['file'] = path;
    var devPassword = Nsb.Storage.getLocal('DevPassword');
    if (!String.isNullOrEmpty(devPassword)) {
        payload['devPassword'] = devPassword;
    }
    var options = {};
    options.url = FileBlobBase.get__xstUrl();
    options.data = payload;
    options.dataType = 'json';
    options.type = 'GET';
    options.cache = true;
    options.success = function(data, textStatus, request1) {
        awp.set_item('Data', data);
        try {
            var pr = data;
            awp.set_result(pr.result);
        }
        catch (ex) {
            options.error(request1, textStatus, ex);
            return;
        }
        FileBlobBase.svCnt--;
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        var ex = Exceptions.ajaxError('Blob Load Error', path, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase.svCnt++;
    $.ajax(options);
}
FileBlobBase.getDirAw = function FileBlobBase$getDirAw(awp, partitionKey, imageSizes) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="imageSizes" type="Boolean">
    /// </param>
    var fnargs = 'FileBlobBase.GetDirAw';
    var fullKey = partitionKey;
    var spinnerTimer = window.setTimeout(function() {
        Await.trigger('Spinner', true);
    }, 1300);
    var payload = {};
    payload['password'] = FileBlobBase.password;
    payload['path'] = partitionKey;
    payload['imagesizes'] = (imageSizes) ? true : false;
    var options = {};
    options.url = FileBlobBase.get__dirUrl();
    options.data = payload;
    options.dataType = 'json';
    options.type = 'GET';
    options.success = function(data, textStatus, request1) {
        FileBlobBase.svCnt--;
        window.clearTimeout(spinnerTimer);
        DomElement.trigger('Spinner', false);
        try {
            awp.set_result(data);
            awp.set_item('success', (data).result);
        }
        catch (ex) {
            Inform.trace('Unable to get file list {0}, exception={1}', partitionKey, ex);
            awp.handle(new Error('Blob Load Error' + ':' + fullKey));
            return;
        }
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        FileBlobBase.svCnt--;
        window.clearTimeout(spinnerTimer);
        DomElement.trigger('Spinner', false);
        var ex = Exceptions.ajaxError('Blob Load Error', fullKey, request, textStatus, error, fnargs);
        if (FileBlobBase._errorReloading(ex)) {
            return;
        }
        awp.handle(ex);
    };
    FileBlobBase.svCnt++;
    $.ajax(options);
}
FileBlobBase._errorReloading = function FileBlobBase$_errorReloading(ex) {
    /// <param name="ex" type="Error">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (ThemeBase.reloading) {
        Nsb.Storage.setLocal('DevIOError', ex.message);
        return true;
    }
    return false;
}
FileBlobBase.forceStoreBlob = function FileBlobBase$forceStoreBlob(partitionKey, rowKey) {
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    FileBlobBase._modTime[FileBlobBase._fullKey(partitionKey, rowKey)] = 0;
}
FileBlobBase._fullKey = function FileBlobBase$_fullKey(partitionKey, rowKey) {
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return partitionKey + '/' + rowKey;
}
FileBlobBase._repackage = function FileBlobBase$_repackage(blob) {
    /// <param name="blob" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    try {
        return JSON.stringify(blob);
    }
    catch (ex) {
        Inform.error('Error stringifying blob: {0}', ex);
    }
    return '';
}
FileBlobBase._unpackage = function FileBlobBase$_unpackage(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    try {
        if (!String.isNullOrEmpty(s)) {
            return JSON.parse(s);
        }
    }
    catch (ex) {
        Inform.error('Error parsing blob: {0}', ex);
    }
    return '';
}
FileBlobBase.encode = function FileBlobBase$encode(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return s;
}
FileBlobBase._decode = function FileBlobBase$_decode(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var pfx = (ss.isNullOrUndefined(s)) ? '' : s.substr(0, 6);
    switch (pfx) {
        case 'VXLZ64':
            return Nsb.Encoder.lzwDecode(Nsb.Encoder.decode64(s.substr(6)));
        default:
            return (String.isNullOrEmpty(s)) ? '' : s;
    }
}
FileBlobBase.cleanListData = function FileBlobBase$cleanListData(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var s = 0;
    var e = txt.length;
    if (txt.charCodeAt(0) === 65279) {
        s++;
    }
    while (e > 0 && '\r\n\t,; '.indexOf(txt.charAt(e - 1)) !== -1) {
        e--;
    }
    return txt.substring(s, e);
}
FileBlobBase.simpleList = function FileBlobBase$simpleList(list) {
    /// <param name="list" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    var nl = JSON.stringify(list);
    nl = nl.replace(DomElement.regMe('/^\\[(.*)\\]$/'), '$1');
    return nl.replaceAll('},{', '},\r\n{');
}
FileBlobBase.addListItemAw = function FileBlobBase$addListItemAw(awp, partitionKey, rowKey, item) {
    /// <summary>
    /// Append a List item to a naked list
    /// </summary>
    /// <param name="awp" type="Await">
    /// The Await
    /// </param>
    /// <param name="partitionKey" type="String">
    /// The partition key.
    /// </param>
    /// <param name="rowKey" type="String">
    /// The row key.
    /// </param>
    /// <param name="item" type="Object">
    /// The item to append.
    /// </param>
    FileBlobBase.appendBlobStringAw(awp, partitionKey, rowKey, 'result', JSON.stringify(item));
}
FileBlobBase.loadListAw = function FileBlobBase$loadListAw(awp, partitionKey, rowKey) {
    /// <summary>
    /// Load a naked List and return the list object in aw.Result.
    /// </summary>
    /// <param name="awp" type="Await">
    /// The Await.
    /// </param>
    /// <param name="partitionKey" type="String">
    /// The partition key.
    /// </param>
    /// <param name="rowKey" type="String">
    /// The row key.
    /// </param>
    new Await().addAw(FileBlobBase.retrieveBlobStringAw, partitionKey, rowKey).handleDl('Blob Load Error', Await.rethrowAw).addDx(function(aw) {
        var content = FileBlobBase.cleanListData(aw.get_result());
        awp.set_result((aw.get_result() != null) ? JSON.parse('[' + content + ']') : null);
    }).commit(awp);
}
FileBlobBase.updateListAw = function FileBlobBase$updateListAw(awp, partitionKey, rowKey, fn) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="partitionKey" type="String">
    /// </param>
    /// <param name="rowKey" type="String">
    /// </param>
    /// <param name="fn" type="System.Action`1">
    /// </param>
    new Await().addAw(FileBlobBase.loadListAw, partitionKey, rowKey).addDx(function(aw) {
        fn(aw.get_result());
    }).addDl(function(aw) {
        FileBlobBase.storeBlobStringAw(aw, { partitionKey: partitionKey, rowKey: rowKey, content: FileBlobBase.simpleList(aw.get_result()) });
    }).commit(awp);
}


////////////////////////////////////////////////////////////////////////////////
// PkgResult

PkgResult = function PkgResult() {
    /// <field name="activateId" type="String">
    /// </field>
    /// <field name="content" type="String">
    /// </field>
    /// <field name="devServer" type="Boolean">
    /// </field>
    /// <field name="email" type="String">
    /// </field>
    /// <field name="exists" type="Boolean">
    /// </field>
    /// <field name="inactive" type="Boolean">
    /// </field>
    /// <field name="lastChanged" type="Number" integer="true">
    /// </field>
    /// <field name="log" type="Object">
    /// </field>
    /// <field name="msg" type="String">
    /// </field>
    /// <field name="result" type="Boolean">
    /// </field>
    /// <field name="userid" type="String">
    /// </field>
}
PkgResult.prototype = {
    activateId: null,
    content: null,
    devServer: false,
    email: null,
    exists: false,
    inactive: false,
    lastChanged: 0,
    log: null,
    msg: null,
    result: false,
    userid: null
}


////////////////////////////////////////////////////////////////////////////////
// StoreParams

StoreParams = function StoreParams() {
    /// <field name="append" type="Boolean">
    /// </field>
    /// <field name="backup" type="Boolean">
    /// </field>
    /// <field name="content" type="String">
    /// </field>
    /// <field name="partitionKey" type="String">
    /// </field>
    /// <field name="rowKey" type="String">
    /// </field>
    /// <field name="rxKey" type="String">
    /// </field>
    /// <field name="url" type="String">
    /// </field>
}
StoreParams.prototype = {
    append: false,
    backup: false,
    content: null,
    partitionKey: null,
    rowKey: null,
    rxKey: null,
    url: null
}


////////////////////////////////////////////////////////////////////////////////
// DirMap

DirMap = function DirMap() {
    /// <field name="dircnt" type="Number" integer="true">
    /// </field>
    /// <field name="dirs" type="Array">
    /// </field>
    /// <field name="dripath" type="String">
    /// </field>
    /// <field name="filecnt" type="Number" integer="true">
    /// </field>
    /// <field name="files" type="Array">
    /// </field>
    /// <field name="imgsizes" type="Array">
    /// </field>
    /// <field name="result" type="Boolean">
    /// </field>
    /// <field name="sizes" type="Array">
    /// </field>
}
DirMap.prototype = {
    dircnt: 0,
    dirs: null,
    dripath: null,
    filecnt: 0,
    files: null,
    imgsizes: null,
    result: false,
    sizes: null
}


////////////////////////////////////////////////////////////////////////////////
// Formulas

Formulas = function Formulas() {
    /// <field name="_idCnt" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="newIdPrefix" type="String" static="true">
    /// </field>
}
Formulas.get_newId = function Formulas$get_newId() {
    /// <summary>
    /// Generate a new unique id composed of [user]q[time]n[count]
    /// </summary>
    /// <value type="String"></value>
    return (Formulas.newIdPrefix || Formulas.randomOf(10000000).toString()) + 'q' + new Date().getTime() + 'n' + (Formulas._idCnt = (Formulas._idCnt > 99999) ? 1 : Formulas._idCnt + 1);
}
Formulas.randomOf = function Formulas$randomOf(max) {
    /// <param name="max" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    return Math.floor(Math.random() * (max + 1));
}
Formulas.hash = function Formulas$hash(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
        hash += (s.charCodeAt(i) * (i + 1));
    }
    return Math.abs(hash);
}
Formulas.round = function Formulas$round(v, sig) {
    /// <param name="v" type="Number">
    /// </param>
    /// <param name="sig" type="Number">
    /// </param>
    /// <returns type="Number"></returns>
    return Math.round(v * Math.pow(10, sig)) / Math.pow(10, sig);
}
Formulas.distance = function Formulas$distance(lat1, lon1, lat2, lon2, unit) {
    /// <param name="lat1" type="Number">
    /// </param>
    /// <param name="lon1" type="Number">
    /// </param>
    /// <param name="lat2" type="Number">
    /// </param>
    /// <param name="lon2" type="Number">
    /// </param>
    /// <param name="unit" type="String">
    /// </param>
    /// <returns type="Number"></returns>
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') {
        dist = dist * 1.609344;
    }
    else if (unit === 'N') {
        dist = dist * 0.8684;
    }
    return dist;
}


////////////////////////////////////////////////////////////////////////////////
// PkgBase

PkgBase = function PkgBase() {
    /// <field name="_storeLcl$1" type="Boolean">
    /// </field>
    /// <field name="resultRx" type="String" static="true">
    /// </field>
    PkgBase.initializeBase(this);
    this._storeLcl$1 = false;
}
PkgBase.prototype = {
    _storeLcl$1: false,
    
    appendLcl: function PkgBase$appendLcl(partitionKey, rowKey, content) {
        /// <param name="partitionKey" type="String">
        /// </param>
        /// <param name="rowKey" type="String">
        /// </param>
        /// <param name="content" type="String">
        /// </param>
        if (!this._storeLcl$1) {
            return;
        }
        var pkg = window.localStorage.getItem(rowKey) || '';
        var jsonPkg = pkg + ((String.isNullOrEmpty(pkg)) ? '' : ',') + content;
        window.localStorage.setItem(partitionKey + rowKey, jsonPkg);
    },
    
    getLcl: function PkgBase$getLcl(partitionKey, rowKey) {
        /// <param name="partitionKey" type="String">
        /// </param>
        /// <param name="rowKey" type="String">
        /// </param>
        /// <returns type="String"></returns>
        if (!this._storeLcl$1) {
            return null;
        }
        return window.localStorage.getItem(partitionKey + rowKey);
    }
}


////////////////////////////////////////////////////////////////////////////////
// CloudMail

CloudMail = function CloudMail() {
}
CloudMail.get__sendUrl = function CloudMail$get__sendUrl() {
    /// <value type="String"></value>
    return Uri.join('http://playnexus.com', ThemeBase.appUri, 'sendmail.php');
}
CloudMail.sendMailAw = function CloudMail$sendMailAw(awp, mail) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="mail" type="Object">
    /// </param>
    var options = {};
    options.url = CloudMail.get__sendUrl();
    options.data = mail;
    options.dataType = 'jsonp';
    options.type = 'POST';
    options.success = function(data, textStatus, request) {
        awp.done();
    };
    options.error = function(request, textStatus, error) {
        Inform.error('Error sending mail {0} {1}', textStatus, error);
        awp.handle(new Error('Send Mail Error'));
    };
    $.ajax(options);
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.SendMailData

Nsb.Classes.SendMailData = function Nsb_Classes_SendMailData() {
    /// <field name="to" type="String">
    /// </field>
    /// <field name="from" type="String">
    /// </field>
    /// <field name="subject" type="String">
    /// </field>
    /// <field name="content" type="String">
    /// </field>
    /// <field name="textonly" type="String">
    /// </field>
    /// <field name="sendfile" type="String">
    /// </field>
    /// <field name="recipients" type="String">
    /// </field>
    /// <field name="toAll" type="Boolean">
    /// </field>
    /// <field name="sendToMeAlso" type="Boolean">
    /// </field>
}
Nsb.Classes.SendMailData.prototype = {
    to: null,
    from: null,
    subject: null,
    content: null,
    textonly: null,
    sendfile: null,
    recipients: null,
    toAll: false,
    sendToMeAlso: false
}


////////////////////////////////////////////////////////////////////////////////
// Rx

Rx = function Rx() {
    /// <field name="hasEndSpace" type="RegExp" static="true">
    /// </field>
    /// <field name="whiteSpace" type="RegExp" static="true">
    /// </field>
    /// <field name="cssFilter" type="RegExp" static="true">
    /// </field>
    /// <field name="emailFilter" type="RegExp" static="true">
    /// </field>
    /// <field name="placeholder" type="String" static="true">
    /// </field>
}
Rx.prettyJson = function Rx$prettyJson(jo, indent) {
    /// <param name="jo" type="Object">
    /// </param>
    /// <param name="indent" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return JSON.stringify(jo, function(n, o) {
        return o;
    }, (arguments.length > 1) ? indent : '\t');
}


////////////////////////////////////////////////////////////////////////////////
// Strings

Strings = function Strings() {
    /// <field name="safeFileNameRx" type="RegExp" static="true">
    /// </field>
    /// <field name="_rxSquish" type="RegExp" static="true">
    /// </field>
    /// <field name="_allowedTagsRx" type="RegExp" static="true">
    /// </field>
}
Strings.paraCase = function Strings$paraCase(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return (s != null) ? s.substr(0, 1).toUpperCase() + s.substr(1) : '';
}
Strings.safeFileName = function Strings$safeFileName(n) {
    /// <param name="n" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return (n != null) ? n.replaceAll('&nbsp;', ' ').replace(Strings.safeFileNameRx, '_').toLowerCase() : '';
}
Strings.paraSquishCase = function Strings$paraSquishCase(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return (s != null) ? Strings.paraCase(s.replace(Strings._rxSquish, '')) : '';
}
Strings.fnStringify = function Strings$fnStringify(item) {
    /// <param name="item" type="Object">
    /// </param>
    /// <returns type="Object"></returns>
    return JSON.stringify(item, function(n, v) {
        return (typeof(v) === 'function') ? v.toString() : v;
    });
}
Strings.sanitizeTags = function Strings$sanitizeTags(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var idx = Strings._allowedTagsRx.lastIndex = 0;
    var ot = '';
    var mm = Strings._allowedTagsRx.exec(txt);
    while (mm != null) {
        var st = Strings._allowedTagsRx.lastIndex - mm[0].length;
        if (st > idx) {
            ot += txt.substring(idx, st);
        }
        if (mm[4] != null) {
            ot += (mm[4].length > 1) ? mm[4] : '&amp;';
        }
        else if (mm[3] != null) {
            ot += '&gt;';
        }
        else if (mm[2] != null) {
            ot += '&lt;';
        }
        else if (mm[1] != null) {
            ot += mm[1];
        }
        idx = Strings._allowedTagsRx.lastIndex;
        mm = Strings._allowedTagsRx.exec(txt);
    }
    if (idx < txt.length) {
        ot += txt.substr(idx);
    }
    return ot;
}
Strings.reduce = function Strings$reduce(txt) {
    /// <summary>
    /// Reduces multiple spaces on front or end to single spaces
    /// </summary>
    /// <param name="txt" type="String">
    /// string to reduce
    /// </param>
    /// <returns type="String"></returns>
    return txt.replace(/^\s+|\s+$/g, ' ');
}
Strings.times = function Strings$times(t, txt) {
    /// <param name="t" type="Number" integer="true">
    /// </param>
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    var ot = '';
    while ((t--) > 0) {
        ot += txt;
    }
    return ot;
}


////////////////////////////////////////////////////////////////////////////////
// TestInstance

TestInstance = function TestInstance() {
    /// <field name="theTest" type="Object" static="true">
    /// </field>
}
TestInstance.addInstance = function TestInstance$addInstance(cls) {
    /// <param name="cls" type="Object">
    /// </param>
    if (TestInstance.theTest != null) {
        var fn = Test.addInstance;
        ss.Debug.assert(fn != null, 'Test.addInstance != null');
        if (fn != null) {
            fn(cls);
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// TrueForm

TrueForm = function TrueForm() {
}
TrueForm.prototype = {
    
    fillFormByName: function TrueForm$fillFormByName() {
        var $dict1 = this;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            if (typeof(p.value) !== 'function') {
                $('input[name=' + p.key + ']').val(p.value.toString());
            }
        }
    },
    
    scoopFormByName: function TrueForm$scoopFormByName() {
        var data = this;
        var $dict1 = data;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            if (typeof(p.value) !== 'function') {
                switch (typeof(data[p.key])) {
                    case 'boolean':
                        data[p.key] = Boolean.parse($('input[name=' + p.key + ']').val());
                        break;
                    case 'number':
                        data[p.key] = parseInt($('input[name=' + p.key + ']').val());
                        break;
                    default:
                        data[p.key] = $('input[name=' + p.key + ']').val();
                        break;
                }
            }
        }
    },
    
    fillFormByClass: function TrueForm$fillFormByClass() {
        var $dict1 = this;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            var classKey = p.key.substr(0, 1).toUpperCase() + p.key.substr(1);
            if (typeof(p.value) !== 'function') {
                $('.' + classKey).fValueString(p.value.toString());
            }
        }
    },
    
    scoopFormByClass: function TrueForm$scoopFormByClass() {
        var data = this;
        var $dict1 = data;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            var classKey = p.key.substr(0, 1).toUpperCase() + p.key.substr(1);
            if (typeof(p.value) !== 'function') {
                switch (typeof(data[p.key])) {
                    case 'boolean':
                        data[p.key] = Boolean.parse($('.' + classKey).getFValueString());
                        break;
                    case 'number':
                        data[p.key] = parseInt($('.' + classKey).getFValueString());
                        break;
                    default:
                        data[p.key] = $('.' + classKey).getFValueString();
                        break;
                }
            }
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.Truple

Nsb.Classes.Truple = function Nsb_Classes_Truple() {
    /// <field name="_tabIndex$3" type="Number" integer="true" static="true">
    /// </field>
    Nsb.Classes.Truple.initializeBase(this);
}
Nsb.Classes.Truple.scoopDataTo = function Nsb_Classes_Truple$scoopDataTo(data) {
    /// <param name="data" type="Object">
    /// </param>
    var input = $('body .Truple .Input');
    input.each(function() {
        var key = $(this).data('fieldName');
        var value = $(this).getFValue();
        data[key] = value;
        return true;
    });
}
Nsb.Classes.Truple.fillDataFromAw = function Nsb_Classes_Truple$fillDataFromAw(awp, data) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="data" type="Object">
    /// </param>
    new Await().waitDx(function() {
        return $('body .Truple .Input').length > 0;
    }, 500).addDx(function() {
        Nsb.Classes.Truple.fillDataFrom(data);
    }).commit(awp);
}
Nsb.Classes.Truple.fillDataFrom = function Nsb_Classes_Truple$fillDataFrom(data) {
    /// <param name="data" type="Object">
    /// </param>
    var input = $('body .Truple .Input');
    input.each(function() {
        var key = $(this).data('fieldName');
        if (Object.keyExists(data, key)) {
            var value = data[key];
            $(this).fValue(value);
        }
        return true;
    });
}
Nsb.Classes.Truple.eachTruple = function Nsb_Classes_Truple$eachTruple(fn) {
    /// <param name="fn" type="Function">
    /// </param>
    var input = $('body .Truple');
    input.each(fn);
}
Nsb.Classes.Truple.eachInput = function Nsb_Classes_Truple$eachInput(fn) {
    /// <param name="fn" type="Function">
    /// </param>
    var input = $('body .Truple .Input');
    input.each(fn);
}
Nsb.Classes.Truple.prototype = {
    
    _buildTruple$3: function Nsb_Classes_Truple$_buildTruple$3(type, fieldName, appendTo) {
        /// <param name="type" type="String">
        /// </param>
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="appendTo" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        var key = Strings.paraSquishCase(fieldName);
        appendTo = (appendTo || this.element);
        var ie = $(type);
        if (ie.is('input,textarea,select,button')) {
            ie.addClass('Input').data('fieldName', fieldName).attr('tabindex', (++Nsb.Classes.Truple._tabIndex$3).toString());
        }
        var tu = new Nsb.Classes.Truple().fromHtml("<div class='Truple'/>").addClass(key).appendTo(appendTo).append($("<span class='Label'/>")).append(ie);
        Cluster.truples[fieldName] = tu;
        Cluster.elements[fieldName] = tu.element;
        return tu;
    },
    
    _buildTrupleBtn$3: function Nsb_Classes_Truple$_buildTrupleBtn$3(type, fieldName, appendTo) {
        /// <param name="type" type="String">
        /// </param>
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="appendTo" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        appendTo = (appendTo || this.element);
        return new Nsb.Classes.Truple().fromHtml("<div class='Truple'/>").addClass(fieldName.substr(0, 1).toUpperCase() + fieldName.substr(1)).appendTo(appendTo).append($(type).addClass('Control').data('fieldName', fieldName));
    },
    
    fromHtml: function Nsb_Classes_Truple$fromHtml(html) {
        /// <param name="html" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        Nsb.Classes.Truple.callBaseMethod(this, 'fromHtml', [ html ]);
        this.element.data('truple', this);
        return this;
    },
    
    input: function Nsb_Classes_Truple$input(fieldName, tu) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="tu" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this._buildTruple$3("<input type='text'/>", fieldName, tu).addClass('Text');
    },
    
    checkbox: function Nsb_Classes_Truple$checkbox(fieldName, tu) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="tu" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this._buildTruple$3("<input type='checkbox'/>", fieldName, tu).addClass('Checkbox');
    },
    
    selectBox: function Nsb_Classes_Truple$selectBox(fieldName, tu) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="tu" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this._buildTruple$3('<select/>', fieldName, tu).addClass('Select');
    },
    
    textarea: function Nsb_Classes_Truple$textarea(fieldName, tu) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="tu" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this._buildTruple$3('<textarea/>', fieldName, tu).addClass('Textarea');
    },
    
    button: function Nsb_Classes_Truple$button(fieldName, tu) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="tu" type="Nsb.Classes.Truple">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this._buildTrupleBtn$3('<button/>', fieldName, tu).addClass('Button');
    },
    
    multipleChoice: function Nsb_Classes_Truple$multipleChoice(fieldName, question) {
        /// <param name="fieldName" type="String">
        /// </param>
        /// <param name="question" type="Object">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        var mc = this._buildTruple$3('<dl/>', fieldName).addClass('MultipleChoice');
        var dl = $('dl', mc.element);
        var qq = question['question'].toString();
        if (Object.keyExists(question, 'alias')) {
            qq = String.format('Hi {0},<br>{1}', question['alias'], qq);
        }
        $('<dt/>').appendTo(dl).html(qq);
        var $dict1 = question['answers'];
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            var answer = $('<dd/>').appendTo(dl).html(p.value);
            $("<input type='radio' class='Radio'/>").prependTo(answer).attr('name', fieldName).attr('value', p.key);
        }
        if (question['hide']) {
            mc.element.hide();
        }
        return mc;
    },
    
    subHtml: function Nsb_Classes_Truple$subHtml(s, html) {
        /// <param name="s" type="String">
        /// </param>
        /// <param name="html" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        this.select(s).html(html);
        return this;
    },
    
    subValue: function Nsb_Classes_Truple$subValue(s, value) {
        /// <param name="s" type="String">
        /// </param>
        /// <param name="value" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        var el = this.select(s);
        if (el.is('input, textarea, select')) {
            el.val(value);
        }
        else {
            el.html(value);
        }
        return this;
    },
    
    inputElement: function Nsb_Classes_Truple$inputElement() {
        /// <returns type="jQueryObject"></returns>
        return this.select('.Input');
    },
    
    value: function Nsb_Classes_Truple$value(value) {
        /// <param name="value" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        return this.subValue('.Input', value);
    },
    
    subAttr: function Nsb_Classes_Truple$subAttr(s, attr, value) {
        /// <param name="s" type="String">
        /// </param>
        /// <param name="attr" type="String">
        /// </param>
        /// <param name="value" type="String">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        this.select(s).attr(attr, value);
        return this;
    },
    
    subOptions: function Nsb_Classes_Truple$subOptions(s, items) {
        /// <param name="s" type="String">
        /// </param>
        /// <param name="items" type="Object">
        /// </param>
        /// <returns type="Nsb.Classes.Truple"></returns>
        var el = this.select(s);
        var $dict1 = items;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            el.append($('<option/>').attr('value', p.key).html(p.value));
        }
        return this;
    },
    
    setOptions: function Nsb_Classes_Truple$setOptions(options) {
        /// <param name="options" type="Object">
        /// </param>
        var $dict1 = options;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            switch (p.key) {
                case 'Validate':
                    break;
                case 'Label':
                    this.subHtml('.Label', p.value.toString());
                    break;
                case 'Value':
                    this.subValue('.Input', p.value.toString());
                    break;
                default:
                    this.subAttr('.Input', p.key, p.value.toString());
                    break;
            }
        }
    },
    
    followFocus: function Nsb_Classes_Truple$followFocus() {
        /// <returns type="Nsb.Classes.Truple"></returns>
        this.element.focusin(function(e) {
            $(e.target).addClass('Focused');
            DomElement.getTruple(e.target).element.addClass('Focused');
        }).focusout(function(e) {
            $(e.target).removeClass('Focused');
            DomElement.getTruple(e.target).element.removeClass('Focused');
        });
        return this;
    },
    
    addSlideTruples: function Nsb_Classes_Truple$addSlideTruples(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        Nsb.Classes.Truple.eachTruple(ss.Delegate.create(this, function(i, domEl) {
            awp.addAw(ss.Delegate.create(this, this.slideInAw), $(domEl));
            return true;
        }));
    },
    
    slideInByNameAw: function Nsb_Classes_Truple$slideInByNameAw(awp, name) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="name" type="String">
        /// </param>
        this.slideInAw(awp, Cluster.truples[name].element);
    }
}


////////////////////////////////////////////////////////////////////////////////
// DomElement

DomElement = function DomElement() {
    /// <field name="resultRx" type="String" static="true">
    /// </field>
    /// <field name="_slideDown" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_efpCheck" type="Boolean" static="true">
    /// </field>
    /// <field name="_efpRelative" type="Boolean" static="true">
    /// </field>
    /// <field name="_othrFocsCrtd" type="Boolean" static="true">
    /// </field>
    /// <field name="_idCnt" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_idTime" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="_otherFocusEl" type="jQueryObject" static="true">
    /// </field>
    /// <field name="element" type="jQueryObject">
    /// </field>
}
DomElement.getTruple = function DomElement$getTruple(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    /// <returns type="Nsb.Classes.Truple"></returns>
    if (!(el instanceof jQuery)) {
        el = $(el);
    }
    var t = el.closest('.Truple');
    if (t.length > 0) {
        return t.data('truple');
    }
    return null;
}
DomElement.get_lclId = function DomElement$get_lclId() {
    /// <value type="String"></value>
    return DomElement._idTime + 'x' + (++DomElement._idCnt);
}
DomElement.trigger = function DomElement$trigger(nm, arg) {
    /// <param name="nm" type="String">
    /// </param>
    /// <param name="arg" type="Object">
    /// </param>
    var args = new Array(1);
    args[0] = arg;
    $(document).trigger(nm, args);
}
DomElement.isValidName = function DomElement$isValidName(name) {
    /// <param name="name" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return !String.isNullOrEmpty(DomElement.cleanName(name));
}
DomElement.isValidNames = function DomElement$isValidNames(name1, name2) {
    /// <param name="name1" type="String">
    /// </param>
    /// <param name="name2" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return DomElement.isValidName(name1) && DomElement.isValidName(name2);
}
DomElement.addStyle = function DomElement$addStyle(style) {
    /// <param name="style" type="String">
    /// </param>
    $("<style type='text/css'/>").append(style).appendTo('head');
}
DomElement.cleanName = function DomElement$cleanName(name) {
    /// <param name="name" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return (ss.isNullOrUndefined(name)) ? '' : name.trim();
}
DomElement.outerHtml = function DomElement$outerHtml(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    /// <returns type="String"></returns>
    if (el[0].hasOwnProperty('outerHTML')) {
        return el[0].outerHTML;
    }
    var tmp = $('<div/>').insertAfter(el);
    el.appendTo(tmp);
    var html = tmp[0].innerHTML;
    el.insertBefore(tmp);
    tmp.remove();
    return html;
}
DomElement.cancelEvent = function DomElement$cancelEvent(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    if (e == null) {
        return;
    }
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
}
DomElement.focusElementAw = function DomElement$focusElementAw(awp, el) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="el" type="jQueryObject">
    /// </param>
    el.focus();
    awp.done();
}
DomElement.scrollToPosAw = function DomElement$scrollToPosAw(awp, y) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="y" type="Number" integer="true">
    /// </param>
    var once = false;
    $('body,html,document').animate({ scrollTop: y }, 300, 'swing', function() {
        if (!once) {
            once = true;
            awp.done();
        }
    });
}
DomElement.calcTargets = function DomElement$calcTargets(e) {
    /// <param name="e" type="jQueryEvent">
    /// </param>
    /// <returns type="Nsb.Classes.TargetEvent"></returns>
    var te = e;
    var t = $(e.target);
    var o = t.offset();
    te.offsetX = e.pageX - o.left;
    te.offsetY = e.pageY - o.top;
    te.targetWidth = t.width();
    te.targetHeight = t.height();
    te.targetX = e.offsetX / te.targetWidth;
    te.targetY = e.offsetY / te.targetHeight;
    te.targetOffset = o;
    return te;
}
DomElement.hasClass = function DomElement$hasClass(all, has) {
    /// <param name="all" type="String">
    /// </param>
    /// <param name="has" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return DomElement.regMe('/\\b' + has + '\\b/').test(all);
}
DomElement.unselectable = function DomElement$unselectable(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    var elem = el[0];
    elem.onselectstart = function() { return false; };
    elem.style.MozUserSelect = 'none';
    elem.style.KhtmlUserSelect = 'none';
    elem.unselectable = 'on';
}
DomElement.windowWidth = function DomElement$windowWidth() {
    /// <returns type="Number" integer="true"></returns>
    return DomElement._fFilterResults((ss.isValue(window.self.innerWidth)) ? window.self.innerWidth : 0, (ss.isValue(document.documentElement)) ? document.documentElement.clientWidth : 0, (ss.isValue(document.body)) ? document.body.clientWidth : 0);
}
DomElement.windowHeight = function DomElement$windowHeight() {
    /// <returns type="Number" integer="true"></returns>
    return DomElement._fFilterResults((ss.isValue(window.self.innerHeight)) ? window.self.innerHeight : 0, (ss.isValue(document.documentElement)) ? document.documentElement.clientHeight : 0, (ss.isValue(document.body)) ? document.body.clientHeight : 0);
}
DomElement.documentWidth = function DomElement$documentWidth() {
    /// <returns type="Number" integer="true"></returns>
    return $($(document)).width();
}
DomElement.documentHeight = function DomElement$documentHeight() {
    /// <returns type="Number" integer="true"></returns>
    return $($(document)).height();
}
DomElement.getCodeDim = function DomElement$getCodeDim(html) {
    /// <param name="html" type="String">
    /// </param>
    /// <returns type="Array" elementType="Number" elementInteger="true"></returns>
    var el = $(html).appendTo(document.body);
    var wh = [el.outerWidth(),el.outerHeight()];
    el.remove();
    return wh;
}
DomElement.documentScrollLeft = function DomElement$documentScrollLeft() {
    /// <returns type="Number" integer="true"></returns>
    return DomElement._fFilterResults((ss.isValue(window.self.pageXOffset)) ? window.self.pageXOffset : 0, (ss.isValue(document.documentElement)) ? document.documentElement.scrollLeft : 0, (ss.isValue(document.body)) ? document.body.scrollLeft : 0);
}
DomElement.documentScrollTop = function DomElement$documentScrollTop() {
    /// <returns type="Number" integer="true"></returns>
    return DomElement._fFilterResults((ss.isValue(window.self.pageYOffset)) ? window.self.pageYOffset : 0, (ss.isValue(document.documentElement)) ? document.documentElement.scrollTop : 0, (ss.isValue(document.body)) ? document.body.scrollTop : 0);
}
DomElement._fFilterResults = function DomElement$_fFilterResults(nWin, nDocel, nBody) {
    /// <param name="nWin" type="Number" integer="true">
    /// </param>
    /// <param name="nDocel" type="Number" integer="true">
    /// </param>
    /// <param name="nBody" type="Number" integer="true">
    /// </param>
    /// <returns type="Number" integer="true"></returns>
    var n_result = nWin ? nWin : 0; if (nDocel && (!n_result || (n_result > nDocel))) n_result = nDocel;;
    return nBody && (!n_result || (n_result > nBody)) ? nBody : n_result;;
}
DomElement.elementFromPoint = function DomElement$elementFromPoint(x, y) {
    /// <param name="x" type="Number" integer="true">
    /// </param>
    /// <param name="y" type="Number" integer="true">
    /// </param>
    /// <returns type="Object" domElement="true"></returns>
    if (!document.elementFromPoint) {
        return null;
    }
    if (!DomElement._efpCheck) {
        var sl = 0;
        if ((sl = jQuery(document).scrollTop()) > 0) {
            DomElement._efpRelative = document.elementFromPoint(0, sl + jQuery(window).height() -1) == null;
        }
        else if ((sl = jQuery(document).scrollLeft()) > 0) {
            DomElement._efpRelative = document.elementFromPoint(sl + jQuery(window).width() -1, 0) == null;
        }
        DomElement._efpCheck = (sl > 0);
    }
    if (DomElement._efpRelative) {
        x -= $(window.document).scrollLeft();
        y -= $(window.document).scrollTop();
    }
    return document.elementFromPoint(x, y);
}
DomElement.regMe = function DomElement$regMe(rx) {
    /// <param name="rx" type="String">
    /// </param>
    /// <returns type="RegExp"></returns>
    return eval(rx);
}
DomElement.requireResultAw = function DomElement$requireResultAw(awp, required) {
    /// <param name="awp" type="Await">
    /// </param>
    /// <param name="required" type="Object">
    /// </param>
    if ($.isFunction(required)) {
        var fn = required;
        var ic = fn(awp.get_item('result'));
        if (!ic) {
            awp.abort();
        }
        else {
            awp.done();
        }
        return;
    }
    if (awp.get_item('result') !== required) {
        awp.abort();
    }
    else {
        awp.done();
    }
}
DomElement.notFailOrEmpty = function DomElement$notFailOrEmpty(item) {
    /// <param name="item" type="Object">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (typeof(item) === 'string') {
        return !String.isNullOrEmpty(item);
    }
    if (typeof(item) === 'boolean') {
        return item;
    }
    return ss.isValue(item);
}
DomElement.notFail = function DomElement$notFail(item) {
    /// <param name="item" type="Object">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (typeof(item) === 'boolean') {
        return item;
    }
    return true;
}
DomElement._createOtherFocus = function DomElement$_createOtherFocus() {
    /// <returns type="Boolean"></returns>
    new Await().addDx(function() {
        DomElement._otherFocusEl = $("<div id='OtherFocus' tabindex='98989898' style='position:absolute;top:-10000px;left:-10000px;width:1px;height:1px'/>").appendTo(document.body);
    }).commit();
    return !DomElement._othrFocsCrtd;
}
DomElement.unfocus = function DomElement$unfocus() {
    if (DomElement._otherFocusEl != null) {
        DomElement._otherFocusEl.offset({ top: $(document).scrollTop() + 5, left: -10000 }).focus();
    }
}
DomElement.autosize = function DomElement$autosize(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
}
DomElement.prototype = {
    
    fromHtml: function DomElement$fromHtml(html) {
        /// <param name="html" type="String">
        /// </param>
        /// <returns type="DomElement"></returns>
        this.element = $(html);
        return this;
    },
    
    append: function DomElement$append(de) {
        /// <param name="de" type="DomElement">
        /// </param>
        /// <returns type="DomElement"></returns>
        if ((de instanceof jQuery)) {
            this.element.append(de);
        }
        else {
            this.element.append(de.element);
        }
        return this;
    },
    
    prepend: function DomElement$prepend(de) {
        /// <param name="de" type="DomElement">
        /// </param>
        /// <returns type="DomElement"></returns>
        if ((de instanceof jQuery)) {
            this.element.prepend(de);
        }
        else {
            this.element.prepend(de.element);
        }
        return this;
    },
    
    appendTo: function DomElement$appendTo(de) {
        /// <param name="de" type="DomElement">
        /// </param>
        /// <returns type="DomElement"></returns>
        if (typeof(de) === 'string') {
            this.element.appendTo(de);
        }
        else if ((de instanceof jQuery)) {
            this.element.appendTo(de);
        }
        else {
            this.element.appendTo(de.element);
        }
        return this;
    },
    
    prependTo: function DomElement$prependTo(de) {
        /// <param name="de" type="DomElement">
        /// </param>
        /// <returns type="DomElement"></returns>
        if ((de instanceof jQuery)) {
            this.element.prependTo(de);
        }
        else {
            this.element.prependTo(de.element);
        }
        return this;
    },
    
    insertAfter: function DomElement$insertAfter(de) {
        /// <param name="de" type="DomElement">
        /// </param>
        /// <returns type="DomElement"></returns>
        if (typeof(de) === 'string') {
            this.element.insertAfter(de);
        }
        else if ((de instanceof jQuery)) {
            this.element.insertAfter(de);
        }
        else {
            this.element.insertAfter(de.element);
        }
        return this;
    },
    
    addClass: function DomElement$addClass(classNames) {
        /// <param name="classNames" type="String">
        /// </param>
        /// <returns type="DomElement"></returns>
        this.element.addClass(classNames);
        return this;
    },
    
    attribute: function DomElement$attribute(name, value) {
        /// <param name="name" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        /// <returns type="DomElement"></returns>
        this.element.attr(name, value.toString());
        return this;
    },
    
    html: function DomElement$html(html) {
        /// <param name="html" type="String">
        /// </param>
        /// <returns type="DomElement"></returns>
        this.element.html(html);
        return this;
    },
    
    select: function DomElement$select(s) {
        /// <param name="s" type="String">
        /// </param>
        /// <returns type="jQueryObject"></returns>
        return $(s, this.element);
    },
    
    element: null,
    
    focusItem: function DomElement$focusItem(selector) {
        /// <param name="selector" type="String">
        /// </param>
        $(selector, this.element).focus();
    },
    
    clearElement: function DomElement$clearElement() {
        if (ss.isValue(this.element)) {
            this.element.empty();
        }
    },
    
    scrollToAw: function DomElement$scrollToAw(awp, el) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="el" type="jQueryObject">
        /// </param>
        el = (el || this.element);
        DomElement.scrollToPosAw(awp, el.offset().top - 2);
    },
    
    scrollInViewAw: function DomElement$scrollInViewAw(awp, el) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="el" type="jQueryObject">
        /// </param>
        if (el == null) {
            awp.done();
            return;
        }
        var ch = DomElement.windowHeight();
        var wb = ch + DomElement.documentScrollTop();
        var eb = el.offset().top + el.outerHeight();
        if (eb > wb) {
            DomElement.scrollToPosAw(awp, eb - ch + 5);
        }
        else {
            awp.done();
        }
    },
    
    removeAw: function DomElement$removeAw(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        this.element.remove();
        awp.done();
    },
    
    fadeOutAw: function DomElement$fadeOutAw(awp, ms) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        ms = (ms || 250);
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.fadeOut(ms, function() {
            awp.done();
        });
    },
    
    fadeInAw: function DomElement$fadeInAw(awp, ms) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        ms = (ms || 250);
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.fadeIn(ms, function() {
            awp.done();
        });
    },
    
    slideDownAw: function DomElement$slideDownAw(awp, ms) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        ms = (ms || 250);
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.slideDown(ms, function() {
            awp.done();
        });
    },
    
    slideUpAw: function DomElement$slideUpAw(awp, ms) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        ms = (ms || 250);
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.slideUp(ms, function() {
            awp.done();
        });
    },
    
    hideJar: function DomElement$hideJar() {
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.hide();
    },
    
    showJar: function DomElement$showJar() {
        var jar = $('.Jar', this.element);
        jar = (jar.length > 0) ? jar : this.element;
        jar.show();
    },
    
    focus: function DomElement$focus(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        el = (el || this.element);
        window.setTimeout(function() {
            el.focus();
        }, 1);
    },
    
    escapeKeyAction: function DomElement$escapeKeyAction(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        this.addKeyEvent(27, fn);
    },
    
    addKeyEvent: function DomElement$addKeyEvent(keyCode, fn, qualifiers) {
        /// <param name="keyCode" type="Number" integer="true">
        /// </param>
        /// <param name="fn" type="System.Action`1">
        /// </param>
        /// <param name="qualifiers" type="Object">
        /// </param>
        qualifiers = (qualifiers || {});
        var token = 'KeyToken' + keyCode;
        if (fn == null) {
            this.remKeyEvent(this[token]);
            return;
        }
        var kd = 'keydown.' + DomElement.get_lclId();
        var del = ss.Delegate.create(this, function(e) {
            if (e.which === keyCode && this.objectsHave(qualifiers, e)) {
                DomElement.cancelEvent(e);
                fn(e);
            }
        });
        $($(document)).bind(kd, del);
        this[token] = kd;
    },
    
    objectsHave: function DomElement$objectsHave(o1, o2) {
        /// <param name="o1" type="Object">
        /// </param>
        /// <param name="o2" type="Object">
        /// </param>
        /// <returns type="Boolean"></returns>
        var a = o1;
        var b = o2;
        var $dict1 = a;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            if (a[p.key] !== b[p.key]) {
                return false;
            }
        }
        return true;
    },
    
    remKeyEvent: function DomElement$remKeyEvent(eventKey) {
        /// <param name="eventKey" type="String">
        /// </param>
        $($(document)).unbind(eventKey);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Constants

Constants = function Constants() {
    /// <field name="undefined" type="Object" static="true">
    /// </field>
    /// <field name="upMark" type="String" static="true">
    /// </field>
    /// <field name="downMark" type="String" static="true">
    /// </field>
    /// <field name="leftMark" type="String" static="true">
    /// </field>
    /// <field name="rightMark" type="String" static="true">
    /// </field>
    /// <field name="zeeAnamae" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeControl" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeButton" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeMeta" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeMenu" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeHider" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="zeeAlert" type="Number" integer="true" static="true">
    /// </field>
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Classes.TargetEvent

Nsb.Classes.TargetEvent = function Nsb_Classes_TargetEvent() {
    /// <field name="altKey" type="Boolean">
    /// </field>
    /// <field name="ctrlKey" type="Boolean">
    /// </field>
    /// <field name="offsetX" type="Number" integer="true">
    /// </field>
    /// <field name="offsetY" type="Number" integer="true">
    /// </field>
    /// <field name="pageX" type="Number" integer="true">
    /// </field>
    /// <field name="pageY" type="Number" integer="true">
    /// </field>
    /// <field name="shiftKey" type="Boolean">
    /// </field>
    /// <field name="target" type="Object" domElement="true">
    /// </field>
    /// <field name="targetHeight" type="Number" integer="true">
    /// </field>
    /// <field name="targetOffset" type="jQueryPosition">
    /// </field>
    /// <field name="targetWidth" type="Number" integer="true">
    /// </field>
    /// <field name="targetX" type="Number">
    /// </field>
    /// <field name="targetY" type="Number">
    /// </field>
    /// <field name="which" type="String">
    /// </field>
}
Nsb.Classes.TargetEvent.prototype = {
    altKey: false,
    ctrlKey: false,
    offsetX: 0,
    offsetY: 0,
    pageX: 0,
    pageY: 0,
    shiftKey: false,
    target: null,
    targetHeight: 0,
    targetOffset: null,
    targetWidth: 0,
    targetX: 0,
    targetY: 0,
    which: null
}


////////////////////////////////////////////////////////////////////////////////
// Inform

Inform = function Inform() {
    /// <field name="tracing" type="Boolean" static="true">
    /// </field>
    /// <field name="passExceptions" type="Boolean" static="true">
    /// </field>
    /// <field name="logActions" type="Boolean" static="true">
    /// </field>
    /// <field name="debugging" type="Boolean" static="true">
    /// </field>
    /// <field name="_mark" type="Number" integer="true" static="true">
    /// </field>
}
Inform.debug = function Inform$debug(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    if (window.console) console.warn(String.format('D' + new Date().getTime() + ': ' + msg, v1, v2, v3, v4));
}
Inform.log = function Inform$log(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    if (window.console) console.log(String.format(msg, v1, v2, v3, v4));
}
Inform.trace = function Inform$trace(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    if (Inform.tracing) {
        if (window.console) console.log(String.format('Trace: ' + msg, v1, v2, v3, v4));
    }
}
Inform.warn = function Inform$warn(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    if (window.console) console.warn(String.format(msg, v1, v2, v3, v4));
}
Inform.error = function Inform$error(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    msg = String.format(msg, v1, v2, v3, v4);
    if (msg.indexOf(' (LOGGED=true)') === -1) {
        if (window.console) console.error(msg);
        Exceptions.SaveLog('errors', msg);
    }
}
Inform.rawError = function Inform$rawError(msg, v1, v2, v3, v4) {
    /// <param name="msg" type="String">
    /// </param>
    /// <param name="v1" type="Object">
    /// </param>
    /// <param name="v2" type="Object">
    /// </param>
    /// <param name="v3" type="Object">
    /// </param>
    /// <param name="v4" type="Object">
    /// </param>
    msg = String.format(msg, v1, v2, v3, v4);
    if (window.console) console.error(msg);
}
Inform.dump = function Inform$dump(item, name) {
    /// <param name="item" type="Object">
    /// </param>
    /// <param name="name" type="String">
    /// </param>
    Inform.log('Dump of object "{0}"', (ss.isValue(name)) ? name : 'Type=' + Type.getInstanceType(item));
    var s = JSON.stringify(item, function(n, o) {
        return o;
    }, 4);
    if (window.console) console.log(s);
}
Inform.logFn = function Inform$logFn(args) {
    /// <summary>
    /// Logs the function name.
    /// </summary>
    /// <param name="args" type="Object">
    /// Script.Literal("arguments")
    /// </param>
    var n = args.callee.name;
    if (!String.isNullOrEmpty(n)) {
        Inform.log('Doing {0}', n);
    }
}
Inform.event = function Inform$event(args, msg) {
    /// <summary>
    /// Logs the function name to event logs
    /// </summary>
    /// <param name="args" type="Object">
    /// Script.Literal("arguments")
    /// </param>
    /// <param name="msg" type="String">
    /// optional message
    /// </param>
    var n;
    if (Type.canCast(args, String)) {
        n = args;
    }
    else {
        n = args.callee.name;
    }
    msg = (String.isNullOrEmpty(msg)) ? String.format('{0}', n || 'anonymous') : String.format('{0} : {1}', n || 'anonymous', msg);
    Inform.debug('(Event) ' + msg);
    Exceptions.SaveLog('events', msg);
}
Inform.markSt = function Inform$markSt() {
    Inform._mark = new Date().getTime();
}
Inform.mark = function Inform$mark() {
    var m = new Date().getTime();
    Inform.log('Mark {0}', (m - Inform._mark) / 1000);
    Inform._mark = m;
}


Type.registerNamespace('Awaiter');

////////////////////////////////////////////////////////////////////////////////
// WaitTarget

WaitTarget = function WaitTarget() {
    /// <field name="fn" type="Function">
    /// </field>
    /// <field name="targetMs" type="Number" integer="true">
    /// </field>
}
WaitTarget.prototype = {
    fn: null,
    targetMs: 0
}


////////////////////////////////////////////////////////////////////////////////
// Await

Await = function Await() {
    /// <field name="logActions" type="Boolean" static="true">
    /// </field>
    /// <field name="passExceptions" type="Boolean" static="true">
    /// </field>
    /// <field name="_scripts" type="Object" static="true">
    /// </field>
    /// <field name="_simulatedLatency" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="files" type="Object" static="true">
    /// </field>
    /// <field name="awaitTimer" type="AwaitTimers">
    /// </field>
    /// <field name="vars" type="Object">
    /// </field>
    /// <field name="varsModified" type="Object">
    /// </field>
    /// <field name="_traceList" type="Array">
    /// </field>
    /// <field name="events" type="Object">
    /// </field>
    /// <field name="_abort" type="Boolean">
    /// </field>
    /// <field name="_alwaysAction" type="Function">
    /// </field>
    /// <field name="_awp" type="Await">
    /// </field>
    /// <field name="_count" type="Number" integer="true">
    /// </field>
    /// <field name="_exceptionHandlers" type="Object">
    /// </field>
    /// <field name="_ignore" type="Boolean">
    /// </field>
    /// <field name="_maxWaitStyleSheet" type="Number" integer="true">
    /// </field>
    /// <field name="_parallelActions" type="Array">
    /// </field>
    /// <field name="_queCount" type="Number" integer="true">
    /// </field>
    /// <field name="_serialActions" type="Array">
    /// </field>
    /// <field name="_serialSaved" type="Array">
    /// </field>
    /// <field name="_thrown" type="Error">
    /// </field>
    this.awaitTimer = new AwaitTimers();
    this.vars = {};
    this.varsModified = {};
    this._traceList = [];
}
Await.get_asyncAw = function Await$get_asyncAw() {
    /// <value type="Await"></value>
    return new Await();
}
Await.trigger = function Await$trigger(nm, arg) {
    /// <param name="nm" type="String">
    /// </param>
    /// <param name="arg" type="Object">
    /// </param>
    var args = new Array(1);
    args[0] = arg;
    $(document).trigger(nm, args);
}
Await.vita = function Await$vita(key, record) {
    /// <param name="key" type="String">
    /// </param>
    /// <param name="record" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return (Await.files[key])[record];
}
Await.abortAw = function Await$abortAw(aw) {
    /// <param name="aw" type="Await">
    /// </param>
    aw.abort();
}
Await.ignoreAw = function Await$ignoreAw(aw) {
    /// <param name="aw" type="Await">
    /// </param>
    aw.done();
}
Await.finishAw = function Await$finishAw(aw) {
    /// <param name="aw" type="Await">
    /// </param>
    aw.finish();
}
Await.rethrowAw = function Await$rethrowAw(aw) {
    /// <param name="aw" type="Await">
    /// </param>
    aw._ignore = true;
    aw._doAlways(function() {
        if (aw.get_awp() != null && aw._thrown != null) {
            aw._proxyVars();
            aw.get_awp().handle(aw._thrown);
        }
    });
}
Await.fileDictionary = function Await$fileDictionary(key) {
    /// <param name="key" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return Await.files[key];
}
Await.prototype = {
    events: null,
    _abort: false,
    _alwaysAction: null,
    _awp: null,
    _count: 0,
    _exceptionHandlers: null,
    _ignore: false,
    _maxWaitStyleSheet: 20000,
    _parallelActions: null,
    _queCount: 0,
    _serialActions: null,
    _serialSaved: null,
    _thrown: null,
    
    get_result: function Await$get_result() {
        /// <value type="Object"></value>
        return this.get_item('result');
    },
    set_result: function Await$set_result(value) {
        /// <value type="Object"></value>
        this.set_item('result', value);
        return value;
    },
    
    get_awp: function Await$get_awp() {
        /// <value type="Await"></value>
        return this._awp;
    },
    
    _doAlways: function Await$_doAlways(fn) {
        /// <param name="fn" type="System.Action`1">
        /// </param>
        var my = this;
        if (this._alwaysAction == null) {
            fn(my);
            return;
        }
        this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
            this._alwaysAction(my);
            fn(my);
        }), 1);
    },
    
    handle: function Await$handle(ex) {
        /// <param name="ex" type="Error">
        /// </param>
        var exType = ((ss.isValue(ex.message)) ? ex.message : 'none').split(':')[0].trim();
        if (this._exceptionHandlers != null && Object.keyExists(this._exceptionHandlers, exType)) {
            Inform.trace(String.format('Handling await exception: {0}', ex));
            var fn = this._exceptionHandlers[exType];
            this._thrown = ex;
            fn(this);
            return;
        }
        if (this._awp != null) {
            this._proxyVars();
            this._awp.handle(ex);
        }
        else {
            Exceptions.logException(ex, String.format('Aborting await chain with exception: "{0}"', exType));
            this.abort();
            throw ex;
        }
    },
    
    _doAbort: function Await$_doAbort() {
        /// <returns type="Await"></returns>
        this._ignore = true;
        this._doAlways(ss.Delegate.create(this, function() {
            if (this._awp != null) {
                this._proxyVars();
                this._awp.abort();
            }
        }));
        return this;
    },
    
    _actionClosure: function Await$_actionClosure(f) {
        /// <param name="f" type="Function">
        /// </param>
        var my = this;
        this.awaitTimer.setTimeout(function() {
            f(my);
        }, 1);
    },
    
    _logDoFn: function Await$_logDoFn(fn, arg1, arg2, arg3) {
        /// <param name="fn" type="Object">
        /// </param>
        /// <param name="arg1" type="Object">
        /// </param>
        /// <param name="arg2" type="Object">
        /// </param>
        /// <param name="arg3" type="Object">
        /// </param>
        if (!Await.logActions) {
            return;
        }
        var t = fn._targets;
        if (ss.isValue(t)) {
            var args = '()';
            if (ss.isValue(arg1)) {
                args = String.format('({0},{1},{2})', arg1, arg2, arg3);
            }
            if (t.length > 1 && ss.isValue(t[1])) {
                var a = fn._targets[1].name;
                if (ss.isValue(a) && !String.isNullOrEmpty(a)) {
                    Inform.debug(String.format('Await doing {0}{1}', a, args));
                }
                else {
                    a = Type.getInstanceType(fn._targets[0]).get_name();
                    Inform.debug(String.format('Await doing (anonymous delegate){0}{1}', a, args));
                }
            }
        }
    },
    
    _proxyVars: function Await$_proxyVars() {
        if (this._awp != null) {
            var $dict1 = this.vars;
            for (var $key2 in $dict1) {
                var p = { key: $key2, value: $dict1[$key2] };
                if (!this._awp.varsModified[p.key]) {
                    this._awp.vars[p.key] = p.value;
                }
            }
        }
    },
    
    _loadScriptWait: function Await$_loadScriptWait(url) {
        /// <param name="url" type="String">
        /// </param>
        if (!Await._scripts[url]) {
            this.awaitTimer.startDelayedSpinner();
            this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
                this._loadScriptWait(url);
            }), 13);
        }
        else {
            this.awaitTimer.stopDelayedSpinner();
            this.done();
        }
    },
    
    que: function Awaiter_Await$que(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        if (this._parallelActions == null) {
            this._parallelActions = [];
        }
        this._parallelActions.add(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn);
            if (Await.passExceptions) {
                fn(aw);
                return;
            }
            try {
                fn(aw);
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        this._count++;
        this._queCount++;
        return this;
    },
    
    addDl: function Awaiter_Await$addDl(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        if (this._serialSaved == null) {
            this._serialSaved = [];
        }
        this._serialSaved.add(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn);
            if (Await.passExceptions) {
                fn(aw);
                return;
            }
            try {
                fn(aw);
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        this._count++;
        return this;
    },
    
    addDx: function Awaiter_Await$addDx(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        if (this._serialSaved == null) {
            this._serialSaved = [];
        }
        this._serialSaved.add(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn);
            if (Await.passExceptions) {
                fn(aw);
                aw.done();
                return;
            }
            try {
                fn(aw);
                aw.done();
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        this._count++;
        return this;
    },
    
    addAw: function Awaiter_Await$addAw(fn, arg1, arg2, arg3) {
        /// <param name="fn" type="System.Action`4">
        /// </param>
        /// <param name="arg1" type="Object">
        /// </param>
        /// <param name="arg2" type="Object">
        /// </param>
        /// <param name="arg3" type="Object">
        /// </param>
        /// <returns type="Await"></returns>
        if (this._serialSaved == null) {
            this._serialSaved = [];
        }
        this._serialSaved.add(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn, arg1, arg2, arg3);
            if (Await.passExceptions) {
                fn(aw, arg1, arg2, arg3);
                return;
            }
            try {
                fn(aw, arg1, arg2, arg3);
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        this._count++;
        return this;
    },
    
    queFn: function Awaiter_Await$queFn(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        this.que(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn);
            if (Await.passExceptions) {
                fn();
                aw.done();
                return;
            }
            try {
                fn();
                aw.done();
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        return this;
    },
    
    addFn: function Awaiter_Await$addFn(fn, arg1, arg2) {
        /// <param name="fn" type="System.Action`2">
        /// </param>
        /// <param name="arg1" type="Object">
        /// </param>
        /// <param name="arg2" type="Object">
        /// </param>
        /// <returns type="Await"></returns>
        if (this._serialSaved == null) {
            this._serialSaved = [];
        }
        this._serialSaved.add(ss.Delegate.create(this, function(aw) {
            this._logDoFn(fn, arg1, arg2);
            if (Await.passExceptions) {
                fn(arg1, arg2);
                aw.done();
                return;
            }
            try {
                fn(arg1, arg2);
                aw.done();
            }
            catch (ex) {
                this.handle(ex);
            }
        }));
        this._count++;
        return this;
    },
    
    addEv: function Awaiter_Await$addEv(name, fn) {
        /// <param name="name" type="String">
        /// </param>
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        if (this.events == null) {
            this.events = {};
        }
        this.events[name] = fn;
        return this;
    },
    
    doneWith: function Awaiter_Await$doneWith(n, v) {
        /// <param name="n" type="String">
        /// </param>
        /// <param name="v" type="Object">
        /// </param>
        this.vars[n] = v;
        this.done();
    },
    
    done: function Awaiter_Await$done() {
        /// <returns type="Await"></returns>
        if (this._ignore) {
            return this;
        }
        if (this._abort) {
            return this._doAbort();
        }
        if (this._traceList.length > 0) {
            var msg = this._traceList[this._traceList.length - 1];
            this._traceList.removeAt(this._traceList.length - 1);
            Inform.trace('Done: ' + msg);
        }
        this._count--;
        this._queCount--;
        return this._next();
    },
    
    insertDl: function Awaiter_Await$insertDl(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        if (!this._abort) {
            ss.Debug.assert(fn != null, 'InsertDl fn != null');
            this._serialActions.insert(0, fn);
            this._count++;
        }
        return this;
    },
    
    always: function Awaiter_Await$always(fn) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <returns type="Await"></returns>
        this._alwaysAction = fn;
        return this;
    },
    
    handleDl: function Awaiter_Await$handleDl(exceptionName, fn) {
        /// <summary>
        /// Handles the specified exception.
        /// </summary>
        /// <param name="exceptionName" type="String">
        /// Name of the exception.
        /// </param>
        /// <param name="fn" type="Function">
        /// The action to perform. Must envoke Done.
        /// </param>
        /// <returns type="Await"></returns>
        if (this._exceptionHandlers == null) {
            this._exceptionHandlers = {};
        }
        this._exceptionHandlers[exceptionName] = fn;
        return this;
    },
    
    handleDx: function Awaiter_Await$handleDx(exceptionName, fn) {
        /// <summary>
        /// Handles the specified exception with automatic Done() being done at the end
        /// </summary>
        /// <param name="exceptionName" type="String">
        /// Name of the exception.
        /// </param>
        /// <param name="fn" type="Function">
        /// The action to perform.
        /// </param>
        /// <returns type="Await"></returns>
        return this.handleDl(exceptionName, ss.Delegate.create(this, function() {
            fn(this);
            this.done();
        }));
    },
    
    abort: function Awaiter_Await$abort() {
        /// <returns type="Await"></returns>
        this._abort = true;
        return this._doAbort();
    },
    
    sleep: function Awaiter_Await$sleep(ms) {
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        /// <returns type="Await"></returns>
        return this.addDl(ss.Delegate.create(this, function() {
            this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
                this.done();
            }), ms);
        }));
    },
    
    _waitAw: function Awaiter_Await$_waitAw(awp, waitTarget) {
        /// <summary>
        /// Waits until a wait target object is satisfied.
        /// </summary>
        /// <param name="awp" type="Await">
        /// The awp.
        /// </param>
        /// <param name="waitTarget" type="Object">
        /// The wait target object
        /// </param>
        var t = waitTarget;
        t.targetMs = (t.targetMs || new Date().getTime() + 10000);
        if (t.fn()) {
            awp.done();
            return;
        }
        if (new Date().getTime() >= t.targetMs) {
            Inform.trace(String.format('WaitAw waited {0} for {1}', t.targetMs, t.fn));
            awp.done();
            return;
        }
        this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
            this._waitAw(awp, t);
        }), 13);
    },
    
    waitDx: function Awaiter_Await$waitDx(fn, maxWaitMs) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <param name="maxWaitMs" type="Number" integer="true">
        /// </param>
        /// <returns type="Await"></returns>
        var t = new WaitTarget();
        t.fn = fn;
        t.targetMs = new Date().getTime() + (maxWaitMs || 10000);
        return this.addAw(ss.Delegate.create(this, this._waitAw), t);
    },
    
    simulateAsync: function Awaiter_Await$simulateAsync() {
        /// <returns type="Await"></returns>
        return this.addDl(ss.Delegate.create(this, function() {
            this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
                this.done();
            }), Await._simulatedLatency);
        }));
    },
    
    commit: function Awaiter_Await$commit(awp) {
        /// <param name="awp" type="Await">
        /// </param>
        /// <returns type="Await"></returns>
        this.awaitTimer.clearAll();
        this._ignore = this._abort = false;
        this._awp = (ss.isValue(awp)) ? awp : null;
        if (this._serialSaved != null) {
            this._serialActions = this._serialSaved.clone();
        }
        this._queCount = (this._parallelActions == null) ? 0 : this._parallelActions.length;
        this._count = (this._serialActions == null) ? 0 : this._serialActions.length + this._queCount;
        return this._doActions();
    },
    
    _doActions: function Awaiter_Await$_doActions() {
        /// <returns type="Await"></returns>
        if (this._queCount > 0) {
            var $enum1 = ss.IEnumerator.getEnumerator(this._parallelActions);
            while ($enum1.moveNext()) {
                var f = $enum1.current;
                if (this._abort) {
                    return this._doAbort();
                }
                this._actionClosure(f);
            }
        }
        else {
            this._next();
        }
        return this;
    },
    
    _next: function Awaiter_Await$_next() {
        /// <returns type="Await"></returns>
        if (this._ignore) {
            return this;
        }
        if (this._abort) {
            return this._doAbort();
        }
        var my = this;
        if (this._queCount <= 0 && this._count > 0) {
            var f = this._serialActions[0];
            this._serialActions.removeAt(0);
            this.awaitTimer.setTimeout(function() {
                f(my);
            }, 1);
            return this;
        }
        if (this._count <= 0) {
            this.finish();
        }
        return this;
    },
    
    finish: function Awaiter_Await$finish() {
        this._ignore = true;
        this._doAlways(ss.Delegate.create(this, function() {
            if (ss.isValue(this._awp)) {
                this._proxyVars();
                this._awp.done();
            }
        }));
    },
    
    loadAndDo: function Awaiter_Await$loadAndDo(url, className, opts, e) {
        /// <param name="url" type="String">
        /// </param>
        /// <param name="className" type="String">
        /// </param>
        /// <param name="opts" type="Object">
        /// </param>
        /// <param name="e" type="jQueryEvent">
        /// </param>
        /// <returns type="Await"></returns>
        opts = opts || {};
        this.loadScript(url);
        this.addDx(function() {
            try {
                var p = className.split('.');
                var fn = window[p[0]][p[1]];
                fn(e, opts);
            }
            catch (ex) {
                Exceptions.logException(ex, String.format('LoadAndDo({0}, {1})', url, className));
            }
        });
        return this;
    },
    
    loadScript: function Awaiter_Await$loadScript(url, fn) {
        /// <param name="url" type="String">
        /// </param>
        /// <param name="fn" type="System.Action`1">
        /// </param>
        /// <returns type="Await"></returns>
        var fnargs = 'Await.LoadScript';
        if (url == null) {
            return this;
        }
        url = url.trim();
        this.addDl(ss.Delegate.create(this, function() {
            if (!Object.keyExists(Await._scripts, url)) {
                var options = {};
                options.url = url;
                options.dataType = 'script';
                options.success = function() {
                    Await._scripts[url] = true;
                };
                options.error = ss.Delegate.create(this, function(request, textStatus, error) {
                    this.handle(Exceptions.ajaxError('Blob Load Error', url, request, textStatus, error, fnargs));
                });
                $.ajax(options);
                Await._scripts[url] = false;
                this._loadScriptWait(url);
            }
            else if (!Await._scripts[url]) {
                this._loadScriptWait(url);
            }
            else {
                this.done();
            }
        }));
        if (arguments.length > 1) {
            this.addAw(fn);
        }
        return this;
    },
    
    loadJson: function Awaiter_Await$loadJson(name, url) {
        /// <param name="name" type="String">
        /// </param>
        /// <param name="url" type="String">
        /// </param>
        /// <returns type="Await"></returns>
        var fnargs = 'Await.LoadJson';
        return this.addDl(ss.Delegate.create(this, function() {
            var options = {};
            options.url = url;
            options.dataType = 'json';
            options.type = 'GET';
            options.cache = false;
            options.success = ss.Delegate.create(this, function(data, textStatus, request1) {
                if (name != null) {
                    Await.files[name] = data;
                }
                this.done();
            });
            options.error = ss.Delegate.create(this, function(request, textStatus, error) {
                if (name != null) {
                    Await.files[name] = null;
                }
                this.handle(Exceptions.ajaxError('Blob Load Error', url, request, textStatus, error, fnargs));
            });
            $.ajax(options);
        }));
    },
    
    loadText: function Awaiter_Await$loadText(name, url) {
        /// <param name="name" type="String">
        /// </param>
        /// <param name="url" type="String">
        /// </param>
        /// <returns type="Await"></returns>
        var fnargs = 'Await.LoadText';
        return this.addDl(ss.Delegate.create(this, function() {
            var options = {};
            options.url = url;
            options.dataType = 'html';
            options.type = 'GET';
            options.cache = false;
            options.success = ss.Delegate.create(this, function(data, textStatus, request1) {
                Await.files[name] = data;
                this.done();
            });
            options.error = ss.Delegate.create(this, function(request, textStatus, error) {
                this.handle(Exceptions.ajaxError('Blob Load Error', url, request, textStatus, error, fnargs));
            });
            $.ajax(options);
        }));
    },
    
    loadCss: function Awaiter_Await$loadCss(url) {
        /// <param name="url" type="String">
        /// </param>
        /// <returns type="Await"></returns>
        var urlKey = Uri.path(url).replace('..', ThemeBase.get_baseName());
        return this.addDl(ss.Delegate.create(this, function() {
            var sheet;
            if (Object.keyExists(Await.files, urlKey)) {
                this.done();
                return;
            }
            sheet = this._hasStyleSheet(urlKey);
            if (sheet != null) {
                Await.files[urlKey] = sheet;
                this.done();
                return;
            }
            var css = $('<link/>').attr({ rel: 'stylesheet', type: 'text/css', href: url });
            css.appendTo('head');
            if (('styleSheets' in window.document)) {
                var mark = new Date().getTime() + this._maxWaitStyleSheet;
                var tmr = 0;
                tmr = this.awaitTimer.setInterval(ss.Delegate.create(this, function() {
                    sheet = this._hasStyleSheet(urlKey);
                    if (sheet != null || new Date().getTime() > mark) {
                        this.awaitTimer.clearTimer(tmr);
                        Await.files[urlKey] = sheet;
                        this.done();
                    }
                }), 5);
            }
            else {
                this.awaitTimer.setTimeout(ss.Delegate.create(this, function() {
                    this.done();
                }), 250);
            }
        }));
    },
    
    _hasStyleSheet: function Awaiter_Await$_hasStyleSheet(url) {
        /// <param name="url" type="String">
        /// </param>
        /// <returns type="Awaiter.DynamicStyleSheet"></returns>
        var stylesheets = window.document.styleSheets;
        var $enum1 = ss.IEnumerator.getEnumerator(stylesheets);
        while ($enum1.moveNext()) {
            var sheet = $enum1.current;
            if (!String.isNullOrEmpty(sheet.href) && sheet.href.indexOf(url) >= 0) {
                return sheet;
            }
        }
        return null;
    },
    get_item: function Await$get_item(n) {
        /// <param name="n" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        /// <returns type="Object"></returns>
        return this.vars[(n.substr(0, 1) === '@') ? n.substr(1) : n];
    },
    set_item: function Await$set_item(n, value) {
        /// <param name="n" type="String">
        /// </param>
        /// <param name="value" type="Object">
        /// </param>
        /// <returns type="Object"></returns>
        n = (n.substr(0, 1) === '@') ? n.substr(1) : n;
        this.vars[n] = value;
        this.varsModified[n] = true;
        return value;
    }
}


////////////////////////////////////////////////////////////////////////////////
// AwaitTimers

AwaitTimers = function AwaitTimers() {
    /// <field name="_timers" type="Object">
    /// </field>
    /// <field name="_delayedSpinner" type="Number" integer="true" static="true">
    /// </field>
    this._timers = {};
}
AwaitTimers.prototype = {
    
    setTimeout: function AwaitTimers$setTimeout(fn, ms) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        /// <returns type="Number" integer="true"></returns>
        var t = window.setTimeout(fn, ms);
        this._timers[t] = clearTimeout;
        return t;
    },
    
    setInterval: function AwaitTimers$setInterval(fn, ms) {
        /// <param name="fn" type="Function">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        /// <returns type="Number" integer="true"></returns>
        var t = window.setInterval(fn, ms);
        this._timers[t] = clearInterval;
        return t;
    },
    
    clearTimer: function AwaitTimers$clearTimer(timer) {
        /// <param name="timer" type="Number" integer="true">
        /// </param>
        /// <returns type="Number" integer="true"></returns>
        var fn = this._timers[timer];
        if (fn != null) {
            var ret = fn(timer);
            delete this._timers[timer];
            return ret;
        }
        return 0;
    },
    
    clearAll: function AwaitTimers$clearAll() {
        var $dict1 = this._timers;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            this.clearTimer(p.key);
        }
    },
    
    startDelayedSpinner: function AwaitTimers$startDelayedSpinner() {
        return;
        if (AwaitTimers._delayedSpinner > 0) {
            return;
        }
        console.log('Starting delayed spinner');
        AwaitTimers._delayedSpinner = window.setTimeout(function() {
            Await.trigger('Spinner', true);
        }, 3000);
    },
    
    stopDelayedSpinner: function AwaitTimers$stopDelayedSpinner() {
        return;
        console.log('Stopping delayed spinner');
        Await.trigger('Spinner', false);
        var sv = AwaitTimers._delayedSpinner;
        AwaitTimers._delayedSpinner = 0;
        window.clearTimeout(sv);
    }
}


Type.registerNamespace('Yoshi.Classes');

////////////////////////////////////////////////////////////////////////////////
// PopMenu

PopMenu = function PopMenu() {
    /// <field name="_focuser$3" type="jQueryObject">
    /// </field>
    /// <field name="clickItem" type="jQueryObject">
    /// </field>
    /// <field name="list" type="jQueryObject">
    /// </field>
    /// <field name="_closing$3" type="Boolean">
    /// </field>
    /// <field name="_actions$3" type="Object">
    /// </field>
    /// <field name="_menu$3" type="jQueryObject">
    /// </field>
    PopMenu.initializeBase(this);
    this.element = $("<div class='PopMenuWrapper'/>");
    this.list = $("<ul class='PopMenu MenuZee AboveHider'/>").appendTo(this.element).hide();
    this._focuser$3 = $('<div/>').appendTo(this.element).attr('tabindex', (Formulas.randomOf(10000) + 9999).toString()).hide();
    DomElement.unselectable(this._focuser$3);
}
PopMenu.prototype = {
    _focuser$3: null,
    clickItem: null,
    list: null,
    _closing$3: false,
    _actions$3: null,
    _menu$3: null,
    
    wrapAround: function PopMenu$wrapAround(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="PopMenu"></returns>
        var display = el.css('display') || 'inline-block';
        if (el.parent().is('.PopMenuWrapper')) {
            el.parent().replaceWith(el);
        }
        el.replaceWith(this.element);
        el.prependTo(this.element);
        this._closing$3 = false;
        this._menu$3 = null;
        this.element.css({ display: display, position: 'relative' });
        new Await().addDx(ss.Delegate.create(this, function() {
            el.unbind('click.PopMenu').bind('click.PopMenu', ss.Delegate.create(this, function() {
                this.list.css({ position: 'absolute', top: el.position().top + el.outerHeight(), right: -10 });
                if (!this._closing$3) {
                    this.list.show();
                    this._menu$3 = this.list.clone(true, true);
                    this._menu$3.css({ top: this.list.offset().top, left: this.list.offset().left, width: this.list.width(), height: this.list.height() });
                    this.list.hide();
                    this._menu$3.appendTo('body');
                    this._menu$3.show();
                    this._focuser$3.show().focus();
                    Cluster.glass(ss.Delegate.create(this, this.closeEv));
                    this.btnClick();
                }
            }));
            this._focuser$3.css({ position: 'absolute', top: el.outerHeight() + 10, left: el.outerWidth() - 10, width: 1, height: 1 }).focusout(ss.Delegate.create(this, this.closeEv));
        })).commit();
        return this;
    },
    
    closeEv: function PopMenu$closeEv(e) {
        /// <param name="e" type="jQueryEvent">
        /// </param>
        this._closing$3 = true;
        new Await().addDx(ss.Delegate.create(this, function() {
            this._focuser$3.hide();
            Cluster.glassOff(true);
            if (this._menu$3 != null) {
                this._menu$3.fadeOut(120, ss.Delegate.create(this, function() {
                    this._menu$3.remove();
                    this._closing$3 = false;
                }));
            }
            this.menuHide();
        })).commit();
    },
    
    addList: function PopMenu$addList(actions) {
        /// <param name="actions" type="Object">
        /// </param>
        /// <returns type="PopMenu"></returns>
        if (!ss.isValue(actions) || actions == null || !Object.getKeyCount(actions)) {
            debugger;
            throw new Error('Argument Null');
        }
        this._actions$3 = actions;
        var $dict1 = this._actions$3;
        for (var $key2 in $dict1) {
            var p = { key: $key2, value: $dict1[$key2] };
            if ($.isFunction(p.value)) {
                var item = $("<li class='PopMenuItem' style='clear:both'/>").appendTo(this.list).data('MenuData', p.key).data('MenuFn', p.value).mousedown(ss.Delegate.create(this, function(e) {
                    this.clickItem = $(e.currentTarget);
                    var nd = this.clickItem.data('MenuData');
                    var fn = this.clickItem.data('MenuFn');
                    fn(e, nd);
                    this.itemClick();
                }));
                $('<span/>').appendTo(item).html(p.key);
            }
            else {
                if (String.isNullOrEmpty(p.value)) {
                    $("<div class='Inactive'/>").appendTo(this.list).html(p.key);
                }
                else {
                    var spacer = $("<div class='Spacer' style='clear:both'/>").appendTo(this.list);
                    $("<div style='display:inline-block;width:50%;float:right'><hr></div><div style='float:left'>" + p.value + '</div>').appendTo(spacer);
                }
            }
        }
        return this;
    },
    
    btnClick: function PopMenu$btnClick() {
    },
    
    itemClick: function PopMenu$itemClick() {
    },
    
    menuHide: function PopMenu$menuHide() {
    }
}


////////////////////////////////////////////////////////////////////////////////
// DropMenu

DropMenu = function DropMenu(el, nameList, handler) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    /// <param name="nameList" type="Object">
    /// </param>
    /// <param name="handler" type="Function">
    /// </param>
    /// <field name="fireButton" type="jQueryObject">
    /// </field>
    /// <field name="list" type="jQueryObject">
    /// </field>
    /// <field name="menuWidget" type="jQueryObject">
    /// </field>
    /// <field name="clickItem" type="jQueryObject">
    /// </field>
    if (!ss.isValue(nameList) || el == null || !el.length) {
        debugger;
        throw new Error('Argument Null');
    }
    var priorList = el.prev('.DropMenu');
    if (!priorList.length) {
        if (!Object.getKeyCount(nameList)) {
            return;
        }
        this.menuWidget = $("<div class='DropMenuWidget' style='position:absolute'/>");
        new Await().addDx(ss.Delegate.create(this, function() {
            var p = el.position();
            this.menuWidget.css({ top: p.top, left: p.left + el.outerWidth(), 'margin-top': el.css('margin-top') });
        })).commit();
        this.fireButton = $("<span class='DropMenuFire'/>").appendTo(this.menuWidget).html('&#x25BC;').height(el.outerHeight());
        var focs = $("<span class='DropMenuFocus' style='display:none;color:transparent;background:transparent;position:absolute;right:10px' tabindex='999'/>").appendTo(this.menuWidget).html('&#x25BC;');
        this.list = $("<ul class='DropMenu' style='display:none'/>").appendTo(this.menuWidget);
        this.menuWidget.insertBefore(el);
        this.fireButton.click(ss.Delegate.create(this, function(e) {
            e.preventDefault();
            if (!this.list.is(':visible')) {
                var ht = this.menuWidget.outerHeight();
                focs.css('top', (ht + 4) + 'px').show().focus();
                this.list.css('top', ht + 'px').show();
                this.arrowClick();
            }
        }));
        focs.focusout(ss.Delegate.create(this, function() {
            new Await().addDx(ss.Delegate.create(this, function() {
                this.fireButton.focus();
                focs.hide();
                this.list.fadeOut(120);
                this.menuHide();
            })).commit();
        }));
        DropMenu._unselectable(this.fireButton);
        DropMenu._unselectable(focs);
    }
    else {
        if (!Object.getKeyCount(nameList)) {
            priorList.closest('.DropMenuWidget').remove();
            return;
        }
        this.list = priorList;
        this.list.empty();
    }
    var $dict1 = nameList;
    for (var $key2 in $dict1) {
        var p = { key: $key2, value: $dict1[$key2] };
        var item = $("<li class='DropMenuItem'/>").appendTo(this.list).data('MenuData', p.key).mousedown(ss.Delegate.create(this, function(e) {
            this.clickItem = $(e.currentTarget);
            var nd = this.clickItem.data('MenuData');
            handler(e, nd);
            this.itemClick();
        }));
        $('<span/>').appendTo(item).html(p.value);
    }
}
DropMenu._unselectable = function DropMenu$_unselectable(el) {
    /// <param name="el" type="jQueryObject">
    /// </param>
    var elem = el[0];
    elem.onselectstart = function() { return false; };
    elem.style.MozUserSelect = 'none';
    elem.style.KhtmlUserSelect = 'none';
    elem.unselectable = 'on';
}
DropMenu.listify = function DropMenu$listify(dict, sort, format) {
    /// <param name="dict" type="Object">
    /// </param>
    /// <param name="sort" type="System.Collections.Generic.CompareCallback`1">
    /// </param>
    /// <param name="format" type="System.Action`2">
    /// </param>
    /// <returns type="Object"></returns>
    var mg = [];
    var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(dict));
    while ($enum1.moveNext()) {
        var k = $enum1.current;
        mg.add(dict[k]);
    }
    mg.sort(sort);
    var d = {};
    var $enum2 = ss.IEnumerator.getEnumerator(mg);
    while ($enum2.moveNext()) {
        var o = $enum2.current;
        format(d, o);
    }
    return d;
}
DropMenu.prototype = {
    fireButton: null,
    list: null,
    menuWidget: null,
    clickItem: null,
    
    itemClick: function DropMenu$itemClick() {
    },
    
    arrowClick: function DropMenu$arrowClick() {
    },
    
    menuHide: function DropMenu$menuHide() {
    }
}


Type.registerNamespace('ThemeChain');

////////////////////////////////////////////////////////////////////////////////
// ThemeBase

ThemeBase = function ThemeBase() {
    /// <field name="isStaticPage" type="Boolean" static="true">
    /// </field>
    /// <field name="rootPath" type="String" static="true">
    /// </field>
    /// <field name="appPath" type="String" static="true">
    /// </field>
    /// <field name="dbPath" type="String" static="true">
    /// </field>
    /// <field name="appUri" type="String" static="true">
    /// </field>
    /// <field name="scriptsUri" type="String" static="true">
    /// </field>
    /// <field name="mediaUri" type="String" static="true">
    /// </field>
    /// <field name="mediaImgUri" type="String" static="true">
    /// </field>
    /// <field name="baseUri" type="String" static="true">
    /// </field>
    /// <field name="stdUnits" type="String" static="true">
    /// </field>
    /// <field name="errorLogName" type="String" static="true">
    /// </field>
    /// <field name="eventLogName" type="String" static="true">
    /// </field>
    /// <field name="hearts" type="String" static="true">
    /// </field>
    /// <field name="clubs" type="String" static="true">
    /// </field>
    /// <field name="spades" type="String" static="true">
    /// </field>
    /// <field name="diamonds" type="String" static="true">
    /// </field>
    /// <field name="smile" type="String" static="true">
    /// </field>
    /// <field name="sun" type="String" static="true">
    /// </field>
    /// <field name="bullit" type="String" static="true">
    /// </field>
    /// <field name="dragOrder" type="String" static="true">
    /// </field>
    /// <field name="checkMark" type="String" static="true">
    /// </field>
    /// <field name="ballotBox" type="String" static="true">
    /// </field>
    /// <field name="ballotBoxChecked" type="String" static="true">
    /// </field>
    /// <field name="upMark" type="String" static="true">
    /// </field>
    /// <field name="downMark" type="String" static="true">
    /// </field>
    /// <field name="leftMark" type="String" static="true">
    /// </field>
    /// <field name="rightMark" type="String" static="true">
    /// </field>
    /// <field name="forSure" type="String" static="true">
    /// </field>
    /// <field name="devPasswordKey" type="String" static="true">
    /// </field>
    /// <field name="isCheckedOut" type="String" static="true">
    /// </field>
    /// <field name="undoKey" type="String" static="true">
    /// </field>
    /// <field name="godMode" type="Boolean" static="true">
    /// </field>
    /// <field name="reloading" type="Boolean" static="true">
    /// </field>
    /// <field name="testing" type="Boolean" static="true">
    /// </field>
    /// <field name="shiftKey" type="Boolean" static="true">
    /// </field>
    /// <field name="dynamicPaging" type="Boolean" static="true">
    /// </field>
    /// <field name="publishing" type="Boolean" static="true">
    /// </field>
    /// <field name="activePage" type="Boolean" static="true">
    /// </field>
    /// <field name="devServer" type="Boolean" static="true">
    /// </field>
    /// <field name="userId" type="String" static="true">
    /// </field>
    /// <field name="email" type="String" static="true">
    /// </field>
    /// <field name="pageActionKey" type="String" static="true">
    /// </field>
    /// <field name="redirectDataKey" type="String" static="true">
    /// </field>
    /// <field name="devServerKey" type="String" static="true">
    /// </field>
}
ThemeBase.get_baseName = function ThemeBase$get_baseName() {
    /// <value type="String"></value>
    var b = Uri.end(Uri.front(window.location.href));
    return (ThemeBase.isStaticPage) ? Uri.end(Uri.front(b)) : b;
}
ThemeBase.get_keyPrefix = function ThemeBase$get_keyPrefix() {
    /// <value type="String"></value>
    return Uri.end(Uri.front(window.location.href).replaceAll('/pages', ''));
}
ThemeBase.get_curatePasswordKey = function ThemeBase$get_curatePasswordKey() {
    /// <value type="String"></value>
    return ThemeBase.get_keyPrefix() + '/CuratePassword';
}
ThemeBase.fnToObject = function ThemeBase$fnToObject(v) {
    /// <param name="v" type="Object">
    /// </param>
    /// <returns type="String"></returns>
    var t = v._targets;
    if (t != null) {
        var $enum1 = ss.IEnumerator.getEnumerator(t);
        while ($enum1.moveNext()) {
            var o = $enum1.current;
            if (typeof(o) === 'function') {
                return o.toString();
            }
        }
    }
    return v.toString();
}
ThemeBase.pageAction = function ThemeBase$pageAction(fn) {
    /// <param name="fn" type="Function">
    /// </param>
    var a = '(' + ThemeBase.fnToObject(fn) + '())';
    Nsb.Storage.setSession('PageAction', a);
}
ThemeBase.get_isLocalhost = function ThemeBase$get_isLocalhost() {
    /// <value type="Boolean"></value>
    return ([ '192.168.1.19', 'localhost' ]).contains(window.location.hostname);
}
ThemeBase.parseAnchorsToEdit = function ThemeBase$parseAnchorsToEdit(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return txt;
}
ThemeBase.parseEditToAnchors = function ThemeBase$parseEditToAnchors(txt) {
    /// <param name="txt" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return txt;
}
ThemeBase.Update = function ThemeBase$Update() {
    /// <summary>
    /// Reenterant dynamic overrides performed in Master.cs for every new page load
    /// </summary>
}


Type.registerNamespace('Nsb');

////////////////////////////////////////////////////////////////////////////////
// DynamicCss

DynamicCss = function DynamicCss() {
}
DynamicCss.addCssRule = function DynamicCss$addCssRule(ruleName, rules) {
    /// <summary>
    /// Adds the CSS rule to the DOM.
    /// Use DynamicCss.AddCssRule(ruleName, ruleDictionary).
    /// </summary>
    /// <param name="ruleName" type="String">
    /// Name of the rule in CSS standard format.
    /// </param>
    /// <param name="rules" type="Object">
    /// Dictionary of the rules to add.
    /// </param>
    /// <returns type="Object" domElement="true"></returns>
    var dataname = 'AddCssRuleData';
    var jq = window.self.jQuery;
    var data = jq[dataname];
    if (typeof(data) === 'undefined') {
        data = {};
        data.sheetName = 'DynamicCss-StyleSheet';
        data.undefined_as_dictionary = undefined;
        jq[dataname] = data;
        var cssNode = document.createElement('style');
        cssNode.id = new Date().getTime().toString();
        cssNode.type = 'text/css';
        cssNode.rel = 'stylesheet';
        cssNode.media = 'screen';
        cssNode.title = data.sheetName;
        document.getElementsByTagName('head')[0].appendChild(cssNode);
    }
    if (('styleSheets' in window.document)) {
        if (typeof(rules) === 'undefined') {
            var stylesheets = window.document.styleSheets;
            for (var j = 0; j < stylesheets.length; j++) {
                var ru = null;
                try {
                    var sth = stylesheets[j];
                    if (sth.title !== data.sheetName) {
                        continue;
                    }
                    if ((typeof(sth.insertRule) === 'function')) {
                        var ix = sth.insertRule(ruleName + ' { }', 0);
                        ru = sth.cssRules[ix];
                    }
                    else if ((typeof(sth.addRule) === 'function')) {
                        sth.addRule(ruleName, null, 0);
                        ru = sth.rules[0];
                    }
                    else {
                        throw new Error('CANT FIND insertRule OR SIMILAR CSS FUNCTION');
                    }
                }
                catch ($e1) {
                }
                return ru;
            }
            throw new Error('FAILED TO ADD CSS RULE or NO DynamicCss SHEET');
        }
        $(DynamicCss.addCssRule(ruleName, data.undefined_as_dictionary)).css(rules);
        return null;
    }
    throw new Error('NO BROWSER DYNAMIC STYLESHEET SUPORT');
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Encoder

Nsb.Encoder = function Nsb_Encoder() {
}
Nsb.Encoder.lzwEncode = function Nsb_Encoder$lzwEncode(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Encoder.LzwEncode(s);
}
Nsb.Encoder.lzwDecode = function Nsb_Encoder$lzwDecode(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Encoder.LzwDecode(s);
}
Nsb.Encoder.encode64 = function Nsb_Encoder$encode64(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Encoder.Encode64(s);
}
Nsb.Encoder.decode64 = function Nsb_Encoder$decode64(s) {
    /// <param name="s" type="String">
    /// </param>
    /// <returns type="String"></returns>
    return Encoder.Decode64(s);
}


////////////////////////////////////////////////////////////////////////////////
// Nsb.Storage

Nsb.Storage = function Nsb_Storage() {
}
Nsb.Storage.setLocal = function Nsb_Storage$setLocal(n, v) {
    /// <param name="n" type="String">
    /// </param>
    /// <param name="v" type="Object">
    /// </param>
    Nsb.Storage._dbPackage(n, v, window.localStorage);
}
Nsb.Storage.setSession = function Nsb_Storage$setSession(n, v) {
    /// <param name="n" type="String">
    /// </param>
    /// <param name="v" type="Object">
    /// </param>
    Nsb.Storage._dbPackage(n, v, window.sessionStorage);
}
Nsb.Storage.getLocal = function Nsb_Storage$getLocal(n) {
    /// <param name="n" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return Nsb.Storage._dbUnpackage(n, window.localStorage);
}
Nsb.Storage.getSession = function Nsb_Storage$getSession(n) {
    /// <param name="n" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    return Nsb.Storage._dbUnpackage(n, window.sessionStorage);
}
Nsb.Storage.removeLocal = function Nsb_Storage$removeLocal(n) {
    /// <param name="n" type="String">
    /// </param>
    try {
        window.localStorage.removeItem(n);
    }
    catch ($e1) {
        window.localStorage[n] = '';
    }
}
Nsb.Storage.removeSession = function Nsb_Storage$removeSession(n) {
    /// <param name="n" type="String">
    /// </param>
    try {
        window.sessionStorage.removeItem(n);
    }
    catch ($e1) {
        window.sessionStorage[n] = '';
    }
}
Nsb.Storage.compareLocal = function Nsb_Storage$compareLocal(n, v) {
    /// <param name="n" type="String">
    /// </param>
    /// <param name="v" type="Object">
    /// </param>
    /// <returns type="Boolean"></returns>
    return Nsb.Storage.compareObjects(Nsb.Storage._dbUnpackage(n, window.localStorage), v);
}
Nsb.Storage.compareObjects = function Nsb_Storage$compareObjects(a, b) {
    /// <param name="a" type="Object">
    /// </param>
    /// <param name="b" type="Object">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (ss.isNullOrUndefined(a) || ss.isNullOrUndefined(b)) {
        return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
}
Nsb.Storage._dbPackage = function Nsb_Storage$_dbPackage(n, v, store) {
    /// <param name="n" type="String">
    /// </param>
    /// <param name="v" type="Object">
    /// </param>
    /// <param name="store" type="Storage">
    /// </param>
    switch (typeof(v)) {
        case 'object':
            v = '@@object@@' + Strings.fnStringify(v);
            break;
        default:
            v = v.toString();
            break;
    }
    store.setItem(n, v);
}
Nsb.Storage._dbUnpackage = function Nsb_Storage$_dbUnpackage(n, store) {
    /// <param name="n" type="String">
    /// </param>
    /// <param name="store" type="Storage">
    /// </param>
    /// <returns type="Object"></returns>
    var v = store.getItem(n);
    if (ss.isNull(v)) {
        return undefined;
    }
    if ((/^@@object@@|^\{.*\}$/).test(v)) {
        var idx = (v.substr(0, 1) === '{') ? 0 : 10;
        try {
            return eval('(' + v.substr(idx) + ')');
        }
        catch (ex) {
            Inform.log('Syntax error parsing stored "' + n + '" object: ' + ex);
        }
        return undefined;
    }
    return Nsb.Storage.stringValue(v);
}
Nsb.Storage.stringValue = function Nsb_Storage$stringValue(v) {
    /// <param name="v" type="String">
    /// </param>
    /// <returns type="Object"></returns>
    switch (v) {
        case 'true':
            return true;
        case 'false':
            return false;
        case 'null':
            return null;
        case 'undefined':
            return undefined;
    }
    return v;
}


////////////////////////////////////////////////////////////////////////////////
// Transform

Transform = function Transform() {
}
Transform.htmlize = function Transform$htmlize(txt, pass) {
    /// <param name="txt" type="String">
    /// </param>
    /// <param name="pass" type="Boolean">
    /// </param>
    /// <returns type="String"></returns>
    if (pass) {
        return txt;
    }
    var ot = '';
    var c;
    for (var i = 0; i < txt.length; i++) {
        c = txt.substr(i, 1);
        switch (c) {
            case '<':
                ot += '&lt;';
                break;
            case '>':
                ot += '&gt;';
                break;
            case '&':
                ot += '&amp;';
                break;
            case '\n':
                ot += '<br/>';
                break;
            case ' ':
                ot += '&nbsp;';
                break;
            default:
                ot += c;
                break;
        }
    }
    return ot;
}


jQueryUiObject.registerClass('jQueryUiObject');
DomElement.registerClass('DomElement');
Cluster.registerClass('Cluster', DomElement);
Actor.registerClass('Actor', Cluster);
Ask.registerClass('Ask', Actor);
Nsb.Classes.BoxEdit.registerClass('Nsb.Classes.BoxEdit', Actor);
Css.registerClass('Css');
Nsb.Classes.Color.registerClass('Nsb.Classes.Color');
DropTarget.registerClass('DropTarget');
Nsb.Classes.Evo.registerClass('Nsb.Classes.Evo');
Helpers.registerClass('Helpers');
Keys.registerClass('Keys');
Nsb.Classes.Text.registerClass('Nsb.Classes.Text');
Undo.registerClass('Undo');
Uri.registerClass('Uri');
DDict.registerClass('DDict');
DList.registerClass('DList');
EditHtml.registerClass('EditHtml', Actor);
Exceptions.registerClass('Exceptions');
FileBlobBase.registerClass('FileBlobBase');
PkgResult.registerClass('PkgResult');
StoreParams.registerClass('StoreParams');
DirMap.registerClass('DirMap');
Formulas.registerClass('Formulas');
PkgBase.registerClass('PkgBase', FileBlobBase);
CloudMail.registerClass('CloudMail');
Nsb.Classes.SendMailData.registerClass('Nsb.Classes.SendMailData');
Rx.registerClass('Rx');
Strings.registerClass('Strings');
TestInstance.registerClass('TestInstance');
TrueForm.registerClass('TrueForm');
Nsb.Classes.Truple.registerClass('Nsb.Classes.Truple', Actor);
Constants.registerClass('Constants');
Nsb.Classes.TargetEvent.registerClass('Nsb.Classes.TargetEvent');
Inform.registerClass('Inform');
WaitTarget.registerClass('WaitTarget');
Await.registerClass('Await');
AwaitTimers.registerClass('AwaitTimers');
PopMenu.registerClass('PopMenu', Actor);
DropMenu.registerClass('DropMenu');
ThemeBase.registerClass('ThemeBase');
DynamicCss.registerClass('DynamicCss');
Nsb.Encoder.registerClass('Nsb.Encoder');
Nsb.Storage.registerClass('Nsb.Storage');
Transform.registerClass('Transform');
Ask.FadeSpeed = 250;
(function () {
    DomElement.addStyle('\r\n.BoxEdit {\r\n    position: absolute;\r\n    border: none;\r\n}\r\n\r\n.BoxEditTa {\r\n    width: 100%;\r\n    height: 100%;\r\n    border: none;\r\n    padding: 1px 2px;\r\n    margin: 0;\r\n}\r\n');
})();
Css.white = 'rgba(255, 255, 255, 1)';
Css.black = 'rgba(0, 0, 0, 1)';
Nsb.Classes.Evo.storeBlobAw = 'StoreBlobAw';
Nsb.Classes.Evo._evoEvents = {};
Nsb.Classes.Evo.data = {};
Nsb.Classes.Evo.noEvoWarnings = false;
(function () {
    Nsb.Classes.Evo.bind('StoreBlobAw', new Nsb.Classes.Evo().fn(FileBlobBase.storeBlobStringAw));
})();
Keys._arrowCodes = [ 37, 40 ];
Keys._visibleCodes = [ 48, 90, 96, 111, 186, 222 ];
Keys._blackCodes = [ 8, 8, 46, 90, 96, 111, 186, 222 ];
Undo._st = 0;
Undo._at = 0;
Undo._was = 0;
Undo._max = 0;
Undo.bypassUndo = true;
Undo.allowUndo = false;
Uri.queryData = Uri.pairs(window.location.search);
Cluster.truples = {};
Cluster.elements = {};
Cluster.hiderElement = null;
Cluster._hiderCount$1 = 0;
Cluster._spinnerTgB$1 = Cluster._addSpinner$1();
Cluster._spinnerCnt$1 = 0;
EditHtml._autoErDiv$3 = null;
EditHtml._regExLf$3 = new RegExp('\\r?\\n', 'g');
Exceptions.isLoggedTxt = ' (LOGGED=true)';
Exceptions.missingAwaitDoneEr = 'Missing Await Done Callback';
Exceptions.missingDomElement = 'Missing Dom Element';
Exceptions.argumentNull = 'Argument Null';
Exceptions.nullReference = 'Null Reference';
Exceptions.recordNotExists = "Record doesn't exist";
Exceptions.newRecordExists = 'Record already exists';
Exceptions.invalidName = 'Invalid Name';
Exceptions.userCancelled = 'User Cancelled';
Exceptions.blobLoadError = 'Blob Load Error';
Exceptions.blobSaveError = 'Blob Save Error';
Exceptions.serviceLoginFailure = 'Service Login Failure';
Exceptions.fileIsNewer = 'File is newer';
Exceptions.newUser = 'New User';
Exceptions.invalidPageException = 'Invalid Top Level Page';
Exceptions.sendMailError = 'Send Mail Error';
Exceptions.invalidTestCaseName = 'Invalid Test Case Name';
Exceptions.invalidTestSuiteName = 'Invalid Test Suite Name';
Exceptions.invalidDataOperation = 'Invalid Database Operation';
Exceptions.notImplementedExceptionString = 'Not Implimented';
FileBlobBase.retrieveBlobStringAwName = Helpers.methodName('FileBlobBase.retrieveBlobStringAw');
FileBlobBase.outPkgStringAwName = Helpers.methodName('FileBlobBase.outPkgStringAw');
FileBlobBase.password = null;
FileBlobBase.svCnt = 0;
FileBlobBase._modTime = {};
FileBlobBase._xfr = {};
Formulas._idCnt = 0;
Formulas.newIdPrefix = null;
PkgBase.resultRx = 'result';
Rx.hasEndSpace = new RegExp('[^\\s]+\\s+$');
Rx.whiteSpace = new RegExp('\\s+');
Rx.cssFilter = new RegExp('(px|pt|em)$');
Rx.emailFilter = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
Rx.placeholder = '<b>&nbsp;</b>';
Strings.safeFileNameRx = /[^\w\d.-]+/g;
Strings._rxSquish = new RegExp('\\s', 'g');
Strings._allowedTagsRx = /(<\/?(?:b|i|u|em|h[0-9]|p|blockquote|abbr|acronym|address|cite|code|del|dfn|sub|sup|strike|big|small|pre|xmp|strong|ul|ol|li|dl|dt|dd|span(?:\s[^>]*)?|img(?:\s[^>]+))>)|(<)|(>)|(&(?:#[0-9]+|[a-z]+);|&)/gi;
TestInstance.theTest = null;
Nsb.Classes.Truple._tabIndex$3 = 0;
DomElement.resultRx = 'result';
DomElement._efpCheck = false;
DomElement._efpRelative = false;
DomElement._othrFocsCrtd = DomElement._createOtherFocus();
DomElement._idCnt = 0;
DomElement._idTime = new Date().getTime();
DomElement._otherFocusEl = null;
Constants.undefined = undefined;
Constants.upMark = '&#x25C3;';
Constants.downMark = '&#x25BC;';
Constants.leftMark = '&#x25C4;';
Constants.rightMark = '&#x25BA;';
Constants.zeeAnamae = 10;
Constants.zeeControl = 50;
Constants.zeeButton = 55;
Constants.zeeMeta = 100;
Constants.zeeMenu = 1000;
Constants.zeeHider = 9999;
Constants.zeeAlert = 10000;
Inform.tracing = false;
Inform.passExceptions = false;
Inform.logActions = false;
Inform.debugging = false;
Inform._mark = 0;
Await.logActions = false;
Await.passExceptions = false;
Await._scripts = {};
Await._simulatedLatency = (([ '192.168.1.19', 'localhost' ]).contains(window.location.hostname)) ? 600 : 0;
Await.files = {};
AwaitTimers._delayedSpinner = 0;
ThemeBase.isStaticPage = window.location.pathname.indexOf('/pages/') !== -1;
ThemeBase.rootPath = (ThemeBase.isStaticPage) ? '../../' : '../';
ThemeBase.appPath = 'App';
ThemeBase.dbPath = (ThemeBase.isStaticPage) ? Uri.join(ThemeBase.rootPath, ThemeBase.appPath, 'db') : 'db';
ThemeBase.appUri = 'App';
ThemeBase.scriptsUri = 'Scripts';
ThemeBase.mediaUri = 'Scripts/Media';
ThemeBase.mediaImgUri = 'Scripts/Media/Img';
ThemeBase.baseUri = ((ThemeBase.isStaticPage) ? Uri.front(Uri.front(window.location.href)) : Uri.front(window.location.href)) + '/';
ThemeBase.stdUnits = 'px';
ThemeBase.errorLogName = 'errors';
ThemeBase.eventLogName = 'events';
ThemeBase.hearts = '&hearts;';
ThemeBase.clubs = '&clubs;';
ThemeBase.spades = '&spades;';
ThemeBase.diamonds = '&diams;';
ThemeBase.smile = '&#9786;';
ThemeBase.sun = '&#9788;';
ThemeBase.bullit = '&#9679;';
ThemeBase.dragOrder = '\u2263';
ThemeBase.checkMark = '\u2714';
ThemeBase.ballotBox = '\u2610';
ThemeBase.ballotBoxChecked = '\u2611';
ThemeBase.upMark = '\u25b2';
ThemeBase.downMark = '\u25bc';
ThemeBase.leftMark = '\u25c4';
ThemeBase.rightMark = '\u25ba';
ThemeBase.forSure = 'Remove for sure?';
ThemeBase.devPasswordKey = 'DevPassword';
ThemeBase.isCheckedOut = 'Cannot save your changes because someone else has this page checked out. Reload this page to check it out and see their changes.';
ThemeBase.undoKey = 'UndoBuffer';
ThemeBase.godMode = false;
ThemeBase.reloading = false;
ThemeBase.testing = false;
ThemeBase.shiftKey = false;
ThemeBase.dynamicPaging = false;
ThemeBase.publishing = false;
ThemeBase.activePage = false;
ThemeBase.devServer = window.DevServer;
ThemeBase.userId = null;
ThemeBase.email = null;
ThemeBase.pageActionKey = 'PageAction';
ThemeBase.redirectDataKey = 'RedirectData';
ThemeBase.devServerKey = 'DevServer';
})();

//! This script was generated using Script# v0.7.4.0
})(jQuery);
