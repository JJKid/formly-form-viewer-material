import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormlyFieldConfig } from '@ngx-formly/core';

import { appConfig } from '../app.config';
import { withFormlyViewerI18n } from '../formly-types/formly-viewer-validation-messages.provider';
import { FormlyFormViewerComponent } from './formly-form-viewer.component';

describe('FormlyFormViewerComponent', () => {
  let component: FormlyFormViewerComponent;
  let fixture: ComponentFixture<FormlyFormViewerComponent>;

  const createComponent = (fields: FormlyFieldConfig[] = [], model: any = {}) => {
    fixture = TestBed.createComponent(FormlyFormViewerComponent);
    component = fixture.componentInstance;
    component.fields = fields;
    component.model = model;
    fixture.detectChanges();
  };

  const submitForm = () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  const textContent = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormlyFormViewerComponent, NoopAnimationsModule],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
    const config = withFormlyViewerI18n();
    expect(config.validators?.some(v => ['minAnswers', 'maxAnswers', 'minSelections', 'maxSelections'].includes(v.name))).toBeFalse();
    expect(config.validationMessages?.some(message => message.name === 'matrixCells')).toBeTrue();
  });

  it('renders basic Angular/Formly fields', () => {
    createComponent([
      {
        key: 'name',
        type: 'input',
        props: { label: 'Name' },
      },
      {
        key: 'notes',
        type: 'textarea',
        props: { label: 'Notes' },
      },
    ]);

    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
    expect(textContent()).toContain('Name');
    expect(textContent()).toContain('Notes');
  });

  it('shows required validation messages and does not emit invalid submits', () => {
    const submitSpy = jasmine.createSpy('submitForm');
    createComponent([
      {
        key: 'name',
        type: 'input',
        props: { label: 'Name', required: true },
      },
    ]);
    component.submitForm.subscribe(submitSpy);

    submitForm();

    expect(component.form.valid).toBeFalse();
    expect(submitSpy).not.toHaveBeenCalled();
    expect(textContent()).toContain('This field is required');
  });

  it('emits the model on valid submit', () => {
    const submitSpy = jasmine.createSpy('submitForm');
    createComponent([
      {
        key: 'name',
        type: 'input',
        props: { label: 'Name', required: true },
      },
    ]);
    component.submitForm.subscribe(submitSpy);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitForm();

    expect(component.form.valid).toBeTrue();
    expect(component.model).toEqual({ name: 'Ada Lovelace' });
    expect(submitSpy).toHaveBeenCalledOnceWith(component.model);
  });

  it('renders nested fieldGroup fields with validation messages', () => {
    createComponent([
      {
        key: 'person',
        fieldGroup: [
          {
            key: 'firstName',
            type: 'input',
            props: { label: 'First name', required: true },
          },
        ],
      },
    ]);

    submitForm();

    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect(component.form.get('person.firstName')?.valid).toBeFalse();
    expect(textContent()).toContain('First name');
    expect(textContent()).toContain('This field is required');
  });

  it('renders the viewer stepper type and hides the outer submit button', () => {
    createComponent([
      {
        type: 'stepper',
        props: {
          showProgress: true,
          showGroupInfo: true,
        },
        fieldGroup: [
          {
            props: { label: 'Step 1', description: 'First group' },
            fieldGroup: [
              {
                key: 'name',
                type: 'input',
                props: { label: 'Name' },
              },
            ],
          },
        ],
      },
    ]);

    expect(component.hasStepperLayout).toBeTrue();
    expect(fixture.nativeElement.querySelector('.ffu-stepper')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ffv-submit-button')).toBeNull();
    expect(textContent()).toContain('Step 1 of 1');
    expect(textContent()).toContain('Step 1');
  });

  it('does not announce storage success when the stepper only dispatches a submit', () => {
    createComponent([{ type: 'stepper', props: { surveyActive: true }, fieldGroup: [{
      props: { label: 'Step 1' }, fieldGroup: [{ key: 'name', type: 'input', props: { label: 'Name' } }],
    }] }]);
    const submitted = jasmine.createSpy('submitted');
    component.submitForm.subscribe(submitted);
    (fixture.nativeElement.querySelector('.ffu-stepper-actions button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.ffu-stepper-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ffu-stepper-card')).toBeNull();
  });

  it('keeps Angular sanitization active for HTML from a publication', () => {
    createComponent([{ type: 'stepper', props: {
      showWelcome: true,
      welcomeText: '<b>Welcome</b><img src="invalid:" onerror="unsafeHandler()"><script>unsafeHandler()</script><a href="javascript:unsafeHandler()">Link</a>',
    }, fieldGroup: [{ fieldGroup: [{ key: 'name', type: 'input' }] }] }]);
    const content = fixture.nativeElement.querySelector('.ffu-stepper-rich-text') as HTMLElement;
    expect(content.querySelector('b')?.textContent).toBe('Welcome');
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('img')?.hasAttribute('onerror')).toBeFalse();
    expect(content.querySelector('a')?.getAttribute('href')?.startsWith('javascript:')).toBeFalse();
  });

  it('renders available ranking options without choosing answers', () => {
    createComponent([
      {
        key: 'Q_RANK',
        type: 'ranking',
        props: {
          label: 'Rank priorities',
          options: [
            { code: 'SQ001', value: 'SQ001', label: 'First' },
            { code: 'SQ002', value: 'SQ002', label: 'Second' },
          ],
        },
      },
    ]);

    expect(textContent()).toContain('Rank priorities');
    expect(textContent()).toContain('First');
    expect(textContent()).toContain('Second');
    expect(component.form.get('Q_RANK')?.value).toBeUndefined();
    expect(component.model['Q_RANK']).toBeUndefined();
  });
});
