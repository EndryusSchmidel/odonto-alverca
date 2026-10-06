// Dados da clínica: troque aqui na versão de cada cliente
const CLINIC = {
  name: 'OdontoAlverca Clínica Odontológica',
  whatsapp: '5521995058989',
  // 0 = domingo ... 6 = sábado; minutos desde 00:00
  hours: { 1: [540, 1080], 2: [540, 1080], 3: [540, 1080], 4: [540, 1080], 5: [540, 1080], 6: [480, 720] },
};

// Animação de entrada
const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('has-reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => io.observe(item));
}

// Status "aberto agora"
const clock = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date()).map(({ type, value }) => [type, value]));
const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[clock.weekday];
const minutes = Number(clock.hour) * 60 + Number(clock.minute);
const fmt = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
const status = document.querySelector('#clinic-status');
const today = CLINIC.hours[weekday];
if (status) {
  if (today && minutes >= today[0] && minutes < today[1]) {
    status.textContent = `Aberto agora · atendemos até ${fmt(today[1])}`;
    document.querySelector('.announcement')?.classList.add('is-open');
  } else if (today && minutes < today[0]) {
    status.textContent = `Abrimos hoje às ${fmt(today[0])}`;
  } else {
    const next = [1, 2, 3, 4, 5, 6, 7].map((o) => (weekday + o) % 7).find((d) => CLINIC.hours[d]);
    status.textContent = `Fechado agora · abrimos ${next === (weekday + 1) % 7 ? 'amanhã' : 'segunda'} às ${fmt(CLINIC.hours[next][0])}`;
  }
}
const todayRow = weekday >= 1 && weekday <= 5 ? 1 : weekday;
document.querySelector(`.hours [data-day="${todayRow}"]`)?.classList.add('today');
document.querySelector('#year').textContent = new Date().getFullYear();

// Agende sua avaliação
// Horários de atendimento de cada profissional (agenda online da clínica, out/2026).
// Dias: 0 = domingo ... 6 = sábado; faixas em horas [início, fim)
const TEAM = {
  milena: { label: 'Dra. Milena Alverca', days: { 1: [[9, 13], [14, 18]], 3: [[14, 18.5]], 6: [[8, 12]] } },
  daniel: { label: 'Daniel C. Alverca', days: { 1: [[9, 13], [14, 18]], 2: [[9, 13], [14, 18]], 4: [[10, 13], [15, 21]] } },
};
const WEEK_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEK_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const form = document.querySelector('#booking-form');
const preview = document.querySelector('#booking-preview');
const nameInput = document.querySelector('#booking-name');
const firstVisit = document.querySelector('#first-visit');
const anxious = document.querySelector('#anxious');
const dateChips = document.querySelector('#date-chips');
const timeChips = document.querySelector('#time-chips');
const state = { treatment: 'Clínico geral', pro: 'any', date: null, time: null };

const professionals = (pro) => (pro === 'any' ? Object.values(TEAM) : [TEAM[pro]]);
const slotsFor = (pro, weekdayIndex) => {
  const hours = new Set();
  professionals(pro).forEach((p) => (p.days[weekdayIndex] || []).forEach(([from, to]) => {
    for (let h = from; h < to; h += 1) hours.add(Math.floor(h));
  }));
  return [...hours].sort((x, y) => x - y);
};

// próximas datas em que o profissional atende (a partir de amanhã)
const nextDates = (pro, amount = 6) => {
  const found = [];
  const cursor = new Date();
  for (let i = 0; i < 60 && found.length < amount; i += 1) {
    cursor.setDate(cursor.getDate() + 1);
    const wd = cursor.getDay();
    if (!slotsFor(pro, wd).length) continue;
    const dd = String(cursor.getDate()).padStart(2, '0');
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    found.push({ key: `${mm}-${dd}`, wd, short: `${WEEK_SHORT[wd]} ${dd}/${mm}`, long: `${WEEK_LONG[wd]}, ${dd}/${mm}` });
  }
  return found;
};

const makeChip = (value, label, active) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = `chip${active ? ' is-active' : ''}`;
  chip.dataset.value = value;
  chip.textContent = label;
  return chip;
};

const renderTimes = () => {
  timeChips.replaceChildren();
  const hours = state.date ? slotsFor(state.pro, state.date.wd) : [];
  if (!hours.includes(state.time)) state.time = hours[0] ?? null;
  hours.forEach((h) => timeChips.append(makeChip(h, `${h}h`, h === state.time)));
};

