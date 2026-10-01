try { history.scrollRestoration = 'manual'; } catch (e) {}
window.scrollTo(0, 0);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loader — 2 seconds
const loader = document.getElementById('siteLoader');
const loaderLine = document.getElementById('loaderLine');
const loaderStartedAt = performance.now();
const LOADER_DURATION = reduceMotion ? 120 : 2000;
let loaderFrame = null;
function animateLoader(now) {
  const pct = Math.min((now - loaderStartedAt) / LOADER_DURATION, 1);
  if (loaderLine) loaderLine.style.width = `${pct * 100}%`;
  if (pct < 1) loaderFrame = requestAnimationFrame(animateLoader);
}
loaderFrame = requestAnimationFrame(animateLoader);
let loaderDismissed = false;
function dismissLoader() {
  if (loaderDismissed) return;
  loaderDismissed = true;
  const elapsed = performance.now() - loaderStartedAt;
  const remaining = Math.max(0, LOADER_DURATION - elapsed);
  setTimeout(() => {
    if (loaderLine) loaderLine.style.width = '100%';
    loader?.classList.add('hidden');
    setTimeout(() => loader?.remove(), reduceMotion ? 80 : 700);
    window.scrollTo(0, 0);
  }, remaining);
}

if (document.readyState === 'complete') {
  dismissLoader();
} else {
  window.addEventListener('load', dismissLoader, { once: true });
}
// Fallback: o site nunca fica preso na tela de carregamento.
setTimeout(dismissLoader, LOADER_DURATION + 1200);

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

// Quote form — four steps
const stepTabs = Array.from(document.querySelectorAll('.step-tab'));
const stepPanels = Array.from(document.querySelectorAll('.form-step'));
const statusEl = document.getElementById('formStatus');
const quoteForm = document.getElementById('quoteForm');
let currentStep = 0;

const stepFields = [
  ['qResponsavel', 'qTelefone', 'qClienteDocumento'],
  ['qColetaEmpresa', 'qColetaCidade', 'qColetaDocumento', 'qColetaCep', 'qColetaEndereco'],
  ['qDestinoEmpresa', 'qDestinoCidade', 'qDestinoDocumento', 'qDestinoCep', 'qDestinoEndereco'],
  ['qVolumes', 'qPeso']
];

function showStep(step) {
  currentStep = Math.max(0, Math.min(step, stepPanels.length - 1));
  stepTabs.forEach((tab, i) => tab.classList.toggle('is-active', i === currentStep));
  stepPanels.forEach((panel, i) => panel.classList.toggle('is-active', i === currentStep));
  if (window.innerWidth < 720) {
    document.querySelector('.premium-form')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}
function clearInvalid() {
  document.querySelectorAll('.premium-form .invalid').forEach(el => el.classList.remove('invalid'));
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.classList.remove('ok');
  }
}
function validateStep(step) {
  clearInvalid();
  const missing = (stepFields[step] || []).map(id => document.getElementById(id)).filter(el => !el?.value.trim());
  if (missing.length) {
    missing.forEach(el => el.classList.add('invalid'));
    if (statusEl) statusEl.textContent = 'Preencha os campos obrigatórios destacados para continuar.';
    missing[0]?.focus();
    return false;
  }
  if (step === 0) {
    const tel = document.getElementById('qTelefone');
    const digits = (tel?.value || '').replace(/\D/g, '');
    if (digits.length < 10) {
      tel?.classList.add('invalid');
      if (statusEl) statusEl.textContent = 'Informe um telefone válido com DDD.';
      tel?.focus();
      return false;
    }
  }
  const docId = step === 0 ? 'qClienteDocumento' : step === 1 ? 'qColetaDocumento' : step === 2 ? 'qDestinoDocumento' : null;
  if (docId) {
    const doc = document.getElementById(docId);
    if (!isValidDocument(doc?.value || '')) {
      doc?.classList.add('invalid');
      if (statusEl) statusEl.textContent = 'Informe um CPF ou CNPJ válido.';
      doc?.focus();
      return false;
    }
  }
  const cepId = step === 1 ? 'qColetaCep' : step === 2 ? 'qDestinoCep' : null;
  if (cepId) {
    const cep = document.getElementById(cepId);
    if ((cep?.value || '').replace(/\D/g,'').length !== 8) {
      cep?.classList.add('invalid');
      if (statusEl) statusEl.textContent = 'Informe um CEP válido com 8 dígitos.';
      cep?.focus();
      return false;
    }
  }
  return true;
}
function validateThrough(step) {
  for (let i = 0; i <= step; i++) {
    if (!validateStep(i)) {
      showStep(i);
      return false;
    }
  }
  return true;
}

