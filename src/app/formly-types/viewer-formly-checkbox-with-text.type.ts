import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType, FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS } from './material-wrapper-default-options';
import { FormlyViewerUiMessagesDictionary } from './formly-viewer-ui-messages';

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
            [disabled]="option.disabled || formControl.disabled"
            [value]="getComment(option, i)"
            [placeholder]="commentPlaceholder"
            (focus)="onCommentFocus(option, i)"
            (input)="updateComment(option, i, toText($any($event.target).value))"
          />
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
  private readonly commentsSuffix = '__comments';
  override defaultOptions = MATERIAL_WRAPPED_FIELD_DEFAULT_OPTIONS;

  get showLabel(): boolean {
    return this.props?.show_label !== false && !!this.props?.label;
  }

  ngOnInit(): void {
    if (!Array.isArray(this.formControl.value)) {
      this.formControl.setValue([], { emitEvent: false });
    }
    this.ensureCommentsModel();
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
  }

  updateComment(option: CheckboxWithTextOption, index: number, comment: string): void {
    const optionKey = this.resolveOptionKey(option, index);
    if (!optionKey) {
      return;
    }

    const comments = this.getCommentsModel();
    comments[optionKey] = comment;
    this.setCommentsModel(comments);
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

    const comments = this.getCommentsModel();
    return this.toText(comments[optionKey] ?? option.comment);
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

  private ensureCommentsModel(): void {
    const commentsKey = this.getCommentsModelKey();
    if (!commentsKey || !this.model) {
      return;
    }

    const raw = (this.model as Record<string, unknown>)[commentsKey];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return;
    }

    const defaults = this.checkboxOptions.reduce<Record<string, string>>((acc, option, index) => {
      const optionKey = this.resolveOptionKey(option, index);
      if (!optionKey) {
        return acc;
      }
      acc[optionKey] = this.toText(option.comment);
      return acc;
    }, {});

    this.setCommentsModel(defaults);
  }

  private getCommentsModel(): Record<string, string> {
    const commentsKey = this.getCommentsModelKey();
    if (!commentsKey || !this.model) {
      return {};
    }

    const raw = (this.model as Record<string, unknown>)[commentsKey];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return { ...(raw as Record<string, string>) };
    }

    return {};
  }

  private setCommentsModel(comments: Record<string, string>): void {
    const commentsKey = this.getCommentsModelKey();
    if (!commentsKey || !this.model) {
      return;
    }

    (this.model as Record<string, unknown>)[commentsKey] = comments;
  }

  private getCommentsModelKey(): string | null {
    if (typeof this.field.key === 'string') {
      return `${this.field.key}${this.commentsSuffix}`;
    }
    if (typeof this.field.key === 'number') {
      return `${String(this.field.key)}${this.commentsSuffix}`;
    }
    return null;
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
