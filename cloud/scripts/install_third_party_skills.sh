#!/usr/bin/env bash
set -Eeuo pipefail
# MASK GROUP. Instalacion de instrucciones estaticas, nunca ejecucion de scripts ajenos.
cd "$GITHUB_WORKSPACE"
test "${GITHUB_REF_NAME}" = "main" || { echo "RAMA_NO_AUTORIZADA"; exit 11; }
WORK="${RUNNER_TEMP}/mask-skills-install"
mkdir -p "$WORK"
repo() {
  local id="$1" url="$2" sha="$3"
  git clone --quiet --no-checkout --filter=blob:none "https://github.com/$url.git" "$WORK/$id"
  git -C "$WORK/$id" fetch --quiet --depth 1 origin "$sha"
  git -C "$WORK/$id" checkout --quiet --detach "$sha"
  test "$(git -C "$WORK/$id" rev-parse HEAD)" = "$sha"
}
copy_skill() {
 local from="$1" name="$2" src="$WORK/$from/skills/$name"
 test -f "$src/SKILL.md" || { echo "SKILL AUSENTE $from/$name"; exit 12; }
 test ! -L "$src" || exit 13
 # No se copian binarios ejecutables, node_modules, hooks ni directorios ocultos.
 test "$(du -sk "$src" | cut -f1)" -le 1000 || { echo "SKILL DEMASIADO GRANDE"; exit 14; }
 local dst
 for dst in ".claude/skills/$name" ".agents/skills/$name"; do
   mkdir -p "$dst"
   find "$dst" -type f -delete
   rsync -r --prune-empty-dirs \
      --include='*/' --include='*.md' --include='*.mdx' --include='*.json' \
      --include='*.svg' --include='*.png' --include='*.jpg' --include='*.jpeg' \
      --exclude='*' "$src/" "$dst/"
   test -f "$dst/SKILL.md" || exit 15
 done
}
repo yt Jakeschincariol/youtube-agent-skill a2feb2104981a375ffd4f87ee04f4f5344ac43c6
repo remotion remotion-dev/skills 7e541aa4d7361dfaca0780a565a47307eb7bdfbb
repo vercel vercel-labs/skills b716f9dc2ba36b6aa8f0080615e5a3a6caeac63b
c=0
for f in "$WORK/yt/skills/"*/SKILL.md; do test -f "$f" || continue; copy_skill yt "$(basename "$(dirname "$f")")"; c=$((c+1)); done
test "$c" -eq 11 || { echo "YT_COUNT $c"; exit 16; }
c=0
for f in "$WORK/remotion/skills/"*/SKILL.md; do test -f "$f" || continue; copy_skill remotion "$(basename "$(dirname "$f")")"; c=$((c+1)); done
test "$c" -eq 13 || { echo "REMOTION_COUNT $c"; exit 17; }
copy_skill vercel find-skills
mkdir -p cloud/third-party-licenses
for src in yt remotion vercel; do
 if test -f "$WORK/$src/LICENSE"; then cp "$WORK/$src/LICENSE" "cloud/third-party-licenses/$src.LICENSE"; else echo "Licencia no encontrada en raiz: $src" >> cloud/third-party-licenses/REVISAR_LICENCIAS.txt; fi
done
cat > cloud/SKILLS_INSTALL_STATUS.md <<'EOF'
# MASK GROUP — instalación de instrucciones de terceros
Instaladas 25 skills de archivos estáticos (11 YouTube, 13 Remotion, 1 Find Skills) en .claude/skills y .agents/skills. Se preservan referencias Markdown. No se ejecutó código tercero ni se instalaron dependencias runtime.
Revisar licencias y scripts antes de ejecutar. No concede acceso a APIs, ni establece servicio Claude/ChatGPT en ejecución; requiere agente trabajando con checkout.
FreeLLMAPI sigue solo como integración de evaluación, SIN servicio ni credenciales ni cuotas garantizadas.
Los vídeos solo pasan a Drive después de aprobación individual del propietario y validación de hash, y la publicación requiere permiso separado.
EOF
git config user.name 'mask-group-skills-bot'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add .claude/skills .agents/skills cloud/third-party-licenses cloud/SKILLS_INSTALL_STATUS.md
if git diff --cached --quiet; then echo 'No hay cambios nuevos'; exit 0; fi
git commit -m 'feat(skills): instalar 25 skills de terceros, referencias y licencia'
git push origin HEAD:main
