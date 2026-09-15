import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';
import type { SurveyStructureMatrix, SurveyStructureOption, SurveyStructureResponseEncoding } from 'survey-structure';
import { encodeMatrixSelection, getMatrixResponseValue, isMatrixSelection, setMatrixResponseValue } from 'formly-form-parser';

interface MatrixProps extends FormlyFieldProps {
  locale?: string;
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  matrix?: SurveyStructureMatrix;
  responseEncoding?: SurveyStructureResponseEncoding;
}

@Component({
  selector: 'ffu-viewer-matrix',
  standalone: true,
  imports: [CommonModule, MatRadioModule, MatCheckboxModule],
  template: `
    <section class="ffu-matrix">
      <label class="ffu-matrix-label" *ngIf="showLabel">{{ props.label }}</label>
      <p class="ffu-matrix-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <div class="ffu-matrix-scroll">
        <table class="ffu-matrix-table" *ngIf="mode === 'dual-single'; else cellMatrix">
          <thead>
            <tr>
              <th rowspan="2" scope="col"></th>
              <th *ngFor="let scale of columns" scope="colgroup"
                [attr.colspan]="scaleOptions(scale.code).length + (props.required ? 0 : 1)">{{ scale.label }}</th>
            </tr>
            <tr>
              <ng-container *ngFor="let scale of columns">
                <th *ngFor="let option of scaleOptions(scale.code)" scope="col">{{ option.label }}</th>
                <th *ngIf="!props.required" scope="col">{{ noAnswerLabel }}</th>
              </ng-container>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows; trackBy: trackByOption">
              <th scope="row" class="ffu-matrix-row">{{ row.label }}</th>
              <ng-container *ngFor="let scale of columns">
                <td *ngFor="let option of scaleOptions(scale.code)">
                  <mat-radio-button [name]="radioName(row.code, scale.code)"
                    [value]="option.code" [checked]="cellValue(row.code, scale.code) === option.code"
                    [aria-label]="row.label + ' — ' + scale.label + ' — ' + option.label"
                    [disabled]="formControl.disabled" (change)="selectScaleOption(row.code, scale.code, option.code)"
                  ></mat-radio-button>
                </td>
                <td *ngIf="!props.required">
                  <mat-radio-button [name]="radioName(row.code, scale.code)" value=""
                    [checked]="!cellValue(row.code, scale.code)"
                    [aria-label]="row.label + ' — ' + scale.label + ' — ' + noAnswerLabel"
                    [disabled]="formControl.disabled" (change)="selectScaleOption(row.code, scale.code, '')"
                  ></mat-radio-button>
                </td>
              </ng-container>
            </tr>
          </tbody>
        </table>
        <ng-template #cellMatrix>
        <table class="ffu-matrix-table">
          <thead>
            <tr>
              <th class="ffu-matrix-row"></th>
              <th scope="col" class="ffu-matrix-col-header" *ngFor="let column of columns; trackBy: trackByOption">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows; trackBy: trackByOption">
              <th scope="row" class="ffu-matrix-row">
                <span class="ffu-matrix-row-label" [attr.title]="row.label">{{ row.label }}</span>
              </th>
              <td *ngFor="let column of columns; trackBy: trackByOption">
                <mat-radio-button
                  *ngIf="mode === 'single'"
                  class="ffu-matrix-radio"
                  [name]="radioName(row.code)"
                  [value]="column.code"
                  [checked]="isSelected(row.code, column.code)"
                  [aria-label]="row.label + ' — ' + column.label"
                  [disabled]="formControl.disabled"
                  (change)="selectSingle(row.code, column.code)"
                ></mat-radio-button>

                <mat-checkbox
                  *ngIf="mode === 'multiple'"
                  class="ffu-matrix-check"
                  [checked]="isChecked(row.code, column.code)"
                  [aria-label]="row.label + ' — ' + column.label"
                  [disabled]="formControl.disabled"
                  (change)="selectMultiple(row.code, column.code, !!$event.checked)"
                ></mat-checkbox>
                <input *ngIf="mode === 'text' || mode === 'number'"
                  [type]="mode === 'number' ? 'number' : 'text'"
                  [value]="cellValue(row.code, column.code) ?? ''"
                  [attr.aria-label]="row.label + ' — ' + column.label"
                  [attr.min]="props.min" [attr.max]="props.max" [attr.step]="props.step ?? 'any'"
                  [disabled]="formControl.disabled" (input)="onCellInput(row.code, column.code, $event)" />
              </td>
            </tr>
          </tbody>
        </table>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ffu-matrix {
        display: block;
      }

      .ffu-matrix-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .ffu-matrix-description {
        margin: 0 0 8px;
        color: #5e6573;
      }

      .ffu-matrix-scroll {
        overflow-x: auto;
      }

      .ffu-matrix-table {
        --ffu-matrix-answer-min: 7ch;
        --ffu-matrix-row-min: 12ch;
        --ffu-matrix-row-max: 32ch;
        width: 100%;
        min-width: max-content;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: auto;
      }

      .ffu-matrix-table th,
      .ffu-matrix-table td {
        border: 1px solid #d9dce3;
        padding: 0.45rem 0.55rem;
        text-align: center;
        vertical-align: middle;
        font-weight: 400;
      }

      .ffu-matrix-table th:not(.ffu-matrix-row),
      .ffu-matrix-table td:not(.ffu-matrix-row) {
        min-width: var(--ffu-matrix-answer-min);
      }

      .ffu-matrix-row {
        text-align: left;
        width: var(--ffu-matrix-row-min);
        min-width: var(--ffu-matrix-row-min);
        max-width: var(--ffu-matrix-row-max);
        font-weight: 500;
        white-space: normal;
        vertical-align: top;
      }

      .ffu-matrix-row-label {
        display: block;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .ffu-matrix-col-header {
        font-weight: 500;
      }

      .ffu-matrix-radio,
      .ffu-matrix-check {
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .ffu-matrix-table {
          --ffu-matrix-answer-min: 6ch;
          --ffu-matrix-row-min: 10ch;
          --ffu-matrix-row-max: 24ch;
        }

        .ffu-matrix-table th,
        .ffu-matrix-table td {
          padding: 0.4rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyMatrixType extends FieldType<FieldTypeConfig<MatrixProps>> implements OnInit {
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  get descriptionText(): string {
    return `${this.props?.inlineDescription ?? this.props?.description ?? ''}`.trim();
  }

  ngOnInit(): void {
    let answer: unknown = this.formControl.value;
    for (const row of this.rows) {
      const columns = this.mode === 'single' ? [undefined] : this.columns.map(column => column.code);
      for (const columnCode of columns) {
        const flatValue = this.model?.[this.flatResponseKey(row.code, columnCode)];
        if (getMatrixResponseValue(answer, row.code, columnCode) === undefined && flatValue !== undefined) {
          answer = setMatrixResponseValue(answer, row.code, columnCode, flatValue);
        }
        if (this.model) delete this.model[this.flatResponseKey(row.code, columnCode)];
      }
    }
    if (answer !== this.formControl.value) this.formControl.setValue(answer);
  }

  get rows(): SurveyStructureOption[] {
    return this.props.matrix?.rows ?? [];
  }

  get columns(): SurveyStructureOption[] {
    return this.props.matrix?.columns ?? [];
  }

  get mode(): SurveyStructureMatrix['mode'] | undefined {
    return this.props.matrix?.mode;
  }

  get noAnswerLabel(): string {
    return `${this.props['locale'] ?? 'en'}`.startsWith('es') ? 'Sin respuesta' : 'No answer';
  }

  scaleOptions(code: string): SurveyStructureOption[] {
    const matrix = this.props.matrix;
    return matrix?.mode === 'dual-single' ? matrix.columns.find(column => column.code === code)?.options ?? [] : [];
  }

  trackByOption(index: number, option: SurveyStructureOption): string {
    return option.code;
  }

  radioName(rowCode: string, scaleCode = ''): string {
    return `${this.field.id}_${rowCode}_${scaleCode}`;
  }

  isSelected(rowCode: string, columnCode: string): boolean {
    return getMatrixResponseValue(this.formControl.value, rowCode) === columnCode;
  }

  isChecked(rowCode: string, columnCode: string): boolean {
    return isMatrixSelection(this.cellValue(rowCode, columnCode), this.props.responseEncoding);
  }

  selectSingle(rowCode: string, columnCode: string): void {
    if (this.formControl.disabled || this.mode !== 'single') return;
    this.writeAnswer(rowCode, undefined, columnCode);
  }

  selectMultiple(rowCode: string, columnCode: string, checked: boolean): void {
    if (this.mode !== 'multiple') return;
    this.setCellValue(rowCode, columnCode, encodeMatrixSelection(checked, this.props.responseEncoding));
  }

  cellValue(rowCode: string, columnCode: string): unknown {
    return getMatrixResponseValue(this.formControl.value, rowCode, columnCode);
  }

  onCellInput(rowCode: string, columnCode: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setCellValue(rowCode, columnCode, this.mode === 'number'
      ? input.value === '' ? null : input.valueAsNumber
      : input.value);
  }

  selectScaleOption(rowCode: string, scaleCode: string, optionCode: string): void {
    if (this.mode !== 'dual-single' || (optionCode !== '' && !this.scaleOptions(scaleCode).some(option => option.code === optionCode))) return;
    this.setCellValue(rowCode, scaleCode, optionCode);
  }

  private setCellValue(rowCode: string, columnCode: string, value: SurveyStructureResponseEncoding['selectedValue'] | null): void {
    if (this.formControl.disabled) return;
    this.writeAnswer(rowCode, columnCode, value);
  }

  private writeAnswer(rowCode: string, columnCode: string | undefined, value: SurveyStructureResponseEncoding['selectedValue'] | null): void {
    this.formControl.setValue(setMatrixResponseValue(this.formControl.value, rowCode, columnCode, value));
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  private flatResponseKey(rowCode: string, columnCode?: string): string {
    return `${this.field.key}_${rowCode}${columnCode === undefined ? '' : `_${columnCode}`}`;
  }
}
