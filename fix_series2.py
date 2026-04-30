with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# For series: always show fallback servers (with season/episode params)
# DB embeds are episode-specific and don't support season/episode selection
old = """        // Only show fallback servers when there are no DB embeds
        if (embeds.length === 0) {
          const allFallbacks = isSeries && tid ? buildSeriesFallbackEmbeds(tid, season, episode) : (tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug));
          setExtraEmbeds(allFallbacks);
        } else {
          setExtraEmbeds([]);
        }"""

new = """        // For series: always show fallback servers with season/episode params
        // For movies: only show fallbacks when no DB embeds
        if (isSeries && tid) {
          setExtraEmbeds(buildSeriesFallbackEmbeds(tid, season, episode));
        } else if (embeds.length === 0) {
          const allFallbacks = tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug);
          setExtraEmbeds(allFallbacks);
        } else {
          setExtraEmbeds([]);
        }"""

if old in content:
    content = content.replace(old, new)
    print("Series always-show-fallbacks updated OK")
else:
    print("WARNING: could not find fallback logic")

# Also update the series recalculation effect to always recalculate
old2 = """    // Only show fallback servers when there are no DB embeds
    if (dbEmbeds.length === 0) {
      const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
      setExtraEmbeds(newFallbacks);
    }"""

new2 = """    // Always recalculate series fallbacks with new season/episode
    const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
    setExtraEmbeds(newFallbacks);"""

if old2 in content:
    content = content.replace(old2, new2)
    print("Series recalc always-update OK")
else:
    print("WARNING: could not find series recalc")

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
