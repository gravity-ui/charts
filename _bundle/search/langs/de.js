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

// node_modules/lunr-languages/lunr.de.js
var require_lunr_de = __commonJS({
  "node_modules/lunr-languages/lunr.de.js"(exports, module2) {
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
        lunr.de = function() {
          this.pipeline.reset();
          this.pipeline.add(
            lunr.de.trimmer,
            lunr.de.stopWordFilter,
            lunr.de.stemmer
          );
          if (this.searchPipeline) {
            this.searchPipeline.reset();
            this.searchPipeline.add(lunr.de.stemmer);
          }
        };
        lunr.de.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
        lunr.de.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.de.wordCharacters);
        lunr.Pipeline.registerFunction(lunr.de.trimmer, "trimmer-de");
        lunr.de.stemmer = function() {
          var Among = lunr.stemmerSupport.Among, SnowballProgram = lunr.stemmerSupport.SnowballProgram, st = new function GermanStemmer() {
            var a_0 = [
              new Among("", -1, 6),
              new Among("U", 0, 2),
              new Among("Y", 0, 1),
              new Among("\xE4", 0, 3),
              new Among("\xF6", 0, 4),
              new Among("\xFC", 0, 5)
            ], a_1 = [
              new Among("e", -1, 2),
              new Among("em", -1, 1),
              new Among("en", -1, 2),
              new Among("ern", -1, 1),
              new Among("er", -1, 1),
              new Among("s", -1, 3),
              new Among("es", 5, 2)
            ], a_2 = [
              new Among("en", -1, 1),
              new Among("er", -1, 1),
              new Among("st", -1, 2),
              new Among("est", 2, 1)
            ], a_3 = [
              new Among("ig", -1, 1),
              new Among("lich", -1, 1)
            ], a_4 = [
              new Among("end", -1, 1),
              new Among("ig", -1, 2),
              new Among("ung", -1, 1),
              new Among("lich", -1, 3),
              new Among("isch", -1, 2),
              new Among("ik", -1, 2),
              new Among("heit", -1, 3),
              new Among("keit", -1, 4)
            ], g_v = [
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
              32,
              8
            ], g_s_ending = [117, 30, 5], g_st_ending = [
              117,
              30,
              4
            ], I_x, I_p2, I_p1, sbp = new SnowballProgram();
            this.setCurrent = function(word) {
              sbp.setCurrent(word);
            };
            this.getCurrent = function() {
              return sbp.getCurrent();
            };
            function habr1(c1, c2, v_1) {
              if (sbp.eq_s(1, c1)) {
                sbp.ket = sbp.cursor;
                if (sbp.in_grouping(g_v, 97, 252)) {
                  sbp.slice_from(c2);
                  sbp.cursor = v_1;
                  return true;
                }
              }
              return false;
            }
            function r_prelude() {
              var v_1 = sbp.cursor, v_2, v_3, v_4, v_5;
              while (true) {
                v_2 = sbp.cursor;
                sbp.bra = v_2;
                if (sbp.eq_s(1, "\xDF")) {
                  sbp.ket = sbp.cursor;
                  sbp.slice_from("ss");
                } else {
                  if (v_2 >= sbp.limit)
                    break;
                  sbp.cursor = v_2 + 1;
                }
              }
              sbp.cursor = v_1;
              while (true) {
                v_3 = sbp.cursor;
                while (true) {
                  v_4 = sbp.cursor;
                  if (sbp.in_grouping(g_v, 97, 252)) {
                    v_5 = sbp.cursor;
                    sbp.bra = v_5;
                    if (habr1("u", "U", v_4))
                      break;
                    sbp.cursor = v_5;
                    if (habr1("y", "Y", v_4))
                      break;
                  }
                  if (v_4 >= sbp.limit) {
                    sbp.cursor = v_3;
                    return;
                  }
                  sbp.cursor = v_4 + 1;
                }
              }
            }
            function habr2() {
              while (!sbp.in_grouping(g_v, 97, 252)) {
                if (sbp.cursor >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              while (!sbp.out_grouping(g_v, 97, 252)) {
                if (sbp.cursor >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              return false;
            }
            function r_mark_regions() {
              I_p1 = sbp.limit;
              I_p2 = I_p1;
              var c = sbp.cursor + 3;
              if (0 <= c && c <= sbp.limit) {
                I_x = c;
                if (!habr2()) {
                  I_p1 = sbp.cursor;
                  if (I_p1 < I_x)
                    I_p1 = I_x;
                  if (!habr2())
                    I_p2 = sbp.cursor;
                }
              }
            }
            function r_postlude() {
              var among_var, v_1;
              while (true) {
                v_1 = sbp.cursor;
                sbp.bra = v_1;
                among_var = sbp.find_among(a_0, 6);
                if (!among_var)
                  return;
                sbp.ket = sbp.cursor;
                switch (among_var) {
                  case 1:
                    sbp.slice_from("y");
                    break;
                  case 2:
                  case 5:
                    sbp.slice_from("u");
                    break;
                  case 3:
                    sbp.slice_from("a");
                    break;
                  case 4:
                    sbp.slice_from("o");
                    break;
                  case 6:
                    if (sbp.cursor >= sbp.limit)
                      return;
                    sbp.cursor++;
                    break;
                }
              }
            }
            function r_R1() {
              return I_p1 <= sbp.cursor;
            }
            function r_R2() {
              return I_p2 <= sbp.cursor;
            }
            function r_standard_suffix() {
              var among_var, v_1 = sbp.limit - sbp.cursor, v_2, v_3, v_4;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_1, 7);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_del();
                      break;
                    case 2:
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      if (sbp.eq_s_b(1, "s")) {
                        sbp.bra = sbp.cursor;
                        if (sbp.eq_s_b(3, "nis"))
                          sbp.slice_del();
                      }
                      break;
                    case 3:
                      if (sbp.in_grouping_b(g_s_ending, 98, 116))
                        sbp.slice_del();
                      break;
                  }
                }
              }
              sbp.cursor = sbp.limit - v_1;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_2, 4);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R1()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_del();
                      break;
                    case 2:
                      if (sbp.in_grouping_b(g_st_ending, 98, 116)) {
                        var c = sbp.cursor - 3;
                        if (sbp.limit_backward <= c && c <= sbp.limit) {
                          sbp.cursor = c;
                          sbp.slice_del();
                        }
                      }
                      break;
                  }
                }
              }
              sbp.cursor = sbp.limit - v_1;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_4, 8);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (r_R2()) {
                  switch (among_var) {
                    case 1:
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      if (sbp.eq_s_b(2, "ig")) {
                        sbp.bra = sbp.cursor;
                        v_2 = sbp.limit - sbp.cursor;
                        if (!sbp.eq_s_b(1, "e")) {
                          sbp.cursor = sbp.limit - v_2;
                          if (r_R2())
                            sbp.slice_del();
                        }
                      }
                      break;
                    case 2:
                      v_3 = sbp.limit - sbp.cursor;
                      if (!sbp.eq_s_b(1, "e")) {
                        sbp.cursor = sbp.limit - v_3;
                        sbp.slice_del();
                      }
                      break;
                    case 3:
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      v_4 = sbp.limit - sbp.cursor;
                      if (!sbp.eq_s_b(2, "er")) {
                        sbp.cursor = sbp.limit - v_4;
                        if (!sbp.eq_s_b(2, "en"))
                          break;
                      }
                      sbp.bra = sbp.cursor;
                      if (r_R1())
                        sbp.slice_del();
                      break;
                    case 4:
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      among_var = sbp.find_among_b(a_3, 2);
                      if (among_var) {
                        sbp.bra = sbp.cursor;
                        if (r_R2() && among_var == 1)
                          sbp.slice_del();
                      }
                      break;
                  }
                }
              }
            }
            this.stem = function() {
              var v_1 = sbp.cursor;
              r_prelude();
              sbp.cursor = v_1;
              r_mark_regions();
              sbp.limit_backward = v_1;
              sbp.cursor = sbp.limit;
              r_standard_suffix();
              sbp.cursor = sbp.limit_backward;
              r_postlude();
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
        lunr.Pipeline.registerFunction(lunr.de.stemmer, "stemmer-de");
        lunr.de.stopWordFilter = lunr.generateStopWordFilter("aber alle allem allen aller alles als also am an ander andere anderem anderen anderer anderes anderm andern anderr anders auch auf aus bei bin bis bist da damit dann das dasselbe dazu da\xDF dein deine deinem deinen deiner deines dem demselben den denn denselben der derer derselbe derselben des desselben dessen dich die dies diese dieselbe dieselben diesem diesen dieser dieses dir doch dort du durch ein eine einem einen einer eines einig einige einigem einigen einiger einiges einmal er es etwas euch euer eure eurem euren eurer eures f\xFCr gegen gewesen hab habe haben hat hatte hatten hier hin hinter ich ihm ihn ihnen ihr ihre ihrem ihren ihrer ihres im in indem ins ist jede jedem jeden jeder jedes jene jenem jenen jener jenes jetzt kann kein keine keinem keinen keiner keines k\xF6nnen k\xF6nnte machen man manche manchem manchen mancher manches mein meine meinem meinen meiner meines mich mir mit muss musste nach nicht nichts noch nun nur ob oder ohne sehr sein seine seinem seinen seiner seines selbst sich sie sind so solche solchem solchen solcher solches soll sollte sondern sonst um und uns unse unsem unsen unser unses unter viel vom von vor war waren warst was weg weil weiter welche welchem welchen welcher welches wenn werde werden wie wieder will wir wird wirst wo wollen wollte w\xE4hrend w\xFCrde w\xFCrden zu zum zur zwar zwischen \xFCber".split(" "));
        lunr.Pipeline.registerFunction(lunr.de.stopWordFilter, "stopWordFilter-de");
      };
    });
  }
});

// src/worker/langs/de.ts
var import_lunr_stemmer = __toESM(require_lunr_stemmer_support());
var import_lunr = __toESM(require_lunr_multi());
var import_lunr2 = __toESM(require_lunr_de());
self.language = function(lunr) {
  (0, import_lunr_stemmer.default)(lunr);
  (0, import_lunr2.default)(lunr);
  (0, import_lunr.default)(lunr);
  lunr.multiLanguage("en", "de");
  return lunr.de;
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

lunr-languages/lunr.de.js:
  (*!
   * Lunr languages, `German` language
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
