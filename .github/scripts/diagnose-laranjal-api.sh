#!/usr/bin/env bash
set -uo pipefail

BASE_URL="https://tb.labhidrosens.com"
DASHBOARD_ID="97ec9a60-d9e1-11f0-ac7c-456d9a25fe9a"
PUBLIC_ID="0a869e80-d9e8-11f0-ac7c-456d9a25fe9a"
DEVICE_ID="a3e1d520-b438-11f0-ac7c-456d9a25fe9a"
OUT="laranjal-diagnostic"
USER_AGENT="MOBI-Tempo-Pelotas-Diagnostic/1.0 (+https://agenciamobi.com.br)"
mkdir -p "$OUT/requests" "$OUT/assets"
LOG="$OUT/summary.log"
: > "$LOG"

request() {
  local name="$1"
  local method="$2"
  local url="$3"
  local data="${4:-}"
  local header="${5:-}"
  local body="$OUT/requests/${name}.body"
  local headers="$OUT/requests/${name}.headers"
  local metrics
  local args=(
    --silent --show-error --location --compressed --max-time 25
    --user-agent "$USER_AGENT"
    --request "$method"
    --dump-header "$headers"
    --output "$body"
    --write-out '%{http_code}|%{time_total}|%{url_effective}|%{content_type}'
  )

  if [[ -n "$data" ]]; then
    args+=(--header 'Content-Type: application/json' --data "$data")
  fi
  if [[ -n "$header" ]]; then
    args+=(--header "$header")
  fi

  metrics="$(curl "${args[@]}" "$url" 2>>"$OUT/curl-errors.log" || printf '000|25|%s|' "$url")"
  printf '%-36s %s\n' "$name" "$metrics" | tee -a "$LOG"
  printf '\n--- %s ---\n' "$name" >> "$OUT/body-previews.log"
  head -c 1200 "$body" >> "$OUT/body-previews.log" 2>/dev/null || true
  printf '\n' >> "$OUT/body-previews.log"
}

now_ms="$(date +%s%3N)"
start_ms="$((now_ms - 24 * 60 * 60 * 1000))"
telemetry_query="keys=payload&startTs=${start_ms}&endTs=${now_ms}&limit=50000&agg=NONE&orderBy=ASC"

printf 'Diagnóstico iniciado em %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" | tee -a "$LOG"
printf 'Dashboard ID: %s\nPublic ID: %s\nDevice ID: %s\n\n' "$DASHBOARD_ID" "$PUBLIC_ID" "$DEVICE_ID" >> "$LOG"

request "dashboard-public-page" GET "$BASE_URL/dashboard/$DASHBOARD_ID?publicId=$PUBLIC_ID"
request "root" GET "$BASE_URL/"
request "system-info" GET "$BASE_URL/api/noauth/systemInfo"
request "swagger-ui" GET "$BASE_URL/swagger-ui.html"
request "api-docs" GET "$BASE_URL/v3/api-docs"
request "swagger-resources" GET "$BASE_URL/swagger-resources"

request "auth-public-customer" POST "$BASE_URL/api/auth/login/public" "{\"publicId\":\"$PUBLIC_ID\"}"
request "auth-public-dashboard" POST "$BASE_URL/api/auth/login/public" "{\"publicId\":\"$DASHBOARD_ID\"}"
request "auth-public-both" POST "$BASE_URL/api/auth/login/public" "{\"publicId\":\"$PUBLIC_ID\",\"dashboardId\":\"$DASHBOARD_ID\"}"
request "auth-public-query-post" POST "$BASE_URL/api/auth/login/public?publicId=$PUBLIC_ID" '{}'
request "auth-public-query-get" GET "$BASE_URL/api/auth/login/public?publicId=$PUBLIC_ID"

request "dashboard-api" GET "$BASE_URL/api/dashboard/$DASHBOARD_ID"
request "dashboard-api-public-query" GET "$BASE_URL/api/dashboard/$DASHBOARD_ID?publicId=$PUBLIC_ID"
request "dashboard-info" GET "$BASE_URL/api/dashboard/info/$DASHBOARD_ID"
request "dashboard-info-public-query" GET "$BASE_URL/api/dashboard/info/$DASHBOARD_ID?publicId=$PUBLIC_ID"
request "public-dashboard" GET "$BASE_URL/api/public/dashboard/$DASHBOARD_ID?publicId=$PUBLIC_ID"
request "public-dashboard-info" GET "$BASE_URL/api/public/dashboard/info/$DASHBOARD_ID?publicId=$PUBLIC_ID"

