"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/lunr-languages/lunr.stemmer.support.js
var require_lunr_stemmer_support = __commonJS({
  "node_modules/lunr-languages/lunr.stemmer.support.js"(exports, module2) {
    "use strict";
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define(factory);
      } else if (typeof exports === "object") {
        module2.exports = factory();
      } else {
        factory()(root.lunr);
      }
    })(exports, function() {
      return function(lunr) {
        lunr.stemmerSupport = {
          Among: function(s, substring_i, result, method) {
            this.toCharArray = function(s2) {
              var sLength = s2.length, charArr = new Array(sLength);
              for (var i = 0; i < sLength; i++)
                charArr[i] = s2.charCodeAt(i);
              return charArr;
            };
            if (!s && s != "" || !substring_i && substring_i != 0 || !result)
              throw "Bad Among initialisation: s:" + s + ", substring_i: " + substring_i + ", result: " + result;
            this.s_size = s.length;
            this.s = this.toCharArray(s);
            this.substring_i = substring_i;
            this.result = result;
            this.method = method;
          },
          SnowballProgram: function() {
            var current;
            return {
              bra: 0,
              ket: 0,
              limit: 0,
              cursor: 0,
              limit_backward: 0,
              setCurrent: function(word) {
                current = word;
                this.cursor = 0;
                this.limit = word.length;
                this.limit_backward = 0;
                this.bra = this.cursor;
                this.ket = this.limit;
              },
              getCurrent: function() {
                var result = current;
                current = null;
                return result;
              },
              in_grouping: function(s, min, max) {
                if (this.cursor < this.limit) {
                  var ch = current.charCodeAt(this.cursor);
                  if (ch <= max && ch >= min) {
                    ch -= min;
                    if (s[ch >> 3] & 1 << (ch & 7)) {
                      this.cursor++;
                      return true;
                    }
                  }
                }
                return false;
              },
              in_grouping_b: function(s, min, max) {
                if (this.cursor > this.limit_backward) {
                  var ch = current.charCodeAt(this.cursor - 1);
                  if (ch <= max && ch >= min) {
                    ch -= min;
                    if (s[ch >> 3] & 1 << (ch & 7)) {
                      this.cursor--;
                      return true;
                    }
                  }
                }
                return false;
              },
              out_grouping: function(s, min, max) {
                if (this.cursor < this.limit) {
                  var ch = current.charCodeAt(this.cursor);
                  if (ch > max || ch < min) {
                    this.cursor++;
                    return true;
                  }
                  ch -= min;
                  if (!(s[ch >> 3] & 1 << (ch & 7))) {
                    this.cursor++;
                    return true;
                  }
                }
                return false;
              },
              out_grouping_b: function(s, min, max) {
                if (this.cursor > this.limit_backward) {
                  var ch = current.charCodeAt(this.cursor - 1);
                  if (ch > max || ch < min) {
                    this.cursor--;
                    return true;
                  }
                  ch -= min;
                  if (!(s[ch >> 3] & 1 << (ch & 7))) {
                    this.cursor--;
                    return true;
                  }
                }
                return false;
              },
              eq_s: function(s_size, s) {
                if (this.limit - this.cursor < s_size)
                  return false;
                for (var i = 0; i < s_size; i++)
                  if (current.charCodeAt(this.cursor + i) != s.charCodeAt(i))
                    return false;
                this.cursor += s_size;
                return true;
              },
              eq_s_b: function(s_size, s) {
                if (this.cursor - this.limit_backward < s_size)
                  return false;
                for (var i = 0; i < s_size; i++)
                  if (current.charCodeAt(this.cursor - s_size + i) != s.charCodeAt(i))
                    return false;
                this.cursor -= s_size;
                return true;
              },
              find_among: function(v, v_size) {
                var i = 0, j = v_size, c = this.cursor, l = this.limit, common_i = 0, common_j = 0, first_key_inspected = false;
                while (true) {
                  var k = i + (j - i >> 1), diff = 0, common = common_i < common_j ? common_i : common_j, w = v[k];
                  for (var i2 = common; i2 < w.s_size; i2++) {
                    if (c + common == l) {
                      diff = -1;
                      break;
                    }
                    diff = current.charCodeAt(c + common) - w.s[i2];
                    if (diff)
                      break;
                    common++;
                  }
                  if (diff < 0) {
                    j = k;
                    common_j = common;
                  } else {
                    i = k;
                    common_i = common;
                  }
                  if (j - i <= 1) {
                    if (i > 0 || j == i || first_key_inspected)
                      break;
                    first_key_inspected = true;
                  }
                }
                while (true) {
                  var w = v[i];
                  if (common_i >= w.s_size) {
                    this.cursor = c + w.s_size;
                    if (!w.method)
                      return w.result;
                    var res = w.method();
                    this.cursor = c + w.s_size;
                    if (res)
                      return w.result;
                  }
                  i = w.substring_i;
                  if (i < 0)
                    return 0;
                }
              },
              find_among_b: function(v, v_size) {
                var i = 0, j = v_size, c = this.cursor, lb = this.limit_backward, common_i = 0, common_j = 0, first_key_inspected = false;
                while (true) {
                  var k = i + (j - i >> 1), diff = 0, common = common_i < common_j ? common_i : common_j, w = v[k];
                  for (var i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
                    if (c - common == lb) {
                      diff = -1;
                      break;
                    }
                    diff = current.charCodeAt(c - 1 - common) - w.s[i2];
                    if (diff)
                      break;
                    common++;
                  }
                  if (diff < 0) {
                    j = k;
                    common_j = common;
                  } else {
                    i = k;
                    common_i = common;
                  }
                  if (j - i <= 1) {
                    if (i > 0 || j == i || first_key_inspected)
                      break;
                    first_key_inspected = true;
                  }
                }
                while (true) {
                  var w = v[i];
                  if (common_i >= w.s_size) {
                    this.cursor = c - w.s_size;
                    if (!w.method)
                      return w.result;
                    var res = w.method();
                    this.cursor = c - w.s_size;
                    if (res)
                      return w.result;
                  }
                  i = w.substring_i;
                  if (i < 0)
                    return 0;
                }
              },
              replace_s: function(c_bra, c_ket, s) {
                var adjustment = s.length - (c_ket - c_bra), left = current.substring(0, c_bra), right = current.substring(c_ket);
                current = left + s + right;
                this.limit += adjustment;
                if (this.cursor >= c_ket)
                  this.cursor += adjustment;
                else if (this.cursor > c_bra)
                  this.cursor = c_bra;
                return adjustment;
              },
              slice_check: function() {
                if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit || this.limit > current.length)
                  throw "faulty slice operation";
              },
              slice_from: function(s) {
                this.slice_check();
                this.replace_s(this.bra, this.ket, s);
              },
              slice_del: function() {
                this.slice_from("");
              },
              insert: function(c_bra, c_ket, s) {
                var adjustment = this.replace_s(c_bra, c_ket, s);
                if (c_bra <= this.bra)
                  this.bra += adjustment;
                if (c_bra <= this.ket)
                  this.ket += adjustment;
              },
              slice_to: function() {
                this.slice_check();
                return current.substring(this.bra, this.ket);
              },
              eq_v_b: function(s) {
                return this.eq_s_b(s.length, s);
              }
            };
          }
        };
        lunr.trimmerSupport = {
          generateTrimmer: function(wordCharacters) {
            var startRegex = new RegExp("^[^" + wordCharacters + "]+");
            var endRegex = new RegExp("[^" + wordCharacters + "]+$");
            return function(token) {
              if (typeof token.update === "function") {
                return token.update(function(s) {
                  return s.replace(startRegex, "").replace(endRegex, "");
                });
              } else {
                return token.replace(startRegex, "").replace(endRegex, "");
              }
            };
          }
        };
      };
    });
  }
});

