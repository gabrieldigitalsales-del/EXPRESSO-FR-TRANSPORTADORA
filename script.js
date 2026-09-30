try { history.scrollRestoration = 'manual'; } catch (e) {}
window.scrollTo(0, 0);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loader
const loader = document.getElementById('siteLoader');
const loaderLine = document.getElementById('loaderLine');
let loadPct = 0;
const loaderTimer = setInterval(() => {
  loadPct = Math.min(loadPct + (loadPct < 60 ? 6 : loadPct < 82 ? 2.6 : 1.2), 92);
  if (loaderLine) loaderLine.style.width = loadPct + '%';
}, 80);
window.addEventListener('load', () => {
  clearInterval(loaderTimer);
  if (loaderLine) loaderLine.style.width = '100%';
  setTimeout(() => loader?.classList.add('hidden'), reduceMotion ? 20 : 250);
  setTimeout(() => loader?.remove(), reduceMotion ? 80 : 950);
  window.scrollTo(0, 0);
});

// Header + scroll progress
const header = document.getElementById('header');
const progress = document.getElementById('scrollProgress');
function updateHeader() {
  header?.classList.toggle('scrolled', window.scrollY > 24);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = (h ? window.scrollY / h * 100 : 0) + '%';
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
function closeMenu() {
  nav?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    nav.classList.toggle('open', willOpen);
    menuBtn.setAttribute('aria-expanded', String(willOpen));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal, .benefits');
if (reduceMotion) {
  revealEls.forEach(el => {
    el.classList.add('visible');
    if (el.classList.contains('benefits')) el.classList.add('in-view');
  });
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('benefits')) entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  revealEls.forEach(el => io.observe(el));
}

// Hero carousel + copy transition + swipe
const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
const heroDots = Array.from(document.querySelectorAll('.hero-dot'));
const heroProgress = document.getElementById('heroProgress');
const heroKicker = document.getElementById('heroKicker');
const heroTitle1 = document.getElementById('heroTitle1');
const heroTitle2 = document.getElementById('heroTitle2');
const heroText = document.getElementById('heroText');
const heroCopy = document.querySelector('.hero-copy');
const heroEl = document.querySelector('.hero');
let heroIndex = 0;
let heroInterval = null;
let heroProgressFrame = null;
const HERO_DURATION = 3000;

function writeHeroCopy(slide) {
  heroKicker.innerHTML = '<span></span>' + slide.dataset.kicker;
  heroTitle1.textContent = slide.dataset.title1;
  heroTitle2.textContent = slide.dataset.title2;
  heroText.textContent = slide.dataset.text;
}
function changeHeroCopy(slide) {
  if (reduceMotion) {
    writeHeroCopy(slide);
    return;
  }
  heroCopy?.classList.add('is-changing');
  setTimeout(() => {
    writeHeroCopy(slide);
    requestAnimationFrame(() => heroCopy?.classList.remove('is-changing'));
  }, 220);
}
function startHeroProgress() {
  if (reduceMotion || !heroProgress) return;
  if (heroProgressFrame) cancelAnimationFrame(heroProgressFrame);
  const start = performance.now();
  heroProgress.style.width = '0%';
  function tick(now) {
    const pct = Math.min((now - start) / HERO_DURATION, 1);
    heroProgress.style.width = `${pct * 100}%`;
    if (pct < 1) heroProgressFrame = requestAnimationFrame(tick);
  }
  heroProgressFrame = requestAnimationFrame(tick);
}
function setHero(index, animateCopy = true) {
  if (!heroSlides.length) return;
  heroIndex = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === heroIndex));
  heroDots.forEach((dot, i) => dot.classList.toggle('is-active', i === heroIndex));
  animateCopy ? changeHeroCopy(heroSlides[heroIndex]) : writeHeroCopy(heroSlides[heroIndex]);
  startHeroProgress();
}
function startHeroAutoplay() {
  if (reduceMotion || heroSlides.length < 2) return;
  clearInterval(heroInterval);
  heroInterval = setInterval(() => setHero(heroIndex + 1), HERO_DURATION);
}
heroDots.forEach(dot => dot.addEventListener('click', () => {
  setHero(Number(dot.dataset.slide || 0));
  startHeroAutoplay();
}));
if (heroSlides.length) {
  setHero(0, false);
  startHeroAutoplay();
}
let touchX = null;
heroEl?.addEventListener('touchstart', e => { touchX = e.changedTouches[0]?.clientX ?? null; }, { passive: true });
heroEl?.addEventListener('touchend', e => {
  if (touchX == null) return;
  const endX = e.changedTouches[0]?.clientX ?? touchX;
  const delta = endX - touchX;
  touchX = null;
  if (Math.abs(delta) > 55) {
    setHero(heroIndex + (delta < 0 ? 1 : -1));
    startHeroAutoplay();
  }
}, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(heroInterval);
    if (heroProgressFrame) cancelAnimationFrame(heroProgressFrame);
  } else {
    startHeroAutoplay();
    startHeroProgress();
  }
});

