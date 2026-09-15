import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, HostListener, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldType, FieldTypeConfig, FormlyField, FormlyFieldConfig, FormlyFieldProps } from '@ngx-formly/core';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES,
  FormlyViewerValidationMessagesDictionary,
} from './formly-viewer-validation-messages.provider';
import {
  DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES,
  FormlyViewerUiMessagesDictionary,
  FormlyViewerStepperUiMessages,
  normalizeViewerUiLocale,
} from './formly-viewer-ui-messages';

type CompletionState = 'completed_preview_not_saved' | 'completed_screenout' | null;

interface StepperCompletionContext {
  isActive?: boolean;
  canSaveResponses?: boolean;
  submitMode?: 'submit' | 'submit_preview' | string;
  language?: string;
  endText?: string;
  warningCodes?: string[];
  didNotSaveCode?: string | null;
}

interface StepperInvalidLeafIssue {
  label: string;
  type: 'missing' | 'invalid';
  message?: string;
}

interface StepperProps extends FormlyFieldProps {
  surveyTitle?: string;
  surveyDescription?: string;
  showProgress?: boolean;
  allowPrevious?: boolean;
  showGroupInfo?: boolean;
  showWelcome?: boolean;
  welcomeText?: string;
  endText?: string;
  policyNotice?: string;
  questionIndex?: number;
  navigationDelay?: number;
  surveyActive?: boolean;
  completionContext?: StepperCompletionContext | null;
  locale?: string;
  viewerUi?: FormlyViewerUiMessagesDictionary;
  i18n?: Partial<FormlyViewerStepperUiMessages>;
}

