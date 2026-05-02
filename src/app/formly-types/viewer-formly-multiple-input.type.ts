import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';

interface MultipleInputRow {
  code: string;
  label: string;
}

interface MultipleInputProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  subquestions?: MultipleInputRow[];
}

@Component({
  selector: 'ffu-viewer-multiple-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ffu-multiple-input">
      <label class="ffu-label" *ngIf="props?.label">{{ props.label }}</label>
      <p class="ffu-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <div class="ffu-row" *ngFor="let row of subquestions; trackBy: trackByRow">
        <label>{{ row.label }}</label>
        <input
          type="text"
          [disabled]="formControl.disabled"
          [value]="getRowValue(row.code)"
          (input)="updateRowValue(row.code, toText($any($event.target).value))"
        />
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

      .ffu-row {
        display: grid;
        gap: 6px;
        margin-bottom: 10px;
      }

      .ffu-row input {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        padding: 6px 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyMultipleInputType extends FieldType<FieldTypeConfig<MultipleInputProps>> implements OnInit {
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  ngOnInit(): void {
    if (!this.formControl.value || typeof this.formControl.value !== 'object' || Array.isArray(this.formControl.value)) {
      this.formControl.setValue({}, { emitEvent: false });
    }
  }

  get subquestions(): MultipleInputRow[] {
    return Array.isArray(this.props.subquestions) ? this.props.subquestions : [];
  }

  get descriptionText(): string {
    return this.toText(this.props?.inlineDescription ?? this.props?.description);
  }

  trackByRow(index: number, row: MultipleInputRow): string {
    return row?.code ?? String(index);
  }

  getRowValue(code: string): string {
    return this.toText(this.formControl.value?.[code]);
  }

  updateRowValue(code: string, value: string): void {
    const current = this.getCurrentObjectValue();
    current[code] = value;
    this.formControl.setValue(current);
  }

  toText(value: unknown): string {
    return String(value ?? '');
  }

  private getCurrentObjectValue(): Record<string, unknown> {
    const value = this.formControl.value;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...value } as Record<string, unknown>;
    }
    return {};
  }
}
