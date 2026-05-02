import { AbstractControl } from '@angular/forms';
import { ConfigOption, FormlyFieldConfig } from '@ngx-formly/core';
import {
  DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES,
  FormlyViewerUiMessagesDictionary,
} from './formly-viewer-ui-messages';

export type FormlyViewerValidationLocale = string;

export interface FormlyViewerValidationMessagesDictionary {
  required: string;
  minLength: (requiredLength: number) => string;
  maxLength: (requiredLength: number) => string;
  min: (minValue: number) => string;
  max: (maxValue: number) => string;
  email: string;
  pattern: string;
  numericFormat: string;
  minAnswers: (minAnswers: number) => string;
  maxAnswers: (maxAnswers: number) => string;
  completeAll: string;
  minValue: (minValue: number) => string;
  maxValue: (maxValue: number) => string;
  integerOnly: string;
}

export interface FormlyViewerI18nOptions {
  defaultLanguage?: FormlyViewerValidationLocale;
  i18nDictionaries?: Record<FormlyViewerValidationLocale, FormlyViewerI18nDictionary>;
  resolveLocale?: (
    field: FormlyFieldConfig | undefined,
    defaultLanguage: FormlyViewerValidationLocale,
  ) => FormlyViewerValidationLocale;
}

export interface FormlyViewerI18nDictionary {
  validations?: FormlyViewerValidationMessagesDictionary;
  ui?: FormlyViewerUiMessagesDictionary;
}

export interface FormlyViewerRuntimeI18nConfig {
  defaultLanguage: FormlyViewerValidationLocale;
  validationDictionaries: Record<FormlyViewerValidationLocale, FormlyViewerValidationMessagesDictionary>;
  uiDictionaries: Record<FormlyViewerValidationLocale, FormlyViewerUiMessagesDictionary>;
}

export const DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES: Record<
  FormlyViewerValidationLocale,
  FormlyViewerValidationMessagesDictionary
> = {
  en: {
    required: 'This field is required',
    minLength: (requiredLength) => `Minimum length is ${requiredLength}`,
    maxLength: (requiredLength) => `Maximum length is ${requiredLength}`,
    min: (minValue) => `Minimum value is ${minValue}`,
    max: (maxValue) => `Maximum value is ${maxValue}`,
    email: 'Please enter a valid email address',
    pattern: 'The entered value does not match the required format',
    numericFormat: 'Enter a valid number',
    minAnswers: (minAnswers) => `Please select at least ${minAnswers} answers`,
    maxAnswers: (maxAnswers) => `You can select up to ${maxAnswers} answers`,
    completeAll: 'Please complete all fields',
    minValue: (minValue) => `Please enter a value greater than or equal to ${minValue}`,
    maxValue: (maxValue) => `Please enter a value lower than or equal to ${maxValue}`,
    integerOnly: 'Please enter a whole number',
  },
  es: {
    required: 'Este campo es obligatorio',
    minLength: (requiredLength) => `La longitud mínima es ${requiredLength}`,
    maxLength: (requiredLength) => `La longitud máxima es ${requiredLength}`,
    min: (minValue) => `El valor mínimo es ${minValue}`,
    max: (maxValue) => `El valor máximo es ${maxValue}`,
    email: 'Ingresa un correo electrónico válido',
    pattern: 'El valor ingresado no cumple el formato requerido',
    numericFormat: 'Ingresa un número válido',
    minAnswers: (minAnswers) => `Selecciona al menos ${minAnswers} respuestas`,
    maxAnswers: (maxAnswers) => `Puedes seleccionar hasta ${maxAnswers} respuestas`,
    completeAll: 'Completa todos los campos',
    minValue: (minValue) => `Ingresa un valor mayor o igual a ${minValue}`,
    maxValue: (maxValue) => `Ingresa un valor menor o igual a ${maxValue}`,
    integerOnly: 'Ingresa un número entero',
  },
};

export const DEFAULT_FORMLY_VIEWER_I18N_DICTIONARIES: Record<
  FormlyViewerValidationLocale,
  FormlyViewerI18nDictionary
> = {
  en: {
    validations: DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES.en,
    ui: DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES.en,
  },
  es: {
    validations: DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES.es,
    ui: DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES.es,
  },
};

let runtimeI18nConfig: FormlyViewerRuntimeI18nConfig = {
  defaultLanguage: 'en',
  validationDictionaries: DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES,
  uiDictionaries: DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES,
};

export function getFormlyViewerRuntimeI18nConfig(): FormlyViewerRuntimeI18nConfig {
  return runtimeI18nConfig;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isEmptyValue(value: unknown): boolean {
  return value == null || `${value}`.trim() === '';
}

function isFilledValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.every((item) => isFilledValue(item));
  }
  if (typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>);
    if (!entries.length) {
      return false;
    }
    return entries.every((item) => isFilledValue(item));
  }
  return true;
}

