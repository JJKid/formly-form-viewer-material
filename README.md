# formly-form-viewer-material

English | [Español](README.es.md)

Angular Material viewer for running a Formly publication.

## Purpose

`FormlyFormViewerComponent` receives `FormlyFieldConfig[]`, renders the controls and emits the response model. It does not open sessions or save responses itself.

The host configures catalog access, public authorization, local storage and response synchronization through `formly-form-utils`.

## Expected integration

Use this library with:

- `formly-form-utils`: catalog, local PouchDB and submission to the BFF.
- A host application, such as `buzonPuma`.

## Register in the host

```ts
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { withFormlyViewerTypes, withFormlyViewerI18n } from 'formly-form-viewer-material';

export const appConfig = {
  providers: [provideFormlyCore([
    ...withFormlyMaterial(),
    withFormlyViewerTypes(),
    withFormlyViewerI18n({ defaultLanguage: 'es' }),
  ])],
};
```

Register the base Material modules required by the controls you use, including the Formly datepicker, slider and toggle modules when applicable. BuzonPuma's `src/main.ts` is an integration example.

## Compatibility

| Component | Version prepared in local source |
| --- | --- |
| `formly-form-viewer-material` | `1.0.0` |
| Angular | `^20.3.31` |
| Angular CDK/Material | `^20.2.14` |
| `@ngx-formly/core` / `@ngx-formly/material` | `^7.1.0` |
| `formly-form-parser` | `2.0.0` |
| `survey-structure` | `3.0.0` |
| TypeScript | `5.9.3` |
| `zone.js` | `~0.15.1` |

The public component is `FormlyFormViewerComponent` and its selector is `formly-form-viewer`.

Local preparation does not mean these releases are published. The parser and contract are declared dependencies; do not copy editor source into the host.

## Capture from an application

Import `FormlyFormViewerComponent` in the standalone consuming component:

```html
<formly-form-viewer
  [fields]="fields"
  [model]="answers"
  [options]="options"
  [submitting]="saving"
  (submitForm)="saveAnswers($event)"
/>
```

`fields` contains generated Formly fields or a publication received from the API. `answers` holds current responses; `options` provides Formly context. Updating fields preserves the supplied model and options. To start a new capture, the host explicitly supplies a new model.

While `saving` is true, controls—including the stepper—and submit attempts are blocked. The host must also guard its persistence operation and clear `saving` in `finally`.

Pressing Submit in the stepper does not confirm storage; only the host's received result does. Publication HTML keeps Angular's native sanitization.

## Matrices, ranking and answers

The viewer reads `props.matrix.mode` generated from `SurveyStructure`, not a separate matrix model with `selectionMode`.

| Mode | Control | Row response |
| --- | --- | --- |
| `single` | One choice per row | `{ "R1": "C2" }` |
| `multiple` | Independent checkboxes | `{ "R1": { "C1": true } }` |
| `text` | Text in each cell | `{ "R1": { "C1": "Respuesta" } }` |
| `number` | Number in each cell | `{ "R1": { "C1": 0 } }` |
| `dual-single` | One choice in each scale | `{ "R1": { "S0": "A1", "S1": "B2" } }` |

The response lives under the question key, such as `answers.MATRIX`. In a dual-scale matrix, `S0` identifies a scale and `A1` an option in that scale. Each scale declares its own options.

When `props.responseEncoding` declares `{ selectedValue: "Y", unselectedValue: "N" }`, checkboxes read and write those values: `"N"` is not interpreted as true. Without explicit encoding they use booleans. Missing cells are not filled with negative answers.

Flat keys such as `MATRIX_R1_C1` can also be loaded. Editing a cell maintains that key together with its nested value. Reading, writing and encoding helpers belong to the parser and are shared with the Ionic viewer.

Ranking starts with no selected options unless an explicit default exists. Participants add, reorder and remove options. Opening the form does not create a response.

## Conditions and validation

The publication retains `fields[].expressions.hide` and Formly executes it. The viewer does not interpret LimeSurvey: the parser already received the neutral condition.

Limits, patterns and required flags remain in `props`. Loading JSON reconstructs selection and matrix-cell validators through the parser because JSON cannot transport functions. A required matrix needs responses per row/cell according to its mode; multiple selection needs at least one selected cell per row. Optional matrices allow partial responses but validate the cells that were answered.

Defaults arrive in `field.defaultValue`, as required by Formly, and do not replace existing answers.

## Development

These commands require the declared package releases to be available in npm. Until publication is approved, use the exact local release archives for integration; do not substitute older versions or bypass peer checks.

```bash
npm ci
npm run test:ci
npm run build
```

Output:

- `dist/formly-form-viewer-material/`

Karma runs ChromeHeadless tests. The suite generates synthetic surveys with the parser, serializes them to JSON and checks all five matrix modes, encoding, defaults, partial ranking, conditions, validators, field updates and submission blocking. It does not replace a real host integration test covering authorization, networking and persistence.

When reinstalling a modified local archive with the same version, clear Angular's cache before rerunning tests:

```bash
npx ng cache clean
npm run test:ci
```

## Publication

**Publication is paused.** This command inspects a package without publishing it:

```bash
npm run pack:dry-run
```

After approval and host integration verification, publish only from `dist/formly-form-viewer-material`, not the development tree.
