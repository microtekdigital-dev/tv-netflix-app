# Plan de Implementación: Continuar Viendo

## Visión General

Implementación incremental de la funcionalidad "Continuar Viendo" para la app de TV. Cada tarea construye sobre la anterior, comenzando por el servicio de datos, luego los componentes de UI, y finalmente la integración en App.tsx.

## Tareas

- [x] 1. Crear el tipo `WatchProgress` y el servicio `ContinueWatchingService`
  - Crear `src/lib/continueWatching.ts` con la interfaz `WatchProgress` y las funciones `saveProgress`, `deleteProgress`, `loadProgress`, `readLocalCache`, `writeLocalCache`
  - Implementar `saveProgress` con upsert de Supabase (`onConflict: 'user_id,slug'`) y escritura en localStorage bajo la clave `watch_progress_{userId}`
  - Implementar `deleteProgress` que elimina de Supabase y actualiza el caché local
  - Implementar `loadProgress` que lee de Supabase y sincroniza localStorage
  - Implementar `readLocalCache` y `writeLocalCache` con `try/catch` para entornos sin localStorage
  - Manejar el caso de usuario no autenticado retornando sin error
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.1 Escribir property tests para `ContinueWatchingService`
    - **Property 1: Guardar progreso crea un registro con campos correctos**
    - **Property 2: Actualizar progreso de episodio refleja los nuevos valores**
    - **Property 3: Upsert es idempotente por (user_id, slug)**
    - **Property 4: Sincronización localStorage refleja datos remotos**
    - Archivo: `src/__tests__/continuewatching.service.pbt.test.ts`
    - Mockear Supabase con `jest.mock('../../lib/supabase')`
    - Mockear localStorage con `jest.spyOn(Storage.prototype, 'setItem')`
    - Mínimo 100 iteraciones por propiedad con fast-check
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 6.2, 6.5_

- [x] 2. Crear el componente `ContinueWatchingCard`
  - Crear `src/components/ContinueWatchingRow/ContinueWatchingCard.tsx`
  - Usar `useFocusable` con `onEnterPress` que invoca `onPlay(asset, progress)`
  - Agregar overlay de indicador de progreso: badge `"T{season}:E{episode}"` para series, `"En progreso"` para películas
  - Agregar manejo de tecla de menú (keyCode 18) para mostrar overlay de confirmación de eliminación
  - Implementar overlay de confirmación con botones "Sí, eliminar" / "Cancelar"
  - Aplicar estilos de foco consistentes con `AssetCard` (borde blanco 3px, `scale(1.06)`)
  - _Requirements: 2.4, 2.5, 2.7, 4.4, 5.1, 5.2, 5.5_

  - [ ]* 2.1 Escribir property tests para `ContinueWatchingCard`
    - **Property 6: ContinueWatchingCard muestra el indicador correcto según tipo**
    - **Property 8: Seleccionar tarjeta de serie pasa los parámetros correctos de progreso**
    - **Property 10: ContinueWatchingCard con foco tiene estilos visuales distintos**
    - Archivo: `src/__tests__/continuewatching.card.pbt.test.tsx`
    - Mockear `useFocusable` para controlar el estado `focused`
    - _Requirements: 2.4, 2.5, 2.7, 4.1, 4.4_

- [x] 3. Crear el componente `ContinueWatchingRow`
  - Crear `src/components/ContinueWatchingRow/ContinueWatchingRow.tsx`
  - Usar `useFocusable` + `FocusContext` igual que `ContentRow`
  - Retornar `null` cuando `items.length === 0`
  - Renderizar `ContinueWatchingCard` por cada item, filtrando los que no tienen Asset en `assetsMap`
  - Implementar scroll horizontal con `tvScrollTo` al enfocar una tarjeta
  - Mostrar título de sección "Continuar Viendo" con el mismo estilo que `RowTitle` en `ContentRow`
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 5.3, 5.4_

  - [ ]* 3.1 Escribir property tests para `ContinueWatchingRow`
    - **Property 5: ContinueWatchingRow filtra y ordena correctamente**
    - **Property 9: Eliminar un registro reduce la lista en exactamente uno**
    - Archivo: `src/__tests__/continuewatching.row.pbt.test.tsx`
    - Generar listas aleatorias de WatchProgress con mezcla de `completed: true/false`
    - _Requirements: 2.1, 5.3_

- [x] 4. Checkpoint — Verificar que todos los tests pasan
  - Asegurarse de que todos los tests pasan, consultar al usuario si surgen dudas.

- [x] 5. Modificar `HeroBanner` para mostrar el botón "Continuar"
  - Agregar la prop `watchProgressMap?: Map<string, WatchProgress>` a `HeroBannerProps`
  - Calcular `playLabel` basado en el progreso del `displayAsset` en el `watchProgressMap`
  - Lógica: sin progreso + película → `"▶ Reproducir"`, sin progreso + serie → `"▶ Ver T1:E1"`, con progreso + película → `"▶ Continuar"`, con progreso + serie → `"▶ Continuar T{season}:E{episode}"`
  - Usar el `playLabel` calculado en el `PlayButton`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.1 Escribir property tests para HeroBanner con progreso
    - **Property 7: Texto del botón HeroBanner es correcto según estado de progreso**
    - Archivo: `src/__tests__/herobanner.continuewatching.pbt.test.tsx`
    - Generar assets aleatorios con y sin progreso en el `watchProgressMap`
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Integrar todo en `App.tsx`
  - [x] 6.1 Agregar estado `watchProgressMap` y carga inicial
    - Agregar `const [watchProgressMap, setWatchProgressMap] = useState<Map<string, WatchProgress>>(new Map())`
    - En el `useEffect` de login, llamar `loadProgress(user.id)` y poblar el `watchProgressMap`
    - Leer `readLocalCache(user.id)` para mostrar datos inmediatamente antes de que Supabase responda
    - _Requirements: 6.4, 6.5_

  - [x] 6.2 Implementar `onSaveProgress` y conectarlo a `onSelectServer`
    - Crear el callback `onSaveProgress(asset, season?, episode?)` que llama a `saveProgress` y actualiza `watchProgressMap`
    - Llamar `onSaveProgress` desde `onSelectServer` (al iniciar reproducción) pasando el asset y season/episode actuales
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 6.3 Implementar `onDeleteProgress` y conectarlo a `ContinueWatchingRow`
    - Crear el callback `onDeleteProgress(slug)` que llama a `deleteProgress` y actualiza `watchProgressMap`
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 6.4 Renderizar `ContinueWatchingRow` como primera fila y pasar `watchProgressMap` a `HeroBanner`
    - Importar y renderizar `ContinueWatchingRow` antes del `activeCategories.map(...)` en `ScrollingRows`
    - Construir `assetsMap` a partir de todas las categorías activas para pasarlo a `ContinueWatchingRow`
    - Pasar `watchProgressMap` a `HeroBanner`
    - Modificar `onPlayPress` en `HeroBanner` para que use el progreso guardado al iniciar reproducción de una serie
    - _Requirements: 2.3, 3.4, 4.1, 4.2, 4.3_

- [x] 7. Checkpoint final — Verificar integración completa
  - Asegurarse de que todos los tests pasan, consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los property tests usan fast-check con mínimo 100 iteraciones
- El esquema SQL de la tabla `watch_progress` debe crearse manualmente en Supabase antes de ejecutar las tareas 6.x
