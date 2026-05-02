import { ApplicationConfig } from '@angular/core';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { withFormlyViewerI18n } from './formly-types/formly-viewer-validation-messages.provider';
import { withFormlyViewerTypes } from './formly-types/formly-viewer-types.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormlyCore([
      ...withFormlyMaterial(),
      withFormlyViewerTypes(),
      withFormlyViewerI18n(),
    ])
  ]
};
