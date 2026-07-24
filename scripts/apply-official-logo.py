from __future__ import annotations

import base64
import gzip
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text()


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if new in content:
        return
    if old not in content:
        raise SystemExit(f"Bloco esperado não encontrado em {path}")
    write(path, content.replace(old, new, 1))


def replace_pattern(path: str, pattern: str, replacement: str, expected_marker: str) -> None:
    content = read(path)
    if expected_marker in content:
        return
    content, count = re.subn(pattern, replacement, content, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"Estilos antigos não encontrados em {path}")
    write(path, content)


def decode_svg(payload_path: str, output_path: str) -> None:
    encoded = (ROOT / payload_path).read_text().strip()
    write(output_path, gzip.decompress(base64.b64decode(encoded)).decode())


decode_svg(
    ".github/logo-assets/tempo-pelotas-primary.svg.gz.b64",
    "public/brand/tempo-pelotas-primary.svg",
)
decode_svg(
    ".github/logo-assets/tempo-pelotas-purple.svg.gz.b64",
    "public/brand/tempo-pelotas-purple.svg",
)
write("public/brand/tempo-pelotas-header.svg", read("public/brand/tempo-pelotas-primary.svg"))

replace_once(
    "src/components/layout/Header.tsx",
    '''              <span className="production-brand-wordmark">
                <strong>TEMPO</strong>
                <em>Pelotas</em>
              </span>''',
    '''              <img
                className="production-brand-logo"
                src="/brand/tempo-pelotas-header"
                alt=""
                width={10694}
                height={1552}
                draggable={false}
              />''',
)

replace_pattern(
    "src/components/layout/Header.css",
    r'''\.production-brand-wordmark \{.*?\}\n\n\.production-brand-wordmark strong \{.*?\}\n\n\.production-brand-wordmark em \{.*?\}''',
    '''.production-brand-logo {
  display: block;
  width: clamp(132px, 12vw, 166px);
  height: auto;
}''',
    ".production-brand-logo {",
)

replace_once(
    "src/components/layout/Footer.tsx",
    '''              <strong>TEMPO</strong>
              <em>Pelotas</em>''',
    '''              <img
                className="editorial-footer-brand-logo"
                src="/brand/tempo-pelotas-header"
                alt=""
                width={10694}
                height={1552}
                loading="lazy"
                draggable={false}
              />''',
)

replace_pattern(
    "src/components/layout/Footer.css",
    r'''\.editorial-footer-brand \{.*?\}\n\n\.editorial-footer-brand strong \{.*?\}\n\n\.editorial-footer-brand em \{.*?\}''',
    '''.editorial-footer-brand {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  border-radius: 10px;
  color: var(--footer-ink);
}

.editorial-footer-brand-logo {
  display: block;
  width: clamp(210px, 24vw, 330px);
  max-width: 100%;
  height: auto;
}''',
    ".editorial-footer-brand-logo {",
)

replace_once(
    "src/production/components/site-header.tsx",
    '''              width={11349}
              height={1552}''',
    '''              width={10694}
              height={1552}''',
)

replace_once(
    "src/production/components/site-footer.tsx",
    '''                width={900}
                height={180}''',
    '''                width={10694}
                height={1552}''',
)

write(
    "public/brand/README.md",
    """# Identidade Tempo Pelotas

- `tempo-pelotas-primary.svg`: assinatura principal em ciano.
- `tempo-pelotas-purple.svg`: variação institucional em roxo.
- `tempo-pelotas-header.svg`: alias compatível da versão principal usado pelo portal.

As três versões preservam desenho vetorial e fundo transparente. A assinatura ciano é a aplicação padrão nos cabeçalhos e rodapés.
""",
)
