with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add a useEffect to recalculate series embeds when season/episode changes
old = "  // ── Load embeds ────────────────────────────────────────────────────────────"
new = """  // ── Recalculate series embeds when season/episode changes ──────────────────
  useEffect(() => {
    if (!isSeries || !seriesTmdbId) return;
    const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
    const dbUrls = new Set(dbEmbeds.map((e: Embed) => e.url));
    setExtraEmbeds(newFallbacks.filter((e: Embed) => !dbUrls.has(e.url)));
    setCurrentSource(dbEmbeds.length > 0 ? 'db' : 'extra');
    setCurrentIndex(0);
  }, [season, episode, seriesTmdbId, isSeries]);

  // ── Load embeds ────────────────────────────────────────────────────────────"""

if old in content:
    content = content.replace(old, new)
    print("Season/episode recalculation effect added OK")
else:
    print("WARNING: could not find load embeds comment")

# 2. Show controls immediately for series (don't auto-hide when series selector is visible)
# Change HIDE_DELAY to be longer for series
old2 = "const HIDE_DELAY = 4000;"
new2 = "const HIDE_DELAY = 4000;\nconst SERIES_HIDE_DELAY = 8000; // longer delay for series to allow season/episode selection"
if old2 in content:
    content = content.replace(old2, new2)
    print("Series hide delay added OK")

# 3. Use longer delay for series
old3 = "    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);"
new3 = "    hideTimerRef.current = setTimeout(() => setControlsVisible(false), isSeries ? SERIES_HIDE_DELAY : HIDE_DELAY);"
if old3 in content:
    content = content.replace(old3, new3)
    print("Series delay applied OK")
else:
    print("WARNING: could not find setTimeout line")

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
