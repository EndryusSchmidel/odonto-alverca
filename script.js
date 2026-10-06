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
const form = document.querySelector('#booking-form');
const preview = document.querySelector('#booking-preview');
const nameInput = document.querySelector('#booking-name');
const firstVisit = document.querySelector('#first-visit');
const anxious = document.querySelector('#anxious');
const state = { treatment: 'Clínico geral', day: 'O quanto antes', period: 'tarde' };

const buildMessage = () => {
  const lines = [`Olá! Gostaria de agendar uma avaliação na ${CLINIC.name}.`];
  lines.push(state.treatment ? `Interesse: ${state.treatment}.` : 'Ainda não sei qual tratamento.');
  lines.push(`Quando: ${state.day}, de ${state.period}.`);
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
  state[group.dataset.group] = chip.dataset.value;
  render();
};
form.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => selectChip(chip)));
[firstVisit, anxious].forEach((el) => el.addEventListener('change', render));
nameInput.addEventListener('input', render);

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
