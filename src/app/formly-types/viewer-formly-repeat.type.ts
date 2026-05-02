import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldType, FormlyField, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'ffu-viewer-repeat',
  standalone: true,
  imports: [CommonModule, FormlyField],
  template: `
    <section class="ffu-repeat" [attr.data-field-key]="field.key">
      <h3 class="ffu-repeat-title" *ngIf="props?.label">{{ props.label }}</h3>
      <p class="ffu-repeat-description" *ngIf="props?.description">{{ props.description }}</p>

      <formly-field
        *ngFor="let groupField of groupFields; trackBy: trackByIndex"
        [field]="groupField">
      </formly-field>
    </section>
  `,
  styles: [
    `
      .ffu-repeat {
        border: 1px solid #d9dce3;
        border-radius: 8px;
        padding: 12px;
      }

      .ffu-repeat-title {
        margin: 0 0 8px;
        font-weight: 500;
      }

      .ffu-repeat-description {
        margin: 0 0 12px;
        color: #5e6573;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyRepeatType extends FieldType {
  get groupFields(): FormlyFieldConfig[] {
    return Array.isArray(this.field.fieldGroup) ? this.field.fieldGroup : [];
  }

  trackByIndex(index: number): number {
    return index;
  }
}