stepTabs.forEach((tab, index) => tab.addEventListener('click', () => {
  if (index > currentStep && !validateThrough(index - 1)) return;
  showStep(index);
}));
document.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', () => {
  const next = Number(btn.dataset.next || currentStep + 1);
  if (validateStep(currentStep)) showStep(next);
}));
document.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.prev || 0))));

// Phone mask
const phoneInput = document.getElementById('qTelefone');
phoneInput?.addEventListener('input', () => {
  let digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) phoneInput.value = digits ? `(${digits}` : '';
  else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  else if (digits.length <= 10) phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  else phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
});

function formatDocument(value='') {
  const d = value.replace(/\D/g,'').slice(0,14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  }
  return d.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
}
function isValidCPF(value='') {
  const cpf=value.replace(/\D/g,'');
  if (cpf.length!==11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc=(base,factor)=>{let total=0; for(const n of base) total += Number(n)*factor--; const r=(total*10)%11; return r===10?0:r;};
  return calc(cpf.slice(0,9),10)===Number(cpf[9]) && calc(cpf.slice(0,10),11)===Number(cpf[10]);
}
function isValidCNPJ(value='') {
  const cnpj=value.replace(/\D/g,'');
  if (cnpj.length!==14 || /^(\d)\1+$/.test(cnpj)) return false;
  const digit=(base,weights)=>{let sum=0; base.split('').forEach((n,i)=>sum+=Number(n)*weights[i]); const r=sum%11; return r<2?0:11-r;};
  const w1=[5,4,3,2,9,8,7,6,5,4,3,2], w2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
  return digit(cnpj.slice(0,12),w1)===Number(cnpj[12]) && digit(cnpj.slice(0,13),w2)===Number(cnpj[13]);
}
function isValidDocument(value='') {
  const d=value.replace(/\D/g,'');
  return d.length===11 ? isValidCPF(d) : d.length===14 ? isValidCNPJ(d) : false;
}
document.querySelectorAll('.doc-field').forEach(input=>input.addEventListener('input',()=>{input.value=formatDocument(input.value);}));

document.querySelectorAll('.cep-field').forEach(input=>input.addEventListener('input',()=>{
  const d=input.value.replace(/\D/g,'').slice(0,8);
  input.value=d.length>5?`${d.slice(0,5)}-${d.slice(5)}`:d;
}));

// Attachment feedback
const fileInput = document.getElementById('qArquivo');
const fileLabel = document.getElementById('fileLabel');
fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (fileLabel) fileLabel.textContent = file ? file.name : 'Selecionar imagem ou PDF';
});

// Measurements
const measureRows = document.getElementById('measureRows');
const addMeasureBtn = document.getElementById('addMeasure');
function createMeasureRow() {
  const row = document.createElement('div');
  row.className = 'measure-row';
  row.innerHTML = `
    <label>Qtd.<input class="measure-qty" inputmode="numeric" type="number" min="1" value="1"></label>
    <label>Comprimento<input class="measure-length" inputmode="decimal"></label>
    <label>Largura<input class="measure-width" inputmode="decimal"></label>
    <label>Altura<input class="measure-height" inputmode="decimal"></label>
    <button type="button" class="remove-measure" aria-label="Remover medida">×</button>`;
  return row;
}
function updateMeasureRemoveButtons() {
  const rows = measureRows?.querySelectorAll('.measure-row') || [];
  rows.forEach(row => {
    const btn = row.querySelector('.remove-measure');
    if (btn) btn.disabled = rows.length === 1;
  });
}
addMeasureBtn?.addEventListener('click', () => {
  measureRows?.appendChild(createMeasureRow());
  updateMeasureRemoveButtons();
  calculateCubage();
});
measureRows?.addEventListener('click', e => {
  const btn = e.target.closest('.remove-measure');
  if (!btn || btn.disabled) return;
  btn.closest('.measure-row')?.remove();
  updateMeasureRemoveButtons();
  calculateCubage();
});
updateMeasureRemoveButtons();
calculateCubage();

