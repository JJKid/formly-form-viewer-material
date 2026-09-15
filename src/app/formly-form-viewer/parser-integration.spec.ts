import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { transformSurveyToFormly } from 'formly-form-parser';
import type { SurveyStructureField, SurveyStructureMatrix } from 'survey-structure';
import { parseSurveyStructure } from 'survey-structure';
import { appConfig } from '../app.config';
import { FormlyFormViewerComponent } from './formly-form-viewer.component';

/** Exercise the JSON publication boundary, not handwritten copies of parser output. */
describe('Material viewer with published parser output', () => {
  let fixture: ComponentFixture<FormlyFormViewerComponent>;
  let viewer: FormlyFormViewerComponent;

  const publication = (fields: SurveyStructureField[]): FormlyFieldConfig[] => JSON.parse(JSON.stringify(
    transformSurveyToFormly({ contractVersion: '2.0.0', id: 'test', fields }, { typeMap: { custom: 'repeat' } }).formlyFields,
  ));

  const matrixField = (mode: SurveyStructureMatrix['mode'], attributes: Record<string, unknown> = {}): SurveyStructureField => parseSurveyStructure({
    contractVersion: '2.0.0', id: 'test', fields: [{
    id: 'matrix', code: 'MATRIX', type: 'matrix', label: 'Question 1',
    matrix: mode === 'dual-single'
      ? { mode, rows: [{ code: 'R1', label: 'Row 1' }], columns: [
        { code: 'S0', label: 'Scale 1', options: [{ code: 'A1', label: 'Option 1' }, { code: 'A2', label: 'Option 2' }] },
        { code: 'S1', label: 'Scale 2', options: [{ code: 'B1', label: 'Option 3' }, { code: 'B2', label: 'Option 4' }] },
      ] }
      : { mode, rows: [{ code: 'R1', label: 'Row 1' }], columns: [
        { code: 'C1', label: 'Column 1' }, { code: 'C2', label: 'Column 2' },
      ] },
    ...attributes,
    }],
  }).fields[0];

  const render = (fields: SurveyStructureField[], model: Record<string, unknown> = {}, options: FormlyFormOptions = {}) => {
    fixture = TestBed.createComponent(FormlyFormViewerComponent);
    viewer = fixture.componentInstance;
    fixture.componentRef.setInput('fields', publication(fields));
    fixture.componentRef.setInput('model', model);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  };

  const click = (selector: string, index = 0) => {
    const element = fixture.nativeElement.querySelectorAll(selector)[index] as HTMLElement;
    expect(element).withContext(selector).toBeTruthy();
    element.click();
    fixture.detectChanges();
  };

  const inputValue = (selector: string, value: string, index = 0) => {
    const input = fixture.nativeElement.querySelectorAll(selector)[index] as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormlyFormViewerComponent, NoopAnimationsModule],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it('hydrates flat multiple inputs once and does not restore an erased alias', () => {
    render([{ id: 'multi', code: 'MULTI', type: 'multiple-input', label: 'Question',
      subquestions: [{ code: 'R1', label: 'Input 1' }, { code: 'R2', label: 'Input 2' }],
    }], { MULTI_R1: 'Prefilled answer', MULTI_R2: 'Second answer' });
    const inputs = fixture.nativeElement.querySelectorAll('ffu-viewer-multiple-input input');
    expect(inputs[0].value).toBe('Prefilled answer');
    expect(inputs[1].value).toBe('Second answer');
    expect(viewer.model['MULTI_R1']).toBeUndefined();
    inputValue('ffu-viewer-multiple-input input', '');
    expect(viewer.model['MULTI']).toEqual({ R1: '', R2: 'Second answer' });
    expect(viewer.form.get('MULTI')?.dirty).toBeTrue();
  });

  it('keeps an explicit nested empty input instead of restoring its old flat value', () => {
    render([{ id: 'multi', code: 'MULTI', type: 'multiple-input', label: 'Question',
      subquestions: [{ code: 'R1', label: 'Input 1' }],
    }], { MULTI: { R1: '' }, MULTI_R1: 'Old answer' });
    expect(fixture.nativeElement.querySelector('ffu-viewer-multiple-input input').value).toBe('');
    expect(viewer.model['MULTI_R1']).toBeUndefined();
  });

  it('renders a single matrix and stores the selected column code', () => {
    render([matrixField('single')]);
    expect(fixture.nativeElement.querySelectorAll('mat-radio-button').length).toBe(2);
    expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();
    click('input[type="radio"]', 1);
    expect(viewer.model['MATRIX']).toEqual({ R1: 'C2' });
    expect(viewer.model['MATRIX_R1']).toBeUndefined();
  });

  it('reads negative encoded cells as unchecked and writes the declared values', () => {
    const field = { ...matrixField('multiple'), responseEncoding: { selectedValue: 'Y', unselectedValue: 'N' } };
    render([field], { MATRIX: { R1: { C1: 'N' } } });
    expect(fixture.nativeElement.querySelector('mat-radio-button')).toBeNull();
    expect((fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBeFalse();
    click('input[type="checkbox"]');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 'Y' } });
    expect(viewer.model['MATRIX_R1_C1']).toBeUndefined();
    click('input[type="checkbox"]');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 'N' } });
    expect(viewer.model['MATRIX_R1_C1']).toBeUndefined();
  });

  it('uses booleans when no selection encoding is declared, without filling other cells', () => {
    render([matrixField('multiple')]);
    expect(viewer.model['MATRIX']).toBeUndefined();
    click('input[type="checkbox"]');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: true } });
    click('input[type="checkbox"]');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: false } });
    expect(viewer.model['MATRIX_R1_C2']).toBeUndefined();
  });

  it('hydrates neutral matrix defaults as encoded answers from the generated publication', () => {
    render([matrixField('multiple', {
      defaultValue: { R1: { C1: true, C2: false } },
      responseEncoding: { selectedValue: 'Y', unselectedValue: 'N' },
    })]);
    const inputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBeTrue();
    expect(inputs[1].checked).toBeFalse();
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 'Y', C2: 'N' } });
  });

  it('hydrates explicit scalar defaults, including zero', () => {
    render([
      { id: 'text', code: 'TEXT', type: 'short-text', label: 'Text', defaultValue: 'Initial answer' },
      { id: 'number', code: 'NUMBER', type: 'number', label: 'Number', defaultValue: 0 },
    ]);
    expect(viewer.model['TEXT']).toBe('Initial answer');
    expect(viewer.model['NUMBER']).toBe(0);
  });

  it('hydrates flat matrix answers without treating N as selected', () => {
    render([{ ...matrixField('multiple'), responseEncoding: { selectedValue: 'Y', unselectedValue: 'N' } }],
      { MATRIX_R1_C1: 'N', MATRIX_R1_C2: 'Y' });
    const inputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBeFalse();
    expect(inputs[1].checked).toBeTrue();
    click('input[type="checkbox"]', 1);
    expect(viewer.model['MATRIX_R1_C2']).toBeUndefined();
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 'N', C2: 'N' } });
  });

  it('renders text cells and retains the row/column answer shape', () => {
    render([matrixField('text')]);
    expect(fixture.nativeElement.querySelectorAll('input[type="text"]').length).toBe(2);
    inputValue('input[type="text"]', 'Answer text');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 'Answer text' } });
  });

  it('renders numeric cells and restores range/integer validators lost in JSON', () => {
    render([{ ...matrixField('number'), validation: { min: 0, max: 3, integer: true } }]);
    expect(fixture.nativeElement.querySelectorAll('input[type="number"]').length).toBe(2);
    inputValue('input[type="number"]', '0');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: 0 } });
    expect(viewer.form.valid).toBeTrue();
    for (const invalidValue of ['-1', '4', '1.5']) {
      inputValue('input[type="number"]', invalidValue);
      expect(viewer.form.get('MATRIX')?.hasError('matrixCells')).withContext(invalidValue).toBeTrue();
    }
    inputValue('input[type="number"]', '');
    expect(viewer.model['MATRIX']).toEqual({ R1: { C1: null } });
    expect(viewer.form.valid).toBeTrue();
  });

  it('keeps both scales independent and validates their own option codes', () => {
    render([{ ...matrixField('dual-single'), required: true }]);
    expect(fixture.nativeElement.querySelectorAll('th[scope="colgroup"]').length).toBe(2);
    expect(viewer.form.get('MATRIX')?.hasError('matrixCells')).toBeTrue();
    click('input[type="radio"]', 1);
    expect(viewer.model['MATRIX']).toEqual({ R1: { S0: 'A2' } });
    expect(viewer.form.valid).toBeFalse();
    click('input[type="radio"]', 2);
    expect(viewer.model['MATRIX']).toEqual({ R1: { S0: 'A2', S1: 'B1' } });
    expect(viewer.model['MATRIX_R1_S0']).toBeUndefined();
    expect(viewer.model['MATRIX_R1_S1']).toBeUndefined();
    expect(viewer.form.valid).toBeTrue();
    viewer.form.get('MATRIX')?.setValue({ R1: { S0: 'B1', S1: 'B1' } });
    expect(viewer.form.get('MATRIX')?.hasError('matrixCells')).toBeTrue();
  });

  it('offers an explicit empty answer for each optional scale', () => {
    render([matrixField('dual-single')]);
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(6);
    click('input[type="radio"]');
    click('input[type="radio"]', 2);
    expect(viewer.model['MATRIX']).toEqual({ R1: { S0: '' } });
    expect(viewer.form.valid).toBeTrue();
  });

  for (const mode of ['single', 'multiple', 'text'] as const) {
    it(`requires real answers for a required ${mode} matrix after JSON publication`, () => {
      render([{ ...matrixField(mode), required: true }]);
      viewer.form.get('MATRIX')?.setValue({ R1: {} });
      expect(viewer.form.get('MATRIX')?.hasError('matrixCells')).toBeTrue();
    });
  }

  const ranking: SurveyStructureField = {
    id: 'rank', code: 'RANK', type: 'ranking', label: 'Ranking', required: true,
    options: [{ code: 'A1', label: 'Option 1' }, { code: 'A2', label: 'Option 2' }],
    validation: { minSelections: 1, maxSelections: 1 },
  };

  it('starts ranking unanswered and lets the user add/remove a subset with shared limits', () => {
    render([ranking]);
    expect(viewer.model['RANK']).toBeUndefined();
    expect(viewer.form.valid).toBeFalse();
    click('.ffu-ranking-available button');
    expect(viewer.model['RANK']).toEqual(['A1']);
    expect(viewer.form.valid).toBeTrue();
    click('.ffu-ranking-available button');
    expect(viewer.model['RANK']).toEqual(['A1', 'A2']);
    expect(viewer.form.get('RANK')?.hasError('maxSelections')).toBeTrue();
    click('.ffu-ranking-actions button');
    expect(viewer.model['RANK']).toEqual(['A2']);
    expect(viewer.form.valid).toBeTrue();
  });

  it('keeps a preloaded partial ranking instead of appending all remaining options', () => {
    render([ranking], { RANK: ['A2'] });
    expect(viewer.form.get('RANK')?.value).toEqual(['A2']);
    expect(fixture.nativeElement.querySelectorAll('.ffu-ranking-item').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.ffu-ranking-available button').length).toBe(1);
  });

  it('lets the user reorder selected ranking items', () => {
    render([{ ...ranking, validation: { maxSelections: 2 } }], { RANK: ['A1', 'A2'] });
    click('.ffu-ranking-item:nth-child(2) .ffu-ranking-actions button', 1);
    expect(viewer.model['RANK']).toEqual(['A2', 'A1']);
  });

  it('keeps answers, form and host options when fields are refreshed', () => {
    const field: SurveyStructureField = { id: 'name', code: 'NAME', type: 'short-text', label: 'Name' };
    const options = { formState: { hostContext: 'keep' } };
    render([field], { NAME: 'Captured answer' }, options);
    const originalForm = viewer.form;
    fixture.componentRef.setInput('fields', publication([{ ...field, label: 'Updated label' }]));
    fixture.detectChanges();
    expect(viewer.model).toEqual({ NAME: 'Captured answer' });
    expect(viewer.form.get('NAME')?.value).toBe('Captured answer');
    expect(viewer.form).toBe(originalForm);
    expect(viewer.options).toBe(options);
    expect(viewer.options.formState.hostContext).toBe('keep');
  });

  it('retains model and options supplied with an asynchronous fields update', () => {
    render([]);
    const options = { formState: { loaded: true } };
    fixture.componentRef.setInput('fields', publication([{ id: 'name', code: 'NAME', type: 'short-text', label: 'Name' }]));
    fixture.componentRef.setInput('model', { NAME: 'Loaded answer' });
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
    expect(viewer.model).toEqual({ NAME: 'Loaded answer' });
    expect(viewer.options).toBe(options);
  });

  it('executes a generated neutral visibility condition against captured answers', () => {
    render([
      { id: 'age', code: 'AGE', type: 'number', label: 'Age' },
      { id: 'follow', code: 'FOLLOW', type: 'short-text', label: 'Follow-up', visibility: { condition: {
        type: 'comparison', responseReference: { fieldCode: 'AGE' }, operator: 'greater-than-or-equal', value: 18,
      } } },
    ]);
    expect(viewer.effectiveFields[1].hide).toBeTrue();
    inputValue('input[type="number"]', '18');
    expect(viewer.effectiveFields[1].hide).toBeFalse();
    expect(viewer.effectiveFields[1].expressions?.['hide']).toContain('AGE');
  });

  it('retains built-in range and pattern validators after publication', () => {
    render([
      { id: 'age', code: 'AGE', type: 'number', label: 'Age', validation: { min: 18, max: 99 } },
      { id: 'code', code: 'CODE', type: 'short-text', label: 'Code', validation: { pattern: '^A[0-9]+$' } },
    ]);
    viewer.form.get('AGE')?.setValue(17);
    viewer.form.get('CODE')?.setValue('wrong');
    expect(viewer.form.get('AGE')?.hasError('min')).toBeTrue();
    expect(viewer.form.get('CODE')?.hasError('pattern')).toBeTrue();
    viewer.form.get('AGE')?.setValue(100);
    expect(viewer.form.get('AGE')?.hasError('max')).toBeTrue();
    viewer.form.get('AGE')?.setValue(18);
    viewer.form.get('CODE')?.setValue('A1');
    expect(viewer.form.valid).toBeTrue();
  });

  it('blocks another submit and disables capture while the host is saving', () => {
    render([{ id: 'name', code: 'NAME', type: 'short-text', label: 'Name' }]);
    const submitted = jasmine.createSpy('submitted');
    viewer.submitForm.subscribe(submitted);
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();
    viewer.onSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBeTrue();
    expect((fixture.nativeElement.querySelector('.ffv-submit-button') as HTMLButtonElement).disabled).toBeTrue();
    fixture.componentRef.setInput('submitting', false);
    fixture.detectChanges();
    viewer.onSubmit();
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it('restores integer validation from JSON and preserves literal punctuation', () => {
    render([{ id: 'i', code: 'I.N[0]', type: 'number', label: 'Integer', validation: { integer: true } }]);
    const control = viewer.form.get(['I.N[0]'])!;
    expect(control).toBeTruthy();
    const submitted = jasmine.createSpy('submitted'); viewer.submitForm.subscribe(submitted);
    control.setValue(1.5); fixture.detectChanges(); viewer.onSubmit();
    expect(control.hasError('integer')).toBeTrue();
    expect(submitted).not.toHaveBeenCalled();
    control.setValue(2); fixture.detectChanges();
    expect(viewer.model['I.N[0]']).toBe(2);
    expect(viewer.model['I']).toBeUndefined();
    expect(viewer.form.valid).toBeTrue();
  });

  it('evaluates custom child conditions against root and sibling answers', () => {
    render([{ id: 'root', code: 'ROOT', label: 'Root', type: 'short-text' }, {
      id: 'block', code: 'BLOCK', label: 'Block', type: 'custom', childrenFields: [
        { id: 'child', code: 'CHILD', label: 'Child', type: 'short-text' },
        { id: 'dep', code: 'DEP', label: 'Dependent', type: 'short-text', visibility: { condition: {
          type: 'all', conditions: [
            { type: 'answered', responseReference: { fieldCode: 'ROOT' } },
            { type: 'answered', responseReference: { fieldCode: 'CHILD' } },
          ],
        } } },
      ],
    }]);
    const dependent = viewer.effectiveFields[1].fieldGroup![1];
    expect(dependent.hide).toBeTrue();
    viewer.form.get('ROOT')?.setValue('yes');
    viewer.form.get(['BLOCK', 'CHILD'])?.setValue('ready'); fixture.detectChanges();
    expect(dependent.hide).toBeFalse();
  });

  it('hiding a matrix cannot revive the removed answer through a flat alias', () => {
    render([{ id: 'root', code: 'ROOT', label: 'Root', type: 'number' },
      { ...matrixField('number'), visibility: { condition: { type: 'comparison',
        responseReference: { fieldCode: 'ROOT' }, operator: 'equals', value: 1 } } },
    ], { ROOT: 1, MATRIX_R1_C1: 7 });
    expect(viewer.form.get('MATRIX')?.value).toEqual({ R1: { C1: 7 } });
    expect(viewer.model['MATRIX_R1_C1']).toBeUndefined();
    viewer.form.get('ROOT')?.setValue(0); fixture.detectChanges();
    expect(viewer.model['MATRIX']).toBeUndefined();
    expect(viewer.model['MATRIX_R1_C1']).toBeUndefined();
    viewer.form.get('ROOT')?.setValue(1); fixture.detectChanges();
    expect(viewer.form.get('MATRIX')?.value == null).toBeTrue();
  });
});
