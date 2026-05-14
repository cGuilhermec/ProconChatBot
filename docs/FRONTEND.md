# ⚛️ Documentação do Frontend

> Painel administrativo do **ProconChatBot** construído em **React 19 + Vite 8 + TypeScript**, com autenticação JWT, controle de acesso baseado em papéis (RBAC) e integração com a API Administrativa do ServiceProcon.

🏠 [Voltar ao README2](../README2.md)

---

## 📋 Índice

- [Stack](#-stack)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Rotas](#-rotas)
- [Autenticação](#-autenticação)
- [RBAC (controle de acesso)](#-rbac-controle-de-acesso)
- [Camada de serviços (API client)](#-camada-de-serviços-api-client)
- [Componentes principais](#-componentes-principais)
- [Hooks customizados](#-hooks-customizados)
- [Estilização](#-estilização)
- [Padrões de código](#-padrões-de-código)
- [Como rodar](#-como-rodar)

---

## 🛠️ Stack

| Dependência | Versão | Uso |
|---|:---:|---|
| **react** | 19 | UI |
| **react-dom** | 19 | Renderização |
| **react-router-dom** | 7 | Roteamento client-side |
| **sweetalert2** | 11 | Modais e toasts |
| **vite** | 8 | Build tool e dev server |
| **typescript** | ~6 | Tipagem estática |
| **eslint** + **typescript-eslint** | 10 / 8 | Linting |

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 📁 Estrutura de pastas

```text
ServiceProcon/frontend/
├── public/
│   ├── favicon.svg            # Favicon institucional
│   └── icons.svg              # Sprite de ícones
│
├── src/
│   ├── App.tsx                # Router + AuthProvider raiz
│   ├── App.css
│   ├── main.tsx               # Entry point Vite
│   ├── index.css              # Estilos globais
│   │
│   ├── assets/                # Imagens e logos
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── Login.tsx          # Tela de login
│   │   ├── FirstAccessModal.tsx   # Modal de troca de senha forçada
│   │   ├── ProtectedRoute.tsx     # HOC de rota privada
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── cards/             # ModuleCard, StatsCard
│   │   │   ├── tables/            # UsersTable, …
│   │   │   ├── users/             # UsersPage + UserForm + ResetPassword
│   │   │   ├── feriados/          # FeriadosPage + FeriadoForm
│   │   │   └── agendamentos/      # AgendamentosPage
│   │   └── profile/
│   │       └── ProfilePage.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # Estado global de autenticação
│   │
│   ├── hooks/
│   │   ├── usePermissions.ts  # Consulta permissões por role
│   │   └── useToast.ts        # Wrapper para SweetAlert2
│   │
│   ├── services/api/
│   │   ├── api.ts             # Cliente HTTP base + login
│   │   ├── agendamento.service.ts
│   │   ├── feriado.service.ts
│   │   ├── me.service.ts
│   │   ├── procon.service.ts
│   │   ├── profile.service.ts
│   │   └── user.service.ts
│   │
│   ├── types/
│   │   ├── roles.ts           # UserRole + Permission + rolePermissions
│   │   └── modules.ts         # Lista de módulos do painel + RBAC
│   │
│   └── utils/
│       ├── alert.ts           # Funções utilitárias de alerta
│       └── alert.css
│
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🗺️ Rotas

Definidas em [src/App.tsx](../ServiceProcon/frontend/src/App.tsx) usando `react-router-dom`:

| Rota | Componente | Proteção |
|---|---|:---:|
| `/login` | `<Login />` | 🟢 Pública |
| `/` | `<Dashboard />` | 🔒 Privada |
| `/dashboard` | `<Dashboard />` | 🔒 Privada |
| `/usuarios` | `<UsersPage />` | 🔒 Privada *(COORDENADOR+)* |
| `/perfil` | `<ProfilePage />` | 🔒 Privada |
| `/agendamentos` | `<AgendamentosPage />` | 🔒 Privada |
| `/feriados` | `<FeriadosPage />` | 🔒 Privada *(COORDENADOR+)* |
| `*` | Redireciona para `/dashboard` | 🔒 Privada |

> 🔐 Toda rota privada é envelopada por `<ProtectedRoute>`, que verifica `isAuthenticated` no contexto e redireciona para `/login` se necessário.

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🔑 Autenticação

### Fluxo

1. Usuário acessa `/login` → preenche email + senha.
2. `AuthContext.login()` chama `apiService.login()` → `POST /login` da API Admin.
3. Backend retorna `token` (JWT) + `usuario`.
4. O token é salvo em `localStorage.authToken` e os dados em `localStorage.user`.
5. `AuthProvider` atualiza `isAuthenticated` e `user`.
6. Se `primeiro_acesso === true`, o `<FirstAccessModal />` é exibido sobre o dashboard, forçando a troca de senha.
7. Todas as chamadas autenticadas enviam `Authorization: Bearer <token>`.

### Arquivos-chave

| Arquivo | Função |
|---|---|
| [src/context/AuthContext.tsx](../ServiceProcon/frontend/src/context/AuthContext.tsx) | Provider + hook `useAuth()`. |
| [src/services/api/api.ts](../ServiceProcon/frontend/src/services/api/api.ts) | Cliente HTTP + métodos `login`, `logout`, `getToken`, `getUser`. |
| [src/components/ProtectedRoute.tsx](../ServiceProcon/frontend/src/components/ProtectedRoute.tsx) | Guarda de rota. |
| [src/components/FirstAccessModal.tsx](../ServiceProcon/frontend/src/components/FirstAccessModal.tsx) | Modal de primeiro acesso. |

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 👮 RBAC (controle de acesso)

Definido em [src/types/roles.ts](../ServiceProcon/frontend/src/types/roles.ts) e aplicado de duas formas:

### 1. Permissões por papel

```ts
export type UserRole = 'FUNCIONARIO' | 'COORDENADOR' | 'DIRETOR' | 'DEV';

export const rolePermissions: Record<UserRole, Permission> = {
  FUNCIONARIO:  { canViewUsers: false,  canEditUsers: false,  /* ... */ },
  COORDENADOR:  { canViewUsers: true,   canEditUsers: true,   /* ... */ },
  DIRETOR:      { canViewUsers: true,   canEditProcons: true, /* ... */ },
  DEV:          { /* tudo true */ },
};
```

### 2. Módulos do painel

[src/types/modules.ts](../ServiceProcon/frontend/src/types/modules.ts) define os cards exibidos no dashboard:

```ts
export const modules: Module[] = [
  { id: 'dashboard',    path: '/dashboard',    permissions: ['FUNCIONARIO','COORDENADOR','DIRETOR','DEV'] },
  { id: 'users',        path: '/usuarios',     permissions: ['COORDENADOR','DIRETOR','DEV'] },
  { id: 'procons',      path: '/procons',      permissions: ['DIRETOR','DEV'] },
  { id: 'feriados',     path: '/feriados',     permissions: ['COORDENADOR','DIRETOR','DEV'] },
  { id: 'perguntas',    path: '/perguntas',    permissions: ['COORDENADOR','DIRETOR','DEV'] },
  { id: 'agendamentos', path: '/agendamentos', permissions: ['FUNCIONARIO','COORDENADOR','DIRETOR','DEV'] },
  { id: 'auditlog',     path: '/auditoria',    permissions: ['COORDENADOR','DIRETOR','DEV'] },
  { id: 'devtools',     path: '/dev',          permissions: ['DEV'] },
];
```

### 3. Hook `usePermissions`

```ts
const { canViewUsers, canAccessDevTools } = usePermissions();
if (!canViewUsers) return <Forbidden />;
```

> ⚠️ O RBAC do frontend é **complementar** ao do backend, nunca substituto. O servidor revalida toda permissão via `AuthMiddleware`.

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🌐 Camada de serviços (API client)

Cada domínio possui seu próprio service em `src/services/api/`. Todos seguem o mesmo padrão:

```ts
// Exemplo conceitual
export const userService = {
  async list(): Promise<User[]> {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },
  async create(data: UserCreate) { /* ... */ },
  // ...
};
```

| Service | Endpoints cobertos |
|---|---|
| `api.ts` | `/login`, `/first-access` |
| `me.service.ts` | `/me` |
| `user.service.ts` | `/usuarios`, `/usuario`, ativar/desativar |
| `procon.service.ts` | `/procons`, `/procon/:id` |
| `feriado.service.ts` | `/feriados`, `/feriado/:id`, `/feriado/verificar` |
| `agendamento.service.ts` | `/admin/agendamentos`, `/admin/agendamento/:id` |
| `profile.service.ts` | `/mudar-senha`, `/me` |

> 📌 A URL base está em `API_BASE_URL = 'http://localhost:3002'`. Em produção, mover para variável de ambiente Vite (`VITE_API_URL`).

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🧱 Componentes principais

### `<Login />`

[src/components/Login.tsx](../ServiceProcon/frontend/src/components/Login.tsx) — Formulário de email + senha. Em caso de sucesso, redireciona para `/dashboard`.

### `<Dashboard />`

[src/components/dashboard/Dashboard.tsx](../ServiceProcon/frontend/src/components/dashboard/Dashboard.tsx) — Tela principal. Exibe os **cards de módulos** filtrados pelas permissões do usuário.

### `<DashboardSidebar />`

[src/components/dashboard/DashboardSidebar.tsx](../ServiceProcon/frontend/src/components/dashboard/DashboardSidebar.tsx) — Menu lateral persistente em todas as páginas administrativas.

### `<UsersPage />`

[src/components/dashboard/users/UsersPage.tsx](../ServiceProcon/frontend/src/components/dashboard/users/UsersPage.tsx) — Listagem, criação, edição, ativação/desativação e reset de senha de usuários.

### `<FeriadosPage />`

[src/components/dashboard/feriados/FeriadosPage.tsx](../ServiceProcon/frontend/src/components/dashboard/feriados/FeriadosPage.tsx) — Gestão de feriados *(específicos por unidade)*.

### `<AgendamentosPage />`

[src/components/dashboard/agendamentos/AgendamentosPage.tsx](../ServiceProcon/frontend/src/components/dashboard/agendamentos/AgendamentosPage.tsx) — Listagem de agendamentos e atualização manual de status.

### `<ProfilePage />`

[src/components/profile/ProfilePage.tsx](../ServiceProcon/frontend/src/components/profile/ProfilePage.tsx) — Edição de dados pessoais e troca de senha.

### `<FirstAccessModal />`

[src/components/FirstAccessModal.tsx](../ServiceProcon/frontend/src/components/FirstAccessModal.tsx) — Modal não-fechável exibido em cima do dashboard quando `user.primeiro_acesso === true`.

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🪝 Hooks customizados

### `useAuth()`

```ts
const { isAuthenticated, user, login, logout, isLoading, isFirstAccess, updateUser } = useAuth();
```

Exposto pelo `AuthContext`.

### `usePermissions()`

```ts
const perms = usePermissions();
if (perms.canDeleteUsers) { /* ... */ }
```

Retorna o objeto `Permission` correspondente ao `role` atual.

### `useToast()`

Wrapper sobre **SweetAlert2** com estilos consistentes:

```ts
const toast = useToast();
toast.success('Usuário criado!');
toast.error('Falha ao salvar');
toast.confirm('Deseja excluir?').then(ok => { /* ... */ });
```

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🎨 Estilização

- **CSS Modules-like:** cada componente importa seu próprio `.css` *(ex.: `Dashboard.tsx` + `Dashboard.css`)*.
- **Sem framework CSS** *(Tailwind, MUI, Bootstrap)*: estilos são escritos à mão, mantendo o bundle enxuto e o controle total da identidade visual do PROCON.
- **SweetAlert2** estilizado em [src/utils/alert.css](../ServiceProcon/frontend/src/utils/alert.css).

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 📏 Padrões de código

- **TypeScript estrito** *(via `tsconfig.app.json`)*.
- **Imports absolutos** *(opcional, configurar `vite.config.ts` se quiser)*.
- **Naming:**
  - Componentes: `PascalCase.tsx`
  - Hooks: `useXxx.ts`
  - Services: `xxx.service.ts`
- **ESLint** com:
  - `@eslint/js`
  - `typescript-eslint`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`

Rode `npm run lint` para checar.

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## ▶️ Como rodar

```bash
cd ServiceProcon/frontend

# Instalar dependências
npm install

# Dev server (Vite)
npm run dev
# → http://localhost:5173

# Build de produção
npm run build
# → gera dist/

# Pré-visualização do build
npm run preview

# Linting
npm run lint
```

> 🌐 **Pré-requisito:** ter a **API Admin** rodando em `http://localhost:3002`. Sem ela, o login falhará com `Network Error`.

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🔮 Roadmap do frontend

- [ ] Página `PerguntasPage` para gerenciar a base RAG.
- [ ] Página `AuditLogPage` com filtros avançados.
- [ ] Página `ProconsPage` para CRUD de unidades.
- [ ] Internacionalização *(i18n)*.
- [ ] Dark mode.
- [ ] Tests com Vitest + Testing Library.
- [ ] Deploy automatizado (Vercel/Netlify).

🔝 [Voltar ao topo](#%EF%B8%8F-documentação-do-frontend)

---

## 🔗 Veja também

- [📘 README2 — Documento central](../README2.md)
- [📐 Arquitetura detalhada](./ARCHITECTURE.md)
- [⚙️ Guia de instalação](./INSTALLATION.md)
- [🔌 Referência de API](./API.md)
- [💬 Fluxo do chatbot WhatsApp](./WHATSAPP.md)

---

<p align="center"><sub>Documento mantido pela equipe Azimuth do 6º DSM — Fatec / Jacareí 2026.</sub></p>
