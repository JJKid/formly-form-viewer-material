import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyViewerComponent } from './formly-form-viewer/formly-form-viewer.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, FormlyViewerComponent],
})
export class AppComponent {
  form = new FormGroup({});
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
    console.log('submit', model);
  }
}
