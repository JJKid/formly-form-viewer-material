import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';

interface GenderOption {
  code?: string;
  label: string;
  value: string;
  disabled?: boolean;
}

interface GenderProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  options?: GenderOption[];
}

@Component({
  selector: 'ffu-viewer-gender',
  standalone: true,
  imports: [CommonModule, MatRadioModule],
  template: `
    <section class="ffu-gender">
      <label class="ffu-label" *ngIf="showLabel">{{ props.label }}</label>
      <p class="ffu-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <mat-radio-group
        class="ffu-options"
        [value]="selectedValue"
        [disabled]="formControl.disabled"
        (change)="onSelect(toText($event.value))"
      >
        <mat-radio-button
          *ngFor="let option of genderOptions; let i = index; trackBy: trackByOption"
          [value]="resolveOptionValue(option, i)"
          [disabled]="option.disabled || formControl.disabled"
        >
          <span class="ffu-gender-item">
            <span class="ffu-option-icon">{{ getGenderIcon(option.label) }}</span>
            <span>{{ option.label }}</span>
          </span>
        </mat-radio-button>
      </mat-radio-group>
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
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }

      .ffu-gender-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .ffu-option-icon {
        line-height: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyGenderType extends FieldType<FieldTypeConfig<GenderProps>> {
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  get selectedValue(): string {
    return this.toText(this.formControl.value);
  }

  get descriptionText(): string {
    return this.toText(this.props?.inlineDescription ?? this.props?.description);
  }

  get genderOptions(): GenderOption[] {
    return Array.isArray(this.props.options) ? this.props.options : [];
  }

  readonly trackByOption = (index: number, option: GenderOption): string => this.resolveOptionValue(option, index);

  onSelect(value: string): void {
    this.formControl.setValue(value);
  }

  toText(value: unknown): string {
    return String(value ?? '');
  }

  getGenderIcon(label: string): string {
    const normalized = this.toText(label).trim().toLowerCase();
    if (normalized.includes('female') || normalized.includes('mujer')) {
      return '♀';
    }
    if (normalized.includes('male') || normalized.includes('hombre')) {
      return '♂';
    }
    if (
      normalized.includes('non binary') ||
      normalized.includes('non-binary') ||
      normalized.includes('no binarie') ||
      normalized.includes('no binario')
    ) {
      return '⚧';
    }
    if (normalized.includes('no answer') || normalized.includes('prefiero no')) {
      return '∅';
    }
    return '•';
  }

  resolveOptionValue(option: GenderOption, index: number): string {
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
}
