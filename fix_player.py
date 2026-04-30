with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove duplicate state declarations
# Keep only the FIRST occurrence of each state
seen_states = set()
result = []
skip_patterns = ['const [season,', 'const [episode,', 'const [totalSeasons,', 'const [seriesTmdbId,']

for line in lines:
    stripped = line.strip()
    is_dup = False
    for pat in skip_patterns:
        if pat in stripped:
            if pat in seen_states:
                is_dup = True
                break
            else:
                seen_states.add(pat)
    if not is_dup:
        result.append(line)

with open('src/components/PlayerScreen/PlayerScreen.tsx', 'w', encoding='utf-8') as f:
    f.writelines(result)

print(f"Done. Lines: {len(result)}")

# Verify
with open('src/components/PlayerScreen/PlayerScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for pat in ['season', 'episode', 'totalSeasons', 'seriesTmdbId']:
    count = content.count(f'const [{pat},')
    print(f"  {pat}: {count} declaration(s)")
