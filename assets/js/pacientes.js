// Pacientes (recepção): cadastro, edição, convênio, busca por nome/CPF e pendências.
// Usa svg(), esc(), toast(), fmtData() e hoje() do common.js e api.get/post/put do api.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let pacientes = [];
  let editandoId = null; // null = cadastrando um novo
  let focoAnterior = null;
  let salvando = false;
  let seq = 0; // evita que uma busca antiga sobrescreva uma mais nova

  const soDigitos = (s) => String(s ?? "").replace(/\D/g, "");
  const fmtCpf = (c) => soDigitos(c).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function cpfValido(valor) {
    const c = soDigitos(valor);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const dv = (n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
      const r = (s * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
  }

  // ===== lista e busca =====
  async function carregar() {
    const mine = ++seq;
    const termo = $("busca").value.trim();
    const d = soDigitos(termo);
    const params = !termo ? {} : d.length === 11 && /^[\d.\-\s]+$/.test(termo) ? { cpf: d } : { nome: termo };
    try {
      const lista = await api.get("/pacientes", { ...params, limit: 100 });
      if (mine !== seq) return;
      pacientes = lista;
      render();
    } catch (e) {
      if (mine !== seq) return;
      $("lista").innerHTML = `<tr><td colspan="5" class="vazio-tab">${esc(e.detalhe ?? e.message)}
        <button type="button" class="btn sec sm" id="tentar">Tentar de novo</button></td></tr>`;
      $("tentar").onclick = carregar;
    }
  }

  function render() {
    $("lista").innerHTML =
      pacientes
        .map((p) => {
          const conv =
            p.tipo_atendimento === "Convênio"
              ? `Convênio – ${esc(p.convenio_nome)}<small>Carteirinha ${esc(p.convenio_carteirinha)}${
                  p.convenio_vencido ? ' <span class="chip">Vencida</span>' : ""
                }</small>`
              : "Particular";
          const situacao = p.inadimplente
            ? `<span class="chip">${svg("alerta")}Inadimplente há ${p.dias_pendencia} dias</span>`
            : p.dias_pendencia > 0
              ? `<span class="badge p">Pendência (${p.dias_pendencia} dias)</span>`
              : `<span class="badge">Em dia</span>`;
          return `<tr>
            <td>${esc(p.nome)}<small>CPF ${esc(p.cpf_mascarado)}</small></td>
            <td>${esc(p.whatsapp || "—")}<small>Nasc. ${fmtData(p.data_nascimento)}</small></td>
            <td>${conv}</td>
            <td>${situacao}</td>
            <td><span class="ico"><button type="button" aria-label="Editar ${esc(p.nome)}" data-editar="${p.id}">${svg("edit")}</button></span></td>
          </tr>`;
        })
        .join("") || `<tr><td colspan="5" class="vazio-tab">Nenhum paciente encontrado.</td></tr>`;
    $("rodape").textContent =
      pacientes.length >= 100
        ? "Mostrando os 100 primeiros resultados. Refine a busca para ver outros."
        : `${pacientes.length} paciente${pacientes.length === 1 ? "" : "s"}.`;
  }

  // ===== painel lateral =====
  function atualizarConvenio() {
    const conv = $("pTipo").value === "Convênio";
    $("convenioCampos").hidden = !conv;
    const val = $("pConvVal").value;
    $("pConvAviso").textContent = conv && val && val < hoje() ? "Atenção: carteirinha vencida." : "";
  }

  async function carregarPendencias(id) {
    $("pendBox").hidden = true;
    try {
      const lista = await api.get("/pagamentos", { paciente_id: id, status: "Pendente" });
      if (editandoId !== id || !lista.length) return;
      $("pendLista").innerHTML = lista
        .map(
          (g) =>
            `<li>${esc(g.procedimento)} · ${brl(g.valor)}<small>Vencimento ${fmtData(g.data_pagamento)} · ${g.dias_atraso} dias de atraso</small></li>`,
        )
        .join("");
      $("pendBox").hidden = false;
    } catch {
      /* sem pendências visíveis: não atrapalha a edição */
    }
  }

  function abrirGaveta(id) {
    editandoId = id ?? null;
    const p = id ? pacientes.find((x) => x.id === id) : null;
    $("gavetaTitulo").textContent = p ? "Editar paciente" : "Novo paciente";
    $("pNome").value = p ? p.nome : "";
    $("pCpf").value = p ? fmtCpf(p.cpf) : "";
    $("pNasc").value = p ? p.data_nascimento : "";
    $("pNasc").max = hoje();
    $("pWhats").value = p ? (p.whatsapp ?? "") : "";
    $("pObs").value = p ? (p.observacoes ?? "") : "";
    $("pTipo").value = p ? p.tipo_atendimento : "Particular";
    $("pConvNome").value = p?.convenio_nome ?? "";
    $("pConvCart").value = p?.convenio_carteirinha ?? "";
    $("pConvVal").value = p?.convenio_validade ?? "";
    $("pErro").textContent = "";
    $("pendBox").hidden = true;
    atualizarConvenio();
    if (p) carregarPendencias(p.id);
    focoAnterior = document.activeElement;
    $("gavetaFundo").classList.add("ativo");
    $("gaveta").classList.add("ativo");
    setTimeout(() => $("pNome").focus(), 60);
  }

  function fecharGaveta() {
    $("gavetaFundo").classList.remove("ativo");
    $("gaveta").classList.remove("ativo");
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  // máscaras
  $("pCpf").addEventListener("input", (e) => {
    const n = soDigitos(e.target.value).slice(0, 11);
    e.target.value = n
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  });
  $("pWhats").addEventListener("input", (e) => {
    const n = soDigitos(e.target.value).slice(0, 11);
    let t = n;
    if (n.length > 10) t = `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    else if (n.length > 6) t = `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    else if (n.length > 2) t = `(${n.slice(0, 2)}) ${n.slice(2)}`;
    else if (n.length > 0) t = `(${n}`;
    e.target.value = t;
  });
  $("pTipo").addEventListener("change", atualizarConvenio);
  $("pConvVal").addEventListener("change", atualizarConvenio);

  $("formPaciente").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (salvando) return;
    const erro = (msg) => {
      $("pErro").textContent = msg;
    };
    const conv = $("pTipo").value === "Convênio";
    const v = {
      nome: $("pNome").value.trim(),
      cpf: soDigitos($("pCpf").value),
      data_nascimento: $("pNasc").value,
      whatsapp: $("pWhats").value.trim() || null,
      observacoes: $("pObs").value.trim() || null,
      tipo_atendimento: $("pTipo").value,
      convenio_nome: conv ? $("pConvNome").value.trim() : null,
      convenio_carteirinha: conv ? $("pConvCart").value.trim() : null,
      convenio_validade: conv ? $("pConvVal").value || null : null,
    };

    if (v.nome.length < 3) return erro("Informe o nome completo.");
    if (!cpfValido(v.cpf)) return erro("Informe um CPF válido.");
    if (!v.data_nascimento) return erro("Informe a data de nascimento.");
    if (v.data_nascimento > hoje()) return erro("A data de nascimento não pode estar no futuro.");
    if (v.whatsapp && soDigitos(v.whatsapp).length < 10) return erro("Informe o WhatsApp com DDD, ex.: (11) 98123-4567.");
    if (conv && (!v.convenio_nome || !v.convenio_carteirinha || !v.convenio_validade))
      return erro("Informe o nome do convênio, o número da carteirinha e a validade.");

    const botao = $("formPaciente").querySelector("button:not([type=button])");
    salvando = true;
    botao.disabled = true;
    erro("");
    try {
      const novo = !editandoId;
      const p = novo ? await api.post("/pacientes", v) : await api.put(`/pacientes/${editandoId}`, v);
      if (novo) $("busca").value = ""; // para o novo paciente aparecer na lista
      toast(novo ? `${p.nome} cadastrado(a).` : `Dados de ${p.nome} atualizados.`);
      fecharGaveta();
      await carregar();
    } catch (err) {
      erro(err.detalhe ?? err.message);
    } finally {
      salvando = false;
      botao.disabled = false;
    }
  });

  // ===== eventos =====
  $("novoPaciente").addEventListener("click", () => abrirGaveta());
  $("fecharGaveta").addEventListener("click", fecharGaveta);
  $("cancelarGaveta").addEventListener("click", fecharGaveta);
  $("gavetaFundo").addEventListener("click", fecharGaveta);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("gaveta").classList.contains("ativo")) fecharGaveta();
  });
  $("lista").addEventListener("click", (e) => {
    const editar = e.target.closest("[data-editar]");
    if (editar) abrirGaveta(Number(editar.dataset.editar));
  });

  let t;
  $("busca").addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(carregar, 300);
  });

  carregar();
});
