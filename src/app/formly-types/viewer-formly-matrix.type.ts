import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';

interface MatrixRow {
  code: string;
  label: string;
}

interface MatrixColumn {
  code: string;
  label: string;
  value?: string;
}

interface MatrixProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  matrix?: {
    rows?: MatrixRow[];
    columns?: MatrixColumn[];
    selectionMode?: 'single' | 'multiple' | string;
  };
  selectionMode?: 'single' | 'multiple' | string;
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
        <table class="ffu-matrix-table">
          <thead>
            <tr>
              <th class="ffu-matrix-row"></th>
              <th class="ffu-matrix-col-header" *ngFor="let column of columns; trackBy: trackByColumn">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows; trackBy: trackByRow">
              <th scope="row" class="ffu-matrix-row">
                <span class="ffu-matrix-row-label" [attr.title]="row.label">{{ row.label }}</span>
              </th>
              <td *ngFor="let column of columns; trackBy: trackByColumn">
                <mat-radio-button
                  *ngIf="isSingleMode"
                  class="ffu-matrix-radio"
                  [name]="radioName(row.code)"
                  [value]="column.code"
                  [checked]="isSelected(row.code, column.code)"
                  [disabled]="formControl.disabled"
                  (change)="selectSingle(row.code, column.code)"
                ></mat-radio-button>

                <mat-checkbox
                  *ngIf="!isSingleMode"
                  class="ffu-matrix-check"
                  [checked]="isChecked(row.code, column.code)"
                  [disabled]="formControl.disabled"
                  (change)="selectMultiple(row.code, column.code, !!$event.checked)"
                ></mat-checkbox>
              </td>
            </tr>
          </tbody>
        </table>
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
    if (!this.formControl.value || typeof this.formControl.value !== 'object' || Array.isArray(this.formControl.value)) {
      this.formControl.setValue({}, { emitEvent: false });
    }
  }

  get rows(): MatrixRow[] {
    const matrixRows = this.props?.matrix?.rows;
    if (Array.isArray(matrixRows)) {
      return matrixRows;
    }
    const fallbackRows = (this.props as any)?.rows;
    return Array.isArray(fallbackRows) ? fallbackRows : [];
  }

  get columns(): MatrixColumn[] {
    const matrixColumns = this.props?.matrix?.columns;
    if (Array.isArray(matrixColumns)) {
      return matrixColumns;
    }
    const fallbackColumns = (this.props as any)?.columns;
    return Array.isArray(fallbackColumns) ? fallbackColumns : [];
  }

  get isSingleMode(): boolean {
    const mode = this.props?.matrix?.selectionMode ?? this.props?.selectionMode;
    return mode !== 'multiple';
  }

  trackByRow(index: number, row: MatrixRow): string {
    return row?.code ?? String(index);
  }

  trackByColumn(index: number, column: MatrixColumn): string {
    return column?.code ?? String(index);
  }

  radioName(rowCode: string): string {
    return `${String(this.field.key ?? this.field.id ?? 'matrix')}_${rowCode}`;
  }

  isSelected(rowCode: string, columnCode: string): boolean {
    return `${this.formControl.value?.[rowCode] ?? ''}` === columnCode;
  }

  isChecked(rowCode: string, columnCode: string): boolean {
    return !!this.formControl.value?.[rowCode]?.[columnCode];
  }

  selectSingle(rowCode: string, columnCode: string): void {
    const current = this.getCurrentObjectValue();
    current[rowCode] = columnCode;
    this.formControl.setValue(current);
  }

  selectMultiple(rowCode: string, columnCode: string, checked: boolean): void {
    const current = this.getCurrentObjectValue();
    const currentRow = current[rowCode];
    const nextRow = currentRow && typeof currentRow === 'object' && !Array.isArray(currentRow)
      ? { ...currentRow }
      : {};

    nextRow[columnCode] = checked;
    current[rowCode] = nextRow;
    this.formControl.setValue(current);
  }

  private getCurrentObjectValue(): Record<string, any> {
    const value = this.formControl.value;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...value };
    }
    return {};
  }
}