request "telemetry-anonymous" GET "$BASE_URL/api/plugins/telemetry/DEVICE/$DEVICE_ID/values/timeseries?$telemetry_query"
request "telemetry-public-query" GET "$BASE_URL/api/plugins/telemetry/DEVICE/$DEVICE_ID/values/timeseries?$telemetry_query&publicId=$PUBLIC_ID"
request "telemetry-dashboard-query" GET "$BASE_URL/api/plugins/telemetry/DEVICE/$DEVICE_ID/values/timeseries?$telemetry_query&dashboardId=$DASHBOARD_ID&publicId=$PUBLIC_ID"
request "telemetry-latest-public" GET "$BASE_URL/api/plugins/telemetry/DEVICE/$DEVICE_ID/values/timeseries?keys=payload&publicId=$PUBLIC_ID"

python - <<'PY'
from pathlib import Path
from urllib.parse import urljoin
import html
import re

out = Path('laranjal-diagnostic')
body = out / 'requests' / 'dashboard-public-page.body'
text = body.read_text(encoding='utf-8', errors='ignore') if body.exists() else ''
assets = []
for match in re.finditer(r'''(?:src|href)=["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["']''', text, re.I):
    value = html.unescape(match.group(1))
    url = urljoin('https://tb.labhidrosens.com/', value)
    if url not in assets:
        assets.append(url)
(out / 'asset-urls.txt').write_text('\n'.join(assets[:30]), encoding='utf-8')
PY

asset_index=0
while IFS= read -r asset_url; do
  [[ -z "$asset_url" ]] && continue
  asset_index=$((asset_index + 1))
  curl --silent --show-error --location --compressed --max-time 30 \
    --user-agent "$USER_AGENT" \
    --output "$OUT/assets/asset-${asset_index}.js" \
    "$asset_url" 2>>"$OUT/curl-errors.log" || true
done < "$OUT/asset-urls.txt"

python - <<'PY'
from pathlib import Path
import re

out = Path('laranjal-diagnostic')
patterns = [
    r'login/public',
    r'publicId',
    r'publicDashboard',
    r'/api/dashboard',
    r'/api/plugins/telemetry',
    r'X-Authorization',
    r'accessToken',
    r'refreshToken',
    r'Bearer',
]
lines = []
for file in sorted((out / 'assets').glob('*.js')):
    text = file.read_text(encoding='utf-8', errors='ignore')
    for pattern in patterns:
        matches = list(re.finditer(pattern, text, re.I))
        if not matches:
            continue
        lines.append(f'## {file.name} :: {pattern} :: {len(matches)} ocorrência(s)')
        for match in matches[:12]:
            start = max(0, match.start() - 240)
            end = min(len(text), match.end() + 360)
            snippet = re.sub(r'\s+', ' ', text[start:end])
            lines.append(snippet)
        lines.append('')
(out / 'asset-patterns.log').write_text('\n'.join(lines), encoding='utf-8')
PY

# Se alguma variante de login devolver token, testa a telemetria autenticada.
for auth_body in "$OUT"/requests/auth-public-*.body; do
  [[ -f "$auth_body" ]] || continue
  token="$(python - "$auth_body" <<'PY'
import json, sys
try:
    data = json.load(open(sys.argv[1], encoding='utf-8'))
except Exception:
    print('')
    raise SystemExit
for key in ('token', 'accessToken', 'access_token'):
    value = data.get(key) if isinstance(data, dict) else None
    if isinstance(value, str):
        print(value)
        break
else:
    print('')
PY
)"
  if [[ ${#token} -gt 20 ]]; then
    name="telemetry-token-$(basename "$auth_body" .body)"
    request "$name" GET "$BASE_URL/api/plugins/telemetry/DEVICE/$DEVICE_ID/values/timeseries?$telemetry_query" "" "X-Authorization: Bearer $token"
  fi
done

printf '\nDiagnóstico finalizado em %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" | tee -a "$LOG"
exit 0
