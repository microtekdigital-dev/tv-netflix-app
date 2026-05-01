import { supabase } from './supabase';
import { Asset, ContentCategory } from '../data/content';

const HOME_SELECT = 'slug,title,year,poster,backdrop,rating,genre,trailer,overview,embeds';

const LUVANA_DOMAINS = ['streamwish', 'goodstream', 'filemoon', 'voe.sx', 'hlswish', 'sbsonic', 'drive.google.com'];

function hasValidEmbeds(m: DbMovie & { embeds?: unknown }): boolean {
  if (!m.embeds) return false;
  const embedsStr = JSON.stringify(m.embeds);
  return LUVANA_DOMAINS.some(d => embedsStr.includes(d));
}

interface DbMovie {
  slug: string;
  title: string;
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genre: string[];
  trailer: string | null;
  overview: string | null;
  embeds?: unknown;
}

function dbMovieToAsset(m: DbMovie): Asset {
  const thumbnail = m.backdrop ?? m.poster ?? `https://picsum.photos/seed/${m.slug}/320/180`;
  return {
    id: m.slug,
    title: m.title,
    description: m.overview ?? '',
    imageUrl: m.backdrop ?? m.poster ?? `https://picsum.photos/seed/${m.slug}/1920/1080`,
    thumbnailUrl: thumbnail,
    year: m.year ? parseInt(m.year, 10) : undefined,
    genre: m.genre?.[0] ?? undefined,
    rating: m.rating ? String(m.rating) : undefined,
    trailerUrl: m.trailer ?? undefined,
    overview: m.overview ?? undefined,
  };
}

export async function fetchHomeCategories(): Promise<ContentCategory[]> {
  const [trending, topRated, recent, action, drama, comedy] = await Promise.all([
    supabase.from('movies').select(HOME_SELECT).gte('rating', 7).order('rating', { ascending: false }).limit(100),
    supabase.from('movies').select(HOME_SELECT).order('rating', { ascending: false }).limit(100),
    supabase.from('movies').select(HOME_SELECT).order('year', { ascending: false }).limit(100),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Acción']).order('rating', { ascending: false }).limit(100),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Drama']).order('rating', { ascending: false }).limit(100),
    supabase.from('movies').select(HOME_SELECT).contains('genre', ['Comedia']).order('rating', { ascending: false }).limit(100),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter = (data: any[]) => (data ?? []).filter(hasValidEmbeds).slice(0, 20);

  const categories: ContentCategory[] = [];

  if (trending.data?.length) {
    const filtered = filter(trending.data);
    if (filtered.length) categories.push({ id: 'trending', title: 'Tendencias', assets: filtered.map(dbMovieToAsset) });
  }
  if (topRated.data?.length) {
    const filtered = filter(topRated.data);
    if (filtered.length) categories.push({ id: 'top-rated', title: 'Mejor Valoradas', assets: filtered.map(dbMovieToAsset) });
  }
  if (recent.data?.length) {
    const filtered = filter(recent.data);
    if (filtered.length) categories.push({ id: 'recent', title: 'Recientes', assets: filtered.map(dbMovieToAsset) });
  }
  if (action.data?.length) {
    const filtered = filter(action.data);
    if (filtered.length) categories.push({ id: 'action', title: 'Acción', assets: filtered.map(dbMovieToAsset) });
  }
  if (drama.data?.length) {
    const filtered = filter(drama.data);
    if (filtered.length) categories.push({ id: 'drama', title: 'Drama', assets: filtered.map(dbMovieToAsset) });
  }
  if (comedy.data?.length) {
    const filtered = filter(comedy.data);
    if (filtered.length) categories.push({ id: 'comedy', title: 'Comedia', assets: filtered.map(dbMovieToAsset) });
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
    .limit(100);

  if (error || !data?.length) return [];
  const filtered = data.filter(hasValidEmbeds).slice(0, 40);
  if (!filtered.length) return [];
  return [{ id: 'search-results', title: `Resultados para "${query}"`, assets: filtered.map(dbMovieToAsset) }];
}

// ── Series ────────────────────────────────────────────────────────────────────

const SERIES_SELECT = 'slug,title,year,poster,backdrop,rating,genre,seasons,status,trailer,overview';

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
  trailer?: string | null;
  overview?: string | null;
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
    isSeries: true,
    tmdbId: s.tmdb_id ?? undefined,
    totalSeasons: s.seasons ?? 1,
    trailerUrl: s.trailer ?? undefined,
    overview: s.overview ?? undefined,
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

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function fetchMyList(): Promise<Asset[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('favorites') as any)
    .select('movie_slug')
    .eq('user_id', session.user.id);

  if (!data?.length) return [];
  const slugs: string[] = data.map((f: { movie_slug: string }) => f.movie_slug);

  const { data: movies } = await supabase
    .from('movies')
    .select(HOME_SELECT)
    .in('slug', slugs);

  return (movies ?? []).map(dbMovieToAsset);
}

export async function addToMyList(slug: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('favorites') as any).upsert({
    user_id: session.user.id,
    movie_slug: slug,
  });
}

export async function removeFromMyList(slug: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('favorites') as any)
    .delete()
    .eq('user_id', session.user.id)
    .eq('movie_slug', slug);
}

export async function isInMyList(slug: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('favorites') as any)
    .select('id')
    .eq('user_id', session.user.id)
    .eq('movie_slug', slug)
    .single();
  return !!data;
}
