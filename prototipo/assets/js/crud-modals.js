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
    openModal(`
      <div class="modal" style="max-width: 460px;">
        <div class="modal-header">
          <h3>Registrar Leitura Manual</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 1rem;">
            Usina: <strong>${esc(u.nome)}</strong> · ${u.kwp} kWp
          </p>
          <div class="form-row">
            <label>Produção do mês (kWh)</label>
            <input type="number" id="m_kwh" value="${u.producaoMes}" />
          </div>
          <p style="font-size: 0.75rem; color: var(--gray-500);">Conforme questionário B1 (digitação manual).</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">Registrar</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      window.dataStore.registrarLeitura(u.id, +document.getElementById('m_kwh').value);
      closeModal();
    });
  };

  // ===== FATURA =====
  window.modalFatura = function(f) {
    const ed = !!f;
    const ds = window.dataStore.get();
    openModal(`
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Nova'} Fatura</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Cliente</label>
            <select id="m_cli">
              ${ds.clientes.map(c => `<option value="${c.id}" ${f && f.clienteId === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Competência</label>
              <input type="text" id="m_comp" value="${esc(f ? f.competencia : 'Abr/26')}" />
            </div>
            <div class="form-row">
              <label>Vencimento</label>
              <input type="text" id="m_venc" value="${esc(f ? f.vencimento : '15/05/2026')}" />
            </div>
            <div class="form-row">
              <label>Consumo (kWh)</label>
              <input type="number" id="m_cons" value="${f ? f.consumo : 300}" />
            </div>
            <div class="form-row">
              <label>Valor (R$)</label>
              <input type="number" id="m_val" value="${f ? f.valor : 250}" step="0.01" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="m_save">${ed ? 'Salvar' : 'Gerar fatura'}</button>
        </div>
      </div>
    `);
    document.getElementById('m_save').addEventListener('click', () => {
      const cliId = document.getElementById('m_cli').value;
      const cli = ds.clientes.find(c => c.id === cliId);
      const data = {
        clienteId:   cliId,
        cliente:     cli ? cli.nome : '—',
        competencia: document.getElementById('m_comp').value,
        vencimento:  document.getElementById('m_venc').value,
        consumo:     +document.getElementById('m_cons').value,
        valor:       +document.getElementById('m_val').value
      };
      if (ed) window.dataStore.updateFatura(f.id, data);
      else    window.dataStore.addFatura(data);
      closeModal();
    });
  };

})();
