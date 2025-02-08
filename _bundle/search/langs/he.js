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

// node_modules/lunr-languages/lunr.he.js
var require_lunr_he = __commonJS({
  "node_modules/lunr-languages/lunr.he.js"(exports, module2) {
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
        lunr.he = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.he.trimmer,
            lunr.he.stopWordFilter,
            lunr.he.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.he.stemmer);
          }
        };
        lunr.he.wordCharacters = "\u0590-\u05FF\u05D0-\u05EAa-zA-Z\uFF41-\uFF5A\uFF21-\uFF3A0-9\uFF10-\uFF19";
        lunr.he.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.he.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.he.trimmer, "trimmer-he");
        lunr.he.stemmer = function() {
          var self2 = this;
          var word = "";
          self2.result = false;
          self2.execArray = [
            "cleanWord"
          ];
          self2.stem = function() {
            var counter = 0;
            self2.result = false;
            while (counter < self2.execArray.length && self2.result != true) {
              self2.result = self2[self2.execArray[counter]]();
              counter++;
            }
          };
          self2.setCurrent = function(word2) {
            self2.word = word2;
          };
          self2.getCurrent = function() {
            return self2.word;
          };
          self2.cleanWord = function() {
            var wordCharacters = "\u0591-\u05F4\u05D0-\u05EA";
            var testRegex = new RegExp("[^" + wordCharacters + "]");
            if (testRegex.test(word)) {
              return true;
            }
            return false;
          };
          return function(token) {
            if (typeof token.update === "function") {
              return token.update(function(word2) {
                self2.setCurrent(word2);
                self2.stem();
                return self2.getCurrent();
              });
            } else {
              self2.setCurrent(token);
              self2.stem();
              return self2.getCurrent();
            }
          };
        }();
        lunr.Pipeline.registerFunction(lunr.he.stemmer, "stemmer-he");
        lunr.he.stopWordFilter = lunr.generateStopWordFilter("\u05D0\u05D1\u05DC \u05D0\u05D5 \u05D0\u05D5\u05DC\u05D9 \u05D0\u05D5\u05EA\u05D5 \u05D0\u05D5\u05EA\u05D9 \u05D0\u05D5\u05EA\u05DA \u05D0\u05D5\u05EA\u05DD \u05D0\u05D5\u05EA\u05DF \u05D0\u05D5\u05EA\u05E0\u05D5 \u05D0\u05D6 \u05D0\u05D7\u05E8 \u05D0\u05D7\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D9 \u05D0\u05D7\u05E8\u05D9\u05DB\u05DF \u05D0\u05D7\u05E8\u05D9\u05DD \u05D0\u05D7\u05E8\u05EA \u05D0\u05D9 \u05D0\u05D9\u05D6\u05D4 \u05D0\u05D9\u05DA \u05D0\u05D9\u05DF \u05D0\u05D9\u05E4\u05D4 \u05D0\u05DC \u05D0\u05DC\u05D4 \u05D0\u05DC\u05D5 \u05D0\u05DD \u05D0\u05E0\u05D7\u05E0\u05D5 \u05D0\u05E0\u05D9 \u05D0\u05E3 \u05D0\u05E4\u05E9\u05E8 \u05D0\u05EA \u05D0\u05EA\u05D4 \u05D0\u05EA\u05DB\u05DD \u05D0\u05EA\u05DB\u05DF \u05D0\u05EA\u05DD \u05D0\u05EA\u05DF \u05D1\u05D0\u05D9\u05D6\u05D4 \u05D1\u05D0\u05D9\u05D6\u05D5 \u05D1\u05D2\u05DC\u05DC \u05D1\u05D9\u05DF \u05D1\u05DC\u05D1\u05D3 \u05D1\u05E2\u05D1\u05D5\u05E8 \u05D1\u05E2\u05D6\u05E8\u05EA \u05D1\u05DB\u05DC \u05D1\u05DB\u05DF \u05D1\u05DC\u05D9 \u05D1\u05DE\u05D9\u05D3\u05D4 \u05D1\u05DE\u05E7\u05D5\u05DD \u05E9\u05D1\u05D5 \u05D1\u05E8\u05D5\u05D1 \u05D1\u05E9\u05D1\u05D9\u05DC \u05D1\u05E9\u05E2\u05D4 \u05E9 \u05D1\u05EA\u05D5\u05DA \u05D2\u05DD \u05D3\u05E8\u05DA \u05D4\u05D5\u05D0 \u05D4\u05D9\u05D0 \u05D4\u05D9\u05D4 \u05D4\u05D9\u05D9 \u05D4\u05D9\u05DB\u05DF \u05D4\u05D9\u05EA\u05D4 \u05D4\u05D9\u05EA\u05D9 \u05D4\u05DD \u05D4\u05DF \u05D4\u05E0\u05D4 \u05D4\u05E1\u05D9\u05D1\u05D4 \u05E9\u05D1\u05D2\u05DC\u05DC\u05D4 \u05D4\u05E8\u05D9 \u05D5\u05D0\u05D9\u05DC\u05D5 \u05D5\u05D0\u05EA \u05D6\u05D0\u05EA \u05D6\u05D4 \u05D6\u05D5\u05EA \u05D9\u05D4\u05D9\u05D4 \u05D9\u05D5\u05DB\u05DC \u05D9\u05D5\u05DB\u05DC\u05D5 \u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05D9\u05DB\u05D5\u05DC \u05D9\u05DB\u05D5\u05DC\u05D4 \u05D9\u05DB\u05D5\u05DC\u05D5\u05EA \u05D9\u05DB\u05D5\u05DC\u05D9\u05DD \u05D9\u05DB\u05DC \u05D9\u05DB\u05DC\u05D4 \u05D9\u05DB\u05DC\u05D5 \u05D9\u05E9 \u05DB\u05D0\u05DF \u05DB\u05D0\u05E9\u05E8 \u05DB\u05D5\u05DC\u05DD \u05DB\u05D5\u05DC\u05DF \u05DB\u05D6\u05D4 \u05DB\u05D9 \u05DB\u05D9\u05E6\u05D3 \u05DB\u05DA \u05DB\u05DC \u05DB\u05DC\u05DC \u05DB\u05DE\u05D5 \u05DB\u05DF \u05DB\u05E4\u05D9 \u05DB\u05E9 \u05DC\u05D0 \u05DC\u05D0\u05D5 \u05DC\u05D0\u05D9\u05D6\u05D5\u05EA\u05DA \u05DC\u05D0\u05DF \u05DC\u05D1\u05D9\u05DF \u05DC\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DC\u05D4\u05DD \u05DC\u05D4\u05DF \u05DC\u05D5 \u05DC\u05D6\u05D4 \u05DC\u05D6\u05D5\u05EA \u05DC\u05D9 \u05DC\u05DA \u05DC\u05DB\u05DD \u05DC\u05DB\u05DF \u05DC\u05DE\u05D4 \u05DC\u05DE\u05E2\u05DC\u05D4 \u05DC\u05DE\u05E2\u05DC\u05D4 \u05DE \u05DC\u05DE\u05D8\u05D4 \u05DC\u05DE\u05D8\u05D4 \u05DE \u05DC\u05DE\u05E2\u05D8 \u05DC\u05DE\u05E7\u05D5\u05DD \u05E9\u05D1\u05D5 \u05DC\u05DE\u05E8\u05D5\u05EA \u05DC\u05E0\u05D5 \u05DC\u05E2\u05D1\u05E8 \u05DC\u05E2\u05D9\u05DB\u05DF \u05DC\u05E4\u05D9\u05DB\u05DA \u05DC\u05E4\u05E0\u05D9 \u05DE\u05D0\u05D3 \u05DE\u05D0\u05D7\u05D5\u05E8\u05D9 \u05DE\u05D0\u05D9\u05D6\u05D5 \u05E1\u05D9\u05D1\u05D4 \u05DE\u05D0\u05D9\u05DF \u05DE\u05D0\u05D9\u05E4\u05D4 \u05DE\u05D1\u05DC\u05D9 \u05DE\u05D1\u05E2\u05D3 \u05DE\u05D3\u05D5\u05E2 \u05DE\u05D4 \u05DE\u05D4\u05D9\u05DB\u05DF \u05DE\u05D5\u05DC \u05DE\u05D7\u05D5\u05E5 \u05DE\u05D9 \u05DE\u05D9\u05D3\u05E2 \u05DE\u05DB\u05D0\u05DF \u05DE\u05DB\u05DC \u05DE\u05DB\u05DF \u05DE\u05DC\u05D1\u05D3 \u05DE\u05DF \u05DE\u05E0\u05D9\u05DF \u05DE\u05E1\u05D5\u05D2\u05DC \u05DE\u05E2\u05D8 \u05DE\u05E2\u05D8\u05D9\u05DD \u05DE\u05E2\u05DC \u05DE\u05E6\u05D3 \u05DE\u05E7\u05D5\u05DD \u05D1\u05D5 \u05DE\u05EA\u05D7\u05EA \u05DE\u05EA\u05D9 \u05E0\u05D2\u05D3 \u05E0\u05D2\u05E8 \u05E0\u05D5 \u05E2\u05D3 \u05E2\u05D6 \u05E2\u05DC \u05E2\u05DC\u05D9 \u05E2\u05DC\u05D9\u05D5 \u05E2\u05DC\u05D9\u05D4 \u05E2\u05DC\u05D9\u05D4\u05DD \u05E2\u05DC\u05D9\u05DA \u05E2\u05DC\u05D9\u05E0\u05D5 \u05E2\u05DD \u05E2\u05E6\u05DE\u05D4 \u05E2\u05E6\u05DE\u05D4\u05DD \u05E2\u05E6\u05DE\u05D4\u05DF \u05E2\u05E6\u05DE\u05D5 \u05E2\u05E6\u05DE\u05D9 \u05E2\u05E6\u05DE\u05DD \u05E2\u05E6\u05DE\u05DF \u05E2\u05E6\u05DE\u05E0\u05D5 \u05E4\u05D4 \u05E8\u05E7 \u05E9\u05D5\u05D1 \u05E9\u05DC \u05E9\u05DC\u05D4 \u05E9\u05DC\u05D4\u05DD \u05E9\u05DC\u05D4\u05DF \u05E9\u05DC\u05D5 \u05E9\u05DC\u05D9 \u05E9\u05DC\u05DA \u05E9\u05DC\u05DB\u05D4 \u05E9\u05DC\u05DB\u05DD \u05E9\u05DC\u05DB\u05DF \u05E9\u05DC\u05E0\u05D5 \u05E9\u05DD \u05EA\u05D4\u05D9\u05D4 \u05EA\u05D7\u05EA".split(" "));
        lunr.Pipeline.registerFunction(lunr.he.stopWordFilter, "stopWordFilter-he");
      };
    });
  }
});

// src/worker/langs/he.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_he());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "he");
  return lunr.he;
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

lunr-languages/lunr.he.js:
  (*!
   * Lunr languages, `Hebrew` language
   * https://github.com/avisaradir/lunr-languages-he
   *
   * Copyright 2023, Adir Avisar
   * http://www.mozilla.org/MPL/
   *)
  (*!
   * based on
   * Kazem Taghva, Rania Elkhoury, and Jeffrey Coombs (2005)
   * Meryeme Hadni, Abdelmonaime Lachkar, and S. Alaoui Ouatik (2012)
   *
   * Snowball JavaScript Library v0.3
   * http://code.google.com/p/urim/
   * http://snowball.tartarus.org/
   *
   * Copyright 2010, Oleg Mazko
   * http://www.mozilla.org/MPL/
   *)
*/