const renderDates = () => {
  dateChips.replaceChildren();
  const dates = nextDates(state.pro);
  state.date = dates.find((d) => state.date && d.key === state.date.key) || dates[0] || null;
  dates.forEach((d) => dateChips.append(makeChip(d.key, d.short, state.date && d.key === state.date.key)));
  renderTimes();
};

const buildMessage = () => {
  const lines = [`Olá! Gostaria de agendar uma avaliação na ${CLINIC.name}.`];
  lines.push(state.treatment ? `Interesse: ${state.treatment}.` : 'Ainda não sei qual tratamento.');
  lines.push(`Profissional: ${state.pro === 'any' ? 'sem preferência' : TEAM[state.pro].label}.`);
  if (state.date) lines.push(`Quando: ${state.date.long}${state.time !== null ? `, às ${state.time}h` : ''}.`);
  if (firstVisit.checked) lines.push('É minha primeira consulta.');
  if (anxious.checked) lines.push('Tenho receio de dentista — prefiro um atendimento com calma.');
  const name = nameInput.value.trim();
  if (name) lines.push(`Nome: ${name}.`);
  return lines.join('\n');
};
const render = () => { preview.textContent = buildMessage(); };

const selectChip = (chip) => {
  const group = chip.parentElement;
  group.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
  const key = group.dataset.group;
  if (key === 'date') {
    state.date = nextDates(state.pro).find((d) => d.key === chip.dataset.value);
    renderTimes();
  } else if (key === 'time') {
    state.time = Number(chip.dataset.value);
  } else {
    state[key] = chip.dataset.value;
    if (key === 'pro') renderDates();
  }
  render();
};
form.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (chip && form.contains(chip)) selectChip(chip);
});
[firstVisit, anxious].forEach((el) => el.addEventListener('change', render));
nameInput.addEventListener('input', render);

// Cards da equipe já escolhem o profissional
document.querySelectorAll('[data-pro]').forEach((button) => {
  button.addEventListener('click', () => {
    const chip = form.querySelector(`[data-group="pro"] [data-value="${button.dataset.pro}"]`);
    if (chip) selectChip(chip);
    document.querySelector('#agendar').scrollIntoView({ behavior: 'smooth' });
  });
});

// Cards de tratamento já preenchem o formulário
document.querySelectorAll('[data-treatment]').forEach((button) => {
  button.addEventListener('click', () => {
    const chip = form.querySelector(`[data-group="treatment"] [data-value="${button.dataset.treatment}"]`);
    if (chip) selectChip(chip);
    document.querySelector('#agendar').scrollIntoView({ behavior: 'smooth' });
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  window.open(`https://api.whatsapp.com/send?phone=${CLINIC.whatsapp}&text=${encodeURIComponent(buildMessage())}`, '_blank', 'noopener');
});
renderDates();
render();

// Botão flutuante
const floatButton = document.querySelector('.whatsapp-float');
const bookingSection = document.querySelector('#agendar');
if (floatButton && bookingSection && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => floatButton.classList.toggle('is-hidden', entry.isIntersecting), { threshold: 0.1 })
    .observe(bookingSection);
}

// Dúvidas: abrir e fechar com animação suave da altura
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.faq-list details').forEach((details) => {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('p');
  let animation = null;

  const finish = (open) => {
    details.open = open;
    details.style.height = '';
    details.classList.remove('is-closing');
    animation = null;
  };

  summary.addEventListener('click', (event) => {
    if (reduceMotion || !details.animate) return;
    event.preventDefault();
    const closing = details.open && !details.classList.contains('is-closing');
    const startHeight = `${details.offsetHeight}px`;
    animation?.cancel();

    if (closing) {
      details.classList.add('is-closing');
      animation = details.animate({ height: [startHeight, `${summary.offsetHeight}px`] }, { duration: 320, easing: 'cubic-bezier(.4, 0, .2, 1)' });
      animation.onfinish = () => finish(false);
    } else {
      details.classList.remove('is-closing');
      details.style.height = startHeight;
      details.open = true;
      const endHeight = `${summary.offsetHeight + answer.offsetHeight + parseFloat(getComputedStyle(answer).marginBottom) + parseFloat(getComputedStyle(answer).marginTop)}px`;
      animation = details.animate({ height: [startHeight, endHeight] }, { duration: 380, easing: 'cubic-bezier(.2, .7, .3, 1)' });
      answer.animate({ opacity: [0, 1], transform: ['translateY(-6px)', 'none'] }, { duration: 380, delay: 60, easing: 'ease-out', fill: 'backwards' });
      animation.onfinish = () => finish(true);
    }
  });
});
