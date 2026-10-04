const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

// Always start at top on first load.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0,0);

// Loader: 2 seconds.
const loader = $('#loader');
setTimeout(() => loader?.classList.add('is-done'), 2000);

// Header / mobile menu.
const header = $('#header');
const menuBtn = $('#menuBtn');
const nav = $('#nav');
const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', syncHeader, {passive:true}); syncHeader();
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
$$('.nav a').forEach(a => a.addEventListener('click', () => { nav?.classList.remove('open'); menuBtn?.classList.remove('open'); menuBtn?.setAttribute('aria-expanded','false'); }));

// Reveal animation.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); } });
}, {threshold:.12});
$$('.reveal').forEach(el => revealObserver.observe(el));

// Hero carousel - 3 seconds.
const slides = $$('.hero__slide');
const dots = $$('#heroDots button');
const kicker = $('#heroKicker'), line1 = $('#heroLine1'), line2 = $('#heroLine2'), heroText = $('#heroText'), progress = $('#heroProgress');
let heroIndex = 0, heroTimer, progressTimer;
function setHero(i){
  heroIndex = (i + slides.length) % slides.length;
  slides.forEach((s,n)=>s.classList.toggle('is-active',n===heroIndex));
  dots.forEach((d,n)=>d.classList.toggle('is-active',n===heroIndex));
  const s=slides[heroIndex];
  kicker.textContent=s.dataset.kicker||''; line1.textContent=s.dataset.line1||''; line2.textContent=s.dataset.line2||''; heroText.textContent=s.dataset.text||'';
  restartProgress();
}
function restartProgress(){
  if(!progress) return;
  progress.style.transition='none'; progress.style.width='0%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{progress.style.transition='width 3s linear';progress.style.width='100%';}));
}
function startHero(){ clearInterval(heroTimer); heroTimer=setInterval(()=>setHero(heroIndex+1),3000); }
dots.forEach((d,i)=>d.addEventListener('click',()=>{setHero(i);startHero();}));
setHero(0); startHero();

