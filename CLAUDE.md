# CLAUDE.md — Ponto de Entrada para Claude Code (Panelada)

Este repositório usa [`AGENTS.md`](./AGENTS.md) como fonte única de instruções para todos os agentes (Claude Code, Codex, Kimi e Antigravity).

1. Leia [`./AGENTS.md`](./AGENTS.md) e [`./STATE.md`](./STATE.md) antes de iniciar qualquer tarefa.
2. **Skills compartilhadas:** as skills do projeto vivem em `.agents/skills/`. Se `.claude/skills` ainda não existir nesta máquina, rode uma vez `node scripts/setup-agent-skills.mjs` (cria symlink no Linux/macOS ou *junction* sem admin no Windows).
3. Consulte a tabela **"Leia Quando"** no [`./AGENTS.md`](./AGENTS.md) para abrir apenas o documento necessário (`docs/dev/`, `docs/playbooks/`, ou referências pontuais de `docs/fase1/` e `docs/fase2/`).
4. **Planos locais** ficam em `.plans/` (dentro do workspace, ignorado pelo `.gitignore`) — nunca em `~/.claude/plans/`.
5. Ao concluir um marco/etapa relevante, atualize [`./STATE.md`](./STATE.md) e o diário de bordo da fase vigente.
