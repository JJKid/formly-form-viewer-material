import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormlyFormViewerComponent } from './formly-form-viewer.component';

describe('FormlyFormViewerComponent', () => {
  let component: FormlyFormViewerComponent;
  let fixture: ComponentFixture<FormlyFormViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormlyFormViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormlyFormViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
