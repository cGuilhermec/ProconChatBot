// src/whatsapp/bot.ts
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { processMessage } from "../services/chatbot.service";
import { gerarMensagemCalendario } from "../services/ics.service";
import { ProconInfoIA } from "../services/llama.service";

// ============================================
// TIPAGENS
// ============================================

interface DiaDisponivel {
  data: string;
  diaSemana: string;
  horarios: string[];
}

interface Agendamento {
  AGENDAMENTO_ID: number;
  data_agendamento: string;
  horario_agendamento: Date | string;
  status: string;
}

interface ProconInfo {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  email: string;
  horario_abertura: string;
  horario_fechamento: string;
  horario_funcionamento: string;
  whatsapp_number: string;
  ativo: boolean;
}

interface RespostaApiProcon {
  sucesso: boolean;
  dados?: ProconInfo;
  mensagem?: string;
  erro?: string;
}

interface RespostaApiAgendamento {
  sucesso: boolean;
  dados?: { id: number };
  erro?: string;
}

interface RespostaApiAgendamentos {
  sucesso: boolean;
  dados?: Agendamento[];
  erro?: string;
}

type SessionStep =
  | "MENU_PRINCIPAL"
  | "AGUARDANDO_CPF"
  | "SELECIONANDO_DATA"
  | "SELECIONANDO_HORARIO"
  | "CONFIRMANDO"
  | "CONSULTANDO"
  | "CONSULTANDO_MENU"
  | "CANCELANDO"
  | "SELECIONANDO_CANCELAMENTO"
  | "TIRAR_DUVIDA"
  | "AGUARDANDO_RESPOSTA_IA"
  | "CONVERSANDO_IA";

interface Session {
  step: SessionStep;
  cpf?: string;
  dataSelecionada?: string;
  horarioSelecionado?: string;
  datasDisponiveis?: DiaDisponivel[];
  horariosDisponiveis?: string[];
  agendamentos?: Agendamento[];
  proconId?: number;
  proconInfo?: ProconInfo;
}

// ============================================
// FUNÇÃO AUXILIAR DE FORMATAÇÃO
// ============================================

