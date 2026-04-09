// ============================================================
// CRUD Modals — formulários reutilizáveis para todas as entidades
// ============================================================

(function() {

  // ===== CLIENTE =====
  window.modalCliente = function(c) {
    const ed = !!c;
    openModal(`
      <div class="modal" style="max-width: 720px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Cadastrar'} Cliente</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row">
              <label>Razão Social</label>
              <input type="text" id="m_nome" value="${esc(c ? c.nome : '')}" placeholder="Empresa Ltda" />
            </div>
            <div class="form-row">
              <label>CNPJ</label>
              <input type="text" id="m_cnpj" value="${esc(c ? c.cnpj : '')}" placeholder="00.000.000/0000-00" />
            </div>
            <div class="form-row">
              <label>Contato (WhatsApp)</label>
              <input type="text" id="m_contato" value="${esc(c ? c.contato : '')}" placeholder="(71) 99999-9999" />
            </div>
            <div class="form-row">
              <label>Consumo médio (kWh/mês)</label>
              <input type="number" id="m_consumo" value="${c ? c.consumoMedio : 300}" />
            </div>
            <div class="form-row">
              <label>Desconto contratado (%)</label>
              <input type="number" id="m_desconto" value="${c ? c.desconto : 20}" min="0" max="40" />
            </div>
            <div class="form-row">
              <label>Status</label>
              <select id="m_status">
                <option value="ativo"    ${!c || c.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                <option value="pendente" ${c && c.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="inativo"  ${c && c.status === 'inativo' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label>Endereço completo</label>
            <input type="text" id="m_endereco" value="${esc(c ? c.endereco : '')}" placeholder="Rua, número, bairro, cidade" />
          </div>
          <div class="form-row">
            <label>Titularidade da conta de luz (COELBA)</label>
            <select id="m_titul">
              <option value="cliente"          ${!c || c.titularidade === 'cliente' ? 'selected' : ''}>Próprio cliente (padrão)</option>
              <option value="comercializadora" ${c && c.titularidade === 'comercializadora' ? 'selected' : ''}>Comercializadora — anexar print da COELBA</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      const data = {
        nome:         document.getElementById('m_nome').value.trim(),
        cnpj:         document.getElementById('m_cnpj').value.trim(),
        contato:      document.getElementById('m_contato').value.trim(),
        consumoMedio: +document.getElementById('m_consumo').value,
        desconto:     +document.getElementById('m_desconto').value,
        status:       document.getElementById('m_status').value,
        endereco:     document.getElementById('m_endereco').value.trim(),
        titularidade: document.getElementById('m_titul').value
      };
      if (!data.nome) { alert('Informe o nome do cliente.'); return; }
      if (ed) window.dataStore.updateCliente(c.id, data);
      else    window.dataStore.addCliente(data);
      closeModal();
    });
  };

  // ===== UC =====
  window.modalUC = function(u) {
    const ed = !!u;
    const ds = window.dataStore.get();
    openModal(`
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Vincular'} Unidade Consumidora</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Cliente vinculado</label>
            <select id="m_cli">
              ${ds.clientes.map(c => `<option value="${c.id}" ${u && u.clienteId === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Nº Instalação (COELBA)</label>
              <input type="text" id="m_num" value="${u ? u.numInstalacao : ''}" placeholder="00000000" />
            </div>
            <div class="form-row">
              <label>Tipo de UC</label>
              <select id="m_tipo">
                ${['Residencial','Comercial','Industrial','Rural'].map(t => `<option ${u && u.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Tarifa</label>
              <select id="m_tarifa">
                ${['B1','B2','B3','A4'].map(t => `<option ${u && u.tarifa === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Consumo médio (kWh/mês)</label>
              <input type="number" id="m_consumo" value="${u ? u.consumo : 300}" />
            </div>
            <div class="form-row">
              <label>Status</label>
              <select id="m_status">
                <option value="ativo"    ${!u || u.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                <option value="pendente" ${u && u.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="inativo"  ${u && u.status === 'inativo' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? 'Salvar' : 'Vincular UC'}</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      const cliId = document.getElementById('m_cli').value;
      const cli = ds.clientes.find(c => c.id === cliId);
      const data = {
        clienteId:     cliId,
        cliente:       cli ? cli.nome : '—',
        numInstalacao: document.getElementById('m_num').value.trim(),
        tipo:          document.getElementById('m_tipo').value,
        tarifa:        document.getElementById('m_tarifa').value,
        consumo:       +document.getElementById('m_consumo').value,
        status:        document.getElementById('m_status').value
      };
      if (ed) window.dataStore.updateUC(u.id, data);
      else    window.dataStore.addUC(data);
      closeModal();
    });
  };

  // ===== CONTRATO =====
  window.modalContrato = function(c) {
    const ed = !!c;
    const ds = window.dataStore.get();
    openModal(`
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Novo'} Contrato</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Cliente</label>
            <select id="m_cli">
              ${ds.clientes.map(x => `<option value="${x.id}" ${c && c.clienteId === x.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Fidelidade</label>
              <select id="m_fid">
                ${['Sem fidelidade','1 ano','2 anos'].map(f => `<option ${c && c.fidelidade === f ? 'selected' : ''}>${f}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Desconto (%)</label>
              <input type="number" id="m_desc" value="${c ? c.desconto : 20}" min="0" max="40" />
            </div>
            <div class="form-row">
              <label>Vigência início</label>
              <input type="text" id="m_vi" value="${esc(c ? c.vigenciaInicio : new Date().toLocaleDateString('pt-BR'))}" />
            </div>
            <div class="form-row">
              <label>Vigência fim</label>
              <input type="text" id="m_vf" value="${esc(c ? c.vigenciaFim : '31/12/2027')}" />
            </div>
            <div class="form-row">
              <label>Valor mensal (R$)</label>
              <input type="number" id="m_val" value="${c ? c.valorMensal : 250}" />
            </div>
            <div class="form-row">
              <label>Status</label>
              <select id="m_status">
                <option value="ativo"     ${!c || c.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                <option value="pendente"  ${c && c.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="encerrado" ${c && c.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? 'Salvar' : 'Criar contrato'}</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      const cliId = document.getElementById('m_cli').value;
      const cli = ds.clientes.find(x => x.id === cliId);
      const data = {
        clienteId:      cliId,
        cliente:        cli ? cli.nome : '—',
        fidelidade:     document.getElementById('m_fid').value,
        desconto:       +document.getElementById('m_desc').value,
        vigenciaInicio: document.getElementById('m_vi').value,
        vigenciaFim:    document.getElementById('m_vf').value,
        valorMensal:    +document.getElementById('m_val').value,
        status:         document.getElementById('m_status').value
      };
      if (ed) window.dataStore.updateContrato(c.id, data);
      else    window.dataStore.addContrato(data);
      closeModal();
    });
  };

  // ===== USINA =====
  window.modalUsina = function(u) {
    const ed = !!u;
    openModal(`
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Cadastrar'} Usina</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nome da usina</label>
            <input type="text" id="m_nome" value="${esc(u ? u.nome : '')}" placeholder="Usina Juazeiro" />
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Capacidade (kWp)</label>
              <input type="number" id="m_kwp" value="${u ? u.kwp : 100}" />
            </div>
            <div class="form-row">
              <label>Cidade / UF</label>
              <input type="text" id="m_cidade" value="${esc(u ? u.cidade : 'Salvador / BA')}" />
            </div>
            <div class="form-row">
              <label>Produção do mês (kWh)</label>
              <input type="number" id="m_prod" value="${u ? u.producaoMes : 8000}" />
            </div>
            <div class="form-row">
              <label>Status</label>
              <select id="m_status">
                <option value="operando" ${!u || u.status === 'operando' ? 'selected' : ''}>Operando</option>
                <option value="inativo"  ${u && u.status === 'inativo' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? 'Salvar' : 'Cadastrar usina'}</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      const data = {
        nome:        document.getElementById('m_nome').value.trim(),
        kwp:         +document.getElementById('m_kwp').value,
        cidade:      document.getElementById('m_cidade').value.trim(),
        producaoMes: +document.getElementById('m_prod').value,
        status:      document.getElementById('m_status').value
      };
      if (!data.nome) { alert('Informe o nome da usina.'); return; }
      if (ed) window.dataStore.updateUsina(u.id, data);
      else    window.dataStore.addUsina(data);
      closeModal();
    });
  };

  // ===== LEITURA MANUAL DA USINA =====
  window.modalLeitura = function(u) {
    // Estimativa: ~4,5 kWh/kWp/dia × 30 dias (média BR para FV)
    const estimado = Math.round(u.kwp * 4.5 * 30);
    const anterior = u.producaoMes || 0;
    const hojeISO = new Date().toISOString().slice(0, 10);

    openModal(`
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <h3>📊 Registrar Leitura — ${esc(u.nome)}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; margin-bottom:1rem;">
            <div style="background:var(--gray-50); padding:.65rem; border-radius:6px; text-align:center;">
              <div style="font-size:.68rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px;">Capacidade</div>
              <div style="font-size:1.05rem; font-weight:700; color:var(--gray-900); margin-top:2px;">${u.kwp} kWp</div>
            </div>
            <div style="background:var(--gray-50); padding:.65rem; border-radius:6px; text-align:center;">
              <div style="font-size:.68rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px;">Leitura anterior</div>
              <div style="font-size:1.05rem; font-weight:700; color:var(--gray-900); margin-top:2px;">${fmt.num(anterior)} kWh</div>
              <div style="font-size:.66rem; color:var(--gray-500);">${esc(u.ultimaLeitura || '—')}</div>
            </div>
            <div style="background:var(--info-bg); padding:.65rem; border-radius:6px; text-align:center;">
              <div style="font-size:.68rem; color:var(--info); text-transform:uppercase; letter-spacing:.5px;">Estimado / mês</div>
              <div style="font-size:1.05rem; font-weight:700; color:var(--info); margin-top:2px;">${fmt.num(estimado)} kWh</div>
              <div style="font-size:.66rem; color:var(--gray-500);">~4,5 kWh/kWp/dia</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-row">
              <label>Data da leitura</label>
              <input type="date" id="m_data" value="${hojeISO}" max="${hojeISO}" />
            </div>
            <div class="form-row">
              <label>Competência</label>
              <input type="text" id="m_comp" value="${new Date().toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).replace('.','').replace(' de ','/')}" placeholder="Ex.: Abr/26" />
            </div>
          </div>

          <div class="form-row" style="margin-top:.5rem;">
            <label>Produção do mês (kWh) <span style="color:var(--danger);">*</span></label>
            <input type="number" id="m_kwh" value="${anterior}" min="0" step="1" placeholder="Ex.: ${estimado}" autofocus />
          </div>

          <div id="m_indic" style="margin-top:.6rem; padding:.7rem .85rem; border-radius:6px; font-size:.78rem; display:none;"></div>

          <div class="form-row" style="margin-top:.75rem;">
            <label>Observação <span style="color:var(--gray-400); font-weight:400;">(opcional)</span></label>
            <textarea id="m_obs" rows="2" placeholder="Ex.: limpeza dos painéis em 05/04, dia nublado afetou geração..."></textarea>
          </div>

          <div style="margin-top:.85rem; padding:.55rem .75rem; background:var(--gray-50); border-radius:6px; font-size:.7rem; color:var(--gray-600);">
            ℹ A leitura será registrada com o usuário atual e o timestamp da operação. Versão Core: digitação manual (sem parser COELBA).
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">✓ Registrar leitura</button>
        </div>
      </div>
    `);

    const inp = document.getElementById('m_kwh');
    const indic = document.getElementById('m_indic');
    function recalc() {
      const v = +inp.value;
      if (!v || v <= 0) { indic.style.display = 'none'; return; }
      const efic = (v / u.kwp / 30);
      const variacao = anterior > 0 ? ((v - anterior) / anterior * 100) : 0;
      const desvioEstim = ((v - estimado) / estimado * 100);
      let cor = 'var(--success)', bg = 'var(--success-bg)', alerta = '';
      if (Math.abs(desvioEstim) > 30) { cor = 'var(--danger)'; bg = 'var(--warning-bg)'; alerta = '⚠ Valor muito distante do estimado — verifique antes de salvar.'; }
      else if (Math.abs(desvioEstim) > 15) { cor = '#b8740a'; bg = 'var(--warning-bg)'; }
      indic.style.display = 'block';
      indic.style.background = bg;
      indic.style.color = cor;
      indic.innerHTML = `
        <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
          <span><strong>${efic.toFixed(2).replace('.',',')}</strong> kWh/kWp/dia</span>
          <span>vs anterior: <strong>${variacao >= 0 ? '▲' : '▼'} ${Math.abs(variacao).toFixed(1).replace('.',',')}%</strong></span>
          <span>vs estimado: <strong>${desvioEstim >= 0 ? '+' : ''}${desvioEstim.toFixed(1).replace('.',',')}%</strong></span>
        </div>
        ${alerta ? `<div style="margin-top:4px; font-weight:600;">${alerta}</div>` : ''}
      `;
    }
    inp.addEventListener('input', recalc);
    recalc();

    document.getElementById('m_save').addEventListener('click', () => {
      const v = +inp.value;
      if (!v || v <= 0) { alert('Informe a produção em kWh (deve ser maior que zero).'); inp.focus(); return; }
      const dataISO = document.getElementById('m_data').value;
      const dataBR = dataISO ? dataISO.split('-').reverse().join('/') : null;
      const desvio = Math.abs((v - estimado) / estimado * 100);
      if (desvio > 50 && !confirm('A leitura informada (' + fmt.num(v) + ' kWh) está ' + desvio.toFixed(0) + '% fora da estimativa (' + fmt.num(estimado) + ' kWh).\n\nConfirmar mesmo assim?')) return;
      window.dataStore.registrarLeitura(u.id, v, dataBR);
      closeModal();
    });
  };

  // ===== FATURA =====
  window.modalFatura = function(f) {
    const ed = !!f;
    const ds = window.dataStore.get();
    const TARIFA = 0.78; // R$/kWh — alinhado com mock-data
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    function compAtual() {
      const d = new Date();
      return MESES[d.getMonth()] + '/' + String(d.getFullYear()).slice(-2);
    }
    function vencDefault() {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(15);
      return d.toISOString().slice(0, 10);
    }
    function brToISO(br) {
      if (!br) return '';
      const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
    }
    function isoToBR(iso) {
      if (!iso) return '';
      const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
    }

    openModal(`
      <div class="modal" style="max-width: 640px;">
        <div class="modal-header">
          <h3>${ed ? '✎ Editar Fatura ' + esc(f.id) : '+ Nova Fatura Individual'}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Cliente <span style="color:var(--danger);">*</span></label>
            <select id="m_cli">
              <option value="">— Selecione um cliente —</option>
              ${ds.clientes.map(c => `<option value="${c.id}" ${f && f.clienteId === c.id ? 'selected' : ''}>${esc(c.nome)}${c.status !== 'ativo' ? ' (inativo)' : ''}</option>`).join('')}
            </select>
          </div>

          <div id="m_cliInfo" style="display:none; margin:.4rem 0 .85rem; padding:.65rem .8rem; background:var(--gray-50); border-radius:6px; font-size:.78rem;"></div>

          <div class="form-grid">
            <div class="form-row">
              <label>Competência</label>
              <select id="m_comp">
                ${(function(){
                  const opts = [];
                  const d = new Date();
                  for (let i = -2; i <= 2; i++) {
                    const dt = new Date(d.getFullYear(), d.getMonth() + i, 1);
                    const v = MESES[dt.getMonth()] + '/' + String(dt.getFullYear()).slice(-2);
                    opts.push(`<option value="${v}" ${(f ? f.competencia : compAtual()) === v ? 'selected' : ''}>${v}</option>`);
                  }
                  return opts.join('');
                })()}
              </select>
            </div>
            <div class="form-row">
              <label>Vencimento</label>
              <input type="date" id="m_venc" value="${f ? brToISO(f.vencimento) : vencDefault()}" />
            </div>
            <div class="form-row">
              <label>Consumo (kWh) <span style="color:var(--danger);">*</span></label>
              <input type="number" id="m_cons" value="${f ? f.consumo : ''}" min="0" step="1" placeholder="Ex.: 350" />
            </div>
            <div class="form-row">
              <label>Valor (R$) <span style="color:var(--danger);">*</span></label>
              <input type="number" id="m_val" value="${f ? f.valor : ''}" min="0" step="0.01" placeholder="Calculado automaticamente" />
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:.5rem; margin-top:.4rem;">
            <input type="checkbox" id="m_autoCalc" ${ed ? '' : 'checked'} />
            <label for="m_autoCalc" style="font-size:.78rem; color:var(--gray-700); cursor:pointer;">
              Calcular valor automaticamente (consumo × R$ ${TARIFA.toFixed(2).replace('.',',')}/kWh × desconto do contrato)
            </label>
          </div>

          <div id="m_preview" style="margin-top:1rem; padding:.85rem 1rem; background:var(--success-bg); border-left:3px solid var(--success); border-radius:6px; display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
              <div>
                <div style="font-size:.66rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Total a faturar</div>
                <div id="m_total" style="font-size:1.5rem; font-weight:800; color:var(--success);">R$ 0,00</div>
              </div>
              <div id="m_breakdown" style="font-size:.72rem; color:var(--gray-700); text-align:right;"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? '💾 Salvar alterações' : '⚡ Gerar fatura'}</button>
        </div>
      </div>
    `);

    const selCli = document.getElementById('m_cli');
    const inpCons = document.getElementById('m_cons');
    const inpVal = document.getElementById('m_val');
    const inpComp = document.getElementById('m_comp');
    const cliInfo = document.getElementById('m_cliInfo');
    const preview = document.getElementById('m_preview');
    const totalEl = document.getElementById('m_total');
    const breakEl = document.getElementById('m_breakdown');
    const chkAuto = document.getElementById('m_autoCalc');

    function getCli() { return ds.clientes.find(c => c.id === selCli.value); }
    function getContrato(cliId) { return (ds.contratos || []).find(c => c.clienteId === cliId && c.status === 'ativo'); }

    function refreshCliInfo() {
      const cli = getCli();
      if (!cli) { cliInfo.style.display = 'none'; return; }
      const ct = getContrato(cli.id);
      cliInfo.style.display = 'block';
      cliInfo.innerHTML = `
        <div style="display:flex; gap:1rem; flex-wrap:wrap; justify-content:space-between;">
          <span>📊 Consumo médio: <strong>${fmt.kwh(cli.consumoMedio || 0)}</strong></span>
          ${ct ? `<span>📄 Contrato: <strong>${esc(ct.id)}</strong> · Desconto <strong>${ct.desconto}%</strong></span>` : '<span style="color:var(--warning);">⚠ Sem contrato ativo</span>'}
          ${cli.titularidade ? `<span>🏷 Titularidade: <strong>${esc(cli.titularidade)}</strong></span>` : ''}
        </div>
      `;
    }

    function autoFillFromCli() {
      const cli = getCli();
      if (!cli || ed) return;
      if (!inpCons.value) inpCons.value = cli.consumoMedio || '';
      recalc();
    }

    function recalc() {
      const cli = getCli();
      const cons = +inpCons.value || 0;
      if (chkAuto.checked && cli && cons > 0) {
        const ct = getContrato(cli.id);
        const desc = ct ? ct.desconto : 0;
        const valor = cons * TARIFA * (1 - desc / 100);
        inpVal.value = valor.toFixed(2);
        inpVal.disabled = true;
      } else {
        inpVal.disabled = false;
      }
      const v = +inpVal.value || 0;
      if (cli && cons > 0 && v > 0) {
        preview.style.display = 'block';
        totalEl.textContent = fmt.moeda(v);
        const ct = getContrato(cli.id);
        breakEl.innerHTML = `
          ${cons} kWh × R$ ${TARIFA.toFixed(2).replace('.',',')}/kWh
          ${ct && ct.desconto ? `<br>Desconto contrato: <strong>−${ct.desconto}%</strong>` : ''}
          <br>Competência: <strong>${esc(inpComp.value)}</strong>
        `;
      } else {
        preview.style.display = 'none';
      }
    }

    selCli.addEventListener('change', () => { refreshCliInfo(); autoFillFromCli(); });
    inpCons.addEventListener('input', recalc);
    inpVal.addEventListener('input', recalc);
    inpComp.addEventListener('change', recalc);
    chkAuto.addEventListener('change', recalc);
    refreshCliInfo();
    recalc();

    document.getElementById('m_save').addEventListener('click', () => {
      const cliId = selCli.value;
      if (!cliId) { alert('Selecione um cliente.'); return; }
      const cons = +inpCons.value;
      if (!cons || cons <= 0) { alert('Informe o consumo em kWh.'); inpCons.focus(); return; }
      const valor = +inpVal.value;
      if (!valor || valor <= 0) { alert('Informe o valor da fatura.'); inpVal.focus(); return; }
      const cli = ds.clientes.find(c => c.id === cliId);
      const data = {
        clienteId:   cliId,
        cliente:     cli ? cli.nome : '—',
        competencia: inpComp.value,
        vencimento:  isoToBR(document.getElementById('m_venc').value),
        consumo:     cons,
        valor:       valor
      };
      if (ed) window.dataStore.updateFatura(f.id, data);
      else    window.dataStore.addFatura(data);
      closeModal();
    });
  };

})();