// node_modules/lunr-languages/lunr.multi.js
var require_lunr_multi = __commonJS({
  "node_modules/lunr-languages/lunr.multi.js"(exports, module2) {
    "use strict";
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define(factory);
      } else if (typeof exports === "object") {
        module2.exports = factory();
      } else {
        factory()(root.lunr);
      }
    })(exports, function() {
      return function(lunr) {
        lunr.multiLanguage = function() {
          var languages = Array.prototype.slice.call(arguments);
          var nameSuffix = languages.join("-");
          var wordCharacters = "";
          var pipeline = [];
          var searchPipeline = [];
          for (var i = 0; i < languages.length; ++i) {
            if (languages[i] == "en") {
              wordCharacters += "\\w";
              pipeline.unshift(lunr.stopWordFilter);
              pipeline.push(lunr.stemmer);
              searchPipeline.push(lunr.stemmer);
            } else {
              wordCharacters += lunr[languages[i]].wordCharacters;
              if (lunr[languages[i]].stopWordFilter) {
                pipeline.unshift(lunr[languages[i]].stopWordFilter);
              }
              if (lunr[languages[i]].stemmer) {
                pipeline.push(lunr[languages[i]].stemmer);
                searchPipeline.push(lunr[languages[i]].stemmer);
              }
            }
          }
          ;
          var multiTrimmer = lunr.trimmerSupport.generateTrimmer(wordCharacters);
          lunr.Pipeline.registerFunction(multiTrimmer, "lunr-multi-trimmer-" + nameSuffix);
          pipeline.unshift(multiTrimmer);
          return function() {
            this.pipeline.reset();
            this.pipeline.add.apply(this.pipeline, pipeline);
            if (this.searchPipeline) {
              this.searchPipeline.reset();
              this.searchPipeline.add.apply(this.searchPipeline, searchPipeline);
            }
          };
        };
      };
    });
  }
});

