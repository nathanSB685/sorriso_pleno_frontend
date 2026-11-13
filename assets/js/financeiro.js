// Controle de pagamentos, ligado à API (/pagamentos, /pacientes, /procedimentos).
// Usa svg(), esc() e toast() do common.js e api.get/post/put/patch do api.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const amount = $("amount");
  const installments = $("installments");
  const formError = $("formError");
  const CREDITO = "Cartão de crédito";

  let pagamentos = [], pacientes = [], procedimentos = [];
  let filtroStatus = "Todos";
  let editandoId = null; // null = novo pagamento
  let salvando = false;
  let seq = 0;

  // ===== utilitários =====
  const moeda = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtBR = (iso) => iso.split("-").reverse().join("/");
  const hojeLocal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const rotuloPaciente = (p) => `${p.nome} · CPF ${p.cpf_mascarado}`;

  // ===== carga =====
  async function carregarBase() {
    try {
      [pacientes, procedimentos] = await Promise.all([api.get("/pacientes", { limit: 100 }), api.get("/procedimentos")]);
    } catch (e) {
      toast(e.detalhe ?? e.message);
    }
    const opcoesPac = pacientes.map((p) => `<option value="${p.id}">${esc(rotuloPaciente(p))}</option>`).join("");
    $("patientFilter").innerHTML = `<option value="">Filtrar por paciente</option>` + opcoesPac;
    $("patient").innerHTML = `<option value="">Selecione</option>` + opcoesPac;
    $("procedure").innerHTML =
      `<option value="">Selecione</option>` + procedimentos.map((p) => `<option>${esc(p.nome)}</option>`).join("");
  }

  async function carregar() {
    const mine = ++seq;
    const params = {
      status: filtroStatus === "Todos" ? undefined : filtroStatus,
      paciente_id: $("patientFilter").value || undefined,
      busca: $("searchInput").value.trim() || undefined,
      limit: 200,
    };
    try {
      const [lista, resumo] = await Promise.all([api.get("/pagamentos", params), api.get("/pagamentos/resumo")]);
      if (mine !== seq) return;
      pagamentos = lista;
      render();
      $("statPend").textContent = `${moeda(resumo.pendentes_total)} (${resumo.pendentes_qtd})`;
      $("statConc").textContent = `${moeda(resumo.concluidos_total)} (${resumo.concluidos_qtd})`;
      $("statInad").textContent = resumo.inadimplentes_qtd;
    } catch (e) {
      if (mine !== seq) return;
      $("paymentTable").innerHTML = `<tr><td colspan="7" class="vazio-tab">${esc(e.detalhe ?? e.message)}
        <button type="button" class="btn sec sm" id="tentar">Tentar de novo</button></td></tr>`;
      $("tentar").onclick = carregar;
    }
  }

  // ===== tabela =====
  function render() {
    $("paymentTable").innerHTML =
      pagamentos
        .map((p) => {
          const pendente = p.status === "Pendente";
          const atraso =
            pendente && p.dias_atraso > 0
              ? `<small>${p.inadimplente ? '<span class="chip">Inadimplente</span> ' : ""}${p.dias_atraso} dias de atraso</small>`
              : "";
          return `<tr data-status="${p.status}">
            <td>${esc(p.paciente_nome)}<small>CPF ${esc(p.cpf_mascarado)}</small></td>
            <td>${esc(p.procedimento)}</td>
            <td>${moeda(p.valor)}</td>
            <td>${esc(p.forma)}${p.parcelas > 1 ? ` · ${p.parcelas}x` : ""}</td>
            <td>${fmtBR(p.data_pagamento)}</td>
            <td><span class="badge ${pendente ? "p" : ""}">${p.status}</span>${atraso}</td>
            <td>
              <span class="acoes-pag">
                <span class="ico"
                  ><button type="button" aria-label="Ver detalhes" data-ver="${p.id}">${svg("eye")}</button
                  >${pendente ? `<button type="button" aria-label="Editar" data-editar="${p.id}">${svg("edit")}</button>` : ""}</span>
                ${pendente ? `<button type="button" class="btn sec sm" data-concluir="${p.id}" title="Marcar como concluído">Concluir</button>` : ""}
              </span>
            </td>
          </tr>`;
        })
        .join("") || `<tr><td colspan="7" class="vazio-tab">Nenhum pagamento encontrado.</td></tr>`;
  }

  function limparFiltros() {
    filtroStatus = "Todos";
    document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b.dataset.status === "Todos"));
    $("searchInput").value = "";
    $("patientFilter").value = "";
  }

  // ===== resumo / comprovante =====
  function mostrarResumo(p, titulo) {
    $("successTitle").textContent = titulo;
    $("receiptSummary").innerHTML = `
      <strong>Paciente:</strong> ${esc(p.paciente_nome)}<br>
      <strong>CPF:</strong> ${esc(p.cpf_mascarado)}<br>
      <strong>Procedimento:</strong> ${esc(p.procedimento)}<br>
      <strong>Valor:</strong> ${moeda(p.valor)}<br>
      <strong>Forma de pagamento:</strong> ${esc(p.forma)}<br>
      <strong>Parcelas:</strong> ${p.parcelas}x${p.parcelas > 1 ? ` de ${moeda(p.valor_parcela)}` : ""}<br>
      <strong>Data:</strong> ${fmtBR(p.data_pagamento)}<br>
      <strong>Status:</strong> ${p.status}${p.status === "Pendente" && p.dias_atraso > 0 ? ` (${p.dias_atraso} dias de atraso)` : ""}`;
    $("successBackdrop").classList.add("show");
  }
  const closeSuccess = () => $("successBackdrop").classList.remove("show");

  // ===== modal novo / editar =====
  function atualizarParcelas() {
    const metodo = $("method").value;
    const credito = metodo === CREDITO;
    installments.disabled = !credito; // parcelamento só no cartão de crédito
    if (!credito) installments.value = "1";
    const valor = Number(amount.value);
    const qtd = Number(installments.value);
    let texto = "";
    if (metodo && !credito) texto = "Parcelamento disponível apenas no cartão de crédito.";
    else if (valor > 0 && qtd > 1) texto = `${qtd} parcelas de ${moeda(valor / qtd)}.`;
    $("installmentPreview").textContent = texto;
  }

  function openModal(p) {
    editandoId = p ? p.id : null;
    $("paymentForm").reset();
    $("modalTitle").textContent = p ? "Editar pagamento" : "Novo pagamento";
    if (p) {
      $("patient").value = String(p.paciente_id);
      if (![...$("procedure").options].some((o) => o.value === p.procedimento))
        $("procedure").insertAdjacentHTML("beforeend", `<option>${esc(p.procedimento)}</option>`);
      $("procedure").value = p.procedimento;
      amount.value = p.valor;
      $("method").value = p.forma;
      installments.value = String(p.parcelas);
      $("date").value = p.data_pagamento;
    } else {
      $("date").value = hojeLocal();
    }
    formError.textContent = "";
    atualizarParcelas();
    if (p) installments.value = String(p.parcelas);
    $("modalBackdrop").classList.add("show");
  }

  function closeModal() {
    $("modalBackdrop").classList.remove("show");
    $("paymentForm").reset();
    formError.textContent = "";
    $("installmentPreview").textContent = "";
  }

  $("openModal").addEventListener("click", () => openModal());
  $("closeModal").addEventListener("click", closeModal);
  $("cancelModal").addEventListener("click", closeModal);
  amount.addEventListener("input", atualizarParcelas);
  installments.addEventListener("change", atualizarParcelas);
  $("method").addEventListener("change", atualizarParcelas);
  // sugere o valor cadastrado do procedimento quando o campo está vazio
  $("procedure").addEventListener("change", () => {
    const proc = procedimentos.find((x) => x.nome === $("procedure").value);
    if (proc?.valor && !amount.value) {
      amount.value = proc.valor;
      atualizarParcelas();
    }
  });

  $("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (salvando) return;
    formError.textContent = "";
    const valor = Math.round(Number(amount.value) * 100) / 100;
    if (!valor || valor <= 0) {
      formError.textContent = "Informe um valor de pagamento válido.";
      return;
    }
    const paciente_id = Number($("patient").value);
    const procedimento = $("procedure").value;
    const forma = $("method").value;
    const data_pagamento = $("date").value;
    if (!paciente_id || !procedimento || !forma || !data_pagamento) {
      formError.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }
    const corpo = {
      paciente_id, procedimento, valor, forma,
      parcelas: forma === CREDITO ? Number(installments.value) : 1,
      data_pagamento,
    };
    const botao = $("saveButton");
    salvando = true;
    botao.disabled = true;
    try {
      const novo = !editandoId;
      // todo pagamento novo nasce Pendente; a recepção marca como concluído depois
      const p = novo ? await api.post("/pagamentos", corpo) : await api.put(`/pagamentos/${editandoId}`, corpo);
      closeModal();
      if (novo) limparFiltros(); // garante que o pagamento novo apareça na lista
      await carregar();
      if (novo) mostrarResumo(p, "Pagamento registrado");
      else toast("Pagamento atualizado.");
    } catch (e) {
      formError.textContent = e.detalhe ?? e.message;
    } finally {
      salvando = false;
      botao.disabled = false;
    }
  });

  $("closeSuccess").addEventListener("click", closeSuccess);
  $("receiptButton").addEventListener("click", () => {
    alert("Emissão de comprovante ainda não disponível.");
  });

  [$("modalBackdrop"), $("successBackdrop")].forEach((el) =>
    el.addEventListener("click", (e) => {
      if (e.target !== el) return;
      if (el === $("modalBackdrop")) closeModal();
      else closeSuccess();
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("modalBackdrop").classList.contains("show")) closeModal();
    if ($("successBackdrop").classList.contains("show")) closeSuccess();
  });

  // ===== ações da tabela: concluir, editar e ver detalhes =====
  $("paymentTable").addEventListener("click", async (e) => {
    const concluir = e.target.closest("[data-concluir]");
    if (concluir) {
      concluir.disabled = true;
      try {
        const p = await api.patch(`/pagamentos/${concluir.dataset.concluir}/concluir`);
        toast(`Pagamento de ${p.paciente_nome} marcado como concluído.`);
        await carregar();
      } catch (err) {
        toast(err.detalhe ?? err.message);
        concluir.disabled = false;
      }
      return;
    }
    const editar = e.target.closest("[data-editar]");
    if (editar) {
      const p = pagamentos.find((x) => x.id === Number(editar.dataset.editar));
      if (p) openModal(p);
      return;
    }
    const ver = e.target.closest("[data-ver]");
    if (ver) {
      const p = pagamentos.find((x) => x.id === Number(ver.dataset.ver));
      if (p) mostrarResumo(p, "Detalhes do pagamento");
    }
  });

  // ===== filtros (status + busca + paciente funcionam juntos) =====
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      filtroStatus = button.dataset.status;
      document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === button));
      carregar();
    });
  });
  let t;
  $("searchInput").addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(carregar, 300);
  });
  $("patientFilter").addEventListener("change", carregar);

  carregarBase().then(carregar);
});
