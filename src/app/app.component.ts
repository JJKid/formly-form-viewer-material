import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyFormViewerComponent } from './formly-form-viewer/formly-form-viewer.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, FormlyFormViewerComponent],
})
export class AppComponent {
  form = new FormGroup({});
  submittedModel: unknown = null;
  model = {
    name: 'Juan',
    email: 'juan@example.com',
    accept: true
  };
  fields: FormlyFieldConfig[] = [
    {
      key: 'name',
      type: 'input',
      props: {
        label: 'Nombre',
        placeholder: 'Tu nombre',
        required: true
      }
    },
    {
      key: 'email',
      type: 'input',
      props: {
        label: 'Email',
        placeholder: 'tu@email.com',
        required: true
      }
    },
    {
      key: 'accept',
      type: 'checkbox',
      props: {
        label: 'Acepto terminos'
      }
    }
  ];

  onSubmit(model: any) {
    this.submittedModel = model;
  }
}
