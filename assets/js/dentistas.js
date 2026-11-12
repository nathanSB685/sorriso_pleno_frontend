// Gerenciamento de dentistas: os dados vêm da API (/dentistas e /especialidades).
// Usa svg(), esc() e toast() do common.js e api.get/post/put/patch do api.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let dentistas = [];
  let especialidades = [];
  let editandoId = null; // null = cadastrando um novo
  let focoAnterior = null;
  let salvando = false;

  const statusTxt = (d) => (d.ativo ? "Ativo" : "Inativo");
  const nomesEsp = (d) => d.especialidades.map((e) => e.nome).join(", ") || "Sem especialidade";

  // ===== carga de dados =====
  async function carregar() {
    $("lista").innerHTML = `<tr><td colspan="6" class="vazio-tab">Carregando…</td></tr>`;
    try {
      [dentistas, especialidades] = await Promise.all([api.get("/dentistas"), api.get("/especialidades")]);
      render();
    } catch (e) {
      $("lista").innerHTML = `<tr><td colspan="6" class="vazio-tab">${esc(e.detalhe ?? e.message)}
        <button type="button" class="btn sec sm" id="tentar">Tentar de novo</button></td></tr>`;
      $("tentar").onclick = carregar;
    }
  }

  // ===== lista =====
  function render() {
    const q = $("busca").value.toLowerCase().trim();
    const s = $("filtro").value;

    const lista = dentistas.filter(
      (d) =>
        (!s || statusTxt(d) === s) &&
        (!q || [d.nome, nomesEsp(d), d.cro, d.telefone, d.email].join(" ").toLowerCase().includes(q)),
    );

    $("lista").innerHTML =
      lista
        .map(
          (d) => `<tr class="${d.ativo ? "" : "inativo"}">
            <td>${esc(d.nome)}<small>${esc(nomesEsp(d))}</small></td>
            <td>${esc(d.cro)}</td>
            <td>${esc(d.telefone)}</td>
            <td>${esc(d.email)}</td>
            <td><span class="badge ${d.ativo ? "" : "p"}">${statusTxt(d)}</span></td>
            <td>
              <span class="acoes-pag">
                <span class="ico"
                  ><button type="button" aria-label="Editar ${esc(d.nome)}" data-editar="${d.id}">${svg("edit")}</button
                ></span>
                <button type="button" class="btn sec sm" data-alternar="${d.id}">${d.ativo ? "Inativar" : "Ativar"}</button>
              </span>
            </td>
          </tr>`,
        )
        .join("") || `<tr><td colspan="6" class="vazio-tab">Nenhum dentista encontrado.</td></tr>`;

    const ativos = dentistas.filter((d) => d.ativo).length;
    $("statEquipe").textContent = `${ativos} / ${dentistas.length} ativos`;
  }

  // ===== painel lateral =====
  function desenharEspecialidades(selecionadas) {
    $("dEspecialidades").innerHTML =
      especialidades
        .map(
          (e) => `<label class="check"><input type="checkbox" value="${e.id}" ${selecionadas.includes(e.id) ? "checked" : ""}> ${esc(e.nome)}</label>`,
        )
        .join("") || `<p class="sub">Nenhuma especialidade cadastrada.</p>`;
  }

  function abrirGaveta(id) {
    editandoId = id ?? null;
    const d = id ? dentistas.find((x) => x.id === id) : null;
    $("gavetaTitulo").textContent = d ? "Editar dentista" : "Novo dentista";
    $("dNome").value = d ? d.nome : "";
    $("dCro").value = d ? d.cro : "";
    $("dTelefone").value = d ? (d.telefone ?? "") : "";
    $("dEmail").value = d ? (d.email ?? "") : "";
    $("dStatus").value = d ? statusTxt(d) : "Ativo";
    desenharEspecialidades(d ? d.especialidades.map((e) => e.id) : []);
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
    else if (n.length > 6) t = `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    else if (n.length > 2) t = `(${n.slice(0, 2)}) ${n.slice(2)}`;
    else if (n.length > 0) t = `(${n}`;
    e.target.value = t;
  });

  $("formDentista").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (salvando) return;
    const erro = (msg) => {
      $("dErro").textContent = msg;
    };
    const v = {
      nome: $("dNome").value.trim(),
      cro: $("dCro")
        .value.trim()
        .toUpperCase()
        .replace(/\s+/g, " ")
        .replace(/^(CRO-[A-Z]{2})\s*(\d+)$/, "$1 $2"),
      telefone: $("dTelefone").value.trim(),
      email: $("dEmail").value.trim().toLowerCase(),
    };
    const ativo = $("dStatus").value === "Ativo";
    const ids = [...document.querySelectorAll("#dEspecialidades input:checked")].map((i) => Number(i.value));

    if (!v.nome || !v.cro || !v.telefone || !v.email) return erro("Preencha todos os campos.");
    if (!ids.length) return erro("Selecione ao menos uma especialidade.");
    if (!/^CRO-[A-Z]{2} \d{3,6}$/.test(v.cro)) return erro("Informe o CRO no formato CRO-SP 12345.");
    if (v.telefone.replace(/\D/g, "").length < 10) return erro("Informe o telefone com DDD, ex.: (11) 98123-4567.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return erro("Informe um e-mail válido.");

    const botao = $("formDentista").querySelector("button:not([type=button])");
    salvando = true;
    botao.disabled = true;
    erro("");
    let d = null;
    try {
      d = editandoId ? await api.put(`/dentistas/${editandoId}`, v) : await api.post("/dentistas", v);
      editandoId = d.id; // se algo falhar abaixo, um novo envio atualiza em vez de duplicar
      await api.put(`/dentistas/${d.id}/especialidades`, { especialidade_ids: ids });
      if (d.ativo !== ativo) await api.patch(`/dentistas/${d.id}/status`, { ativo });
      const novo = !dentistas.some((x) => x.id === d.id);
      dentistas = await api.get("/dentistas");
      if (novo) {
        // limpa os filtros para o novo dentista aparecer na lista
        $("busca").value = "";
        $("filtro").value = "";
      }
      toast(novo ? `${v.nome} cadastrado(a).` : `Dados de ${v.nome} atualizados.`);
      fecharGaveta();
      render();
    } catch (err) {
      erro(d ? `Dentista salvo, mas houve um erro: ${err.detalhe ?? err.message}. Tente salvar de novo.` : (err.detalhe ?? err.message));
      if (d) api.get("/dentistas").then((l) => { dentistas = l; render(); }).catch(() => {});
    } finally {
      salvando = false;
      botao.disabled = false;
    }
  });

  // ===== eventos =====
  $("novoDentista").addEventListener("click", () => abrirGaveta());
  $("fecharGaveta").addEventListener("click", fecharGaveta);
  $("cancelarGaveta").addEventListener("click", fecharGaveta);
  $("gavetaFundo").addEventListener("click", fecharGaveta);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("gaveta").classList.contains("ativo")) fecharGaveta();
  });

  $("lista").addEventListener("click", async (e) => {
    const editar = e.target.closest("[data-editar]");
    if (editar) {
      abrirGaveta(Number(editar.dataset.editar));
      return;
    }
    const alternar = e.target.closest("[data-alternar]");
    if (alternar) {
      const d = dentistas.find((x) => x.id === Number(alternar.dataset.alternar));
      if (!d) return;
      alternar.disabled = true;
      try {
        Object.assign(d, await api.patch(`/dentistas/${d.id}/status`, { ativo: !d.ativo }));
        toast(`${d.nome} ${d.ativo ? "reativado(a)" : "inativado(a)"}.`);
      } catch (err) {
        toast(err.detalhe ?? err.message);
      }
      render();
    }
  });

  $("busca").addEventListener("input", render);
  $("filtro").addEventListener("change", render);

  carregar();
});
