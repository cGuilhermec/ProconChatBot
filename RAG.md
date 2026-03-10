# 📚 Documentação do Sistema RAG Procon

## 📋 Índice

- [Visão Geral](#visão-geral)
- [O que é RAG?](#o-que-é-rag)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Estratégias de Busca](#estratégias-de-busca)
- [Fluxo de Funcionamento](#fluxo-de-funcionamento)
- [Implementação Técnica](#implementação-técnica)
- [Estrutura de Dados](#estrutura-de-dados)
- [API Endpoints](#api-endpoints)
- [Como Usar](#como-usar)
- [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

Este projeto implementa um sistema RAG (Retrieval-Augmented Generation) especializado em direitos do consumidor e Procon. O sistema é capaz de entender perguntas dos usuários e encontrar as respostas mais relevantes em uma base de dados estruturada, retornando informações precisas como respostas, base legal e documentação necessária.

---

## 🤔 O que é RAG?

RAG (Retrieval-Augmented Generation) é uma técnica que combina:

- **Recuperação (Retrieval):** Busca e encontra informações relevantes em uma base de dados
- **Geração (Generation):** Apresenta as informações recuperadas de forma estruturada

No nosso contexto:
```typescript
RAG = Mecanismo de Busca Inteligente + Base de Conhecimento Estruturada
```

### Componentes do RAG:

- **Base de Conhecimento:** JSON com perguntas, respostas e metadados
- **Indexador:** Organiza os dados para busca eficiente
- **Buscador:** Encontra os itens mais relevantes
- **Rankeamento:** Pontua e ordena resultados por relevância

---

## 🏗️ Arquitetura do Projeto
```bash
backend/
├── src/
│   ├── api/
│   │   └── api.ts                    # API REST
│   ├── data/
│   │   └── procon-data.json          # Base de conhecimento
│   ├── services/
│   │   └── buscador.service.ts       # Lógica principal do RAG
│   ├── types/
│   │   └── procon.types.ts           # Tipos TypeScript
│   └── index.ts                      # CLI para testes
├── package.json
└── tsconfig.json
```

### Fluxo de Dados:
```text
Pergunta → Tokenização → Stemming → Busca → Pontuação → Resposta
   ↑           ↑            ↑          ↑          ↑           ↑
Usuário    Processamento  Raízes    Múltiplas   Ranking   JSON +
           de texto      das palavras estratégias          Metadados
```

---

## 🔍 Estratégias de Busca

### 1. Índice de Palavras-chave

Mapeamento rápido de termos para IDs relevantes:
```typescript
{
  "cobranca":  [1, 2, 3, 6],  // IDs relacionados a cobrança
  "seguro":    [1],            // Apenas ID 1 (seguro não contratado)
  "cartao":    [1],            // ID 1 (seguro no cartão)
  "emprestimo":[2, 3],         // IDs de empréstimos
  "inss":      [3, 6],         // IDs de benefícios INSS
  "cancelar":  [5, 9],         // IDs de cancelamento
  "contrato":  [4, 9],         // IDs de contratos
  "multa":     [9]             // ID de multas
}
```

---

### 2. Processamento de Texto

#### Tokenização

Divide a pergunta em palavras individuais:
```text
"Cobraram seguro no cartão" → ["Cobraram", "seguro", "no", "cartão"]
```

#### Remoção de Stopwords

Remove palavras que não agregam relevância:
```typescript
const stopwords = new Set([
  "um", "uma", "o", "a", "os", "as", "de", "do", "da", "para", "com",
  "que", "qual", "quais", "quem", "como", "quando", "onde", "porque"
]);
```
```text
["Cobraram", "seguro", "no", "cartão"] → ["Cobraram", "seguro", "cartão"]
```

#### Stemming em Português

Reduz palavras à sua raiz:
```typescript
"cobrando" → "cobr"
"cobrança" → "cobr"
"cobraram" → "cobr"
"seguro"   → "segur"
"cartão"   → "cart"
```

---

### 3. Busca Difusa com Fuse.js

Configuração para encontrar termos aproximados:
```typescript
this.fuse = new Fuse(this.data, {
  keys: [
    { name: 'pergunta', weight: 0.5 },  // Campo mais importante
    { name: 'tema',     weight: 0.3 },  // Segundo mais importante
    { name: 'resposta', weight: 0.2 }   // Menos importante
  ],
  threshold: 0.4,         // Tolerância a erros (0 = perfeito, 1 = qualquer coisa)
  includeScore: true,     // Inclui pontuação no resultado
  ignoreLocation: true,   // Ignora posição das palavras
  minMatchCharLength: 3   // Mínimo de caracteres para match
});
```

---

### 4. Sistema de Pontuação

| Tipo de Match       | Pontuação      |
|---------------------|----------------|
| Palavra-chave exata | +2 pontos      |
| Termo no texto      | +1 ponto       |
| Match difuso        | Score Fuse.js  |

**Cálculo final:**
```typescript
score = pontos_obtidos / total_palavras_relevantes
```

**Classificação de Confiança:**

- 🟢 **Alta:** `score > 0.7`
- 🟡 **Média:** `0.3 < score ≤ 0.7`
- 🔴 **Baixa:** `score ≤ 0.3` (fallback)

---

## 🔄 Fluxo de Funcionamento

### Exemplo Prático

**Pergunta:** `"Cobraram seguro no cartão"`

| Etapa | Processamento | Resultado |
|-------|--------------|-----------|
| 1. Tokenização | `split()` | `["Cobraram", "seguro", "no", "cartão"]` |
| 2. Stopwords | Remoção | `["Cobraram", "seguro", "cartão"]` |
| 3. Stemming | Stemmer | `["cobr", "segur", "cart"]` |
| 4. Match | Índice | `"cobr"` → IDs `[1,2,3,6]` / `"segur"` → ID `[1]` / `"cart"` → ID `[1]` |
| 5. Pontuação | Cálculo | ID 1: 3 matches → score `1.0` |
| 6. Resultado | ID 1 | Resposta sobre seguro não contratado |