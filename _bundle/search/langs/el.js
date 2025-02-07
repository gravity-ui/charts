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

// node_modules/lunr-languages/lunr.el.js
var require_lunr_el = __commonJS({
  "node_modules/lunr-languages/lunr.el.js"(exports, module2) {
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
        lunr.el = function() {
          this.pipeline.reset();
          if (this.searchPipeline === void 0) {
            this.pipeline.add(
              lunr.el.trimmer,
              lunr.el.normilizer
            );
          }
          this.pipeline.add(
            lunr.el.stopWordFilter,
            lunr.el.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(
              lunr.el.stemmer
            );
          }
        };
        lunr.el.wordCharacters = "A-Za-z\u0391\u03B1\u0392\u03B2\u0393\u03B3\u0394\u03B4\u0395\u03B5\u0396\u03B6\u0397\u03B7\u0398\u03B8\u0399\u03B9\u039A\u03BA\u039B\u03BB\u039C\u03BC\u039D\u03BD\u039E\u03BE\u039F\u03BF\u03A0\u03C0\u03A1\u03C1\u03A3\u03C3\u03C2\u03A4\u03C4\u03A5\u03C5\u03A6\u03C6\u03A7\u03C7\u03A8\u03C8\u03A9\u03C9\u0386\u03AC\u0388\u03AD\u0389\u03AE\u038A\u03AF\u038C\u03CC\u038E\u03CD\u038F\u03CE\u03AA\u0390\u03AB\u03B0\u0390\u03B0";
        lunr.el.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.el.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.el.trimmer, "trimmer-el");
        lunr.el.stemmer = function() {
          var stepOneExceptions = {
            "\u03A6\u0391\u0393\u0399\u0391": "\u03A6\u0391",
            "\u03A6\u0391\u0393\u0399\u039F\u03A5": "\u03A6\u0391",
            "\u03A6\u0391\u0393\u0399\u03A9\u039D": "\u03A6\u0391",
            "\u03A3\u039A\u0391\u0393\u0399\u0391": "\u03A3\u039A\u0391",
            "\u03A3\u039A\u0391\u0393\u0399\u039F\u03A5": "\u03A3\u039A\u0391",
            "\u03A3\u039A\u0391\u0393\u0399\u03A9\u039D": "\u03A3\u039A\u0391",
            "\u03A3\u039F\u0393\u0399\u039F\u03A5": "\u03A3\u039F",
            "\u03A3\u039F\u0393\u0399\u0391": "\u03A3\u039F",
            "\u03A3\u039F\u0393\u0399\u03A9\u039D": "\u03A3\u039F",
            "\u03A4\u0391\u03A4\u039F\u0393\u0399\u0391": "\u03A4\u0391\u03A4\u039F",
            "\u03A4\u0391\u03A4\u039F\u0393\u0399\u039F\u03A5": "\u03A4\u0391\u03A4\u039F",
            "\u03A4\u0391\u03A4\u039F\u0393\u0399\u03A9\u039D": "\u03A4\u0391\u03A4\u039F",
            "\u039A\u03A1\u0395\u0391\u03A3": "\u039A\u03A1\u0395",
            "\u039A\u03A1\u0395\u0391\u03A4\u039F\u03A3": "\u039A\u03A1\u0395",
            "\u039A\u03A1\u0395\u0391\u03A4\u0391": "\u039A\u03A1\u0395",
            "\u039A\u03A1\u0395\u0391\u03A4\u03A9\u039D": "\u039A\u03A1\u0395",
            "\u03A0\u0395\u03A1\u0391\u03A3": "\u03A0\u0395\u03A1",
            "\u03A0\u0395\u03A1\u0391\u03A4\u039F\u03A3": "\u03A0\u0395\u03A1",
            "\u03A0\u0395\u03A1\u0391\u03A4\u0391": "\u03A0\u0395\u03A1",
            "\u03A0\u0395\u03A1\u0391\u03A4\u03A9\u039D": "\u03A0\u0395\u03A1",
            "\u03A4\u0395\u03A1\u0391\u03A3": "\u03A4\u0395\u03A1",
            "\u03A4\u0395\u03A1\u0391\u03A4\u039F\u03A3": "\u03A4\u0395\u03A1",
            "\u03A4\u0395\u03A1\u0391\u03A4\u0391": "\u03A4\u0395\u03A1",
            "\u03A4\u0395\u03A1\u0391\u03A4\u03A9\u039D": "\u03A4\u0395\u03A1",
            "\u03A6\u03A9\u03A3": "\u03A6\u03A9",
            "\u03A6\u03A9\u03A4\u039F\u03A3": "\u03A6\u03A9",
            "\u03A6\u03A9\u03A4\u0391": "\u03A6\u03A9",
            "\u03A6\u03A9\u03A4\u03A9\u039D": "\u03A6\u03A9",
            "\u039A\u0391\u0398\u0395\u03A3\u03A4\u03A9\u03A3": "\u039A\u0391\u0398\u0395\u03A3\u03A4",
            "\u039A\u0391\u0398\u0395\u03A3\u03A4\u03A9\u03A4\u039F\u03A3": "\u039A\u0391\u0398\u0395\u03A3\u03A4",
            "\u039A\u0391\u0398\u0395\u03A3\u03A4\u03A9\u03A4\u0391": "\u039A\u0391\u0398\u0395\u03A3\u03A4",
            "\u039A\u0391\u0398\u0395\u03A3\u03A4\u03A9\u03A4\u03A9\u039D": "\u039A\u0391\u0398\u0395\u03A3\u03A4",
            "\u0393\u0395\u0393\u039F\u039D\u039F\u03A3": "\u0393\u0395\u0393\u039F\u039D",
            "\u0393\u0395\u0393\u039F\u039D\u039F\u03A4\u039F\u03A3": "\u0393\u0395\u0393\u039F\u039D",
            "\u0393\u0395\u0393\u039F\u039D\u039F\u03A4\u0391": "\u0393\u0395\u0393\u039F\u039D",
            "\u0393\u0395\u0393\u039F\u039D\u039F\u03A4\u03A9\u039D": "\u0393\u0395\u0393\u039F\u039D",
            "\u0395\u03A5\u0391": "\u0395\u03A5"
          };
          var protectedWords = [
            "\u0391\u039A\u03A1\u0399\u0392\u03A9\u03A3",
            "\u0391\u039B\u0391",
            "\u0391\u039B\u039B\u0391",
            "\u0391\u039B\u039B\u0399\u03A9\u03A3",
            "\u0391\u039B\u039B\u039F\u03A4\u0395",
            "\u0391\u039C\u0391",
            "\u0391\u039D\u03A9",
            "\u0391\u039D\u0391",
            "\u0391\u039D\u0391\u039C\u0395\u03A3\u0391",
            "\u0391\u039D\u0391\u039C\u0395\u03A4\u0391\u039E\u03A5",
            "\u0391\u039D\u0395\u03A5",
            "\u0391\u039D\u03A4\u0399",
            "\u0391\u039D\u03A4\u0399\u03A0\u0395\u03A1\u0391",
            "\u0391\u039D\u03A4\u0399\u039F",
            "\u0391\u039E\u0391\u03A6\u039D\u0391",
            "\u0391\u03A0\u039F",
            "\u0391\u03A0\u039F\u03A8\u0395",
            "\u0391\u03A1\u0391",
            "\u0391\u03A1\u0391\u0393\u0395",
            "\u0391\u03A5\u03A1\u0399\u039F",
            "\u0391\u03A6\u039F\u0399",
            "\u0391\u03A6\u039F\u03A5",
            "\u0391\u03A6\u039F\u03A4\u039F\u03A5",
            "\u0392\u03A1\u0395",
            "\u0393\u0395\u0399\u0391",
            "\u0393\u0399\u0391",
            "\u0393\u0399\u0391\u03A4\u0399",
            "\u0393\u03A1\u0391\u039C\u039C\u0391",
            "\u0394\u0395\u0397",
            "\u0394\u0395\u039D",
            "\u0394\u0397\u039B\u0391\u0394\u0397",
            "\u0394\u0399\u03A7\u03A9\u03A3",
            "\u0394\u03A5\u039F",
            "\u0395\u0391\u039D",
            "\u0395\u0393\u03A9",
            "\u0395\u0394\u03A9",
            "\u0395\u0394\u0391",
            "\u0395\u0399\u0398\u0395",
            "\u0395\u0399\u039C\u0391\u0399",
            "\u0395\u0399\u039C\u0391\u03A3\u03A4\u0395",
            "\u0395\u0399\u03A3\u0391\u0399",
            "\u0395\u0399\u03A3\u0391\u03A3\u03A4\u0395",
            "\u0395\u0399\u039D\u0391\u0399",
            "\u0395\u0399\u03A3\u03A4\u0395",
            "\u0395\u0399\u03A4\u0395",
            "\u0395\u039A\u0395\u0399",
            "\u0395\u039A\u039F",
            "\u0395\u039B\u0391",
            "\u0395\u039C\u0391\u03A3",
            "\u0395\u039C\u0395\u0399\u03A3",
            "\u0395\u039D\u03A4\u0395\u039B\u03A9\u03A3",
            "\u0395\u039D\u03A4\u039F\u03A3",
            "\u0395\u039D\u03A4\u03A9\u039C\u0395\u03A4\u0391\u039E\u03A5",
            "\u0395\u039D\u03A9",
            "\u0395\u039E\u0399",
            "\u0395\u039E\u0399\u03A3\u039F\u03A5",
            "\u0395\u039E\u0397\u03A3",
            "\u0395\u039E\u03A9",
            "\u0395\u039F\u039A",
            "\u0395\u03A0\u0391\u039D\u03A9",
            "\u0395\u03A0\u0395\u0399\u0394\u0397",
            "\u0395\u03A0\u0395\u0399\u03A4\u0391",
            "\u0395\u03A0\u0399",
            "\u0395\u03A0\u0399\u03A3\u0397\u03A3",
            "\u0395\u03A0\u039F\u039C\u0395\u039D\u03A9\u03A3",
            "\u0395\u03A0\u03A4\u0391",
            "\u0395\u03A3\u0391\u03A3",
            "\u0395\u03A3\u0395\u0399\u03A3",
            "\u0395\u03A3\u03A4\u03A9",
            "\u0395\u03A3\u03A5",
            "\u0395\u03A3\u03A9",
            "\u0395\u03A4\u03A3\u0399",
            "\u0395\u03A5\u0393\u0395",
            "\u0395\u03A6\u0395",
            "\u0395\u03A6\u0395\u039E\u0397\u03A3",
            "\u0395\u03A7\u03A4\u0395\u03A3",
            "\u0395\u03A9\u03A3",
            "\u0397\u0394\u0397",
            "\u0397\u039C\u0399",
            "\u0397\u03A0\u0391",
            "\u0397\u03A4\u039F\u0399",
            "\u0398\u0395\u03A3",
            "\u0399\u0394\u0399\u03A9\u03A3",
            "\u0399\u0394\u0397",
            "\u0399\u039A\u0391",
            "\u0399\u03A3\u03A9\u03A3",
            "\u039A\u0391\u0398\u0395",
            "\u039A\u0391\u0398\u0395\u03A4\u0399",
            "\u039A\u0391\u0398\u039F\u039B\u039F\u03A5",
            "\u039A\u0391\u0398\u03A9\u03A3",
            "\u039A\u0391\u0399",
            "\u039A\u0391\u039D",
            "\u039A\u0391\u03A0\u039F\u03A4\u0395",
            "\u039A\u0391\u03A0\u039F\u03A5",
            "\u039A\u0391\u03A4\u0391",
            "\u039A\u0391\u03A4\u0399",
            "\u039A\u0391\u03A4\u039F\u03A0\u0399\u039D",
            "\u039A\u0391\u03A4\u03A9",
            "\u039A\u0395\u0399",
            "\u039A\u0399\u03A7",
            "\u039A\u039A\u0395",
            "\u039A\u039F\u039B\u0391\u039D",
            "\u039A\u03A5\u03A1\u0399\u03A9\u03A3",
            "\u039A\u03A9\u03A3",
            "\u039C\u0391\u039A\u0391\u03A1\u0399",
            "\u039C\u0391\u039B\u0399\u03A3\u03A4\u0391",
            "\u039C\u0391\u039B\u039B\u039F\u039D",
            "\u039C\u0391\u0399",
            "\u039C\u0391\u039F",
            "\u039C\u0391\u039F\u03A5\u03A3",
            "\u039C\u0391\u03A3",
            "\u039C\u0395\u0398\u0391\u03A5\u03A1\u0399\u039F",
            "\u039C\u0395\u03A3",
            "\u039C\u0395\u03A3\u0391",
            "\u039C\u0395\u03A4\u0391",
            "\u039C\u0395\u03A4\u0391\u039E\u03A5",
            "\u039C\u0395\u03A7\u03A1\u0399",
            "\u039C\u0397\u0394\u0395",
            "\u039C\u0397\u039D",
            "\u039C\u0397\u03A0\u03A9\u03A3",
            "\u039C\u0397\u03A4\u0395",
            "\u039C\u0399\u0391",
            "\u039C\u0399\u0391\u03A3",
            "\u039C\u0399\u03A3",
            "\u039C\u039C\u0395",
            "\u039C\u039F\u039B\u039F\u039D\u039F\u03A4\u0399",
            "\u039C\u039F\u03A5",
            "\u039C\u03A0\u0391",
            "\u039C\u03A0\u0391\u03A3",
            "\u039C\u03A0\u039F\u03A5\u03A6\u0391\u039D",
            "\u039C\u03A0\u03A1\u039F\u03A3",
            "\u039D\u0391\u0399",
            "\u039D\u0395\u03A3",
            "\u039D\u03A4\u0391",
            "\u039D\u03A4\u0395",
            "\u039E\u0391\u039D\u0391",
            "\u039F\u0397\u0395",
            "\u039F\u039A\u03A4\u03A9",
            "\u039F\u039C\u03A9\u03A3",
            "\u039F\u039D\u0395",
            "\u039F\u03A0\u0391",
            "\u039F\u03A0\u039F\u03A5",
            "\u039F\u03A0\u03A9\u03A3",
            "\u039F\u03A3\u039F",
            "\u039F\u03A4\u0391\u039D",
            "\u039F\u03A4\u0395",
            "\u039F\u03A4\u0399",
            "\u039F\u03A5\u03A4\u0395",
            "\u039F\u03A7\u0399",
            "\u03A0\u0391\u039B\u0399",
            "\u03A0\u0391\u039D",
            "\u03A0\u0391\u039D\u039F",
            "\u03A0\u0391\u039D\u03A4\u039F\u03A4\u0395",
            "\u03A0\u0391\u039D\u03A4\u039F\u03A5",
            "\u03A0\u0391\u039D\u03A4\u03A9\u03A3",
            "\u03A0\u0391\u039D\u03A9",
            "\u03A0\u0391\u03A1\u0391",
            "\u03A0\u0395\u03A1\u0391",
            "\u03A0\u0395\u03A1\u0399",
            "\u03A0\u0395\u03A1\u0399\u03A0\u039F\u03A5",
            "\u03A0\u0399\u0391",
            "\u03A0\u0399\u039F",
            "\u03A0\u0399\u03A3\u03A9",
            "\u03A0\u039B\u0391\u0399",
            "\u03A0\u039B\u0395\u039F\u039D",
            "\u03A0\u039B\u0397\u039D",
            "\u03A0\u039F\u03A4\u0395",
            "\u03A0\u039F\u03A5",
            "\u03A0\u03A1\u039F",
            "\u03A0\u03A1\u039F\u03A3",
            "\u03A0\u03A1\u039F\u03A7\u03A4\u0395\u03A3",
            "\u03A0\u03A1\u039F\u03A7\u0398\u0395\u03A3",
            "\u03A1\u039F\u0394\u0399",
            "\u03A0\u03A9\u03A3",
            "\u03A3\u0391\u0399",
            "\u03A3\u0391\u03A3",
            "\u03A3\u0391\u039D",
            "\u03A3\u0395\u0399\u03A3",
            "\u03A3\u0399\u0391",
            "\u03A3\u039A\u0399",
            "\u03A3\u039F\u0399",
            "\u03A3\u039F\u03A5",
            "\u03A3\u03A1\u0399",
            "\u03A3\u03A5\u039D",
            "\u03A3\u03A5\u039D\u0391\u039C\u0391",
            "\u03A3\u03A7\u0395\u0394\u039F\u039D",
            "\u03A4\u0391\u0394\u0395",
            "\u03A4\u0391\u039E\u0399",
            "\u03A4\u0391\u03A7\u0391",
            "\u03A4\u0395\u0399",
            "\u03A4\u0397\u039D",
            "\u03A4\u0397\u03A3",
            "\u03A4\u0399\u03A0\u039F\u03A4\u0391",
            "\u03A4\u0399\u03A0\u039F\u03A4\u0395",
            "\u03A4\u0399\u03A3",
            "\u03A4\u039F\u039D",
            "\u03A4\u039F\u03A4\u0395",
            "\u03A4\u039F\u03A5",
            "\u03A4\u039F\u03A5\u03A3",
            "\u03A4\u03A3\u0391",
            "\u03A4\u03A3\u0395",
            "\u03A4\u03A3\u0399",
            "\u03A4\u03A3\u039F\u03A5",
            "\u03A4\u03A9\u039D",
            "\u03A5\u03A0\u039F",
            "\u03A5\u03A0\u039F\u03A8\u0397",
            "\u03A5\u03A0\u039F\u03A8\u0399\u039D",
            "\u03A5\u03A3\u03A4\u0395\u03A1\u0391",
            "\u03A6\u0395\u03A4\u039F\u03A3",
            "\u03A6\u0399\u03A3",
            "\u03A6\u03A0\u0391",
            "\u03A7\u0391\u03A6",
            "\u03A7\u0398\u0395\u03A3",
            "\u03A7\u03A4\u0395\u03A3",
            "\u03A7\u03A9\u03A1\u0399\u03A3",
            "\u03A9\u03A3",
            "\u03A9\u03A3\u0391\u039D",
            "\u03A9\u03A3\u039F\u03A4\u039F\u03A5",
            "\u03A9\u03A3\u03A0\u039F\u03A5",
            "\u03A9\u03A3\u03A4\u0395",
            "\u03A9\u03A3\u03A4\u039F\u03A3\u039F"
          ];
          var alphabet = new RegExp("^[\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9]+$");
          function isGreek(word) {
            return alphabet.test(word);
          }
          function endsInVowel(word) {
            return /[ΑΕΗΙΟΥΩ]$/.test(word);
          }
          function endsInVowel2(word) {
            return /[ΑΕΗΙΟΩ]$/.test(word);
          }
          function stem(word) {
            var stemmedWord = word;
            if (word.length < 3) {
              return stemmedWord;
            }
            if (!isGreek(word)) {
              return stemmedWord;
            }
            if (protectedWords.indexOf(word) >= 0) {
              return stemmedWord;
            }
            var stepOneRegExp = new RegExp("(.*)(" + Object.keys(stepOneExceptions).join("|") + ")$");
            var match = stepOneRegExp.exec(stemmedWord);
            if (match !== null) {
              stemmedWord = match[1] + stepOneExceptions[match[2]];
            }
            if ((match = /^(.+?)(ΑΔΕΣ|ΑΔΩΝ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (!/(ΟΚ|ΜΑΜ|ΜΑΝ|ΜΠΑΜΠ|ΠΑΤΕΡ|ΓΙΑΓΙ|ΝΤΑΝΤ|ΚΥΡ|ΘΕΙ|ΠΕΘΕΡ|ΜΟΥΣΑΜ|ΚΑΠΛΑΜ|ΠΑΡ|ΨΑΡ|ΤΖΟΥΡ|ΤΑΜΠΟΥΡ|ΓΑΛΑΤ|ΦΑΦΛΑΤ)$/.test(match[1])) {
                stemmedWord += "\u0391\u0394";
              }
            }
            if ((match = /^(.+?)(ΕΔΕΣ|ΕΔΩΝ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/(ΟΠ|ΙΠ|ΕΜΠ|ΥΠ|ΓΗΠ|ΔΑΠ|ΚΡΑΣΠ|ΜΙΛ)$/.test(match[1])) {
                stemmedWord += "\u0395\u0394";
              }
            }
            if ((match = /^(.+?)(ΟΥΔΕΣ|ΟΥΔΩΝ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/(ΑΡΚ|ΚΑΛΙΑΚ|ΠΕΤΑΛ|ΛΙΧ|ΠΛΕΞ|ΣΚ|Σ|ΦΛ|ΦΡ|ΒΕΛ|ΛΟΥΛ|ΧΝ|ΣΠ|ΤΡΑΓ|ΦΕ)$/.test(match[1])) {
                stemmedWord += "\u039F\u03A5\u0394";
              }
            }
            if ((match = /^(.+?)(ΕΩΣ|ΕΩΝ|ΕΑΣ|ΕΑ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(Θ|Δ|ΕΛ|ΓΑΛ|Ν|Π|ΙΔ|ΠΑΡ|ΣΤΕΡ|ΟΡΦ|ΑΝΔΡ|ΑΝΤΡ)$/.test(match[1])) {
                stemmedWord += "\u0395";
              }
            }
            if ((match = /^(.+?)(ΕΙΟ|ΕΙΟΣ|ΕΙΟΙ|ΕΙΑ|ΕΙΑΣ|ΕΙΕΣ|ΕΙΟΥ|ΕΙΟΥΣ|ΕΙΩΝ)$/.exec(stemmedWord)) !== null && match[1].length > 4) {
              stemmedWord = match[1];
            }
            if ((match = /^(.+?)(ΙΟΥΣ|ΙΑΣ|ΙΕΣ|ΙΟΣ|ΙΟΥ|ΙΟΙ|ΙΩΝ|ΙΟΝ|ΙΑ|ΙΟ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (endsInVowel(stemmedWord) || stemmedWord.length < 2 || /^(ΑΓ|ΑΓΓΕΛ|ΑΓΡ|ΑΕΡ|ΑΘΛ|ΑΚΟΥΣ|ΑΞ|ΑΣ|Β|ΒΙΒΛ|ΒΥΤ|Γ|ΓΙΑΓ|ΓΩΝ|Δ|ΔΑΝ|ΔΗΛ|ΔΗΜ|ΔΟΚΙΜ|ΕΛ|ΖΑΧΑΡ|ΗΛ|ΗΠ|ΙΔ|ΙΣΚ|ΙΣΤ|ΙΟΝ|ΙΩΝ|ΚΙΜΩΛ|ΚΟΛΟΝ|ΚΟΡ|ΚΤΗΡ|ΚΥΡ|ΛΑΓ|ΛΟΓ|ΜΑΓ|ΜΠΑΝ|ΜΠΡ|ΝΑΥΤ|ΝΟΤ|ΟΠΑΛ|ΟΞ|ΟΡ|ΟΣ|ΠΑΝΑΓ|ΠΑΤΡ|ΠΗΛ|ΠΗΝ|ΠΛΑΙΣ|ΠΟΝΤ|ΡΑΔ|ΡΟΔ|ΣΚ|ΣΚΟΡΠ|ΣΟΥΝ|ΣΠΑΝ|ΣΤΑΔ|ΣΥΡ|ΤΗΛ|ΤΙΜ|ΤΟΚ|ΤΟΠ|ΤΡΟΧ|ΦΙΛ|ΦΩΤ|Χ|ΧΙΛ|ΧΡΩΜ|ΧΩΡ)$/.test(match[1])) {
                stemmedWord += "\u0399";
              }
              if (/^(ΠΑΛ)$/.test(match[1])) {
                stemmedWord += "\u0391\u0399";
              }
            }
            if ((match = /^(.+?)(ΙΚΟΣ|ΙΚΟΝ|ΙΚΕΙΣ|ΙΚΟΙ|ΙΚΕΣ|ΙΚΟΥΣ|ΙΚΗ|ΙΚΗΣ|ΙΚΟ|ΙΚΑ|ΙΚΟΥ|ΙΚΩΝ|ΙΚΩΣ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (endsInVowel(stemmedWord) || /^(ΑΔ|ΑΛ|ΑΜΑΝ|ΑΜΕΡ|ΑΜΜΟΧΑΛ|ΑΝΗΘ|ΑΝΤΙΔ|ΑΠΛ|ΑΤΤ|ΑΦΡ|ΒΑΣ|ΒΡΩΜ|ΓΕΝ|ΓΕΡ|Δ|ΔΙΚΑΝ|ΔΥΤ|ΕΙΔ|ΕΝΔ|ΕΞΩΔ|ΗΘ|ΘΕΤ|ΚΑΛΛΙΝ|ΚΑΛΠ|ΚΑΤΑΔ|ΚΟΥΖΙΝ|ΚΡ|ΚΩΔ|ΛΟΓ|Μ|ΜΕΡ|ΜΟΝΑΔ|ΜΟΥΛ|ΜΟΥΣ|ΜΠΑΓΙΑΤ|ΜΠΑΝ|ΜΠΟΛ|ΜΠΟΣ|ΜΥΣΤ|Ν|ΝΙΤ|ΞΙΚ|ΟΠΤ|ΠΑΝ|ΠΕΤΣ|ΠΙΚΑΝΤ|ΠΙΤΣ|ΠΛΑΣΤ|ΠΛΙΑΤΣ|ΠΟΝΤ|ΠΟΣΤΕΛΝ|ΠΡΩΤΟΔ|ΣΕΡΤ|ΣΗΜΑΝΤ|ΣΤΑΤ|ΣΥΝΑΔ|ΣΥΝΟΜΗΛ|ΤΕΛ|ΤΕΧΝ|ΤΡΟΠ|ΤΣΑΜ|ΥΠΟΔ|Φ|ΦΙΛΟΝ|ΦΥΛΟΔ|ΦΥΣ|ΧΑΣ)$/.test(match[1]) || /(ΦΟΙΝ)$/.test(match[1])) {
                stemmedWord += "\u0399\u039A";
              }
            }
            if (stemmedWord === "\u0391\u0393\u0391\u039C\u0395") {
              stemmedWord = "\u0391\u0393\u0391\u039C";
            }
            if ((match = /^(.+?)(ΑΓΑΜΕ|ΗΣΑΜΕ|ΟΥΣΑΜΕ|ΗΚΑΜΕ|ΗΘΗΚΑΜΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
            }
            if ((match = /^(.+?)(ΑΜΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΑΝΑΠ|ΑΠΟΘ|ΑΠΟΚ|ΑΠΟΣΤ|ΒΟΥΒ|ΞΕΘ|ΟΥΛ|ΠΕΘ|ΠΙΚΡ|ΠΟΤ|ΣΙΧ|Χ)$/.test(match[1])) {
                stemmedWord += "\u0391\u039C";
              }
            }
            if ((match = /^(.+?)(ΑΓΑΝΕ|ΗΣΑΝΕ|ΟΥΣΑΝΕ|ΙΟΝΤΑΝΕ|ΙΟΤΑΝΕ|ΙΟΥΝΤΑΝΕ|ΟΝΤΑΝΕ|ΟΤΑΝΕ|ΟΥΝΤΑΝΕ|ΗΚΑΝΕ|ΗΘΗΚΑΝΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΤΡ|ΤΣ)$/.test(match[1])) {
                stemmedWord += "\u0391\u0393\u0391\u039D";
              }
            }
            if ((match = /^(.+?)(ΑΝΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (endsInVowel2(stemmedWord) || /^(ΒΕΤΕΡ|ΒΟΥΛΚ|ΒΡΑΧΜ|Γ|ΔΡΑΔΟΥΜ|Θ|ΚΑΛΠΟΥΖ|ΚΑΣΤΕΛ|ΚΟΡΜΟΡ|ΛΑΟΠΛ|ΜΩΑΜΕΘ|Μ|ΜΟΥΣΟΥΛΜΑΝ|ΟΥΛ|Π|ΠΕΛΕΚ|ΠΛ|ΠΟΛΙΣ|ΠΟΡΤΟΛ|ΣΑΡΑΚΑΤΣ|ΣΟΥΛΤ|ΤΣΑΡΛΑΤ|ΟΡΦ|ΤΣΙΓΓ|ΤΣΟΠ|ΦΩΤΟΣΤΕΦ|Χ|ΨΥΧΟΠΛ|ΑΓ|ΟΡΦ|ΓΑΛ|ΓΕΡ|ΔΕΚ|ΔΙΠΛ|ΑΜΕΡΙΚΑΝ|ΟΥΡ|ΠΙΘ|ΠΟΥΡΙΤ|Σ|ΖΩΝΤ|ΙΚ|ΚΑΣΤ|ΚΟΠ|ΛΙΧ|ΛΟΥΘΗΡ|ΜΑΙΝΤ|ΜΕΛ|ΣΙΓ|ΣΠ|ΣΤΕΓ|ΤΡΑΓ|ΤΣΑΓ|Φ|ΕΡ|ΑΔΑΠ|ΑΘΙΓΓ|ΑΜΗΧ|ΑΝΙΚ|ΑΝΟΡΓ|ΑΠΗΓ|ΑΠΙΘ|ΑΤΣΙΓΓ|ΒΑΣ|ΒΑΣΚ|ΒΑΘΥΓΑΛ|ΒΙΟΜΗΧ|ΒΡΑΧΥΚ|ΔΙΑΤ|ΔΙΑΦ|ΕΝΟΡΓ|ΘΥΣ|ΚΑΠΝΟΒΙΟΜΗΧ|ΚΑΤΑΓΑΛ|ΚΛΙΒ|ΚΟΙΛΑΡΦ|ΛΙΒ|ΜΕΓΛΟΒΙΟΜΗΧ|ΜΙΚΡΟΒΙΟΜΗΧ|ΝΤΑΒ|ΞΗΡΟΚΛΙΒ|ΟΛΙΓΟΔΑΜ|ΟΛΟΓΑΛ|ΠΕΝΤΑΡΦ|ΠΕΡΗΦ|ΠΕΡΙΤΡ|ΠΛΑΤ|ΠΟΛΥΔΑΠ|ΠΟΛΥΜΗΧ|ΣΤΕΦ|ΤΑΒ|ΤΕΤ|ΥΠΕΡΗΦ|ΥΠΟΚΟΠ|ΧΑΜΗΛΟΔΑΠ|ΨΗΛΟΤΑΒ)$/.test(match[1])) {
                stemmedWord += "\u0391\u039D";
              }
            }
            if ((match = /^(.+?)(ΗΣΕΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
            }
            if ((match = /^(.+?)(ΕΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (endsInVowel2(stemmedWord) || /(ΟΔ|ΑΙΡ|ΦΟΡ|ΤΑΘ|ΔΙΑΘ|ΣΧ|ΕΝΔ|ΕΥΡ|ΤΙΘ|ΥΠΕΡΘ|ΡΑΘ|ΕΝΘ|ΡΟΘ|ΣΘ|ΠΥΡ|ΑΙΝ|ΣΥΝΔ|ΣΥΝ|ΣΥΝΘ|ΧΩΡ|ΠΟΝ|ΒΡ|ΚΑΘ|ΕΥΘ|ΕΚΘ|ΝΕΤ|ΡΟΝ|ΑΡΚ|ΒΑΡ|ΒΟΛ|ΩΦΕΛ)$/.test(match[1]) || /^(ΑΒΑΡ|ΒΕΝ|ΕΝΑΡ|ΑΒΡ|ΑΔ|ΑΘ|ΑΝ|ΑΠΛ|ΒΑΡΟΝ|ΝΤΡ|ΣΚ|ΚΟΠ|ΜΠΟΡ|ΝΙΦ|ΠΑΓ|ΠΑΡΑΚΑΛ|ΣΕΡΠ|ΣΚΕΛ|ΣΥΡΦ|ΤΟΚ|Υ|Δ|ΕΜ|ΘΑΡΡ|Θ)$/.test(match[1])) {
                stemmedWord += "\u0395\u03A4";
              }
            }
            if ((match = /^(.+?)(ΟΝΤΑΣ|ΩΝΤΑΣ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^ΑΡΧ$/.test(match[1])) {
                stemmedWord += "\u039F\u039D\u03A4";
              }
              if (/ΚΡΕ$/.test(match[1])) {
                stemmedWord += "\u03A9\u039D\u03A4";
              }
            }
            if ((match = /^(.+?)(ΟΜΑΣΤΕ|ΙΟΜΑΣΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^ΟΝ$/.test(match[1])) {
                stemmedWord += "\u039F\u039C\u0391\u03A3\u03A4";
              }
            }
            if ((match = /^(.+?)(ΙΕΣΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(Π|ΑΠ|ΣΥΜΠ|ΑΣΥΜΠ|ΑΚΑΤΑΠ|ΑΜΕΤΑΜΦ)$/.test(match[1])) {
                stemmedWord += "\u0399\u0395\u03A3\u03A4";
              }
            }
            if ((match = /^(.+?)(ΕΣΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΑΛ|ΑΡ|ΕΚΤΕΛ|Ζ|Μ|Ξ|ΠΑΡΑΚΑΛ|ΠΡΟ|ΝΙΣ)$/.test(match[1])) {
                stemmedWord += "\u0395\u03A3\u03A4";
              }
            }
            if ((match = /^(.+?)(ΗΘΗΚΑ|ΗΘΗΚΕΣ|ΗΘΗΚΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
            }
            if ((match = /^(.+?)(ΗΚΑ|ΗΚΕΣ|ΗΚΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/(ΣΚΩΛ|ΣΚΟΥΛ|ΝΑΡΘ|ΣΦ|ΟΘ|ΠΙΘ)$/.test(match[1]) || /^(ΔΙΑΘ|Θ|ΠΑΡΑΚΑΤΑΘ|ΠΡΟΣΘ|ΣΥΝΘ)$/.test(match[1])) {
                stemmedWord += "\u0397\u039A";
              }
            }
            if ((match = /^(.+?)(ΟΥΣΑ|ΟΥΣΕΣ|ΟΥΣΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (endsInVowel(stemmedWord) || /^(ΦΑΡΜΑΚ|ΧΑΔ|ΑΓΚ|ΑΝΑΡΡ|ΒΡΟΜ|ΕΚΛΙΠ|ΛΑΜΠΙΔ|ΛΕΧ|Μ|ΠΑΤ|Ρ|Λ|ΜΕΔ|ΜΕΣΑΖ|ΥΠΟΤΕΙΝ|ΑΜ|ΑΙΘ|ΑΝΗΚ|ΔΕΣΠΟΖ|ΕΝΔΙΑΦΕΡ)$/.test(match[1]) || /(ΠΟΔΑΡ|ΒΛΕΠ|ΠΑΝΤΑΧ|ΦΡΥΔ|ΜΑΝΤΙΛ|ΜΑΛΛ|ΚΥΜΑΤ|ΛΑΧ|ΛΗΓ|ΦΑΓ|ΟΜ|ΠΡΩΤ)$/.test(match[1])) {
                stemmedWord += "\u039F\u03A5\u03A3";
              }
            }
            if ((match = /^(.+?)(ΑΓΑ|ΑΓΕΣ|ΑΓΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΑΒΑΣΤ|ΠΟΛΥΦ|ΑΔΗΦ|ΠΑΜΦ|Ρ|ΑΣΠ|ΑΦ|ΑΜΑΛ|ΑΜΑΛΛΙ|ΑΝΥΣΤ|ΑΠΕΡ|ΑΣΠΑΡ|ΑΧΑΡ|ΔΕΡΒΕΝ|ΔΡΟΣΟΠ|ΞΕΦ|ΝΕΟΠ|ΝΟΜΟΤ|ΟΛΟΠ|ΟΜΟΤ|ΠΡΟΣΤ|ΠΡΟΣΩΠΟΠ|ΣΥΜΠ|ΣΥΝΤ|Τ|ΥΠΟΤ|ΧΑΡ|ΑΕΙΠ|ΑΙΜΟΣΤ|ΑΝΥΠ|ΑΠΟΤ|ΑΡΤΙΠ|ΔΙΑΤ|ΕΝ|ΕΠΙΤ|ΚΡΟΚΑΛΟΠ|ΣΙΔΗΡΟΠ|Λ|ΝΑΥ|ΟΥΛΑΜ|ΟΥΡ|Π|ΤΡ|Μ)$/.test(match[1]) || /(ΟΦ|ΠΕΛ|ΧΟΡΤ|ΛΛ|ΣΦ|ΡΠ|ΦΡ|ΠΡ|ΛΟΧ|ΣΜΗΝ)$/.test(match[1]) && !/^(ΨΟΦ|ΝΑΥΛΟΧ)$/.test(match[1]) || /(ΚΟΛΛ)$/.test(match[1])) {
                stemmedWord += "\u0391\u0393";
              }
            }
            if ((match = /^(.+?)(ΗΣΕ|ΗΣΟΥ|ΗΣΑ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(Ν|ΧΕΡΣΟΝ|ΔΩΔΕΚΑΝ|ΕΡΗΜΟΝ|ΜΕΓΑΛΟΝ|ΕΠΤΑΝ|Ι)$/.test(match[1])) {
                stemmedWord += "\u0397\u03A3";
              }
            }
            if ((match = /^(.+?)(ΗΣΤΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΑΣΒ|ΣΒ|ΑΧΡ|ΧΡ|ΑΠΛ|ΑΕΙΜΝ|ΔΥΣΧΡ|ΕΥΧΡ|ΚΟΙΝΟΧΡ|ΠΑΛΙΜΨ)$/.test(match[1])) {
                stemmedWord += "\u0397\u03A3\u03A4";
              }
            }
            if ((match = /^(.+?)(ΟΥΝΕ|ΗΣΟΥΝΕ|ΗΘΟΥΝΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(Ν|Ρ|ΣΠΙ|ΣΤΡΑΒΟΜΟΥΤΣ|ΚΑΚΟΜΟΥΤΣ|ΕΞΩΝ)$/.test(match[1])) {
                stemmedWord += "\u039F\u03A5\u039D";
              }
            }
            if ((match = /^(.+?)(ΟΥΜΕ|ΗΣΟΥΜΕ|ΗΘΟΥΜΕ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1];
              if (/^(ΠΑΡΑΣΟΥΣ|Φ|Χ|ΩΡΙΟΠΛ|ΑΖ|ΑΛΛΟΣΟΥΣ|ΑΣΟΥΣ)$/.test(match[1])) {
                stemmedWord += "\u039F\u03A5\u039C";
              }
            }
            if ((match = /^(.+?)(ΜΑΤΟΙ|ΜΑΤΟΥΣ|ΜΑΤΟ|ΜΑΤΑ|ΜΑΤΩΣ|ΜΑΤΩΝ|ΜΑΤΟΣ|ΜΑΤΕΣ|ΜΑΤΗ|ΜΑΤΗΣ|ΜΑΤΟΥ)$/.exec(stemmedWord)) != null) {
              stemmedWord = match[1] + "\u039C";
              if (/^(ΓΡΑΜ)$/.test(match[1])) {
                stemmedWord += "\u0391";
              } else if (/^(ΓΕ|ΣΤΑ)$/.test(match[1])) {
                stemmedWord += "\u0391\u03A4";
              }
            }
            if ((match = /^(.+?)(ΟΥΑ)$/.exec(stemmedWord)) !== null) {
              stemmedWord = match[1] + "\u039F\u03A5";
            }
            if (word.length === stemmedWord.length) {
              if ((match = /^(.+?)(Α|ΑΓΑΤΕ|ΑΓΑΝ|ΑΕΙ|ΑΜΑΙ|ΑΝ|ΑΣ|ΑΣΑΙ|ΑΤΑΙ|ΑΩ|Ε|ΕΙ|ΕΙΣ|ΕΙΤΕ|ΕΣΑΙ|ΕΣ|ΕΤΑΙ|Ι|ΙΕΜΑΙ|ΙΕΜΑΣΤΕ|ΙΕΤΑΙ|ΙΕΣΑΙ|ΙΕΣΑΣΤΕ|ΙΟΜΑΣΤΑΝ|ΙΟΜΟΥΝ|ΙΟΜΟΥΝΑ|ΙΟΝΤΑΝ|ΙΟΝΤΟΥΣΑΝ|ΙΟΣΑΣΤΑΝ|ΙΟΣΑΣΤΕ|ΙΟΣΟΥΝ|ΙΟΣΟΥΝΑ|ΙΟΤΑΝ|ΙΟΥΜΑ|ΙΟΥΜΑΣΤΕ|ΙΟΥΝΤΑΙ|ΙΟΥΝΤΑΝ|Η|ΗΔΕΣ|ΗΔΩΝ|ΗΘΕΙ|ΗΘΕΙΣ|ΗΘΕΙΤΕ|ΗΘΗΚΑΤΕ|ΗΘΗΚΑΝ|ΗΘΟΥΝ|ΗΘΩ|ΗΚΑΤΕ|ΗΚΑΝ|ΗΣ|ΗΣΑΝ|ΗΣΑΤΕ|ΗΣΕΙ|ΗΣΕΣ|ΗΣΟΥΝ|ΗΣΩ|Ο|ΟΙ|ΟΜΑΙ|ΟΜΑΣΤΑΝ|ΟΜΟΥΝ|ΟΜΟΥΝΑ|ΟΝΤΑΙ|ΟΝΤΑΝ|ΟΝΤΟΥΣΑΝ|ΟΣ|ΟΣΑΣΤΑΝ|ΟΣΑΣΤΕ|ΟΣΟΥΝ|ΟΣΟΥΝΑ|ΟΤΑΝ|ΟΥ|ΟΥΜΑΙ|ΟΥΜΑΣΤΕ|ΟΥΝ|ΟΥΝΤΑΙ|ΟΥΝΤΑΝ|ΟΥΣ|ΟΥΣΑΝ|ΟΥΣΑΤΕ|Υ||ΥΑ|ΥΣ|Ω|ΩΝ|ΟΙΣ)$/.exec(stemmedWord)) !== null) {
                stemmedWord = match[1];
              }
            }
            if ((match = /^(.+?)(ΕΣΤΕΡ|ΕΣΤΑΤ|ΟΤΕΡ|ΟΤΑΤ|ΥΤΕΡ|ΥΤΑΤ|ΩΤΕΡ|ΩΤΑΤ)$/.exec(stemmedWord)) != null) {
              if (!/^(ΕΞ|ΕΣ|ΑΝ|ΚΑΤ|Κ|ΠΡ)$/.test(match[1])) {
                stemmedWord = match[1];
              }
              if (/^(ΚΑ|Μ|ΕΛΕ|ΛΕ|ΔΕ)$/.test(match[1])) {
                stemmedWord += "\u03A5\u03A4";
              }
            }
            return stemmedWord;
          }
          return function(token) {
            if (typeof token.update === "function") {
              return token.update(function(word) {
                return stem(word.toUpperCase()).toLowerCase();
              });
            } else {
              return stem(token.toUpperCase()).toLowerCase();
            }
          };
        }();
        lunr.Pipeline.registerFunction(lunr.el.stemmer, "stemmer-el");
        lunr.el.stopWordFilter = lunr.generateStopWordFilter("\u03B1\u03BB\u03BB\u03B1 \u03B1\u03BD \u03B1\u03BD\u03C4\u03B9 \u03B1\u03C0\u03BF \u03B1\u03C5\u03C4\u03B1 \u03B1\u03C5\u03C4\u03B5\u03C3 \u03B1\u03C5\u03C4\u03B7 \u03B1\u03C5\u03C4\u03BF \u03B1\u03C5\u03C4\u03BF\u03B9 \u03B1\u03C5\u03C4\u03BF\u03C3 \u03B1\u03C5\u03C4\u03BF\u03C5\u03C3 \u03B1\u03C5\u03C4\u03C9\u03BD \u03B3\u03B9\u03B1 \u03B4\u03B5 \u03B4\u03B5\u03BD \u03B5\u03B1\u03BD \u03B5\u03B9\u03BC\u03B1\u03B9 \u03B5\u03B9\u03BC\u03B1\u03C3\u03C4\u03B5 \u03B5\u03B9\u03BD\u03B1\u03B9 \u03B5\u03B9\u03C3\u03B1\u03B9 \u03B5\u03B9\u03C3\u03C4\u03B5 \u03B5\u03BA\u03B5\u03B9\u03BD\u03B1 \u03B5\u03BA\u03B5\u03B9\u03BD\u03B5\u03C3 \u03B5\u03BA\u03B5\u03B9\u03BD\u03B7 \u03B5\u03BA\u03B5\u03B9\u03BD\u03BF \u03B5\u03BA\u03B5\u03B9\u03BD\u03BF\u03B9 \u03B5\u03BA\u03B5\u03B9\u03BD\u03BF\u03C3 \u03B5\u03BA\u03B5\u03B9\u03BD\u03BF\u03C5\u03C3 \u03B5\u03BA\u03B5\u03B9\u03BD\u03C9\u03BD \u03B5\u03BD\u03C9 \u03B5\u03C0\u03B9 \u03B7 \u03B8\u03B1 \u03B9\u03C3\u03C9\u03C3 \u03BA \u03BA\u03B1\u03B9 \u03BA\u03B1\u03C4\u03B1 \u03BA\u03B9 \u03BC\u03B1 \u03BC\u03B5 \u03BC\u03B5\u03C4\u03B1 \u03BC\u03B7 \u03BC\u03B7\u03BD \u03BD\u03B1 \u03BF \u03BF\u03B9 \u03BF\u03BC\u03C9\u03C3 \u03BF\u03C0\u03C9\u03C3 \u03BF\u03C3\u03BF \u03BF\u03C4\u03B9 \u03C0\u03B1\u03C1\u03B1 \u03C0\u03BF\u03B9\u03B1 \u03C0\u03BF\u03B9\u03B5\u03C3 \u03C0\u03BF\u03B9\u03BF \u03C0\u03BF\u03B9\u03BF\u03B9 \u03C0\u03BF\u03B9\u03BF\u03C3 \u03C0\u03BF\u03B9\u03BF\u03C5\u03C3 \u03C0\u03BF\u03B9\u03C9\u03BD \u03C0\u03BF\u03C5 \u03C0\u03C1\u03BF\u03C3 \u03C0\u03C9\u03C3 \u03C3\u03B5 \u03C3\u03C4\u03B7 \u03C3\u03C4\u03B7\u03BD \u03C3\u03C4\u03BF \u03C3\u03C4\u03BF\u03BD \u03C4\u03B1 \u03C4\u03B7\u03BD \u03C4\u03B7\u03C3 \u03C4\u03BF \u03C4\u03BF\u03BD \u03C4\u03BF\u03C4\u03B5 \u03C4\u03BF\u03C5 \u03C4\u03C9\u03BD \u03C9\u03C3".split(" "));
        lunr.Pipeline.registerFunction(lunr.el.stopWordFilter, "stopWordFilter-el");
        lunr.el.normilizer = /* @__PURE__ */ function() {
          var accentMap = {
            "\u0386": "\u0391",
            "\u03AC": "\u03B1",
            "\u0388": "\u0395",
            "\u03AD": "\u03B5",
            "\u0389": "\u0397",
            "\u03AE": "\u03B7",
            "\u038A": "\u0399",
            "\u03AF": "\u03B9",
            "\u038C": "\u039F",
            "\u03BF": "\u03BF",
            "\u038E": "\u03A5",
            "\u03CD": "\u03C5",
            "\u038F": "\u03A9",
            "\u03CE": "\u03C9",
            "\u03AA": "\u0399",
            "\u03CA": "\u03B9",
            "\u03AB": "\u03A5",
            "\u03CB": "\u03C5",
            "\u0390": "\u03B9",
            "\u03B0": "\u03C5"
          };
          return function(token) {
            if (typeof token.update === "function") {
              return token.update(function(term) {
                var ret2 = "";
                for (var i2 = 0; i2 < term.length; i2++) {
                  ret2 += accentMap[term.charAt(i2)] || term.charAt(i2);
                }
                return ret2;
              });
            } else {
              var ret = "";
              for (var i = 0; i < token.length; i++) {
                ret += accentMap[token.charAt(i)] || token.charAt(i);
              }
              return ret;
            }
          };
        }();
        lunr.Pipeline.registerFunction(lunr.el.normilizer, "normilizer-el");
      };
    });
  }
});

// src/worker/langs/el.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_el());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "el");
  return lunr.el;
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

lunr-languages/lunr.el.js:
  (*!
   * Lunr languages, `Greek` language
   * https://github.com/MihaiValentin/lunr-languages
   *
   * Copyright 2023, Panos Bariamis
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