// ✅ ADICIONE AQUI - depois das interfaces, antes das constantes
function formatarHorario(data: Date | string): string {
  // Se for string, converte para Date
  const dataObj = typeof data === "string" ? new Date(data) : data;

  // ✅ USAR UTC PARA EVITAR FUSO HORÁRIO ERRADO
  // O banco guarda 08:00 UTC, que vira 05:00 local (Brasil)
  const horas = dataObj.getUTCHours().toString().padStart(2, "0");
  const minutos = dataObj.getUTCMinutes().toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

// ============================================
// CONSTANTES
// ============================================

const API_BASE_URL = "http://localhost:3002";

// Palavras de saudação e menu
const SAUDACOES = [
  "oi",
  "olá",
  "ola",
  "bom dia",
  "boa tarde",
  "boa noite",
  "opa",
  "e aí",
  "oie",
];
const COMANDOS_MENU = {
  AGENDAR: ["2", "agendar", "marcar", "horário", "horario"],
  CONSULTAR: ["3", "consultar", "meus agendamentos", "meus horarios"],
  CANCELAR: ["4", "cancelar", "desmarcar"],
  DUVIDA: ["1", "dúvida", "duvida", "pergunta", "ajuda", "informação"],
};

// ============================================
// SESSÕES E CACHE
// ============================================

const userSessions = new Map<string, Session>();
const usuariosAtendidos = new Set<string>();
const proconCache = new Map<string, ProconInfo>();

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM O PROCON
// ============================================

async function buscarProconPorWhatsApp(
  whatsappNumber: string,
): Promise<ProconInfo | null> {
  if (proconCache.has(whatsappNumber)) {
    return proconCache.get(whatsappNumber)!;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/procons/whatsapp/${whatsappNumber}`,
    );
    const data = (await response.json()) as RespostaApiProcon;

    // ✅ LOG PARA VER O QUE A API RETORNA
    console.log("📦 Dados da API:", JSON.stringify(data, null, 2));

    if (data.sucesso && data.dados) {
      console.log("📅 horario_abertura:", data.dados.horario_abertura);
      console.log("📅 horario_fechamento:", data.dados.horario_fechamento);

      const proconInfo = {
        ...data.dados,
        horario_funcionamento: `${formatarHorario(data.dados.horario_abertura)} às ${formatarHorario(data.dados.horario_fechamento)}`,
      };

      console.log(
        "✅ horario_funcionamento formatado:",
        proconInfo.horario_funcionamento,
      );

      proconCache.set(whatsappNumber, proconInfo);
      return proconInfo;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar Procon:", error);
    return null;
  }
}

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM O AGENDAMENTO
// ============================================

async function chamarAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.error(`Erro na API ${url}:`, error);
    return null;
  }
}

async function buscarDiasDisponiveis(
  proconId: number,
): Promise<DiaDisponivel[]> {
  const data = await chamarAPI<{ sucesso: boolean; dados: DiaDisponivel[] }>(
    `${API_BASE_URL}/agendamento/dias-disponiveis?procon_id=${proconId}`,
  );
  return data?.sucesso && data.dados ? data.dados : [];
}

async function buscarHorariosDisponiveis(
  proconId: number,
  data: string,
): Promise<string[]> {
  const result = await chamarAPI<{ sucesso: boolean; horarios: string[] }>(
    `${API_BASE_URL}/agendamento/horarios-disponiveis?procon_id=${proconId}&data=${data}`,
  );
  return result?.sucesso && result.horarios ? result.horarios : [];
}

async function criarAgendamento(data: {
  procon_id: number;
  nome_usuario: string;
  cpf: string;
  telefone: string;
  data_agendamento: string;
  horario_agendamento: string;
}): Promise<{ sucesso: boolean; dados?: { id: number }; erro?: string }> {
  const result = await chamarAPI<RespostaApiAgendamento>(
    `${API_BASE_URL}/agendamento`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        observacao: "Agendamento via WhatsApp",
      }),
    },
  );

  return result || { sucesso: false, erro: "Erro ao criar agendamento" };
}

async function buscarAgendamentosPorCpf(
  cpf: string,
  proconId: number,
): Promise<Agendamento[]> {
  const data = await chamarAPI<RespostaApiAgendamentos>(
    `${API_BASE_URL}/agendamento/buscar-por-cpf?cpf=${cpf}&procon_id=${proconId}`,
  );
  return data?.sucesso && data.dados ? data.dados : [];
}

async function cancelarAgendamento(id: number, cpf: string): Promise<boolean> {
  const result = await chamarAPI<{ sucesso: boolean }>(
    `${API_BASE_URL}/agendamento/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf }),
    },
  );
  return result?.sucesso === true;
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO DE MENSAGENS
// ============================================

function obterMensagemBoasVindas(proconInfo: ProconInfo): string {
  return (
    `🏛️ *${proconInfo.nome.toUpperCase()} - Assistente Virtual*\n\n` +
    `Olá! Sou o assistente do ${proconInfo.nome}. Estou aqui para ajudar você com:\n\n` +
    "🔹 *Direitos do consumidor* - Tire suas dúvidas sobre leis e procedimentos\n" +
    "🔹 *Agendamentos* - Marque ou consulte atendimentos presenciais\n" +
    "🔹 *Orientação* - Entenda como registrar reclamações\n\n" +
    "📌 *Menu Principal:*\n\n" +
    "1️⃣ - Gostaria de tirar alguma dúvida com o procon?\n" +
    "2️⃣ - Agendar atendimento presencial\n" +
    "3️⃣ - Consultar meus agendamentos\n" +
    "4️⃣ - Cancelar agendamento\n" +
    "0️⃣ - Sair\n\n" +
    "💡 *Dica:* Você pode digitar o número ou descrever o que precisa!"
  );
}

function formatarMenu(): string {
  return (
    "📌 *Menu Principal:*\n\n" +
    "1️⃣ - Gostaria de tirar alguma dúvida com o procon?\n" +
    "2️⃣ - Agendar atendimento presencial\n" +
    "3️⃣ - Consultar meus agendamentos\n" +
    "4️⃣ - Cancelar agendamento\n" +
    "0️⃣ - Sair"
  );
}

