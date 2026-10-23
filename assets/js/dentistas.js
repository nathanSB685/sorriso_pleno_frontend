// Gerenciamento de dentistas (protótipo): os dados ficam só na memória da página.
// Usa svg(), esc() e toast() do common.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const dentistas = [
    {
      id: 1,
      nome: "Dra. Renata Santos",
      especialidade: "Ortodontia",
      cro: "CRO-SP 45892",
      telefone: "(11) 98123-4567",
      email: "renata.santos@sorrisopleno.com",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Dr. Carlos Mendes",
      especialidade: "Clínica Geral",
      cro: "CRO-SP 32104",
      telefone: "(11) 97654-3210",
      email: "carlos.mendes@sorrisopleno.com",
      status: "Ativo",
    },
    {
      id: 3,
      nome: "Dra. Ana Lima",
      especialidade: "Ortodontia",
      cro: "CRO-SP 51209",
      telefone: "(11) 99876-5432",
      email: "ana.lima@sorrisopleno.com",
      status: "Ativo",
    },
    {
      id: 4,
      nome: "Dr. Rafael Costa",
      especialidade: "Cirurgia Oral",
      cro: "CRO-SP 28910",
      telefone: "(11) 96543-2109",
      email: "rafael.costa@sorrisopleno.com",
      status: "Inativo",
    },
  ];
  let proximoId = dentistas.length + 1;
  let editandoId = null; // null = cadastrando um novo
  let focoAnterior = null;

  // ===== lista =====
  function render() {
    const q = $("busca").value.toLowerCase().trim();
    const s = $("filtro").value;

    const lista = dentistas.filter(
      (d) =>
        (!s || d.status === s) &&
        (!q ||
          [d.nome, d.especialidade, d.cro, d.telefone, d.email]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );

    $("lista").innerHTML =
      lista
        .map((d) => {
          const ativo = d.status === "Ativo";
          return `<tr class="${ativo ? "" : "inativo"}">
            <td>${esc(d.nome)}<small>${esc(d.especialidade)}</small></td>
            <td>${esc(d.cro)}</td>
            <td>${esc(d.telefone)}</td>
            <td>${esc(d.email)}</td>
            <td><span class="badge ${ativo ? "" : "p"}">${d.status}</span></td>
            <td>
              <span class="acoes-pag">
                <span class="ico"
                  ><button type="button" aria-label="Editar ${esc(d.nome)}" data-editar="${d.id}">${svg("edit")}</button
                ></span>
                <button type="button" class="btn sec sm" data-alternar="${d.id}">${ativo ? "Inativar" : "Ativar"}</button>
              </span>
            </td>
          </tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="vazio-tab">Nenhum dentista encontrado.</td></tr>`;

    const ativos = dentistas.filter((d) => d.status === "Ativo").length;
    $("statEquipe").textContent = `${ativos} / ${dentistas.length} ativos`;
  }

  // ===== painel lateral =====
  function abrirGaveta(id) {
    editandoId = id ?? null;
    const d = id ? dentistas.find((x) => x.id === id) : null;
    $("gavetaTitulo").textContent = d ? "Editar dentista" : "Novo dentista";
    $("dNome").value = d ? d.nome : "";
    $("dEspecialidade").value = d ? d.especialidade : "";
    $("dCro").value = d ? d.cro : "";
    $("dTelefone").value = d ? d.telefone : "";
    $("dEmail").value = d ? d.email : "";
    $("dStatus").value = d ? d.status : "Ativo";
    $("dErro").textContent = "";
    focoAnterior = document.activeElement;
    $("gavetaFundo").classList.add("ativo");
    $("gaveta").classList.add("ativo");
    setTimeout(() => $("dNome").focus(), 60);
  }

  function fecharGaveta() {
    $("gavetaFundo").classList.remove("ativo");
    $("gaveta").classList.remove("ativo");
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  // máscara de telefone: (11) 98123-4567
  $("dTelefone").addEventListener("input", (e) => {
    const n = e.target.value.replace(/\D/g, "").slice(0, 11);
    let t = n;
    if (n.length > 10) t = `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    else if (n.length > 6)
      t = `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    else if (n.length > 2) t = `(${n.slice(0, 2)}) ${n.slice(2)}`;
    else if (n.length > 0) t = `(${n}`;
    e.target.value = t;
  });

  $("formDentista").addEventListener("submit", (e) => {
    e.preventDefault();
    const erro = (msg) => {
      $("dErro").textContent = msg;
    };
    const v = {
      nome: $("dNome").value.trim(),
      especialidade: $("dEspecialidade").value.trim(),
      cro: $("dCro")
        .value.trim()
        .toUpperCase()
        .replace(/\s+/g, " ")
        .replace(/^(CRO-[A-Z]{2})\s*(\d+)$/, "$1 $2"),
      telefone: $("dTelefone").value.trim(),
      email: $("dEmail").value.trim().toLowerCase(),
      status: $("dStatus").value,
    };

    if (!v.nome || !v.especialidade || !v.cro || !v.telefone || !v.email)
      return erro("Preencha todos os campos.");
    if (!/^CRO-[A-Z]{2} \d{3,6}$/.test(v.cro))
      return erro("Informe o CRO no formato CRO-SP 12345.");
    const digitos = v.telefone.replace(/\D/g, "");
    if (digitos.length < 10)
      return erro("Informe o telefone com DDD, ex.: (11) 98123-4567.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      return erro("Informe um e-mail válido.");
    if (dentistas.some((d) => d.id !== editandoId && d.cro === v.cro))
      return erro("Já existe um dentista com este CRO.");
    if (dentistas.some((d) => d.id !== editandoId && d.email === v.email))
      return erro("Já existe um dentista com este e-mail.");

    if (editandoId) {
      Object.assign(
        dentistas.find((d) => d.id === editandoId),
        v,
      );
      toast(`Dados de ${v.nome} atualizados.`);
    } else {
      dentistas.push({ id: proximoId++, ...v });
      // limpa os filtros para o novo dentista aparecer na lista
      $("busca").value = "";
      $("filtro").value = "";
      toast(`${v.nome} cadastrado(a).`);
    }
    fecharGaveta();
    render();
  });

  // ===== eventos =====
  $("novoDentista").addEventListener("click", () => abrirGaveta());
  $("fecharGaveta").addEventListener("click", fecharGaveta);
  $("cancelarGaveta").addEventListener("click", fecharGaveta);
  $("gavetaFundo").addEventListener("click", fecharGaveta);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("gaveta").classList.contains("ativo"))
      fecharGaveta();
  });

  $("lista").addEventListener("click", (e) => {
    const editar = e.target.closest("[data-editar]");
    if (editar) {
      abrirGaveta(Number(editar.dataset.editar));
      return;
    }
    const alternar = e.target.closest("[data-alternar]");
    if (alternar) {
      const d = dentistas.find(
        (x) => x.id === Number(alternar.dataset.alternar),
      );
      if (!d) return;
      d.status = d.status === "Ativo" ? "Inativo" : "Ativo";
      render();
      toast(
        `${d.nome} ${d.status === "Ativo" ? "reativado(a)" : "inativado(a)"}.`,
      );
    }
  });

  $("busca").addEventListener("input", render);
  $("filtro").addEventListener("change", render);

  render();
});
