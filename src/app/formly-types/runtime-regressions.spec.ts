import { ChangeDetectorRef } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ViewerFormlyStepperType } from './viewer-formly-stepper.type';
import { ViewerFormlyCheckboxWithTextType } from './viewer-formly-checkbox-with-text.type';
import { ViewerFormlySelectInlineType } from './viewer-formly-select-inline.type';

describe('Material response and navigation regressions', () => {
  it('comment and Other keys match the publication and clear on deselection', () => {
    const component = new ViewerFormlyCheckboxWithTextType();
    const option = { code: 'A1', value: 'A1', label: 'Option' };
    const other = { code: '-oth-', value: '-oth-', label: 'Other' };
    const model: Record<string, unknown> = {};
    component.field = { key: ['Q.1'], model, formControl: new FormControl([]), props: {
      options: [option, other], responseEncoding: { selectedValue: 'Y', unselectedValue: 'N' },
      otherWithComment: true, otherResponse: { code: '-oth-', label: 'Other', textResponseKey: 'Q_OTHER_TEXT', commentResponseKey: 'Q_OTHER_COMMENT' },
    } } as never;
    component.ngOnInit();
    component.onToggleOption(true, 'A1'); component.updateComment(option, 0, 'Comment');
    expect(model['Q.1_A1']).toBe('Y');
    expect(model['Q.1_A1_comment']).toBe('Comment');
    expect(model['Q.1__comments']).toBeUndefined();
    component.onToggleOption(false, 'A1');
    expect(model['Q.1_A1_comment']).toBe('');
    expect(model['Q.1_A1']).toBe('N');
    component.onToggleOption(true, '-oth-');
    component.updateOtherValue('Other text'); component.updateComment(other, 1, 'Other comment');
    expect(model['Q_OTHER_TEXT']).toBe('Other text');
    expect(model['Q_OTHER_COMMENT']).toBe('Other comment');
    component.onToggleOption(false, '-oth-');
    expect(model['Q_OTHER_TEXT']).toBe('');
    expect(model['Q_OTHER_COMMENT']).toBe('');
  });

  it('lists expose the independent selection comment and declared Other response', () => {
    const component = new ViewerFormlySelectInlineType();
    const model: Record<string, unknown> = {};
    component.field = { key: ['Q.1'], model, formControl: new FormControl(null), props: {
      commentWithSelection: true, otherWithComment: true,
      options: [{ code: '-oth-', value: '-oth-', label: 'Other' }, { code: 'A', value: 'A', label: 'Option' }],
      otherResponse: { code: '-oth-', label: 'Other', textResponseKey: 'EXPLICIT_OTHER' },
    } } as never;
    component.onSingleSelectionChange('-oth-');
    expect(component.showOtherCommentInput).toBeTrue();
    component.updateOtherComment('Other text'); component.updateSelectionComment('List comment');
    expect(model['EXPLICIT_OTHER']).toBe('Other text');
    expect(model['Q.1_comment']).toBe('List comment');
    component.onSingleSelectionChange('A');
    expect(model['EXPLICIT_OTHER']).toBe('');
  });

  const stepper = () => {
    TestBed.configureTestingModule({ providers: [{ provide: ChangeDetectorRef, useValue: { markForCheck() {} } }] });
    const component = TestBed.runInInjectionContext(() => new ViewerFormlyStepperType());
    component.field = { props: { navigationDelay: 0.02 }, form: new FormGroup({}), fieldGroup: [
      { key: 'Q1', formControl: new FormControl('A'), props: { options: [{ value: 'A', label: 'No acepto participar en el taller, pero deseo continuar' }] } },
      { key: 'Q2', formControl: new FormControl('B') }, { key: 'Q3', formControl: new FormControl('C') },
    ] } as never;
    return component;
  };

  it('queues one advance and never ends the survey based on an option label', fakeAsync(() => {
    const component = stepper();
    component.nextStep(); component.nextStep();
    expect(component.advancing).toBeTrue();
    expect(component.completionState).toBeNull();
    tick(20);
    expect(component.currentStepIndex).toBe(1);
    expect(component.advancing).toBeFalse();
    component.nextStep(); component.ngOnDestroy(); tick(20);
    expect(component.currentStepIndex).toBe(1);
  }));

  it('rechecks validity when the navigation timer fires', fakeAsync(() => {
    const component = stepper();
    component.nextStep(); component.field.fieldGroup![0].formControl!.setErrors({ invalid: true });
    tick(20);
    expect(component.currentStepIndex).toBe(0);
    component.ngOnDestroy();
  }));
});
