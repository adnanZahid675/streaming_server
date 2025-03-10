var K256 = new Array(
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
);
var ihash, count, buffer;
var sha256_hex_digits = "0123456789abcdef";

var Base64 = {
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  encode: function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = Base64._utf8_encode(input);
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output =
        output +
        this._keyStr.charAt(enc1) +
        this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) +
        this._keyStr.charAt(enc4);
    }
    return output;
  },
  decode: function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 != 64) output = output + String.fromCharCode(chr2);
      if (enc4 != 64) output = output + String.fromCharCode(chr3);
    }
    output = Base64._utf8_decode(output);
    return output;
  },
  _utf8_encode: function (string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  },
  _utf8_decode: function (utftext) {
    var string = "";
    var i = 0;
    var c = (c1 = c2 = 0);
    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        i += 3;
      }
    }
    return string;
  },
};

/**
 * Generates security date.
 * @returns {Array} [dateBase64, dateTime]
 */
function securityDate() {
  var c = new Date();
  var h = c.getFullYear();
  var g = c.getMonth() + 1;
  g = g < 10 ? "0" + g : g;
  var i = c.getDate();
  i = i < 10 ? "0" + i : i;
  var j = c.getHours();
  j = j < 10 ? "0" + j : j;
  var d = c.getMinutes();
  d = d < 10 ? "0" + d : d;
  var a = c.getSeconds();
  a = a < 10 ? "0" + a : a;
  var f = h + "-" + g + "-" + i + "T" + j + ":" + d + ":" + a;
  var b = Base64.encode(f);
  var e = [b, f];
  return e;
}

/**
 * SHA-256 hash function (Security Step 1)
 */
function security2561(e, b, f, a) {
  var d = e + b + f + a;
  var c = sha256_digest(d);
  return c;
}

/**
 * Secondary Hashing (Security Step 2)
 */
function security2(hashedPassword, challenge) {
  const tempStr = hexCharCodeToStr(hashedPassword) + challenge;
  return sha256_digest(tempStr);
}

function hexCharCodeToStr(b) {
  var e = b.trim();
  var f = e.substr(0, 2).toLowerCase() === "0x" ? e.substr(2) : e;
  var a = f.length;
  if (a % 2 !== 0) {
    alert("存在非法字符!");
    return "";
  }
  var g;
  var d = [];
  for (var c = 0; c < a; c = c + 2) {
    g = parseInt(f.substr(c, 2), 16);
    d.push(String.fromCharCode(g));
  }
  return d.join("");
}

/**
 * Iterative Hashing (Security Step 3)
 */
function security3(iterations, hashedValue) {
  let finalHash = hashedValue;
  for (let i = 0; i < iterations; i++) {
    finalHash = sha256_digest(finalHash);
  }
  return finalHash;
}

function rotateRight(b, a) {
  return (a >>> b) | (a << (32 - b));
}
function choice(a, c, b) {
  return (a & c) ^ (~a & b);
}
function majority(a, c, b) {
  return (a & c) ^ (a & b) ^ (c & b);
}
function sha256_Sigma0(a) {
  return rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
}
function sha256_Sigma1(a) {
  return rotateRight(6, a) ^ rotateRight(11, a) ^ rotateRight(25, a);
}
function sha256_sigma0(a) {
  return rotateRight(7, a) ^ rotateRight(18, a) ^ (a >>> 3);
}
function sha256_sigma1(a) {
  return rotateRight(17, a) ^ rotateRight(19, a) ^ (a >>> 10);
}
function sha256_expand(a, b) {
  return (a[b & 15] +=
    sha256_sigma1(a[(b + 14) & 15]) +
    a[(b + 9) & 15] +
    sha256_sigma0(a[(b + 1) & 15]));
}

