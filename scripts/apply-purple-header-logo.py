from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")

    if new in content:
        return

    if old not in content:
        raise SystemExit(f"Bloco esperado não encontrado em {path}")

    target.write_text(content.replace(old, new, 1), encoding="utf-8")


for component in (
    "src/production/components/site-header.tsx",
    "src/components/layout/Header.tsx",
):
    replace_once(
        component,
        'src="/brand/tempo-pelotas-header"',
        'src="/brand/tempo-pelotas-purple.svg"',
    )

replace_once(
    "src/production/components/site-header.tsx",
    '''          <span className="site-header-brand-divider" aria-hidden="true" />
          <span className="site-header-context">
            <strong>Pelotas, RS</strong>
            <small>Tempo e águas</small>
          </span>
''',
    "",
)

replace_once(
    "src/components/layout/Header.tsx",
    '''            <span className="production-brand-divider" aria-hidden="true" />
            <span className="production-brand-context">
              <strong>Pelotas, RS</strong>
              <small>Tempo e águas</small>
            </span>
''',
    "",
)

replace_once(
    "src/production/styles/header-template-refinement-v2.css",
    '''    width: clamp(172px, 11vw, 194px);
    max-height: 28px;''',
    '''    width: clamp(190px, 13vw, 218px);
    max-height: 34px;''',
)

replace_once(
    "src/production/styles/header-template-refinement-v2.css",
    "    width: 160px;",
    "    width: 184px;",
)

replace_once(
    "src/production/styles/header-template-refinement-v2.css",
    "    width: 146px;",
    "    width: 168px;",
)

replace_once(
    "src/production/styles/header-template-refinement-v2.css",
    '''    width: clamp(142px, 38vw, 160px);
    max-height: 24px;''',
    '''    width: clamp(154px, 42vw, 176px);
    max-height: 27px;''',
)

replace_once(
    "src/components/layout/Header.css",
    "  width: clamp(132px, 12vw, 166px);",
    "  width: clamp(176px, 14vw, 206px);",
)
