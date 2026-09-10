# formly-form-viewer-material

Libreria Angular de render para formularios Formly con Material.

## Proposito

Esta libreria contiene el viewer visual para formularios Formly con Angular Material. Registra los tipos personalizados que necesita el proyecto, expone el componente publico `FormlyFormViewerComponent` y permite renderizar un arreglo `FormlyFieldConfig[]` dentro de una app Angular.

La lectura de catalogo, la autorizacion publica, el guardado local y la sincronizacion de respuestas se configuran desde la app host con `formly-form-utils`.

## Integracion esperada

Esta libreria se usa junto con:

- `formly-form-utils`: catalogo, PouchDB local y envio al BFF
- un host app: por ejemplo `buzonPuma`

## Registro en la app host

```ts
FormlyModule.forRoot({
  ...withFormlyViewerTypes(),
  ...withFormlyViewerI18n({
    defaultLanguage: 'es',
    i18nDictionaries: MY_DICTIONARIES,
  }),
})
```

## Compatibilidad

| Elemento | Version/rango para `formly-form-viewer-material@0.0.1` |
| --- | --- |
| `formly-form-viewer-material` | `0.0.1` |
| Angular | `^19.2.25` |
| Angular CDK/Material | `^19.2.19` |
| `@ngx-formly/core` / `@ngx-formly/material` | `^7.0.1` |
| RxJS | `~7.8.0` |
| TypeScript | `~5.6.x` |
| `zone.js` | `~0.15.0` |

El componente publico es `FormlyFormViewerComponent` y el selector se mantiene como `formly-form-viewer`.

Nota de auditoria: `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless` y `npm pack --dry-run` sobre `dist/formly-form-viewer-material` pasan. `npm audit` no queda limpio en Angular 19; una version security-clean requeriria una migracion mayor.

## Desarrollo

```bash
npm install
npm run build
```

Salida:

- `dist/formly-form-viewer-material/`

## Integracion local en un host

Ejemplo en `package.json` del host:

```json
"formly-form-viewer-material": "file:../formly-form-viewer-material/dist/formly-form-viewer-material/formly-form-viewer-material-0.1.0.tgz"
```

Luego:

```bash
npm install
npm run build
```

Un host minimo Angular sirve para probar que una app externa puede consumir esta libreria sin importar codigo del editor de Form Builder. Debe instalar el paquete, registrar Formly con `withFormlyViewerTypes()`, renderizar `FormlyFormViewerComponent` y pasarle un arreglo `FormlyFieldConfig[]` de prueba.

## Publicacion

```bash
npm version patch
npm run build
cd dist/formly-form-viewer-material
npm publish --access public
```

Publica desde `dist/formly-form-viewer-material`, no desde la raiz del repo. La raiz contiene archivos de desarrollo que no deben formar parte del paquete npm consumible.
