# formly-form-viewer-material

[English](README.md) | Español

Visor Angular Material para ejecutar una publicación Formly.

## Proposito

Recibe `FormlyFieldConfig[]`, muestra sus controles y emite el modelo de respuestas mediante `FormlyFormViewerComponent`. No abre sesiones ni guarda respuestas por su cuenta.

La lectura de catalogo, la autorizacion publica, el guardado local y la sincronizacion de respuestas se configuran desde la app host con `formly-form-utils`.

## Integracion esperada

Esta libreria se usa junto con:

- `formly-form-utils`: catalogo, PouchDB local y envio al BFF
- un host app: por ejemplo `buzonPuma`

## Registro en la app host

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

Registre también los módulos Material base que requieran los controles utilizados, incluidos datepicker, slider y toggle de Formly cuando corresponda. `src/main.ts` de BuzonPuma muestra esa integración.

## Compatibilidad

| Elemento | Versión del código local en preparación |
| --- | --- |
| `formly-form-viewer-material` | `1.0.0` |
| Angular | `^20.3.31` |
| Angular CDK/Material | `^20.2.14` |
| `@ngx-formly/core` / `@ngx-formly/material` | `^7.1.0` |
| `formly-form-parser` | `2.0.0` |
| `survey-structure` | `3.0.0` |
| TypeScript | `5.9.3` |
| `zone.js` | `~0.15.1` |

El componente publico es `FormlyFormViewerComponent` y el selector se mantiene como `formly-form-viewer`.

Esta preparación local no implica que esas versiones ya estén publicadas. El parser y el contrato son dependencias declaradas; no deben copiarse fuentes del editor a la aplicación consumidora.

## Captura desde una aplicación

Importa `FormlyFormViewerComponent` en el componente standalone consumidor:

```html
<formly-form-viewer
  [fields]="fields"
  [model]="answers"
  [options]="options"
  [submitting]="saving"
  (submitForm)="saveAnswers($event)"
/>
```

`fields` es la publicación producida por el parser o recibida de la API. `answers` contiene las respuestas actuales; `options` permite aportar contexto Formly. Actualizar los campos conserva el modelo y las opciones recibidas. Para comenzar otra captura, la aplicación entrega explícitamente un modelo nuevo.

Mientras `saving` sea verdadero se bloquean los controles —incluido el stepper— y los intentos de envío. La aplicación también debe mantener su propia guardia durante el guardado y liberar `saving` en `finally`.

El stepper no confirma que una respuesta esté guardada al pulsar Enviar: esa confirmación corresponde al resultado recibido por la aplicación. Los textos HTML de una publicación mantienen el sanitizado nativo de Angular.

## Matrices, ranking y respuestas

El visor lee `props.matrix.mode`, generado desde `SurveyStructure`; no utiliza otro modelo de matriz con `selectionMode`.

| Modo | Control | Respuesta de una fila |
| --- | --- | --- |
| `single` | Una elección por fila | `{ "R1": "C2" }` |
| `multiple` | Casillas independientes | `{ "R1": { "C1": true } }` |
| `text` | Texto por celda | `{ "R1": { "C1": "Respuesta" } }` |
| `number` | Número por celda | `{ "R1": { "C1": 0 } }` |
| `dual-single` | Una elección en cada escala | `{ "R1": { "S0": "A1", "S1": "B2" } }` |

La respuesta queda bajo la clave de la pregunta, por ejemplo `answers.MATRIX`. En doble escala, `S0` identifica una escala y `A1` una opción de esa escala. Cada escala declara sus propias opciones.

Si `props.responseEncoding` declara `{ selectedValue: "Y", unselectedValue: "N" }`, las casillas leen y escriben esos valores: `"N"` no se interpreta como verdadero. Sin codificación explícita se usan booleanos. Las celdas ausentes no se rellenan como respuestas negativas.

También se pueden cargar claves planas como `MATRIX_R1_C1`. Al editar una celda se mantiene esa clave junto con su valor anidado. Los helpers de lectura, escritura y codificación pertenecen al parser y se comparten con el visor Ionic.

El ranking comienza sin opciones seleccionadas, salvo un valor predeterminado explícito. La persona agrega opciones, cambia su posición y las quita. Abrir el formulario no genera una respuesta.

## Condiciones y validación

Se conservan las expresiones `fields[].expressions.hide` de la publicación y Formly las ejecuta. El visor no interpreta LimeSurvey: el parser ya recibió la condición neutral.

Los límites, patrones y obligatoriedad permanecen en `props`. Al leer una publicación JSON se reconstruyen mediante el parser los validadores de selección y de celdas de matriz, porque JSON no transporta funciones. Una matriz requerida exige respuestas por fila/celda según su modo; en selección múltiple basta al menos una selección por fila. Una matriz opcional admite respuestas parciales, pero valida las celdas contestadas.

Los valores predeterminados llegan en `field.defaultValue`, como exige Formly, y no reemplazan respuestas existentes.

## Desarrollo

Estos comandos requieren que las versiones declaradas estén disponibles en npm. Mientras se autoriza la publicación, use los archivos de paquete locales exactos para verificar la integración; no sustituya versiones anteriores ni omita la comprobación de peers.

```bash
npm ci
npm run test:ci
npm run build
```

Salida:

- `dist/formly-form-viewer-material/`

Karma ejecuta pruebas ChromeHeadless. La suite genera encuestas sintéticas con el parser, serializa a JSON y comprueba cinco matrices, codificación, defaults, ranking parcial, condiciones, validadores, actualización de campos y bloqueo durante el guardado. No sustituye una prueba real de autorización, red o persistencia desde la aplicación consumidora.

Si reinstalas un tarball local modificado con el mismo número de versión, limpia la caché Angular antes de repetir las pruebas:

```bash
npx ng cache clean
npm run test:ci
```

## Publicacion

**La publicación está pausada.** Este comando inspecciona el paquete sin publicarlo:

```bash
npm run pack:dry-run
```

Ese comando inspecciona el paquete sin publicarlo. Publica únicamente desde `dist/formly-form-viewer-material`, después de verificarlo también en una aplicación consumidora; no publiques el árbol de desarrollo.
