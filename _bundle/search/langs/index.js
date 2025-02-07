"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/worker/langs/index.ts
var langs_exports = {};
__export(langs_exports, {
  langs: () => langs
});
module.exports = __toCommonJS(langs_exports);
var langs = ["ar", "da", "de", "du", "el", "es", "fi", "fr", "he", "hu", "hy", "it", "ko", "nl", "no", "pt", "ro", "ru", "sv", "tr", "vi", "ja", "jp", "th", "hi", "ta", "sa", "kn", "te"];
