import { supabase } from './supabase';
import { Asset, ContentCategory } from '../data/content';

const HOME_SELECT = 'slug,title,year,poster,backdrop,rating,genre';

interface DbMovie {
  slug: string;
  title: string;
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genre: string[];
}

function dbMovieToAsset(m: DbMovie): Asset {
  // Use backdrop for card thumbnails (16:9 ratio matches card shape)
  // Fall back to poster, then placeholder
  const thumbnail = m.backdrop ?? m.poster ?? `https://picsum.photos/seed/${m.slug}/320/180`;
  return {
    id: m.slug,
    title: m.title,
    description: '',
    imageUrl: m.backdrop ?? m.poster ?? `https://picsum.photos/seed/${m.slug}/1920/1080`,
    thumbnailUrl: thumbnail,
    year: m.year ? parseInt(m.year, 10) : undefined,
    genre: m.genre?.[0] ?? undefined,
    rating: m.rating ? String(m.rating) : undefined,
  };
}

export async function fetchHomeCategories(): Promise<ContentCategory[]> {
  const [trending, topRated, recent, action, drama, comedy] = await Promise.all([
    supabase.from('movies').select(HOME_SELECT).gte('rating', 7).order('rating', { ascending: false }).limit(20),
    supabase.from('movies').select(HOME_SELECT).order('rating', { ascending: false }).limit(20),
    supabase.from('movies').select(HOME_SELECT).order('year', { ascending: false }).limit(20),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Acción']).order('rating', { ascending: false }).limit(20),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Drama']).order('rating', { ascending: false }).limit(20),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Comedia']).order('rating', { ascending: false }).limit(20),
  ]);

  const categories: ContentCategory[] = [];

  if (trending.data?.length) {
    categories.push({ id: 'trending', title: 'Tendencias', assets: trending.data.map(dbMovieToAsset) });
  }
  if (topRated.data?.length) {
    categories.push({ id: 'top-rated', title: 'Mejor Valoradas', assets: topRated.data.map(dbMovieToAsset) });
  }
  if (recent.data?.length) {
    categories.push({ id: 'recent', title: 'Recientes', assets: recent.data.map(dbMovieToAsset) });
  }
  if (action.data?.length) {
    categories.push({ id: 'action', title: 'Acción', assets: action.data.map(dbMovieToAsset) });
  }
  if (drama.data?.length) {
    categories.push({ id: 'drama', title: 'Drama', assets: drama.data.map(dbMovieToAsset) });
  }
  if (comedy.data?.length) {
    categories.push({ id: 'comedy', title: 'Comedia', assets: comedy.data.map(dbMovieToAsset) });
  }

  return categories;
}

export async function fetchMovieDetail(slug: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('slug,title,year,poster,backdrop,rating,genre,overview')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.slug,
    title: data.title,
    description: data.overview ?? '',
    imageUrl: data.backdrop ?? data.poster ?? `https://picsum.photos/seed/${data.slug}/1920/1080`,
    thumbnailUrl: data.poster ?? `https://picsum.photos/seed/${data.slug}/300/170`,
    year: data.year ? parseInt(data.year, 10) : undefined,
    genre: data.genre?.[0] ?? undefined,
    rating: data.rating ? String(data.rating) : undefined,
  };
}

export async function searchMovies(query: string): Promise<ContentCategory[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('movies')
    .select(HOME_SELECT)
    .ilike('title', `%${query}%`)
    .order('rating', { ascending: false })
    .limit(40);

  if (error || !data?.length) return [];

  return [{ id: 'search-results', title: `Resultados para "${query}"`, assets: data.map(dbMovieToAsset) }];
}

// ── Series ────────────────────────────────────────────────────────────────────

const SERIES_SELECT = 'slug,title,year,poster,backdrop,rating,genre,seasons,status';

interface DbSerie {
  slug: string;
  title: string;
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genre: string[];
  seasons?: number;
  status?: string | null;
}

function dbSerieToAsset(s: DbSerie): Asset {
  const thumbnail = s.backdrop ?? s.poster ?? `https://picsum.photos/seed/${s.slug}/320/180`;
  const meta = [s.seasons ? `${s.seasons} temp.` : null, s.status].filter(Boolean).join(' · ');
  return {
    id: s.slug,
    title: s.title,
    description: meta,
    imageUrl: s.backdrop ?? s.poster ?? `https://picsum.photos/seed/${s.slug}/1920/1080`,
    thumbnailUrl: thumbnail,
    year: s.year ? parseInt(s.year, 10) : undefined,
    genre: s.genre?.[0] ?? undefined,
    rating: s.rating ? String(s.rating) : undefined,
  };
}

export async function fetchSeriesCategories(): Promise<ContentCategory[]> {
  const [topRated, recent, action, drama, comedy, scifi] = await Promise.all([
    supabase.from('series').select(SERIES_SELECT).order('rating', { ascending: false }).limit(20),
    supabase.from('series').select(SERIES_SELECT).order('year', { ascending: false }).limit(20),
    supabase.from('series').select(SERIES_SELECT).contains('genre', ['Acción']).order('rating', { ascending: false }).limit(20),
    supabase.from('series').select(SERIES_SELECT).contains('genre', ['Drama']).order('rating', { ascending: false }).limit(20),
    supabase.from('series').select(SERIES_SELECT).contains('genre', ['Comedia']).order('rating', { ascending: false }).limit(20),
    supabase.from('series').select(SERIES_SELECT).contains('genre', ['Ciencia ficción']).order('rating', { ascending: false }).limit(20),
  ]);

  const categories: ContentCategory[] = [];
  if (topRated.data?.length)  categories.push({ id: 'series-top',    title: 'Mejor Valoradas',  assets: topRated.data.map(dbSerieToAsset) });
  if (recent.data?.length)    categories.push({ id: 'series-recent', title: 'Recientes',         assets: recent.data.map(dbSerieToAsset) });
  if (action.data?.length)    categories.push({ id: 'series-action', title: 'Acción',            assets: action.data.map(dbSerieToAsset) });
  if (drama.data?.length)     categories.push({ id: 'series-drama',  title: 'Drama',             assets: drama.data.map(dbSerieToAsset) });
  if (comedy.data?.length)    categories.push({ id: 'series-comedy', title: 'Comedia',           assets: comedy.data.map(dbSerieToAsset) });
  if (scifi.data?.length)     categories.push({ id: 'series-scifi',  title: 'Ciencia Ficción',   assets: scifi.data.map(dbSerieToAsset) });
  return categories;
}

export async function searchSeries(query: string): Promise<ContentCategory[]> {
  if (!query.trim()) return [];
  const { data } = await supabase
    .from('series')
    .select(SERIES_SELECT)
    .ilike('title', `%${query}%`)
    .order('rating', { ascending: false })
    .limit(40);
  if (!data?.length) return [];
  return [{ id: 'series-search', title: `Series: "${query}"`, assets: data.map(dbSerieToAsset) }];
}
