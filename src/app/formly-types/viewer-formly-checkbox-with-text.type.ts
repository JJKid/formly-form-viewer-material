import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';
import { FormlyViewerUiMessagesDictionary } from './formly-viewer-ui-messages';
import type { SurveyStructureOtherResponse, SurveyStructureResponseEncoding } from 'survey-structure';

interface CheckboxWithTextOption {
  code?: string;
  label: string;
  value: string;
  comment?: string;
  disabled?: boolean;
}

interface CheckboxWithTextProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  locale?: string;
  viewerUi?: FormlyViewerUiMessagesDictionary;
  options?: CheckboxWithTextOption[];
  otherWithComment?: boolean;
  otherResponse?: SurveyStructureOtherResponse;
  responseEncoding?: SurveyStructureResponseEncoding;
}

@Component({
  selector: 'ffu-viewer-checkbox-with-text',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="ffu-checkbox-text">
      <label class="ffu-label" *ngIf="showLabel">{{ props.label }}</label>
      <p class="ffu-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <div class="ffu-option-row" *ngFor="let option of checkboxOptions; let i = index; trackBy: trackByOption">
        <mat-checkbox
          class="ffu-option-toggle"
          [checked]="isSelected(resolveOptionValue(option, i))"
          [disabled]="option.disabled || formControl.disabled"
          (change)="onToggleOption(!!$event.checked, resolveOptionValue(option, i))"
        >
          {{ option.label }}
        </mat-checkbox>

        <mat-form-field class="ffu-comment-field" appearance="outline" subscriptSizing="dynamic">
          <input
            matInput
            type="text"
            [disabled]="option.disabled || formControl.disabled || !isSelected(resolveOptionValue(option, i))"
            [value]="getComment(option, i)"
            [placeholder]="commentPlaceholder"
            (focus)="onCommentFocus(option, i)"
            (input)="updateComment(option, i, toText($any($event.target).value))"
          />
        </mat-form-field>
        <mat-form-field class="ffu-comment-field" appearance="outline" *ngIf="props.otherWithComment && isOtherOption(option, i)">
          <mat-label>{{ otherLabel }}</mat-label>
          <input matInput type="text" [disabled]="formControl.disabled || !isSelected(resolveOptionValue(option, i))"
            [value]="otherValue" (input)="updateOtherValue(toText($any($event.target).value))" />
        </mat-form-field>
      </div>
    </section>
  `,
  styles: [
    `
      .ffu-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .ffu-description {
        margin: 0 0 8px;
        color: #5e6573;
      }

      .ffu-option-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: clamp(0.45rem, 1.4vw, 0.7rem);
        margin-bottom: clamp(0.55rem, 1.5vw, 0.8rem);
      }

      .ffu-option-toggle {
        min-width: 0;
      }

      .ffu-comment-field {
        width: 100%;
        margin-top: 0;
      }

      @media (max-width: 520px) {
        .ffu-option-row {
          grid-template-columns: 1fr;
          align-items: stretch;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyCheckboxWithTextType extends FieldType<FieldTypeConfig<CheckboxWithTextProps>> implements OnInit {
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  ngOnInit(): void {
    if (!Array.isArray(this.formControl.value)) {
      this.formControl.setValue([], { emitEvent: false });
    }
    const selected = this.checkboxOptions.filter((option, index) => {
      const code = this.resolveOptionValue(option, index);
      return code === this.otherCode ? !!this.otherValue.trim()
        : Object.is(this.model?.[`${this.fieldKey}_${code}`], this.props.responseEncoding?.selectedValue ?? true);
    }).map((option, index) => this.resolveOptionValue(option, index));
    if (selected.length) this.formControl.setValue(selected, { emitEvent: false });
  }

  get checkboxOptions(): CheckboxWithTextOption[] {
    return Array.isArray(this.props.options) ? this.props.options : [];
  }

  get descriptionText(): string {
    return this.toText(this.props?.inlineDescription ?? this.props?.description);
  }

  get commentPlaceholder(): string {
    const fromViewerUi = this.props?.viewerUi?.checkboxWithText?.commentPlaceholder;
    if (fromViewerUi && `${fromViewerUi}`.trim()) {
      return `${fromViewerUi}`;
    }
    return this.resolveLanguage() === 'es' ? 'Comentario' : 'Comment';
  }

  isSelected(optionValue: string): boolean {
    return this.selectedValues.includes(optionValue);
  }

  onToggleOption(checked: boolean, optionValue: string): void {
    const nextValues = checked
      ? Array.from(new Set([...this.selectedValues, optionValue]))
      : this.selectedValues.filter((value) => value !== optionValue);

    this.formControl.setValue(nextValues);
    if (this.model && this.fieldKey) {
      if (optionValue !== this.otherCode) this.model[`${this.fieldKey}_${optionValue}`] = checked
        ? this.props.responseEncoding?.selectedValue ?? true : this.props.responseEncoding?.unselectedValue ?? false;
      if (!checked) {
        this.model[this.commentKey(optionValue)] = '';
        if (optionValue === this.otherCode) this.model[this.otherTextKey] = '';
      }
    }
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  updateComment(option: CheckboxWithTextOption, index: number, comment: string): void {
    const optionKey = this.resolveOptionKey(option, index);
    if (!optionKey || !this.model || !this.isSelected(this.resolveOptionValue(option, index))) {
      return;
    }

    this.model[this.commentKey(optionKey)] = comment;
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  onCommentFocus(option: CheckboxWithTextOption, index: number): void {
    if (option.disabled || this.formControl.disabled) {
      return;
    }

    const optionValue = this.resolveOptionValue(option, index);
    if (this.isSelected(optionValue)) {
      return;
    }

    this.onToggleOption(true, optionValue);
  }

  getComment(option: CheckboxWithTextOption, index: number): string {
    const optionKey = this.resolveOptionKey(option, index);
    if (!optionKey) {
      return '';
    }

    return this.toText(this.model?.[this.commentKey(optionKey)] ?? option.comment);
  }

  readonly trackByOption = (index: number, option: CheckboxWithTextOption): string => this.resolveOptionValue(option, index);

  toText(value: unknown): string {
    return String(value ?? '');
  }

  private get selectedValues(): string[] {
    return Array.isArray(this.formControl.value)
      ? this.formControl.value.map((value: unknown) => this.toText(value))
      : [];
  }

  private get fieldKey(): string | null {
    const key = this.field.key;
    if (Array.isArray(key)) return key.length === 1 ? String(key[0]) : null;
    return typeof key === 'string' || typeof key === 'number' ? String(key) : null;
  }
  private get otherCode(): string { return this.props.otherResponse?.code ?? '-oth-'; }
  private get otherTextKey(): string { return this.props.otherResponse?.textResponseKey ?? `${this.fieldKey}_OTHER_value`; }
  private commentKey(code: string): string {
    return code === this.otherCode ? this.props.otherResponse?.commentResponseKey ?? `${this.fieldKey}_OTHER_comment`
      : `${this.fieldKey}_${code}_comment`;
  }
  isOtherOption(option: CheckboxWithTextOption, index: number): boolean { return this.resolveOptionValue(option, index) === this.otherCode; }
  get otherLabel(): string { return this.resolveLanguage() === 'es' ? 'Especifica' : 'Specify'; }
  get otherValue(): string { return this.toText(this.model?.[this.otherTextKey]); }
  updateOtherValue(value: string): void {
    if (!this.model || !this.isSelected(this.otherCode) || this.formControl.disabled) return;
    this.model[this.otherTextKey] = value;
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.formControl.updateValueAndValidity();
  }

  private resolveLanguage(): 'es' | 'en' {
    const rawLanguage = `${this.props.locale ?? ''}`.toLowerCase();
    if (rawLanguage.startsWith('es')) {
      return 'es';
    }
    return 'en';
  }

  resolveOptionValue(option: CheckboxWithTextOption, index: number): string {
    const preferred = this.toText(option.value).trim();
    if (preferred) {
      return preferred;
    }

    const byCode = this.toText(option.code).trim();
    if (byCode) {
      return byCode;
    }

    const byLabel = this.toText(option.label).trim();
    if (byLabel) {
      return byLabel;
    }

    return `OPTION_${index + 1}`;
  }

  private resolveOptionKey(option: CheckboxWithTextOption, index: number): string {
    const byCode = this.toText(option.code).trim();
    if (byCode) {
      return byCode;
    }
    return this.resolveOptionValue(option, index);
  }
}
