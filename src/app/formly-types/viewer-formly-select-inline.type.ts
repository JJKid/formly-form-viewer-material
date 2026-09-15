import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';
import type { SurveyStructureOtherResponse, SurveyStructureResponseEncoding } from 'survey-structure';

interface SelectInlineOption {
  code?: string;
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectInlineProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  multiple?: boolean;
  locale?: string;
  options?: SelectInlineOption[];
  otherWithComment?: boolean;
  otherPlaceholder?: string;
  otherResponse?: SurveyStructureOtherResponse;
  responseEncoding?: SurveyStructureResponseEncoding;
  commentWithSelection?: boolean;
  commentPlaceholder?: string;
}

@Component({
  selector: 'ffu-viewer-select-inline',
  standalone: true,
  imports: [CommonModule, MatRadioModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="ffu-select-inline">
      <label class="ffu-label" *ngIf="showLabel">{{ props.label }}</label>
      <p class="ffu-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <mat-radio-group
        *ngIf="!isMultiple; else multipleTemplate"
        class="ffu-options ffu-options--single"
        [value]="singleValue"
        [disabled]="formControl.disabled"
        (change)="onSingleSelectionChange(toText($event.value))"
      >
        <mat-radio-button
          *ngFor="let option of selectOptions; let i = index; trackBy: trackByOption"
          class="ffu-option-radio"
          [value]="resolveOptionValue(option, i)"
          [disabled]="option.disabled || formControl.disabled"
        >
          {{ option.label }}
        </mat-radio-button>
      </mat-radio-group>

      <ng-template #multipleTemplate>
        <div class="ffu-options ffu-options--multiple">
          <mat-checkbox
            *ngFor="let option of selectOptions; let i = index; trackBy: trackByOption"
            class="ffu-option-checkbox"
            [checked]="isMultipleChecked(resolveOptionValue(option, i))"
            [disabled]="option.disabled || formControl.disabled"
            (change)="onToggleMultiple(!!$event.checked, resolveOptionValue(option, i))"
          >
            {{ option.label }}
          </mat-checkbox>
        </div>
      </ng-template>

      <mat-form-field class="ffu-other" appearance="outline" subscriptSizing="dynamic" *ngIf="showOtherCommentInput">
        <mat-label>{{ otherLabel }}</mat-label>
        <input
          matInput
          type="text"
          [disabled]="formControl.disabled"
          [placeholder]="otherPlaceholder"
          [value]="otherComment"
          (input)="updateOtherComment(toText($any($event.target).value))"
        />
      </mat-form-field>
      <mat-form-field class="ffu-other" appearance="outline" subscriptSizing="dynamic" *ngIf="props.commentWithSelection">
        <mat-label>{{ selectionCommentLabel }}</mat-label>
        <input matInput type="text" [disabled]="formControl.disabled" [value]="selectionComment"
          [placeholder]="props.commentPlaceholder ?? selectionCommentLabel"
          (input)="updateSelectionComment(toText($any($event.target).value))" />
      </mat-form-field>
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

      .ffu-options {
        display: grid;
        gap: 8px;
      }

      .ffu-option-radio,
      .ffu-option-checkbox {
        display: block;
      }

      .ffu-other {
        width: 100%;
        margin-top: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlySelectInlineType extends FieldType<FieldTypeConfig<SelectInlineProps>> implements OnInit {
  private get otherOptionCode(): string { return this.props.otherResponse?.code ?? '-oth-'; }
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  ngOnInit(): void {
    if (!this.isMultiple) {
      return;
    }

    if (!Array.isArray(this.formControl.value)) {
      this.formControl.setValue([], { emitEvent: false });
    }
  }

  get isMultiple(): boolean {
    return !!this.props.multiple;
  }

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  get selectOptions(): SelectInlineOption[] {
    return Array.isArray(this.props.options) ? this.props.options : [];
  }

  get singleValue(): string {
    return this.toText(this.formControl.value);
  }

  get descriptionText(): string {
    return this.toText(this.props?.inlineDescription ?? this.props?.description);
  }

  get showOtherCommentInput(): boolean {
    if (!this.props.otherWithComment) {
      return false;
    }

    if (this.isMultiple) {
      return this.selectedValues.some((value) => this.isOtherValue(value));
    }

    return this.isOtherValue(this.toText(this.formControl.value));
  }

  get otherPlaceholder(): string {
    return this.toText(this.props.otherPlaceholder || this.otherLabel);
  }

  get otherLabel(): string {
    return this.resolveLanguage() === 'es' ? 'Especifica' : 'Specify';
  }

  get otherComment(): string {
    const key = this.resolveOtherCommentModelKey();
    if (!key || !this.model) {
      return '';
    }
    return this.toText((this.model as Record<string, unknown>)[key]);
  }

  get selectionCommentLabel(): string { return this.resolveLanguage() === 'es' ? 'Comentario' : 'Comment'; }
  get selectionComment(): string { return this.toText(this.model?.[`${this.fieldKey}_comment`]); }
  updateSelectionComment(value: string): void {
    if (!this.fieldKey || !this.model || !this.props.commentWithSelection || this.formControl.disabled) return;
    this.model[`${this.fieldKey}_comment`] = value;
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.formControl.updateValueAndValidity();
  }

  isMultipleChecked(optionValue: string): boolean {
    return this.selectedValues.includes(optionValue);
  }

  onToggleMultiple(checked: boolean, optionValue: string): void {
    const nextValues = checked
      ? Array.from(new Set([...this.selectedValues, optionValue]))
      : this.selectedValues.filter((value) => value !== optionValue);

    this.formControl.setValue(nextValues);
    this.selectOptions.forEach((option, index) => {
      const code = this.resolveOptionValue(option, index);
      if (this.model && this.fieldKey && code !== this.otherOptionCode) this.model[`${this.fieldKey}_${code}`] = nextValues.includes(code)
        ? this.props.responseEncoding?.selectedValue ?? true : this.props.responseEncoding?.unselectedValue ?? false;
    });
    if (!checked && this.isOtherValue(optionValue)) {
      this.updateOtherComment('');
    }
  }

  onSingleSelectionChange(value: string): void {
    this.formControl.setValue(value);
    if (!this.isOtherValue(value)) {
      this.updateOtherComment('');
    }
  }

  updateOtherComment(value: string): void {
    const key = this.resolveOtherCommentModelKey();
    if (!key || !this.model) {
      return;
    }
    (this.model as Record<string, unknown>)[key] = value;
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.formControl.updateValueAndValidity();
  }

  readonly trackByOption = (index: number, option: SelectInlineOption): string => this.resolveOptionValue(option, index);

  toText(value: unknown): string {
    return String(value ?? '');
  }

  private get selectedValues(): string[] {
    return Array.isArray(this.formControl.value)
      ? this.formControl.value.map((value: unknown) => this.toText(value))
      : [];
  }

  private isOtherValue(value: string): boolean {
    if (!value) {
      return false;
    }
    return this.otherValues.includes(value);
  }

  private get otherValues(): string[] {
    return this.selectOptions
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => option.code === this.otherOptionCode || option.value === this.otherOptionCode)
      .map(({ option, index }) => this.resolveOptionValue(option, index));
  }

  resolveOptionValue(option: SelectInlineOption, index: number): string {
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

  private resolveOtherCommentModelKey(): string | null {
    return this.props.otherResponse?.textResponseKey ?? (this.fieldKey ? `${this.fieldKey}_OTHER_value` : null);
  }

  private get fieldKey(): string | null {
    const key = this.field.key;
    if (Array.isArray(key)) return key.length === 1 ? String(key[0]) : null;
    return typeof key === 'string' || typeof key === 'number' ? String(key) : null;
  }

  private resolveLanguage(): 'es' | 'en' {
    const rawLanguage = `${this.props.locale ?? ''}`.toLowerCase();
    if (rawLanguage.startsWith('es')) {
      return 'es';
    }
    return 'en';
  }
}