// node_modules/lunr-languages/lunr.hu.js
var require_lunr_hu = __commonJS({
  "node_modules/lunr-languages/lunr.hu.js"(exports, module2) {
    "use strict";
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define(factory);
      } else if (typeof exports === "object") {
        module2.exports = factory();
      } else {
        factory()(root.lunr);
      }
    })(exports, function() {
      return function(lunr) {
        if ("undefined" === typeof lunr) {
          throw new Error("Lunr is not present. Please include / require Lunr before this script.");
        }
        if ("undefined" === typeof lunr.stemmerSupport) {
          throw new Error("Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.");
        }
        lunr.hu = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.hu.trimmer,
            lunr.hu.stopWordFilter,
            lunr.hu.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.hu.stemmer);
          }
        };
        lunr.hu.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
        lunr.hu.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.hu.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.hu.trimmer, "trimmer-hu");
        lunr.hu.stemmer = function() {
          var Among = lunr.stemmerSupport.Among, SnowballProgram = lunr.stemmerSupport.SnowballProgram, st = new function HungarianStemmer() {
            var a_0 = [
              new Among("cs", -1, -1),
              new Among("dzs", -1, -1),
              new Among("gy", -1, -1),
              new Among("ly", -1, -1),
              new Among("ny", -1, -1),
              new Among("sz", -1, -1),
              new Among("ty", -1, -1),
              new Among("zs", -1, -1)
            ], a_1 = [
              new Among("\xE1", -1, 1),
              new Among("\xE9", -1, 2)
            ], a_2 = [
              new Among("bb", -1, -1),
              new Among("cc", -1, -1),
              new Among("dd", -1, -1),
              new Among("ff", -1, -1),
              new Among("gg", -1, -1),
              new Among("jj", -1, -1),
              new Among("kk", -1, -1),
              new Among("ll", -1, -1),
              new Among("mm", -1, -1),
              new Among("nn", -1, -1),
              new Among("pp", -1, -1),
              new Among("rr", -1, -1),
              new Among("ccs", -1, -1),
              new Among("ss", -1, -1),
              new Among("zzs", -1, -1),
              new Among("tt", -1, -1),
              new Among("vv", -1, -1),
              new Among("ggy", -1, -1),
              new Among("lly", -1, -1),
              new Among("nny", -1, -1),
              new Among("tty", -1, -1),
              new Among("ssz", -1, -1),
              new Among("zz", -1, -1)
            ], a_3 = [
              new Among("al", -1, 1),
              new Among("el", -1, 2)
            ], a_4 = [
              new Among("ba", -1, -1),
              new Among("ra", -1, -1),
              new Among("be", -1, -1),
              new Among("re", -1, -1),
              new Among("ig", -1, -1),
              new Among("nak", -1, -1),
              new Among("nek", -1, -1),
              new Among("val", -1, -1),
              new Among("vel", -1, -1),
              new Among("ul", -1, -1),
              new Among("n\xE1l", -1, -1),
              new Among("n\xE9l", -1, -1),
              new Among("b\xF3l", -1, -1),
              new Among("r\xF3l", -1, -1),
              new Among("t\xF3l", -1, -1),
              new Among("b\xF5l", -1, -1),
              new Among("r\xF5l", -1, -1),
              new Among("t\xF5l", -1, -1),
              new Among("\xFCl", -1, -1),
              new Among("n", -1, -1),
              new Among("an", 19, -1),
              new Among("ban", 20, -1),
              new Among("en", 19, -1),
              new Among("ben", 22, -1),
              new Among("k\xE9ppen", 22, -1),
              new Among("on", 19, -1),
              new Among("\xF6n", 19, -1),
              new Among("k\xE9pp", -1, -1),
              new Among("kor", -1, -1),
              new Among("t", -1, -1),
              new Among("at", 29, -1),
              new Among("et", 29, -1),
              new Among("k\xE9nt", 29, -1),
              new Among("ank\xE9nt", 32, -1),
              new Among("enk\xE9nt", 32, -1),
              new Among("onk\xE9nt", 32, -1),
              new Among("ot", 29, -1),
              new Among("\xE9rt", 29, -1),
              new Among("\xF6t", 29, -1),
              new Among("hez", -1, -1),
              new Among("hoz", -1, -1),
              new Among("h\xF6z", -1, -1),
              new Among("v\xE1", -1, -1),
              new Among("v\xE9", -1, -1)
            ], a_5 = [
              new Among("\xE1n", -1, 2),
              new Among("\xE9n", -1, 1),
              new Among("\xE1nk\xE9nt", -1, 3)
            ], a_6 = [
              new Among("stul", -1, 2),
              new Among("astul", 0, 1),
              new Among("\xE1stul", 0, 3),
              new Among("st\xFCl", -1, 2),
              new Among("est\xFCl", 3, 1),
              new Among("\xE9st\xFCl", 3, 4)
            ], a_7 = [
              new Among("\xE1", -1, 1),
              new Among("\xE9", -1, 2)
            ], a_8 = [
              new Among("k", -1, 7),
              new Among("ak", 0, 4),
              new Among("ek", 0, 6),
              new Among("ok", 0, 5),
              new Among("\xE1k", 0, 1),
              new Among("\xE9k", 0, 2),
              new Among("\xF6k", 0, 3)
            ], a_9 = [
              new Among("\xE9i", -1, 7),
              new Among("\xE1\xE9i", 0, 6),
              new Among("\xE9\xE9i", 0, 5),
              new Among("\xE9", -1, 9),
              new Among("k\xE9", 3, 4),
              new Among("ak\xE9", 4, 1),
              new Among("ek\xE9", 4, 1),
              new Among("ok\xE9", 4, 1),
              new Among("\xE1k\xE9", 4, 3),
              new Among("\xE9k\xE9", 4, 2),
              new Among("\xF6k\xE9", 4, 1),
              new Among("\xE9\xE9", 3, 8)
            ], a_10 = [
              new Among("a", -1, 18),
              new Among("ja", 0, 17),
              new Among("d", -1, 16),
              new Among("ad", 2, 13),
              new Among("ed", 2, 13),
              new Among("od", 2, 13),
              new Among("\xE1d", 2, 14),
              new Among("\xE9d", 2, 15),
              new Among("\xF6d", 2, 13),
              new Among("e", -1, 18),
              new Among("je", 9, 17),
              new Among("nk", -1, 4),
              new Among("unk", 11, 1),
              new Among("\xE1nk", 11, 2),
              new Among("\xE9nk", 11, 3),
              new Among("\xFCnk", 11, 1),
              new Among("uk", -1, 8),
              new Among("juk", 16, 7),
              new Among("\xE1juk", 17, 5),
              new Among("\xFCk", -1, 8),
              new Among("j\xFCk", 19, 7),
              new Among("\xE9j\xFCk", 20, 6),
              new Among("m", -1, 12),
              new Among("am", 22, 9),
              new Among("em", 22, 9),
              new Among("om", 22, 9),
              new Among("\xE1m", 22, 10),
              new Among("\xE9m", 22, 11),
              new Among("o", -1, 18),
              new Among("\xE1", -1, 19),
              new Among("\xE9", -1, 20)
            ], a_11 = [
              new Among("id", -1, 10),
              new Among("aid", 0, 9),
              new Among("jaid", 1, 6),
              new Among("eid", 0, 9),
              new Among("jeid", 3, 6),
              new Among("\xE1id", 0, 7),
              new Among("\xE9id", 0, 8),
              new Among("i", -1, 15),
              new Among("ai", 7, 14),
              new Among("jai", 8, 11),
              new Among("ei", 7, 14),
              new Among("jei", 10, 11),
              new Among("\xE1i", 7, 12),
              new Among("\xE9i", 7, 13),
              new Among("itek", -1, 24),
              new Among("eitek", 14, 21),
              new Among("jeitek", 15, 20),
              new Among("\xE9itek", 14, 23),
              new Among("ik", -1, 29),
              new Among("aik", 18, 26),
              new Among("jaik", 19, 25),
              new Among("eik", 18, 26),
              new Among("jeik", 21, 25),
              new Among("\xE1ik", 18, 27),
              new Among("\xE9ik", 18, 28),
              new Among("ink", -1, 20),
              new Among("aink", 25, 17),
              new Among("jaink", 26, 16),
              new Among("eink", 25, 17),
              new Among("jeink", 28, 16),
              new Among("\xE1ink", 25, 18),
              new Among("\xE9ink", 25, 19),
              new Among("aitok", -1, 21),
              new Among("jaitok", 32, 20),
              new Among("\xE1itok", -1, 22),
              new Among("im", -1, 5),
              new Among("aim", 35, 4),
              new Among("jaim", 36, 1),
              new Among("eim", 35, 4),
              new Among("jeim", 38, 1),
              new Among("\xE1im", 35, 2),
              new Among("\xE9im", 35, 3)
            ], g_v = [
              17,
              65,
              16,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              1,
              17,
              52,
              14
            ], I_p1, sbp = new SnowballProgram();
            this.setCurrent = function(word) {
              sbp.setCurrent(word);
            };
            this.getCurrent = function() {
              return sbp.getCurrent();
            };
            function r_mark_regions() {
              var v_1 = sbp.cursor, v_2;
              I_p1 = sbp.limit;
              if (sbp.in_grouping(g_v, 97, 252)) {
                while (true) {
                  v_2 = sbp.cursor;
                  if (sbp.out_grouping(g_v, 97, 252)) {
                    sbp.cursor = v_2;
                    if (!sbp.find_among(a_0, 8)) {
                      sbp.cursor = v_2;
                      if (v_2 < sbp.limit)
                        sbp.cursor++;
                    }
                    I_p1 = sbp.cursor;
                    return;
                  }
                  sbp.cursor = v_2;
                  if (v_2 >= sbp.limit) {
                    I_p1 = v_2;
                    return;
                  }
                  sbp.cursor++;
                }
              }
              sbp.cursor = v_1;
              if (sbp.out_grouping(g_v, 97, 252)) {
                while (!sbp.in_grouping(g_v, 97, 252)) {
                  if (sbp.cursor >= sbp.limit)
                    return;
                  sbp.cursor++;
                }
                I_p1 = sbp.cursor;
              }
            }
            function r_R1() {
              return I_p1 <= sbp.cursor;
            }
            function r_v_ending() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_1, 2);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_from("a");
                      break;
                    case 2:
                      sbp.slice_from("e");
                      break;
                  }
                }
              }
            }
            function r_double() {
              var v_1 = sbp.limit - sbp.cursor;
              if (!sbp.find_among_b(a_2, 23))
                return false;
              sbp.cursor = sbp.limit - v_1;
              return true;
            }
            function r_undouble() {
              if (sbp.cursor > sbp.limit_backward) {
                sbp.cursor--;
                sbp.ket = sbp.cursor;
                var c = sbp.cursor - 1;
                if (sbp.limit_backward <= c && c <= sbp.limit) {
                  sbp.cursor = c;
                  sbp.bra = c;
                  sbp.slice_del();
                }
              }
            }
            function r_instrum() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_3, 2);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  if (among_var == 1 || among_var == 2) {
                    if (!r_double())
                      return;
                  }
                  sbp.slice_del();
                  r_undouble();
                }
              }
            }
            function r_case() {
              sbp.ket = sbp.cursor;
              if (sbp.find_among_b(a_4, 44)) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  sbp.slice_del();
                  r_v_ending();
                }
              }
            }
            function r_case_special() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_5, 3);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_from("e");
                      break;
                    case 2:
                    case 3:
                      sbp.slice_from("a");
                      break;
                  }
                }
              }
            }
            function r_case_other() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_6, 6);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                    case 2:
                      sbp.slice_del();
                      break;
                    case 3:
                      sbp.slice_from("a");
                      break;
                    case 4:
                      sbp.slice_from("e");
                      break;
                  }
                }
              }
            }
            function r_factive() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_7, 2);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  if (among_var == 1 || among_var == 2) {
                    if (!r_double())
                      return;
                  }
                  sbp.slice_del();
                  r_undouble();
                }
              }
            }
            function r_plural() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_8, 7);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_from("a");
                      break;
                    case 2:
                      sbp.slice_from("e");
                      break;
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                      sbp.slice_del();
                      break;
                  }
                }
              }
            }
            function r_owned() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_9, 12);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                    case 4:
                    case 7:
                    case 9:
                      sbp.slice_del();
                      break;
                    case 2:
                    case 5:
                    case 8:
                      sbp.slice_from("e");
                      break;
                    case 3:
                    case 6:
                      sbp.slice_from("a");
                      break;
                  }
                }
              }
            }
            function r_sing_owner() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_10, 31);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                    case 4:
                    case 7:
                    case 8:
                    case 9:
                    case 12:
                    case 13:
                    case 16:
                    case 17:
                    case 18:
                      sbp.slice_del();
                      break;
                    case 2:
                    case 5:
                    case 10:
                    case 14:
                    case 19:
                      sbp.slice_from("a");
                      break;
                    case 3:
                    case 6:
                    case 11:
                    case 15:
                    case 20:
                      sbp.slice_from("e");
                      break;
                  }
                }
              }
            }
            function r_plur_owner() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_11, 42);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                    case 4:
                    case 5:
                    case 6:
                    case 9:
                    case 10:
                    case 11:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 20:
                    case 21:
                    case 24:
                    case 25:
                    case 26:
                    case 29:
                      sbp.slice_del();
                      break;
                    case 2:
                    case 7:
                    case 12:
                    case 18:
                    case 22:
                    case 27:
                      sbp.slice_from("a");
                      break;
                    case 3:
                    case 8:
                    case 13:
                    case 19:
                    case 23:
                    case 28:
                      sbp.slice_from("e");
                      break;
                  }
                }
              }
            }
            this.stem = function() {
              var v_1 = sbp.cursor;
              r_mark_regions();
              sbp.limit_backward = v_1;
              sbp.cursor = sbp.limit;
              r_instrum();
              sbp.cursor = sbp.limit;
              r_case();
              sbp.cursor = sbp.limit;
              r_case_special();
              sbp.cursor = sbp.limit;
              r_case_other();
              sbp.cursor = sbp.limit;
              r_factive();
              sbp.cursor = sbp.limit;
              r_owned();
              sbp.cursor = sbp.limit;
              r_sing_owner();
              sbp.cursor = sbp.limit;
              r_plur_owner();
              sbp.cursor = sbp.limit;
              r_plural();
              return true;
            };
          }();
          return function(token) {
            if (typeof token.update === "function") {
              return token.update(function(word) {
                st.setCurrent(word);
                st.stem();
                return st.getCurrent();
              });
            } else {
              st.setCurrent(token);
              st.stem();
              return st.getCurrent();
            }
          };
        }();
        lunr.Pipeline.registerFunction(lunr.hu.stemmer, "stemmer-hu");
        lunr.hu.stopWordFilter = lunr.generateStopWordFilter("a abban ahhoz ahogy ahol aki akik akkor alatt amely amelyek amelyekben amelyeket amelyet amelynek ami amikor amit amolyan am\xEDg annak arra arr\xF3l az azok azon azonban azt azt\xE1n azut\xE1n azzal az\xE9rt be bel\xFCl benne b\xE1r cikk cikkek cikkeket csak de e ebben eddig egy egyes egyetlen egyik egyre egy\xE9b eg\xE9sz ehhez ekkor el ellen els\xF5 el\xE9g el\xF5 el\xF5sz\xF6r el\xF5tt emilyen ennek erre ez ezek ezen ezt ezzel ez\xE9rt fel fel\xE9 hanem hiszen hogy hogyan igen ill ill. illetve ilyen ilyenkor ism\xE9t ison itt jobban j\xF3 j\xF3l kell kellett keress\xFCnk kereszt\xFCl ki k\xEDv\xFCl k\xF6z\xF6tt k\xF6z\xFCl legal\xE1bb legyen lehet lehetett lenne lenni lesz lett maga mag\xE1t majd majd meg mellett mely melyek mert mi mikor milyen minden mindenki mindent mindig mint mintha mit mivel mi\xE9rt most m\xE1r m\xE1s m\xE1sik m\xE9g m\xEDg nagy nagyobb nagyon ne nekem neki nem nincs n\xE9ha n\xE9h\xE1ny n\xE9lk\xFCl olyan ott pedig persze r\xE1 s saj\xE1t sem semmi sok sokat sokkal szemben szerint szinte sz\xE1m\xE1ra tal\xE1n teh\xE1t teljes tov\xE1bb tov\xE1bb\xE1 t\xF6bb ugyanis utols\xF3 ut\xE1n ut\xE1na vagy vagyis vagyok valaki valami valamint val\xF3 van vannak vele vissza viszont volna volt voltak voltam voltunk \xE1ltal \xE1ltal\xE1ban \xE1t \xE9n \xE9ppen \xE9s \xEDgy \xF5 \xF5k \xF5ket \xF6ssze \xFAgy \xFAj \xFAjabb \xFAjra".split(" "));
        lunr.Pipeline.registerFunction(lunr.hu.stopWordFilter, "stopWordFilter-hu");
      };
    });
  }
});

// src/worker/langs/hu.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_hu());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "hu");
  return lunr.hu;
};
/*! Bundled license information:

lunr-languages/lunr.stemmer.support.js:
  (*!
   * Snowball JavaScript Library v0.3
   * http://code.google.com/p/urim/
   * http://snowball.tartarus.org/
   *
   * Copyright 2010, Oleg Mazko
   * http://www.mozilla.org/MPL/
   *)

lunr-languages/lunr.hu.js:
  (*!
   * Lunr languages, `Hungarian` language
   * https://github.com/MihaiValentin/lunr-languages
   *
   * Copyright 2014, Mihai Valentin
   * http://www.mozilla.org/MPL/
   *)
  (*!
   * based on
   * Snowball JavaScript Library v0.3
   * http://code.google.com/p/urim/
   * http://snowball.tartarus.org/
   *
   * Copyright 2010, Oleg Mazko
   * http://www.mozilla.org/MPL/
   *)
*/
