// ============================================================
// View: Distribuição de Créditos ⭐ (wow factor)
// ============================================================

(function() {
  const HIST_KEY = 'proto_creditos_hist';
  const SAVED_KEY = 'proto_creditos_saved';

  function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch(e) { return {}; } }
  function saveHist(d) { localStorage.setItem(HIST_KEY, JSON.stringify(d)); }
  function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}'); } catch(e) { return {}; } }
  function saveSaved(d) { localStorage.setItem(SAVED_KEY, JSON.stringify(d)); }

  let modo = 'percentual';
  let kwhDisponivel = 12000;
  let rateios = [];      // {clienteId, nome, pct, consumo}
  let prioridade = [];   // [{clienteId, nome, ordem, consumo}]
  let receptorExcedente = null;

  function inicializar(ds) {
    if (rateios.length === 0 || rateios[0].tenantId !== ds.tenant.id) {
      const top = ds.clientes.filter(c => c.status === 'ativo').slice(0, 5);
      const valores = [30, 25, 20, 15, 10];
      const saved = loadSaved()[ds.tenant.id];
      rateios = top.map((c, i) => ({
        tenantId: ds.tenant.id,
        clienteId: c.id,
        nome: c.nome,
        consumo: c.consumoMedio,
        pct: (saved && saved.rateios && saved.rateios[c.id] != null) ? saved.rateios[c.id] : (valores[i] || 5)
      }));
      prioridade = top.map((c, i) => ({
        tenantId: ds.tenant.id,
        clienteId: c.id,
        nome: c.nome,
        consumo: c.consumoMedio,
        ordem: (saved && saved.prioridade && saved.prioridade[c.id] != null) ? saved.prioridade[c.id] : (i + 1)
      }));
      receptorExcedente = (saved && saved.receptorExcedente) || (top[0] ? top[0].id : null);
      if (saved && saved.kwhDisponivel) kwhDisponivel = saved.kwhDisponivel;
      if (saved && saved.modo) modo = saved.modo;
    }
  }

  function snapshotConfig(tenantId) {
    return {
      tenantId,
      modo,
      kwhDisponivel,
      rateios: rateios.reduce((a, r) => (a[r.clienteId] = r.pct, a), {}),
      prioridade: prioridade.reduce((a, p) => (a[p.clienteId] = p.ordem, a), {}),
      receptorExcedente,
      ts: Date.now()
    };
  }

  function calcularPrioridade() {
    let saldo = kwhDisponivel;
    return prioridade
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map(p => {
        const alocado = Math.min(saldo, p.consumo);
        saldo -= alocado;
        const cobertura = p.consumo > 0 ? Math.round(100 * alocado / p.consumo) : 0;
        return { ...p, alocado, cobertura, restante: p.consumo - alocado };
      })
      .concat([{ excedente: true, sobra: saldo }]);
  }

  window.view_creditos = function(root) {
    const ds = window.store.dataset;
    inicializar(ds);

    function renderPercentual() {
      const wrap = root.querySelector('#rateioList');
      if (!wrap) return;
      const total = rateios.reduce((a, r) => a + r.pct, 0);
      wrap.innerHTML = rateios.map((r, i) => {
        const aloc = Math.round(kwhDisponivel * r.pct / 100);
        const cobertura = r.consumo > 0 ? Math.round(100 * aloc / r.consumo) : 0;
        const covCls = cobertura >= 100 ? 'ok' : (cobertura >= 50 ? 'mid' : 'low');
        const rowCls = r.pct >= 30 ? 'high' : (r.pct >= 10 ? 'mid' : 'low');
        return `
        <div class="rateio-row ${rowCls}" data-row="${i}">
          <div class="rateio-name">
            <div class="name">${esc(r.nome)}</div>
            <div class="sub">Consumo médio: ${fmt.kwh(r.consumo)} · cobertura ${cobertura}%</div>
            <div class="cov-bar"><div class="cov-fill ${covCls}" style="width: ${Math.min(cobertura, 100)}%"></div></div>
          </div>
          <input type="range" min="0" max="100" value="${r.pct}" data-range="${i}" />
          <div class="pct-input-wrap">
            <button type="button" class="pct-step" data-step="-1" data-i="${i}" aria-label="Diminuir">−</button>
            <input type="text" inputmode="numeric" maxlength="3" value="${r.pct}" data-num="${i}" class="pct-input" />
            <span class="pct-suffix">%</span>
            <button type="button" class="pct-step" data-step="1" data-i="${i}" aria-label="Aumentar">+</button>
          </div>
          <div class="kwh-input-wrap">
            <button type="button" class="kwh-row-step" data-kwh-row-step="-100" data-i="${i}" aria-label="Diminuir">−</button>
            <input type="text" inputmode="numeric" maxlength="7" value="${aloc}" data-kwh-num="${i}" class="kwh-input" />
            <span class="kwh-suffix">kWh</span>
            <button type="button" class="kwh-row-step" data-kwh-row-step="100" data-i="${i}" aria-label="Aumentar">+</button>
          </div>
        </div>
      `;}).join('');

      const totEl = root.querySelector('#rateioTotal');
      if (totEl) {
        totEl.innerHTML = `
          <span>Total alocado</span>
          <span class="${total === 100 ? 'ok' : 'err'}">
            ${total}% ${total === 100 ? '✓' : (total > 100 ? '(excedente)' : '(faltam ' + (100 - total) + '%)')}
          </span>
        `;
      }

      function clamp(v) {
        v = Math.round(+v);
        if (isNaN(v)) v = 0;
        if (v < 0) v = 0;
        if (v > 100) v = 100;
        return v;
      }
      // Atualiza apenas a linha + total (sem re-render — preserva foco/cursor)
      function softSync(i, opts = {}) {
        const r = rateios[i];
        const row = wrap.querySelector(`[data-row="${i}"]`);
        if (!row) return;
        const range = row.querySelector(`input[data-range="${i}"]`);
        const num = row.querySelector(`input.pct-input[data-num="${i}"]`);
        const kwhNum = row.querySelector(`input.kwh-input[data-kwh-num="${i}"]`);
        if (range && +range.value !== r.pct) range.value = r.pct;
        if (num && opts.skipPct !== true && document.activeElement !== num) num.value = r.pct;
        const aloc = Math.round(kwhDisponivel * r.pct / 100);
        if (kwhNum && opts.skipKwh !== true && document.activeElement !== kwhNum) {
          kwhNum.value = aloc;
        }
        // Atualiza barra de cobertura + classe da linha
        const cobertura = r.consumo > 0 ? Math.round(100 * aloc / r.consumo) : 0;
        const fill = row.querySelector('.cov-fill');
        if (fill) {
          fill.style.width = Math.min(cobertura, 100) + '%';
          fill.classList.remove('ok','mid','low');
          fill.classList.add(cobertura >= 100 ? 'ok' : (cobertura >= 50 ? 'mid' : 'low'));
        }
        const sub = row.querySelector('.rateio-name .sub');
        if (sub) sub.textContent = `Consumo médio: ${fmt.kwh(r.consumo)} · cobertura ${cobertura}%`;
        row.classList.remove('high','mid','low');
        row.classList.add(r.pct >= 30 ? 'high' : (r.pct >= 10 ? 'mid' : 'low'));
        renderTotalOnly();
      }
      function renderTotalOnly() {
        const total = rateios.reduce((a, r) => a + r.pct, 0);
        const status = total === 100 ? 'ok' : (total > 100 ? 'over' : 'under');
        const fill = Math.min(total, 100);
        const totEl = root.querySelector('#rateioTotal');
        if (totEl) {
          totEl.innerHTML = `
            <div class="total-bar-wrap status-${status}">
              <div class="total-bar-track">
                <div class="total-bar-fill" style="width: ${fill}%"></div>
                ${total > 100 ? `<div class="total-bar-over" style="width: ${Math.min(total - 100, 50)}%"></div>` : ''}
              </div>
              <div class="total-bar-meta">
                <span class="total-bar-label">Total alocado</span>
                <span class="total-bar-value">${total}% ${
                  status === 'ok' ? '<span class="tag ok">✓ pronto</span>' :
                  status === 'over' ? `<span class="tag err">excedente +${total - 100}%</span>` :
                  `<span class="tag warn">faltam ${100 - total}%</span>`
                }</span>
              </div>
            </div>
          `;
        }
        // Stats
        const statsEl = root.querySelector('#simStats');
        if (statsEl) {
          const alocadoKwh = rateios.reduce((a, r) => a + Math.round(kwhDisponivel * r.pct / 100), 0);
          const restanteKwh = kwhDisponivel - alocadoKwh;
          statsEl.innerHTML = `
            <div class="sim-stat">
              <div class="lbl">Disponível</div>
              <div class="val">${fmt.num(kwhDisponivel)} <small>kWh</small></div>
            </div>
            <div class="sim-stat ${alocadoKwh > kwhDisponivel ? 'over' : 'ok'}">
              <div class="lbl">Alocado</div>
              <div class="val">${fmt.num(alocadoKwh)} <small>kWh</small></div>
            </div>
            <div class="sim-stat ${restanteKwh < 0 ? 'over' : (restanteKwh === 0 ? 'ok' : 'warn')}">
              <div class="lbl">${restanteKwh < 0 ? 'Excedente' : 'Restante'}</div>
              <div class="val">${fmt.num(Math.abs(restanteKwh))} <small>kWh</small></div>
            </div>
            <div class="sim-stat">
              <div class="lbl">UCs ativas</div>
              <div class="val">${rateios.filter(r => r.pct > 0).length}<small>/${rateios.length}</small></div>
            </div>
          `;
        }
      }

      // Renderiza stats + total bar inicial
      renderTotalOnly();

      // Slider: atualiza valor + sincroniza ambos inputs da mesma linha
      wrap.querySelectorAll('input[type=range]').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const i = +e.target.dataset.range;
          rateios[i].pct = clamp(e.target.value);
          softSync(i);
        });
      });

      // Input kWh: edita o valor em kWh, recalcula pct e move slider
      wrap.querySelectorAll('input.kwh-input').forEach(inp => {
        inp.addEventListener('focus', (e) => e.target.select());
        inp.addEventListener('input', (e) => {
          const i = +e.target.dataset.kwhNum;
          let raw = e.target.value.replace(/\D/g, '');
          if (raw.length > 7) raw = raw.slice(0, 7);
          e.target.value = raw;
          let v = raw === '' ? 0 : parseInt(raw, 10);
          // máximo é o total disponível (acima disso passaria de 100%)
          if (kwhDisponivel > 0 && v > kwhDisponivel) {
            v = kwhDisponivel;
            e.target.value = v;
          }
          const pct = kwhDisponivel > 0 ? Math.round((v / kwhDisponivel) * 100) : 0;
          rateios[i].pct = clamp(pct);
          softSync(i, { skipKwh: true });
        });
        inp.addEventListener('blur', (e) => {
          const i = +e.target.dataset.kwhNum;
          // realinha exibição com pct armazenado (snapping ao inteiro do %)
          const v = Math.round(kwhDisponivel * rateios[i].pct / 100);
          e.target.value = v;
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.target.blur();
        });
      });

      function stepRowKwh(i, delta) {
        const cur = Math.round(kwhDisponivel * rateios[i].pct / 100);
        let v = cur + delta;
        if (v < 0) v = 0;
        if (kwhDisponivel > 0 && v > kwhDisponivel) v = kwhDisponivel;
        const pct = kwhDisponivel > 0 ? Math.round((v / kwhDisponivel) * 100) : 0;
        rateios[i].pct = clamp(pct);
        const kwhInp = wrap.querySelector(`input.kwh-input[data-kwh-num="${i}"]`);
        if (kwhInp) kwhInp.value = Math.round(kwhDisponivel * rateios[i].pct / 100);
        softSync(i, { skipKwh: true });
      }
      // Ações rápidas
      const btnEqual = root.querySelector('#actEqual');
      const btnNorm = root.querySelector('#actNorm');
      const btnZero = root.querySelector('#actZero');
      if (btnEqual && !btnEqual.dataset.bound) {
        btnEqual.dataset.bound = '1';
        btnEqual.addEventListener('click', () => {
          const n = rateios.length;
          if (!n) return;
          const base = Math.floor(100 / n);
          const resto = 100 - base * n;
          rateios.forEach((r, idx) => { r.pct = base + (idx < resto ? 1 : 0); });
          renderPercentual();
        });
      }
      if (btnNorm && !btnNorm.dataset.bound) {
        btnNorm.dataset.bound = '1';
        btnNorm.addEventListener('click', () => {
          const total = rateios.reduce((a, r) => a + r.pct, 0);
          if (total === 0) {
            alert('Não há porcentagens para normalizar. Distribua igualmente primeiro.');
            return;
          }
          // escala proporcional
          const escalado = rateios.map(r => (r.pct * 100 / total));
          const arred = escalado.map(v => Math.floor(v));
          let soma = arred.reduce((a, v) => a + v, 0);
          // distribui o resto pelos maiores fracionários
          const restos = escalado.map((v, i) => ({ i, frac: v - Math.floor(v) }))
            .sort((a, b) => b.frac - a.frac);
          let k = 0;
          while (soma < 100 && k < restos.length) {
            arred[restos[k].i]++;
            soma++;
            k++;
          }
          rateios.forEach((r, i) => r.pct = arred[i]);
          renderPercentual();
        });
      }
      if (btnZero && !btnZero.dataset.bound) {
        btnZero.dataset.bound = '1';
        btnZero.addEventListener('click', () => {
          rateios.forEach(r => r.pct = 0);
          renderPercentual();
        });
      }

      wrap.querySelectorAll('.kwh-row-step').forEach(btn => {
        let timer = null, repeater = null;
        const start = (e) => {
          e.preventDefault();
          const i = +btn.dataset.i;
          const delta = +btn.dataset.kwhRowStep;
          stepRowKwh(i, delta);
          timer = setTimeout(() => {
            let speed = 90;
            const tick = () => {
              stepRowKwh(i, delta);
              if (speed > 25) speed -= 6;
              repeater = setTimeout(tick, speed);
            };
            tick();
          }, 350);
        };
        const stop = () => {
          if (timer) { clearTimeout(timer); timer = null; }
          if (repeater) { clearTimeout(repeater); repeater = null; }
        };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', start, { passive: false });
        ['mouseup','mouseleave','touchend','touchcancel','blur'].forEach(ev => btn.addEventListener(ev, stop));
      });

      // Input numérico: aceita digitação livre, sincroniza ao vivo, valida no blur
      wrap.querySelectorAll('input.pct-input').forEach(inp => {
        inp.addEventListener('focus', (e) => e.target.select());
        inp.addEventListener('input', (e) => {
          const i = +e.target.dataset.num;
          // remove tudo que não for dígito
          let raw = e.target.value.replace(/\D/g, '');
          if (raw.length > 3) raw = raw.slice(0, 3);
          e.target.value = raw;
          // valor numérico (vazio = 0 para cálculo, mas não escreve no input)
          let v = raw === '' ? 0 : parseInt(raw, 10);
          if (v > 100) { v = 100; e.target.value = '100'; }
          rateios[i].pct = v;
          softSync(i);
        });
        inp.addEventListener('blur', (e) => {
          const i = +e.target.dataset.num;
          rateios[i].pct = clamp(e.target.value);
          e.target.value = rateios[i].pct;
          softSync(i);
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp')   { e.preventDefault(); stepRow(+e.target.dataset.num, +1); }
          if (e.key === 'ArrowDown') { e.preventDefault(); stepRow(+e.target.dataset.num, -1); }
          if (e.key === 'Enter')     { e.target.blur(); }
        });
      });

      function stepRow(i, delta) {
        rateios[i].pct = clamp(rateios[i].pct + delta);
        const num = wrap.querySelector(`input.pct-input[data-num="${i}"]`);
        if (num) num.value = rateios[i].pct;
        softSync(i);
      }

      // Botões − / + com hold-to-repeat
      wrap.querySelectorAll('.pct-step').forEach(btn => {
        let timer = null, repeater = null;
        const start = (e) => {
          e.preventDefault();
          const i = +btn.dataset.i;
          const delta = +btn.dataset.step;
          stepRow(i, delta);
          // após 350ms começa a repetir, acelerando
          timer = setTimeout(() => {
            let speed = 90;
            const tick = () => {
              stepRow(i, delta);
              if (speed > 25) speed -= 6;
              repeater = setTimeout(tick, speed);
            };
            tick();
          }, 350);
        };
        const stop = () => {
          if (timer) { clearTimeout(timer); timer = null; }
          if (repeater) { clearTimeout(repeater); repeater = null; }
        };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', start, { passive: false });
        ['mouseup','mouseleave','touchend','touchcancel','blur'].forEach(ev => btn.addEventListener(ev, stop));
      });
    }

    function renderPrioridade() {
      const wrap = root.querySelector('#rateioList');
      if (!wrap) return;
      const lista = calcularPrioridade();
      const ucsAlocadas = lista.filter(p => !p.excedente);
      const excedente = lista.find(p => p.excedente);
      const receptor = prioridade.find(p => p.clienteId === receptorExcedente) || prioridade[0];

      wrap.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--gray-600); margin-bottom: 0.75rem; padding: 0.5rem 0.75rem; background: var(--gray-50); border-radius: 4px;">
          ↕ Use as setas para reordenar a prioridade. Os créditos vão sendo alocados <strong>em ordem</strong> até o consumo de cada UC ser atendido.
        </div>
        ${ucsAlocadas.map((p, idx) => `
          <div style="display: grid; grid-template-columns: 40px 1.4fr 1.6fr 110px 80px; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid var(--gray-100);">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button class="btn-ghost" data-up="${idx}" style="padding: 0; width: 24px; height: 18px; font-size: 0.7rem; ${idx === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''}">▲</button>
              <button class="btn-ghost" data-down="${idx}" style="padding: 0; width: 24px; height: 18px; font-size: 0.7rem; ${idx === ucsAlocadas.length - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}">▼</button>
            </div>
            <div>
              <div style="font-weight: 600; color: var(--gray-800); font-size: 0.88rem;">#${idx + 1} · ${esc(p.nome)}</div>
              <div style="font-size: 0.72rem; color: var(--gray-500);">Consumo: ${fmt.kwh(p.consumo)}</div>
            </div>
            <div>
              <div style="height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden;">
                <div style="width: ${p.cobertura}%; height: 100%; background: ${p.cobertura >= 100 ? 'var(--success)' : (p.cobertura >= 50 ? 'var(--primary)' : 'var(--warning)')};"></div>
              </div>
              <div style="font-size: 0.7rem; color: var(--gray-500); margin-top: 4px;">${p.cobertura}% atendido</div>
            </div>
            <div style="text-align: right; font-weight: 700; color: var(--primary-dark); font-variant-numeric: tabular-nums;">
              ${fmt.num(p.alocado)} kWh
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: ${p.restante > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${p.restante > 0 ? '−' + fmt.num(p.restante) : '✓ ok'}
            </div>
          </div>
        `).join('')}

        <div style="margin-top: 1rem; padding: 0.85rem; background: ${excedente.sobra > 0 ? 'var(--success-bg)' : 'var(--gray-100)'}; border-radius: 6px; border-left: 4px solid ${excedente.sobra > 0 ? 'var(--success)' : 'var(--gray-300)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Saldo excedente</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: ${excedente.sobra > 0 ? 'var(--success)' : 'var(--gray-600)'};">${fmt.num(excedente.sobra)} kWh</div>
            </div>
            <div style="font-size: 0.8rem; color: var(--gray-700);">
              ${excedente.sobra > 0 ? `Receptor: <strong>${esc(receptor ? receptor.nome : '—')}</strong> <select id="receptorSelect" style="margin-left: 0.5rem; padding: 4px 8px; border: 1px solid var(--gray-300); border-radius: 4px; font-size: 0.8rem;">${prioridade.map(p => `<option value="${p.clienteId}" ${p.clienteId === receptorExcedente ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>` : 'Energia totalmente consumida — sem excedente neste ciclo.'}
            </div>
          </div>
        </div>
      `;

      const totEl = root.querySelector('#rateioTotal');
      if (totEl) totEl.innerHTML = '';

      wrap.querySelectorAll('[data-up]').forEach(b => {
        b.addEventListener('click', () => {
          const i = +b.dataset.up;
          if (i === 0) return;
          const ord = prioridade.slice().sort((a, b) => a.ordem - b.ordem);
          [ord[i - 1].ordem, ord[i].ordem] = [ord[i].ordem, ord[i - 1].ordem];
          renderPrioridade();
        });
      });
      wrap.querySelectorAll('[data-down]').forEach(b => {
        b.addEventListener('click', () => {
          const i = +b.dataset.down;
          const ord = prioridade.slice().sort((a, b) => a.ordem - b.ordem);
          if (i === ord.length - 1) return;
          [ord[i + 1].ordem, ord[i].ordem] = [ord[i].ordem, ord[i + 1].ordem];
          renderPrioridade();
        });
      });
      const sel = wrap.querySelector('#receptorSelect');
      if (sel) sel.addEventListener('change', e => {
        receptorExcedente = e.target.value;
        renderPrioridade();
      });
    }

    function renderRateio() { return modo === 'percentual' ? renderPercentual() : renderPrioridade(); }

    root.innerHTML = `
      ${viewHeader('Distribuição de Créditos', 'Engine de rateio · ' + ds.tenant.nome, `
        <button class="btn btn-outline btn-sm" id="btnHistCred">📜 Histórico</button>
        <button class="btn btn-primary btn-sm" id="btnSalvarCred">💾 Salvar configuração</button>
      `)}

      ${(function(){
        const hist = (loadHist()[ds.tenant.id] || []);
        const ultima = hist[0];
        let savedLine;
        if (ultima) {
          const d = new Date(ultima.ts);
          const diff = Math.floor((Date.now() - ultima.ts) / 1000);
          const rel = diff < 60 ? 'agora há pouco'
                    : diff < 3600 ? 'há ' + Math.floor(diff/60) + ' min'
                    : diff < 86400 ? 'há ' + Math.floor(diff/3600) + ' h'
                    : 'há ' + Math.floor(diff/86400) + ' d';
          savedLine = `Última configuração salva <strong>${rel}</strong> · ${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · por <strong>${esc(ultima.usuario || '—')}</strong>`;
        } else {
          savedLine = 'Nenhuma configuração salva ainda neste tenant.';
        }
        return `
        <div class="sim-banner">
          <div class="sim-banner-icon">🧪</div>
          <div class="sim-banner-body">
            <div class="sim-banner-title">
              <span class="sim-pill">Modo simulação</span>
              <span class="sim-banner-headline">Ajustes recalculam o rateio em tempo real e só são aplicados ao salvar.</span>
            </div>
            <div class="sim-banner-meta">
              <span class="sim-meta-item">📌 ${savedLine}</span>
            </div>
          </div>
          <div class="sim-banner-hints">
            <span class="sim-hint"><kbd>💾 Salvar</kbd> aplica ao tenant</span>
            <span class="sim-hint"><kbd>📜 Histórico</kbd> restaura versões anteriores</span>
          </div>
        </div>
        `;
      })()}

      <div class="modo-cards">
        <div class="modo-card ${modo === 'percentual' ? 'active' : ''}" data-modo="percentual">
          <h4>🎯 Modo Percentual</h4>
          <p>Cada cliente recebe uma fatia <strong>fixa em %</strong> do total gerado, independente do consumo. Se a fatia for maior que o consumo, o saldo fica atrelado à própria UC.</p>
        </div>
        <div class="modo-card ${modo === 'prioridade' ? 'active' : ''}" data-modo="prioridade">
          <h4>📊 Modo Prioridade</h4>
          <p>Os créditos são distribuídos por <strong>ordem de prioridade</strong> (1, 2, 3…), abatendo o consumo de cada UC. O <strong>excedente</strong> vai para uma UC receptora à sua escolha.</p>
        </div>
      </div>

      <div class="simulator">
        <div class="sim-header">
          <div>
            <h3>Simulador de Distribuição</h3>
            <p class="sim-subtitle">
              Ajuste o total de kWh disponível e ${modo === 'percentual' ? 'as participações de cada UC' : 'a ordem de prioridade'}. Os valores são recalculados ao vivo.
            </p>
          </div>
          <div class="input-kwh">
            <label>kWh disponível</label>
            <div class="kwh-stepper">
              <button type="button" class="kwh-step" data-kwh-step="-500" aria-label="Diminuir 500">−</button>
              <input type="text" inputmode="numeric" id="kwhInput" value="${kwhDisponivel}" />
              <button type="button" class="kwh-step" data-kwh-step="500" aria-label="Aumentar 500">+</button>
            </div>
            <span class="unit">kWh</span>
          </div>
        </div>

        <div class="sim-stats" id="simStats"></div>

        ${modo === 'percentual' ? `
        <div class="sim-actions">
          <button class="btn btn-outline btn-sm" id="actEqual" title="Divide 100% igualmente entre as UCs">⚖️ Distribuir igualmente</button>
          <button class="btn btn-outline btn-sm" id="actNorm" title="Reescala as porcentagens atuais para somar 100%">📐 Normalizar para 100%</button>
          <button class="btn btn-outline btn-sm" id="actZero" title="Zera todas as porcentagens">🧹 Zerar tudo</button>
        </div>` : ''}

        <div id="rateioList"></div>
        <div class="rateio-total" id="rateioTotal"></div>

        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--info-bg); border-radius: 6px; border-left: 4px solid var(--info);">
          <div style="font-size: 0.75rem; color: var(--info); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700;">💡 Máquina de estado do crédito</div>
          <p style="font-size: 0.85rem; color: var(--gray-700); margin-top: 4px;">
            Os créditos seguem uma <strong>state machine</strong> explícita: <em>Gerado → Alocado → Aplicado → Excedente</em>. Saldos residuais ficam atrelados à UC e descem para o próximo ciclo (regra B5 do questionário).
          </p>
        </div>
      </div>
    `;

    renderRateio();

    const kwhInput = root.querySelector('#kwhInput');
    function clampKwh(v) {
      v = Math.round(+v);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 999999) v = 999999;
      return v;
    }
    kwhInput.addEventListener('input', (e) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw.length > 6) raw = raw.slice(0, 6);
      e.target.value = raw;
      kwhDisponivel = raw === '' ? 0 : parseInt(raw, 10);
      renderRateio();
    });
    kwhInput.addEventListener('blur', (e) => {
      kwhDisponivel = clampKwh(e.target.value);
      e.target.value = kwhDisponivel;
      renderRateio();
    });
    kwhInput.addEventListener('focus', (e) => e.target.select());
    kwhInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp')   { e.preventDefault(); stepKwh(+100); }
      if (e.key === 'ArrowDown') { e.preventDefault(); stepKwh(-100); }
      if (e.key === 'Enter')     { e.target.blur(); }
    });
    function stepKwh(delta) {
      kwhDisponivel = clampKwh(kwhDisponivel + delta);
      kwhInput.value = kwhDisponivel;
      renderRateio();
    }
    root.querySelectorAll('.kwh-step').forEach(btn => {
      let timer = null, repeater = null;
      const start = (e) => {
        e.preventDefault();
        const delta = +btn.dataset.kwhStep;
        stepKwh(delta);
        timer = setTimeout(() => {
          let speed = 100;
          const tick = () => {
            stepKwh(delta);
            if (speed > 30) speed -= 6;
            repeater = setTimeout(tick, speed);
          };
          tick();
        }, 350);
      };
      const stop = () => {
        if (timer) { clearTimeout(timer); timer = null; }
        if (repeater) { clearTimeout(repeater); repeater = null; }
      };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('touchstart', start, { passive: false });
      ['mouseup','mouseleave','touchend','touchcancel','blur'].forEach(ev => btn.addEventListener(ev, stop));
    });

    root.querySelectorAll('.modo-card').forEach(c => {
      c.addEventListener('click', () => {
        modo = c.dataset.modo;
        view_creditos(root);
      });
    });

    root.querySelector('#btnSalvarCred').addEventListener('click', () => {
      if (modo === 'percentual') {
        const total = rateios.reduce((a, r) => a + r.pct, 0);
        if (total !== 100) {
          alert('A soma das porcentagens deve ser exatamente 100% para salvar.\nAtual: ' + total + '%');
          return;
        }
      }
      const snap = snapshotConfig(ds.tenant.id);
      const all = loadSaved();
      all[ds.tenant.id] = snap;
      saveSaved(all);
      const hist = loadHist();
      hist[ds.tenant.id] = hist[ds.tenant.id] || [];
      hist[ds.tenant.id].unshift({
        ...snap,
        usuario: (window.store.user && window.store.user.nome) || 'Demo Admin'
      });
      hist[ds.tenant.id] = hist[ds.tenant.id].slice(0, 20);
      saveHist(hist);
      alert('✓ Configuração salva com sucesso.\n\nModo: ' + (snap.modo === 'percentual' ? 'Percentual' : 'Prioridade') +
            '\nkWh disponível: ' + fmt.num(snap.kwhDisponivel) +
            '\nUCs: ' + Object.keys(snap.rateios).length);
    });

    root.querySelector('#btnHistCred').addEventListener('click', () => {
      const hist = (loadHist()[ds.tenant.id] || []);
      openModal(`
        <div class="modal" style="max-width: 720px;">
          <div class="modal-header">
            <h3>📜 Histórico de Distribuições</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body">
            ${hist.length === 0
              ? `<div style="text-align:center; padding:2rem 1rem; color:var(--gray-500);">
                   <div style="font-size:2.4rem; margin-bottom:.5rem;">📭</div>
                   <div>Nenhuma configuração salva ainda neste tenant.</div>
                   <div style="font-size:.78rem; margin-top:.4rem;">Ajuste o rateio e clique em <strong>"💾 Salvar configuração"</strong> para criar a primeira entrada.</div>
                 </div>`
              : `<table class="data" style="font-size:.82rem;">
                   <thead>
                     <tr>
                       <th>Quando</th>
                       <th>Modo</th>
                       <th class="text-right">kWh</th>
                       <th class="text-center">UCs</th>
                       <th>Usuário</th>
                       <th class="text-center">Ações</th>
                     </tr>
                   </thead>
                   <tbody>
                     ${hist.map((h, idx) => {
                       const d = new Date(h.ts);
                       const data = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                       const nUcs = Object.keys(h.rateios || {}).length;
                       return `<tr>
                         <td>${data}</td>
                         <td>${h.modo === 'percentual' ? '🎯 Percentual' : '📊 Prioridade'}</td>
                         <td class="text-right num">${fmt.num(h.kwhDisponivel)}</td>
                         <td class="text-center">${nUcs}</td>
                         <td>${esc(h.usuario || '—')}</td>
                         <td class="text-center"><button class="btn btn-ghost btn-sm" data-restaurar="${idx}">↺ Restaurar</button></td>
                       </tr>`;
                     }).join('')}
                   </tbody>
                 </table>
                 <div style="margin-top:.85rem; padding:.55rem .75rem; background:var(--gray-50); border-radius:6px; font-size:.72rem; color:var(--gray-600);">
                   ℹ Cada salvar gera uma entrada no histórico (mantém as últimas 20). Restaurar carrega a configuração no simulador — você ainda precisa salvar para aplicar.
                 </div>`}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
          </div>
        </div>
      `);
      document.querySelectorAll('[data-restaurar]').forEach(b => {
        b.addEventListener('click', () => {
          const h = hist[+b.dataset.restaurar];
          if (!h) return;
          modo = h.modo;
          kwhDisponivel = h.kwhDisponivel;
          rateios.forEach(r => { if (h.rateios[r.clienteId] != null) r.pct = h.rateios[r.clienteId]; });
          prioridade.forEach(p => { if (h.prioridade[p.clienteId] != null) p.ordem = h.prioridade[p.clienteId]; });
          receptorExcedente = h.receptorExcedente;
          closeModal();
          view_creditos(root);
        });
      });
    });
  };
})();
