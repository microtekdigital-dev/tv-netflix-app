import re

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isSeries to interface
content = content.replace(
    '  title: string;\n  onClose: () => void;',
    '  title: string;\n  isSeries?: boolean;\n  onClose: () => void;'
)

# 2. Update function signature
content = content.replace(
    'function PlayerScreen({ slug, title, onClose }: PlayerScreenProps)',
    'function PlayerScreen({ slug, title, isSeries = false, onClose }: PlayerScreenProps)'
)

# 3. Add series state after hideTimerRef
content = content.replace(
    '  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);',
    '  const [season, setSeason] = useState(1);\n  const [episode, setEpisode] = useState(1);\n  const [totalSeasons, setTotalSeasons] = useState(1);\n  const [seriesTmdbId, setSeriesTmdbId] = useState<string | null>(null);\n  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);'
)

# 4. Update load embeds useEffect - change table query
old_query = "    supabase.from('movies').select('embeds').eq('slug', slug).single()\n      .then(({ data }) => {\n        const embeds: Embed[] = data?.embeds ?? [];\n        setDbEmbeds(embeds);\n        const tmdbId = extractTmdbId(embeds);\n        const allFallbacks = tmdbId ? buildFallbackEmbeds(tmdbId) : buildSlugFallbackEmbeds(slug);\n        const dbUrls = new Set(embeds.map((e: Embed) => e.url));\n        setExtraEmbeds(allFallbacks.filter((e: Embed) => !dbUrls.has(e.url)));\n        setCurrentSource(embeds.length > 0 ? 'db' : 'extra');\n        setCurrentIndex(0);\n        setFocusedBtn({ source: 'back', index: 0 });\n        setLoading(false);\n      });"

new_query = """    const table = isSeries ? 'series' : 'movies';
    const fields = isSeries ? 'embeds,tmdb_id,seasons' : 'embeds';
    supabase.from(table).select(fields).eq('slug', slug).single()
      .then(({ data }) => {
        const embeds: Embed[] = data?.embeds ?? [];
        const tid = isSeries && data?.tmdb_id ? String(data.tmdb_id) : extractTmdbId(embeds);
        if (isSeries && data?.seasons) setTotalSeasons(data.seasons);
        if (tid) setSeriesTmdbId(tid);
        setDbEmbeds(embeds);
        const allFallbacks = tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug);
        const dbUrls = new Set(embeds.map((e: Embed) => e.url));
        setExtraEmbeds(allFallbacks.filter((e: Embed) => !dbUrls.has(e.url)));
        setCurrentSource(embeds.length > 0 ? 'db' : 'extra');
        setCurrentIndex(0);
        setFocusedBtn({ source: 'back', index: 0 });
        setLoading(false);
      });"""

if old_query in content:
    content = content.replace(old_query, new_query)
    print("Query replaced OK")
else:
    print("WARNING: old query not found - checking line endings")
    old_query_lf = old_query.replace('\n', '\r\n')
    if old_query_lf in content:
        content = content.replace(old_query_lf, new_query)
        print("Query replaced OK (CRLF)")
    else:
        print("ERROR: could not find query to replace")

# 5. Add season/episode selector in the BottomBar for series
# Insert before the existing ServerSection for dbEmbeds
old_bottom = "          <BottomBar>\n            {dbEmbeds.length > 0 && ("
new_bottom = """          <BottomBar>
            {isSeries && (
              <ServerSection>
                <SectionLabel>Temporada / Episodio</SectionLabel>
                <ButtonRow>
                  {Array.from({length: totalSeasons}, (_, i) => i + 1).map(s => (
                    <ServerBtn key={`s${s}`} active={season === s} highlighted={false}
                      onClick={() => { setSeason(s); setEpisode(1); }}>
                      T{s}
                    </ServerBtn>
                  ))}
                </ButtonRow>
                <ButtonRow style={{marginTop: '8px'}}>
                  {Array.from({length: 20}, (_, i) => i + 1).map(ep => (
                    <ServerBtn key={`ep${ep}`} active={episode === ep} highlighted={false}
                      onClick={() => setEpisode(ep)}>
                      E{ep}
                    </ServerBtn>
                  ))}
                </ButtonRow>
              </ServerSection>
            )}
            {dbEmbeds.length > 0 && ("""

if old_bottom in content:
    content = content.replace(old_bottom, new_bottom)
    print("Season/episode selector added OK")
else:
    print("WARNING: BottomBar insertion point not found")

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
