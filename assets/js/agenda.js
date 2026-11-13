// Agenda da recepção, ligada à API: visão Dia e Semana, nova consulta com horários livres,
// confirmar, registrar falta, cancelar e remarcar (com motivo), histórico e ficha do paciente.
// Usa svg(), esc() e toast() do common.js e api.get/post/patch do api.js.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const ic = (n) => svg(n);

  const TZ = "America/Sao_Paulo";
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const MES_ABREV = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const ATIVA = (s) => s !== "Cancelada" && s !== "Falta Injustificada";

  // ===== UTILITÁRIOS DE DATA (sempre no fuso da clínica) =====
  const fmtParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  function partes(iso) {
    const o = {};
    for (const p of fmtParts.formatToParts(new Date(iso))) o[p.type] = p.value;
    return { data: `${o.year}-${o.month}-${o.day}`, hora: `${o.hour}:${o.minute}` };
  }
  const hojeIso = () => partes(new Date().toISOString()).data;
  const pad = (n) => String(n).padStart(2, "0");
  const aMin = (h) => {
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
  };
  const dataObj = (iso) => new Date(iso + "T12:00:00");
  const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtBR = (iso) => iso.split("-").reverse().join("/");
  const fmtLonga = (iso) => {
    const t = dataObj(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const quando = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
  const iniciais = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const norm = (c) => ({ ...c, data: partes(c.inicio).data, hora: partes(c.inicio).hora, fimHora: partes(c.fim).hora });

  // ===== ESTADO =====
  let dentistas = [], salas = [], procedimentos = [];
  let dentistaId = ""; // "" = todos os dentistas
  let dataSel = hojeIso();
  let mes = { ano: Number(dataSel.slice(0, 4)), mes: Number(dataSel.slice(5, 7)) - 1 };
  let visao = "dia"; // "dia" | "semana"
  let doDia = [], doMes = [], semana = [];
  let reqSeq = 0;
  let consultaAcao = null; // consulta aberta no modal de cancelar/remarcar
  let pacienteSel = null; // paciente escolhido no modal de nova consulta

  const todos = () => !dentistaId;
  const filtroDentista = () => (dentistaId ? { dentista_id: dentistaId } : {});
  const intervaloMes = () => ({
    de: `${mes.ano}-${pad(mes.mes + 1)}-01`,
    ate: `${mes.ano}-${pad(mes.mes + 1)}-${pad(new Date(mes.ano, mes.mes + 1, 0).getDate())}`,
  });

  // ===== CARGA DE DADOS =====
  function aplicarVisao() {
    const dia = visao === "dia";
    $("visaoDia").hidden = !dia;
    $("visaoSemana").hidden = dia;
    $("verDia").classList.toggle("active", dia);
    $("verSemana").classList.toggle("active", !dia);
    $("verDia").setAttribute("aria-pressed", String(dia));
    $("verSemana").setAttribute("aria-pressed", String(!dia));
    $("diaAnterior").setAttribute("aria-label", dia ? "Dia anterior" : "Semana anterior");
    $("proximoDia").setAttribute("aria-label", dia ? "Próximo dia" : "Próxima semana");
    $("rotuloTotal").textContent = dia ? "Pacientes no dia" : "Consultas na semana";
  }

  function mostrarErro(e, tentar = atualizar) {
    aplicarVisao();
    const alvo = visao === "dia" ? $("agenda") : $("semana");
    alvo.innerHTML = `<p class="vazio">${esc(e.detalhe ?? e.message)}
      <button type="button" class="btn sec sm" id="tentarAgenda">Tentar de novo</button></p>`;
    $("tentarAgenda").onclick = tentar;
  }

  async function atualizar() {
    const mine = ++reqSeq;
    try {
      const f = filtroDentista();
      if (visao === "dia") {
        const [dia, delMes] = await Promise.all([
          api.get("/consultas", { data: dataSel, ...f }),
          api.get("/consultas", { ...intervaloMes(), ...f }),
        ]);
        if (mine !== reqSeq) return;
        doDia = dia.map(norm);
        doMes = delMes.map(norm);
      } else {
        const seg = segundaDaSemana(dataSel);
        const sab = new Date(seg);
        sab.setDate(seg.getDate() + 5);
        const lista = await api.get("/consultas", { de: toIso(seg), ate: toIso(sab), ...f });
        if (mine !== reqSeq) return;
        semana = lista.map(norm);
      }
      renderTudo();
    } catch (e) {
      if (mine === reqSeq) mostrarErro(e);
    }
  }

  async function carregarMes() {
    try {
      doMes = (await api.get("/consultas", { ...intervaloMes(), ...filtroDentista() })).map(norm);
      renderCalendario();
    } catch {
      /* o calendário só perde os marcadores */
    }
  }

  // ===== VISÃO DIA: agenda =====
  function cartao(c) {
    const agir = c.status === "Agendada" || c.status === "Confirmada";
    const btn = (acao, rotulo, extra = "") => `<button type="button" class="btn ${extra} sm" data-acao="${acao}" data-id="${c.id}">${rotulo}</button>`;
    return `<article class="consulta ${c.status === "Agendada" ? "pendente" : "confirmada"}"${ATIVA(c.status) ? "" : ' style="opacity:.65"'}>
      <div class="hora-consulta">${c.hora}<br><small>${c.fimHora}</small></div>
      <div class="info"><strong>${esc(c.paciente_nome)}</strong><span>${esc(c.procedimento_nome)} · ${esc(c.sala_nome)}${todos() ? " · " + esc(c.dentista_nome) : ""}</span>
        ${c.inadimplente ? `<b class="chip">${ic("alerta")}Inadimplente</b>` : ""}</div>
      <span class="status ${c.status === "Agendada" ? "status-pendente" : ""}">${esc(c.status)}</span>
      <div class="acoes">
        ${c.status === "Agendada" ? btn("confirmar", "Confirmar") : ""}
        ${agir ? btn("remarcar", "Remarcar", "sec") + btn("falta", "Falta", "sec") + btn("cancelar", "Cancelar", "perigo") : ""}
        <button type="button" class="btn sec sm" data-pid="${c.paciente_id}">Ficha</button>
        ${btn("historico", "Histórico", "sec")}
      </div>
    </article>`;
  }

  function renderAgenda() {
    const usados = new Set();
    let html = doDia.length ? "" : `<p class="vazio">Nenhuma consulta marcada para este dia.</p>`;
    for (let h = 8; h < 18; h++) {
      const noSlot = doDia.filter((c) => Math.floor(aMin(c.hora) / 60) === h);
      const ocupado = doDia.some((c) => aMin(c.hora) < (h + 1) * 60 && aMin(c.fimHora) > h * 60);
      if (h === 12) html += `<div class="hr almoco"><span>12:00</span><em>Almoço</em></div>`;
      else if (!noSlot.length && !ocupado) html += `<div class="hr">${pad(h)}:00</div>`;
      html += noSlot.map(cartao).join("");
      noSlot.forEach((c) => usados.add(c.id));
    }
    html += doDia.filter((c) => !usados.has(c.id)).map(cartao).join(""); // fora do expediente
    $("agenda").innerHTML = html;
    $("totalPacientes").textContent = doDia.filter((c) => ATIVA(c.status)).length;
    $("totalPendentes").textContent = doDia.filter((c) => c.status === "Agendada").length;
  }

  // ===== VISÃO DIA: calendário e busca lateral =====
  function renderCalendario() {
    $("calTitulo").textContent = `${MESES[mes.mes]} ${mes.ano}`;
    const vazios = new Date(mes.ano, mes.mes, 1).getDay();
    const total = new Date(mes.ano, mes.mes + 1, 0).getDate();
    const comConsulta = new Set(doMes.filter((c) => ATIVA(c.status)).map((c) => c.data));
    let html = ["D", "S", "T", "Q", "Q", "S", "S"].map((d) => `<b>${d}</b>`).join("") + "<i></i>".repeat(vazios);
    for (let d = 1; d <= total; d++) {
      const k = `${mes.ano}-${pad(mes.mes + 1)}-${pad(d)}`;
      html += `<button type="button" class="dia${k === dataSel ? " sel" : ""}${comConsulta.has(k) ? " tem" : ""}" data-d="${k}" aria-label="${fmtBR(k)}">${d}</button>`;
    }
    $("cal").innerHTML = html;
  }

  const itemMini = (nome, info, pid) => `<div class="paciente-mini">
      <div data-pid="${pid}"><strong>${esc(nome)}</strong><span>${esc(info)}</span></div>
      <button class="prontuario" type="button" data-pid="${pid}">${ic("file")} Ficha</button>
    </div>`;

  let buscaSeq = 0;
  async function renderLista() {
    const termo = $("buscaPaciente").value.trim();
    const mine = ++buscaSeq;
    if (termo.length < 2) {
      $("tituloLista").textContent = "Próximos pacientes";
      $("listaPacientes").innerHTML =
        doDia.filter((c) => ATIVA(c.status)).map((c) => itemMini(c.paciente_nome, `${c.hora} — ${c.fimHora}`, c.paciente_id)).join("") ||
        `<p class="vazio">Sem pacientes neste dia.</p>`;
      return;
    }
    $("tituloLista").textContent = "Resultados da busca";
    try {
      const lista = await api.get("/pacientes", { nome: termo, limit: 20 });
      if (mine !== buscaSeq) return;
      $("listaPacientes").innerHTML =
        lista.map((p) => itemMini(p.nome, `CPF ${p.cpf_mascarado}`, p.id)).join("") || `<p class="vazio">Nenhum paciente encontrado.</p>`;
    } catch (e) {
      if (mine === buscaSeq) $("listaPacientes").innerHTML = `<p class="vazio">${esc(e.detalhe ?? e.message)}</p>`;
    }
  }

  // ===== VISÃO SEMANA =====
  function segundaDaSemana(iso) {
    const d = dataObj(iso);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? 1 : 1 - dow)); // domingo aponta para a semana seguinte
    return d;
  }
  function rotuloSemana(seg, sab) {
    if (seg.getMonth() === sab.getMonth()) return `${seg.getDate()} a ${sab.getDate()} de ${MES_ABREV[sab.getMonth()]} de ${sab.getFullYear()}`;
    return `${seg.getDate()} de ${MES_ABREV[seg.getMonth()]} a ${sab.getDate()} de ${MES_ABREV[sab.getMonth()]} de ${sab.getFullYear()}`;
  }
  function evConsulta(c) {
    const cls = !ATIVA(c.status) ? "ev c" : c.status === "Agendada" ? "ev b" : "ev";
    return `<div class="${cls}" role="button" tabindex="0" data-pid="${c.paciente_id}" title="Abrir ficha do paciente">
      <b>${c.hora} ${esc(c.paciente_nome)}</b>${esc(c.procedimento_nome)} · ${esc(c.sala_nome)}${todos() ? "<br>" + esc(c.dentista_nome) : ""}</div>`;
  }
  function renderSemana(seg) {
    $("semana").innerHTML = DIAS_SEMANA.map((nome, i) => {
      const d = new Date(seg);
      d.setDate(seg.getDate() + i);
      const iso = toIso(d);
      const eventos = semana.filter((c) => c.data === iso).map(evConsulta).join("");
      return `<div class="${iso === hojeIso() ? "hoje" : ""}">
        <h3><button type="button" data-d="${iso}" aria-label="Abrir agenda de ${fmtBR(iso)}">${nome} ${d.getDate()}</button></h3>
        ${eventos || `<p class="sub vazio-dia">Sem consultas</p>`}</div>`;
    }).join("");
    $("totalPacientes").textContent = semana.filter((c) => ATIVA(c.status)).length;
    $("totalPendentes").textContent = semana.filter((c) => c.status === "Agendada").length;
  }

  function renderTudo() {
    aplicarVisao();
    if (visao === "dia") {
      $("subtituloData").textContent = fmtLonga(dataSel);
      $("dataCompleta").textContent = fmtBR(dataSel);
      renderAgenda();
      renderCalendario();
      renderLista();
    } else {
      const seg = segundaDaSemana(dataSel);
      const sab = new Date(seg);
      sab.setDate(seg.getDate() + 5);
      $("subtituloData").textContent = "Visão semanal";
      $("dataCompleta").textContent = rotuloSemana(seg, sab);
      renderSemana(seg);
    }
  }

  function selecionarData(iso) {
    dataSel = iso;
    const d = dataObj(iso);
    mes = { ano: d.getFullYear(), mes: d.getMonth() };
    atualizar();
  }
  function moverPeriodo(direcao) {
    const d = dataObj(dataSel);
    d.setDate(d.getDate() + direcao * (visao === "dia" ? 1 : 7));
    selecionarData(toIso(d));
  }

  // ===== SELETOR DE HORÁRIOS LIVRES (usado em nova consulta e remarcar) =====
  function seletorHorario({ dataEl, slotsEl, salaEl, params, onChange }) {
    let slots = [], escolhido = null, seq = 0;
    function preencherSalas(preferida) {
      if (!escolhido) {
        salaEl.innerHTML = "";
        salaEl.disabled = true;
        return;
      }
      const livres = salas.filter((s) => escolhido.salas_livres.includes(s.id));
      salaEl.innerHTML = livres.map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("");
      if (preferida && livres.some((s) => s.id === preferida)) salaEl.value = String(preferida);
      salaEl.disabled = false;
    }
    async function carregar(salaPreferida) {
      const p = params();
      escolhido = null;
      slots = [];
      preencherSalas();
      if (!p || !dataEl.value) {
        slotsEl.innerHTML = `<p class="sub">Escolha dentista, procedimento e data para ver os horários livres.</p>`;
        onChange();
        return;
      }
      slotsEl.innerHTML = `<p class="sub">Buscando horários…</p>`;
      const mine = ++seq;
      try {
        const r = await api.get("/consultas/disponibilidade", { ...p, data: dataEl.value });
        if (mine !== seq) return;
        slots = r.horarios;
        slotsEl.innerHTML = slots.length
          ? slots.map((s, i) => `<button type="button" class="filter" data-slot="${i}">${partes(s.inicio).hora}</button>`).join("")
          : `<p class="sub">Nenhum horário livre neste dia.</p>`;
        slotsEl._pref = salaPreferida;
      } catch (e) {
        if (mine !== seq) return;
        slotsEl.innerHTML = `<p class="msg-erro">${esc(e.detalhe ?? e.message)}</p>`;
      }
      onChange();
    }
    slotsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-slot]");
      if (!b) return;
      escolhido = slots[Number(b.dataset.slot)];
      slotsEl.querySelectorAll(".filter").forEach((x) => x.classList.toggle("active", x === b));
      preencherSalas(slotsEl._pref);
      onChange();
    });
    salaEl.addEventListener("change", onChange);
    dataEl.addEventListener("change", () => carregar(slotsEl._pref));
    return {
      carregar,
      get escolhido() { return escolhido; },
      get salaId() { return Number(salaEl.value) || null; },
    };
  }

  // ===== NOVA CONSULTA =====
  const mostrarAlerta = (texto, tipo = "conflito") => {
    const a = $("alertaAgenda");
    a.className = "alert " + tipo;
    a.innerHTML = texto ? (tipo === "conflito" ? ic("alert") : "") + `<div>${esc(texto)}</div>` : "";
    a.hidden = !texto;
  };

  function atualizarEstadoNova() {
    if (pacienteSel?.inadimplente)
      mostrarAlerta(`Paciente inadimplente há ${pacienteSel.dias_pendencia} dias: o agendamento fica bloqueado até a regularização.`);
    else if ($("alertaAgenda").dataset.fixo !== "1") mostrarAlerta("");
    $("salvarConsulta").disabled = !(pacienteSel && !pacienteSel.inadimplente && seletorNova.escolhido && seletorNova.salaId);
  }

  const seletorNova = seletorHorario({
    dataEl: $("data"), slotsEl: $("slots"), salaEl: $("sala"),
    params: () => ($("dentistaForm").value && $("procedimentoForm").value
      ? { dentista_id: $("dentistaForm").value, procedimento_id: $("procedimentoForm").value } : null),
    onChange: () => {
      $("alertaAgenda").dataset.fixo = "";
      atualizarEstadoNova();
    },
  });

  let pacientesMap = new Map();
  const rotuloPaciente = (p) => `${p.nome} · CPF ${p.cpf_mascarado}${p.inadimplente ? " · INADIMPLENTE" : ""}`;
  function resolverPaciente() {
    pacienteSel = pacientesMap.get($("nome").value) ?? null;
    atualizarEstadoNova();
  }
  async function carregarPacientes(termo) {
    try {
      const lista = await api.get("/pacientes", { nome: termo || undefined, limit: termo ? 20 : 100 });
      pacientesMap = new Map(lista.map((p) => [rotuloPaciente(p), p]));
      $("listaNomes").innerHTML = [...pacientesMap.keys()].map((k) => `<option value="${esc(k)}">`).join("");
      resolverPaciente();
    } catch {
      /* sem lista de sugestões: o campo continua digitável */
    }
  }
  let timerPac;
  $("nome").addEventListener("input", () => {
    resolverPaciente();
    clearTimeout(timerPac);
    const t = $("nome").value.trim();
    if (t.length >= 2 && !pacienteSel) timerPac = setTimeout(() => carregarPacientes(t), 300);
  });
  $("dentistaForm").addEventListener("change", () => seletorNova.carregar());
  $("procedimentoForm").addEventListener("change", () => seletorNova.carregar());

  function abrirNova() {
    $("formAgendamento").reset();
    $("dentistaForm").innerHTML = dentistas.map((d) => `<option value="${d.id}">${esc(d.nome)}</option>`).join("");
    $("procedimentoForm").innerHTML = procedimentos.map((p) => `<option value="${p.id}">${esc(p.nome)} (${p.duracao_min} min)</option>`).join("");
    if (dentistaId) $("dentistaForm").value = dentistaId;
    $("data").min = hojeIso();
    $("data").value = dataSel < hojeIso() ? hojeIso() : dataSel;
    pacienteSel = null;
    $("nome").value = "";
    seletorNova.carregar();
    carregarPacientes("");
    if (!dentistas.length || !procedimentos.length) {
      mostrarAlerta(!dentistas.length ? "Cadastre ao menos um dentista ativo antes de agendar." : "Nenhum procedimento cadastrado.");
      $("alertaAgenda").dataset.fixo = "1";
    } else mostrarAlerta("");
    $("modal").classList.add("ativo");
    $("nome").focus();
  }

  $("formAgendamento").addEventListener("submit", async (e) => {
    e.preventDefault();
    const slot = seletorNova.escolhido;
    if (!pacienteSel) return mostrarAlerta("Selecione um paciente da lista.");
    if (!slot || !seletorNova.salaId) return mostrarAlerta("Escolha um horário livre e o consultório.");
    const botao = $("salvarConsulta");
    botao.disabled = true;
    try {
      const c = await api.post("/consultas", {
        paciente_id: pacienteSel.id,
        dentista_id: Number($("dentistaForm").value),
        sala_id: seletorNova.salaId,
        procedimento_id: Number($("procedimentoForm").value),
        inicio: slot.inicio,
      });
      const p = partes(c.inicio);
      fecharTudo();
      toast(`Consulta agendada para ${fmtBR(p.data)} às ${p.hora}.`);
      selecionarData(p.data);
    } catch (err) {
      const msg = err.detalhe ?? err.message;
      if (err.status === 409) await seletorNova.carregar(); // outro usuário pode ter ocupado o horário
      else botao.disabled = false;
      mostrarAlerta(msg);
      $("alertaAgenda").dataset.fixo = "1"; // mantém a mensagem até escolher outro horário
    }
  });

  // ===== CANCELAR / REMARCAR / STATUS =====
  const resumo = (c) => `${c.paciente_nome} · ${c.procedimento_nome} · ${c.dentista_nome} · ${fmtBR(c.data)} às ${c.hora}`;

  async function mudarStatus(c, status, msg) {
    try {
      await api.patch(`/consultas/${c.id}/status`, { status });
      toast(msg);
      await atualizar();
    } catch (e) {
      toast(e.detalhe ?? e.message);
    }
  }

  function abrirCancelar(c) {
    consultaAcao = c;
    $("resumoCancelar").textContent = resumo(c);
    $("motivoCancelar").value = "";
    $("erroCancelar").textContent = "";
    $("modalCancelar").classList.add("ativo");
    $("motivoCancelar").focus();
  }
  $("formCancelar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = $("motivoCancelar").value.trim();
    if (motivo.length < 5) return ($("erroCancelar").textContent = "Informe o motivo do cancelamento (mínimo 5 caracteres).");
    const botao = $("confirmarCancelar");
    botao.disabled = true;
    try {
      await api.post(`/consultas/${consultaAcao.id}/cancelar`, { motivo });
      fecharTudo();
      toast("Consulta cancelada.");
      await atualizar();
    } catch (err) {
      $("erroCancelar").textContent = err.detalhe ?? err.message;
    } finally {
      botao.disabled = false;
    }
  });

  const seletorRem = seletorHorario({
    dataEl: $("dataRem"), slotsEl: $("slotsRem"), salaEl: $("salaRem"),
    params: () => (consultaAcao ? { dentista_id: consultaAcao.dentista_id, procedimento_id: consultaAcao.procedimento_id } : null),
    onChange: () => {
      $("salvarRem").disabled = !(seletorRem.escolhido && seletorRem.salaId);
    },
  });
  function abrirRemarcar(c) {
    consultaAcao = c;
    $("resumoRemarcar").textContent = `Atual: ${resumo(c)}`;
    $("dataRem").min = hojeIso();
    $("dataRem").value = c.data < hojeIso() ? hojeIso() : c.data;
    $("motivoRem").value = "";
    $("erroRem").textContent = "";
    $("salvarRem").disabled = true;
    seletorRem.carregar(c.sala_id);
    $("modalRemarcar").classList.add("ativo");
  }
  $("formRemarcar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = $("motivoRem").value.trim();
    const slot = seletorRem.escolhido;
    if (!slot || !seletorRem.salaId) return ($("erroRem").textContent = "Escolha um novo horário livre.");
    if (motivo.length < 5) return ($("erroRem").textContent = "Informe o motivo da remarcação (mínimo 5 caracteres).");
    const botao = $("salvarRem");
    botao.disabled = true;
    try {
      const c = await api.post(`/consultas/${consultaAcao.id}/remarcar`, { inicio: slot.inicio, sala_id: seletorRem.salaId, motivo });
      const p = partes(c.inicio);
      fecharTudo();
      toast(`Consulta remarcada para ${fmtBR(p.data)} às ${p.hora}.`);
      selecionarData(p.data);
    } catch (err) {
      const msg = err.detalhe ?? err.message;
      if (err.status === 409) await seletorRem.carregar(consultaAcao.sala_id);
      else botao.disabled = false;
      $("erroRem").textContent = msg;
    }
  });

  // ===== HISTÓRICO DA CONSULTA E FICHA DO PACIENTE =====
  function textoHistorico(h) {
    if (h.acao === "criada") return "Consulta agendada";
    if (h.acao === "status") return `Status: ${h.status_anterior} → ${h.status_novo}`;
    if (h.acao === "cancelada") return `Cancelada. Motivo: ${h.motivo}`;
    const a = h.inicio_anterior && partes(h.inicio_anterior);
    const n = h.inicio_novo && partes(h.inicio_novo);
    if (a && n && (a.data !== n.data || a.hora !== n.hora))
      return `Remarcada: ${fmtBR(a.data)} ${a.hora} → ${fmtBR(n.data)} ${n.hora}. Motivo: ${h.motivo}`;
    return h.motivo || "Alteração registrada";
  }
  async function abrirHistorico(id) {
    $("listaHistorico").innerHTML = "<li>Carregando…</li>";
    $("modalHistorico").classList.add("ativo");
    try {
      const r = await api.get(`/consultas/${id}`);
      $("listaHistorico").innerHTML = r.historico
        .map((h) => `<li>${esc(textoHistorico(h))}<small>${quando(h.criado_em)} · ${esc(h.usuario_nome ?? "—")}</small></li>`)
        .join("") || "<li>Sem registros.</li>";
    } catch (e) {
      $("listaHistorico").innerHTML = `<li>${esc(e.detalhe ?? e.message)}</li>`;
    }
  }

  async function abrirFicha(pid) {
    $("prontNome").textContent = "Carregando…";
    $("prontIni").textContent = "";
    $("prontResumo").innerHTML = "";
    $("prontHistorico").innerHTML = "";
    $("modalProntuario").classList.add("ativo");
    try {
      const [p, lista] = await Promise.all([
        api.get(`/pacientes/${pid}`),
        api.get("/consultas", { paciente_id: pid, de: "2000-01-01", ate: "2100-12-31" }),
      ]);
      const hist = lista.map(norm);
      const agora = new Date();
      const ultima = [...hist].reverse().find((c) => c.status === "Concluída" && new Date(c.fim) < agora);
      const proxima = hist.find((c) => new Date(c.inicio) >= agora && (c.status === "Agendada" || c.status === "Confirmada"));
      $("prontNome").textContent = p.nome;
      $("prontIni").textContent = iniciais(p.nome);
      $("prontResumo").innerHTML = `
        <div><span>Consultas registradas</span><b>${hist.length}</b></div>
        <div><span>Última consulta</span><b>${ultima ? fmtBR(ultima.data) : "—"}</b></div>
        <div><span>Próxima consulta</span><b>${proxima ? fmtBR(proxima.data) + " · " + proxima.hora : "—"}</b></div>`;
      $("prontHistorico").innerHTML = [...hist].reverse().map((c) => `<div class="hist-item">
        <div><strong>${fmtBR(c.data)} · ${c.hora}</strong><span class="sub" style="display:block">${esc(c.procedimento_nome)} · ${esc(c.dentista_nome)}</span></div>
        <span class="badge ${c.status === "Concluída" || c.status === "Confirmada" ? "" : "p"}">${c.status === "Concluída" ? "Realizada" : esc(c.status)}</span>
      </div>`).join("") || `<p class="vazio">Nenhuma consulta registrada.</p>`;
    } catch (e) {
      $("prontNome").textContent = "Ficha do paciente";
      $("prontHistorico").innerHTML = `<p class="vazio">${esc(e.detalhe ?? e.message)}</p>`;
    }
  }

  // ===== EVENTOS =====
  function fecharTudo() {
    document.querySelectorAll(".modal.ativo").forEach((m) => m.classList.remove("ativo"));
  }

  async function acao(tipo, id) {
    const c = [...doDia, ...semana].find((x) => x.id === Number(id));
    if (!c) return;
    if (tipo === "confirmar") await mudarStatus(c, "Confirmada", "Consulta confirmada.");
    else if (tipo === "falta") {
      if (confirm(`Registrar falta injustificada de ${c.paciente_nome}?`)) await mudarStatus(c, "Falta Injustificada", "Falta registrada.");
    } else if (tipo === "cancelar") abrirCancelar(c);
    else if (tipo === "remarcar") abrirRemarcar(c);
    else if (tipo === "historico") abrirHistorico(c.id);
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) return fecharTudo();
    const a = e.target.closest("[data-acao]");
    if (a) return acao(a.dataset.acao, a.dataset.id);
    const cab = e.target.closest(".week h3 button[data-d]");
    if (cab) {
      visao = "dia"; // clicar no dia abre a agenda diária
      return selecionarData(cab.dataset.d);
    }
    const p = e.target.closest("[data-pid]");
    if (p) abrirFicha(p.dataset.pid);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharTudo();
    if (e.key === "Enter" || e.key === " ") {
      const ev = e.target.closest && e.target.closest(".ev[data-pid]");
      if (ev) {
        e.preventDefault();
        abrirFicha(ev.dataset.pid);
      }
    }
  });
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) fecharTudo();
    }),
  );

  $("cal").addEventListener("click", (e) => {
    const d = e.target.closest(".dia");
    if (d) selecionarData(d.dataset.d);
  });
  $("mesAnterior").addEventListener("click", () => {
    mes = mes.mes === 0 ? { ano: mes.ano - 1, mes: 11 } : { ano: mes.ano, mes: mes.mes - 1 };
    carregarMes();
  });
  $("mesProximo").addEventListener("click", () => {
    mes = mes.mes === 11 ? { ano: mes.ano + 1, mes: 0 } : { ano: mes.ano, mes: mes.mes + 1 };
    carregarMes();
  });
  $("diaAnterior").addEventListener("click", () => moverPeriodo(-1));
  $("proximoDia").addEventListener("click", () => moverPeriodo(1));
  $("verDia").addEventListener("click", () => {
    visao = "dia";
    atualizar();
  });
  $("verSemana").addEventListener("click", () => {
    visao = "semana";
    atualizar();
  });
  let timerBusca;
  $("buscaPaciente").addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(renderLista, 300);
  });
  $("dentista").addEventListener("change", (e) => {
    dentistaId = e.target.value;
    atualizar();
  });
  $("abrirModal").addEventListener("click", abrirNova);

  // ===== INÍCIO =====
  async function iniciar() {
    $("agenda").innerHTML = `<p class="vazio">Carregando…</p>`;
    if (location.hash === "#semana") visao = "semana"; // agenda.html#semana abre direto na semana
    try {
      [dentistas, salas, procedimentos] = await Promise.all([
        api.get("/dentistas", { ativo: "true" }),
        api.get("/salas", { ativa: "true" }),
        api.get("/procedimentos"),
      ]);
    } catch (e) {
      return mostrarErro(e, iniciar);
    }
    $("dentista").innerHTML =
      `<option value="">Todos os dentistas</option>` + dentistas.map((d) => `<option value="${d.id}">${esc(d.nome)}</option>`).join("");
    $("totalSalas").textContent = salas.length;
    atualizar();
  }
  iniciar();
});
