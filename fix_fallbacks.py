with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Only show extra fallback servers when there are NO DB embeds
# Change: always show extras
# To: only show extras when dbEmbeds is empty
old = """        const allFallbacks = isSeries && tid ? buildSeriesFallbackEmbeds(tid, season, episode) : (tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug));
        const dbUrls = new Set(embeds.map((e: Embed) => e.url));
        setExtraEmbeds(allFallbacks.filter((e: Embed) => !dbUrls.has(e.url)));"""

new = """        // Only show fallback servers when there are no DB embeds
        if (embeds.length === 0) {
          const allFallbacks = isSeries && tid ? buildSeriesFallbackEmbeds(tid, season, episode) : (tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug));
          setExtraEmbeds(allFallbacks);
        } else {
          setExtraEmbeds([]);
        }"""

if old in content:
    content = content.replace(old, new)
    print("Fallback logic updated OK")
else:
    print("WARNING: could not find fallback logic")

# Also update the series recalculation effect
old2 = """    const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
    const dbUrls = new Set(dbEmbeds.map((e: Embed) => e.url));
    setExtraEmbeds(newFallbacks.filter((e: Embed) => !dbUrls.has(e.url)));"""

new2 = """    // Only show fallback servers when there are no DB embeds
    if (dbEmbeds.length === 0) {
      const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
      setExtraEmbeds(newFallbacks);
    }"""

if old2 in content:
    content = content.replace(old2, new2)
    print("Series recalc updated OK")
else:
    print("WARNING: could not find series recalc")

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
