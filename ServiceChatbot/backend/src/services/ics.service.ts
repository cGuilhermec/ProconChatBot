// ServiceChatbot/backend/src/services/ics.service.ts

export interface EventoData {
  nome: string;
  data: string;
  horario: string;
  endereco: string;
  telefone: string;
  cpf: string;
}

/**
 * Encurta uma URL usando TinyURL API (gratuito, sem necessidade de API key)
 */
async function encurtarUrl(url: string): Promise<string> {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
    );
    const shortUrl = await response.text();
    return shortUrl || url;
  } catch (error) {
    console.error("Erro ao encurtar URL:", error);
    return url; // Retorna URL original se falhar
  }
}

/**
 * Gera um link para adicionar o evento no Google Calendar
 */
export function gerarLinkGoogleCalendar(evento: EventoData): string {
  // Extrair data e horário
  const [ano, mes, dia] = evento.data.split("-");
  const [hora, minuto] = evento.horario.split(":");

  // Formatar datas para o Google Calendar (YYYYMMDDTHHMMSS)
  const dataInicio = `${ano}${mes}${dia}T${hora}${minuto}00`;
  const horaFim = parseInt(hora) + 1;
  const dataFim = `${ano}${mes}${dia}T${horaFim.toString().padStart(2, "0")}${minuto}00`;

  // Preparar os parâmetros da URL (descrição mais curta)
  const titulo = encodeURIComponent(`Procon Jacareí - ${evento.nome}`);

  // Descrição resumida para manter o link menor
  const descricao = encodeURIComponent(
    `Agendamento Procon Jacareí\nCPF: ${evento.cpf}\nTelefone: ${evento.telefone}\n\nLevar RG e CPF originais. Chegar com 10min de antecedência.`,
  );

  const local = encodeURIComponent(evento.endereco);

  // Montar URL do Google Calendar
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${dataInicio}/${dataFim}&details=${descricao}&location=${local}&sf=true&output=xml`;
}

/**
 * Gera um link encurtado para o Google Calendar
 */
export async function gerarLinkGoogleCalendarEncurtado(
  evento: EventoData,
): Promise<string> {
  const urlLonga = gerarLinkGoogleCalendar(evento);
  return await encurtarUrl(urlLonga);
}

/**
 * Gera um link para o Apple Calendar (iCal)
 */
export function gerarLinkAppleCalendar(evento: EventoData): string {
  const [ano, mes, dia] = evento.data.split("-");
  const [hora, minuto] = evento.horario.split(":");

  const dataInicio = `${ano}${mes}${dia}T${hora}${minuto}00`;
  const horaFim = parseInt(hora) + 1;
  const dataFim = `${ano}${mes}${dia}T${horaFim.toString().padStart(2, "0")}${minuto}00`;

  const titulo = encodeURIComponent(`Procon Jacareí - ${evento.nome}`);
  const descricao = encodeURIComponent(
    `Agendamento Procon Jacareí - CPF: ${evento.cpf}`,
  );
  const local = encodeURIComponent(evento.endereco);

  return `webcal://p01-calendars.icloud.com/publisher/1?title=${titulo}&dtstart=${dataInicio}&dtend=${dataFim}&location=${local}&description=${descricao}`;
}

/**
 * Gera uma mensagem completa com link encurtado para o Google Calendar
 */
export async function gerarMensagemCalendario(
  evento: EventoData,
): Promise<string> {
  const googleLink = await gerarLinkGoogleCalendarEncurtado(evento);

  return (
    `📱 *Adicionar ao seu calendário:*\n\n` +
    `🔗 *Google Calendar (recomendado):*\n` +
    `${googleLink}\n\n` +
    `💡 *Como adicionar:*\n` +
    `1. Clique no link acima\n` +
    `2. Verifique os dados do evento\n` +
    `3. Clique em "Salvar" - pronto! ✅\n\n` +
    `📝 *Adicionar manualmente:*\n` +
    `• Data: ${evento.data} às ${evento.horario}\n` +
    `• Local: ${evento.endereco}\n` +
    `• Duração: 30 minutos\n` +
    `• Observação: Levar RG, CPF e documentos relacionados`
  );
}

/**
 * Gera um arquivo ICS (formato texto) para quem preferir baixar
 */
export function gerarArquivoICSTexto(evento: EventoData): string {
  const [ano, mes, dia] = evento.data.split("-");
  const [hora, minuto] = evento.horario.split(":");

  // Criar data no formato ICS (YYYYMMDDTHHMMSS)
  const dataInicio = `${ano}${mes}${dia}T${hora}${minuto}00`;
  const horaFim = parseInt(hora) + 1;
  const dataFim = `${ano}${mes}${dia}T${horaFim.toString().padStart(2, "0")}${minuto}00`;

  const uid = `${Date.now()}-${evento.cpf}@proconjacarei.com.br`;

  return (
    `BEGIN:VCALENDAR\r\n` +
    `VERSION:2.0\r\n` +
    `PRODID:-//Procon Jacareí//Agendamento//PT\r\n` +
    `CALSCALE:GREGORIAN\r\n` +
    `METHOD:PUBLISH\r\n` +
    `BEGIN:VEVENT\r\n` +
    `UID:${uid}\r\n` +
    `SUMMARY:Procon Jacareí - ${evento.nome}\r\n` +
    `DESCRIPTION:Agendamento presencial no Procon de Jacareí.\\n\\nCPF: ${evento.cpf}\\nTelefone: ${evento.telefone}\\n\\nLevar RG e CPF originais.\\nChegar com 10 minutos de antecedência.\r\n` +
    `DTSTART:${dataInicio}\r\n` +
    `DTEND:${dataFim}\r\n` +
    `LOCATION:${evento.endereco}\r\n` +
    `STATUS:CONFIRMED\r\n` +
    `BEGIN:VALARM\r\n` +
    `TRIGGER:-PT1H\r\n` +
    `ACTION:DISPLAY\r\n` +
    `DESCRIPTION:Lembrete: Você tem um agendamento no Procon Jacareí em 1 hora!\r\n` +
    `END:VALARM\r\n` +
    `END:VEVENT\r\n` +
    `END:VCALENDAR`
  );
}

/**
 * Gera uma mensagem com instruções para baixar o arquivo ICS
 */
export function gerarMensagemICS(evento: EventoData): string {
  const icsContent = gerarArquivoICSTexto(evento);

  return (
    `📎 *Arquivo para importar no calendário:*\n\n` +
    `Para adicionar este compromisso no seu calendário, siga as instruções:\n\n` +
    `1. Copie o texto abaixo\n` +
    `2. Cole no Bloco de Notas\n` +
    `3. Salve com o nome "agendamento_procon.ics"\n` +
    `4. Abra o arquivo - o celular vai perguntar se quer adicionar ao calendário\n` +
    `5. Confirme e pronto! ✅\n\n` +
    `--- COPIAR TEXTO ABAIXO ---\n` +
    `${icsContent}\n` +
    `--- FIM DO ARQUIVO ICS ---\n\n` +
    `📝 *Dados do agendamento:*\n` +
    `• Data: ${evento.data} às ${evento.horario}\n` +
    `• Local: ${evento.endereco}\n` +
    `• Duração: 30 minutos`
  );
}
