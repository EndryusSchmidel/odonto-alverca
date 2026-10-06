// DEMONSTRAÇÃO de assistente no site (gerado por propostas/prospeccao-odonto/gerar-chat.py).
// Não usa IA de verdade: responde com textos do próprio site da clínica e monta o agendamento em etapas.
// Na versão contratada, o mesmo painel liga a um assistente real. Reaproveita CLINIC (e, se houver, TEAM/nextDates/slotsFor) de script.js.

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const TREATMENTS = [
  ['Reabilitação', 'Reabilitação oral e estética'], ['Implantes', 'Implantes'], ['Prótese', 'Prótese'], ['Ortodontia', 'Ortodontia'],
  ['Canal', 'Endodontia'], ['DTM', 'DTM'], ['Bucomaxilo', 'Bucomaxilo'], ['Infantil', 'Odontopediatria'], ['Check-up', 'Clínico geral'], ['Ainda não sei', ''],
];

const CFG = {
  title: 'Assistente OdontoAlverca',
  greeting: 'Oi! Sou o assistente virtual da OdontoAlverca (demonstração). Posso tirar dúvidas sobre a clínica e deixar sua avaliação encaminhada. Como posso ajudar?',
  quick: [['Quais especialidades?', 'servicos'], ['Como é a 1ª consulta?', 'primeira'], ['Quanto custa implante?', 'custo'], ['Tenho medo de dentista', 'medo'], ['Equipe e horários', 'equipe'], ['Onde fica?', 'local']],
  faq: [
    { id: 'servicos', words: ['especialidade', 'trata', 'servico', 'fazem', 'atendem'], text: 'Implantodontia, prótese, ortodontia, endodontia, DTM, cirurgia bucomaxilofacial, odontopediatria e clínico geral, com foco em reabilitação oral e estética.' },
    { id: 'reab', words: ['reabilitacao', 'estetica', 'sorriso harmonioso'], text: 'Reabilitação oral e estética é o foco da clínica: devolver função, conforto e um sorriso harmonioso, com planejamento completo do começo ao fim.' },
    { id: 'implante', words: ['implante', 'implantodontia', 'dente perdido', 'perdi dente'], text: 'Com os implantes você repõe dentes perdidos com segurança e volta a mastigar e sorrir sem preocupação.' },
    { id: 'protese', words: ['protese', 'dentadura', 'chapa'], text: 'As próteses, fixas e removíveis, são planejadas para conforto, função e um sorriso natural.' },
    { id: 'orto', words: ['ortodontia', 'aparelho', 'alinhador', 'dentes tortos'], text: 'Ortodontia com aparelho ou alinhadores, para crianças e adultos, com acompanhamento em cada fase.' },
    { id: 'canal', words: ['canal', 'endodontia', 'dor de dente', 'dente doendo'], text: 'O tratamento de canal salva o dente e alivia a dor, com técnica moderna. Se a dor estiver forte, ligue para a clínica para encaixarmos você.' },
    { id: 'dtm', words: ['dtm', 'mandibula', 'estalo', 'bruxismo', 'ranger', 'rang', 'aperto os dentes', 'dor orofacial'], text: 'Avaliamos e tratamos dores na mandíbula, estalos e bruxismo (DTM e dor orofacial).' },
    { id: 'cirurgia', words: ['siso', 'extracao', 'cirurgia', 'tirar dente', 'bucomaxilo'], text: 'Fazemos extrações, inclusive de siso, e cirurgias orais, com planejamento e segurança.' },
    { id: 'infantil', words: ['crianca', 'filho', 'infantil', 'odontopediatria', 'bebe'], text: 'Sim, temos odontopediatria, com atendimento acolhedor para os pequenos. Avise no agendamento a idade da criança para organizarmos o atendimento.' },
    { id: 'custo', words: ['custa', 'preco', 'valor', 'caro', 'orcamento', 'quanto', 'pagar', 'parcel'], booking: true, text: 'O valor de um implante depende de quantos dentes, do tipo de prótese e do planejamento de cada caso, por isso não passo preço pelo chat. A avaliação vem primeiro: você sai sabendo etapas, prazos e valores, sem compromisso.' },
    { id: 'primeira', words: ['primeira consulta', 'como funciona', 'avaliacao', 'o que acontece', 'radiografia'], text: 'A primeira consulta começa com uma conversa sobre o que incomoda você, seguida de exame clínico e, quando indicado, radiografias. Ao final, você recebe o plano de tratamento explicado, e só começamos quando você se sentir seguro.' },
    { id: 'completo', words: ['tratamento completo', 'tudo num lugar', 'varias especialidades', 'consultorio em consultorio'], text: 'Sim. Com várias especialidades no mesmo endereço, é possível planejar e executar a reabilitação sem ir de consultório em consultório.' },
    { id: 'medo', words: ['medo', 'receio', 'ansios', 'nervos', 'dói', 'doi', 'dor'], text: 'Você pode contar isso logo no agendamento. A consulta começa com conversa, cada etapa é explicada antes e você pode pedir pausa a qualquer momento.' },
    { id: 'equipe', words: ['equipe', 'dra', 'doutora', 'milena', 'daniel', 'profissional', 'dentista', 'quem', 'horario de atendimento'], text: 'A Dra. Milena Alverca é a responsável técnica (CRO-RJ 46-713). Horários: Dra. Milena, segunda 9h–18h, quarta 14h–18h30 e sábado 8h–12h. Daniel C. Alverca, segunda e terça 9h–18h e quinta 10h–13h e 15h–21h. A recepção confirma a disponibilidade do dia.' },
    { id: 'local', words: ['onde', 'endereco', 'fica', 'local', 'chegar', 'rua', 'horario', 'abre', 'fecha', 'aberto', 'funciona', 'sabado', 'telefone', 'whatsapp', 'ligar'], text: () => `Ficamos na Av. Brigadeiro Lima e Silva, 1939, sala 1007, 25 de Agosto, Duque de Caxias. A clínica atende de segunda a sexta, das 9h às 18h, e aos sábados, das 8h às 12h. ${botStatus()} Telefone (21) 3842-2605 e WhatsApp (21) 99505-8989.` },
  ],
  steps: [
    { key: 'treatment', ask: 'Vamos deixar sua avaliação encaminhada. Qual especialidade você quer?', options: () => TREATMENTS.map(([label, value]) => [label, value]) },
    { key: 'pro', ask: 'Com quem você prefere agendar?', options: () => [['Dra. Milena', 'milena'], ['Daniel', 'daniel'], ['Sem preferência', 'any']] },
    { key: 'date', ask: 'Que dia fica melhor para você?', options: (d) => nextDates(d.pro, 6).map((x) => [x.short, x]) },
    { key: 'time', ask: 'E o horário?', options: (d) => slotsFor(d.pro, d.date.wd).map((h) => [`${h}h`, h]) },
    { key: 'name', text: true, ask: 'Qual o seu nome?', clean: (t) => t.split(/\s+/)[0].slice(0, 30) },
  ],
  message: (d) => {
    const lines = [`Olá! Gostaria de agendar uma avaliação na ${CLINIC.name}.`];
    lines.push(d.treatment ? `Interesse: ${d.treatment}.` : 'Ainda não sei qual tratamento.');
    lines.push(`Profissional: ${d.pro === 'any' ? 'sem preferência' : TEAM[d.pro].label}.`);
    lines.push(`Quando: ${d.date.long}, às ${d.time}h.`);
    if (d.name) lines.push(`Nome: ${d.name}.`);
    return lines;
  },
  summary: (d) => `${d.treatment || 'avaliação'}, ${d.pro === 'any' ? 'sem preferência de profissional' : TEAM[d.pro].label}, ${d.date.long}, às ${d.time}h`,
};


