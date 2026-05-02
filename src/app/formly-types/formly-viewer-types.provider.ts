import { ConfigOption } from '@ngx-formly/core';
import { ViewerFormlyCheckboxWithTextType } from './viewer-formly-checkbox-with-text.type';
import { ViewerFormlyGenderType } from './viewer-formly-gender.type';
import { ViewerFormlyMatrixType } from './viewer-formly-matrix.type';
import { ViewerFormlyMultipleInputType } from './viewer-formly-multiple-input.type';
import { ViewerFormlyNOptionRadioType } from './viewer-formly-n-option-radio.type';
import { ViewerFormlyRepeatType } from './viewer-formly-repeat.type';
import { ViewerFormlySelectInlineType } from './viewer-formly-select-inline.type';
import { ViewerFormlyStepperType } from './viewer-formly-stepper.type';
import { ViewerMaterialFormFieldWrapper } from './viewer-material-form-field.wrapper';

/**
 * Formly type catalog aligned with form-builder exported forms.
 * Use this in consumers with provideFormlyCore([...withFormlyViewerTypes()]).
 */
export function withFormlyViewerTypes(): ConfigOption {
  return {
    wrappers: [
      { name: 'viewer-form-field', component: ViewerMaterialFormFieldWrapper },
    ],
    types: [
      { name: 'repeat', component: ViewerFormlyRepeatType },
      { name: 'matrix', component: ViewerFormlyMatrixType, wrappers: ['viewer-form-field'] },
      { name: 'selectInline', component: ViewerFormlySelectInlineType, wrappers: ['viewer-form-field'] },
      { name: 'checkboxWithText', component: ViewerFormlyCheckboxWithTextType, wrappers: ['viewer-form-field'] },
      { name: 'multiple-input', component: ViewerFormlyMultipleInputType, wrappers: ['viewer-form-field'] },
      { name: 'stepper', component: ViewerFormlyStepperType },
      { name: 'nOptionRadio', component: ViewerFormlyNOptionRadioType, wrappers: ['viewer-form-field'] },
      { name: 'gender', component: ViewerFormlyGenderType, wrappers: ['viewer-form-field'] },
      { name: 'range', extends: 'slider' },
      { name: 'datetime', extends: 'datepicker' },
    ],
  };
}

export const FORMLY_VIEWER_SUPPORTED_TYPES = [
  'repeat',
  'matrix',
  'selectInline',
  'checkboxWithText',
  'multiple-input',
  'stepper',
  'nOptionRadio',
  'gender',
  'toggle',
  'range',
  'datetime',
] as const;
