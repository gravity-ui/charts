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

// node_modules/lunr-languages/lunr.fi.js
var require_lunr_fi = __commonJS({
  "node_modules/lunr-languages/lunr.fi.js"(exports, module2) {
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
        lunr.fi = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.fi.trimmer,
            lunr.fi.stopWordFilter,
            lunr.fi.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.fi.stemmer);
          }
        };
        lunr.fi.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
        lunr.fi.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.fi.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.fi.trimmer, "trimmer-fi");
        lunr.fi.stemmer = function() {
          var Among = lunr.stemmerSupport.Among, SnowballProgram = lunr.stemmerSupport.SnowballProgram, st = new function FinnishStemmer() {
            var a_0 = [
              new Among("pa", -1, 1),
              new Among("sti", -1, 2),
              new Among("kaan", -1, 1),
              new Among("han", -1, 1),
              new Among("kin", -1, 1),
              new Among("h\xE4n", -1, 1),
              new Among("k\xE4\xE4n", -1, 1),
              new Among("ko", -1, 1),
              new Among("p\xE4", -1, 1),
              new Among("k\xF6", -1, 1)
            ], a_1 = [
              new Among("lla", -1, -1),
              new Among("na", -1, -1),
              new Among("ssa", -1, -1),
              new Among("ta", -1, -1),
              new Among("lta", 3, -1),
              new Among("sta", 3, -1)
            ], a_2 = [
              new Among("ll\xE4", -1, -1),
              new Among("n\xE4", -1, -1),
              new Among("ss\xE4", -1, -1),
              new Among("t\xE4", -1, -1),
              new Among("lt\xE4", 3, -1),
              new Among("st\xE4", 3, -1)
            ], a_3 = [
              new Among("lle", -1, -1),
              new Among("ine", -1, -1)
            ], a_4 = [
              new Among("nsa", -1, 3),
              new Among("mme", -1, 3),
              new Among("nne", -1, 3),
              new Among("ni", -1, 2),
              new Among("si", -1, 1),
              new Among("an", -1, 4),
              new Among("en", -1, 6),
              new Among("\xE4n", -1, 5),
              new Among("ns\xE4", -1, 3)
            ], a_5 = [
              new Among("aa", -1, -1),
              new Among("ee", -1, -1),
              new Among("ii", -1, -1),
              new Among("oo", -1, -1),
              new Among("uu", -1, -1),
              new Among("\xE4\xE4", -1, -1),
              new Among("\xF6\xF6", -1, -1)
            ], a_6 = [
              new Among("a", -1, 8),
              new Among("lla", 0, -1),
              new Among("na", 0, -1),
              new Among("ssa", 0, -1),
              new Among("ta", 0, -1),
              new Among("lta", 4, -1),
              new Among("sta", 4, -1),
              new Among("tta", 4, 9),
              new Among("lle", -1, -1),
              new Among("ine", -1, -1),
              new Among("ksi", -1, -1),
              new Among("n", -1, 7),
              new Among("han", 11, 1),
              new Among("den", 11, -1, r_VI),
              new Among("seen", 11, -1, r_LONG),
              new Among("hen", 11, 2),
              new Among("tten", 11, -1, r_VI),
              new Among("hin", 11, 3),
              new Among("siin", 11, -1, r_VI),
              new Among("hon", 11, 4),
              new Among("h\xE4n", 11, 5),
              new Among("h\xF6n", 11, 6),
              new Among("\xE4", -1, 8),
              new Among("ll\xE4", 22, -1),
              new Among("n\xE4", 22, -1),
              new Among("ss\xE4", 22, -1),
              new Among("t\xE4", 22, -1),
              new Among("lt\xE4", 26, -1),
              new Among("st\xE4", 26, -1),
              new Among("tt\xE4", 26, 9)
            ], a_7 = [
              new Among("eja", -1, -1),
              new Among("mma", -1, 1),
              new Among("imma", 1, -1),
              new Among("mpa", -1, 1),
              new Among("impa", 3, -1),
              new Among("mmi", -1, 1),
              new Among("immi", 5, -1),
              new Among("mpi", -1, 1),
              new Among("impi", 7, -1),
              new Among("ej\xE4", -1, -1),
              new Among("mm\xE4", -1, 1),
              new Among("imm\xE4", 10, -1),
              new Among("mp\xE4", -1, 1),
              new Among("imp\xE4", 12, -1)
            ], a_8 = [
              new Among("i", -1, -1),
              new Among("j", -1, -1)
            ], a_9 = [
              new Among("mma", -1, 1),
              new Among("imma", 0, -1)
            ], g_AEI = [
              17,
              1,
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
              0,
              8
            ], g_V1 = [
              17,
              65,
              16,
              1,
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
              8,
              0,
              32
            ], g_V2 = [
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
              8,
              0,
              32
            ], g_particle_end = [
              17,
              97,
              24,
              1,
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
              8,
              0,
              32
            ], B_ending_removed, S_x, I_p2, I_p1, sbp = new SnowballProgram();
            this.setCurrent = function(word) {
              sbp.setCurrent(word);
            };
            this.getCurrent = function() {
              return sbp.getCurrent();
            };
            function r_mark_regions() {
              I_p1 = sbp.limit;
              I_p2 = I_p1;
              if (!habr1()) {
                I_p1 = sbp.cursor;
                if (!habr1())
                  I_p2 = sbp.cursor;
              }
            }
            function habr1() {
              var v_1;
              while (true) {
                v_1 = sbp.cursor;
                if (sbp.in_grouping(g_V1, 97, 246))
                  break;
                sbp.cursor = v_1;
                if (v_1 >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              sbp.cursor = v_1;
              while (!sbp.out_grouping(g_V1, 97, 246)) {
                if (sbp.cursor >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              return false;
            }
            function r_R2() {
              return I_p2 <= sbp.cursor;
            }
            function r_particle_etc() {
              var among_var, v_1;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_0, 10);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  sbp.limit_backward = v_1;
                  switch (among_var) {
                    case 1:
                      if (!sbp.in_grouping_b(g_particle_end, 97, 246))
                        return;
                      break;
                    case 2:
                      if (!r_R2())
                        return;
                      break;
                  }
                  sbp.slice_del();
                } else
                  sbp.limit_backward = v_1;
              }
            }
            function r_possessive() {
              var among_var, v_1, v_2;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_4, 9);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  sbp.limit_backward = v_1;
                  switch (among_var) {
                    case 1:
                      v_2 = sbp.limit - sbp.cursor;
                      if (!sbp.eq_s_b(1, "k")) {
                        sbp.cursor = sbp.limit - v_2;
                        sbp.slice_del();
                      }
                      break;
                    case 2:
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      if (sbp.eq_s_b(3, "kse")) {
                        sbp.bra = sbp.cursor;
                        sbp.slice_from("ksi");
                      }
                      break;
                    case 3:
                      sbp.slice_del();
                      break;
                    case 4:
                      if (sbp.find_among_b(a_1, 6))
                        sbp.slice_del();
                      break;
                    case 5:
                      if (sbp.find_among_b(a_2, 6))
                        sbp.slice_del();
                      break;
                    case 6:
                      if (sbp.find_among_b(a_3, 2))
                        sbp.slice_del();
                      break;
                  }
                } else
                  sbp.limit_backward = v_1;
              }
            }
            function r_LONG() {
              return sbp.find_among_b(a_5, 7);
            }
            function r_VI() {
              return sbp.eq_s_b(1, "i") && sbp.in_grouping_b(g_V2, 97, 246);
            }
            function r_case_ending() {
              var among_var, v_1, v_2;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_6, 30);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  sbp.limit_backward = v_1;
                  switch (among_var) {
                    case 1:
                      if (!sbp.eq_s_b(1, "a"))
                        return;
                      break;
                    case 2:
                    case 9:
                      if (!sbp.eq_s_b(1, "e"))
                        return;
                      break;
                    case 3:
                      if (!sbp.eq_s_b(1, "i"))
                        return;
                      break;
                    case 4:
                      if (!sbp.eq_s_b(1, "o"))
                        return;
                      break;
                    case 5:
                      if (!sbp.eq_s_b(1, "\xE4"))
                        return;
                      break;
                    case 6:
                      if (!sbp.eq_s_b(1, "\xF6"))
                        return;
                      break;
                    case 7:
                      v_2 = sbp.limit - sbp.cursor;
                      if (!r_LONG()) {
                        sbp.cursor = sbp.limit - v_2;
                        if (!sbp.eq_s_b(2, "ie")) {
                          sbp.cursor = sbp.limit - v_2;
                          break;
                        }
                      }
                      sbp.cursor = sbp.limit - v_2;
                      if (sbp.cursor <= sbp.limit_backward) {
                        sbp.cursor = sbp.limit - v_2;
                        break;
                      }
                      sbp.cursor--;
                      sbp.bra = sbp.cursor;
                      break;
                    case 8:
                      if (!sbp.in_grouping_b(g_V1, 97, 246) || !sbp.out_grouping_b(g_V1, 97, 246))
                        return;
                      break;
                  }
                  sbp.slice_del();
                  B_ending_removed = true;
                } else
                  sbp.limit_backward = v_1;
              }
            }
            function r_other_endings() {
              var among_var, v_1, v_2;
              if (sbp.cursor >= I_p2) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p2;
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_7, 14);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  sbp.limit_backward = v_1;
                  if (among_var == 1) {
                    v_2 = sbp.limit - sbp.cursor;
                    if (sbp.eq_s_b(2, "po"))
                      return;
                    sbp.cursor = sbp.limit - v_2;
                  }
                  sbp.slice_del();
                } else
                  sbp.limit_backward = v_1;
              }
            }
            function r_i_plural() {
              var v_1;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                sbp.ket = sbp.cursor;
                if (sbp.find_among_b(a_8, 2)) {
                  sbp.bra = sbp.cursor;
                  sbp.limit_backward = v_1;
                  sbp.slice_del();
                } else
                  sbp.limit_backward = v_1;
              }
            }
            function r_t_plural() {
              var among_var, v_1, v_2, v_3, v_4, v_5;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(1, "t")) {
                  sbp.bra = sbp.cursor;
                  v_2 = sbp.limit - sbp.cursor;
                  if (sbp.in_grouping_b(g_V1, 97, 246)) {
                    sbp.cursor = sbp.limit - v_2;
                    sbp.slice_del();
                    sbp.limit_backward = v_1;
                    v_3 = sbp.limit - sbp.cursor;
                    if (sbp.cursor >= I_p2) {
                      sbp.cursor = I_p2;
                      v_4 = sbp.limit_backward;
                      sbp.limit_backward = sbp.cursor;
                      sbp.cursor = sbp.limit - v_3;
                      sbp.ket = sbp.cursor;
                      among_var = sbp.find_among_b(a_9, 2);
                      if (among_var) {
                        sbp.bra = sbp.cursor;
                        sbp.limit_backward = v_4;
                        if (among_var == 1) {
                          v_5 = sbp.limit - sbp.cursor;
                          if (sbp.eq_s_b(2, "po"))
                            return;
                          sbp.cursor = sbp.limit - v_5;
                        }
                        sbp.slice_del();
                        return;
                      }
                    }
                  }
                }
                sbp.limit_backward = v_1;
              }
            }
            function r_tidy() {
              var v_1, v_2, v_3, v_4;
              if (sbp.cursor >= I_p1) {
                v_1 = sbp.limit_backward;
                sbp.limit_backward = I_p1;
                v_2 = sbp.limit - sbp.cursor;
                if (r_LONG()) {
                  sbp.cursor = sbp.limit - v_2;
                  sbp.ket = sbp.cursor;
                  if (sbp.cursor > sbp.limit_backward) {
                    sbp.cursor--;
                    sbp.bra = sbp.cursor;
                    sbp.slice_del();
                  }
                }
                sbp.cursor = sbp.limit - v_2;
                sbp.ket = sbp.cursor;
                if (sbp.in_grouping_b(g_AEI, 97, 228)) {
                  sbp.bra = sbp.cursor;
                  if (sbp.out_grouping_b(g_V1, 97, 246))
                    sbp.slice_del();
                }
                sbp.cursor = sbp.limit - v_2;
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(1, "j")) {
                  sbp.bra = sbp.cursor;
                  v_3 = sbp.limit - sbp.cursor;
                  if (!sbp.eq_s_b(1, "o")) {
                    sbp.cursor = sbp.limit - v_3;
                    if (sbp.eq_s_b(1, "u"))
                      sbp.slice_del();
                  } else
                    sbp.slice_del();
                }
                sbp.cursor = sbp.limit - v_2;
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(1, "o")) {
                  sbp.bra = sbp.cursor;
                  if (sbp.eq_s_b(1, "j"))
                    sbp.slice_del();
                }
                sbp.cursor = sbp.limit - v_2;
                sbp.limit_backward = v_1;
                while (true) {
                  v_4 = sbp.limit - sbp.cursor;
                  if (sbp.out_grouping_b(g_V1, 97, 246)) {
                    sbp.cursor = sbp.limit - v_4;
                    break;
                  }
                  sbp.cursor = sbp.limit - v_4;
                  if (sbp.cursor <= sbp.limit_backward)
                    return;
                  sbp.cursor--;
                }
                sbp.ket = sbp.cursor;
                if (sbp.cursor > sbp.limit_backward) {
                  sbp.cursor--;
                  sbp.bra = sbp.cursor;
                  S_x = sbp.slice_to();
                  if (sbp.eq_v_b(S_x))
                    sbp.slice_del();
                }
              }
            }
            this.stem = function() {
              var v_1 = sbp.cursor;
              r_mark_regions();
              B_ending_removed = false;
              sbp.limit_backward = v_1;
              sbp.cursor = sbp.limit;
              r_particle_etc();
              sbp.cursor = sbp.limit;
              r_possessive();
              sbp.cursor = sbp.limit;
              r_case_ending();
              sbp.cursor = sbp.limit;
              r_other_endings();
              sbp.cursor = sbp.limit;
              if (B_ending_removed) {
                r_i_plural();
                sbp.cursor = sbp.limit;
              } else {
                sbp.cursor = sbp.limit;
                r_t_plural();
                sbp.cursor = sbp.limit;
              }
              r_tidy();
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
        lunr.Pipeline.registerFunction(lunr.fi.stemmer, "stemmer-fi");
        lunr.fi.stopWordFilter = lunr.generateStopWordFilter("ei eiv\xE4t emme en et ette ett\xE4 he heid\xE4n heid\xE4t heihin heille heill\xE4 heilt\xE4 heiss\xE4 heist\xE4 heit\xE4 h\xE4n h\xE4neen h\xE4nelle h\xE4nell\xE4 h\xE4nelt\xE4 h\xE4nen h\xE4ness\xE4 h\xE4nest\xE4 h\xE4net h\xE4nt\xE4 itse ja johon joiden joihin joiksi joilla joille joilta joina joissa joista joita joka joksi jolla jolle jolta jona jonka jos jossa josta jota jotka kanssa keiden keihin keiksi keille keill\xE4 keilt\xE4 kein\xE4 keiss\xE4 keist\xE4 keit\xE4 keneen keneksi kenelle kenell\xE4 kenelt\xE4 kenen kenen\xE4 keness\xE4 kenest\xE4 kenet ketk\xE4 ketk\xE4 ket\xE4 koska kuin kuka kun me meid\xE4n meid\xE4t meihin meille meill\xE4 meilt\xE4 meiss\xE4 meist\xE4 meit\xE4 mihin miksi mik\xE4 mille mill\xE4 milt\xE4 mink\xE4 mink\xE4 minua minulla minulle minulta minun minussa minusta minut minuun min\xE4 min\xE4 miss\xE4 mist\xE4 mitk\xE4 mit\xE4 mukaan mutta ne niiden niihin niiksi niille niill\xE4 niilt\xE4 niin niin niin\xE4 niiss\xE4 niist\xE4 niit\xE4 noiden noihin noiksi noilla noille noilta noin noina noissa noista noita nuo nyt n\xE4iden n\xE4ihin n\xE4iksi n\xE4ille n\xE4ill\xE4 n\xE4ilt\xE4 n\xE4in\xE4 n\xE4iss\xE4 n\xE4ist\xE4 n\xE4it\xE4 n\xE4m\xE4 ole olemme olen olet olette oli olimme olin olisi olisimme olisin olisit olisitte olisivat olit olitte olivat olla olleet ollut on ovat poikki se sek\xE4 sen siihen siin\xE4 siit\xE4 siksi sille sill\xE4 sill\xE4 silt\xE4 sinua sinulla sinulle sinulta sinun sinussa sinusta sinut sinuun sin\xE4 sin\xE4 sit\xE4 tai te teid\xE4n teid\xE4t teihin teille teill\xE4 teilt\xE4 teiss\xE4 teist\xE4 teit\xE4 tuo tuohon tuoksi tuolla tuolle tuolta tuon tuona tuossa tuosta tuota t\xE4h\xE4n t\xE4ksi t\xE4lle t\xE4ll\xE4 t\xE4lt\xE4 t\xE4m\xE4 t\xE4m\xE4n t\xE4n\xE4 t\xE4ss\xE4 t\xE4st\xE4 t\xE4t\xE4 vaan vai vaikka yli".split(" "));
        lunr.Pipeline.registerFunction(lunr.fi.stopWordFilter, "stopWordFilter-fi");
      };
    });
  }
});

// src/worker/langs/fi.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_fi());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "fi");
  return lunr.fi;
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

lunr-languages/lunr.fi.js:
  (*!
   * Lunr languages, `Finnish` language
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
