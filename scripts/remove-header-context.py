from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def remove_once(path: str, block: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")

    if block not in content:
        raise SystemExit(f"Bloco esperado não encontrado em {path}")

    target.write_text(content.replace(block, "", 1), encoding="utf-8")


remove_once(
    "src/production/components/site-header.tsx",
    '''          <span className="site-header-brand-divider" aria-hidden="true" />
          <span className="site-header-context">
            <strong>Pelotas, RS</strong>
            <small>Tempo e águas</small>
          </span>
''',
)

remove_once(
    "src/components/layout/Header.tsx",
    '''            <span className="production-brand-divider" aria-hidden="true" />
            <span className="production-brand-context">
              <strong>Pelotas, RS</strong>
              <small>Tempo e águas</small>
            </span>
''',
)
