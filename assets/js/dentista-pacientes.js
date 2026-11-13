// Pacientes (dentista): busca por nome ou CPF completo na API e acesso ao prontuário.
// Usa shell(), icon() e esc() do common.js e api.get do api.js.
const m = shell("dentista-pacientes.html");
if (m) iniciar(m);

function iniciar(m) {
  m.innerHTML = `<div class="topo"><div><h1>Pacientes</h1><p>Busque por nome ou CPF completo para abrir o prontuário.</p></div></div>
<div class="card" style="margin-bottom:16px"><label>Nome ou CPF<input id="q" type="search" placeholder="Ex.: Mariana ou 529.982.247-25" autocomplete="off" autofocus></label></div>
<div id="res"></div>`;

  const res = document.getElementById("res");
  const soDigitos = (s) => s.replace(/\D/g, "");
  let seq = 0;

  async function busca() {
    const mine = ++seq;
    const termo = document.getElementById("q").value.trim();
    const d = soDigitos(termo);
    const params = !termo ? {} : d.length === 11 && /^[\d.\-\s]+$/.test(termo) ? { cpf: d } : { nome: termo };
    try {
      const r = await api.get("/pacientes", { ...params, limit: 100 });
      if (mine !== seq) return;
      res.innerHTML = r.length
        ? `<table><thead><tr><th>Paciente</th><th>CPF</th><th>Atendimento</th><th>Situação</th><th></th></tr></thead><tbody>${r
            .map(
              (p) => `<tr><td><b>${esc(p.nome)}</b></td><td>${esc(p.cpf_mascarado)}</td>
            <td>${esc(p.tipo_atendimento)}${p.convenio_nome ? " – " + esc(p.convenio_nome) : ""}</td>
            <td>${p.inadimplente ? `<span class="chip">${icon("alerta")}Inadimplente</span>` : "—"}</td>
            <td><a href="dentista-prontuario.html?id=${p.id}">Abrir prontuário</a></td></tr>`,
            )
            .join("")}</tbody></table>`
        : '<div class="vazio">Nenhum paciente encontrado.</div>';
    } catch (e) {
      if (mine !== seq) return;
      res.innerHTML = `<div class="vazio">${esc(e.detalhe ?? e.message)} <button class="btn sec peq" id="tentar">Tentar de novo</button></div>`;
      document.getElementById("tentar").onclick = busca;
    }
  }

  let t;
  document.getElementById("q").oninput = () => {
    clearTimeout(t);
    t = setTimeout(busca, 300);
  };
  busca();
}
