// src/__tests__/helpers/test-data.ts
import { ProconItem } from "../../types/procon.types";

export const mockProconData: ProconItem[] = [
  {
    id: 1,
    tema: "cobranca_servico_nao_contratado",
    pergunta:
      "Estão cobrando um seguro no meu cartão de crédito que eu não contratei. O que posso fazer?",
    resposta:
      "Registrar reclamação no Procon solicitando cancelamento e devolução em dobro.",
    base_legal: ["Art. 42, CDC"],
    documentos: ["RG", "CPF", "Faturas"],
    observacao: "Casos podem variar",
  },
  {
    id: 2,
    tema: "desconto_emprestimo_quitado",
    pergunta:
      "Estão descontando um empréstimo já quitado da minha folha de pagamento. O que devo fazer?",
    resposta:
      "Registrar reclamação solicitando devolução em dobro dos valores descontados.",
    base_legal: ["Art. 42, CDC"],
    documentos: ["RG", "CPF", "Comprovantes de desconto"],
    observacao: "Análise individual",
  },
  {
    id: 3,
    tema: "emprestimo_nao_contratado_beneficio",
    pergunta:
      "Estão descontando do meu benefício um empréstimo que não contratei.",
    resposta:
      "Registrar reclamação solicitando cancelamento e devolução em dobro.",
    base_legal: ["Art. 39, CDC", "Art. 42, CDC"],
    documentos: ["RG", "CPF", "Extrato INSS"],
    observacao: "Valor utilizado pode mudar",
  },
];

// 📱 CENÁRIOS REAIS DE WHATSAPP
export const conversasWhatsApp = [
  {
    descricao: "Cliente educado mas confuso",
    mensagens: [
      "ola bom dia",
      "tudo bem?",
      "preciso de uma ajuda",
      "cobraram um seguro no meu cartao",
      "eu nao contratei isso nao",
      "o que eu faco?"
    ],
    expectativa: {
      primeirasMsgs: "saudacao", // "ola", "bom dia" devem ser tratadas
      quandoPergunta: "cobranca de seguro", // deve cair no ID 1
    }
  },
  {
    descricao: "Cliente direto ao ponto",
    mensagens: [
      "oi",
      "desconto no meu inss que nao fiz emprestimo"
    ],
    expectativa: {
      primeirasMsgs: "saudacao",
      quandoPergunta: "emprestimo nao contratado", // deve cair no ID 3
    }
  },
  {
    descricao: "Cliente nervoso/desesperado",
    mensagens: [
      "ALGUEM ME AJUDA",
      "TA COBRANDO SEGURO NO MEU CARTAO",
      "EU NAO QUERO ISSO",
      "O QUE EU FAÇO"
    ],
    expectativa: {
      primeirasMsgs: "emergencia", // pode tratar palavras em CAIXA ALTA
      quandoPergunta: "cobranca de seguro", // ID 1
    }
  },
  {
    descricao: "Cliente com pergunta vaga",
    mensagens: [
      "boa noite",
      "problema com banco",
      "cobranca indevida"
    ],
    expectativa: {
      primeirasMsgs: "saudacao",
      quandoPergunta: "cobranca indevida", // pode cair em vários, precisa do RAG
    }
  },
  {
    descricao: "Cliente com pergunta fora do contexto",
    mensagens: [
      "e aí",
      "qual o horario de funcionamento do procon?",
      "onde fica a sede?"
    ],
    expectativa: {
      // Essas perguntas NÃO estão no RAG
      // Precisamos de fallback + sugestões
      tipo: "fora_do_escopo",
    }
  }
];

// 🎯 Perguntas que podem vir do WhatsApp (já limpas)
export const perguntasReais = [
  {
    cenario: "Pergunta direta sobre seguro",
    mensagem: "cobraram seguro no cartao",
    idEsperado: 1,
  },
  {
    cenario: "Pergunta sobre empréstimo INSS",
    mensagem: "desconto no inss que nao fiz emprestimo",
    idEsperado: 3,
  },
  {
    cenario: "Pergunta sobre cancelamento",
    mensagem: "quero cancelar meu plano de telefone",
    idEsperado: 5,
  },
  {
    cenario: "Pergunta sobre contrato",
    mensagem: "empresa nao quer entregar contrato",
    idEsperado: 4,
  },
  {
    cenario: "Pergunta sobre multa",
    mensagem: "cobraram multa pra cancelar contrato",
    idEsperado: 9,
  },
  {
    cenario: "Pergunta genérica",
    mensagem: "cobranca indevida no cartao",
    idEsperado: 1, // RAG precisa entender
  },
  {
    cenario: "Pergunta fora do escopo",
    mensagem: "qual o horario de funcionamento",
    idEsperado: null, // fallback, mas deveria dar sugestões
  }
];