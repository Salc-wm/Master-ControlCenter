// i18n.js — lightweight client-side localization helper
import { DICTS } from './langs.js';
const SUPPORTED_LANGUAGES = Object.keys(DICTS);

let currentLang = "en";
const listeners = new Set();

function normaliseLanguage(lang) {
  if (!lang) return "en";

  const low = lang.toLowerCase();
  if (DICTS[low]) return low;

  const base = low.split("-")[0];
  if (DICTS[base]) return base;

  return "en";
}

function format(str, replacements) {
  if (!str || !replacements) return str;

  return str.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : ""
  );
}

export function t(phrase, replacements) {
  if (!phrase) return "";
  const dict = DICTS[currentLang] || {};

  let result = dict[phrase];
  if (result == null) {
    result = (DICTS.en && DICTS.en[phrase]) || phrase;
  }

  return format(result, replacements);
}

export function applyTranslations(root = document) {
  const lang = currentLang || "en";
  if (root.documentElement) {
    root.documentElement.lang = lang;
  }

  // text content
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;

    const translated = t(key);
    if (translated != null) el.textContent = translated;
  });

  // html content
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (!key) return;

    const translated = t(key);
    if (translated != null) el.innerHTML = translated;
  });

  // attribute helpers
  const attrMappings = [
    { attr: "title", dataProp: "i18nTitle" },
    { attr: "placeholder", dataProp: "i18nPlaceholder" },
    { attr: "aria-label", dataProp: "i18nAriaLabel" },
    { attr: "aria-description", dataProp: "i18nAriaDescription" },
    { attr: "value", dataProp: "i18nValue" }
  ];

  attrMappings.forEach(({ attr, dataProp }) => {
    root.querySelectorAll(`[data-i18n-${attr.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}]`).forEach((el) => {
      const key = el.dataset[dataProp];
      if (!key) return;

      const translated = t(key);
      if (translated != null) el.setAttribute(attr, translated);
    });
  });

  if (typeof document !== "undefined") {
    const titleEl = document.querySelector("title");
    const titleKey = titleEl?.dataset?.i18n || titleEl?.textContent;

    if (titleEl && titleKey) {
      const translated = t(titleKey);
      if (translated != null) titleEl.textContent = translated;
    }
  }
}

export function initI18n(initialLang = "en") {
  currentLang = normaliseLanguage(initialLang);
  applyTranslations();
}

export function setLanguage(nextLang) {
  const normalised = normaliseLanguage(nextLang);
  currentLang = normalised;

  applyTranslations();
  listeners.forEach((fn) => {
    try { fn(normalised); } catch (err) { console.error("[i18n] listener error", err); }
  });
}

export function onLanguageChange(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function getCurrentLanguage() {
  return currentLang;
}

export { SUPPORTED_LANGUAGES };