// Formatting helpers.
function onlyDigits(v=''){ return v.replace(/\D/g,''); }
function formatPhone(v){ let d=onlyDigits(v).slice(0,11); if(d.length<=10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/,(_,a,b,c)=>`${a?`(${a}`:''}${a.length===2?') ':''}${b}${c?`-${c}`:''}`); return d.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3'); }
function formatCep(v){ const d=onlyDigits(v).slice(0,8); return d.replace(/(\d{5})(\d{1,3})/,'$1-$2'); }
function formatDoc(v){ const d=onlyDigits(v).slice(0,14); if(d.length<=11){ return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4').replace(/[-.]$/,''); } return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,'$1.$2.$3/$4-$5').replace(/[-./]$/,''); }
$('#qTelefone')?.addEventListener('input', e => e.target.value = formatPhone(e.target.value));
['qClienteDocumento','qColetaDocumento','qDestinoDocumento'].forEach(id => $('#'+id)?.addEventListener('input',e=>e.target.value=formatDoc(e.target.value)));
['qColetaCep','qDestinoCep'].forEach(id => $('#'+id)?.addEventListener('input',e=>e.target.value=formatCep(e.target.value)));

// Quote steps.
const tabs = $$('.form__tabs button');
const panels = $$('.form__step');
function goStep(n){ tabs.forEach((t,i)=>t.classList.toggle('is-active',i===n)); panels.forEach((p,i)=>p.classList.toggle('is-active',i===n)); $('.form')?.scrollIntoView({behavior:'smooth',block:'start'}); }
function validPanel(n){ let ok=true; $$('[required]', panels[n]).forEach(el=>{ const good=el.value.trim()!==''; el.classList.toggle('invalid',!good); if(!good) ok=false; }); return ok; }
$$('.next').forEach(b=>b.addEventListener('click',()=>{ const cur=Number(b.closest('.form__step').dataset.panel); if(validPanel(cur)) goStep(Number(b.dataset.next)); }));
$$('.prev').forEach(b=>b.addEventListener('click',()=>goStep(Number(b.dataset.prev))));
tabs.forEach((b,i)=>b.addEventListener('click',()=>goStep(i)));

// Measurements and cubage.
const measureRows = $('#measureRows');
const unit = $('#qUnidade');
function num(v){ return Number(String(v).replace(',','.')) || 0; }
function updateCubage(){ let total=0; const div=unit?.value==='cm'?1000000:1; $$('.measure-row',measureRows).forEach(r=>{ total += num($('.m-qty',r)?.value)*num($('.m-l',r)?.value)*num($('.m-w',r)?.value)*num($('.m-h',r)?.value)/div; }); $('#cubageValue').textContent = total.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})+' m³'; }
function bindMeasure(r){ $$('input',r).forEach(i=>i.addEventListener('input',updateCubage)); $('.measure-remove',r)?.addEventListener('click',()=>{ if($$('.measure-row',measureRows).length>1){r.remove();updateCubage();} }); }
$$('.measure-row',measureRows).forEach(bindMeasure); unit?.addEventListener('change',updateCubage);
$('#addMeasure')?.addEventListener('click',()=>{ const r=document.createElement('div'); r.className='measure-row'; r.innerHTML='<label>Qtd.<input class="m-qty" type="number" min="1" value="1" /></label><label>Comprimento<input class="m-l" inputmode="decimal" /></label><label>Largura<input class="m-w" inputmode="decimal" /></label><label>Altura<input class="m-h" inputmode="decimal" /></label><button type="button" class="measure-remove" aria-label="Remover medida">×</button>'; measureRows.appendChild(r); bindMeasure(r); });

function escapeHtml(s=''){ return s.replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
function val(id){ return $('#'+id)?.value.trim() || ''; }
function measureText(){ return $$('.measure-row',measureRows).map(r=>{ const q=$('.m-qty',r).value||'1', l=$('.m-l',r).value||'-',w=$('.m-w',r).value||'-',h=$('.m-h',r).value||'-'; return `${q}x — ${l} × ${w} × ${h} ${unit.value}`; }).join('\n'); }
function data(){ return {responsavel:val('qResponsavel'), telefone:val('qTelefone'), clienteDoc:val('qClienteDocumento'), coletaEmpresa:val('qColetaEmpresa'), coletaDoc:val('qColetaDocumento'), coletaCep:val('qColetaCep'), coletaCidade:val('qColetaCidade'), coletaEndereco:val('qColetaEndereco'), destinoEmpresa:val('qDestinoEmpresa'), destinoDoc:val('qDestinoDocumento'), destinoCep:val('qDestinoCep'), destinoCidade:val('qDestinoCidade'), destinoEndereco:val('qDestinoEndereco'), volumes:val('qVolumes'), peso:val('qPeso'), tipo:val('qTipo'), urgencia:val('qUrgencia'), medidas:measureText(), cubagem:$('#cubageValue').textContent, obs:val('qObs')}; }
function renderReview(d){ $('#reviewContent').innerHTML = `<section><small>Responsável</small><strong>${escapeHtml(d.responsavel)}</strong><span>${escapeHtml(d.telefone)}</span><span>CPF/CNPJ: ${escapeHtml(d.clienteDoc)}</span></section><section><small>Coleta</small><strong>${escapeHtml(d.coletaEmpresa)}</strong><span>${escapeHtml(d.coletaCidade)} · ${escapeHtml(d.coletaCep)}</span><span>CPF/CNPJ: ${escapeHtml(d.coletaDoc)}</span><span>${escapeHtml(d.coletaEndereco)}</span></section><section><small>Destino</small><strong>${escapeHtml(d.destinoEmpresa)}</strong><span>${escapeHtml(d.destinoCidade)} · ${escapeHtml(d.destinoCep)}</span><span>CPF/CNPJ: ${escapeHtml(d.destinoDoc)}</span><span>${escapeHtml(d.destinoEndereco)}</span></section><section><small>Carga</small><strong>${escapeHtml(d.tipo)}</strong><span>${escapeHtml(d.volumes)} volumes · ${escapeHtml(d.peso)}</span><span>${escapeHtml(d.medidas).replace(/\n/g,'<br>')}</span><span>Cubagem: ${escapeHtml(d.cubagem)}</span><span>Urgência: ${escapeHtml(d.urgencia)}</span></section>`; }
function whatsappMessage(d){ return [
'SOLICITAÇÃO DE COTAÇÃO — EXPRESSO FR','',
'RESPONSÁVEL',`Nome: ${d.responsavel}`,`Telefone: ${d.telefone}`,`CPF/CNPJ: ${d.clienteDoc}`,'',
'COLETA',`Empresa: ${d.coletaEmpresa}`,`CPF/CNPJ: ${d.coletaDoc}`,`CEP: ${d.coletaCep}`,`Cidade: ${d.coletaCidade}`,`Endereço: ${d.coletaEndereco}`,'',
'DESTINO',`Empresa: ${d.destinoEmpresa}`,`CPF/CNPJ: ${d.destinoDoc}`,`CEP: ${d.destinoCep}`,`Cidade: ${d.destinoCidade}`,`Endereço: ${d.destinoEndereco}`,'',
'CARGA',`Modalidade: ${d.tipo}`,`Volumes: ${d.volumes}`,`Peso: ${d.peso}`,`Medidas:\n${d.medidas}`,`Cubagem estimada: ${d.cubagem}`,`Urgência: ${d.urgencia}`,`Observações: ${d.obs || '-'}`
].join('\n'); }
const dlg=$('#reviewDialog');
$('#reviewBtn')?.addEventListener('click',()=>{ if(!validPanel(3)) return; const d=data(); renderReview(d); dlg.showModal(); });
$('#reviewClose')?.addEventListener('click',()=>dlg.close()); $('#reviewEdit')?.addEventListener('click',()=>dlg.close());
$('#reviewSend')?.addEventListener('click',()=>{ const d=data(); window.open('https://wa.me/5531975535768?text='+encodeURIComponent(whatsappMessage(d)),'_blank','noopener'); dlg.close(); });

// Escape closes dialog/menu.
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(dlg?.open) dlg.close(); nav?.classList.remove('open'); menuBtn?.classList.remove('open'); } });
