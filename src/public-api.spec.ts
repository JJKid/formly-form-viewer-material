import * as publicApi from './public-api';
import { FormlyFormViewerComponent } from './app/formly-form-viewer/formly-form-viewer.component';
import { ViewerFormlyRankingType } from './app/formly-types/viewer-formly-ranking.type';

describe('public API', () => {
  it('exports FormlyFormViewerComponent as the public viewer component', () => {
    expect(publicApi.FormlyFormViewerComponent).toBe(FormlyFormViewerComponent);
  });

  it('exports the ranking Formly type', () => {
    expect(publicApi.ViewerFormlyRankingType).toBe(ViewerFormlyRankingType);
  });
});
