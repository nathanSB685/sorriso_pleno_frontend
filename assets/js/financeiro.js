// Controle de pagamentos (protótipo): os dados ficam só na memória da página.
// Usa svg() e toast() do common.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const amount = $("amount");
  const installments = $("installments");
  const formError = $("formError");

  const CREDITO = "Cartão de crédito";

  // CPF de cada paciente (aparece sempre mascarado na tela)
  const CPFS = {
    "Ana Silva Souza": "12345678900",
    "Carlos Pereira": "98765432100",
    "Juliana Costa": "11122233344",
    "Roberto Lima": "55566677788",
  };

  const pagamentos = [
    {
      id: 1,
      paciente: "Ana Silva Souza",
      cpf: CPFS["Ana Silva Souza"],
      procedimento: "Consulta de rotina",
      valor: 150,
      forma: "PIX",
      parcelas: 1,
      data: "2026-09-10",
      status: "Concluído",
    },
    {
      id: 2,
      paciente: "Carlos Pereira",
      cpf: CPFS["Carlos Pereira"],
      procedimento: "Limpeza dental",
      valor: 120,
      forma: CREDITO,
      parcelas: 1,
      data: "2026-09-09",
      status: "Pendente",
    },
    {
      id: 3,
      paciente: "Juliana Costa",
      cpf: CPFS["Juliana Costa"],
      procedimento: "Restauração",
      valor: 450,
      forma: "Dinheiro",
      parcelas: 1,
      data: "2026-09-08",
      status: "Concluído",
    },
    {
      id: 4,
      paciente: "Roberto Lima",
      cpf: CPFS["Roberto Lima"],
      procedimento: "Extração",
      valor: 300,
      forma: "Cartão de débito",
      parcelas: 1,
      data: "2026-09-07",
      status: "Pendente",
    },
  ];
  let proximoId = pagamentos.length + 1;
  let filtroStatus = "Todos";

  // ===== utilitários =====
  const moeda = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtBR = (iso) => iso.split("-").reverse().join("/");
  const hojeLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  // 12345678900 -> 12*******00 (2 primeiros e 2 últimos dígitos; o miolo fica oculto)
  const mascararCpf = (cpf) => {
    const d = String(cpf || "").replace(/\D/g, "");
    return d.length === 11
      ? d.slice(0, 2) + "*".repeat(7) + d.slice(-2)
      : "*".repeat(d.length || 11);
  };

  // ===== tabela =====
  function render() {
    const termo = $("searchInput").value.toLowerCase().trim();
    const digitos = termo.replace(/\D/g, "");
    const paciente = $("patientFilter").value;

    const lista = pagamentos
      .filter(
        (p) =>
          (filtroStatus === "Todos" || p.status === filtroStatus) &&
          (!paciente || p.paciente === paciente) &&
          (!termo ||
            p.paciente.toLowerCase().includes(termo) ||
            p.procedimento.toLowerCase().includes(termo) ||
            p.forma.toLowerCase().includes(termo) ||
            (digitos.length >= 3 && p.cpf.includes(digitos))),
      )
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

    $("paymentTable").innerHTML =
      lista
        .map((p) => {
          const concluido = p.status === "Concluído";
          return `<tr data-status="${p.status}">
            <td>${esc(p.paciente)}<small>CPF ${mascararCpf(p.cpf)}</small></td>
            <td>${esc(p.procedimento)}</td>
            <td>${moeda(p.valor)}</td>
            <td>${esc(p.forma)}${p.parcelas > 1 ? ` · ${p.parcelas}x` : ""}</td>
            <td>${fmtBR(p.data)}</td>
            <td><span class="badge ${concluido ? "" : "p"}">${p.status}</span></td>
            <td>
              <span class="acoes-pag">
                <span class="ico"
                  ><button type="button" aria-label="Ver detalhes" data-ver="${p.id}">${svg("eye")}</button
                  ><button type="button" aria-label="Editar">${svg("edit")}</button
                ></span>
                ${concluido ? "" : `<button type="button" class="btn sec sm" data-concluir="${p.id}" title="Marcar como concluído">Concluir</button>`}
              </span>
            </td>
          </tr>`;
        })
        .join("") ||
      `<tr><td colspan="7" class="vazio-tab">Nenhum pagamento encontrado.</td></tr>`;
  }

  function limparFiltros() {
    filtroStatus = "Todos";
    document
      .querySelectorAll(".filter")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.status === "Todos"),
      );
    $("searchInput").value = "";
    $("patientFilter").value = "";
  }

  // ===== resumo / comprovante =====
  function mostrarResumo(p, titulo) {
    $("successTitle").textContent = titulo;
    $("receiptSummary").innerHTML = `
      <strong>Paciente:</strong> ${esc(p.paciente)}<br>
      <strong>CPF:</strong> ${mascararCpf(p.cpf)}<br>
      <strong>Procedimento:</strong> ${esc(p.procedimento)}<br>
      <strong>Valor:</strong> ${moeda(p.valor)}<br>
      <strong>Forma de pagamento:</strong> ${esc(p.forma)}<br>
      <strong>Parcelas:</strong> ${p.parcelas}x<br>
      <strong>Data:</strong> ${fmtBR(p.data)}<br>
      <strong>Status:</strong> ${p.status}`;
    $("successBackdrop").classList.add("show");
  }

  function closeSuccess() {
    $("successBackdrop").classList.remove("show");
  }

  // ===== modal "Novo pagamento" =====
  function atualizarParcelas() {
    const metodo = $("method").value;
    const credito = metodo === CREDITO;
    installments.disabled = !credito; // parcelamento só no cartão de crédito
    if (!credito) installments.value = "1";

    const valor = Number(amount.value);
    const qtd = Number(installments.value);
    let texto = "";
    if (metodo && !credito)
      texto = "Parcelamento disponível apenas no cartão de crédito.";
    else if (valor > 0 && qtd > 1)
      texto = `${qtd} parcelas de ${moeda(valor / qtd)}.`;
    $("installmentPreview").textContent = texto;
  }

  function openModal() {
    $("modalBackdrop").classList.add("show");
    $("date").value = hojeLocal();
    atualizarParcelas();
  }

  function closeModal() {
    $("modalBackdrop").classList.remove("show");
    $("paymentForm").reset();
    formError.textContent = "";
    $("installmentPreview").textContent = "";
  }

  $("openModal").addEventListener("click", openModal);
  $("closeModal").addEventListener("click", closeModal);
  $("cancelModal").addEventListener("click", closeModal);
  amount.addEventListener("input", atualizarParcelas);
  installments.addEventListener("change", atualizarParcelas);
  $("method").addEventListener("change", atualizarParcelas);

  $("paymentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";

    const valor = Math.round(Number(amount.value) * 100) / 100;
    if (!valor || valor <= 0) {
      formError.textContent = "Informe um valor de pagamento válido.";
      return;
    }

    const paciente = $("patient").value;
    const procedimento = $("procedure").value;
    const forma = $("method").value;
    const data = $("date").value;
    if (!paciente || !procedimento || !forma || !data) {
      formError.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    // todo pagamento novo nasce Pendente; a recepção marca como concluído depois
    const pagamento = {
      id: proximoId++,
      paciente,
      cpf: CPFS[paciente] || "",
      procedimento,
      valor,
      forma,
      parcelas: forma === CREDITO ? Number(installments.value) : 1,
      data,
      status: "Pendente",
    };
    pagamentos.push(pagamento);

    closeModal();
    limparFiltros(); // garante que o pagamento novo apareça na lista
    render();
    mostrarResumo(pagamento, "Pagamento registrado");
  });

  $("closeSuccess").addEventListener("click", closeSuccess);
  $("receiptButton").addEventListener("click", () => {
    alert("Emissão de comprovante simulada no protótipo.");
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

  // ===== ações da tabela: concluir e ver detalhes =====
  $("paymentTable").addEventListener("click", (e) => {
    const concluir = e.target.closest("[data-concluir]");
    if (concluir) {
      const p = pagamentos.find(
        (x) => x.id === Number(concluir.dataset.concluir),
      );
      if (p && p.status !== "Concluído") {
        p.status = "Concluído";
        render();
        toast(`Pagamento de ${p.paciente} marcado como concluído.`);
      }
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
      document
        .querySelectorAll(".filter")
        .forEach((b) => b.classList.toggle("active", b === button));
      render();
    });
  });
  $("searchInput").addEventListener("input", render);
  $("patientFilter").addEventListener("change", render);

  render();
});