// Two-step quote form
const stepTabs = Array.from(document.querySelectorAll('.step-tab'));
const stepPanels = Array.from(document.querySelectorAll('.form-step'));
const statusEl = document.getElementById('formStatus');
let currentStep = 0;
function showStep(step) {
  currentStep = step;
  stepTabs.forEach((tab, i) => tab.classList.toggle('is-active', i === step));
  stepPanels.forEach((panel, i) => panel.classList.toggle('is-active', i === step));
}
function clearInvalid() {
  document.querySelectorAll('.premium-form .invalid').forEach(el => el.classList.remove('invalid'));
  if (statusEl) { statusEl.textContent = ''; statusEl.classList.remove('ok'); }
}
function validateStepOne() {
  clearInvalid();
  const ids = ['qNome', 'qTelefone', 'qOrigem', 'qDestino'];
  const missing = ids.map(id => document.getElementById(id)).filter(el => !el?.value.trim());
  if (missing.length) {
    missing.forEach(el => el.classList.add('invalid'));
    if (statusEl) statusEl.textContent = 'Preencha nome/empresa, telefone, origem e destino para continuar.';
    missing[0]?.focus();
    return false;
  }
  return true;
}
stepTabs.forEach((tab, index) => tab.addEventListener('click', () => {
  if (index === 1 && !validateStepOne()) return;
  showStep(index);
}));
document.querySelector('.next-step')?.addEventListener('click', () => {
  if (validateStepOne()) showStep(1);
});
document.querySelector('.prev-step')?.addEventListener('click', () => showStep(0));

// Attachment feedback
const fileInput = document.getElementById('qArquivo');
const fileLabel = document.getElementById('fileLabel');
fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (fileLabel) fileLabel.textContent = file ? file.name : 'Selecionar imagem ou PDF';
});

// WhatsApp quote
const WA = '5531994422324';
function quoteMessage(data) {
  const lines = [
    'Olá, Expresso FR! Gostaria de solicitar uma cotação de frete.',
    '',
    `Nome / Empresa: ${data.nome}`,
    `Telefone: ${data.tel}`,
    `Origem: ${data.origem}`,
    `Destino: ${data.destino}`,
    `Tipo de carga: ${data.tipo}`,
    `Peso aproximado: ${data.peso || 'Não informado'}`,
    `Urgência: ${data.urgencia || 'Não informada'}`,
    `Observações: ${data.obs || 'Não informado'}`
  ];
  if (data.fileName) {
    lines.push('', `Arquivo selecionado no site: ${data.fileName}`, 'Vou anexar esse arquivo manualmente nesta conversa.');
  }
  return lines.join('\n');
}
document.getElementById('quoteForm')?.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateStepOne()) {
    showStep(0);
    return;
  }
  const g = id => document.getElementById(id)?.value?.trim() || '';
  const fileName = fileInput?.files?.[0]?.name || '';
  const msg = quoteMessage({
    nome: g('qNome'), tel: g('qTelefone'), origem: g('qOrigem'), destino: g('qDestino'),
    tipo: g('qTipo'), peso: g('qPeso'), urgencia: g('qUrgencia'), obs: g('qObs'), fileName
  });
  if (statusEl) {
    statusEl.textContent = fileName ? 'O WhatsApp será aberto. Lembre-se de anexar o arquivo selecionado manualmente.' : 'Abrindo o WhatsApp com os dados da cotação.';
    statusEl.classList.add('ok');
  }
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
});

// FAQ
const faqButtons = document.querySelectorAll('.faq-list article button');
faqButtons.forEach(btn => btn.addEventListener('click', () => {
  const article = btn.parentElement;
  document.querySelectorAll('.faq-list article').forEach(item => {
    if (item !== article) {
      item.classList.remove('open');
      const mark = item.querySelector('button span');
      if (mark) mark.textContent = '+';
    }
  });
  article.classList.toggle('open');
  const currentMark = btn.querySelector('span');
  if (currentMark) currentMark.textContent = article.classList.contains('open') ? '−' : '+';
}));

// V10: move the loader marker with loading progress
const loaderRoadMarker = document.querySelector('.loader-road i');
const originalLoaderInterval = setInterval(() => {
  const width = parseFloat(loaderLine?.style.width || '0');
  if (loaderRoadMarker) loaderRoadMarker.style.left = `${Math.min(width, 100)}%`;
  if (!document.body.contains(loader)) clearInterval(originalLoaderInterval);
}, 90);

// Active section in the header navigation
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const sectionMap = navLinks.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) })).filter(x => x.section);
if ('IntersectionObserver' in window && sectionMap.length) {
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-20% 0px -62% 0px', threshold: [0,.15,.35,.6] });
  sectionMap.forEach(({section}) => navObserver.observe(section));
}

// Counter animation for verified hero metrics
const counters = document.querySelectorAll('.counter[data-count]');
function animateCounter(el) {
  const end = Number(el.dataset.count || 0);
  if (reduceMotion) { el.textContent = String(end); return; }
  const duration = 900;
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now-start)/duration,1);
    const eased = 1 - Math.pow(1-t,3);
    el.textContent = String(Math.round(end*eased));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold:.75 });
counters.forEach(c => counterObserver.observe(c));

// Keep FAQ accessible and synced with aria state
faqButtons.forEach(btn => {
  btn.setAttribute('aria-expanded', btn.parentElement.classList.contains('open') ? 'true' : 'false');
  btn.addEventListener('click', () => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.faq-list article button').forEach(other => other.setAttribute('aria-expanded', String(other.parentElement.classList.contains('open'))));
    });
  });
});
