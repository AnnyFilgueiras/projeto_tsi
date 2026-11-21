#!/usr/bin/env python3
"""Auditoria heurística de qualidade de issues do GitHub (adaptada ao Panelada).

Puxa issues via `gh` e pontua o que é mecanicamente detectável: estrutura,
evidência, critérios de aceite, metadados, tamanho, staleness, títulos
suspeitos, placeholders não preenchidos, rastreabilidade do Panelada
(US/UC/RN/RNF/ADR/A##/MVP/GOV) e possíveis duplicatas.

NÃO julga semântica. A nota é um filtro de atenção: use-a para escolher
quais issues merecem leitura humana e a rubrica de references/revisao.md.

Uso:
    python3 .agents/skills/github-issue-craft/scripts/audit_issues.py
    python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --repo OWNER/REPO --state all --limit 200
    python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --label implementacao --min-score 12
    python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --json .plans/tmp-audit.json
    cat issues.json | python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --stdin
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone

MAX_SCORE = 20
STALE_DAYS = 90

VAGUE_TERMS = [
    "melhorar", "otimizar", "simplificar", "robusto", "escalável", "escalavel",
    "intuitivo", "adequado", "apropriado", "de forma correta", "corretamente",
    "rapidamente", "user friendly", "improve", "optimize", "better", "properly",
    "as needed", "etc", "entre outros", "e afins", "algumas coisas", "várias coisas",
]

GENERIC_TITLES = [
    "bug", "erro", "problema", "issue", "task", "tarefa", "ajuste", "ajustes",
    "correção", "correcao", "fix", "melhoria", "melhorias", "update", "atualização",
    "refactor", "refatorar", "teste", "test", "todo", "wip", "urgente",
]

PLACEHOLDER_PATTERNS = [
    r"<!--.*?-->",
    r"<[A-Za-zÀ-ÿ][^<>\n]{4,}>",          # <descreva aqui>
    r"^\s*(n/?a|tbd|todo|xxx|\.\.\.)\s*$",
]

SECTION_SIGNALS = {
    "repro": r"(reprodu|steps? to reproduce|passos para|como reproduzir)",
    "expected": r"(esperad|expected behavio)",
    "actual": r"(obtid|atual|actual behavio|o que acontece)",
    "environment": r"(ambiente|environment|vers[ãa]o|version|browser|navegador|so:|os:|docker|emulador)",
    "acceptance": r"(crit[ée]rios? de aceite|acceptance criteria|defini[çc][ãa]o de pronto|dado que|given .*when)",
    "scope": r"(fora de escopo|out of scope|escopo)",
    "problem": r"(problema|contexto|motiva|why|problem|objetivo)",
    "evidence": r"(```|!\[|http|log|stack|traceback|screenshot|print|comando|evid[êe]ncia)",
}

PANELADA_TRACE_PATTERN = re.compile(
    r"\b(US\d{2}|UC\d{2}|RN\d{2}[a-h]?|RNF\d{2}|CT\d{2}|ADR-\d{3}|A\d{2}|MVP-\d{2}|GOV-\d{2}|F2-\d{2}|GAM-\d{2})\b"
)

STOPWORDS = set("""
a o e de da do das dos em no na nos nas um uma para por com que se ao aos as os
the a an of to in on for and or is are be with when after before not no
""".split())


def run_gh(args):
    try:
        out = subprocess.run(
            ["gh"] + args, capture_output=True, text=True, check=True, timeout=180
        )
        return out.stdout
    except FileNotFoundError:
        sys.exit("erro: 'gh' não encontrado no PATH. Instale o GitHub CLI ou use --stdin.")
    except subprocess.CalledProcessError as e:
        sys.exit(f"erro ao chamar gh: {e.stderr.strip()}")
    except subprocess.TimeoutExpired:
        sys.exit("erro: chamada ao gh excedeu o tempo limite.")


def fetch_issues(repo, state, limit, label):
    args = [
        "issue", "list", "--state", state, "--limit", str(limit),
        "--json",
        "number,title,body,labels,assignees,milestone,createdAt,updatedAt,comments,url,state",
    ]
    if repo:
        args = ["issue", "list", "--repo", repo] + args[2:]
    if label:
        args += ["--label", label]
    return json.loads(run_gh(args) or "[]")


def days_since(iso):
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    return (datetime.now(timezone.utc) - dt).days


def has(body_lc, key):
    return bool(re.search(SECTION_SIGNALS[key], body_lc, re.IGNORECASE | re.DOTALL))


def title_tokens(title):
    words = re.findall(r"[a-zà-ÿ0-9]{3,}", title.lower())
    return {w for w in words if w not in STOPWORDS}


def guess_kind(title, labels, body_lc):
    blob = (title + " " + " ".join(labels)).lower()
    if re.search(r"\b(bug|erro|crash|falha|quebr|broken|regress)", blob) or (
        has(body_lc, "repro") and has(body_lc, "expected")
    ):
        return "bug"
    if re.search(r"\b(epic|épico|epico)\b", blob):
        return "epic"
    if re.search(r"\b(spike|investiga|research|poc)\b", blob):
        return "spike"
    if re.search(
        r"\b(chore|refactor|refator|upgrade|bump|ci|docs|test|governanca|arquitetura|retroalimentacao)\b",
        blob,
    ):
        return "task"
    return "feature"


def audit_one(issue):
    """Retorna dict com score 0-20 e lista de achados."""
    title = (issue.get("title") or "").strip()
    body = issue.get("body") or ""
    body_lc = body.lower()
    labels = [l["name"] for l in issue.get("labels") or []]
    findings = []
    score = 0

    kind = guess_kind(title, labels, body_lc)

    # 1. Título (0-3)
    t_score = 3
    tl = title.lower().strip()
    if not title:
        t_score = 0
        findings.append("título vazio")
    else:
        if len(title) > 72:
            t_score -= 1
            findings.append(f"título longo ({len(title)} chars, ideal ≤72)")
        if len(title) < 15:
            t_score -= 1
            findings.append("título curto demais para ser buscável")
        if tl.strip(" .!?:[]") in GENERIC_TITLES or len(title_tokens(title)) <= 1:
            t_score -= 2
            findings.append("título genérico — não identifica o problema isoladamente")
        if re.search(r"(urgente|asap|!!!|\?\?\?)", tl):
            t_score -= 1
            findings.append("urgência no título em vez de label de prioridade")
    score += max(0, min(3, t_score))

    # 2. Corpo existe e tem substância (0-3)
    stripped = re.sub(r"\s+", " ", re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)).strip()
    if not stripped:
        findings.append("corpo vazio")
    elif len(stripped) < 80:
        score += 1
        findings.append(f"corpo muito curto ({len(stripped)} chars)")
    elif len(stripped) > 6000:
        score += 2
        findings.append("corpo muito longo — provável despejo de log ou conversa")
    else:
        score += 3

    # 3. Placeholders não preenchidos (0-2)
    ph = 0
    for pat in PLACEHOLDER_PATTERNS:
        ph += len(re.findall(pat, body, re.IGNORECASE | re.MULTILINE | re.DOTALL))
    if ph == 0:
        score += 2
    elif ph <= 2:
        score += 1
        findings.append(f"{ph} placeholder(s) do template não preenchido(s)")
    else:
        findings.append(f"{ph} placeholders não preenchidos — template respondido pela metade")

    # 4. Evidência / reprodução (0-4) — peso maior em bug
    if kind == "bug":
        parts = sum([has(body_lc, "repro"), has(body_lc, "expected"),
                     has(body_lc, "actual"), has(body_lc, "environment")])
        score += parts
        missing = [n for n, k in [("passos de reprodução", "repro"), ("esperado", "expected"),
                                  ("obtido", "actual"), ("ambiente/versão", "environment")]
                   if not has(body_lc, k)]
        if missing:
            findings.append("bug sem " + ", ".join(missing))
        if not has(body_lc, "evidence"):
            findings.append("sem evidência (log, print ou bloco de código)")
    else:
        pts = 0
        if has(body_lc, "problem"):
            pts += 2
        else:
            findings.append("não explica o problema ou a motivação")
        if has(body_lc, "evidence") or re.search(r"#\d+", body) or PANELADA_TRACE_PATTERN.search(body):
            pts += 1
        if has(body_lc, "scope"):
            pts += 1
        else:
            findings.append("sem delimitação de escopo / fora de escopo")
        score += pts

    # 5. Critérios de aceite (0-3)
    checkboxes = len(re.findall(r"^\s*[-*]\s*\[[ xX]\]", body, re.MULTILINE))
    if has(body_lc, "acceptance") and checkboxes >= 2:
        score += 3
    elif has(body_lc, "acceptance") or checkboxes >= 2:
        score += 2
        findings.append("critérios de aceite fracos ou implícitos")
    elif checkboxes == 1:
        score += 1
        findings.append("apenas um critério de aceite")
    else:
        findings.append("sem critérios de aceite verificáveis")

    # 6. Vagueza (0-2)
    scan = body_lc + " " + tl
    vague = [t for t in VAGUE_TERMS if re.search(r"\b" + re.escape(t) + r"\b", scan)]
    if not vague:
        score += 2
    elif len(vague) <= 2:
        score += 1
        findings.append("termos elásticos: " + ", ".join(vague[:3]))
    else:
        findings.append("muitos termos elásticos: " + ", ".join(vague[:5]))

    # 7. Contexto técnico / rastreabilidade Panelada (0-2)
    ctx = 0
    if re.search(
        r"([\w/-]+\.(py|js|mjs|ts|tsx|jsx|css|yml|yaml|sql|md|json)\b|\b(apps|packages|docs)/[\w/-]+)",
        body,
    ):
        ctx += 1
    if re.search(r"(#\d+|https?://github\.com/)", body) or PANELADA_TRACE_PATTERN.search(body):
        ctx += 1
    if ctx == 0:
        findings.append("sem links, arquivos ou IDs de rastreabilidade (US/UC/RN/ADR/A##/MVP)")
    score += ctx

    # 8. Metadados (0-2)
    meta = 0
    if labels:
        meta += 1
    else:
        findings.append("sem labels")
    if issue.get("milestone") or issue.get("assignees"):
        meta += 1
    score += meta

    # 9. Tamanho (0-1)
    if checkboxes > 12:
        findings.append(f"{checkboxes} itens — provável épico não fatiado em sub-issues")
    elif re.search(r"\b(e|and|/|\+)\b", title) and len(title_tokens(title)) > 6 and checkboxes == 0:
        findings.append("título sugere múltiplos resultados — considere fatiar")
        score += 1
    else:
        score += 1

    if (
        kind == "epic"
        and not re.search(r"#\d+", body)
        and not any(re.search(r"scop|refin", l, re.IGNORECASE) for l in labels)
    ):
        findings.append("épico sem sub-issues referenciadas — fatiar ou marcar como pendente de scoping")

    # Sinais fora da nota
    stale = days_since(issue.get("updatedAt"))
    if stale is not None and stale > STALE_DAYS:
        findings.append(f"parada há {stale} dias")
    if not issue.get("comments") and stale is not None and stale > 30 and issue.get("state") == "OPEN":
        findings.append("aberta sem interação — nunca foi triada?")

    score = max(0, min(MAX_SCORE, score))
    verdict = "Pronta" if score >= 16 else ("Ajustar" if score >= 10 else "Bloqueada")

    return {
        "number": issue.get("number"),
        "title": title,
        "url": issue.get("url"),
        "kind": kind,
        "score": score,
        "verdict": verdict,
        "labels": labels,
        "stale_days": stale,
        "findings": findings,
    }


def find_duplicates(results, threshold=0.6):
    """Pares com alta sobreposição de tokens no título."""
    pairs = []
    items = [(r, title_tokens(r["title"])) for r in results]
    for i in range(len(items)):
        ra, ta = items[i]
        if len(ta) < 2:
            continue
        for j in range(i + 1, len(items)):
            rb, tb = items[j]
            if len(tb) < 2:
                continue
            inter = len(ta & tb)
            sim = inter / min(len(ta), len(tb))
            if sim >= threshold and inter >= 2:
                pairs.append((ra["number"], rb["number"], round(sim, 2)))
    return pairs


def report(results, dupes, min_score):
    shown = [r for r in results if r["score"] < min_score] if min_score else results
    shown = sorted(shown, key=lambda r: r["score"])
    total = len(results)
    avg = sum(r["score"] for r in results) / total if total else 0
    blocked = sum(1 for r in results if r["score"] < 10)
    stale = sum(1 for r in results if (r["stale_days"] or 0) > STALE_DAYS)

    lines = []
    lines.append(f"# Auditoria de issues — {total} analisadas")
    lines.append("")
    lines.append(f"Nota média **{avg:.1f}/20** · {blocked} abaixo de 10 · {stale} paradas há +{STALE_DAYS} dias")
    lines.append("")
    lines.append("| # | Nota | Veredito | Tipo | Título |")
    lines.append("|---|---|---|---|---|")
    for r in shown[:60]:
        t = r["title"][:60] + ("…" if len(r["title"]) > 60 else "")
        lines.append(f"| {r['number']} | {r['score']}/20 | {r['verdict']} | {r['kind']} | {t} |")
    lines.append("")

    lines.append("## Achados por issue")
    for r in shown[:40]:
        lines.append("")
        lines.append(f"### #{r['number']} — {r['title']}  ({r['score']}/20, {r['verdict']})")
        if r["url"]:
            lines.append(r["url"])
        for f in r["findings"]:
            lines.append(f"- {f}")
        if not r["findings"]:
            lines.append("- sem problemas estruturais detectados")

    if dupes:
        lines.append("")
        lines.append("## Possíveis duplicatas (títulos semelhantes)")
        for a, b, sim in dupes[:20]:
            lines.append(f"- #{a} ↔ #{b} (similaridade {sim})")

    lines.append("")
    lines.append("---")
    lines.append("_Heurística estrutural. Não avalia semântica: leia as piores e aplique a rubrica "
                 "de `references/revisao.md` antes de decidir reescrever, fundir ou fechar._")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser(description="Auditoria heurística de issues do GitHub (Panelada)")
    p.add_argument("--repo", help="OWNER/REPO (padrão: repositório do diretório atual)")
    p.add_argument("--state", default="open", choices=["open", "closed", "all"])
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--label", help="filtrar por label")
    p.add_argument("--min-score", type=int, default=0,
                   help="mostrar apenas issues abaixo desta nota")
    p.add_argument("--json", dest="json_out", help="salvar resultado bruto em JSON")
    p.add_argument("--stdin", action="store_true",
                   help="ler o JSON de `gh issue list --json ...` da entrada padrão")
    args = p.parse_args()

    issues = json.load(sys.stdin) if args.stdin else fetch_issues(
        args.repo, args.state, args.limit, args.label
    )
    if not issues:
        print("Nenhuma issue encontrada com esses filtros.")
        return

    results = [audit_one(i) for i in issues]
    dupes = find_duplicates(results)

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as fh:
            json.dump({"results": results, "duplicates": dupes}, fh,
                      ensure_ascii=False, indent=2)
        print(f"JSON salvo em {args.json_out}", file=sys.stderr)

    print(report(results, dupes, args.min_score))


if __name__ == "__main__":
    main()