function formatarListaDatas(datas: DiaDisponivel[]): string {
  if (datas.length === 0) {
    return "❌ Não há datas disponíveis para agendamento no momento.\n\nDigite 0️⃣ para voltar ao menu:";
  }

  let mensagem = "📅 *Datas disponíveis para agendamento:*\n\n";
  datas.forEach((item, index) => {
    mensagem += `${index + 1}️⃣ - ${item.data} (${item.diaSemana})\n`;
  });
  mensagem +=
    "\nDigite o *número* da data desejada ou *0️⃣* para voltar ao menu:";
  return mensagem;
}

function formatarListaHorarios(horarios: string[]): string {
  let mensagem = "🕐 *Horários disponíveis:*\n\n";
  horarios.forEach((horario, index) => {
    const numero = index + 1;
    mensagem += `${numero}. ${horario}\n`;
  });
  mensagem +=
    "\nDigite o *número* do horário desejado ou *0* para voltar às datas:";
  return mensagem;
}

function formatarConfirmacao(
  data: string,
  horario: string,
  proconInfo: ProconInfo,
): string {
  return (
    `✅ *Confirmar agendamento*\n\n` +
    `📅 Data: ${data}\n` +
    `🕐 Horário: ${horario}\n` +
    `📍 ${proconInfo.nome} - ${proconInfo.endereco}\n` +
    `📞 Telefone: ${proconInfo.telefone}\n\n` +
    `Digite *1️⃣* para confirmar ou *2️⃣* para cancelar:`
  );
}