const botStatus = () => {
  const clock = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[clock.weekday];
  const min = Number(clock.hour) * 60 + Number(clock.minute);
  const today = CLINIC.hours[wd];
  if (today && min >= today[0] && min < today[1]) return 'Estamos abertos agora.';
  return 'No momento estamos fechados, e a recepção responde assim que abrir.';
};

(() => {
  const root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML = `
    <button type="button" class="chat-launcher" aria-label="Abrir assistente virtual" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
      <span>Tire suas dúvidas</span>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="${CFG.title}" hidden>
      <header class="chat-head">
        <div>
          <strong>${CFG.title}</strong>
          <small>Demonstração · respostas baseadas no site da clínica</small>
        </div>
        <button type="button" class="chat-close" aria-label="Fechar">×</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-quick"></div>
      <form class="chat-form" autocomplete="off">
        <input type="text" class="chat-input" placeholder="Digite sua dúvida..." aria-label="Digite sua dúvida" />
        <button type="submit" class="chat-send" aria-label="Enviar">→</button>
      </form>
      <p class="chat-note">O assistente não dá diagnóstico nem passa preço. A recepção confirma tudo.</p>
    </section>`;
  document.body.append(root);

  const launcher = root.querySelector('.chat-launcher');
  const panel = root.querySelector('.chat-panel');
  const log = root.querySelector('.chat-log');
  const quick = root.querySelector('.chat-quick');
  const form = root.querySelector('.chat-form');
  const input = root.querySelector('.chat-input');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let flow = null;
  let greeted = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (who, text) => {
    const el = document.createElement('p');
    el.className = `chat-msg chat-${who}`;
    el.textContent = text;
    log.append(el);
    scroll();
    return el;
  };
  const addLink = (label, href, external = true) => {
    const a = document.createElement('a');
    a.className = 'chat-cta';
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.textContent = label;
    log.append(a);
    scroll();
  };
  const setQuick = (items) => {
    quick.replaceChildren();
    items.forEach(([label, fn]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = label;
      b.addEventListener('click', () => { addMsg('user', label); fn(); });
      quick.append(b);
    });
  };
  const bot = (text, after) => {
    const typing = addMsg('bot', '…');
    typing.classList.add('is-typing');
    setTimeout(() => {
      typing.classList.remove('is-typing');
      typing.textContent = text;
      scroll();
      after?.();
    }, reduce ? 0 : 650);
  };

  const answer = (id) => {
    const item = CFG.faq.find((f) => f.id === id);
    const text = typeof item.text === 'function' ? item.text() : item.text;
    bot(text, () => {
      if (item.cta) addLink(item.cta.label, item.cta.href, !!item.cta.external);
      menu(item.booking);
    });
  };
  const menu = (withBooking) => setQuick([
    ...CFG.quick.map(([label, id]) => [label, () => answer(id)]),
    ['Quero agendar', startFlow],
  ]);

  // Fluxo de agendamento (pré-agendamento: a recepção confirma)
  const cancel = () => { flow = null; bot('Claro! Qual é a sua dúvida?', menu); };
  const startFlow = () => { flow = { i: -1, data: {}, text: null }; nextStep(); };
  const nextStep = () => {
    do { flow.i += 1; } while (flow.i < CFG.steps.length && CFG.steps[flow.i].when && !CFG.steps[flow.i].when(flow.data));
    if (flow.i >= CFG.steps.length) { finish(); return; }
    const step = CFG.steps[flow.i];
    if (step.text) {
      flow.text = step;
      bot(step.ask, () => { setQuick(step.skip ? [[step.skip, () => { flow.text = null; nextStep(); }]] : []); input.focus(); });
      return;
    }
    const opts = step.options(flow.data);
    bot(step.ask, () => setQuick([
      ...opts.map(([label, value]) => [label, () => { flow.data[step.key] = value; nextStep(); }]),
      ['Outra dúvida', cancel],
    ]));
  };
  const finish = () => {
    const d = flow.data;
    const lines = [...CFG.message(d), '(Pedido feito pelo assistente do site)'];
    const summary = CFG.summary(d);
    flow = null;
    bot(`Pronto${d.name ? `, ${d.name}` : ''}! Deixei seu pedido montado: ${summary}. Toque abaixo para enviar à recepção, que confirma a disponibilidade com você.`, () => {
      addLink('Enviar para a recepção no WhatsApp →', `https://api.whatsapp.com/send?phone=${CLINIC.whatsapp}&text=${encodeURIComponent(lines.join('\n'))}`);
      menu();
    });
  };

  const interpret = (text) => {
    const q = norm(text);
    if (/(agendar|marcar|reservar|quero ir)/.test(q) || (/(consulta|avaliacao)/.test(q) && !/(primeira|como funciona)/.test(q))) return 'agendar';
    let best = null; let bestScore = 0;
    CFG.faq.forEach((f) => {
      const score = f.words.reduce((n, w) => n + (q.includes(norm(w)) ? 1 : 0), 0);
      if (score > bestScore) { best = f.id; bestScore = score; }
    });
    return best;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);
    if (flow && flow.text) {
      const step = flow.text;
      flow.data[step.key] = step.clean ? step.clean(text) : text;
      flow.text = null;
      nextStep();
      return;
    }
    if (flow) { bot('Para continuar o agendamento, escolha uma das opções acima. Se preferir, toque em "Outra dúvida".'); return; }
    const found = interpret(text);
    if (found === 'agendar') { startFlow(); return; }
    if (found) { answer(found); return; }
    bot('Não tenho essa informação com segurança. Posso deixar seu pedido encaminhado para a recepção, que responde direitinho. Quer agendar uma avaliação?', () => setQuick([['Quero agendar', startFlow], ['Outra dúvida', cancel]]));
  });

  const open = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    if (!greeted) { greeted = true; addMsg('bot', CFG.greeting); menu(); }
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    launcher.focus();
  };
  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('.chat-close').addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) close(); });
})();
