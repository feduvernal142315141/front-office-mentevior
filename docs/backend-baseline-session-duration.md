# Backend: duración de sesión en el Baseline (Rate y Duration)

## Contexto

Al armar el Service Plan no hay cita agendada, así que el baseline es una colección de datos independiente del calendario. Para los items de tipo **Rate** y **Duration** el analista ahora carga a mano, en cada fila del baseline, cuánto duró la sesión. La gráfica y la tabla de Rate calculan el baseline con ese dato y no con las citas.

Para **Frequency** (y el resto de los tipos) nada cambia.

## Campo nuevo

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `sessionDuration` | número decimal, `> 0` | solo Rate/Duration; `null` en los demás | Duración de la sesión del baseline, **expresada en la unidad del `periodCatalogId` de esa misma fila** (si Period = Hour, son horas). |

Ejemplo: fila con `value: 8`, `periodCatalogId` = Hour, `sessionDuration: 2.5` → 8 ocurrencias en 2.5 horas.

## Qué necesitamos del backend

1. **Persistir** `sessionDuration` en el baseline del item (`client-service-plan-category-item-baseline`): columna numérica decimal, nullable.
2. **Aceptarlo** en el payload de guardado del item, dentro del arreglo `baseline[]` (el mismo que hoy lleva `id`, `date`, `value`, `periodCatalogId`, `environmentalChanges`, `show`).
3. **Devolverlo** en la lectura de baselines del item, tanto en el detalle del item como en el listado del service plan del cliente (`baseline[]` de cada item). El front lo lee como `sessionDuration`.
4. **Validar** (sugerido): si el Type del item es Rate o Duration, `sessionDuration` es obligatorio y `> 0`; para otros tipos se ignora o se guarda `null`.
5. **Clonado**: si el baseline se copia al clonar el service plan de la compañía al cliente, incluir el campo.
6. (Opcional) Si el baseline a nivel de categoría (`client-service-plan-category-baseline`) también se usa con Rate/Duration, el mismo campo.

## Contrato

Request (guardado del item, fragmento):

```json
{
  "baseline": [
    {
      "id": "uuid-opcional-si-existe",
      "date": "2026-10-16T00:00:00.000Z",
      "value": 8,
      "periodCatalogId": "uuid-period-hour",
      "sessionDuration": 2.5,
      "environmentalChanges": "",
      "show": true
    }
  ]
}
```

Response (lectura, fragmento):

```json
{
  "baseline": [
    {
      "id": "uuid",
      "date": "2026-10-16T00:00:00.000Z",
      "value": 8,
      "periodCatalogId": "uuid-period-hour",
      "sessionDuration": 2.5,
      "environmentalChanges": "",
      "show": true
    }
  ]
}
```

- El front **no envía** `sessionDuration` cuando el Type no es Rate/Duration (el campo va omitido).
- Los baselines existentes quedan con `sessionDuration: null`. El front los sigue mostrando como hasta ahora (valor sin dividir) hasta que se les cargue la duración.

## Sin cambios

- `PUT /client-service-plan-category-item-baseline/values` (edición de valores y notas desde la grilla) no necesita cambios por ahora: la duración se edita desde la configuración del baseline.
- Borrado de baselines.

## Cómo lo usa el front (referencia)

- **Rate**: valor del baseline en la gráfica y en la tabla = `value / sessionDuration`, con la duración convertida de la unidad del Period a la Unit of time del item (segundos, minutos, horas o días). La fila "Session duration" de la tabla muestra la duración manual en los días de baseline.
- **Duration**: el campo se guarda y se devuelve igual. La gráfica de Duration todavía no lo usa en ningún cálculo, queda para definir con producto.