function parseMeasureNumber(value='') {
  const n=Number(value.replace(' ', '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function getMeasurements() {
  const unit = document.getElementById('qMedidaUnidade')?.value || 'm';
  const rows = Array.from(document.querySelectorAll('.measure-row'));
  return rows.map((row, index) => {
    const qty = Math.max(1, Number(row.querySelector('.measure-qty')?.value || 1));
    const length = row.querySelector('.measure-length')?.value.trim() || '';
    const width = row.querySelector('.measure-width')?.value.trim() || '';
    const height = row.querySelector('.measure-height')?.value.trim() || '';
    if (!length && !width && !height) return null;
    return `${index + 1}. ${qty} volume(s) — ${length || '?'} × ${width || '?'} × ${height || '?'} ${unit}`;
  }).filter(Boolean);
}
function calculateCubage() {
  const unit=document.getElementById('qMedidaUnidade')?.value || 'm';
  const divisor=unit==='cm' ? 1000000 : 1;
  let total=0;
  document.querySelectorAll('.measure-row').forEach(row=>{
    const qty=Math.max(1,Number(row.querySelector('.measure-qty')?.value || 1));
    const l=parseMeasureNumber(row.querySelector('.measure-length')?.value || '');
    const w=parseMeasureNumber(row.querySelector('.measure-width')?.value || '');
    const h=parseMeasureNumber(row.querySelector('.measure-height')?.value || '');
    if(l&&w&&h) total += (l*w*h*qty)/divisor;
  });
  const el=document.getElementById('cubageValue');
  if(el) el.textContent=`${total.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})} m³`;
  return total;
}
measureRows?.addEventListener('input', calculateCubage);
document.getElementById('qMedidaUnidade')?.addEventListener('change', calculateCubage);
calculateCubage();

const WA = '5531975535768';
function getQuoteData() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  return {
    responsavel: g('qResponsavel'),
    tel: g('qTelefone'),
    clienteDocumento: g('qClienteDocumento'),
    coletaEmpresa: g('qColetaEmpresa'),
    coletaCidade: g('qColetaCidade'),
    coletaDocumento: g('qColetaDocumento'),
    coletaCep: g('qColetaCep'),
    coletaEndereco: g('qColetaEndereco'),
    destinoEmpresa: g('qDestinoEmpresa'),
    destinoCidade: g('qDestinoCidade'),
    destinoDocumento: g('qDestinoDocumento'),
    destinoCep: g('qDestinoCep'),
    destinoEndereco: g('qDestinoEndereco'),
    volumes: g('qVolumes'),
    peso: g('qPeso'),
    tipo: g('qTipo'),
    urgencia: g('qUrgencia'),
    medidas: getMeasurements(),
    cubagem: calculateCubage(),
    obs: g('qObs'),
    fileName: fileInput?.files?.[0]?.name || ''
  };
}
function quoteMessage(data) {
  const measures = data.medidas.length ? data.medidas.join('\n') : 'Não informado';
  const lines = [
    '*SOLICITAÇÃO DE COTAÇÃO — EXPRESSO FR*',
    '',
    '*RESPONSÁVEL*',
    `Nome: ${data.responsavel}`,
    `Telefone / WhatsApp: ${data.tel}`,
    `CPF / CNPJ do cliente: ${data.clienteDocumento}`,
    '',
    '*COLETA*',
    `Empresa: ${data.coletaEmpresa}`,
    `Cidade: ${data.coletaCidade}`,
    `CPF / CNPJ do remetente: ${data.coletaDocumento}`,
    `CEP: ${data.coletaCep}`,
    `Endereço: ${data.coletaEndereco}`,
    '',
    '*DESTINO*',
    `Empresa: ${data.destinoEmpresa}`,
    `Cidade: ${data.destinoCidade}`,
    `CPF / CNPJ do destinatário: ${data.destinoDocumento}`,
    `CEP: ${data.destinoCep}`,
    `Endereço: ${data.destinoEndereco}`,
    '',
    '*CARGA*',
    `Volumes: ${data.volumes}`,
    `Peso total: ${data.peso}`,
    `Tipo: ${data.tipo}`,
    `Urgência: ${data.urgencia}`,
    `Medidas:\n${measures}`,
    `Cubagem estimada: ${data.cubagem.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})} m³`,
    `Observações: ${data.obs || 'Não informado'}`
  ];
  if (data.fileName) {
    lines.push('', `Arquivo selecionado: ${data.fileName}`, 'O arquivo será anexado manualmente nesta conversa.');
  }
  return lines.join('\n');
}

// Review modal before WhatsApp
const reviewDialog = document.getElementById('quoteReview');
const reviewContent = document.getElementById('reviewContent');
function escapeHtml(value='') {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function renderReview(data) {
  const measureList = data.medidas.length ? data.medidas.map(m => `<li>${escapeHtml(m)}</li>`).join('') : '<li>Não informado</li>';
  reviewContent.innerHTML = `
    <section><small>Responsável</small><strong>${escapeHtml(data.responsavel)}</strong><span>${escapeHtml(data.tel)}</span><span>CPF / CNPJ: ${escapeHtml(data.clienteDocumento)}</span></section>
    <section><small>Coleta</small><strong>${escapeHtml(data.coletaEmpresa)}</strong><span>${escapeHtml(data.coletaCidade)}</span><span>CPF / CNPJ: ${escapeHtml(data.coletaDocumento)}</span><span>CEP: ${escapeHtml(data.coletaCep)}</span><span>${escapeHtml(data.coletaEndereco)}</span></section>
    <section><small>Destino</small><strong>${escapeHtml(data.destinoEmpresa)}</strong><span>${escapeHtml(data.destinoCidade)}</span><span>CPF / CNPJ: ${escapeHtml(data.destinoDocumento)}</span><span>CEP: ${escapeHtml(data.destinoCep)}</span><span>${escapeHtml(data.destinoEndereco)}</span></section>
    <section><small>Carga</small><strong>${escapeHtml(data.volumes)} volume(s) · ${escapeHtml(data.peso)}</strong><span>${escapeHtml(data.tipo)} · ${escapeHtml(data.urgencia)}</span><span>Cubagem: ${data.cubagem.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})} m³</span><ul>${measureList}</ul>${data.obs ? `<span>${escapeHtml(data.obs)}</span>` : ''}</section>`;
}
document.getElementById('reviewQuote')?.addEventListener('click', () => {
  if (!validateThrough(3)) return;
  const data = getQuoteData();
  renderReview(data);
  if (reviewDialog?.showModal) reviewDialog.showModal();
  else reviewDialog?.setAttribute('open', '');
});
document.getElementById('reviewClose')?.addEventListener('click', () => reviewDialog?.close());
document.getElementById('reviewEdit')?.addEventListener('click', () => reviewDialog?.close());
reviewDialog?.addEventListener('click', e => {
  if (e.target === reviewDialog) reviewDialog.close();
});
document.getElementById('reviewSend')?.addEventListener('click', () => {
  const data = getQuoteData();
  const msg = quoteMessage(data);
  if (statusEl) {
    statusEl.textContent = data.fileName
      ? 'O WhatsApp será aberto. Depois, anexe manualmente o arquivo selecionado.'
      : 'Abrindo o WhatsApp com a cotação organizada.';
    statusEl.classList.add('ok');
  }
  reviewDialog?.close();
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
});
quoteForm?.addEventListener('submit', e => e.preventDefault());

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


// Mobile CTA behavior: appear after leaving the hero, hide while quote area is visible.
(() => {
  const bar = document.querySelector('.mobile-cta-bar');
  const hero = document.querySelector('.hero');
  const quote = document.querySelector('.quote-section');
  if (!bar || !hero || !quote) return;

  let heroVisible = true;
  let quoteVisible = false;

  const sync = () => {
    const mobile = window.matchMedia('(max-width: 720px)').matches;
    bar.classList.toggle('is-visible', mobile && !heroVisible && !quoteVisible);
  };

  const heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  }, { threshold: .12 });

  const quoteObserver = new IntersectionObserver(([entry]) => {
    quoteVisible = entry.isIntersecting;
    sync();
  }, { threshold: .08 });

  heroObserver.observe(hero);
  quoteObserver.observe(quote);
  window.addEventListener('resize', sync, { passive:true });
  sync();
})();