@Component({
  selector: 'ffu-viewer-stepper',
  standalone: true,
  imports: [CommonModule, FormlyField, MatStepperModule, MatButtonModule, MatProgressBarModule],
  template: `
    <section class="ffu-stepper">
      <article class="ffu-stepper-card" *ngIf="showWelcomeScreen">
        <h3>{{ messages.welcomeTitle }}</h3>
        <div class="ffu-stepper-rich-text" *ngIf="props?.surveyTitle">
          <strong>{{ props?.surveyTitle }}</strong>
        </div>
        <div class="ffu-stepper-rich-text" *ngIf="props?.surveyDescription" [innerHTML]="surveyDescriptionHtml"></div>
        <div class="ffu-stepper-rich-text" *ngIf="props?.welcomeText" [innerHTML]="welcomeTextHtml"></div>
        <div class="ffu-stepper-rich-text" *ngIf="props?.policyNotice" [innerHTML]="policyNoticeHtml"></div>
        <button mat-flat-button color="primary" type="button" class="ffu-stepper-primary" (click)="startSurvey()">{{ messages.startLabel }}</button>
      </article>

      <article class="ffu-stepper-card" *ngIf="showCompletionScreen">
        <h3>{{ completionTitle }}</h3>
        <p *ngFor="let warningMessage of completionWarnings; trackBy: trackByText">{{ warningMessage }}</p>
        <p *ngIf="didNotSaveMessage">{{ didNotSaveMessage }}</p>
        <div class="ffu-stepper-rich-text" *ngIf="completionEndText" [innerHTML]="completionEndTextHtml"></div>
        <button mat-stroked-button type="button" class="ffu-stepper-secondary" (click)="goBackToSurvey()">{{ messages.backLabel }}</button>
      </article>

      <ng-container *ngIf="!showWelcomeScreen && !showCompletionScreen">
        <div class="ffu-stepper-progress" *ngIf="props?.showProgress && hasSteps">
          <mat-progress-bar mode="determinate" [value]="progressPercent"></mat-progress-bar>
        </div>

        <p class="ffu-stepper-status" *ngIf="hasSteps">
          {{ messages.stepLabel }} {{ currentStepNumber }} {{ messages.stepOfLabel }} {{ totalStepCount }}
        </p>

        <mat-stepper
          class="ffu-mat-stepper"
          [class.ffu-disable-header-nav]="!allowPrevious"
          [orientation]="stepperOrientation"
          [selectedIndex]="currentVisiblePosition"
          [linear]="false"
          (selectionChange)="onStepperSelectionChange($event)">
          <mat-step *ngFor="let step of visibleSteps; let i = index; trackBy: trackByStep"
            [label]="step.props?.label || (messages.stepLabel + ' ' + (i + 1))"
            [editable]="false">
            <header *ngIf="props?.showGroupInfo" class="ffu-stepper-header">
              <h3>{{ step.props?.label }}</h3>
              <p *ngIf="step.props?.description">{{ step.props?.description }}</p>
            </header>

            <div class="ffu-stepper-content">
              <formly-field [field]="step"></formly-field>
            </div>

            <footer class="ffu-stepper-actions">
              <button mat-stroked-button type="button" (click)="previousStep()" [disabled]="!canGoPrevious">
                {{ messages.previousLabel }}
              </button>

              <button mat-flat-button color="primary" type="button" *ngIf="canGoNext" (click)="nextStep()"
                [disabled]="advancing || !isStepValid(currentStep)">
                {{ messages.nextLabel }}
              </button>

              <button mat-flat-button color="primary" *ngIf="isLastStep" type="submit"
                [disabled]="!isStepValid(currentStep)" (click)="onSubmitAttempt($event)">
                {{ messages.submitLabel }}
              </button>
            </footer>

            <div class="ffu-stepper-validation" *ngIf="pendingValidationLabels.length">
              <p>{{ pendingValidationHint }}</p>
              <ul>
                <li *ngFor="let label of pendingValidationLabels; trackBy: trackByText">{{ label }}</li>
              </ul>
            </div>
          </mat-step>
        </mat-stepper>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .ffu-stepper {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .ffu-stepper-card,
      .ffu-stepper-header,
      .ffu-stepper-content,
      .ffu-stepper-end {
        border: 1px solid #d9dce3;
        border-radius: 8px;
        padding: 12px;
        min-width: 0;
        box-sizing: border-box;
      }

      .ffu-stepper-card :where(img, video, iframe) {
        max-width: 100%;
        height: auto;
      }

      .ffu-stepper-rich-text {
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        overflow-wrap: anywhere;
      }

      .ffu-stepper-rich-text :where(a) {
        display: inline-block;
        max-width: 100%;
      }

      .ffu-stepper-rich-text :where(img, svg, video, canvas) {
        display: block;
        max-width: 100% !important;
        width: auto !important;
        height: auto !important;
      }

      .ffu-stepper-rich-text :where(iframe) {
        display: block;
        max-width: 100% !important;
      }

      :host ::ng-deep .ffu-stepper-rich-text img,
      :host ::ng-deep .ffu-stepper-rich-text svg,
      :host ::ng-deep .ffu-stepper-rich-text video,
      :host ::ng-deep .ffu-stepper-rich-text canvas {
        display: block;
        max-width: 100% !important;
        width: auto !important;
        height: auto !important;
      }

      :host ::ng-deep .ffu-stepper-rich-text iframe {
        display: block;
        max-width: 100% !important;
      }

      .ffu-mat-stepper {
        background: transparent;
        max-width: 100%;
        min-width: 0;
      }

      .ffu-stepper-status {
        margin: 0;
        color: #5e6573;
      }

      .ffu-stepper-header p {
        white-space: pre-line;
      }

      .ffu-stepper-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ffu-stepper-primary,
      .ffu-stepper-secondary {
        min-height: 40px;
        border-radius: 10px;
      }

      .ffu-stepper-card .ffu-stepper-primary,
      .ffu-stepper-card .ffu-stepper-secondary {
        margin-top: 10px;
      }

      .ffu-stepper-validation {
        border-left: 4px solid #f59e0b;
        background: #fef3c7;
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 12px;
        overflow: auto;
      }

      .ffu-stepper-validation p {
        margin: 0 0 6px;
      }

      .ffu-stepper-validation ul {
        margin: 0;
        padding-left: 18px;
      }

      .ffu-stepper-validation li {
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-horizontal-stepper-header-container {
        overflow-x: auto;
        scrollbar-width: thin;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-horizontal-stepper-header {
        min-width: fit-content;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-step-header {
        pointer-events: auto;
      }

      :host ::ng-deep .ffu-mat-stepper.ffu-disable-header-nav .mat-step-header {
        pointer-events: none;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-step-label {
        white-space: normal;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-horizontal-content-container,
      :host ::ng-deep .ffu-mat-stepper .mat-vertical-content-container {
        padding: 0;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-horizontal-stepper-content,
      :host ::ng-deep .ffu-mat-stepper .mat-vertical-content-container {
        overflow: visible;
      }

      :host ::ng-deep .ffu-mat-stepper .mat-stepper-horizontal-line {
        min-width: 16px;
      }

      @media (max-width: 768px) {
        .ffu-stepper-actions button {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFormlyStepperType extends FieldType<FieldTypeConfig<StepperProps>> implements DoCheck, OnDestroy {
  private nextTimer?: ReturnType<typeof setTimeout>;
  get advancing(): boolean { return this.nextTimer !== undefined; }
  private readonly cdr = inject(ChangeDetectorRef);
  private isMobileViewport = this.detectMobileViewport();
  currentStepIndex = 0;
  hasStarted = false;
  completionState: CompletionState = null;
  private visibleStepIndexesSnapshot: number[] = [];
  private activeStepIndexSnapshot = -1;

  get stepperOrientation(): 'horizontal' | 'vertical' {
    return this.isMobileViewport ? 'vertical' : 'horizontal';
  }

  get steps(): FormlyFieldConfig[] {
    return Array.isArray(this.field.fieldGroup) ? this.field.fieldGroup : [];
  }

  get hasSteps(): boolean {
    return this.visibleStepIndexes.length > 0;
  }

  get currentStep(): FormlyFieldConfig | null {
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return null;
    }
    return this.steps[activeIndex] ?? null;
  }

  get allowPrevious(): boolean {
    return this.props.allowPrevious !== false;
  }

  get showCompletionScreen(): boolean {
    return this.completionState !== null;
  }

  get currentStepNumber(): number {
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return 0;
    }
    return this.visibleStepIndexes.indexOf(activeIndex) + 1;
  }

  get totalStepCount(): number {
    return this.visibleStepIndexes.length;
  }

  get progressPercent(): number {
    if (!this.totalStepCount) {
      return 0;
    }
    return Math.round((this.currentStepNumber / this.totalStepCount) * 100);
  }

  get visibleSteps(): FormlyFieldConfig[] {
    return this.visibleStepIndexes.map((index) => this.steps[index]).filter((step): step is FormlyFieldConfig => !!step);
  }

  get currentVisiblePosition(): number {
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return 0;
    }
    return Math.max(0, this.visibleStepIndexes.indexOf(activeIndex));
  }

  get canGoPrevious(): boolean {
    if (!this.allowPrevious) {
      return false;
    }
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return false;
    }
    const position = this.visibleStepIndexes.indexOf(activeIndex);
    return position > 0;
  }

  get canGoNext(): boolean {
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return false;
    }
    const position = this.visibleStepIndexes.indexOf(activeIndex);
    return position >= 0 && position < this.visibleStepIndexes.length - 1;
  }

  get isLastStep(): boolean {
    const activeIndex = this.activeStepIndex;
    if (activeIndex < 0) {
      return true;
    }
    const position = this.visibleStepIndexes.indexOf(activeIndex);
    return position === this.visibleStepIndexes.length - 1;
  }

  get showWelcomeScreen(): boolean {
    return !!this.props.showWelcome && !this.hasStarted;
  }

  get completionTitle(): string {
    if (this.completionState === 'completed_preview_not_saved') {
      return this.messages.completionPreviewTitle;
    }
    if (this.completionState === 'completed_screenout') {
      return this.messages.completionScreenoutTitle;
    }
    return this.messages.completionSavedTitle;
  }

  get completionEndText(): string {
    const contextEndText = `${this.props.completionContext?.endText ?? ''}`.trim();
    if (contextEndText) {
      return contextEndText;
    }
    return `${this.props.endText ?? ''}`.trim();
  }

  get surveyDescriptionHtml(): string {
    return this.props.surveyDescription ?? '';
  }

  get welcomeTextHtml(): string {
    return this.props.welcomeText ?? '';
  }

  get policyNoticeHtml(): string {
    return this.props.policyNotice ?? '';
  }

  get completionEndTextHtml(): string {
    return this.completionEndText;
  }

  get completionWarnings(): string[] {
    const warningCodes = Array.isArray(this.props.completionContext?.warningCodes)
      ? this.props.completionContext?.warningCodes
      : [];
    return warningCodes.map((code) => this.messages.warningCodes[code] ?? code);
  }

  get didNotSaveMessage(): string | null {
    const didNotSaveCode = this.props.completionContext?.didNotSaveCode ?? null;
    if (!didNotSaveCode) {
      return null;
    }
    return this.messages.didNotSaveCodes[didNotSaveCode] ?? didNotSaveCode;
  }

  get messages(): FormlyViewerStepperUiMessages {
    const base = this.resolveBaseStepperMessages();
    const overrides = this.props.i18n ?? {};
    return {
      ...base,
      ...overrides,
      warningCodes: {
        ...base.warningCodes,
        ...(overrides.warningCodes ?? {}),
      },
      didNotSaveCodes: {
        ...base.didNotSaveCodes,
        ...(overrides.didNotSaveCodes ?? {}),
      },
    };
  }

  get pendingValidationIssues(): StepperInvalidLeafIssue[] {
    return this.collectInvalidLeafIssues(this.currentStep);
  }

  get pendingValidationLabels(): string[] {
    const labels = this.pendingValidationIssues.map((issue) => issue.message ? `${issue.label}: ${issue.message}` : issue.label);
    return Array.from(new Set(labels));
  }

  get pendingValidationHint(): string {
    const issues = this.pendingValidationIssues;
    const count = issues.length;
    if (!count) {
      return '';
    }
    const onlyMissing = issues.every((issue) => issue.type === 'missing');
    const template = onlyMissing
      ? this.messages.pendingValidationHintMissing
      : this.messages.pendingValidationHintInvalid;
    return template.replace('{count}', `${count}`);
  }

  startSurvey(): void {
    this.hasStarted = true;
    this.completionState = null;
    this.currentStepIndex = this.activeStepIndex >= 0 ? this.activeStepIndex : 0;
    if (!this.hasSteps) {
      this.completionState = 'completed_screenout';
    }
  }

  previousStep(): void {
    this.cancelNextStep();
    if (!this.canGoPrevious) {
      return;
    }
    const activeIndex = this.activeStepIndex;
    const visibleIndexes = this.visibleStepIndexes;
    const position = visibleIndexes.indexOf(activeIndex);
    this.currentStepIndex = visibleIndexes[Math.max(0, position - 1)] ?? this.currentStepIndex;
  }

  nextStep(): void {
    if (this.advancing) return;
    this.refreshStepStateSnapshots();
    if (!this.canGoNext || !this.isStepValid(this.currentStep)) {
      return;
    }

    const delayMs = Math.max(0, Number(this.props.navigationDelay ?? 0)) * 1000;
    if (delayMs > 0) {
      const step = this.currentStep;
      this.nextTimer = setTimeout(() => {
        this.nextTimer = undefined;
        this.refreshStepStateSnapshots();
        if (this.currentStep === step) this.goNextIfAvailable();
        this.cdr.markForCheck();
      }, delayMs);
      return;
    }

    this.goNextIfAvailable();
  }

  onStepperSelectionChange(event: StepperSelectionEvent): void {
    this.cancelNextStep();
    const activeIndex = this.activeStepIndex;
    const visibleIndexes = this.visibleStepIndexes;
    if (activeIndex < 0 || !visibleIndexes.length) {
      return;
    }

    const currentPosition = visibleIndexes.indexOf(activeIndex);
    if (currentPosition < 0) {
      return;
    }

    const requestedPosition = event.selectedIndex;
    if (requestedPosition === currentPosition) {
      return;
    }

    const canGoBackByHeader = this.allowPrevious && requestedPosition >= 0 && requestedPosition < currentPosition;
    if (!canGoBackByHeader) {
      this.currentStepIndex = visibleIndexes[currentPosition] ?? this.currentStepIndex;
      this.cdr.markForCheck();
      return;
    }

    const requestedStepIndex = visibleIndexes[requestedPosition];
    if (typeof requestedStepIndex === 'number') {
      this.currentStepIndex = requestedStepIndex;
      this.cdr.markForCheck();
    }
  }

  isStepValid(step: FormlyFieldConfig | null): boolean {
    if (!step) {
      return false;
    }

    if (step.hide) {
      return true;
    }

    if (Array.isArray(step.fieldGroup) && step.fieldGroup.length > 0) {
      const childrenValid = step.fieldGroup.every((child) => this.isStepValid(child));
      // Unkeyed wrappers can contain parent/root controls from hidden/future fields.
      if (!step.key) {
        return childrenValid;
      }
      const ownControlValid = !step.formControl || step.formControl.disabled || step.formControl.valid;
      return ownControlValid && childrenValid;
    }

    const ownControlValid = !step.formControl || step.formControl.disabled || step.formControl.valid;
    return ownControlValid;
  }

  onSubmitAttempt(event: Event): void {
    this.markCurrentStepTouched(this.currentStep);
    if (!this.form.valid) {
      event.preventDefault();
      return;
    }

    // Dispatching a submit is not a storage acknowledgement. The host reports its result.
    this.completionState = this.canSaveResponses ? null : 'completed_preview_not_saved';
  }

  goBackToSurvey(): void {
    this.completionState = null;
  }

  trackByText(_index: number, text: string): string {
    return text;
  }

  readonly trackByStep = (index: number, step: FormlyFieldConfig): string =>
    `${step.id ?? step.key ?? index}`;

  ngDoCheck(): void {
    this.refreshStepStateSnapshots();
  }

  ngOnDestroy(): void { this.cancelNextStep(); }
  private cancelNextStep(): void {
    if (this.nextTimer !== undefined) clearTimeout(this.nextTimer);
    this.nextTimer = undefined;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const isMobile = this.detectMobileViewport();
    if (isMobile === this.isMobileViewport) {
      return;
    }
    this.isMobileViewport = isMobile;
    this.cdr.markForCheck();
  }

  private get canSaveResponses(): boolean {
    const completionContext = this.props.completionContext;
    if (typeof completionContext?.canSaveResponses === 'boolean') {
      return completionContext.canSaveResponses;
    }
    if (typeof this.props.surveyActive === 'boolean') {
      return this.props.surveyActive;
    }
    return true;
  }

  private resolveLanguage(): 'es' | 'en' {
    const rawLanguage = `${this.props.completionContext?.language ?? this.props.locale ?? ''}`.toLowerCase();
    return normalizeViewerUiLocale(rawLanguage, 'en').startsWith('es') ? 'es' : 'en';
  }

  private get validationDictionary(): FormlyViewerValidationMessagesDictionary {
    return DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES[this.resolveLanguage()]
      ?? DEFAULT_FORMLY_VIEWER_I18N_VALIDATION_DICTIONARIES['en'];
  }

  private resolveBaseStepperMessages(): FormlyViewerStepperUiMessages {
    const locale = this.resolveLanguage();
    const fromFieldProps = this.props?.viewerUi?.stepper;
    if (fromFieldProps) {
      return fromFieldProps;
    }
    return DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES[locale]?.stepper
      ?? DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES['en'].stepper;
  }

  private detectMobileViewport(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 768px)').matches;
  }

  private goNextIfAvailable(): void {
    this.refreshStepStateSnapshots();
    if (!this.canGoNext || !this.isStepValid(this.currentStep)) {
      return;
    }
    const activeIndex = this.activeStepIndex;
    const visibleIndexes = this.visibleStepIndexes;
    const position = visibleIndexes.indexOf(activeIndex);
    this.currentStepIndex = visibleIndexes[position + 1] ?? this.currentStepIndex;
  }

  private get visibleStepIndexes(): number[] {
    return this.visibleStepIndexesSnapshot;
  }

  private get activeStepIndex(): number {
    return this.activeStepIndexSnapshot;
  }

  private hasVisibleContent(field: FormlyFieldConfig | null | undefined): boolean {
    if (!field || field.hide) {
      return false;
    }

    if (Array.isArray(field.fieldGroup) && field.fieldGroup.length > 0) {
      return field.fieldGroup.some((child) => this.hasVisibleContent(child));
    }

    return true;
  }

  private refreshStepStateSnapshots(): void {
    const visibleIndexes: number[] = [];
    this.steps.forEach((step, index) => {
      if (this.hasVisibleContent(step)) {
        visibleIndexes.push(index);
      }
    });

    this.visibleStepIndexesSnapshot = visibleIndexes;

    if (!visibleIndexes.length) {
      this.activeStepIndexSnapshot = -1;
      return;
    }

    if (visibleIndexes.includes(this.currentStepIndex)) {
      this.activeStepIndexSnapshot = this.currentStepIndex;
      return;
    }

    const nextVisible = visibleIndexes.find((index) => index > this.currentStepIndex);
    this.activeStepIndexSnapshot = nextVisible ?? visibleIndexes[visibleIndexes.length - 1];
    this.currentStepIndex = this.activeStepIndexSnapshot;
  }

  private collectInvalidLeafIssues(field: FormlyFieldConfig | null | undefined): StepperInvalidLeafIssue[] {
    if (!field || field.hide) {
      return [];
    }

    if (Array.isArray(field.fieldGroup) && field.fieldGroup.length > 0) {
      return field.fieldGroup.reduce<StepperInvalidLeafIssue[]>((acc, child: FormlyFieldConfig) => {
        acc.push(...this.collectInvalidLeafIssues(child));
        return acc;
      }, []);
    }

    if (!field.formControl || field.formControl.disabled || field.formControl.valid) {
      return [];
    }

    const label = `${field?.props?.['label'] ?? field?.key ?? ''}`.trim();
    if (`${field?.type ?? ''}` === 'multiple-input') {
      const value = (field.formControl.value ?? {}) as Record<string, unknown>;
      const normalizedValue = Object.keys(value).reduce<Record<string, unknown>>((acc, rawKey) => {
        const normalizedKey = `${rawKey ?? ''}`.trim();
        if (!normalizedKey) {
          return acc;
        }
        acc[normalizedKey] = value[rawKey];
        return acc;
      }, {});
      const rows = Array.isArray(field?.props?.['subquestions']) ? (field.props?.['subquestions'] as Array<Record<string, unknown>>) : [];
      const rootModel = field?.model && typeof field.model === 'object'
        ? (field.model as Record<string, unknown>)
        : {};
      const fieldKey = `${field?.key ?? ''}`.trim();
      const missingRows = rows
        .map((row) => ({
          code: `${row?.['code'] ?? ''}`.trim(),
          label: `${row?.['label'] ?? row?.['code'] ?? ''}`.trim(),
        }))
        .filter((row) => {
          if (!row.code) {
            return false;
          }
          const flatKey = fieldKey ? `${fieldKey}_${row.code}` : '';
          const flatValue = flatKey ? rootModel[flatKey] : undefined;
          return `${flatValue ?? normalizedValue[row.code] ?? ''}`.trim() === '';
        })
        .map((row) => row.label || row.code);

      if (missingRows.length) {
        const fieldLabel = label || `${field?.key ?? ''}`.trim() || 'multiple-input';
        return missingRows.map((rowLabel) => ({
          label: `${fieldLabel}: ${rowLabel}`,
          type: 'missing',
        }));
      }
    }

    const errors = field.formControl.errors ?? {};
    const errorKeys = Object.keys(errors);
    const firstErrorKey = errorKeys[0] ?? '';
    const firstErrorValue = firstErrorKey ? errors[firstErrorKey] : undefined;
    const message = this.resolveErrorMessage(field, firstErrorKey, firstErrorValue);
    const issueType: 'missing' | 'invalid' = this.isMissingErrorKey(firstErrorKey) ? 'missing' : 'invalid';

    if (!label) {
      return [{
        label: `${field?.key ?? 'field'}`,
        type: issueType,
        message,
      }];
    }
    return [{
      label,
      type: issueType,
      message,
    }];
  }

  private isMissingErrorKey(errorKey: string): boolean {
    return errorKey === 'required' || errorKey === 'completeAll' || errorKey === 'minSelections';
  }

  private resolveErrorMessage(field: FormlyFieldConfig, errorKey: string, errorValue: unknown): string {
    if (!errorKey) {
      return '';
    }

    const validationMessages = field?.validation?.messages as Record<string, unknown> | undefined;
    const fieldValidationMessage = validationMessages?.[errorKey];
    if (typeof fieldValidationMessage === 'function') {
      try {
        return `${(fieldValidationMessage as (error: unknown, fieldConfig: FormlyFieldConfig) => unknown)(errorValue, field)}`.trim();
      } catch {
        return '';
      }
    }
    if (typeof fieldValidationMessage === 'string' && fieldValidationMessage.trim()) {
      return fieldValidationMessage.trim();
    }

    const validatorMessage = (field as { validators?: Record<string, { message?: unknown }> })?.validators?.[errorKey]?.message;
    if (typeof validatorMessage === 'function') {
      try {
        return `${(validatorMessage as (error: unknown, fieldConfig: FormlyFieldConfig) => unknown)(errorValue, field)}`.trim();
      } catch {
        return '';
      }
    }
    if (typeof validatorMessage === 'string' && validatorMessage.trim()) {
      return validatorMessage.trim();
    }

    const normalizedErrorKey = this.normalizeErrorKey(errorKey);
    if (normalizedErrorKey === 'matrixCells') return this.validationDictionary.matrixCells;
    if (normalizedErrorKey === 'minSelections') return this.validationDictionary.minSelections(Number(field.props?.['minSelections'] ?? 0));
    if (normalizedErrorKey === 'maxSelections') return this.validationDictionary.maxSelections(Number(field.props?.['maxSelections'] ?? 0));
    const dictionary = this.validationDictionary;
    if (normalizedErrorKey === 'required') {
      return dictionary.required;
    }
    if (normalizedErrorKey === 'minLength') {
      const requiredLength = Number((errorValue as { requiredLength?: unknown } | null | undefined)?.requiredLength ?? 0);
      return dictionary.minLength(Number.isNaN(requiredLength) ? 0 : requiredLength);
    }
    if (normalizedErrorKey === 'maxLength') {
      const requiredLength = Number((errorValue as { requiredLength?: unknown } | null | undefined)?.requiredLength ?? 0);
      return dictionary.maxLength(Number.isNaN(requiredLength) ? 0 : requiredLength);
    }
    if (normalizedErrorKey === 'min') {
      const minValue = Number((errorValue as { min?: unknown; actualMin?: unknown } | null | undefined)?.min
        ?? (errorValue as { actualMin?: unknown } | null | undefined)?.actualMin
        ?? 0);
      return dictionary.min(Number.isNaN(minValue) ? 0 : minValue);
    }
    if (normalizedErrorKey === 'max') {
      const maxValue = Number((errorValue as { max?: unknown; actualMax?: unknown } | null | undefined)?.max
        ?? (errorValue as { actualMax?: unknown } | null | undefined)?.actualMax
        ?? 0);
      return dictionary.max(Number.isNaN(maxValue) ? 0 : maxValue);
    }
    if (normalizedErrorKey === 'email') {
      return dictionary.email;
    }
    if (normalizedErrorKey === 'pattern') {
      return dictionary.pattern;
    }
    if (normalizedErrorKey === 'completeAll') {
      return dictionary.completeAll;
    }
    if (normalizedErrorKey === 'minValue') {
      const minValue = Number((errorValue as { minValue?: unknown } | null | undefined)?.minValue ?? 0);
      return dictionary.minValue(Number.isNaN(minValue) ? 0 : minValue);
    }
    if (normalizedErrorKey === 'maxValue') {
      const maxValue = Number((errorValue as { maxValue?: unknown } | null | undefined)?.maxValue ?? 0);
      return dictionary.maxValue(Number.isNaN(maxValue) ? 0 : maxValue);
    }
    if (normalizedErrorKey === 'integerOnly') {
      return dictionary.integerOnly;
    }

    return '';
  }

  private normalizeErrorKey(errorKey: string): string {
    if (errorKey === 'minlength') {
      return 'minLength';
    }
    if (errorKey === 'maxlength') {
      return 'maxLength';
    }
    return errorKey;
  }

  private markCurrentStepTouched(step: FormlyFieldConfig | null): void {
    if (!step) {
      return;
    }

    if (step.formControl) {
      step.formControl.markAsTouched();
    }

    if (Array.isArray(step.fieldGroup)) {
      step.fieldGroup.forEach((child) => this.markCurrentStepTouched(child));
    }
  }

}
