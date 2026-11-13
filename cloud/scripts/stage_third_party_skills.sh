#!/usr/bin/env bash
set -Eeuo pipefail
# Solo staging de SKILL.md; sin npm, scripts de terceros ni secretos.
WORK="$RUNNER_TEMP/mask-skills-third-party"
mkdir -p "$WORK/src" "$WORK/out/.claude/skills" "$WORK/out/.agents/skills"
repo() {
 local id="$1" url="$2" pin="$3"
 git clone --quiet --no-checkout --filter=blob:none "https://github.com/$url.git" "$WORK/src/$id"
 git -C "$WORK/src/$id" fetch --quiet --depth 1 origin "$pin"
 git -C "$WORK/src/$id" checkout --quiet --detach "$pin"
 test "$(git -C "$WORK/src/$id" rev-parse HEAD)" = "$pin"
}
stage() {
 local src="$1" expected="$2" count=0
 for file in "$WORK/src/$src/skills/"*/SKILL.md; do
   test -f "$file" || continue
   test ! -L "$file" || exit 22
   test "$(wc -c < "$file")" -le 50000 || exit 23
   local name; name="$(basename "$(dirname "$file")")"
   mkdir -p "$WORK/out/.claude/skills/$name" "$WORK/out/.agents/skills/$name"
   cp "$file" "$WORK/out/.claude/skills/$name/SKILL.md"
   cp "$file" "$WORK/out/.agents/skills/$name/SKILL.md"
   sha256sum "$file" >> "$WORK/out/SKILL_HASHES.txt"
   count=$((count+1))
 done
 test "$count" = "$expected" || { echo "Esperado $expected, recibido $count"; exit 24; }
}
repo yt Jakeschincariol/youtube-agent-skill a2feb2104981a375ffd4f87ee04f4f5344ac43c6
repo remotion remotion-dev/skills 7e541aa4d7361dfaca0780a565a47307eb7bdfbb
repo vercel vercel-labs/skills b716f9dc2ba36b6aa8f0080615e5a3a6caeac63b
stage yt 11
stage remotion 13
f="$WORK/src/vercel/skills/find-skills/SKILL.md"; test -f "$f"
mkdir -p "$WORK/out/.claude/skills/find-skills" "$WORK/out/.agents/skills/find-skills"
cp "$f" "$WORK/out/.claude/skills/find-skills/SKILL.md"
cp "$f" "$WORK/out/.agents/skills/find-skills/SKILL.md"
sha256sum "$f" >> "$WORK/out/SKILL_HASHES.txt"
echo '25 SKILL.md copiadas para auditoria, no ejecutadas ni instaladas globalmente.' > "$WORK/out/ESTADO.txt"