function safe_add(a, d) {
  var c = (a & 65535) + (d & 65535);
  var b = (a >> 16) + (d >> 16) + (c >> 16);
  return (b << 16) | (c & 65535);
}
function sha256_init() {
  ihash = new Array(8);
  count = new Array(2);
  buffer = new Array(64);
  count[0] = count[1] = 0;
  ihash[0] = 1779033703;
  ihash[1] = 3144134277;
  ihash[2] = 1013904242;
  ihash[3] = 2773480762;
  ihash[4] = 1359893119;
  ihash[5] = 2600822924;
  ihash[6] = 528734635;
  ihash[7] = 1541459225;
}
function sha256_transform() {
  var w, v, u, t, r, p, o, n, s, q;
  var k = new Array(16);
  w = ihash[0];
  v = ihash[1];
  u = ihash[2];
  t = ihash[3];
  r = ihash[4];
  p = ihash[5];
  o = ihash[6];
  n = ihash[7];
  for (var m = 0; m < 16; m++) {
    k[m] =
      buffer[(m << 2) + 3] |
      (buffer[(m << 2) + 2] << 8) |
      (buffer[(m << 2) + 1] << 16) |
      (buffer[m << 2] << 24);
  }
  for (var l = 0; l < 64; l++) {
    s = n + sha256_Sigma1(r) + choice(r, p, o) + K256[l];
    if (l < 16) {
      s += k[l];
    } else {
      s += sha256_expand(k, l);
    }
    q = sha256_Sigma0(w) + majority(w, v, u);
    n = o;
    o = p;
    p = r;
    r = safe_add(t, s);
    t = u;
    u = v;
    v = w;
    w = safe_add(s, q);
  }
  ihash[0] += w;
  ihash[1] += v;
  ihash[2] += u;
  ihash[3] += t;
  ihash[4] += r;
  ihash[5] += p;
  ihash[6] += o;
  ihash[7] += n;
}
function sha256_update(f, d) {
  var c,
    b,
    g = 0;
  b = (count[0] >> 3) & 63;
  var e = d & 63;
  if ((count[0] += d << 3) < d << 3) {
    count[1]++;
  }
  count[1] += d >> 29;
  for (c = 0; c + 63 < d; c += 64) {
    for (var a = b; a < 64; a++) {
      buffer[a] = f.charCodeAt(g++);
    }
    sha256_transform();
    b = 0;
  }
  for (var a = 0; a < e; a++) {
    buffer[a] = f.charCodeAt(g++);
  }
}
function sha256_final() {
  var a = (count[0] >> 3) & 63;
  buffer[a++] = 128;
  if (a <= 56) {
    for (var b = a; b < 56; b++) {
      buffer[b] = 0;
    }
  } else {
    for (var b = a; b < 64; b++) {
      buffer[b] = 0;
    }
    sha256_transform();
    for (var b = 0; b < 56; b++) {
      buffer[b] = 0;
    }
  }
  buffer[56] = (count[1] >>> 24) & 255;
  buffer[57] = (count[1] >>> 16) & 255;
  buffer[58] = (count[1] >>> 8) & 255;
  buffer[59] = count[1] & 255;
  buffer[60] = (count[0] >>> 24) & 255;
  buffer[61] = (count[0] >>> 16) & 255;
  buffer[62] = (count[0] >>> 8) & 255;
  buffer[63] = count[0] & 255;
  sha256_transform();
}
function sha256_encode_bytes() {
  var b = 0;
  var a = new Array(32);
  for (var c = 0; c < 8; c++) {
    a[b++] = (ihash[c] >>> 24) & 255;
    a[b++] = (ihash[c] >>> 16) & 255;
    a[b++] = (ihash[c] >>> 8) & 255;
    a[b++] = ihash[c] & 255;
  }
  return a;
}
function sha256_encode_hex() {
  var a = new String();
  for (var c = 0; c < 8; c++) {
    for (var b = 28; b >= 0; b -= 4) {
      a += sha256_hex_digits.charAt((ihash[c] >>> b) & 15);
    }
  }
  return a;
}
function sha256_digest(a) {
  sha256_init();
  sha256_update(a, a.length);
  sha256_final();
  return sha256_encode_hex();
}

// Export functions
module.exports = {
  securityDate,
  security2561,
  security2,
  security3,
};
