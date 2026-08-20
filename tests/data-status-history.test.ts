import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260820025000_data_source_status_history.sql",
  "utf8",
);
const route = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const storage = readFileSync("src/lib/status/data-status-storage.server.ts", "utf8");
const cronRoute = readFileSync("src/routes/api/cron/data-status.ts", "utf8");
const workflow = readFileSync(".github/workflows/data-status-monitor.yml", "utf8");
const oidc = readFileSync("src/lib/github-actions-oidc.server.ts", "utf8");

test("o histórico persiste amostras, incidentes e manutenções com RLS privada", () => {
  assert.match(migration, /create table if not exists public\.data_source_status_checks/);
  assert.match(migration, /create table if not exists public\.data_source_incidents/);
  assert.match(migration, /create table if not exists public\.data_source_maintenance_windows/);
  assert.match(migration, /alter table public\.data_source_status_checks enable row level security/);
  assert.match(migration, /alter table public\.data_source_incidents enable row level security/);
  assert.match(migration, /grant execute on function public\.record_data_source_status/);
  assert.match(migration, /checked_at < p_checked_at - interval '180 days'/);
});

test("o registrador abre, atualiza e resolve incidentes sem expor as tabelas ao navegador", () => {
  assert.match(migration, /status = 'resolved'/);
  assert.match(migration, /where service_id = v_service_id\s+and status = 'open'/);
  assert.match(migration, /occurrence_count = occurrence_count \+ 1/);
  assert.match(storage, /createSupabaseAdminClient/);
  assert.match(storage, /record_data_source_status/);
  assert.match(storage, /get_data_source_availability/);
  assert.doesNotMatch(storage, /createSupabasePublicServerClient/);
});

test("a página de status mostra disponibilidade e histórico de incidentes", () => {
  assert.match(route, /getDataStatusPageData/);
  assert.match(route, /Histórico operacional/);
  assert.match(route, /Incidentes recentes/);
  assert.match(route, /Disponibilidade por integração/);
  assert.match(route, /Duração monitorada/);
  assert.match(route, /Manutenções programadas/);
  assert.match(route, /aproximadamente a cada 10 minutos/);
});

test("o coletor automático usa OIDC restrito ao workflow de status", () => {
  assert.match(cronRoute, /verifyDataStatusGithubActionsRequest/);
  assert.match(cronRoute, /recordDataStatusOverview/);
  assert.match(workflow, /cron:\s*"\*\/10 \* \* \* \*"/);
  assert.match(workflow, /OIDC_AUDIENCE: tempo-pelotas-data-status/);
  assert.match(workflow, /https:\/\/tempopelotas\.com\.br\/api\/cron\/data-status/);
  assert.match(oidc, /DATA_STATUS_GITHUB_OIDC_AUDIENCE = "tempo-pelotas-data-status"/);
  assert.match(oidc, /data-status-monitor\.yml/);
});
