with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add TV series fallback function after buildSlugFallbackEmbeds
old = """function buildSlugFallbackEmbeds(slug: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${slug}`,  server: 'VidSrc',  lang: 'Multi', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${slug}`,     server: '2Embed',  lang: 'Multi', quality: 'HD' },
  ];
}"""

new = """function buildSlugFallbackEmbeds(slug: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${slug}`,  server: 'VidSrc',  lang: 'Multi', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${slug}`,     server: '2Embed',  lang: 'Multi', quality: 'HD' },
  ];
}

function buildSeriesFallbackEmbeds(tmdbId: string, season: number, episode: number): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es`,          server: 'VidSrc ES',     lang: 'Espanol', quality: 'HD' },
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es-419`,      server: 'VidSrc Latino', lang: 'Latino',  quality: 'HD' },
    { url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,  server: 'VidSrc.me',     lang: 'Multi',   quality: 'HD' },
    { url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,               server: '2Embed TV',     lang: 'Multi',   quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,     server: 'MultiEmbed',    lang: 'Multi',   quality: 'HD' },
  ];
}"""

if old in content:
    content = content.replace(old, new)
    print("Series fallback function added OK")
else:
    print("WARNING: could not find buildSlugFallbackEmbeds")

# Update the load embeds to use series fallback when isSeries
old2 = "        const allFallbacks = tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug);"
new2 = "        const allFallbacks = isSeries && tid ? buildSeriesFallbackEmbeds(tid, season, episode) : (tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug));"

if old2 in content:
    content = content.replace(old2, new2)
    print("Fallback selection updated OK")
else:
    print("WARNING: could not find allFallbacks line")

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
