// Minha agenda (dentista): consultas do dia vindas da API.
// Usa shell(), icon(), esc(), toast(), fmtData() e sessao() do common.js e api.get/patch do api.js.
const m = shell("dentista-agenda.html");
if (m) iniciar(m);

function iniciar(m) {
  const TZ = "America/Sao_Paulo";
  const fmtParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const partes = (iso) => {
    const o = {};
    for (const p of fmtParts.formatToParts(new Date(iso))) o[p.type] = p.value;
    return { data: `${o.year}-${o.month}-${o.day}`, hora: `${o.hour}:${o.minute}` };
  };
  const hojeIso = () => partes(new Date().toISOString()).data;
  const somarDias = (iso, n) => {
    const x = new Date(iso + "T12:00:00");
    x.setDate(x.getDate() + n);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const quando = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });

  m.innerHTML = `<div class="topo"><div><h1>Minha agenda</h1><p id="sub"></p></div>
<div class="barra"><button class="btn sec peq" id="ant" aria-label="Dia anterior">‹</button><input type="date" id="dia" aria-label="Dia"><button class="btn sec peq" id="prox" aria-label="Próximo dia">›</button><button class="btn sec peq" id="hj">Hoje</button></div></div>
<div class="lista" id="lista"></div>`;

  // próximos passos permitidos para cada status (o servidor valida de novo)
  const FLUXO = {
    Agendada: [["Confirmada", "Confirmar"]],
    Confirmada: [["Em Atendimento", "Iniciar atendimento"]],
    "Em Atendimento": [["Concluída", "Concluir"]],
  };
  const key = (s) => ({ "Em Atendimento": "Atendimento", "Falta Injustificada": "Falta", Concluída: "Concluida" })[s] || s;

  const chipsClinicos = (a) => {
    const r = [];
    if (a?.alergias) r.push([`Alergia: ${a.alergias}`, 0]);
    if (a?.hipertensao) r.push(["Hipertensão", 0]);
    if (a?.condicoes_especiais) r.push([a.condicoes_especiais, 0]);
    if (a?.preferencias) r.push([`Preferência: ${a.preferencias}`, 1]);
    return r;
  };

  const dia = document.getElementById("dia");
  const L = document.getElementById("lista");
  dia.value = hojeIso();

  function cartao(c) {
    const k = key(c.status);
    const botoes =
      (FLUXO[c.status] || []).map(([para, rot]) => `<button class="btn peq" data-id="${c.id}" data-para="${para}">${rot}</button>`).join("") +
      (c.status === "Agendada" || c.status === "Confirmada"
        ? `<button class="btn perigo peq" data-id="${c.id}" data-para="Falta Injustificada">Registrar falta</button>`
        : "");
    const chips = chipsClinicos(c.alertas)
      .map(([t, at]) => `<span class="chip${at ? " at" : ""}">${icon("alerta")}${esc(t)}</span>`)
      .join("");
    return `<article class="cons ${k}"><div class="hora">${partes(c.inicio).hora}<small>até ${partes(c.fim).hora}</small></div>
  <div><div class="pac"><a href="dentista-prontuario.html?id=${c.paciente_id}">${esc(c.paciente_nome)}</a> <span class="st ${k}">${esc(c.status)}</span></div>
  <div class="meta"><span>${icon("proc")}${esc(c.procedimento_nome)}</span><span>${icon("clock")}${c.duracao_min} min</span><span>${icon("sala")}${esc(c.sala_nome)}</span></div>
  <div class="meta">${c.inadimplente ? `<span class="chip">${icon("alerta")}Inadimplente</span>` : ""}${chips}</div></div>
  <div class="acoes">${botoes}<a class="btn sec peq" href="dentista-prontuario.html?id=${c.paciente_id}">${icon("ficha")}Prontuário</a><button class="btn sec peq" data-h="${c.id}">Histórico</button></div>
  <div class="hist" id="h${c.id}"></div></article>`;
  }

  let seq = 0;
  async function carregar() {
    const mine = ++seq;
    const d = dia.value;
    L.innerHTML = `<div class="vazio">Carregando…</div>`;
    try {
      const lista = (await api.get("/consultas", { data: d })).filter((c) => c.status !== "Cancelada");
      if (mine !== seq) return;
      document.getElementById("sub").textContent =
        `${fmtData(d)} · ${lista.length} consulta${lista.length == 1 ? "" : "s"} · ${sessao().nome}`;
      L.innerHTML = lista.length ? lista.map(cartao).join("") : '<div class="vazio">Nenhuma consulta agendada para este dia.</div>';
    } catch (e) {
      if (mine !== seq) return;
      L.innerHTML = `<div class="vazio">${esc(e.detalhe ?? e.message)} <button class="btn sec peq" id="tentar">Tentar de novo</button></div>`;
      document.getElementById("tentar").onclick = carregar;
    }
  }

  async function mudar(botao) {
    const { id, para } = botao.dataset;
    if (para === "Falta Injustificada" && !confirm("Registrar falta injustificada deste paciente?")) return;
    botao.disabled = true;
    try {
      await api.patch(`/consultas/${id}/status`, { status: para });
      toast("Status atualizado para " + para);
      await carregar();
    } catch (e) {
      toast(e.detalhe ?? e.message);
      botao.disabled = false;
    }
  }

  const textoHist = (h) => {
    const quem = h.usuario_nome ?? "—";
    if (h.acao === "criada") return `${quando(h.criado_em)} · ${esc(quem)}: consulta agendada`;
    if (h.acao === "status") return `${quando(h.criado_em)} · ${esc(quem)}: ${esc(h.status_anterior)} → ${esc(h.status_novo)}`;
    if (h.acao === "cancelada") return `${quando(h.criado_em)} · ${esc(quem)}: cancelada (${esc(h.motivo)})`;
    const a = h.inicio_anterior && partes(h.inicio_anterior);
    const n = h.inicio_novo && partes(h.inicio_novo);
    const mudou = a && n && (a.data !== n.data || a.hora !== n.hora);
    return `${quando(h.criado_em)} · ${esc(quem)}: ${mudou ? `remarcada ${fmtData(a.data)} ${a.hora} → ${fmtData(n.data)} ${n.hora}` : "alteração"} (${esc(h.motivo ?? "")})`;
  };

  async function alternarHistorico(id) {
    const box = document.getElementById("h" + id);
    if (box.classList.contains("aberto")) return box.classList.remove("aberto");
    box.textContent = "Carregando…";
    box.classList.add("aberto");
    try {
      const r = await api.get(`/consultas/${id}`);
      box.innerHTML = r.historico.map(textoHist).join("<br>") || "Sem alterações registradas.";
    } catch (e) {
      box.textContent = e.detalhe ?? e.message;
    }
  }

  L.addEventListener("click", (e) => {
    const b = e.target.closest("[data-para]");
    if (b) return mudar(b);
    const h = e.target.closest("[data-h]");
    if (h) alternarHistorico(h.dataset.h);
  });
  dia.onchange = carregar;
  document.getElementById("ant").onclick = () => {
    dia.value = somarDias(dia.value, -1);
    carregar();
  };
  document.getElementById("prox").onclick = () => {
    dia.value = somarDias(dia.value, 1);
    carregar();
  };
  document.getElementById("hj").onclick = () => {
    dia.value = hojeIso();
    carregar();
  };
  carregar();
}