function formatarListaAgendamentos(agendamentos: Agendamento[]): string {
  if (agendamentos.length === 0) {
    return "📋 Você não possui agendamentos.\n\nDigite 0️⃣ para voltar ao menu:";
  }

  let mensagem = "📋 *Seus agendamentos:*\n\n";
  agendamentos.forEach((ag, index) => {
    const data = new Date(ag.data_agendamento).toLocaleDateString("pt-BR");

    let horario = "";
    const horarioRaw = ag.horario_agendamento;
    const horarioDate = new Date(horarioRaw);

    if (!isNaN(horarioDate.getTime())) {
      const horas = horarioDate.getUTCHours().toString().padStart(2, "0");
      const minutos = horarioDate.getUTCMinutes().toString().padStart(2, "0");
      horario = `${horas}:${minutos}`;
    }

    const statusTexto =
      ag.status === "PENDENTE" ? "⏳ Pendente" : "✅ Confirmado";
    mensagem += `${index + 1}️⃣ - ${data} às ${horario} - Status: ${statusTexto}\n`;
  });
  mensagem +=
    "\nDigite o *número* do agendamento para cancelar ou *0️⃣* para voltar:";
  return mensagem;
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO DE MENSAGENS
// ============================================

function isSaudacao(mensagem: string): boolean {
  const msgLower = mensagem.toLowerCase().trim();
  return SAUDACOES.some((s) => msgLower === s || msgLower.includes(s));
}

function identificarIntencao(mensagem: string): string | null {
  const msgLower = mensagem.toLowerCase().trim();

  if (msgLower === "1" || msgLower === "1️⃣") {
    return "DUVIDA";
  }
  if (
    COMANDOS_MENU.AGENDAR.some((c) => msgLower === c || msgLower.includes(c))
  ) {
    return "AGENDAR";
  }
  if (
    COMANDOS_MENU.CONSULTAR.some((c) => msgLower === c || msgLower.includes(c))
  ) {
    return "CONSULTAR";
  }
  if (
    COMANDOS_MENU.CANCELAR.some((c) => msgLower === c || msgLower.includes(c))
  ) {
    return "CANCELAR";
  }
  if (
    msgLower === "0" ||
    msgLower === "0️⃣" ||
    msgLower === "sair" ||
    msgLower === "menu"
  ) {
    return "SAIR";
  }
  return null;
}

async function processarDuvida(
  mensagem: string,
  userId: string,
  proconInfo: ProconInfo, // ✅ Receber o objeto completo, não o ID
): Promise<string> {
  console.log(`🤔 Processando dúvida: "${mensagem}" para ${proconInfo.nome}`);

  // Criar objeto ProconInfoIA para enviar para o processMessage
  const proconInfoIA = {
    id: proconInfo.id,
    nome: proconInfo.nome,
    cidade: proconInfo.cidade,
    estado: proconInfo.estado,
    endereco: proconInfo.endereco,
    telefone: proconInfo.telefone,
    email: proconInfo.email,
    horario_funcionamento: proconInfo.horario_funcionamento,
    whatsapp_number: proconInfo.whatsapp_number,
  };

  // ✅ Passar o objeto proconInfoIA (com todas as informações)
  const respostaRAG = await processMessage(
    mensagem,
    proconInfo.id,
    proconInfoIA,
  );

  return respostaRAG;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

async function handleMessage(
  message: string,
  userId: string,
  nomeUsuario: string,
  proconInfo: ProconInfo,
): Promise<string> {
  const session = userSessions.get(userId);
  const msgTrimmed = message.trim();

  // Log para debug
  console.log(`🔍 Sessão existe? ${userSessions.has(userId)}`);
  if (userSessions.has(userId)) {
    console.log(`📌 Estado da sessão: ${userSessions.get(userId)?.step}`);
  }

  // Se tem sessão ativa, processar pelo estado
  if (session) {
    switch (session.step) {
      case "AGUARDANDO_CPF": {
        const cpf = msgTrimmed.replace(/[^\d]/g, "");
        if (cpf.length !== 11) {
          return "❌ CPF inválido! Digite um CPF válido com 11 dígitos ou *0️⃣* para cancelar:";
        }
        session.cpf = cpf;
        session.step = "SELECIONANDO_DATA";
        userSessions.set(userId, session);

        const datas = await buscarDiasDisponiveis(proconInfo.id);
        if (datas.length === 0) {
          userSessions.delete(userId);
          return "❌ Não há datas disponíveis para agendamento no momento.\n\nDigite *0️⃣* para voltar ao menu:";
        }
        session.datasDisponiveis = datas;
        userSessions.set(userId, session);
        return formatarListaDatas(datas);
      }

      case "SELECIONANDO_DATA": {
        const opcao = parseInt(msgTrimmed);
        if (isNaN(opcao) || opcao === 0) {
          userSessions.delete(userId);
          return formatarMenu();
        }
        if (
          !session.datasDisponiveis ||
          opcao < 1 ||
          opcao > session.datasDisponiveis.length
        ) {
          return "❌ Opção inválida! Digite o número da data desejada ou *0️⃣* para cancelar:";
        }
        const dataSelecionada = session.datasDisponiveis[opcao - 1];
        session.dataSelecionada = dataSelecionada.data;
        session.step = "SELECIONANDO_HORARIO";
        userSessions.set(userId, session);

        const horarios = await buscarHorariosDisponiveis(
          proconInfo.id,
          dataSelecionada.data,
        );
        if (horarios.length === 0) {
          session.step = "SELECIONANDO_DATA";
          userSessions.set(userId, session);
          return (
            "⚠️ Não há horários disponíveis para esta data. Selecione outra data:\n\n" +
            formatarListaDatas(session.datasDisponiveis)
          );
        }
        session.horariosDisponiveis = horarios;
        userSessions.set(userId, session);
        return formatarListaHorarios(horarios);
      }

      case "SELECIONANDO_HORARIO": {
        const opcao = parseInt(msgTrimmed);
        if (isNaN(opcao) || opcao === 0) {
          session.step = "SELECIONANDO_DATA";
          userSessions.set(userId, session);
          return formatarListaDatas(session.datasDisponiveis!);
        }
        if (
          !session.horariosDisponiveis ||
          opcao < 1 ||
          opcao > session.horariosDisponiveis.length
        ) {
          return "❌ Opção inválida! Digite o número do horário desejado ou *0️⃣* para voltar às datas:";
        }
        session.horarioSelecionado = session.horariosDisponiveis[opcao - 1];
        session.step = "CONFIRMANDO";
        userSessions.set(userId, session);
        return formatarConfirmacao(
          session.dataSelecionada!,
          session.horarioSelecionado!,
          proconInfo,
        );
      }

      case "TIRAR_DUVIDA": {
        if (
          msgTrimmed === "0" ||
          msgTrimmed === "0️⃣" ||
          msgTrimmed.toLowerCase() === "menu"
        ) {
          userSessions.delete(userId);
          return formatarMenu();
        }

        // ✅ Passar proconInfo completo (objeto, não o ID)
        const respostaIA = await processarDuvida(
          msgTrimmed,
          userId,
          proconInfo,
        );

        session.step = "CONVERSANDO_IA";
        userSessions.set(userId, session);

        return (
          respostaIA +
          "\n\n💡 *Continue perguntando* ou digite *0️⃣* para voltar ao menu."
        );
      }

      case "CONVERSANDO_IA": {
        if (
          msgTrimmed === "0" ||
          msgTrimmed === "0️⃣" ||
          msgTrimmed.toLowerCase() === "menu"
        ) {
          userSessions.delete(userId);
          return formatarMenu();
        }

        // ✅ Passar proconInfo completo (objeto, não o ID)
        const respostaIA = await processarDuvida(
          msgTrimmed,
          userId,
          proconInfo,
        );

        session.step = "CONVERSANDO_IA";
        userSessions.set(userId, session);

        return (
          respostaIA +
          "\n\n💡 *Continue perguntando* ou digite *0️⃣* para voltar ao menu."
        );
      }

      case "CONFIRMANDO": {
        const opcao = parseInt(msgTrimmed);
        if (isNaN(opcao) || opcao === 2) {
          userSessions.delete(userId);
          return opcao === 2
            ? "❌ Agendamento cancelado. Digite *2️⃣* para um novo agendamento ou *0️⃣* para menu."
            : formatarMenu();
        }
        if (opcao !== 1) {
          return "❌ Opção inválida! Digite *1️⃣* para confirmar ou *2️⃣* para cancelar:";
        }

        const resultado = await criarAgendamento({
          procon_id: proconInfo.id,
          nome_usuario: nomeUsuario,
          cpf: session.cpf!,
          telefone: proconInfo.telefone.replace(/\D/g, ""),
          data_agendamento: session.dataSelecionada!,
          horario_agendamento: session.horarioSelecionado!,
        });

        userSessions.delete(userId);

        if (resultado.sucesso) {
          const mensagemCalendario = await gerarMensagemCalendario({
            nome: nomeUsuario,
            data: session.dataSelecionada!,
            horario: session.horarioSelecionado!,
            endereco: proconInfo.endereco,
            telefone: proconInfo.telefone,
            cpf: session.cpf!,
          });

          return (
            `✅ *AGENDAMENTO CONFIRMADO!*\n\n` +
            `📅 Data: ${session.dataSelecionada}\n` +
            `🕐 Horário: ${session.horarioSelecionado}\n` +
            `📍 ${proconInfo.nome} - ${proconInfo.endereco}\n` +
            `📞 Telefone: ${proconInfo.telefone}\n\n` +
            `${mensagemCalendario}\n\n` +
            `⚠️ Para cancelar, use a opção *4* no menu.\n\n` +
            `🔙 Digite *0️⃣* para voltar ao menu principal.`
          );
        }
        return `❌ Erro ao criar agendamento: ${resultado.erro || "Tente novamente mais tarde"}\n\nDigite *2️⃣* para tentar novamente.`;
      }

      case "CONSULTANDO": {
        if (
          msgTrimmed === "0" ||
          msgTrimmed === "0️⃣" ||
          msgTrimmed.toLowerCase() === "menu"
        ) {
          userSessions.delete(userId);
          return formatarMenu();
        }

        if (!session.cpf) {
          const cpf = msgTrimmed.replace(/[^\d]/g, "");
          if (cpf.length !== 11) {
            return "❌ CPF inválido! Digite um CPF válido com 11 dígitos ou *0️⃣* para voltar ao menu:";
          }
          session.cpf = cpf;
          userSessions.set(userId, session);

          const agendamentos = await buscarAgendamentosPorCpf(
            session.cpf,
            proconInfo.id,
          );

          if (agendamentos.length === 0) {
            userSessions.delete(userId);
            return "📋 Você não possui agendamentos.\n\n🔙 Digite *0️⃣* para voltar ao menu principal.";
          }

          let mensagem = "📋 *Seus agendamentos:*\n\n";
          agendamentos.forEach((ag, index) => {
            const data = new Date(ag.data_agendamento).toLocaleDateString(
              "pt-BR",
            );

            let horario = "";
            const horarioRaw = ag.horario_agendamento;
            const horarioDate = new Date(horarioRaw);

            if (!isNaN(horarioDate.getTime())) {
              const horas = horarioDate
                .getUTCHours()
                .toString()
                .padStart(2, "0");
              const minutos = horarioDate
                .getUTCMinutes()
                .toString()
                .padStart(2, "0");
              horario = `${horas}:${minutos}`;
            }

            const statusTexto =
              ag.status === "PENDENTE" ? "⏳ Pendente" : "✅ Confirmado";
            mensagem += `${index + 1}️⃣ - ${data} às ${horario} - Status: ${statusTexto}\n`;
          });

          session.step = "CONSULTANDO_MENU";
          userSessions.set(userId, session);
          return mensagem + "\n\n🔙 Digite *0️⃣* para voltar ao menu principal.";
        }
        break;
      }

      case "CONSULTANDO_MENU": {
        if (
          msgTrimmed === "0" ||
          msgTrimmed === "0️⃣" ||
          msgTrimmed.toLowerCase() === "menu"
        ) {
          userSessions.delete(userId);
          return formatarMenu();
        }
        userSessions.delete(userId);
        return formatarMenu();
      }

      case "CANCELANDO": {
        if (!session.cpf) {
          const cpf = msgTrimmed.replace(/[^\d]/g, "");
          if (cpf.length !== 11) {
            return "❌ CPF inválido! Digite um CPF válido com 11 dígitos ou *0️⃣* para cancelar:";
          }
          session.cpf = cpf;
          userSessions.set(userId, session);
        }
        const agendamentos = await buscarAgendamentosPorCpf(
          session.cpf,
          proconInfo.id,
        );
        if (agendamentos.length === 0) {
          userSessions.delete(userId);
          return "📋 Você não possui agendamentos para cancelar.\n\n🔙 Digite *0️⃣* para voltar ao menu:";
        }
        session.agendamentos = agendamentos;
        session.step = "SELECIONANDO_CANCELAMENTO";
        userSessions.set(userId, session);
        return formatarListaAgendamentos(agendamentos);
      }

      case "SELECIONANDO_CANCELAMENTO": {
        const opcao = parseInt(msgTrimmed);
        if (isNaN(opcao) || opcao === 0) {
          userSessions.delete(userId);
          return formatarMenu();
        }
        if (
          !session.agendamentos ||
          opcao < 1 ||
          opcao > session.agendamentos.length
        ) {
          return formatarListaAgendamentos(session.agendamentos!);
        }
        const agendamento = session.agendamentos[opcao - 1];
        const sucesso = await cancelarAgendamento(
          agendamento.AGENDAMENTO_ID,
          session.cpf!,
        );
        userSessions.delete(userId);
        if (sucesso) {
          return `✅ Agendamento cancelado com sucesso!\n\n🔙 Digite *0️⃣* para voltar ao menu principal.`;
        }
        return "❌ Erro ao cancelar agendamento. Tente novamente mais tarde.\n\n🔙 Digite *0️⃣* para voltar ao menu.";
      }

      default:
        userSessions.delete(userId);
        break;
    }
  }

  // Verificar se é saudação (primeira mensagem)
  if (!usuariosAtendidos.has(userId) || isSaudacao(msgTrimmed)) {
    usuariosAtendidos.add(userId);
    userSessions.delete(userId);
    return obterMensagemBoasVindas(proconInfo);
  }

  // Sem sessão ativa, identificar intenção
  const intencao = identificarIntencao(msgTrimmed);

  switch (intencao) {
    case "DUVIDA":
      console.log(`📝 Criando nova sessão TIRAR_DUVIDA para ${userId}`);
      userSessions.set(userId, { 
        step: "TIRAR_DUVIDA",
        proconId: proconInfo.id,
        proconInfo: proconInfo
      });
      return "💬 *Nos fale sua dúvida:*\n\nDigite sua pergunta e eu tentarei ajudar.\n\n(ou digite *0️⃣* para voltar ao menu)";

    case "AGENDAR":
      userSessions.set(userId, { step: "AGUARDANDO_CPF", proconId: proconInfo.id, proconInfo });
      return "📝 Para agendar um horário, informe seu *CPF* (apenas números):";

    case "CONSULTAR":
      userSessions.set(userId, { step: "CONSULTANDO", proconId: proconInfo.id, proconInfo });
      return "🔍 Para consultar seus agendamentos, informe seu *CPF* (apenas números):";

    case "CANCELAR":
      userSessions.set(userId, { step: "CANCELANDO", proconId: proconInfo.id, proconInfo });
      return "🗑️ Para cancelar um agendamento, informe seu *CPF* (apenas números):";

    case "SAIR":
      userSessions.delete(userId);
      return "👋 Até mais! Digite *OI* quando precisar de ajuda novamente.";

    default:
      return (
        "❓ *Não entendi o que você deseja.*\n\n" +
        "Por favor, escolha uma das opções do menu:\n\n" +
        formatarMenu()
      );
  }
}

// ============================================
// CONFIGURAÇÃO DO CLIENTE WHATSAPP
// ============================================

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session-data" }),
  puppeteer: {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1280,720",
    ],
  },
  qrMaxRetries: 5,
  authTimeoutMs: 60000,
});

