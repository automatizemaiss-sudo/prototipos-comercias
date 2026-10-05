# Protótipos comerciais — Automatize Mais

Monorepo (npm workspaces) com protótipos para apresentações de venda. Cada protótipo é um app independente em `apps/`,
com deploy próprio na Vercel (Root Directory = `apps/<nome>`).

## Convenções
- Protótipo = demo de ~5 min. **Sem banco de dados**: dados no código (`src/data/*.ts`) e estado no `localStorage`.
- Pagamentos são **simulados** por padrão. Integrações reais (Asaas, n8n) só quando o Matheus pedir.
- Next.js (App Router) + TypeScript + Tailwind. Mobile-first (testar em 375px).
- Cada app tem seu `.env.example`; todas as variáveis opcionais, com fallback para a demo funcionar sem configurar nada.
- Antes de escrever código Next.js, ler `apps/<app>/AGENTS.md` (esta versão do Next tem breaking changes).
- Código repetido em 2+ apps vai para `packages/` (ainda vazio de propósito; extrair só quando houver repetição).

## Apps
- `apps/silvia-marmitas` — cardápio digital + checkout + admin (Silvia Marmitas & Lanches).

## Novo protótipo
Copiar um app existente como base (`cp -R apps/silvia-marmitas apps/<novo>`), renomear em `package.json` e ajustar dados/identidade.