function countSelectedAnswers(value: unknown): number {
  if (value == null) {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.filter((item) => isFilledValue(item)).length;
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .reduce<number>((total, current) => total + (isFilledValue(current) ? 1 : 0), 0);
  }
  return isFilledValue(value) ? 1 : 0;
}

type ViewerValidator = (
  control: AbstractControl,
  field?: FormlyFieldConfig,
  options?: Record<string, unknown> | null,
) => boolean;

const asFormlyValidation = (validator: ViewerValidator) => validator as unknown as (
  control: AbstractControl,
  field?: FormlyFieldConfig,
  options?: Record<string, unknown> | null,
) => unknown;

const numericFormatValidator: ViewerValidator = (control) => {
  const value = control?.value;
  if (isEmptyValue(value)) {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  const normalized = `${value}`.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(normalized);
};

const completeAllValidator: ViewerValidator = (control) => {
  const value = control?.value;
  if (isEmptyValue(value)) {
    return false;
  }
  return isFilledValue(value);
};

const minAnswersValidator: ViewerValidator = (control, field, options) => {
  const requiredMinAnswers = toFiniteNumber(
    options?.['minAnswers']
    ?? options?.['requiredMinAnswers']
    ?? field?.props?.['minAnswers'],
  );
  if (requiredMinAnswers == null) {
    return true;
  }
  return countSelectedAnswers(control?.value) >= requiredMinAnswers;
};

const maxAnswersValidator: ViewerValidator = (control, field, options) => {
  const allowedMaxAnswers = toFiniteNumber(
    options?.['maxAnswers']
    ?? options?.['allowedMaxAnswers']
    ?? field?.props?.['maxAnswers'],
  );
  if (allowedMaxAnswers == null) {
    return true;
  }
  return countSelectedAnswers(control?.value) <= allowedMaxAnswers;
};

const minValueValidator: ViewerValidator = (control, field, options) => {
  const minValue = toFiniteNumber(options?.['minValue'] ?? options?.['min'] ?? field?.props?.['minValue'] ?? field?.props?.['min']);
  if (minValue == null || isEmptyValue(control?.value)) {
    return true;
  }
  const currentValue = toFiniteNumber(control?.value);
  if (currentValue == null) {
    return false;
  }
  return currentValue >= minValue;
};

const maxValueValidator: ViewerValidator = (control, field, options) => {
  const maxValue = toFiniteNumber(options?.['maxValue'] ?? options?.['max'] ?? field?.props?.['maxValue'] ?? field?.props?.['max']);
  if (maxValue == null || isEmptyValue(control?.value)) {
    return true;
  }
  const currentValue = toFiniteNumber(control?.value);
  if (currentValue == null) {
    return false;
  }
  return currentValue <= maxValue;
};

const integerOnlyValidator: ViewerValidator = (control) => {
  const value = control?.value;
  if (isEmptyValue(value)) {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value);
  }
  return /^-?\d+$/.test(`${value}`.trim());
};

function normalizeLocale(
  localeCandidate: unknown,
  fallback: FormlyViewerValidationLocale,
): FormlyViewerValidationLocale {
  const normalized = `${localeCandidate ?? ''}`.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized.startsWith('es')) {
    return 'es';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return normalized;
}

function resolveLocaleFromField(
  field: FormlyFieldConfig | undefined,
  defaultLanguage: FormlyViewerValidationLocale,
): FormlyViewerValidationLocale {
  return normalizeLocale(
    field?.props?.['locale'] ?? field?.parent?.props?.['locale'],
    defaultLanguage,
  );
}

function extractValidationDictionaries(
  source: Record<FormlyViewerValidationLocale, FormlyViewerI18nDictionary> | undefined,
): Record<FormlyViewerValidationLocale, FormlyViewerValidationMessagesDictionary> {
  if (!source || typeof source !== 'object') {
    return {};
  }

  const result: Record<FormlyViewerValidationLocale, FormlyViewerValidationMessagesDictionary> = {};
  for (const [locale, dictionary] of Object.entries(source)) {
    if (dictionary?.validations) {
      result[locale] = dictionary.validations;
    }
  }
  return result;
}

function extractUiDictionaries(
  source: Record<FormlyViewerValidationLocale, FormlyViewerI18nDictionary> | undefined,
): Record<FormlyViewerValidationLocale, FormlyViewerUiMessagesDictionary> {
  if (!source || typeof source !== 'object') {
    return {};
  }

  const result: Record<FormlyViewerValidationLocale, FormlyViewerUiMessagesDictionary> = {};
  for (const [locale, dictionary] of Object.entries(source)) {
    if (dictionary?.ui) {
      result[locale] = dictionary.ui;
    }
  }
  return result;
}

function resolveFallbackLocale(
  dictionaries: Record<FormlyViewerValidationLocale, unknown>,
  requestedLocale: FormlyViewerValidationLocale,
): FormlyViewerValidationLocale {
  if (dictionaries[requestedLocale]) {
    return requestedLocale;
  }
  if (dictionaries['en']) {
    return 'en';
  }
  const availableLocale = Object.keys(dictionaries)[0];
  return normalizeLocale(availableLocale, 'en');
}