let botWhatsAppNumber = "";

client.on("qr", (qr: string) => {
  console.log("📱 Escaneie o QR Code abaixo com seu WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("✅ WhatsApp autenticado com sucesso!");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  setTimeout(() => client.initialize(), 5000);
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Cliente desconectado:", reason);
  setTimeout(() => client.initialize(), 10000);
});

client.on("ready", async () => {
  console.log("✅ Bot do WhatsApp conectado e pronto!");

  const info = client.info;
  botWhatsAppNumber = info.wid.user;
  console.log(`📱 Bot número: ${botWhatsAppNumber}`);
  console.log(`🎯 Bot está ouvindo mensagens...`);
});

client.on("message", async (message: Message) => {
  try {
    if (message.fromMe) return;
    if (!message.body || message.body.trim() === "") return;
    if (message.from.includes("@g.us")) return;

    const chat = await message.getChat();
    const userId = message.from;

    let nomeUsuario = "Usuário";
    try {
      const contact = await message.getContact();
      nomeUsuario = contact.pushname || contact.name || "Usuário";
    } catch (e) {
      console.warn("Não foi possível obter o nome do contato");
    }

    console.log(`📨 Mensagem de ${userId}: "${message.body}"`);
    console.log(`🔍 Sessão existe? ${userSessions.has(userId)}`);
    if (userSessions.has(userId)) {
      console.log(`📌 Estado da sessão: ${userSessions.get(userId)?.step}`);
    }

    if (!botWhatsAppNumber) {
      await message.reply(
        "⚠️ Bot ainda está inicializando. Aguarde um momento.",
      );
      return;
    }

    const proconInfo = await buscarProconPorWhatsApp(botWhatsAppNumber);

    if (!proconInfo) {
      await message.reply(
        "⚠️ Este número de WhatsApp não está associado a nenhum Procon.\n" +
          "Por favor, entre em contato com a administração.",
      );
      return;
    }

    await chat.sendStateTyping();

    const resposta = await handleMessage(
      message.body,
      userId,
      nomeUsuario,
      proconInfo,
    );

    if (resposta.length > 4000) {
      const partes = resposta.match(/.{1,4000}/g) || [];
      for (const parte of partes) {
        await message.reply(parte);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      await message.reply(resposta);
    }
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    await message.reply(
      "⚠️ Desculpe, estou com um problema técnico no momento.\n" +
        "Por favor, tente novamente em alguns instantes.",
    );
  }
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Erro não tratado:", error);
});

console.log("🚀 Iniciando bot do WhatsApp...");
client.initialize();
