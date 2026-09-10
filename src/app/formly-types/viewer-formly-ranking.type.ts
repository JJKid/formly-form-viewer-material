import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';

interface RankingOption {
  code?: string;
  label: string;
  value: string;
  disabled?: boolean;
}

interface RankingProps extends FormlyFieldProps {
  label?: string;
  description?: string;
  inlineDescription?: string;
  show_label?: boolean;
  options?: RankingOption[];
}

@Component({
  selector: 'ffu-viewer-ranking',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatButtonModule],
  template: `
    <section class="ffu-ranking">
      <label class="ffu-label" *ngIf="showLabel">{{ props.label }}</label>
      <p class="ffu-description" *ngIf="descriptionText">{{ descriptionText }}</p>

      <div
        cdkDropList
        class="ffu-ranking-list"
        [cdkDropListData]="rankingOptions"
        (cdkDropListDropped)="drop($event)"
      >
        <div
          class="ffu-ranking-item"
          *ngFor="let option of rankingOptions; let index = index; trackBy: trackByOption"
          cdkDrag
          [cdkDragDisabled]="formControl.disabled || option.disabled"
        >
          <span class="ffu-ranking-position">{{ index + 1 }}</span>
          <span class="ffu-ranking-label">{{ option.label }}</span>
          <span class="ffu-ranking-actions">
            <button
              mat-button
              type="button"
              [disabled]="formControl.disabled || option.disabled || index === 0"
              (click)="moveUp(index)"
            >
              Subir
            </button>
            <button
              mat-button
              type="button"
              [disabled]="formControl.disabled || option.disabled || index === rankingOptions.length - 1"
              (click)="moveDown(index)"
            >
              Bajar
            </button>
          </span>
        </div>
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

      .ffu-ranking-list {
        display: grid;
        gap: 8px;
      }

      .ffu-ranking-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid #d5d9e2;
        border-radius: 6px;
        background: #fff;
        cursor: grab;
      }

      .ffu-ranking-item:active {
        cursor: grabbing;
      }

      .ffu-ranking-position {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        border-radius: 999px;
        background: #eef2f7;
        font-weight: 600;
      }

      .ffu-ranking-label {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .ffu-ranking-actions {
        display: inline-flex;
        gap: 4px;
      }

      .cdk-drag-preview {
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
      }

      .cdk-drag-placeholder {
        opacity: 0.35;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyRankingType extends FieldType<FieldTypeConfig<RankingProps>> implements OnInit {
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  ngOnInit(): void {
    this.syncControlValue(this.resolveInitialOrder(), false);
  }

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  get descriptionText(): string {
    return this.toText(this.props?.inlineDescription ?? this.props?.description);
  }

  get rankingOptions(): RankingOption[] {
    const byCode = new Map(this.optionSource.map((option) => [this.resolveOptionCode(option), option]));
    return this.currentOrder
      .map((code) => byCode.get(code))
      .filter((option): option is RankingOption => !!option);
  }

  drop(event: CdkDragDrop<RankingOption[]>): void {
    if (this.formControl.disabled || event.previousIndex === event.currentIndex) {
      return;
    }
    const nextOrder = [...this.currentOrder];
    moveItemInArray(nextOrder, event.previousIndex, event.currentIndex);
    this.syncControlValue(nextOrder);
  }

  moveUp(index: number): void {
    if (this.formControl.disabled || index <= 0) {
      return;
    }
    this.moveOption(index, index - 1);
  }

  moveDown(index: number): void {
    if (this.formControl.disabled || index >= this.currentOrder.length - 1) {
      return;
    }
    this.moveOption(index, index + 1);
  }

  readonly trackByOption = (index: number, option: RankingOption): string => this.resolveOptionCode(option) || String(index);

  toText(value: unknown): string {
    return String(value ?? '');
  }

  private moveOption(fromIndex: number, toIndex: number): void {
    const nextOrder = [...this.currentOrder];
    moveItemInArray(nextOrder, fromIndex, toIndex);
    this.syncControlValue(nextOrder);
  }

  private syncControlValue(order: string[], emitEvent = true): void {
    this.formControl.setValue(order, { emitEvent });
    if (!emitEvent) {
      return;
    }
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.formControl.updateValueAndValidity();
  }

  private resolveInitialOrder(): string[] {
    const validCodes = this.optionSource
      .map((option) => this.resolveOptionCode(option))
      .filter((code) => !!code);
    const currentValue = Array.isArray(this.formControl.value)
      ? this.formControl.value.map((value: unknown) => this.toText(value).trim()).filter((value: string) => !!value)
      : [];
    const currentSet = new Set(currentValue);
    const knownCurrent = currentValue.filter((code) => validCodes.includes(code));
    const missingCodes = validCodes.filter((code) => !currentSet.has(code));
    return [...knownCurrent, ...missingCodes];
  }

  private get optionSource(): RankingOption[] {
    return Array.isArray(this.props.options) ? this.props.options : [];
  }

  private get currentOrder(): string[] {
    return this.resolveInitialOrder();
  }

  private resolveOptionCode(option: RankingOption): string {
    return this.toText(option?.code ?? option?.value).trim();
  }
}
