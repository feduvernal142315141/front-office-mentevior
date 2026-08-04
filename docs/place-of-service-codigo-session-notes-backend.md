# Place of Service con código en Session Notes — Requerimiento Backend

> Fecha: 2026-08-04
> Aplica a: session notes 97153, 97155 y 97156 (formulario en la app **y** PDF)

## Qué se pide

En el bloque **Service Details** de la session note, el campo **Place of Service**
debe mostrar el código POS al lado del nombre.

```
Hoy:    Company
Se pide: Office (11)
```

## Por qué es un cambio de backend

Dos cosas, ninguna resoluble desde el front:

1. **El PDF lo genera el backend.** El front sólo lo proxea
   (`app/api/reports/appointment-note/preview/[fileName]/route.ts` reenvía el
   binario tal cual). Todo lo que se ve en el PDF sale del backend.

2. **El formulario pinta el string tal cual llega.** `serviceDetails.placeOfService`
   se parsea como texto plano en los tres servicios de nota
   (`appointment-note.service.ts:80` y equivalentes en 97155/97156) y se renderiza
   sin transformar. **No viene ni el código ni el `placeServiceId`**, así que el
   front no tiene de dónde derivarlo.

## Hallazgo extra: parece que se está mandando el nickname, no el place of service

El valor actual es `"Company"`. Los nombres del catálogo `/place-service/catalog`
**ya traen el código embebido en el `name`** — el propio front busca por
`"office (11)"` (`Step2Addresses.tsx:305`), y las direcciones del cliente exponen
`placeServiceName` con ese mismo formato.

`"Company"` no sigue ese patrón y sí coincide con el `nickName` de la dirección
(en el modal de appointment las direcciones se etiquetan
`nickName — placeService`, ver `useAppointmentForm.ts:220`).

**A verificar:** que `serviceDetails.placeOfService` no esté tomando
`clientAddress.nickName` en vez del place of service de la dirección. Si es eso,
el arreglo es apuntar al campo correcto y el código viene solo.

## Cambio solicitado

### 1. `GET /appointment/{appointmentId}/note`
### 2. `GET /appointment/{appointmentId}/note/97155`
### 3. `GET /appointment/{appointmentId}/note/97156`

Que `serviceDetails.placeOfService` resuelva el **place of service de la dirección
del appointment**, con el código incluido:

```json
{
  "serviceDetails": {
    "date": "2025-08-02",
    "placeOfService": "Office (11)",
    "timeInOut": "8:50 AM - 11:00 AM",
    "hours": "2.07"
  }
}
```

Si prefieren no tocar el string existente, la alternativa es agregar el código en
un campo aparte y el front lo concatena:

```json
{
  "serviceDetails": {
    "placeOfService": "Office",
    "placeOfServiceCode": "11"
  }
}
```

> Preferimos la primera opción: el `name` del catálogo ya viene como `"Office (11)"`,
> así que es reusar el valor que ya existe y **no requiere cambios en el front**.

### 4. PDF de la session note

`GET /appointment/note/preview` (los tres códigos) — mismo valor en el bloque
**Service Details** del documento.

## Criterio de aceptación

- En los tres formularios de la app, Place of Service muestra nombre + código.
- En el PDF de los tres códigos, ídem.
- Una dirección sin place of service configurado sigue mostrando lo que haya
  (o vacío), sin romper el render.
