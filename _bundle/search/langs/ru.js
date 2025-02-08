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

// node_modules/lunr-languages/lunr.ru.js
var require_lunr_ru = __commonJS({
  "node_modules/lunr-languages/lunr.ru.js"(exports, module2) {
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
        lunr.ru = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.ru.trimmer,
            lunr.ru.stopWordFilter,
            lunr.ru.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.ru.stemmer);
          }
        };
        lunr.ru.wordCharacters = "\u0400-\u0484\u0487-\u052F\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F";
        lunr.ru.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.ru.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.ru.trimmer, "trimmer-ru");
        lunr.ru.stemmer = function() {
          var Among = lunr.stemmerSupport.Among, SnowballProgram = lunr.stemmerSupport.SnowballProgram, st = new function RussianStemmer() {
            var a_0 = [
              new Among("\u0432", -1, 1),
              new Among("\u0438\u0432", 0, 2),
              new Among("\u044B\u0432", 0, 2),
              new Among("\u0432\u0448\u0438", -1, 1),
              new Among("\u0438\u0432\u0448\u0438", 3, 2),
              new Among("\u044B\u0432\u0448\u0438", 3, 2),
              new Among("\u0432\u0448\u0438\u0441\u044C", -1, 1),
              new Among("\u0438\u0432\u0448\u0438\u0441\u044C", 6, 2),
              new Among("\u044B\u0432\u0448\u0438\u0441\u044C", 6, 2)
            ], a_1 = [
              new Among("\u0435\u0435", -1, 1),
              new Among("\u0438\u0435", -1, 1),
              new Among("\u043E\u0435", -1, 1),
              new Among("\u044B\u0435", -1, 1),
              new Among("\u0438\u043C\u0438", -1, 1),
              new Among("\u044B\u043C\u0438", -1, 1),
              new Among("\u0435\u0439", -1, 1),
              new Among("\u0438\u0439", -1, 1),
              new Among("\u043E\u0439", -1, 1),
              new Among("\u044B\u0439", -1, 1),
              new Among("\u0435\u043C", -1, 1),
              new Among("\u0438\u043C", -1, 1),
              new Among("\u043E\u043C", -1, 1),
              new Among("\u044B\u043C", -1, 1),
              new Among("\u0435\u0433\u043E", -1, 1),
              new Among("\u043E\u0433\u043E", -1, 1),
              new Among("\u0435\u043C\u0443", -1, 1),
              new Among("\u043E\u043C\u0443", -1, 1),
              new Among("\u0438\u0445", -1, 1),
              new Among("\u044B\u0445", -1, 1),
              new Among("\u0435\u044E", -1, 1),
              new Among("\u043E\u044E", -1, 1),
              new Among("\u0443\u044E", -1, 1),
              new Among("\u044E\u044E", -1, 1),
              new Among("\u0430\u044F", -1, 1),
              new Among("\u044F\u044F", -1, 1)
            ], a_2 = [
              new Among("\u0435\u043C", -1, 1),
              new Among("\u043D\u043D", -1, 1),
              new Among("\u0432\u0448", -1, 1),
              new Among("\u0438\u0432\u0448", 2, 2),
              new Among("\u044B\u0432\u0448", 2, 2),
              new Among("\u0449", -1, 1),
              new Among("\u044E\u0449", 5, 1),
              new Among("\u0443\u044E\u0449", 6, 2)
            ], a_3 = [
              new Among("\u0441\u044C", -1, 1),
              new Among("\u0441\u044F", -1, 1)
            ], a_4 = [
              new Among("\u043B\u0430", -1, 1),
              new Among("\u0438\u043B\u0430", 0, 2),
              new Among("\u044B\u043B\u0430", 0, 2),
              new Among("\u043D\u0430", -1, 1),
              new Among("\u0435\u043D\u0430", 3, 2),
              new Among("\u0435\u0442\u0435", -1, 1),
              new Among("\u0438\u0442\u0435", -1, 2),
              new Among("\u0439\u0442\u0435", -1, 1),
              new Among("\u0435\u0439\u0442\u0435", 7, 2),
              new Among("\u0443\u0439\u0442\u0435", 7, 2),
              new Among("\u043B\u0438", -1, 1),
              new Among("\u0438\u043B\u0438", 10, 2),
              new Among("\u044B\u043B\u0438", 10, 2),
              new Among("\u0439", -1, 1),
              new Among("\u0435\u0439", 13, 2),
              new Among("\u0443\u0439", 13, 2),
              new Among("\u043B", -1, 1),
              new Among("\u0438\u043B", 16, 2),
              new Among("\u044B\u043B", 16, 2),
              new Among("\u0435\u043C", -1, 1),
              new Among("\u0438\u043C", -1, 2),
              new Among("\u044B\u043C", -1, 2),
              new Among("\u043D", -1, 1),
              new Among("\u0435\u043D", 22, 2),
              new Among("\u043B\u043E", -1, 1),
              new Among("\u0438\u043B\u043E", 24, 2),
              new Among("\u044B\u043B\u043E", 24, 2),
              new Among("\u043D\u043E", -1, 1),
              new Among("\u0435\u043D\u043E", 27, 2),
              new Among("\u043D\u043D\u043E", 27, 1),
              new Among("\u0435\u0442", -1, 1),
              new Among("\u0443\u0435\u0442", 30, 2),
              new Among("\u0438\u0442", -1, 2),
              new Among("\u044B\u0442", -1, 2),
              new Among("\u044E\u0442", -1, 1),
              new Among("\u0443\u044E\u0442", 34, 2),
              new Among("\u044F\u0442", -1, 2),
              new Among("\u043D\u044B", -1, 1),
              new Among("\u0435\u043D\u044B", 37, 2),
              new Among("\u0442\u044C", -1, 1),
              new Among("\u0438\u0442\u044C", 39, 2),
              new Among("\u044B\u0442\u044C", 39, 2),
              new Among("\u0435\u0448\u044C", -1, 1),
              new Among("\u0438\u0448\u044C", -1, 2),
              new Among("\u044E", -1, 2),
              new Among("\u0443\u044E", 44, 2)
            ], a_5 = [
              new Among("\u0430", -1, 1),
              new Among("\u0435\u0432", -1, 1),
              new Among("\u043E\u0432", -1, 1),
              new Among("\u0435", -1, 1),
              new Among("\u0438\u0435", 3, 1),
              new Among("\u044C\u0435", 3, 1),
              new Among("\u0438", -1, 1),
              new Among("\u0435\u0438", 6, 1),
              new Among("\u0438\u0438", 6, 1),
              new Among("\u0430\u043C\u0438", 6, 1),
              new Among("\u044F\u043C\u0438", 6, 1),
              new Among("\u0438\u044F\u043C\u0438", 10, 1),
              new Among("\u0439", -1, 1),
              new Among("\u0435\u0439", 12, 1),
              new Among("\u0438\u0435\u0439", 13, 1),
              new Among("\u0438\u0439", 12, 1),
              new Among("\u043E\u0439", 12, 1),
              new Among("\u0430\u043C", -1, 1),
              new Among("\u0435\u043C", -1, 1),
              new Among("\u0438\u0435\u043C", 18, 1),
              new Among("\u043E\u043C", -1, 1),
              new Among("\u044F\u043C", -1, 1),
              new Among("\u0438\u044F\u043C", 21, 1),
              new Among("\u043E", -1, 1),
              new Among("\u0443", -1, 1),
              new Among("\u0430\u0445", -1, 1),
              new Among("\u044F\u0445", -1, 1),
              new Among("\u0438\u044F\u0445", 26, 1),
              new Among("\u044B", -1, 1),
              new Among("\u044C", -1, 1),
              new Among("\u044E", -1, 1),
              new Among("\u0438\u044E", 30, 1),
              new Among("\u044C\u044E", 30, 1),
              new Among("\u044F", -1, 1),
              new Among("\u0438\u044F", 33, 1),
              new Among("\u044C\u044F", 33, 1)
            ], a_6 = [
              new Among("\u043E\u0441\u0442", -1, 1),
              new Among("\u043E\u0441\u0442\u044C", -1, 1)
            ], a_7 = [
              new Among("\u0435\u0439\u0448\u0435", -1, 1),
              new Among("\u043D", -1, 2),
              new Among("\u0435\u0439\u0448", -1, 1),
              new Among("\u044C", -1, 3)
            ], g_v = [33, 65, 8, 232], I_p2, I_pV, sbp = new SnowballProgram();
            this.setCurrent = function(word) {
              sbp.setCurrent(word);
            };
            this.getCurrent = function() {
              return sbp.getCurrent();
            };
            function habr3() {
              while (!sbp.in_grouping(g_v, 1072, 1103)) {
                if (sbp.cursor >= sbp.limit)
                  return false;
                sbp.cursor++;
              }
              return true;
            }
            function habr4() {
              while (!sbp.out_grouping(g_v, 1072, 1103)) {
                if (sbp.cursor >= sbp.limit)
                  return false;
                sbp.cursor++;
              }
              return true;
            }
            function r_mark_regions() {
              I_pV = sbp.limit;
              I_p2 = I_pV;
              if (habr3()) {
                I_pV = sbp.cursor;
                if (habr4()) {
                  if (habr3()) {
                    if (habr4())
                      I_p2 = sbp.cursor;
                  }
                }
              }
            }
            function r_R2() {
              return I_p2 <= sbp.cursor;
            }
            function habr2(a, n) {
              var among_var, v_1;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a, n);
              if (among_var) {
                sbp.bra = sbp.cursor;
                switch (among_var) {
                  case 1:
                    v_1 = sbp.limit - sbp.cursor;
                    if (!sbp.eq_s_b(1, "\u0430")) {
                      sbp.cursor = sbp.limit - v_1;
                      if (!sbp.eq_s_b(1, "\u044F"))
                        return false;
                    }
                  case 2:
                    sbp.slice_del();
                    break;
                }
                return true;
              }
              return false;
            }
            function r_perfective_gerund() {
              return habr2(a_0, 9);
            }
            function habr1(a, n) {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a, n);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (among_var == 1)
                  sbp.slice_del();
                return true;
              }
              return false;
            }
            function r_adjective() {
              return habr1(a_1, 26);
            }
            function r_adjectival() {
              var among_var;
              if (r_adjective()) {
                habr2(a_2, 8);
                return true;
              }
              return false;
            }
            function r_reflexive() {
              return habr1(a_3, 2);
            }
            function r_verb() {
              return habr2(a_4, 46);
            }
            function r_noun() {
              habr1(a_5, 36);
            }
            function r_derivational() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_6, 2);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R2() && among_var == 1)
                  sbp.slice_del();
              }
            }
            function r_tidy_up() {
              var among_var;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_7, 4);
              if (among_var) {
                sbp.bra = sbp.cursor;
                switch (among_var) {
                  case 1:
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    if (!sbp.eq_s_b(1, "\u043D"))
                      break;
                    sbp.bra = sbp.cursor;
                  case 2:
                    if (!sbp.eq_s_b(1, "\u043D"))
                      break;
                  case 3:
                    sbp.slice_del();
                    break;
                }
              }
            }
            this.stem = function() {
              r_mark_regions();
              sbp.cursor = sbp.limit;
              if (sbp.cursor < I_pV)
                return false;
              sbp.limit_backward = I_pV;
              if (!r_perfective_gerund()) {
                sbp.cursor = sbp.limit;
                if (!r_reflexive())
                  sbp.cursor = sbp.limit;
                if (!r_adjectival()) {
                  sbp.cursor = sbp.limit;
                  if (!r_verb()) {
                    sbp.cursor = sbp.limit;
                    r_noun();
                  }
                }
              }
              sbp.cursor = sbp.limit;
              sbp.ket = sbp.cursor;
              if (sbp.eq_s_b(1, "\u0438")) {
                sbp.bra = sbp.cursor;
                sbp.slice_del();
              } else
                sbp.cursor = sbp.limit;
              r_derivational();
              sbp.cursor = sbp.limit;
              r_tidy_up();
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
        lunr.Pipeline.registerFunction(lunr.ru.stemmer, "stemmer-ru");
        lunr.ru.stopWordFilter = lunr.generateStopWordFilter("\u0430\u043B\u043B\u043E \u0431\u0435\u0437 \u0431\u043B\u0438\u0437\u043A\u043E \u0431\u043E\u043B\u0435\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 \u0431\u0443\u0434\u0435\u043C \u0431\u0443\u0434\u0435\u0442 \u0431\u0443\u0434\u0435\u0442\u0435 \u0431\u0443\u0434\u0435\u0448\u044C \u0431\u0443\u0434\u0442\u043E \u0431\u0443\u0434\u0443 \u0431\u0443\u0434\u0443\u0442 \u0431\u0443\u0434\u044C \u0431\u044B \u0431\u044B\u0432\u0430\u0435\u0442 \u0431\u044B\u0432\u044C \u0431\u044B\u043B \u0431\u044B\u043B\u0430 \u0431\u044B\u043B\u0438 \u0431\u044B\u043B\u043E \u0431\u044B\u0442\u044C \u0432 \u0432\u0430\u0436\u043D\u0430\u044F \u0432\u0430\u0436\u043D\u043E\u0435 \u0432\u0430\u0436\u043D\u044B\u0435 \u0432\u0430\u0436\u043D\u044B\u0439 \u0432\u0430\u043C \u0432\u0430\u043C\u0438 \u0432\u0430\u0441 \u0432\u0430\u0448 \u0432\u0430\u0448\u0430 \u0432\u0430\u0448\u0435 \u0432\u0430\u0448\u0438 \u0432\u0432\u0435\u0440\u0445 \u0432\u0434\u0430\u043B\u0438 \u0432\u0434\u0440\u0443\u0433 \u0432\u0435\u0434\u044C \u0432\u0435\u0437\u0434\u0435 \u0432\u0435\u0441\u044C \u0432\u043D\u0438\u0437 \u0432\u043D\u0438\u0437\u0443 \u0432\u043E \u0432\u043E\u043A\u0440\u0443\u0433 \u0432\u043E\u043D \u0432\u043E\u0441\u0435\u043C\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0432\u043E\u0441\u0435\u043C\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0432\u043E\u0441\u0435\u043C\u044C \u0432\u043E\u0441\u044C\u043C\u043E\u0439 \u0432\u043E\u0442 \u0432\u043F\u0440\u043E\u0447\u0435\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432\u0440\u0435\u043C\u044F \u0432\u0441\u0435 \u0432\u0441\u0435\u0433\u0434\u0430 \u0432\u0441\u0435\u0433\u043E \u0432\u0441\u0435\u043C \u0432\u0441\u0435\u043C\u0438 \u0432\u0441\u0435\u043C\u0443 \u0432\u0441\u0435\u0445 \u0432\u0441\u0435\u044E \u0432\u0441\u044E \u0432\u0441\u044E\u0434\u0443 \u0432\u0441\u044F \u0432\u0441\u0451 \u0432\u0442\u043E\u0440\u043E\u0439 \u0432\u044B \u0433 \u0433\u0434\u0435 \u0433\u043E\u0432\u043E\u0440\u0438\u043B \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \u0433\u043E\u0434 \u0433\u043E\u0434\u0430 \u0433\u043E\u0434\u0443 \u0434\u0430 \u0434\u0430\u0432\u043D\u043E \u0434\u0430\u0436\u0435 \u0434\u0430\u043B\u0435\u043A\u043E \u0434\u0430\u043B\u044C\u0448\u0435 \u0434\u0430\u0440\u043E\u043C \u0434\u0432\u0430 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u044C \u0434\u0432\u0435 \u0434\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0434\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0434\u0432\u0443\u0445 \u0434\u0435\u0432\u044F\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0434\u0435\u0432\u044F\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0434\u0435\u0432\u044F\u0442\u044B\u0439 \u0434\u0435\u0432\u044F\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u0435\u043B \u0434\u0435\u043D\u044C \u0434\u0435\u0441\u044F\u0442\u044B\u0439 \u0434\u0435\u0441\u044F\u0442\u044C \u0434\u043B\u044F \u0434\u043E \u0434\u043E\u0432\u043E\u043B\u044C\u043D\u043E \u0434\u043E\u043B\u0433\u043E \u0434\u043E\u043B\u0436\u043D\u043E \u0434\u0440\u0443\u0433\u0430\u044F \u0434\u0440\u0443\u0433\u0438\u0435 \u0434\u0440\u0443\u0433\u0438\u0445 \u0434\u0440\u0443\u0433\u043E \u0434\u0440\u0443\u0433\u043E\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0435 \u0435\u0433\u043E \u0435\u0435 \u0435\u0439 \u0435\u043C\u0443 \u0435\u0441\u043B\u0438 \u0435\u0441\u0442\u044C \u0435\u0449\u0435 \u0435\u0449\u0451 \u0435\u044E \u0435\u0451 \u0436 \u0436\u0435 \u0436\u0438\u0437\u043D\u044C \u0437\u0430 \u0437\u0430\u043D\u044F\u0442 \u0437\u0430\u043D\u044F\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u043E \u0437\u0430\u043D\u044F\u0442\u044B \u0437\u0430\u0442\u0435\u043C \u0437\u0430\u0442\u043E \u0437\u0430\u0447\u0435\u043C \u0437\u0434\u0435\u0441\u044C \u0437\u043D\u0430\u0447\u0438\u0442 \u0438 \u0438\u0437 \u0438\u043B\u0438 \u0438\u043C \u0438\u043C\u0435\u043D\u043D\u043E \u0438\u043C\u0435\u0442\u044C \u0438\u043C\u0438 \u0438\u043C\u044F \u0438\u043D\u043E\u0433\u0434\u0430 \u0438\u0445 \u043A \u043A\u0430\u0436\u0434\u0430\u044F \u043A\u0430\u0436\u0434\u043E\u0435 \u043A\u0430\u0436\u0434\u044B\u0435 \u043A\u0430\u0436\u0434\u044B\u0439 \u043A\u0430\u0436\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u043A\u0430\u043A\u0430\u044F \u043A\u0430\u043A\u043E\u0439 \u043A\u0435\u043C \u043A\u043E\u0433\u0434\u0430 \u043A\u043E\u0433\u043E \u043A\u043E\u043C \u043A\u043E\u043C\u0443 \u043A\u043E\u043D\u0435\u0447\u043D\u043E \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043A\u0440\u043E\u043C\u0435 \u043A\u0440\u0443\u0433\u043E\u043C \u043A\u0442\u043E \u043A\u0443\u0434\u0430 \u043B\u0435\u0442 \u043B\u0438 \u043B\u0438\u0448\u044C \u043B\u0443\u0447\u0448\u0435 \u043B\u044E\u0434\u0438 \u043C \u043C\u0430\u043B\u043E \u043C\u0435\u0436\u0434\u0443 \u043C\u0435\u043B\u044F \u043C\u0435\u043D\u0435\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 \u043C\u0435\u043D\u044F \u043C\u0438\u043B\u043B\u0438\u043E\u043D\u043E\u0432 \u043C\u0438\u043C\u043E \u043C\u0438\u0440\u0430 \u043C\u043D\u0435 \u043C\u043D\u043E\u0433\u043E \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u0430\u044F \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E\u0435 \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0435 \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0439 \u043C\u043D\u043E\u0439 \u043C\u043D\u043E\u044E \u043C\u043E\u0433 \u043C\u043E\u0433\u0443\u0442 \u043C\u043E\u0436 \u043C\u043E\u0436\u0435\u0442 \u043C\u043E\u0436\u043D\u043E \u043C\u043E\u0436\u0445\u043E \u043C\u043E\u0438 \u043C\u043E\u0439 \u043C\u043E\u0440 \u043C\u043E\u0447\u044C \u043C\u043E\u044F \u043C\u043E\u0451 \u043C\u044B \u043D\u0430 \u043D\u0430\u0432\u0435\u0440\u0445\u0443 \u043D\u0430\u0434 \u043D\u0430\u0434\u043E \u043D\u0430\u0437\u0430\u0434 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043D\u0430\u043A\u043E\u043D\u0435\u0446 \u043D\u0430\u043C \u043D\u0430\u043C\u0438 \u043D\u0430\u0441 \u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0430\u0448 \u043D\u0430\u0448\u0430 \u043D\u0430\u0448\u0435 \u043D\u0430\u0448\u0438 \u043D\u0435 \u043D\u0435\u0433\u043E \u043D\u0435\u0434\u0430\u0432\u043D\u043E \u043D\u0435\u0434\u0430\u043B\u0435\u043A\u043E \u043D\u0435\u0435 \u043D\u0435\u0439 \u043D\u0435\u043B\u044C\u0437\u044F \u043D\u0435\u043C \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043D\u0435\u043C\u0443 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u043E \u043D\u0435\u0440\u0435\u0434\u043A\u043E \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u0442 \u043D\u0435\u044E \u043D\u0435\u0451 \u043D\u0438 \u043D\u0438\u0431\u0443\u0434\u044C \u043D\u0438\u0436\u0435 \u043D\u0438\u0437\u043A\u043E \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0438\u043C\u0438 \u043D\u0438\u0445 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u043E \u043D\u0443 \u043D\u0443\u0436\u043D\u043E \u043D\u0445 \u043E \u043E\u0431 \u043E\u0431\u0430 \u043E\u0431\u044B\u0447\u043D\u043E \u043E\u0434\u0438\u043D \u043E\u0434\u0438\u043D\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u043E\u0434\u0438\u043D\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u043E\u0434\u043D\u0430\u0436\u0434\u044B \u043E\u0434\u043D\u0430\u043A\u043E \u043E\u0434\u043D\u043E\u0433\u043E \u043E\u0434\u043D\u043E\u0439 \u043E\u043A\u043E\u043B\u043E \u043E\u043D \u043E\u043D\u0430 \u043E\u043D\u0438 \u043E\u043D\u043E \u043E\u043F\u044F\u0442\u044C \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u043E\u0442 \u043E\u0442\u043E\u0432\u0441\u044E\u0434\u0443 \u043E\u0442\u0441\u044E\u0434\u0430 \u043E\u0447\u0435\u043D\u044C \u043F\u0435\u0440\u0432\u044B\u0439 \u043F\u0435\u0440\u0435\u0434 \u043F\u043E \u043F\u043E\u0434 \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430 \u043F\u043E\u0437\u0436\u0435 \u043F\u043E\u043A\u0430 \u043F\u043E\u0440 \u043F\u043E\u0440\u0430 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u043F\u043E\u0442\u043E\u043C \u043F\u043E\u0442\u043E\u043C\u0443 \u043F\u043E\u0447\u0435\u043C\u0443 \u043F\u043E\u0447\u0442\u0438 \u043F\u0440\u0435\u043A\u0440\u0430\u0441\u043D\u043E \u043F\u0440\u0438 \u043F\u0440\u043E \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0440\u043E\u0442\u0438\u0432 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u043E\u0432 \u043F\u044F\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u043F\u044F\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u043F\u044F\u0442\u044B\u0439 \u043F\u044F\u0442\u044C \u0440\u0430\u0437 \u0440\u0430\u0437\u0432\u0435 \u0440\u0430\u043D\u043E \u0440\u0430\u043D\u044C\u0448\u0435 \u0440\u044F\u0434\u043E\u043C \u0441 \u0441\u0430\u043C \u0441\u0430\u043C\u0430 \u0441\u0430\u043C\u0438 \u0441\u0430\u043C\u0438\u043C \u0441\u0430\u043C\u0438\u043C\u0438 \u0441\u0430\u043C\u0438\u0445 \u0441\u0430\u043C\u043E \u0441\u0430\u043C\u043E\u0433\u043E \u0441\u0430\u043C\u043E\u0439 \u0441\u0430\u043C\u043E\u043C \u0441\u0430\u043C\u043E\u043C\u0443 \u0441\u0430\u043C\u0443 \u0441\u0432\u043E\u0435 \u0441\u0432\u043E\u0435\u0433\u043E \u0441\u0432\u043E\u0435\u0439 \u0441\u0432\u043E\u0438 \u0441\u0432\u043E\u0438\u0445 \u0441\u0432\u043E\u044E \u0441\u0435\u0430\u043E\u0439 \u0441\u0435\u0431\u0435 \u0441\u0435\u0431\u044F \u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0441\u0435\u0434\u044C\u043C\u043E\u0439 \u0441\u0435\u0439\u0447\u0430\u0441 \u0441\u0435\u043C\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0441\u0435\u043C\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0441\u0435\u043C\u044C \u0441\u0438\u0445 \u0441\u043A\u0430\u0437\u0430\u043B \u0441\u043A\u0430\u0437\u0430\u043B\u0430 \u0441\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043D\u043E\u0432\u0430 \u0441\u043E \u0441\u043E\u0431\u043E\u0439 \u0441\u043E\u0431\u043E\u044E \u0441\u043E\u0432\u0441\u0435\u043C \u0441\u043F\u0430\u0441\u0438\u0431\u043E \u0441\u0442\u0430\u043B \u0441\u0443\u0442\u044C \u0442 \u0442\u0430 \u0442\u0430\u043A \u0442\u0430\u043A\u0430\u044F \u0442\u0430\u043A\u0436\u0435 \u0442\u0430\u043A\u0438\u0435 \u0442\u0430\u043A\u043E\u0435 \u0442\u0430\u043A\u043E\u0439 \u0442\u0430\u043C \u0442\u0432\u043E\u0439 \u0442\u0432\u043E\u044F \u0442\u0432\u043E\u0451 \u0442\u0435 \u0442\u0435\u0431\u0435 \u0442\u0435\u0431\u044F \u0442\u0435\u043C \u0442\u0435\u043C\u0438 \u0442\u0435\u043F\u0435\u0440\u044C \u0442\u0435\u0445 \u0442\u043E \u0442\u043E\u0431\u043E\u0439 \u0442\u043E\u0431\u043E\u044E \u0442\u043E\u0433\u0434\u0430 \u0442\u043E\u0433\u043E \u0442\u043E\u0436\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E\u043C \u0442\u043E\u043C\u0443 \u0442\u043E\u0442 \u0442\u043E\u044E \u0442\u0440\u0435\u0442\u0438\u0439 \u0442\u0440\u0438 \u0442\u0440\u0438\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0442\u0440\u0438\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0442\u0443 \u0442\u0443\u0434\u0430 \u0442\u0443\u0442 \u0442\u044B \u0442\u044B\u0441\u044F\u0447 \u0443 \u0443\u0436 \u0443\u0436\u0435 \u0443\u043C\u0435\u0442\u044C \u0445\u043E\u0440\u043E\u0448\u043E \u0445\u043E\u0442\u0435\u0442\u044C \u0445\u043E\u0442\u044C \u0445\u043E\u0442\u044F \u0445\u043E\u0447\u0435\u0448\u044C \u0447\u0430\u0441\u0442\u043E \u0447\u0430\u0449\u0435 \u0447\u0435\u0433\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0447\u0435\u043C \u0447\u0435\u043C\u0443 \u0447\u0435\u0440\u0435\u0437 \u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044B\u0439 \u0447\u0435\u0442\u044B\u0440\u0435 \u0447\u0435\u0442\u044B\u0440\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0447\u0435\u0442\u044B\u0440\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0447\u0442\u043E \u0447\u0442\u043E\u0431 \u0447\u0442\u043E\u0431\u044B \u0447\u0443\u0442\u044C \u0448\u0435\u0441\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044B\u0439 \u0448\u0435\u0441\u0442\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u0448\u0435\u0441\u0442\u043E\u0439 \u0448\u0435\u0441\u0442\u044C \u044D\u0442\u0430 \u044D\u0442\u0438 \u044D\u0442\u0438\u043C \u044D\u0442\u0438\u043C\u0438 \u044D\u0442\u0438\u0445 \u044D\u0442\u043E \u044D\u0442\u043E\u0433\u043E \u044D\u0442\u043E\u0439 \u044D\u0442\u043E\u043C \u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E\u0442 \u044D\u0442\u0443 \u044F \uFEFF\u0430".split(" "));
        lunr.Pipeline.registerFunction(lunr.ru.stopWordFilter, "stopWordFilter-ru");
      };
    });
  }
});

// src/worker/langs/ru.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_ru());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "ru");
  return lunr.ru;
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

lunr-languages/lunr.ru.js:
  (*!
   * Lunr languages, `Russian` language
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
