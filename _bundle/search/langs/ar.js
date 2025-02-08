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

// node_modules/lunr-languages/lunr.ar.js
var require_lunr_ar = __commonJS({
  "node_modules/lunr-languages/lunr.ar.js"(exports, module2) {
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
        lunr.ar = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.ar.trimmer,
            lunr.ar.stopWordFilter,
            lunr.ar.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.ar.stemmer);
          }
        };
        lunr.ar.wordCharacters = "\u0621-\u065B\u0671\u0640";
        lunr.ar.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.ar.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.ar.trimmer, "trimmer-ar");
        lunr.ar.stemmer = function() {
          var self2 = this;
          var word = "";
          self2.result = false;
          self2.preRemoved = false;
          self2.sufRemoved = false;
          self2.pre = {
            pre1: "\u0641 \u0643 \u0628 \u0648 \u0633 \u0644 \u0646 \u0627 \u064A \u062A",
            pre2: "\u0627\u0644 \u0644\u0644",
            pre3: "\u0628\u0627\u0644 \u0648\u0627\u0644 \u0641\u0627\u0644 \u062A\u0627\u0644 \u0643\u0627\u0644 \u0648\u0644\u0644",
            pre4: "\u0641\u0628\u0627\u0644 \u0643\u0628\u0627\u0644 \u0648\u0628\u0627\u0644 \u0648\u0643\u0627\u0644"
          };
          self2.suf = {
            suf1: "\u0647 \u0643 \u062A \u0646 \u0627 \u064A",
            suf2: "\u0646\u0643 \u0646\u0647 \u0647\u0627 \u0648\u0643 \u064A\u0627 \u0627\u0647 \u0648\u0646 \u064A\u0646 \u062A\u0646 \u062A\u0645 \u0646\u0627 \u0648\u0627 \u0627\u0646 \u0643\u0645 \u0643\u0646 \u0646\u064A \u0646\u0646 \u0645\u0627 \u0647\u0645 \u0647\u0646 \u062A\u0643 \u062A\u0647 \u0627\u062A \u064A\u0647",
            suf3: "\u062A\u064A\u0646 \u0643\u0647\u0645 \u0646\u064A\u0647 \u0646\u0647\u0645 \u0648\u0646\u0647 \u0648\u0647\u0627 \u064A\u0647\u0645 \u0648\u0646\u0627 \u0648\u0646\u0643 \u0648\u0646\u064A \u0648\u0647\u0645 \u062A\u0643\u0645 \u062A\u0646\u0627 \u062A\u0647\u0627 \u062A\u0646\u064A \u062A\u0647\u0645 \u0643\u0645\u0627 \u0643\u0647\u0627 \u0646\u0627\u0647 \u0646\u0643\u0645 \u0647\u0646\u0627 \u062A\u0627\u0646 \u064A\u0647\u0627",
            suf4: "\u0643\u0645\u0648\u0647 \u0646\u0627\u0647\u0627 \u0648\u0646\u0646\u064A \u0648\u0646\u0647\u0645 \u062A\u0643\u0645\u0627 \u062A\u0645\u0648\u0647 \u062A\u0643\u0627\u0647 \u0643\u0645\u0627\u0647 \u0646\u0627\u0643\u0645 \u0646\u0627\u0647\u0645 \u0646\u064A\u0647\u0627 \u0648\u0646\u0646\u0627"
          };
          self2.patterns = JSON.parse('{"pt43":[{"pt":[{"c":"\u0627","l":1}]},{"pt":[{"c":"\u0627,\u062A,\u0646,\u064A","l":0}],"mPt":[{"c":"\u0641","l":0,"m":1},{"c":"\u0639","l":1,"m":2},{"c":"\u0644","l":2,"m":3}]},{"pt":[{"c":"\u0648","l":2}],"mPt":[{"c":"\u0641","l":0,"m":0},{"c":"\u0639","l":1,"m":1},{"c":"\u0644","l":2,"m":3}]},{"pt":[{"c":"\u0627","l":2}]},{"pt":[{"c":"\u064A","l":2}],"mPt":[{"c":"\u0641","l":0,"m":0},{"c":"\u0639","l":1,"m":1},{"c":"\u0627","l":2},{"c":"\u0644","l":3,"m":3}]},{"pt":[{"c":"\u0645","l":0}]}],"pt53":[{"pt":[{"c":"\u062A","l":0},{"c":"\u0627","l":2}]},{"pt":[{"c":"\u0627,\u0646,\u062A,\u064A","l":0},{"c":"\u062A","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u062A","l":2},{"c":"\u0639","l":3,"m":3},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0627","l":0},{"c":"\u0627","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u0639","l":2,"m":3},{"c":"\u0644","l":3,"m":4},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0627","l":0},{"c":"\u0627","l":3}],"mPt":[{"c":"\u0641","l":0,"m":1},{"c":"\u0639","l":1,"m":2},{"c":"\u0644","l":2,"m":4}]},{"pt":[{"c":"\u0627","l":3},{"c":"\u0646","l":4}]},{"pt":[{"c":"\u062A","l":0},{"c":"\u064A","l":3}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u0648","l":3}]},{"pt":[{"c":"\u0627","l":1},{"c":"\u0648","l":3}]},{"pt":[{"c":"\u0648","l":1},{"c":"\u0627","l":2}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u0627","l":3}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u064A","l":3}]},{"pt":[{"c":"\u0627","l":2},{"c":"\u0646","l":3}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u0646","l":1}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0646","l":1},{"c":"\u0641","l":2,"m":2},{"c":"\u0639","l":3,"m":3},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u062A","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u062A","l":2},{"c":"\u0639","l":3,"m":3},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u0627","l":2}]},{"pt":[{"c":"\u0645","l":1},{"c":"\u0627","l":3}]},{"pt":[{"c":"\u064A,\u062A,\u0627,\u0646","l":0},{"c":"\u062A","l":1}],"mPt":[{"c":"\u0641","l":0,"m":2},{"c":"\u0639","l":1,"m":3},{"c":"\u0627","l":2},{"c":"\u0644","l":3,"m":4}]},{"pt":[{"c":"\u062A,\u064A,\u0627,\u0646","l":0},{"c":"\u062A","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u062A","l":2},{"c":"\u0639","l":3,"m":3},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0627","l":2},{"c":"\u064A","l":3}]},{"pt":[{"c":"\u0627,\u064A,\u062A,\u0646","l":0},{"c":"\u0646","l":1}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0646","l":1},{"c":"\u0641","l":2,"m":2},{"c":"\u0639","l":3,"m":3},{"c":"\u0627","l":4},{"c":"\u0644","l":5,"m":4}]},{"pt":[{"c":"\u0627","l":3},{"c":"\u0621","l":4}]}],"pt63":[{"pt":[{"c":"\u0627","l":0},{"c":"\u062A","l":2},{"c":"\u0627","l":4}]},{"pt":[{"c":"\u0627,\u062A,\u0646,\u064A","l":0},{"c":"\u0633","l":1},{"c":"\u062A","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0633","l":1},{"c":"\u062A","l":2},{"c":"\u0641","l":3,"m":3},{"c":"\u0639","l":4,"m":4},{"c":"\u0627","l":5},{"c":"\u0644","l":6,"m":5}]},{"pt":[{"c":"\u0627,\u0646,\u062A,\u064A","l":0},{"c":"\u0648","l":3}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u0633","l":1},{"c":"\u062A","l":2}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0633","l":1},{"c":"\u062A","l":2},{"c":"\u0641","l":3,"m":3},{"c":"\u0639","l":4,"m":4},{"c":"\u0627","l":5},{"c":"\u0644","l":6,"m":5}]},{"pt":[{"c":"\u064A","l":1},{"c":"\u064A","l":3},{"c":"\u0627","l":4},{"c":"\u0621","l":5}]},{"pt":[{"c":"\u0627","l":0},{"c":"\u0646","l":1},{"c":"\u0627","l":4}]}],"pt54":[{"pt":[{"c":"\u062A","l":0}]},{"pt":[{"c":"\u0627,\u064A,\u062A,\u0646","l":0}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u0639","l":2,"m":2},{"c":"\u0644","l":3,"m":3},{"c":"\u0631","l":4,"m":4},{"c":"\u0627","l":5},{"c":"\u0631","l":6,"m":4}]},{"pt":[{"c":"\u0645","l":0}],"mPt":[{"c":"\u0627","l":0},{"c":"\u0641","l":1,"m":1},{"c":"\u0639","l":2,"m":2},{"c":"\u0644","l":3,"m":3},{"c":"\u0631","l":4,"m":4},{"c":"\u0627","l":5},{"c":"\u0631","l":6,"m":4}]},{"pt":[{"c":"\u0627","l":2}]},{"pt":[{"c":"\u0627","l":0},{"c":"\u0646","l":2}]}],"pt64":[{"pt":[{"c":"\u0627","l":0},{"c":"\u0627","l":4}]},{"pt":[{"c":"\u0645","l":0},{"c":"\u062A","l":1}]}],"pt73":[{"pt":[{"c":"\u0627","l":0},{"c":"\u0633","l":1},{"c":"\u062A","l":2},{"c":"\u0627","l":5}]}],"pt75":[{"pt":[{"c":"\u0627","l":0},{"c":"\u0627","l":5}]}]}');
          self2.execArray = [
            "cleanWord",
            "removeDiacritics",
            "cleanAlef",
            "removeStopWords",
            "normalizeHamzaAndAlef",
            "removeStartWaw",
            "removePre432",
            "removeEndTaa",
            "wordCheck"
          ];
          self2.stem = function() {
            var counter = 0;
            self2.result = false;
            self2.preRemoved = false;
            self2.sufRemoved = false;
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
            var wordCharacters = "\u0621-\u065B\u0671\u0640";
            var testRegex = new RegExp("[^" + wordCharacters + "]");
            self2.word = self2.word.replace(new RegExp("\u0640", "g"), "");
            if (testRegex.test(word)) {
              return true;
            }
            return false;
          };
          self2.removeDiacritics = function() {
            var diacriticsRegex = new RegExp("[\u064B-\u065B]");
            self2.word = self2.word.replace(/[\u064b-\u065b]/gi, "");
            return false;
          };
          self2.cleanAlef = function() {
            var alefRegex = new RegExp("[\u0622\u0623\u0625\u0671\u0649]");
            self2.word = self2.word.replace(alefRegex, "\u0627");
            return false;
          };
          self2.removeStopWords = function() {
            var stopWords = "\u060C \u0627\u0636 \u0627\u0645\u064A\u0646 \u0627\u0647 \u0627\u0647\u0627 \u0627\u064A \u0627 \u0627\u0628 \u0627\u062C\u0644 \u0627\u062C\u0645\u0639 \u0627\u062E \u0627\u062E\u0630 \u0627\u0635\u0628\u062D \u0627\u0636\u062D\u0649 \u0627\u0642\u0628\u0644 \u0627\u0642\u0644 \u0627\u0643\u062B\u0631 \u0627\u0644\u0627 \u0627\u0645 \u0627\u0645\u0627 \u0627\u0645\u0627\u0645\u0643 \u0627\u0645\u0627\u0645\u0643 \u0627\u0645\u0633\u0649 \u0627\u0645\u0627 \u0627\u0646 \u0627\u0646\u0627 \u0627\u0646\u062A \u0627\u0646\u062A\u0645 \u0627\u0646\u062A\u0645\u0627 \u0627\u0646\u062A\u0646 \u0627\u0646\u062A \u0627\u0646\u0634\u0627 \u0627\u0646\u0649 \u0627\u0648 \u0627\u0648\u0634\u0643 \u0627\u0648\u0644\u0626\u0643 \u0627\u0648\u0644\u0626\u0643\u0645 \u0627\u0648\u0644\u0627\u0621 \u0627\u0648\u0644\u0627\u0644\u0643 \u0627\u0648\u0647 \u0627\u064A \u0627\u064A\u0627 \u0627\u064A\u0646 \u0627\u064A\u0646\u0645\u0627 \u0627\u064A \u0627\u0646 \u0627\u064A \u0627\u0641 \u0627\u0630 \u0627\u0630\u0627 \u0627\u0630\u0627 \u0627\u0630\u0645\u0627 \u0627\u0630\u0646 \u0627\u0644\u0649 \u0627\u0644\u064A\u0643\u0645 \u0627\u0644\u064A\u0643\u0645\u0627 \u0627\u0644\u064A\u0643\u0646 \u0627\u0644\u064A\u0643 \u0627\u0644\u064A\u0643 \u0627\u0644\u0627 \u0627\u0645\u0627 \u0627\u0646 \u0627\u0646\u0645\u0627 \u0627\u064A \u0627\u064A\u0627\u0643 \u0627\u064A\u0627\u0643\u0645 \u0627\u064A\u0627\u0643\u0645\u0627 \u0627\u064A\u0627\u0643\u0646 \u0627\u064A\u0627\u0646\u0627 \u0627\u064A\u0627\u0647 \u0627\u064A\u0627\u0647\u0627 \u0627\u064A\u0627\u0647\u0645 \u0627\u064A\u0627\u0647\u0645\u0627 \u0627\u064A\u0627\u0647\u0646 \u0627\u064A\u0627\u064A \u0627\u064A\u0647 \u0627\u0646 \u0627 \u0627\u0628\u062A\u062F\u0627 \u0627\u062B\u0631 \u0627\u062C\u0644 \u0627\u062D\u062F \u0627\u062E\u0631\u0649 \u0627\u062E\u0644\u0648\u0644\u0642 \u0627\u0630\u0627 \u0627\u0631\u0628\u0639\u0629 \u0627\u0631\u062A\u062F \u0627\u0633\u062A\u062D\u0627\u0644 \u0627\u0637\u0627\u0631 \u0627\u0639\u0627\u062F\u0629 \u0627\u0639\u0644\u0646\u062A \u0627\u0641 \u0627\u0643\u062B\u0631 \u0627\u0643\u062F \u0627\u0644\u0627\u0644\u0627\u0621 \u0627\u0644\u0627\u0644\u0649 \u0627\u0644\u0627 \u0627\u0644\u0627\u062E\u064A\u0631\u0629 \u0627\u0644\u0627\u0646 \u0627\u0644\u0627\u0648\u0644 \u0627\u0644\u0627\u0648\u0644\u0649 \u0627\u0644\u062A\u0649 \u0627\u0644\u062A\u064A \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0630\u0627\u062A\u064A \u0627\u0644\u0630\u0649 \u0627\u0644\u0630\u064A \u0627\u0644\u0630\u064A\u0646 \u0627\u0644\u0633\u0627\u0628\u0642 \u0627\u0644\u0641 \u0627\u0644\u0644\u0627\u0626\u064A \u0627\u0644\u0644\u0627\u062A\u064A \u0627\u0644\u0644\u062A\u0627\u0646 \u0627\u0644\u0644\u062A\u064A\u0627 \u0627\u0644\u0644\u062A\u064A\u0646 \u0627\u0644\u0644\u0630\u0627\u0646 \u0627\u0644\u0644\u0630\u064A\u0646 \u0627\u0644\u0644\u0648\u0627\u062A\u064A \u0627\u0644\u0645\u0627\u0636\u064A \u0627\u0644\u0645\u0642\u0628\u0644 \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0649 \u0627\u0644\u064A\u0648\u0645 \u0627\u0645\u0627 \u0627\u0645\u0627\u0645 \u0627\u0645\u0633 \u0627\u0646 \u0627\u0646\u0628\u0631\u0649 \u0627\u0646\u0642\u0644\u0628 \u0627\u0646\u0647 \u0627\u0646\u0647\u0627 \u0627\u0648 \u0627\u0648\u0644 \u0627\u064A \u0627\u064A\u0627\u0631 \u0627\u064A\u0627\u0645 \u0627\u064A\u0636\u0627 \u0628 \u0628\u0627\u062A \u0628\u0627\u0633\u0645 \u0628\u0627\u0646 \u0628\u062E \u0628\u0631\u0633 \u0628\u0633\u0628\u0628 \u0628\u0633 \u0628\u0634\u0643\u0644 \u0628\u0636\u0639 \u0628\u0637\u0627\u0646 \u0628\u0639\u062F \u0628\u0639\u0636 \u0628\u0643 \u0628\u0643\u0645 \u0628\u0643\u0645\u0627 \u0628\u0643\u0646 \u0628\u0644 \u0628\u0644\u0649 \u0628\u0645\u0627 \u0628\u0645\u0627\u0630\u0627 \u0628\u0645\u0646 \u0628\u0646 \u0628\u0646\u0627 \u0628\u0647 \u0628\u0647\u0627 \u0628\u064A \u0628\u064A\u062F \u0628\u064A\u0646 \u0628\u0633 \u0628\u0644\u0647 \u0628\u0626\u0633 \u062A\u0627\u0646 \u062A\u0627\u0646\u0643 \u062A\u0628\u062F\u0644 \u062A\u062C\u0627\u0647 \u062A\u062D\u0648\u0644 \u062A\u0644\u0642\u0627\u0621 \u062A\u0644\u0643 \u062A\u0644\u0643\u0645 \u062A\u0644\u0643\u0645\u0627 \u062A\u0645 \u062A\u064A\u0646\u0643 \u062A\u064A\u0646 \u062A\u0647 \u062A\u064A \u062B\u0644\u0627\u062B\u0629 \u062B\u0645 \u062B\u0645 \u062B\u0645\u0629 \u062B\u0645 \u062C\u0639\u0644 \u062C\u0644\u0644 \u062C\u0645\u064A\u0639 \u062C\u064A\u0631 \u062D\u0627\u0631 \u062D\u0627\u0634\u0627 \u062D\u0627\u0644\u064A\u0627 \u062D\u0627\u064A \u062D\u062A\u0649 \u062D\u0631\u0649 \u062D\u0633\u0628 \u062D\u0645 \u062D\u0648\u0627\u0644\u0649 \u062D\u0648\u0644 \u062D\u064A\u062B \u062D\u064A\u062B\u0645\u0627 \u062D\u064A\u0646 \u062D\u064A \u062D\u0628\u0630\u0627 \u062D\u062A\u0649 \u062D\u0630\u0627\u0631 \u062E\u0644\u0627 \u062E\u0644\u0627\u0644 \u062F\u0648\u0646 \u062F\u0648\u0646\u0643 \u0630\u0627 \u0630\u0627\u062A \u0630\u0627\u0643 \u0630\u0627\u0646\u0643 \u0630\u0627\u0646 \u0630\u0644\u0643 \u0630\u0644\u0643\u0645 \u0630\u0644\u0643\u0645\u0627 \u0630\u0644\u0643\u0646 \u0630\u0648 \u0630\u0648\u0627 \u0630\u0648\u0627\u062A\u0627 \u0630\u0648\u0627\u062A\u064A \u0630\u064A\u062A \u0630\u064A\u0646\u0643 \u0630\u064A\u0646 \u0630\u0647 \u0630\u064A \u0631\u0627\u062D \u0631\u062C\u0639 \u0631\u0648\u064A\u062F\u0643 \u0631\u064A\u062B \u0631\u0628 \u0632\u064A\u0627\u0631\u0629 \u0633\u0628\u062D\u0627\u0646 \u0633\u0631\u0639\u0627\u0646 \u0633\u0646\u0629 \u0633\u0646\u0648\u0627\u062A \u0633\u0648\u0641 \u0633\u0648\u0649 \u0633\u0627\u0621 \u0633\u0627\u0621\u0645\u0627 \u0634\u0628\u0647 \u0634\u062E\u0635\u0627 \u0634\u0631\u0639 \u0634\u062A\u0627\u0646 \u0635\u0627\u0631 \u0635\u0628\u0627\u062D \u0635\u0641\u0631 \u0635\u0647 \u0635\u0647 \u0636\u062F \u0636\u0645\u0646 \u0637\u0627\u0642 \u0637\u0627\u0644\u0645\u0627 \u0637\u0641\u0642 \u0637\u0642 \u0638\u0644 \u0639\u0627\u062F \u0639\u0627\u0645 \u0639\u0627\u0645\u0627 \u0639\u0627\u0645\u0629 \u0639\u062F\u0627 \u0639\u062F\u0629 \u0639\u062F\u062F \u0639\u062F\u0645 \u0639\u0633\u0649 \u0639\u0634\u0631 \u0639\u0634\u0631\u0629 \u0639\u0644\u0642 \u0639\u0644\u0649 \u0639\u0644\u064A\u0643 \u0639\u0644\u064A\u0647 \u0639\u0644\u064A\u0647\u0627 \u0639\u0644 \u0639\u0646 \u0639\u0646\u062F \u0639\u0646\u062F\u0645\u0627 \u0639\u0648\u0636 \u0639\u064A\u0646 \u0639\u062F\u0633 \u0639\u0645\u0627 \u063A\u062F\u0627 \u063A\u064A\u0631  \u0641 \u0641\u0627\u0646 \u0641\u0644\u0627\u0646 \u0641\u0648 \u0641\u0649 \u0641\u064A \u0641\u064A\u0645 \u0641\u064A\u0645\u0627 \u0641\u064A\u0647 \u0641\u064A\u0647\u0627 \u0642\u0627\u0644 \u0642\u0627\u0645 \u0642\u0628\u0644 \u0642\u062F \u0642\u0637 \u0642\u0644\u0645\u0627 \u0642\u0648\u0629 \u0643\u0627\u0646\u0645\u0627 \u0643\u0627\u064A\u0646 \u0643\u0627\u064A \u0643\u0627\u064A\u0646 \u0643\u0627\u062F \u0643\u0627\u0646 \u0643\u0627\u0646\u062A \u0643\u0630\u0627 \u0643\u0630\u0644\u0643 \u0643\u0631\u0628 \u0643\u0644 \u0643\u0644\u0627 \u0643\u0644\u0627\u0647\u0645\u0627 \u0643\u0644\u062A\u0627 \u0643\u0644\u0645 \u0643\u0644\u064A\u0643\u0645\u0627 \u0643\u0644\u064A\u0647\u0645\u0627 \u0643\u0644\u0645\u0627 \u0643\u0644\u0627 \u0643\u0645 \u0643\u0645\u0627 \u0643\u064A \u0643\u064A\u062A \u0643\u064A\u0641 \u0643\u064A\u0641\u0645\u0627 \u0643\u0627\u0646 \u0643\u062E \u0644\u0626\u0646 \u0644\u0627 \u0644\u0627\u062A \u0644\u0627\u0633\u064A\u0645\u0627 \u0644\u062F\u0646 \u0644\u062F\u0649 \u0644\u0639\u0645\u0631 \u0644\u0642\u0627\u0621 \u0644\u0643 \u0644\u0643\u0645 \u0644\u0643\u0645\u0627 \u0644\u0643\u0646 \u0644\u0643\u0646\u0645\u0627 \u0644\u0643\u064A \u0644\u0643\u064A\u0644\u0627 \u0644\u0644\u0627\u0645\u0645 \u0644\u0645 \u0644\u0645\u0627 \u0644\u0645\u0627 \u0644\u0646 \u0644\u0646\u0627 \u0644\u0647 \u0644\u0647\u0627 \u0644\u0648 \u0644\u0648\u0643\u0627\u0644\u0629 \u0644\u0648\u0644\u0627 \u0644\u0648\u0645\u0627 \u0644\u064A \u0644\u0633\u062A \u0644\u0633\u062A \u0644\u0633\u062A\u0645 \u0644\u0633\u062A\u0645\u0627 \u0644\u0633\u062A\u0646 \u0644\u0633\u062A \u0644\u0633\u0646 \u0644\u0639\u0644 \u0644\u0643\u0646 \u0644\u064A\u062A \u0644\u064A\u0633 \u0644\u064A\u0633\u0627 \u0644\u064A\u0633\u062A\u0627 \u0644\u064A\u0633\u062A \u0644\u064A\u0633\u0648\u0627 \u0644\u0633\u0646\u0627 \u0645\u0627 \u0645\u0627\u0627\u0646\u0641\u0643 \u0645\u0627\u0628\u0631\u062D \u0645\u0627\u062F\u0627\u0645 \u0645\u0627\u0630\u0627 \u0645\u0627\u0632\u0627\u0644 \u0645\u0627\u0641\u062A\u0626 \u0645\u0627\u064A\u0648 \u0645\u062A\u0649 \u0645\u062B\u0644 \u0645\u0630 \u0645\u0633\u0627\u0621 \u0645\u0639 \u0645\u0639\u0627\u0630 \u0645\u0642\u0627\u0628\u0644 \u0645\u0643\u0627\u0646\u0643\u0645 \u0645\u0643\u0627\u0646\u0643\u0645\u0627 \u0645\u0643\u0627\u0646\u0643\u0646 \u0645\u0643\u0627\u0646\u0643 \u0645\u0644\u064A\u0627\u0631 \u0645\u0644\u064A\u0648\u0646 \u0645\u0645\u0627 \u0645\u0645\u0646 \u0645\u0646 \u0645\u0646\u0630 \u0645\u0646\u0647\u0627 \u0645\u0647 \u0645\u0647\u0645\u0627 \u0645\u0646 \u0645\u0646 \u0646\u062D\u0646 \u0646\u062D\u0648 \u0646\u0639\u0645 \u0646\u0641\u0633 \u0646\u0641\u0633\u0647 \u0646\u0647\u0627\u064A\u0629 \u0646\u062E \u0646\u0639\u0645\u0627 \u0646\u0639\u0645 \u0647\u0627 \u0647\u0627\u0624\u0645 \u0647\u0627\u0643 \u0647\u0627\u0647\u0646\u0627 \u0647\u0628 \u0647\u0630\u0627 \u0647\u0630\u0647 \u0647\u0643\u0630\u0627 \u0647\u0644 \u0647\u0644\u0645 \u0647\u0644\u0627 \u0647\u0645 \u0647\u0645\u0627 \u0647\u0646 \u0647\u0646\u0627 \u0647\u0646\u0627\u0643 \u0647\u0646\u0627\u0644\u0643 \u0647\u0648 \u0647\u064A \u0647\u064A\u0627 \u0647\u064A\u062A \u0647\u064A\u0627 \u0647\u0624\u0644\u0627\u0621 \u0647\u0627\u062A\u0627\u0646 \u0647\u0627\u062A\u064A\u0646 \u0647\u0627\u062A\u0647 \u0647\u0627\u062A\u064A \u0647\u062C \u0647\u0630\u0627 \u0647\u0630\u0627\u0646 \u0647\u0630\u064A\u0646 \u0647\u0630\u0647 \u0647\u0630\u064A \u0647\u064A\u0647\u0627\u062A \u0648 \u0648\u0627 \u0648\u0627\u062D\u062F \u0648\u0627\u0636\u0627\u0641 \u0648\u0627\u0636\u0627\u0641\u062A \u0648\u0627\u0643\u062F \u0648\u0627\u0646 \u0648\u0627\u0647\u0627 \u0648\u0627\u0648\u0636\u062D \u0648\u0631\u0627\u0621\u0643 \u0648\u0641\u064A \u0648\u0642\u0627\u0644 \u0648\u0642\u0627\u0644\u062A \u0648\u0642\u062F \u0648\u0642\u0641 \u0648\u0643\u0627\u0646 \u0648\u0643\u0627\u0646\u062A \u0648\u0644\u0627 \u0648\u0644\u0645 \u0648\u0645\u0646 \u0648\u0647\u0648 \u0648\u0647\u064A \u0648\u064A\u0643\u0627\u0646 \u0648\u064A \u0648\u0634\u0643\u0627\u0646 \u064A\u0643\u0648\u0646 \u064A\u0645\u0643\u0646 \u064A\u0648\u0645 \u0627\u064A\u0627\u0646".split(" ");
            if (stopWords.indexOf(self2.word) >= 0) {
              return true;
            }
          };
          self2.normalizeHamzaAndAlef = function() {
            self2.word = self2.word.replace("\u0624", "\u0621");
            self2.word = self2.word.replace("\u0626", "\u0621");
            self2.word = self2.word.replace(/([\u0627])\1+/gi, "\u0627");
            return false;
          };
          self2.removeEndTaa = function() {
            if (self2.word.length > 2) {
              self2.word = self2.word.replace(/[\u0627]$/, "");
              self2.word = self2.word.replace("\u0629", "");
              return false;
            } else return true;
          };
          self2.removeStartWaw = function() {
            if (self2.word.length > 3 && self2.word[0] == "\u0648" && self2.word[1] == "\u0648") {
              self2.word = self2.word.slice(1);
            }
            return false;
          };
          self2.removePre432 = function() {
            var word2 = self2.word;
            if (self2.word.length >= 7) {
              var pre4Regex = new RegExp("^(" + self2.pre.pre4.split(" ").join("|") + ")");
              self2.word = self2.word.replace(pre4Regex, "");
            }
            if (self2.word == word2 && self2.word.length >= 6) {
              var pre3Regex = new RegExp("^(" + self2.pre.pre3.split(" ").join("|") + ")");
              self2.word = self2.word.replace(pre3Regex, "");
            }
            if (self2.word == word2 && self2.word.length >= 5) {
              var pre2Regex = new RegExp("^(" + self2.pre.pre2.split(" ").join("|") + ")");
              self2.word = self2.word.replace(pre2Regex, "");
            }
            if (word2 != self2.word) self2.preRemoved = true;
            return false;
          };
          self2.patternCheck = function(pattern) {
            var patternMatch = false;
            for (var i = 0; i < pattern.length; i++) {
              var currentPatternCheck = true;
              for (var j = 0; j < pattern[i].pt.length; j++) {
                var chars = pattern[i].pt[j].c.split(",");
                var charMatch = false;
                chars.forEach(function(el) {
                  if (self2.word[pattern[i].pt[j].l] == el) {
                    charMatch = true;
                  }
                });
                if (!charMatch) {
                  currentPatternCheck = false;
                  break;
                }
              }
              if (currentPatternCheck == true) {
                if (pattern[i].mPt) {
                  var newWord = [];
                  for (var k = 0; k < pattern[i].mPt.length; k++) {
                    if (pattern[i].mPt[k].m != null) {
                      newWord[pattern[i].mPt[k].l] = self2.word[pattern[i].mPt[k].m];
                    } else {
                      newWord[pattern[i].mPt[k].l] = pattern[i].mPt[k].c;
                    }
                  }
                  self2.word = newWord.join("");
                }
                self2.result = true;
                break;
              }
            }
          };
          self2.removePre1 = function() {
            var word2 = self2.word;
            if (self2.preRemoved == false) {
              if (self2.word.length > 3) {
                var pre1Regex = new RegExp("^(" + self2.pre.pre1.split(" ").join("|") + ")");
                self2.word = self2.word.replace(pre1Regex, "");
              }
            }
            if (word2 != self2.word) self2.preRemoved = true;
            return false;
          };
          self2.removeSuf1 = function() {
            var word2 = self2.word;
            if (self2.sufRemoved == false) {
              if (self2.word.length > 3) {
                var suf1Regex = new RegExp("(" + self2.suf.suf1.split(" ").join("|") + ")$");
                self2.word = self2.word.replace(suf1Regex, "");
              }
            }
            if (word2 != self2.word) self2.sufRemoved = true;
            return false;
          };
          self2.removeSuf432 = function() {
            var word2 = self2.word;
            if (self2.word.length >= 6) {
              var suf4Regex = new RegExp("(" + self2.suf.suf4.split(" ").join("|") + ")$");
              self2.word = self2.word.replace(suf4Regex, "");
            }
            if (self2.word == word2 && self2.word.length >= 5) {
              var suf3Regex = new RegExp("(" + self2.suf.suf3.split(" ").join("|") + ")$");
              self2.word = self2.word.replace(suf3Regex, "");
            }
            if (self2.word == word2 && self2.word.length >= 4) {
              var suf2Regex = new RegExp("(" + self2.suf.suf2.split(" ").join("|") + ")$");
              self2.word = self2.word.replace(suf2Regex, "");
            }
            if (word2 != self2.word) self2.sufRemoved = true;
            return false;
          };
          self2.wordCheck = function() {
            var word2 = self2.word;
            var word7Exec = [self2.removeSuf432, self2.removeSuf1, self2.removePre1];
            var counter = 0;
            var patternChecked = false;
            while (self2.word.length >= 7 && !self2.result && counter < word7Exec.length) {
              if (self2.word.length == 7 && !patternChecked) {
                self2.checkPattern73();
                patternChecked = true;
              } else {
                word7Exec[counter]();
                counter++;
                patternChecked = false;
              }
            }
            var word6Exec = [self2.checkPattern63, self2.removeSuf432, self2.removeSuf1, self2.removePre1, self2.checkPattern64];
            counter = 0;
            while (self2.word.length == 6 && !self2.result && counter < word6Exec.length) {
              word6Exec[counter]();
              counter++;
            }
            var word5Exec = [self2.checkPattern53, self2.removeSuf432, self2.removeSuf1, self2.removePre1, self2.checkPattern54];
            counter = 0;
            while (self2.word.length == 5 && !self2.result && counter < word5Exec.length) {
              word5Exec[counter]();
              counter++;
            }
            var word4Exec = [self2.checkPattern43, self2.removeSuf1, self2.removePre1, self2.removeSuf432];
            counter = 0;
            while (self2.word.length == 4 && !self2.result && counter < word4Exec.length) {
              word4Exec[counter]();
              counter++;
            }
            return true;
          };
          self2.checkPattern43 = function() {
            self2.patternCheck(self2.patterns.pt43);
          };
          self2.checkPattern53 = function() {
            self2.patternCheck(self2.patterns.pt53);
          };
          self2.checkPattern54 = function() {
            self2.patternCheck(self2.patterns.pt54);
          };
          self2.checkPattern63 = function() {
            self2.patternCheck(self2.patterns.pt63);
          };
          self2.checkPattern64 = function() {
            self2.patternCheck(self2.patterns.pt64);
          };
          self2.checkPattern73 = function() {
            self2.patternCheck(self2.patterns.pt73);
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
        lunr.Pipeline.registerFunction(lunr.ar.stemmer, "stemmer-ar");
        lunr.ar.stopWordFilter = lunr.generateStopWordFilter("\u060C \u0627\u0636 \u0627\u0645\u064A\u0646 \u0627\u0647 \u0627\u0647\u0627 \u0627\u064A \u0627 \u0627\u0628 \u0627\u062C\u0644 \u0627\u062C\u0645\u0639 \u0627\u062E \u0627\u062E\u0630 \u0627\u0635\u0628\u062D \u0627\u0636\u062D\u0649 \u0627\u0642\u0628\u0644 \u0627\u0642\u0644 \u0627\u0643\u062B\u0631 \u0627\u0644\u0627 \u0627\u0645 \u0627\u0645\u0627 \u0627\u0645\u0627\u0645\u0643 \u0627\u0645\u0627\u0645\u0643 \u0627\u0645\u0633\u0649 \u0627\u0645\u0627 \u0627\u0646 \u0627\u0646\u0627 \u0627\u0646\u062A \u0627\u0646\u062A\u0645 \u0627\u0646\u062A\u0645\u0627 \u0627\u0646\u062A\u0646 \u0627\u0646\u062A \u0627\u0646\u0634\u0627 \u0627\u0646\u0649 \u0627\u0648 \u0627\u0648\u0634\u0643 \u0627\u0648\u0644\u0626\u0643 \u0627\u0648\u0644\u0626\u0643\u0645 \u0627\u0648\u0644\u0627\u0621 \u0627\u0648\u0644\u0627\u0644\u0643 \u0627\u0648\u0647 \u0627\u064A \u0627\u064A\u0627 \u0627\u064A\u0646 \u0627\u064A\u0646\u0645\u0627 \u0627\u064A \u0627\u0646 \u0627\u064A \u0627\u0641 \u0627\u0630 \u0627\u0630\u0627 \u0627\u0630\u0627 \u0627\u0630\u0645\u0627 \u0627\u0630\u0646 \u0627\u0644\u0649 \u0627\u0644\u064A\u0643\u0645 \u0627\u0644\u064A\u0643\u0645\u0627 \u0627\u0644\u064A\u0643\u0646 \u0627\u0644\u064A\u0643 \u0627\u0644\u064A\u0643 \u0627\u0644\u0627 \u0627\u0645\u0627 \u0627\u0646 \u0627\u0646\u0645\u0627 \u0627\u064A \u0627\u064A\u0627\u0643 \u0627\u064A\u0627\u0643\u0645 \u0627\u064A\u0627\u0643\u0645\u0627 \u0627\u064A\u0627\u0643\u0646 \u0627\u064A\u0627\u0646\u0627 \u0627\u064A\u0627\u0647 \u0627\u064A\u0627\u0647\u0627 \u0627\u064A\u0627\u0647\u0645 \u0627\u064A\u0627\u0647\u0645\u0627 \u0627\u064A\u0627\u0647\u0646 \u0627\u064A\u0627\u064A \u0627\u064A\u0647 \u0627\u0646 \u0627 \u0627\u0628\u062A\u062F\u0627 \u0627\u062B\u0631 \u0627\u062C\u0644 \u0627\u062D\u062F \u0627\u062E\u0631\u0649 \u0627\u062E\u0644\u0648\u0644\u0642 \u0627\u0630\u0627 \u0627\u0631\u0628\u0639\u0629 \u0627\u0631\u062A\u062F \u0627\u0633\u062A\u062D\u0627\u0644 \u0627\u0637\u0627\u0631 \u0627\u0639\u0627\u062F\u0629 \u0627\u0639\u0644\u0646\u062A \u0627\u0641 \u0627\u0643\u062B\u0631 \u0627\u0643\u062F \u0627\u0644\u0627\u0644\u0627\u0621 \u0627\u0644\u0627\u0644\u0649 \u0627\u0644\u0627 \u0627\u0644\u0627\u062E\u064A\u0631\u0629 \u0627\u0644\u0627\u0646 \u0627\u0644\u0627\u0648\u0644 \u0627\u0644\u0627\u0648\u0644\u0649 \u0627\u0644\u062A\u0649 \u0627\u0644\u062A\u064A \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0630\u0627\u062A\u064A \u0627\u0644\u0630\u0649 \u0627\u0644\u0630\u064A \u0627\u0644\u0630\u064A\u0646 \u0627\u0644\u0633\u0627\u0628\u0642 \u0627\u0644\u0641 \u0627\u0644\u0644\u0627\u0626\u064A \u0627\u0644\u0644\u0627\u062A\u064A \u0627\u0644\u0644\u062A\u0627\u0646 \u0627\u0644\u0644\u062A\u064A\u0627 \u0627\u0644\u0644\u062A\u064A\u0646 \u0627\u0644\u0644\u0630\u0627\u0646 \u0627\u0644\u0644\u0630\u064A\u0646 \u0627\u0644\u0644\u0648\u0627\u062A\u064A \u0627\u0644\u0645\u0627\u0636\u064A \u0627\u0644\u0645\u0642\u0628\u0644 \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0649 \u0627\u0644\u064A\u0648\u0645 \u0627\u0645\u0627 \u0627\u0645\u0627\u0645 \u0627\u0645\u0633 \u0627\u0646 \u0627\u0646\u0628\u0631\u0649 \u0627\u0646\u0642\u0644\u0628 \u0627\u0646\u0647 \u0627\u0646\u0647\u0627 \u0627\u0648 \u0627\u0648\u0644 \u0627\u064A \u0627\u064A\u0627\u0631 \u0627\u064A\u0627\u0645 \u0627\u064A\u0636\u0627 \u0628 \u0628\u0627\u062A \u0628\u0627\u0633\u0645 \u0628\u0627\u0646 \u0628\u062E \u0628\u0631\u0633 \u0628\u0633\u0628\u0628 \u0628\u0633 \u0628\u0634\u0643\u0644 \u0628\u0636\u0639 \u0628\u0637\u0627\u0646 \u0628\u0639\u062F \u0628\u0639\u0636 \u0628\u0643 \u0628\u0643\u0645 \u0628\u0643\u0645\u0627 \u0628\u0643\u0646 \u0628\u0644 \u0628\u0644\u0649 \u0628\u0645\u0627 \u0628\u0645\u0627\u0630\u0627 \u0628\u0645\u0646 \u0628\u0646 \u0628\u0646\u0627 \u0628\u0647 \u0628\u0647\u0627 \u0628\u064A \u0628\u064A\u062F \u0628\u064A\u0646 \u0628\u0633 \u0628\u0644\u0647 \u0628\u0626\u0633 \u062A\u0627\u0646 \u062A\u0627\u0646\u0643 \u062A\u0628\u062F\u0644 \u062A\u062C\u0627\u0647 \u062A\u062D\u0648\u0644 \u062A\u0644\u0642\u0627\u0621 \u062A\u0644\u0643 \u062A\u0644\u0643\u0645 \u062A\u0644\u0643\u0645\u0627 \u062A\u0645 \u062A\u064A\u0646\u0643 \u062A\u064A\u0646 \u062A\u0647 \u062A\u064A \u062B\u0644\u0627\u062B\u0629 \u062B\u0645 \u062B\u0645 \u062B\u0645\u0629 \u062B\u0645 \u062C\u0639\u0644 \u062C\u0644\u0644 \u062C\u0645\u064A\u0639 \u062C\u064A\u0631 \u062D\u0627\u0631 \u062D\u0627\u0634\u0627 \u062D\u0627\u0644\u064A\u0627 \u062D\u0627\u064A \u062D\u062A\u0649 \u062D\u0631\u0649 \u062D\u0633\u0628 \u062D\u0645 \u062D\u0648\u0627\u0644\u0649 \u062D\u0648\u0644 \u062D\u064A\u062B \u062D\u064A\u062B\u0645\u0627 \u062D\u064A\u0646 \u062D\u064A \u062D\u0628\u0630\u0627 \u062D\u062A\u0649 \u062D\u0630\u0627\u0631 \u062E\u0644\u0627 \u062E\u0644\u0627\u0644 \u062F\u0648\u0646 \u062F\u0648\u0646\u0643 \u0630\u0627 \u0630\u0627\u062A \u0630\u0627\u0643 \u0630\u0627\u0646\u0643 \u0630\u0627\u0646 \u0630\u0644\u0643 \u0630\u0644\u0643\u0645 \u0630\u0644\u0643\u0645\u0627 \u0630\u0644\u0643\u0646 \u0630\u0648 \u0630\u0648\u0627 \u0630\u0648\u0627\u062A\u0627 \u0630\u0648\u0627\u062A\u064A \u0630\u064A\u062A \u0630\u064A\u0646\u0643 \u0630\u064A\u0646 \u0630\u0647 \u0630\u064A \u0631\u0627\u062D \u0631\u062C\u0639 \u0631\u0648\u064A\u062F\u0643 \u0631\u064A\u062B \u0631\u0628 \u0632\u064A\u0627\u0631\u0629 \u0633\u0628\u062D\u0627\u0646 \u0633\u0631\u0639\u0627\u0646 \u0633\u0646\u0629 \u0633\u0646\u0648\u0627\u062A \u0633\u0648\u0641 \u0633\u0648\u0649 \u0633\u0627\u0621 \u0633\u0627\u0621\u0645\u0627 \u0634\u0628\u0647 \u0634\u062E\u0635\u0627 \u0634\u0631\u0639 \u0634\u062A\u0627\u0646 \u0635\u0627\u0631 \u0635\u0628\u0627\u062D \u0635\u0641\u0631 \u0635\u0647 \u0635\u0647 \u0636\u062F \u0636\u0645\u0646 \u0637\u0627\u0642 \u0637\u0627\u0644\u0645\u0627 \u0637\u0641\u0642 \u0637\u0642 \u0638\u0644 \u0639\u0627\u062F \u0639\u0627\u0645 \u0639\u0627\u0645\u0627 \u0639\u0627\u0645\u0629 \u0639\u062F\u0627 \u0639\u062F\u0629 \u0639\u062F\u062F \u0639\u062F\u0645 \u0639\u0633\u0649 \u0639\u0634\u0631 \u0639\u0634\u0631\u0629 \u0639\u0644\u0642 \u0639\u0644\u0649 \u0639\u0644\u064A\u0643 \u0639\u0644\u064A\u0647 \u0639\u0644\u064A\u0647\u0627 \u0639\u0644 \u0639\u0646 \u0639\u0646\u062F \u0639\u0646\u062F\u0645\u0627 \u0639\u0648\u0636 \u0639\u064A\u0646 \u0639\u062F\u0633 \u0639\u0645\u0627 \u063A\u062F\u0627 \u063A\u064A\u0631  \u0641 \u0641\u0627\u0646 \u0641\u0644\u0627\u0646 \u0641\u0648 \u0641\u0649 \u0641\u064A \u0641\u064A\u0645 \u0641\u064A\u0645\u0627 \u0641\u064A\u0647 \u0641\u064A\u0647\u0627 \u0642\u0627\u0644 \u0642\u0627\u0645 \u0642\u0628\u0644 \u0642\u062F \u0642\u0637 \u0642\u0644\u0645\u0627 \u0642\u0648\u0629 \u0643\u0627\u0646\u0645\u0627 \u0643\u0627\u064A\u0646 \u0643\u0627\u064A \u0643\u0627\u064A\u0646 \u0643\u0627\u062F \u0643\u0627\u0646 \u0643\u0627\u0646\u062A \u0643\u0630\u0627 \u0643\u0630\u0644\u0643 \u0643\u0631\u0628 \u0643\u0644 \u0643\u0644\u0627 \u0643\u0644\u0627\u0647\u0645\u0627 \u0643\u0644\u062A\u0627 \u0643\u0644\u0645 \u0643\u0644\u064A\u0643\u0645\u0627 \u0643\u0644\u064A\u0647\u0645\u0627 \u0643\u0644\u0645\u0627 \u0643\u0644\u0627 \u0643\u0645 \u0643\u0645\u0627 \u0643\u064A \u0643\u064A\u062A \u0643\u064A\u0641 \u0643\u064A\u0641\u0645\u0627 \u0643\u0627\u0646 \u0643\u062E \u0644\u0626\u0646 \u0644\u0627 \u0644\u0627\u062A \u0644\u0627\u0633\u064A\u0645\u0627 \u0644\u062F\u0646 \u0644\u062F\u0649 \u0644\u0639\u0645\u0631 \u0644\u0642\u0627\u0621 \u0644\u0643 \u0644\u0643\u0645 \u0644\u0643\u0645\u0627 \u0644\u0643\u0646 \u0644\u0643\u0646\u0645\u0627 \u0644\u0643\u064A \u0644\u0643\u064A\u0644\u0627 \u0644\u0644\u0627\u0645\u0645 \u0644\u0645 \u0644\u0645\u0627 \u0644\u0645\u0627 \u0644\u0646 \u0644\u0646\u0627 \u0644\u0647 \u0644\u0647\u0627 \u0644\u0648 \u0644\u0648\u0643\u0627\u0644\u0629 \u0644\u0648\u0644\u0627 \u0644\u0648\u0645\u0627 \u0644\u064A \u0644\u0633\u062A \u0644\u0633\u062A \u0644\u0633\u062A\u0645 \u0644\u0633\u062A\u0645\u0627 \u0644\u0633\u062A\u0646 \u0644\u0633\u062A \u0644\u0633\u0646 \u0644\u0639\u0644 \u0644\u0643\u0646 \u0644\u064A\u062A \u0644\u064A\u0633 \u0644\u064A\u0633\u0627 \u0644\u064A\u0633\u062A\u0627 \u0644\u064A\u0633\u062A \u0644\u064A\u0633\u0648\u0627 \u0644\u0633\u0646\u0627 \u0645\u0627 \u0645\u0627\u0627\u0646\u0641\u0643 \u0645\u0627\u0628\u0631\u062D \u0645\u0627\u062F\u0627\u0645 \u0645\u0627\u0630\u0627 \u0645\u0627\u0632\u0627\u0644 \u0645\u0627\u0641\u062A\u0626 \u0645\u0627\u064A\u0648 \u0645\u062A\u0649 \u0645\u062B\u0644 \u0645\u0630 \u0645\u0633\u0627\u0621 \u0645\u0639 \u0645\u0639\u0627\u0630 \u0645\u0642\u0627\u0628\u0644 \u0645\u0643\u0627\u0646\u0643\u0645 \u0645\u0643\u0627\u0646\u0643\u0645\u0627 \u0645\u0643\u0627\u0646\u0643\u0646 \u0645\u0643\u0627\u0646\u0643 \u0645\u0644\u064A\u0627\u0631 \u0645\u0644\u064A\u0648\u0646 \u0645\u0645\u0627 \u0645\u0645\u0646 \u0645\u0646 \u0645\u0646\u0630 \u0645\u0646\u0647\u0627 \u0645\u0647 \u0645\u0647\u0645\u0627 \u0645\u0646 \u0645\u0646 \u0646\u062D\u0646 \u0646\u062D\u0648 \u0646\u0639\u0645 \u0646\u0641\u0633 \u0646\u0641\u0633\u0647 \u0646\u0647\u0627\u064A\u0629 \u0646\u062E \u0646\u0639\u0645\u0627 \u0646\u0639\u0645 \u0647\u0627 \u0647\u0627\u0624\u0645 \u0647\u0627\u0643 \u0647\u0627\u0647\u0646\u0627 \u0647\u0628 \u0647\u0630\u0627 \u0647\u0630\u0647 \u0647\u0643\u0630\u0627 \u0647\u0644 \u0647\u0644\u0645 \u0647\u0644\u0627 \u0647\u0645 \u0647\u0645\u0627 \u0647\u0646 \u0647\u0646\u0627 \u0647\u0646\u0627\u0643 \u0647\u0646\u0627\u0644\u0643 \u0647\u0648 \u0647\u064A \u0647\u064A\u0627 \u0647\u064A\u062A \u0647\u064A\u0627 \u0647\u0624\u0644\u0627\u0621 \u0647\u0627\u062A\u0627\u0646 \u0647\u0627\u062A\u064A\u0646 \u0647\u0627\u062A\u0647 \u0647\u0627\u062A\u064A \u0647\u062C \u0647\u0630\u0627 \u0647\u0630\u0627\u0646 \u0647\u0630\u064A\u0646 \u0647\u0630\u0647 \u0647\u0630\u064A \u0647\u064A\u0647\u0627\u062A \u0648\u0627 \u0648\u0627\u062D\u062F \u0648\u0627\u0636\u0627\u0641 \u0648\u0627\u0636\u0627\u0641\u062A \u0648\u0627\u0643\u062F \u0648\u0627\u0646 \u0648\u0627\u0647\u0627 \u0648\u0627\u0648\u0636\u062D \u0648\u0631\u0627\u0621\u0643 \u0648\u0641\u064A \u0648\u0642\u0627\u0644 \u0648\u0642\u0627\u0644\u062A \u0648\u0642\u062F \u0648\u0642\u0641 \u0648\u0643\u0627\u0646 \u0648\u0643\u0627\u0646\u062A \u0648\u0644\u0627 \u0648\u0644\u0645 \u0648\u0645\u0646 \u0648\u0647\u0648 \u0648\u0647\u064A \u0648\u064A\u0643\u0627\u0646 \u0648\u064A \u0648\u0634\u0643\u0627\u0646 \u064A\u0643\u0648\u0646 \u064A\u0645\u0643\u0646 \u064A\u0648\u0645 \u0627\u064A\u0627\u0646".split(" "));
        lunr.Pipeline.registerFunction(lunr.ar.stopWordFilter, "stopWordFilter-ar");
      };
    });
  }
});

// src/worker/langs/ar.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_ar());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "ar");
  return lunr.ar;
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

lunr-languages/lunr.ar.js:
  (*!
   * Lunr languages, `Arabic` language
   * https://github.com/MihaiValentin/lunr-languages
   *
   * Copyright 2018, Dalia Al-Shahrabi
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
