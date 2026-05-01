import { supabase } from './supabase';

export interface WatchProgress {
  id?: string;
  user_id: string;
  slug: string;
  content_type: 'movie' | 'series';
  season?: number;
  episode?: number;
  updated_at: string; // ISO 8601
  completed: boolean;
}

const CACHE_KEY_PREFIX = 'watch_progress_';

function cacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

/**
 * Lee el caché local de localStorage para un usuario.
 * Retorna [] si no existe o si ocurre algún error.
 */
export function readLocalCache(userId: string): WatchProgress[] {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as WatchProgress[];
  } catch {
    return [];
  }
}

/**
 * Escribe el caché local en localStorage para un usuario.
 * Silencia cualquier error (p.ej. modo privado sin localStorage).
 */
export function writeLocalCache(userId: string, items: WatchProgress[]): void {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(items));
  } catch {
    // silenciar errores de localStorage
  }
}

/**
 * Guarda o actualiza el progreso de reproducción de un contenido.
 * Hace upsert en Supabase con onConflict 'user_id,slug' y escribe en localStorage.
 * Si user_id está vacío, retorna sin error.
 */
export async function saveProgress(
  progress: Omit<WatchProgress, 'id' | 'updated_at'>
): Promise<void> {
  if (!progress.user_id) return;

  const record: Omit<WatchProgress, 'id'> = {
    ...progress,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('watch_progress')
      .upsert(record, { onConflict: 'user_id,slug' });

    if (error) {
      console.error('[ContinueWatching] Error al guardar progreso en Supabase:', error);
    }
  } catch (err) {
    console.error('[ContinueWatching] Error de red al guardar progreso:', err);
  }

  // Actualizar caché local independientemente del resultado de Supabase
  const cached = readLocalCache(progress.user_id);
  const idx = cached.findIndex((item) => item.slug === progress.slug);
  if (idx >= 0) {
    cached[idx] = { ...cached[idx], ...record };
  } else {
    cached.push(record);
  }
  writeLocalCache(progress.user_id, cached);
}

/**
 * Elimina el progreso de un contenido para un usuario.
 * Elimina de Supabase y actualiza el caché localStorage.
 */
export async function deleteProgress(userId: string, slug: string): Promise<void> {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('watch_progress')
      .delete()
      .eq('user_id', userId)
      .eq('slug', slug);

    if (error) {
      console.error('[ContinueWatching] Error al eliminar progreso en Supabase:', error);
    }
  } catch (err) {
    console.error('[ContinueWatching] Error de red al eliminar progreso:', err);
  }

  // Actualizar caché local
  const cached = readLocalCache(userId);
  const updated = cached.filter((item) => item.slug !== slug);
  writeLocalCache(userId, updated);
}

/**
 * Carga todos los registros en progreso (completed: false) del usuario desde Supabase,
 * ordenados por updated_at descendente. Sincroniza el localStorage con los datos remotos.
 */
export async function loadProgress(userId: string): Promise<WatchProgress[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('watch_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ContinueWatching] Error al cargar progreso desde Supabase:', error);
      // Retornar caché local como fallback
      return readLocalCache(userId);
    }

    const records = (data ?? []) as WatchProgress[];

    // Sincronizar localStorage con los datos remotos
    writeLocalCache(userId, records);

    return records;
  } catch (err) {
    console.error('[ContinueWatching] Error de red al cargar progreso:', err);
    return readLocalCache(userId);
  }
}
