# ⚙️ Guia de Instalação Completo

> Passo a passo para instalar e rodar o **ProconChatBot** localmente em ambiente de desenvolvimento, incluindo banco de dados, LLM local e bot do WhatsApp.

🏠 [Voltar ao README2](../README2.md)

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Visão geral dos processos](#-visão-geral-dos-processos)
- [1. Clonar o repositório](#1-clonar-o-repositório)
- [2. Instalar dependências](#2-instalar-dependências)
- [3. Banco de dados PostgreSQL + pgvector](#3-banco-de-dados-postgresql--pgvector)
- [4. Variáveis de ambiente](#4-variáveis-de-ambiente)
- [5. Aplicar migrations Prisma](#5-aplicar-migrations-prisma)
- [6. Ollama (LLM local)](#6-ollama-llm-local)
- [7. Subir os serviços](#7-subir-os-serviços)
- [8. Conectar o WhatsApp](#8-conectar-o-whatsapp)
- [9. Criar primeiro usuário admin](#9-criar-primeiro-usuário-admin)
- [🔒 Segurança & boas práticas](#-segurança--boas-práticas)
- [Troubleshooting](#-troubleshooting)
- [Scripts úteis](#-scripts-úteis)

---

## 🧰 Pré-requisitos

| Ferramenta | Versão mínima | Verificação | Obrigatório |
|---|:---:|---|:---:|
| **Node.js** | 18 LTS | `node --version` | ✅ |
| **npm** | 9 | `npm --version` | ✅ |
| **Git** | qualquer | `git --version` | ✅ |
| **Docker** | 20+ | `docker --version` | ⚠️ Recomendado *(para banco)* |
| **Ollama** | latest | `ollama --version` | ⚠️ Opcional *(LLM local)* |
| **Chromium / Chrome** | qualquer | — | ✅ *(usado pelo `whatsapp-web.js`)* |

> 💡 Em **macOS** o Chromium é instalado automaticamente pelo Puppeteer/whatsapp-web.js. Em **Linux**, talvez seja necessário instalar libs (`apt install chromium-browser`). Em **Windows**, costuma funcionar out-of-the-box.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 🗺️ Visão geral dos processos

Após a instalação completa, você terá **4 processos rodando**:

| Processo | Comando | Porta |
|---|---|:---:|
| 🐘 PostgreSQL | Docker container | `5432` |
| 🦙 Ollama | `ollama serve` *(opcional)* | `11434` |
| 🏢 ServiceProcon Backend | `npm run dev` | `3002` |
| 📦 ServiceChatbot Backend | `npm run dev` | `3000` + `3001` |
| ⚛️ ServiceProcon Frontend | `npm run dev` | `5173` *(Vite)* |

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 1. Clonar o repositório

```bash
git clone https://github.com/cGuilhermec/ProconChatBot.git
cd ProconChatBot
```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 2. Instalar dependências

São **3 `package.json`** distintos. Instale em cada um:

```bash
# Backend administrativo
cd ServiceProcon/backend
npm install
cd ../..

# Backend chatbot (whatsapp + RAG + LLM)
cd ServiceChatbot/backend
npm install
cd ../..

# Frontend React
cd ServiceProcon/frontend
npm install
cd ../..
```

> ⚠️ A primeira instalação do `ServiceChatbot/backend` baixa o Chromium do Puppeteer (~150MB). Tenha paciência.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 3. Banco de dados PostgreSQL + pgvector

O projeto exige PostgreSQL com a extensão **`pgvector`** habilitada para a coluna `embedding` da tabela `pergunta`.

### Opção A — Docker *(recomendado)*

> ⚠️ **As credenciais abaixo são apenas para desenvolvimento local.** Em produção, gere uma senha forte *(ex.: `openssl rand -base64 32`)* e nunca exponha a porta `5432` para a internet pública.

```bash
docker run -d \
  --name postgres-procon \
  -e POSTGRES_USER=<seu_usuario_dev> \
  -e POSTGRES_PASSWORD=<sua_senha_dev> \
  -e POSTGRES_DB=<seu_db_dev> \
  -p 5432:5432 \
  ankane/pgvector:latest
```

**Verificar:**

```bash
docker ps | grep postgres-procon
docker exec -it postgres-procon \
  psql -U <seu_usuario_dev> -d <seu_db_dev> \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Opção B — PostgreSQL instalado localmente

1. Instale o PostgreSQL 16+ pelo site oficial.
2. Compile/baixe o `pgvector`:
   ```bash
   git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git
   cd pgvector
   make && sudo make install
   ```
3. Crie o banco e habilite a extensão:
   ```sql
   CREATE DATABASE procon_db;
   \c procon_db
   CREATE EXTENSION vector;
   ```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 4. Variáveis de ambiente

> 🔐 **Os exemplos abaixo são apenas placeholders para desenvolvimento local.** Em produção, gere senhas fortes e jamais commit o arquivo `.env`. Confirme que `.env` está no `.gitignore` (já está, por padrão).

### Gerando um `JWT_SECRET` forte

Antes de criar o `.env`, gere um segredo aleatório de pelo menos 32 bytes:

```bash
# macOS / Linux
openssl rand -base64 48

# ou via Node.js (qualquer SO)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Copie a saída e use como valor de `JWT_SECRET`. **Nunca** reutilize o exemplo abaixo.

### `ServiceProcon/backend/.env`

```env
# Banco (ajuste se mudou as credenciais do Docker no passo 3)
DATABASE_URL="postgresql://<usuario_db>:<senha_db>@localhost:5432/<nome_db>"

# JWT — substitua pelo segredo gerado acima
JWT_SECRET="<cole-aqui-o-output-do-openssl-rand>"

# Porta (opcional, default 3002)
PORT=3002
```

### `ServiceChatbot/backend/.env` *(opcional)*

```env
# URLs internas
ADMIN_API_URL=http://localhost:3002
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama:1.1b-chat

# Portas
RAG_PORT=3000
CHATBOT_PORT=3001
```

> ⚠️ **Boas práticas:**
> - Use **valores diferentes** para dev, staging e produção.
> - O `DATABASE_URL` de produção **nunca** deve apontar para `localhost`.
> - Em produção, prefira injeção via secret manager *(AWS Secrets Manager, Vault, GitHub Secrets…)* em vez de arquivo `.env` no disco.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 5. Aplicar migrations Prisma

Com o banco rodando e o `.env` configurado:

```bash
cd ServiceProcon/backend

# Aplica todas as migrations no banco
npx prisma migrate dev

# Gera o Prisma Client (TypeScript types)
npx prisma generate
```

**Verificação visual** *(opcional)*:

```bash
npx prisma studio
# → abre http://localhost:5555
```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 6. Ollama (LLM local)

Instale o Ollama para habilitar a geração textual com Llama.

### Instalação

| SO | Comando |
|---|---|
| **macOS / Linux** | `curl -fsSL https://ollama.com/install.sh \| sh` |
| **Windows** | Baixe em [ollama.com/download/windows](https://ollama.com/download/windows) |

### Baixar o modelo

O projeto usa `tinyllama:1.1b-chat` por padrão *(leve, ~640MB)*. Você pode optar por `llama3.2:latest` para qualidade superior.

```bash
ollama pull tinyllama:1.1b-chat
# ou
ollama pull llama3.2:latest
```

### Iniciar o servidor Ollama

```bash
ollama serve
# Deve estar acessível em http://localhost:11434
```

**Teste:**

```bash
curl http://localhost:11434/api/tags
```

> 💡 Em produção, considere usar `llama3.2` ou modelos maiores. Para desenvolvimento, `tinyllama` é mais rápido.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 7. Subir os serviços

Abra **3 terminais** *(além do banco e do Ollama)*:

### Terminal 1 — API Administrativa *(porta 3002)*

```bash
cd ServiceProcon/backend
npm run dev
```

Saída esperada:

```text
🚀 API Administrativa rodando em http://localhost:3002
📡 Rotas Admin: /procon, /usuarios, /perguntas, /agendamentos, /login
⏰ Job de atualização de agendamentos agendado (meia-noite)
```

### Terminal 2 — Chatbot + RAG *(portas 3000 + 3001)*

```bash
cd ServiceChatbot/backend
npm run dev
```

Saída esperada:

```text
🚀 API Técnica RAG rodando em http://localhost:3000
🚀 Chatbot API rodando em http://localhost:3001
[whatsapp-web.js] Escaneie o QR Code abaixo:
████  ██  ████ ...
```

### Terminal 3 — Frontend admin *(porta 5173)*

```bash
cd ServiceProcon/frontend
npm run dev
```

Saída esperada:

```text
  VITE v8.0.12  ready in 423 ms
  ➜  Local:   http://localhost:5173/
```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 8. Conectar o WhatsApp

1. No **Terminal 2** *(ServiceChatbot)*, você verá um **QR Code** em ASCII art.
2. Abra o **WhatsApp** no seu celular.
3. Vá em **Configurações → Aparelhos conectados → Conectar um aparelho**.
4. Aponte a câmera para o QR Code no terminal.
5. Aguarde a mensagem `✅ WhatsApp conectado` no terminal.

> 🔐 A sessão é persistida em `.wwebjs_auth/` — não será necessário escanear o QR Code novamente nas próximas execuções, **a menos que você apague essa pasta**.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 9. Criar primeiro usuário admin

Como o sistema usa autenticação JWT, é preciso inserir manualmente o primeiro **DEV** no banco. Conecte-se ao banco *(via Prisma Studio ou `psql`)* e crie:

### Via Prisma Studio

```bash
cd ServiceProcon/backend
npx prisma studio
```

1. Abra a tabela `usuario`.
2. Clique em **Add record**.
3. Preencha:
   - `nome`: "Dev"
   - `email`: `<seu_email_dev>` *(ex.: `admin@example.local`)*
   - `senha`: *hash bcrypt da senha desejada* — gere com Node:
     ```bash
     # Use uma senha forte SOMENTE para o primeiro login.
     # O fluxo de "primeiro acesso" obriga a trocar logo após.
     node -e "console.log(require('bcrypt').hashSync(process.argv[1], 10))" '<senha_temporaria>'
     ```
   - `role`: `DEV`
   - `primeiro_acesso`: `true`
   - `ativo`: `true`

### Via SQL direto

```sql
INSERT INTO usuario (nome, email, senha, role, primeiro_acesso, ativo, created_at, updated_at)
VALUES (
  'Dev Inicial',
  '<seu_email_dev>',
  '<hash_bcrypt_gerado_acima>',
  'DEV',
  true,
  true,
  NOW(),
  NOW()
);
```

Acesse `http://localhost:5173`, faça login com a senha temporária e troque-a no modal de **Primeiro Acesso**. A flag `primeiro_acesso=true` força essa troca antes de permitir qualquer outra ação.

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 🔒 Segurança & boas práticas

Antes de subir o sistema para qualquer ambiente além do seu PC pessoal, revise o checklist:

### ✅ O que NUNCA deve ser commitado

| Item | Por quê |
|---|---|
| `.env`, `.env.local`, `.env.production` | Contêm credenciais e segredos. Já estão no `.gitignore`. |
| `JWT_SECRET` real | Permitiria forjar tokens válidos. |
| Senhas em texto puro | Mesmo em scripts, logs ou comentários. |
| Hashes bcrypt reais de produção | Podem ser submetidos a ataques offline. |
| Tokens JWT emitidos | Mesmo "exemplos" — sempre use placeholders como `<jwt_token_aqui>`. |
| CPFs, telefones e nomes reais de cidadãos | LGPD — use sempre dados fictícios em testes. |
| Pasta `.wwebjs_auth/` | Contém credenciais de sessão do WhatsApp. |
| Dumps `.sql` com dados de produção | Idem. |

### ✅ Antes de cada commit

```bash
# Verifique se não há arquivos sensíveis staged
git status

# Inspecione o diff antes de commitar
git diff --cached

# Se commitou um segredo por acidente: REVOGUE imediatamente
# (mude o JWT_SECRET, troque a senha do DB, reset do token vazado).
# Apenas remover do commit NÃO é suficiente — o git mantém histórico.
```

### ✅ Recomendações por ambiente

| Ambiente | DATABASE_URL | JWT_SECRET | Logs |
|---|---|---|---|
| **Local dev** | localhost com senha fraca aceita | qualquer string aleatória | console |
| **Staging** | host privado (VPC) + senha forte | `openssl rand -base64 48` | estruturados |
| **Produção** | host privado + senha forte + SSL | secret manager (Vault/AWS Secrets Manager) | sem dados pessoais |

### ✅ LGPD — dados pessoais coletados pelo bot

O sistema armazena **CPF**, **telefone** e **nome** dos cidadãos para fins de agendamento. Em produção:

- Mascare CPF/telefone em logs *(ex.: `123.***.***-45`)*.
- Implemente endpoint de "esquecer meus dados" *(RP de LGPD)*.
- Use TLS em todas as comunicações externas.
- Defina política de retenção *(ex.: apagar agendamentos > 12 meses)*.

### ✅ Rotacionando segredos

Se um `JWT_SECRET` vazar:

```bash
# 1. Gere novo segredo
openssl rand -base64 48

# 2. Atualize no .env de produção via secret manager

# 3. Reinicie a API — todos os tokens antigos invalidam automaticamente

# 4. Usuários precisarão relogar (impacto aceitável vs. risco do vazamento)
```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to PostgreSQL"

```bash
# Verifique se o container está rodando
docker ps | grep postgres-procon

# Veja os logs
docker logs postgres-procon

# Reinicie
docker restart postgres-procon
```

### ❌ "Extension vector does not exist"

Acesse o banco e habilite manualmente *(use o usuário e banco definidos no seu `.env`)*:

```bash
docker exec -it postgres-procon \
  psql -U <seu_usuario_dev> -d <seu_db_dev> \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### ❌ WhatsApp QR Code não aparece

```bash
# Limpar sessão e tentar de novo
rm -rf ServiceChatbot/backend/.wwebjs_auth/ \
       ServiceChatbot/backend/.wwebjs_cache/ \
       ServiceChatbot/backend/session-data/

cd ServiceChatbot/backend && npm run dev
```

### ❌ Ollama responde lentamente ou dá erro

```bash
# Veja modelos instalados
ollama list

# Teste manualmente
curl http://localhost:11434/api/generate -d '{"model":"tinyllama:1.1b-chat","prompt":"oi","stream":false}'

# Se travar, mate e reinicie
pkill ollama
ollama serve
```

### ❌ Porta já em uso

```bash
# Linux/macOS
lsof -i :3002  # ou 3000, 3001, 5173
kill -9 <PID>

# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### ❌ `prisma migrate dev` falha

```bash
# Resetar e tentar de novo (⚠️ apaga dados)
cd ServiceProcon/backend
npx prisma migrate reset
npx prisma migrate dev
```

### ❌ TypeScript não compila

```bash
# Limpar caches do TS
cd ServiceProcon/backend
npx tsc --noEmit   # verificar erros
```

### ❌ "Token inválido ou expirado" no frontend

```text
# Abra DevTools (F12) → Application → Local Storage → http://localhost:5173
# Apague 'authToken' e 'user', e faça login novamente
```

> 💡 Se o erro persistir mesmo após relogar, verifique se o `JWT_SECRET` do `.env` mudou entre execuções — tokens emitidos com um segredo antigo não validam contra um novo.

### ❌ Arquivos `.wwebjs_*` aparecendo no `git status`

Já estão no `.gitignore` por padrão. Se ainda assim aparecem:

```bash
git rm -r --cached ServiceChatbot/backend/.wwebjs_auth/ \
                   ServiceChatbot/backend/.wwebjs_cache/ \
                   ServiceChatbot/backend/session-data/
git commit -m "chore: remove arquivos do WhatsApp do tracking"
```

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 🧪 Scripts úteis

### ServiceProcon/backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia API admin com nodemon |
| `npm run test:all` | Roda todos os testes |
| `npm run test:usuario` | Testes do domínio Usuario |
| `npm run test:procon` | Testes do domínio Procon |
| `npm run test:agendamento` | Testes do domínio Agendamento |
| `npm run test:pergunta` | Testes do domínio Pergunta |
| `npm run test:feriado` | Testes do domínio Feriado |
| `npm run test:auditlog` | Testes do AuditLog |
| `npm run test:login` | Testes de autenticação |

### ServiceChatbot/backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor + WhatsApp Bot |
| `npm run dev:cli` | CLI interativo (sem WhatsApp) |
| `npm run build` | Compila TS → JS |
| `npm run start` | Roda dist/server.js |
| `npm test` | Testes do buscador RAG |
| `npm run test:all` | Buscador + Llama |
| `npm run type-check` | `tsc --noEmit` |

### ServiceProcon/frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Vite dev server *(`:5173`)* |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run preview` | Servir build localmente |

🔝 [Voltar ao topo](#%EF%B8%8F-guia-de-instalação-completo)

---

## 🔗 Veja também

- [📘 README2 — Documento central](../README2.md)
- [📐 Arquitetura detalhada](./ARCHITECTURE.md)
- [🔌 Referência de API](./API.md)
- [⚛️ Documentação do frontend](./FRONTEND.md)
- [💬 Fluxo do chatbot WhatsApp](./WHATSAPP.md)
- [🗄️ Modelagem do banco](./schema.md)

---

<p align="center"><sub>Documento mantido pela equipe Azimuth do 6º DSM — Fatec / Jacareí 2026.</sub></p>
