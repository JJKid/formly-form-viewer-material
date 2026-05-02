# formly-form-viewer-material

Libreria Angular de render para formularios Formly con Material.

## Que hace

- registra tipos custom de Formly
- renderiza `FormlyFieldConfig`
- expone i18n para UI y validaciones

## Que no hace

- no se conecta a MongoDB
- no se conecta a CouchDB
- no hace sync offline
- no maneja auth

Esos concerns viven fuera de esta libreria.

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

## Publicacion

```bash
npm version patch
npm run build
cd dist/formly-form-viewer-material
npm publish --access public
```

## Nota de arquitectura

Cualquier documentacion o integracion que describa a esta libreria con acceso directo a CouchDB o MongoDB queda deprecada.
