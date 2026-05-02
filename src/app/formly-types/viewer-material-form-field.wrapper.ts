import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusMonitor } from '@angular/cdk/a11y';
import {
  FieldWrapper,
  FormlyFieldConfig,
  FormlyModule,
  ɵdefineHiddenProp as defineHiddenProp,
} from '@ngx-formly/core';
import { FormlyFieldProps } from '@ngx-formly/material/form-field';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';

interface MatFormlyFieldConfig extends FormlyFieldConfig<FormlyFieldProps> {
  _formField?: ViewerMaterialFormFieldWrapper;
}

@Component({
  selector: 'formly-wrapper-viewer-mat-form-field',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, FormlyModule],
  template: `
    <label class="ffu-label ffv-wrapper-label" *ngIf="showExternalLabel">
      {{ props.label }}
      <span aria-hidden="true" class="mat-form-field-required-marker mat-mdc-form-field-required-marker"
        *ngIf="props.required && props.hideRequiredMarker !== true">*</span>
    </label>

    <mat-form-field
      [hideRequiredMarker]="true"
      [floatLabel]="props.floatLabel"
      [appearance]="props.appearance"
      [subscriptSizing]="props.subscriptSizing"
      [color]="props.color ?? 'primary'"
    >
      <ng-container #fieldComponent></ng-container>

      <mat-label *ngIf="props.label && props.hideLabel !== true && !showExternalLabel">
        {{ props.label }}
        <span aria-hidden="true" class="mat-form-field-required-marker mat-mdc-form-field-required-marker"
          *ngIf="props.required && props.hideRequiredMarker !== true">*</span>
      </mat-label>

      <ng-container
        *ngIf="props.textPrefix"
        matTextPrefix
        [ngTemplateOutlet]="props.textPrefix"
        [ngTemplateOutletContext]="{ field: field }"
      ></ng-container>

      <ng-container
        *ngIf="props.prefix"
        matPrefix
        [ngTemplateOutlet]="props.prefix"
        [ngTemplateOutletContext]="{ field: field }"
      ></ng-container>

      <ng-container
        *ngIf="props.textSuffix"
        matTextSuffix
        [ngTemplateOutlet]="props.textSuffix"
        [ngTemplateOutletContext]="{ field: field }"
      ></ng-container>

      <ng-container
        *ngIf="props.suffix"
        matSuffix
        [ngTemplateOutlet]="props.suffix"
        [ngTemplateOutletContext]="{ field: field }"
      ></ng-container>

      <mat-error>
        <formly-validation-message [field]="field"></formly-validation-message>
      </mat-error>

      <mat-hint *ngIf="props.description || props.hintStart as hint">
        <ng-container [ngTemplateOutlet]="stringOrTemplate" [ngTemplateOutletContext]="{ content: hint }"></ng-container>
      </mat-hint>

      <mat-hint *ngIf="props.hintEnd as hintEnd" align="end">
        <ng-container [ngTemplateOutlet]="stringOrTemplate" [ngTemplateOutletContext]="{ content: hintEnd }"></ng-container>
      </mat-hint>
    </mat-form-field>

    <ng-template #stringOrTemplate let-content="content">
      <ng-container *ngIf="!isTemplateRef(content); else renderTemplate">{{ content }}</ng-container>
      <ng-template #renderTemplate>
        <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ field: field }"></ng-container>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    .ffv-wrapper-label {
      display: block;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class ViewerMaterialFormFieldWrapper
  extends FieldWrapper<MatFormlyFieldConfig>
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild(MatFormField, { static: true }) formField!: MatFormField;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private focusMonitor: FocusMonitor,
  ) {
    super();
  }

  ngOnInit(): void {
    defineHiddenProp(this.field as MatFormlyFieldConfig, '_formField', this.formField);
    this.focusMonitor.monitor(this.elementRef, true).subscribe((origin) => {
      if (!origin && this.field.focus) {
        this.field.focus = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.formField.appearance !== 'outline' && this.props.hideFieldUnderline === true) {
      const underlineElement = this.formField._elementRef.nativeElement.querySelector('.mat-form-field-underline');
      if (underlineElement) {
        this.renderer.removeChild(underlineElement.parentNode, underlineElement);
      }
    }
  }

  ngOnDestroy(): void {
    delete (this.field as MatFormlyFieldConfig)._formField;
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  get props(): FormlyFieldProps {
    return (this.field?.props ?? {}) as FormlyFieldProps;
  }

  get showExternalLabel(): boolean {
    const label = `${this.props.label ?? ''}`.trim();
    const position = `${(this.props as any).labelPosition ?? ''}`.trim().toLowerCase();
    return !!label && this.props.hideLabel !== true && position === 'stacked';
  }

  isTemplateRef(value: unknown): value is TemplateRef<unknown> {
    return !!value && typeof (value as TemplateRef<unknown>).createEmbeddedView === 'function';
  }
}