function normalizeRuntimeI18nConfig(
  options: FormlyViewerI18nOptions,
): FormlyViewerRuntimeI18nConfig {
  const validationDictionaries = extractValidationDictionaries(options.i18nDictionaries);
  const uiDictionaries = extractUiDictionaries(options.i18nDictionaries);
  const resolvedValidationDictionaries = Object.keys(validationDictionaries).length > 0
    ? validationDictionaries
    : DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES;
  const resolvedUiDictionaries = Object.keys(uiDictionaries).length > 0
    ? uiDictionaries
    : DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES;

  const requestedDefaultLanguage = normalizeLocale(options.defaultLanguage ?? 'en', 'en');
  const defaultLanguage = resolveFallbackLocale(resolvedValidationDictionaries, requestedDefaultLanguage);

  return {
    defaultLanguage,
    validationDictionaries: resolvedValidationDictionaries,
    uiDictionaries: resolvedUiDictionaries,
  };
}

export function withFormlyViewerI18n(
  options: FormlyViewerI18nOptions = {},
): ConfigOption {
  const runtimeConfig = normalizeRuntimeI18nConfig(options);
  runtimeI18nConfig = runtimeConfig;
  const dictionaries = runtimeConfig.validationDictionaries;
  const defaultLanguage = runtimeConfig.defaultLanguage;
  const resolveLocale = options.resolveLocale ?? resolveLocaleFromField;
  const fallbackLocale = resolveFallbackLocale(dictionaries, defaultLanguage);

  const getDictionary = (field: FormlyFieldConfig | undefined): FormlyViewerValidationMessagesDictionary => {
    const fieldLocale = normalizeLocale(resolveLocale(field, defaultLanguage), defaultLanguage);
    return dictionaries[fieldLocale] ?? dictionaries[fallbackLocale];
  };

  return {
    validators: [
      { name: 'numericFormat', validation: asFormlyValidation(numericFormatValidator) },
      { name: 'completeAll', validation: asFormlyValidation(completeAllValidator) },
      { name: 'minAnswers', validation: asFormlyValidation(minAnswersValidator) },
      { name: 'maxAnswers', validation: asFormlyValidation(maxAnswersValidator) },
      { name: 'minValue', validation: asFormlyValidation(minValueValidator) },
      { name: 'maxValue', validation: asFormlyValidation(maxValueValidator) },
      { name: 'integerOnly', validation: asFormlyValidation(integerOnlyValidator) },
    ],
    validationMessages: [
      {
        name: 'required',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).required,
      },
      {
        name: 'minLength',
        message: (error: any, field: FormlyFieldConfig) => {
          const requiredLength = toNumber(error?.requiredLength ?? error?.minlength?.requiredLength);
          return getDictionary(field).minLength(requiredLength);
        },
      },
      {
        name: 'maxLength',
        message: (error: any, field: FormlyFieldConfig) => {
          const requiredLength = toNumber(error?.requiredLength ?? error?.maxlength?.requiredLength);
          return getDictionary(field).maxLength(requiredLength);
        },
      },
      {
        name: 'min',
        message: (error: any, field: FormlyFieldConfig) => {
          const minValue = toNumber(error?.min ?? error?.minValue ?? error?.actualMin);
          return getDictionary(field).min(minValue);
        },
      },
      {
        name: 'max',
        message: (error: any, field: FormlyFieldConfig) => {
          const maxValue = toNumber(error?.max ?? error?.maxValue ?? error?.actualMax);
          return getDictionary(field).max(maxValue);
        },
      },
      {
        name: 'email',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).email,
      },
      {
        name: 'pattern',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).pattern,
      },
      {
        name: 'numericFormat',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).numericFormat,
      },
      {
        name: 'minAnswers',
        message: (error: any, field: FormlyFieldConfig) => {
          const minAnswers = toNumber(error?.minAnswers ?? error?.requiredMinAnswers);
          return getDictionary(field).minAnswers(minAnswers);
        },
      },
      {
        name: 'maxAnswers',
        message: (error: any, field: FormlyFieldConfig) => {
          const maxAnswers = toNumber(error?.maxAnswers ?? error?.allowedMaxAnswers);
          return getDictionary(field).maxAnswers(maxAnswers);
        },
      },
      {
        name: 'completeAll',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).completeAll,
      },
      {
        name: 'minValue',
        message: (error: any, field: FormlyFieldConfig) => {
          const minValue = toNumber(error?.minValue ?? error?.min ?? error?.actualMin);
          return getDictionary(field).minValue(minValue);
        },
      },
      {
        name: 'maxValue',
        message: (error: any, field: FormlyFieldConfig) => {
          const maxValue = toNumber(error?.maxValue ?? error?.max ?? error?.actualMax);
          return getDictionary(field).maxValue(maxValue);
        },
      },
      {
        name: 'integerOnly',
        message: (_error: unknown, field: FormlyFieldConfig) => getDictionary(field).integerOnly,
      },
    ],
  };
}
