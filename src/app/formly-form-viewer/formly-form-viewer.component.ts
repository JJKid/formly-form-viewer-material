import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import {
  DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES,
  FormlyViewerUiMessagesDictionary,
} from '../formly-types/formly-viewer-ui-messages';
import { getFormlyViewerRuntimeI18nConfig } from '../formly-types/formly-viewer-validation-messages.provider';

@Component({
  selector: 'formly-form-viewer',
  standalone: true,
  template: `
    <form class="ffv-form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="ffv-theme" [ngClass]="customFieldClass">
        <formly-form [form]="form" [fields]="effectiveFields" [model]="model" [options]="options">
        </formly-form>
      </div>
      <button class="ffv-submit-button" type="submit" *ngIf="showSubmitButton && !hasStepperLayout">{{ submitLabel }}</button>
    </form>
  `,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule
  ],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .ffv-form {
      display: block;
    }

    .ffv-theme {
      --ffv-font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
      --ffv-text-color: #1f2937;
      --ffv-muted-color: #5e6573;
      --ffv-field-gap: clamp(0.8rem, 1.8vw, 1.1rem);
      --ffv-label-font-size: 1.05rem;
      --ffv-label-font-weight: 500;
      --ffv-label-line-height: 1.3;
      --ffv-label-gap: 8px;
      --ffv-radio-gap: 0.55rem;
      font-family: var(--ffv-font-family);
      color: var(--ffv-text-color);
    }

    .ffv-theme .ffu-label,
    .ffv-theme .ffu-matrix-label {
      margin: 0 0 var(--ffv-label-gap);
      font-weight: var(--ffv-label-font-weight);
      font-size: var(--ffv-label-font-size);
      line-height: var(--ffv-label-line-height);
      color: var(--ffv-text-color);
    }

    .ffv-theme :where(.ffu-description, .ffu-matrix-description, .ffu-stepper-status) {
      color: var(--ffv-muted-color);
      font-size: 0.92rem;
      line-height: 1.35;
    }

    .ffv-theme :where(input[type="text"], input[type="number"], input[type="email"], input[type="date"], input[type="time"], input[type="month"], input[type="datetime-local"], textarea, select) {
      font: inherit;
      color: inherit;
    }

    .ffv-theme formly-field {
      display: block;
      margin: 0 !important;
      min-width: 0;
    }

    .ffv-theme .formly-form > formly-field + formly-field,
    .ffv-theme .formly-form formly-group > formly-field + formly-field {
      margin-top: var(--ffv-field-gap) !important;
    }

    .ffv-theme formly-field-mat-radio .mat-mdc-radio-group {
      display: grid;
      gap: var(--ffv-radio-gap);
    }

    .ffv-theme :where(.mat-mdc-form-field-type-radio, .mat-mdc-form-field-type-mat-radio) :where(mat-label, .mdc-floating-label, .mat-mdc-floating-label) {
      font-weight: var(--ffv-label-font-weight) !important;
      font-size: var(--ffv-label-font-size) !important;
      line-height: var(--ffv-label-line-height) !important;
      color: var(--ffv-text-color);
    }

    .ffv-theme :where(.mat-mdc-form-field) .mat-mdc-form-field-infix {
      min-width: 0;
    }

    .ffv-theme :where(.mat-mdc-input-element) {
      line-height: 1.35;
    }

    .ffv-submit-button {
      margin-top: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      border: 0;
      background: #1f6ff6;
      color: #fff;
      cursor: pointer;
      font-weight: 600;
    }
    .ffv-submit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class FormlyViewerComponent implements OnInit, OnChanges {
  @Input() form: FormGroup = new FormGroup({});
  @Input() fields: FormlyFieldConfig[] = [];
  @Input() model: any = {};
  @Input() options: FormlyFormOptions = {};
  @Input() customFieldClass?: string;
  @Input() showSubmitButton = true;
  @Output() submitForm = new EventEmitter<any>();
  hasStepperLayout = false;
  effectiveFields: FormlyFieldConfig[] = [];
  private readonly plainRendererTypes = new Set([
    'repeat',
    'stepper',
  ]);
  private readonly inlineDescriptionTypes = new Set([
    'matrix',
    'nOptionRadio',
    'gender',
    'selectInline',
    'checkboxWithText',
    'multiple-input',
  ]);
  private readonly viewerWrappedTypes = new Set([
    'input',
    'number',
    'integer',
    'textarea',
    'select',
    'native-select',
    'radio',
    'checkbox',
    'multicheckbox',
    'toggle',
    'slider',
    'datepicker',
    'matrix',
    'nOptionRadio',
    'gender',
    'selectInline',
    'checkboxWithText',
    'multiple-input',
  ]);

  ngOnInit() {
    this.rebuildEffectiveFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] && !changes['fields'].firstChange) {
      this.resetRuntimeState();
    }
    if (changes['fields']) {
      this.rebuildEffectiveFields();
    }
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.submitForm.emit(this.model);
    }
  }

  private detectStepper(fields: FormlyFieldConfig[] | null | undefined): boolean {
    if (!Array.isArray(fields)) {
      return false;
    }

    return fields.some((field) => {
      if (field?.type === 'stepper') {
        return true;
      }
      if (Array.isArray(field?.fieldGroup)) {
        return this.detectStepper(field.fieldGroup);
      }
      return false;
    });
  }

  private rebuildEffectiveFields(): void {
    const locale = this.resolvedLocale;
    this.effectiveFields = this.withLocaleAndWrappers(this.fields, locale);
    this.hasStepperLayout = this.detectStepper(this.effectiveFields);
  }

  private resetRuntimeState(): void {
    this.form = new FormGroup({});
    this.model = {};
    this.options = {};
  }

  private withLocaleAndWrappers(fields: FormlyFieldConfig[] | null | undefined, locale: string): FormlyFieldConfig[] {
    if (!Array.isArray(fields)) {
      return [];
    }

    return fields.map((field) => this.cloneField(field, locale));
  }

  private cloneField(field: FormlyFieldConfig, locale: string): FormlyFieldConfig {
    const typeName = this.normalizeTypeName(typeof field.type === 'string' ? field.type : '');
    const cloned: FormlyFieldConfig = {
      ...field,
      type: typeName || field.type,
      wrappers: this.resolveEffectiveWrappers(typeName, field.wrappers),
      props: this.buildNormalizedProps(field, typeName, locale),
      validators: this.sanitizeValidatorBag(field.validators),
      asyncValidators: this.sanitizeValidatorBag(field.asyncValidators),
    };

    if (Array.isArray(field.fieldGroup)) {
      cloned.fieldGroup = this.withLocaleAndWrappers(field.fieldGroup, locale);
    }

    if (field.fieldArray && typeof field.fieldArray === 'object') {
      cloned.fieldArray = this.cloneField(field.fieldArray as FormlyFieldConfig, locale);
    }

    return cloned;
  }

  private sanitizeValidatorBag(
    value: FormlyFieldConfig['validators'] | FormlyFieldConfig['asyncValidators'],
  ): FormlyFieldConfig['validators'] | FormlyFieldConfig['asyncValidators'] | undefined {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const normalized: Record<string, unknown> = {};
    for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'validation') {
        const list = Array.isArray(candidate)
          ? candidate
            .map((item) => this.normalizeValidatorCandidate('', item))
            .filter((item) => item != null)
          : [];
        if (list.length > 0) {
          normalized['validation'] = list;
        }
        continue;
      }

      const normalizedCandidate = this.normalizeValidatorCandidate(key, candidate);
      if (normalizedCandidate == null) {
        continue;
      }
      normalized[key] = normalizedCandidate;
    }

    return Object.keys(normalized).length > 0
      ? (normalized as FormlyFieldConfig['validators'] | FormlyFieldConfig['asyncValidators'])
      : undefined;
  }

  private normalizeValidatorCandidate(name: string, candidate: unknown): unknown {
    if (candidate == null || candidate === false) {
      return undefined;
    }

    if (candidate === true) {
      return name || undefined;
    }

    const candidateType = typeof candidate;
    if (candidateType === 'string' || candidateType === 'function') {
      return candidate;
    }

    if (candidateType !== 'object') {
      return undefined;
    }

    if (Array.isArray(candidate)) {
      return candidate;
    }

    const asObject = candidate as Record<string, unknown>;
    if (asObject['name'] || asObject['expression'] || asObject['validation']) {
      return asObject;
    }

    return name || undefined;
  }

  private resolveEffectiveWrappers(
    typeName: string,
    wrappers: FormlyFieldConfig['wrappers'],
  ): FormlyFieldConfig['wrappers'] {
    if (this.plainRendererTypes.has(typeName)) {
      return [];
    }

    return this.resolveWrappers(typeName, this.normalizeIncomingWrappers(wrappers));
  }

  private normalizeIncomingWrappers(
    wrappers: FormlyFieldConfig['wrappers'],
  ): FormlyFieldConfig['wrappers'] {
    return Array.isArray(wrappers) && wrappers.length === 0 ? undefined : wrappers;
  }

  private buildNormalizedProps(
    field: FormlyFieldConfig,
    typeName: string,
    locale: string,
  ): FormlyFieldConfig['props'] {
    const uiMessages = this.getUiMessages(locale);
    const props = {
      ...(field.props ?? {}),
      type: this.resolveNativeInputType(typeName, field),
      labelPosition: this.resolveLabelPosition(typeName, field),
      locale: (field.props as any)?.locale ?? locale,
      viewerUi: uiMessages,
    } as any;

    const label = `${props.label ?? ''}`.trim();
    const externalLabel = `${props.externalLabel ?? ''}`.trim();
    if (!label && externalLabel) {
      props.label = externalLabel;
    }

    this.normalizeInlineDescription(typeName, props);
    return props;
  }

  get resolvedLocale(): string {
    const runtimeLocale = getFormlyViewerRuntimeI18nConfig().defaultLanguage;
    const normalized = `${runtimeLocale ?? 'en'}`.trim();
    return normalized || 'en';
  }

  get submitLabel(): string {
    return this.getUiMessages(this.resolvedLocale).submitLabel;
  }

  private getUiMessages(locale: string): FormlyViewerUiMessagesDictionary {
    const runtimeDictionaries = getFormlyViewerRuntimeI18nConfig().uiDictionaries;
    const dictionaries = runtimeDictionaries ?? DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES;
    const normalizedLocale = `${locale ?? ''}`.trim().toLowerCase();
    if (!normalizedLocale) {
      return dictionaries['en'];
    }
    if (dictionaries[normalizedLocale]) {
      return dictionaries[normalizedLocale];
    }
    const shortLocale = normalizedLocale.startsWith('es') ? 'es' : normalizedLocale.startsWith('en') ? 'en' : normalizedLocale;
    return dictionaries[shortLocale] ?? dictionaries['en'];
  }

  private normalizeTypeName(typeName: string): string {
    if (!typeName) {
      return typeName;
    }

    const aliasMap: Record<string, string> = {
      range: 'slider',
      datetime: 'datepicker',
    };

    return aliasMap[typeName] ?? typeName;
  }

  private resolveNativeInputType(typeName: string, field: FormlyFieldConfig): string | undefined {
    if (typeName !== 'input') {
      return (field.props as any)?.type;
    }

    const explicitType = `${(field.props as any)?.type ?? ''}`.trim();
    if (explicitType) {
      return explicitType;
    }

    const subtype = `${(field.props as any)?.subtype ?? ''}`.trim();
    if (!subtype) {
      return undefined;
    }

    return subtype;
  }

  private resolveWrappers(typeName: string, wrappers: FormlyFieldConfig['wrappers']): FormlyFieldConfig['wrappers'] {
    if (Array.isArray(wrappers) && wrappers.length > 0) {
      const sanitizedWrappers = wrappers.filter((wrapper) => wrapper !== 'panel');

      if (!this.viewerWrappedTypes.has(typeName)) {
        return sanitizedWrappers.length > 0 ? sanitizedWrappers : undefined;
      }

      const mappedWrappers = sanitizedWrappers.map((wrapper) =>
        wrapper === 'form-field' ? 'viewer-form-field' : wrapper,
      );
      return mappedWrappers.length > 0 ? mappedWrappers : ['viewer-form-field'];
    }

    if (this.viewerWrappedTypes.has(typeName)) {
      return ['viewer-form-field'];
    }

    return wrappers;
  }

  private resolveLabelPosition(typeName: string, field: FormlyFieldConfig): string | undefined {
    const raw = `${(field.props as any)?.labelPosition ?? ''}`.trim().toLowerCase();
    if (!raw) {
      return (field.props as any)?.labelPosition;
    }

    if ((typeName === 'radio' || typeName === 'checkbox' || typeName === 'toggle') && raw === 'stacked') {
      return 'after';
    }

    return (field.props as any)?.labelPosition;
  }

  private normalizeInlineDescription(typeName: string, props: Record<string, unknown>): void {
    if (!this.inlineDescriptionTypes.has(typeName)) {
      return;
    }

    const description = `${props['description'] ?? ''}`.trim();
    if (!description) {
      return;
    }

    props['inlineDescription'] = description;
    delete props['description'];
  }
}
