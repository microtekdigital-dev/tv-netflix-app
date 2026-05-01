# Documento de Requisitos: Continuar Viendo

## Introducción

Esta funcionalidad permite a los usuarios retomar el contenido que estaban viendo desde donde lo dejaron. El sistema registra automáticamente el progreso de reproducción (película o serie) y muestra una fila "Continuar Viendo" en la pantalla principal. Para series, se recuerda la temporada y el episodio; para películas, se marca el contenido como "en progreso". El botón de reproducción en el HeroBanner cambia a "Continuar" cuando existe progreso guardado. El usuario también puede eliminar elementos del historial.

## Glosario

- **WatchProgress**: Registro en Supabase que almacena el progreso de reproducción de un usuario para un contenido específico.
- **ContinueWatchingService**: Módulo de la aplicación responsable de leer y escribir registros de WatchProgress en Supabase.
- **ContinueWatchingRow**: Componente de fila en la pantalla principal que muestra los contenidos en progreso del usuario.
- **HeroBanner**: Componente de banner principal que muestra el contenido destacado con botones de acción.
- **PlayerScreen**: Componente que gestiona la reproducción de contenido mediante iframes embebidos.
- **Asset**: Objeto que representa una película o serie en la aplicación.
- **Slug**: Identificador único de texto de una película o serie en la base de datos.
- **Usuario**: Persona autenticada en la aplicación mediante Supabase Auth.

---

## Requisitos

### Requisito 1: Guardar progreso al iniciar reproducción

**Historia de usuario:** Como usuario, quiero que el sistema registre automáticamente qué contenido estoy viendo, para poder retomarlo más tarde desde donde lo dejé.

#### Criterios de aceptación

1. WHEN un usuario inicia la reproducción de una película, THE ContinueWatchingService SHALL crear o actualizar un registro WatchProgress con el `slug`, `content_type: 'movie'`, `updated_at` y `completed: false`.
2. WHEN un usuario inicia la reproducción de una serie, THE ContinueWatchingService SHALL crear o actualizar un registro WatchProgress con el `slug`, `content_type: 'series'`, `season`, `episode`, `updated_at` y `completed: false`.
3. WHEN un usuario cambia de temporada o episodio durante la reproducción de una serie, THE ContinueWatchingService SHALL actualizar el registro WatchProgress con la nueva `season` y `episode`.
4. THE ContinueWatchingService SHALL asociar cada registro WatchProgress al `user_id` del usuario autenticado en Supabase.
5. IF el usuario no está autenticado, THEN THE ContinueWatchingService SHALL omitir la operación de guardado sin lanzar un error.

---

### Requisito 2: Mostrar fila "Continuar Viendo"

**Historia de usuario:** Como usuario, quiero ver una fila "Continuar Viendo" en la pantalla principal con los contenidos que tengo en progreso, para acceder rápidamente a ellos.

#### Criterios de aceptación

1. WHEN el usuario navega a la pantalla principal, THE ContinueWatchingRow SHALL mostrar los contenidos con registros WatchProgress donde `completed` es `false`, ordenados por `updated_at` descendente.
2. WHEN no existen registros WatchProgress para el usuario, THE ContinueWatchingRow SHALL ocultarse completamente de la pantalla principal.
3. THE ContinueWatchingRow SHALL aparecer como la primera fila de contenido en la pantalla principal, por encima de las demás categorías.
4. WHEN un Asset en la ContinueWatchingRow es una serie, THE ContinueWatchingRow SHALL mostrar en la tarjeta la temporada y episodio guardados (ej. "T2:E5").
5. WHEN un Asset en la ContinueWatchingRow es una película, THE ContinueWatchingRow SHALL mostrar en la tarjeta el indicador "En progreso".

---

### Requisito 3: Botón "Continuar" en el HeroBanner

**Historia de usuario:** Como usuario, quiero que el botón de reproducción del HeroBanner diga "Continuar" cuando tengo progreso guardado para ese contenido, para saber que puedo retomarlo.

#### Criterios de aceptación

1. WHEN el HeroBanner muestra un Asset que tiene un registro WatchProgress con `completed: false`, THE HeroBanner SHALL mostrar el texto "Continuar" en el botón de reproducción.
2. WHEN el HeroBanner muestra un Asset de tipo serie con progreso guardado, THE HeroBanner SHALL mostrar el texto "Continuar T{season}:E{episode}" en el botón de reproducción.
3. WHEN el HeroBanner muestra un Asset sin registro WatchProgress, THE HeroBanner SHALL mostrar el texto original ("Reproducir" para películas, "Ver T1:E1" para series).
4. WHEN el usuario presiona el botón "Continuar" en el HeroBanner para una serie, THE HeroBanner SHALL iniciar la reproducción directamente en la temporada y episodio guardados.

---

### Requisito 4: Reanudar reproducción desde el progreso guardado

**Historia de usuario:** Como usuario, quiero que al presionar "Continuar" en un contenido de la fila "Continuar Viendo", la reproducción comience en el punto donde la dejé.

#### Criterios de aceptación

1. WHEN un usuario selecciona un Asset de la ContinueWatchingRow que es una serie, THE PlayerScreen SHALL iniciar la reproducción en la `season` y `episode` almacenadas en el registro WatchProgress.
2. WHEN un usuario selecciona un Asset de la ContinueWatchingRow que es una película, THE PlayerScreen SHALL iniciar la reproducción normalmente (sin tiempo de inicio, ya que los iframes no permiten control de tiempo).
3. WHEN un usuario selecciona un Asset de la ContinueWatchingRow, THE ContinueWatchingService SHALL actualizar el campo `updated_at` del registro WatchProgress correspondiente.

---

### Requisito 5: Eliminar elementos del historial

**Historia de usuario:** Como usuario, quiero poder eliminar elementos de la fila "Continuar Viendo", para mantener mi historial limpio y relevante.

#### Criterios de aceptación

1. WHEN el usuario enfoca una tarjeta en la ContinueWatchingRow y presiona el botón de eliminar (tecla de menú o botón dedicado), THE ContinueWatchingRow SHALL mostrar una opción de confirmación para eliminar el elemento.
2. WHEN el usuario confirma la eliminación, THE ContinueWatchingService SHALL eliminar el registro WatchProgress correspondiente de Supabase.
3. WHEN el registro WatchProgress es eliminado, THE ContinueWatchingRow SHALL actualizar su lista de contenidos eliminando el elemento sin recargar la página.
4. IF tras la eliminación no quedan registros WatchProgress para el usuario, THEN THE ContinueWatchingRow SHALL ocultarse de la pantalla principal.

---

### Requisito 6: Persistencia y sincronización con Supabase

**Historia de usuario:** Como usuario, quiero que mi progreso se guarde en la nube, para poder continuar viendo desde cualquier dispositivo con mi cuenta.

#### Criterios de aceptación

1. THE ContinueWatchingService SHALL almacenar los registros WatchProgress en una tabla `watch_progress` de Supabase con las columnas: `id`, `user_id`, `slug`, `content_type`, `season`, `episode`, `updated_at`, `completed`.
2. THE ContinueWatchingService SHALL usar `upsert` con la restricción única `(user_id, slug)` para evitar registros duplicados.
3. WHEN se realiza una operación de escritura en Supabase y ocurre un error de red, THE ContinueWatchingService SHALL registrar el error en consola y continuar la ejecución sin interrumpir la experiencia del usuario.
4. WHEN el usuario inicia sesión, THE ContinueWatchingService SHALL cargar los registros WatchProgress existentes del usuario desde Supabase.
