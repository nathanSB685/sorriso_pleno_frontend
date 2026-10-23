document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const ic = (n) => (typeof svg === "function" ? svg(n) : "");

  const HOJE = "2026-09-25"; // data de referência do protótipo
  const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const MES_ABREV = [
    "jan.",
    "fev.",
    "mar.",
    "abr.",
    "mai.",
    "jun.",
    "jul.",
    "ago.",
    "set.",
    "out.",
    "nov.",
    "dez.",
  ];
  const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const TODOS = "Todos os dentistas";

  // ===== REGRAS DA CLÍNICA =====
  const ABRE = 8 * 60; // 08:00
  const FECHA = 18 * 60; // 18:00
  const FECHA_SAB = 12 * 60; // sábado encerra às 12:00
  const ALMOCO = [12 * 60, 13 * 60]; // 12:00 às 13:00
  const SALAS = ["Sala 01", "Sala 02"];
  const SALA_PADRAO = {
    "Dra. Renata Santos": "Sala 01",
    "Dr. Carlos Mendes": "Sala 02",
    "Dra. Ana Lima": "Sala 01",
  };
  const DENTISTAS = Object.keys(SALA_PADRAO);

  // ===== DADOS (protótipo, ficam só na memória da página) =====
  const consultas = [
    [
      "2026-09-18",
      "09:00",
      "10:00",
      "Carlos Silva",
      "Avaliação",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 02",
    ],
    [
      "2026-09-25",
      "08:00",
      "09:00",
      "Ana Ferreira",
      "Consulta",
      "Confirmado",
      "Dra. Renata Santos",
      "Sala 01",
    ],
    [
      "2026-09-25",
      "09:00",
      "10:00",
      "Carlos Silva",
      "Limpeza Dental",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 02",
    ],
    [
      "2026-09-25",
      "10:30",
      "11:30",
      "Mariana Costa",
      "Restauração",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 02",
    ],
    [
      "2026-09-25",
      "11:00",
      "12:00",
      "Camila Ribeiro",
      "Instalação de Aparelho",
      "Confirmado",
      "Dra. Ana Lima",
      "Sala 01",
    ],
    [
      "2026-09-25",
      "14:00",
      "15:00",
      "Pedro Almeida",
      "Extração",
      "Pendente",
      "Dra. Renata Santos",
      "Sala 01",
    ],
    [
      "2026-09-25",
      "15:30",
      "16:30",
      "Luciana Mendes",
      "Ortodontia",
      "Confirmado",
      "Dra. Ana Lima",
      "Sala 02",
    ],
    [
      "2026-09-26",
      "08:00",
      "09:00",
      "Beatriz Alves",
      "Consulta Inicial",
      "Confirmado",
      "Dra. Renata Santos",
      "Sala 01",
    ],
    [
      "2026-09-26",
      "09:00",
      "10:00",
      "Rodrigo Pereira",
      "Avaliação Ortodôntica",
      "Pendente",
      "Dra. Ana Lima",
      "Sala 02",
    ],
    [
      "2026-09-28",
      "09:00",
      "10:00",
      "Maria Santos",
      "Avaliação Ortodôntica",
      "Confirmado",
      "Dra. Ana Lima",
      "Sala 02",
    ],
    [
      "2026-09-28",
      "10:00",
      "11:00",
      "Carlos Silva",
      "Retorno",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 01",
    ],
    [
      "2026-09-28",
      "14:30",
      "15:30",
      "Ana Ferreira",
      "Clareamento",
      "Confirmado",
      "Dra. Renata Santos",
      "Sala 01",
    ],
    [
      "2026-09-29",
      "09:30",
      "10:30",
      "Mariana Costa",
      "Revisão",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 02",
    ],
    [
      "2026-09-30",
      "11:00",
      "12:00",
      "Pedro Almeida",
      "Retorno de Extração",
      "Pendente",
      "Dra. Renata Santos",
      "Sala 01",
    ],
    [
      "2026-09-30",
      "15:00",
      "16:00",
      "Juliana Martins",
      "Limpeza Dental",
      "Confirmado",
      "Dr. Carlos Mendes",
      "Sala 02",
    ],
    [
      "2026-10-02",
      "16:00",
      "17:00",
      "Luciana Mendes",
      "Manutenção Ortodôntica",
      "Confirmado",
      "Dra. Ana Lima",
      "Sala 02",
    ],
  ].map(([data, hora, fim, nome, procedimento, status, dentista, sala], i) => ({
    id: i + 1,
    data,
    hora,
    fim,
    nome,
    procedimento,
    status,
    dentista,
    sala,
  }));

  // Horários bloqueados (reuniões, cursos, folgas): o dentista fica indisponível
  const bloqueios = [
    {
      data: "2026-09-25",
      hora: "09:30",
      fim: "10:30",
      dentista: "Dra. Renata Santos",
      motivo: "Horário bloqueado",
    },
    {
      data: "2026-09-29",
      hora: "14:00",
      fim: "16:00",
      dentista: "Dra. Ana Lima",
      motivo: "Reunião de equipe",
    },
  ];

  let proximoId = consultas.length + 1;
  let dentista = $("dentista").value;
  let dataSel = HOJE;
  let mes = { ano: 2026, mes: 8 };
  let pacienteAberto = "";
  let visao = "dia"; // "dia" | "semana"
  let tToast;

  const todos = () => dentista === TODOS;
  const minhas = () =>
    todos() ? consultas : consultas.filter((c) => c.dentista === dentista);
  const bloqueiosDe = (iso) =>
    bloqueios.filter(
      (b) => b.data === iso && (todos() || b.dentista === dentista),
    );

  // ===== UTILITÁRIOS =====
  const pad = (n) => String(n).padStart(2, "0");
  const aMin = (h) => {
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
  };
  const aHora = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const dataObj = (iso) => new Date(iso + "T12:00:00");
  const toIso = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtBR = (iso) => iso.split("-").reverse().join("/");
  const fmtLonga = (iso) => {
    const t = dataObj(iso).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  const iniciais = (n) =>
    n
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  const porHorario = (a, b) => (a.data + a.hora).localeCompare(b.data + b.hora);
  const chaveNotas = (n) => "sorrisopleno:prontuario:" + n;
  const lerNotas = (n) => {
    try {
      return localStorage.getItem(chaveNotas(n)) || "";
    } catch (e) {
      return "";
    }
  };
  const gravarNotas = (n, t) => {
    try {
      localStorage.setItem(chaveNotas(n), t);
    } catch (e) {}
  };
  function aviso(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(tToast);
    tToast = setTimeout(() => (t.style.display = "none"), 3000);
  }

  // ===== AGENDAMENTO INTELIGENTE: validação de choques =====
  const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && aFim > bIni;

  // Devolve a lista de problemas do horário pedido. Lista vazia = horário livre.
  // Cada problema: { tipos: [...], msg } (tipos ajudam a decidir qual sugestão dar)
  function validar({ data, hora, duracao, dentista: dent, sala, nome }) {
    const erros = [];
    const ini = aMin(hora);
    const fim = ini + duracao;
    const dow = dataObj(data).getDay(); // 0 = domingo

    if (data < HOJE)
      erros.push({
        tipos: ["regra"],
        msg: "Não é possível agendar em uma data que já passou.",
      });

    if (dow === 0) {
      erros.push({
        tipos: ["regra"],
        msg: "A clínica não atende aos domingos.",
      });
    } else {
      const fecha = dow === 6 ? FECHA_SAB : FECHA;
      if (ini < ABRE || fim > fecha)
        erros.push({
          tipos: ["regra"],
          msg: `Fora do expediente (08:00 às ${aHora(fecha)}${dow === 6 ? ", aos sábados" : ""}).`,
        });
      if (sobrepoe(ini, fim, ALMOCO[0], ALMOCO[1]))
        erros.push({
          tipos: ["regra"],
          msg: "Choca com o intervalo de almoço (12:00 às 13:00).",
        });
    }

    consultas
      .filter(
        (c) => c.data === data && sobrepoe(ini, fim, aMin(c.hora), aMin(c.fim)),
      )
      .forEach((c) => {
        const motivos = [];
        const tipos = [];
        if (c.dentista === dent) {
          motivos.push("dentista ocupado");
          tipos.push("dentista");
        }
        if (c.sala === sala) {
          motivos.push("sala ocupada");
          tipos.push("sala");
        }
        if (nome && c.nome.toLowerCase() === nome.toLowerCase()) {
          motivos.push("paciente já agendado");
          tipos.push("paciente");
        }
        if (motivos.length)
          erros.push({
            tipos,
            msg: `${c.nome} (${c.hora}–${c.fim}, ${c.dentista}, ${c.sala}): ${motivos.join(", ")}.`,
          });
      });

    bloqueios
      .filter(
        (b) =>
          b.data === data &&
          b.dentista === dent &&
          sobrepoe(ini, fim, aMin(b.hora), aMin(b.fim)),
      )
      .forEach((b) =>
        erros.push({
          tipos: ["bloqueio"],
          msg: `${dent} indisponível das ${b.hora} às ${b.fim}: ${b.motivo}.`,
        }),
      );

    return erros;
  }

  // Procura o próximo horário livre (de 30 em 30 min) nos próximos 14 dias
  function sugerir(v) {
    const base = v.data < HOJE ? HOJE : v.data;
    const d = dataObj(base);
    for (let i = 0; i < 14; i++) {
      const iso = toIso(d);
      let m = i === 0 && base === v.data ? Math.max(aMin(v.hora), ABRE) : ABRE;
      m = Math.ceil(m / 30) * 30;
      for (; m + v.duracao <= FECHA; m += 30) {
        if (!validar({ ...v, data: iso, hora: aHora(m) }).length)
          return { data: iso, hora: aHora(m) };
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  const lerForm = () => ({
    data: $("data").value,
    hora: $("hora").value,
    duracao: Number($("duracao").value),
    dentista: $("dentistaForm").value,
    sala: $("sala").value,
    nome: $("nome").value.trim(),
  });

  // Valida o formulário, mostra o aviso e liga/desliga o botão Salvar
  function atualizarValidacao() {
    const v = lerForm();
    const alerta = $("alertaAgenda");
    if (!v.data || !v.hora) {
      alerta.hidden = true;
      alerta.innerHTML = "";
      $("salvarConsulta").disabled = false;
      return [];
    }
    const erros = validar(v);
    $("salvarConsulta").disabled = erros.length > 0;

    if (!erros.length) {
      alerta.className = "alert livre";
      alerta.innerHTML = `<div><strong>✓ Horário disponível</strong><br>Sem choque de dentista, sala ou paciente.</div>`;
      alerta.hidden = false;
      return erros;
    }

    const lista = erros.map((e) => `<li>${esc(e.msg)}</li>`).join("");
    let extra = "";
    const soSala = erros.every(
      (e) => e.tipos.length === 1 && e.tipos[0] === "sala",
    );
    if (soSala) {
      const outra = SALAS.find(
        (s) => s !== v.sala && !validar({ ...v, sala: s }).length,
      );
      if (outra)
        extra = `<p class="sug">${esc(outra)} está livre neste horário.
          <button type="button" class="btn sec sm" data-acao="sala" data-valor="${esc(outra)}">Trocar para ${esc(outra)}</button></p>`;
    }
    if (!extra) {
      const s = sugerir(v);
      extra = s
        ? `<p class="sug">Próximo horário livre: <strong>${fmtBR(s.data)} às ${s.hora}</strong>
            <button type="button" class="btn sec sm" data-acao="horario" data-data="${s.data}" data-hora="${s.hora}">Usar este horário</button></p>`
        : `<p class="sug">Nenhum horário livre nos próximos 14 dias com esses parâmetros.</p>`;
    }
    alerta.className = "alert conflito";
    alerta.innerHTML = `${ic("alert")}<div><strong>Choque de horário</strong><ul>${lista}</ul>${extra}</div>`;
    alerta.hidden = false;
    return erros;
  }

  function popularNomes() {
    const nomes = [...new Set(consultas.map((c) => c.nome))].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
    $("listaNomes").innerHTML = nomes
      .map((n) => `<option value="${esc(n)}">`)
      .join("");
  }

  // ===== VISÃO DIA: agenda (lista da esquerda) =====
  function cartao(c) {
    const pend = c.status === "Pendente";
    return `<article class="consulta ${pend ? "pendente" : "confirmada"}">
            <div class="hora-consulta">${c.hora}<br><small>${c.fim}</small></div>
            <div class="info"><strong>${esc(c.nome)}</strong><span>${esc(c.procedimento)} · ${esc(c.sala)}${todos() ? " · " + esc(c.dentista) : ""}</span></div>
            <span class="status ${pend ? "status-pendente" : ""}">${c.status}</span>
            <button class="prontuario" data-nome="${esc(c.nome)}">${ic("file")} Prontuário</button>
        </article>`;
  }

  function blocoHtml(b) {
    return `<div class="hr almoco"><span>${b.hora}</span><em>${esc(b.motivo)}${todos() ? " · " + esc(b.dentista) : ""}</em></div>`;
  }

  function renderAgenda() {
    const doDia = minhas()
      .filter((c) => c.data === dataSel)
      .sort(porHorario);
    const blocos = bloqueiosDe(dataSel);
    const usados = new Set();
    let html = doDia.length
      ? ""
      : `<p class="vazio">Nenhuma consulta marcada para este dia.</p>`;

    for (let h = 8; h < 18; h++) {
      const noSlot = doDia.filter((c) => Math.floor(aMin(c.hora) / 60) === h);
      const blocosSlot = blocos.filter(
        (b) => Math.floor(aMin(b.hora) / 60) === h,
      );
      const ocupado =
        doDia.some(
          (c) => aMin(c.hora) < (h + 1) * 60 && aMin(c.fim) > h * 60,
        ) ||
        blocos.some((b) => aMin(b.hora) < (h + 1) * 60 && aMin(b.fim) > h * 60);
      if (h === 12)
        html += `<div class="hr almoco"><span>12:00</span><em>Almoço</em></div>`;
      else if (!noSlot.length && !blocosSlot.length && !ocupado)
        html += `<div class="hr">${aHora(h * 60)}</div>`;
      html += blocosSlot.map(blocoHtml).join("");
      html += noSlot.map(cartao).join("");
      noSlot.forEach((c) => usados.add(c.id));
    }
    html += doDia
      .filter((c) => !usados.has(c.id))
      .map(cartao)
      .join(""); // fora do expediente
    $("agenda").innerHTML = html;

    $("totalPacientes").textContent = doDia.length;
    $("totalPendentes").textContent = doDia.filter(
      (c) => c.status === "Pendente",
    ).length;
  }

  // ===== VISÃO DIA: calendário (direita) =====
  function renderCalendario() {
    $("calTitulo").textContent = `${MESES[mes.mes]} ${mes.ano}`;
    const vazios = new Date(mes.ano, mes.mes, 1).getDay();
    const total = new Date(mes.ano, mes.mes + 1, 0).getDate();
    const comConsulta = new Set(minhas().map((c) => c.data));
    let html =
      ["D", "S", "T", "Q", "Q", "S", "S"].map((d) => `<b>${d}</b>`).join("") +
      "<i></i>".repeat(vazios);
    for (let d = 1; d <= total; d++) {
      const k = `${mes.ano}-${pad(mes.mes + 1)}-${pad(d)}`;
      html += `<button type="button" class="dia${k === dataSel ? " sel" : ""}${comConsulta.has(k) ? " tem" : ""}" data-d="${k}" aria-label="${fmtBR(k)}">${d}</button>`;
    }
    $("cal").innerHTML = html;
  }

  // ===== VISÃO DIA: lista lateral / busca =====
  function itemMini(nome, info, data) {
    return `<div class="paciente-mini">
            <div data-d="${data}"><strong>${esc(nome)}</strong><span>${info}</span></div>
            <button class="prontuario" data-nome="${esc(nome)}">${ic("file")} Prontuário</button>
        </div>`;
  }

  function renderLista() {
    const termo = $("buscaPaciente").value.toLowerCase().trim();
    let html = "";
    if (!termo) {
      $("tituloLista").textContent = "Próximos pacientes";
      const doDia = minhas()
        .filter((c) => c.data === dataSel)
        .sort(porHorario);
      html =
        doDia
          .map((c) => itemMini(c.nome, `${c.hora} — ${c.fim}`, c.data))
          .join("") || `<p class="vazio">Sem pacientes neste dia.</p>`;
    } else {
      $("tituloLista").textContent = "Resultados da busca";
      const nomes = [...new Set(minhas().map((c) => c.nome))].filter((n) =>
        n.toLowerCase().includes(termo),
      );
      html =
        nomes
          .map((n) => {
            const hist = minhas()
              .filter((c) => c.nome === n)
              .sort(porHorario);
            const ref =
              hist.find((c) => c.data >= HOJE) || hist[hist.length - 1];
            return itemMini(
              n,
              `${ref.data >= HOJE ? "Próxima" : "Última"}: ${fmtBR(ref.data)} · ${ref.hora}`,
              ref.data,
            );
          })
          .join("") || `<p class="vazio">Nenhum paciente encontrado.</p>`;
    }
    $("listaPacientes").innerHTML = html;
  }

  // ===== VISÃO SEMANA =====
  // Segunda-feira da semana de dataSel (domingo aponta para a semana seguinte)
  function segundaDaSemana(iso) {
    const d = dataObj(iso);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? 1 : 1 - dow));
    return d;
  }

  function rotuloSemana(seg, sab) {
    if (seg.getMonth() === sab.getMonth())
      return `${seg.getDate()} a ${sab.getDate()} de ${MES_ABREV[sab.getMonth()]} de ${sab.getFullYear()}`;
    return `${seg.getDate()} de ${MES_ABREV[seg.getMonth()]} a ${sab.getDate()} de ${MES_ABREV[sab.getMonth()]} de ${sab.getFullYear()}`;
  }

  function evConsulta(c) {
    const cls = c.status === "Pendente" ? "ev b" : "ev";
    return `<div class="${cls}" role="button" tabindex="0" data-nome="${esc(c.nome)}" title="Abrir prontuário">
        <b>${c.hora} ${esc(c.nome)}</b>${esc(c.procedimento)} · ${esc(c.sala)}${todos() ? "<br>" + esc(c.dentista) : ""}
      </div>`;
  }

  function evBloqueio(b) {
    return `<div class="ev c"><b>${b.hora} Reservado</b>${esc(b.motivo)}${todos() ? "<br>" + esc(b.dentista) : ""}</div>`;
  }

  function renderSemana(seg) {
    let total = 0;
    let pendentes = 0;
    const html = DIAS_SEMANA.map((nome, i) => {
      const d = new Date(seg);
      d.setDate(seg.getDate() + i);
      const iso = toIso(d);
      const cs = minhas().filter((c) => c.data === iso);
      total += cs.length;
      pendentes += cs.filter((c) => c.status === "Pendente").length;
      const eventos = [
        ...cs.map((c) => ({ h: c.hora, html: evConsulta(c) })),
        ...bloqueiosDe(iso).map((b) => ({ h: b.hora, html: evBloqueio(b) })),
      ]
        .sort((a, b) => a.h.localeCompare(b.h))
        .map((e) => e.html)
        .join("");
      return `<div class="${iso === HOJE ? "hoje" : ""}">
          <h3><button type="button" data-d="${iso}" aria-label="Abrir agenda de ${fmtBR(iso)}">${nome} ${d.getDate()}</button></h3>
          ${eventos || `<p class="sub vazio-dia">Sem consultas</p>`}
        </div>`;
    }).join("");
    $("semana").innerHTML = html;
    $("totalPacientes").textContent = total;
    $("totalPendentes").textContent = pendentes;
  }

  // ===== RENDER GERAL =====
  function renderTudo() {
    const dia = visao === "dia";
    $("visaoDia").hidden = !dia;
    $("visaoSemana").hidden = dia;
    $("verDia").classList.toggle("active", dia);
    $("verSemana").classList.toggle("active", !dia);
    $("verDia").setAttribute("aria-pressed", String(dia));
    $("verSemana").setAttribute("aria-pressed", String(!dia));
    $("diaAnterior").setAttribute(
      "aria-label",
      dia ? "Dia anterior" : "Semana anterior",
    );
    $("proximoDia").setAttribute(
      "aria-label",
      dia ? "Próximo dia" : "Próxima semana",
    );
    $("rotuloTotal").textContent = dia
      ? "Pacientes no dia"
      : "Consultas na semana";

    if (dia) {
      $("subtituloData").textContent = fmtLonga(dataSel);
      $("dataCompleta").textContent = fmtBR(dataSel);
      renderAgenda();
      renderCalendario();
      renderLista();
    } else {
      const seg = segundaDaSemana(dataSel);
      const sab = new Date(seg);
      sab.setDate(seg.getDate() + 5);
      $("subtituloData").textContent =
        "Visão semanal · restrição e controle de choques de horário";
      $("dataCompleta").textContent = rotuloSemana(seg, sab);
      renderSemana(seg);
    }
  }

  function selecionarData(iso) {
    dataSel = iso;
    const d = dataObj(iso);
    mes = { ano: d.getFullYear(), mes: d.getMonth() };
    renderTudo();
  }

  function moverPeriodo(direcao) {
    const d = dataObj(dataSel);
    d.setDate(d.getDate() + direcao * (visao === "dia" ? 1 : 7));
    selecionarData(toIso(d));
  }

  // ===== PRONTUÁRIO =====
  function abrirProntuario(nome) {
    pacienteAberto = nome;
    const hist = consultas.filter((c) => c.nome === nome).sort(porHorario);
    const ultima = [...hist].reverse().find((c) => c.data < HOJE);
    const proxima = hist.find((c) => c.data >= HOJE);

    $("prontNome").textContent = nome;
    $("prontIni").textContent = iniciais(nome);
    $("prontResumo").innerHTML = `
            <div><span>Consultas registradas</span><b>${hist.length}</b></div>
            <div><span>Última consulta</span><b>${ultima ? fmtBR(ultima.data) : "—"}</b></div>
            <div><span>Próxima consulta</span><b>${proxima ? fmtBR(proxima.data) + " · " + proxima.hora : "—"}</b></div>`;
    $("prontHistorico").innerHTML = [...hist]
      .reverse()
      .map((c) => {
        const passada = c.data < HOJE;
        return `<div class="hist-item">
                <div><strong>${fmtBR(c.data)} · ${c.hora}</strong><span class="sub" style="display:block">${esc(c.procedimento)} · ${esc(c.dentista)}</span></div>
                <span class="badge ${!passada && c.status === "Pendente" ? "p" : ""}">${passada ? "Realizada" : c.status}</span>
            </div>`;
      })
      .join("");
    $("prontNotas").value = lerNotas(nome);
    $("prontAviso").textContent = "";
    $("modalProntuario").classList.add("ativo");
  }

  function fecharTudo() {
    $("modal").classList.remove("ativo");
    $("modalProntuario").classList.remove("ativo");
  }

  // ===== EVENTOS =====
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".prontuario[data-nome]");
    if (btn) {
      abrirProntuario(btn.dataset.nome);
      return;
    }
    const ev = e.target.closest(".ev[data-nome]");
    if (ev) {
      abrirProntuario(ev.dataset.nome);
      return;
    }
    const cab = e.target.closest(".week h3 button[data-d]");
    if (cab) {
      visao = "dia"; // clicar no dia abre a agenda diária
      selecionarData(cab.dataset.d);
      return;
    }
    const item = e.target.closest(".paciente-mini > div[data-d]");
    if (item) selecionarData(item.dataset.d);
  });
  $("cal").addEventListener("click", (e) => {
    const dia = e.target.closest(".dia");
    if (dia) selecionarData(dia.dataset.d);
  });
  $("mesAnterior").addEventListener("click", () => {
    mes =
      mes.mes === 0
        ? { ano: mes.ano - 1, mes: 11 }
        : { ano: mes.ano, mes: mes.mes - 1 };
    renderCalendario();
  });
  $("mesProximo").addEventListener("click", () => {
    mes =
      mes.mes === 11
        ? { ano: mes.ano + 1, mes: 0 }
        : { ano: mes.ano, mes: mes.mes + 1 };
    renderCalendario();
  });
  $("diaAnterior").addEventListener("click", () => moverPeriodo(-1));
  $("proximoDia").addEventListener("click", () => moverPeriodo(1));
  $("verDia").addEventListener("click", () => {
    visao = "dia";
    renderTudo();
  });
  $("verSemana").addEventListener("click", () => {
    visao = "semana";
    renderTudo();
  });
  $("buscaPaciente").addEventListener("input", renderLista);
  $("dentista").addEventListener("change", (e) => {
    dentista = e.target.value;
    renderTudo();
  });

  $("salvarNotas").addEventListener("click", () => {
    gravarNotas(pacienteAberto, $("prontNotas").value);
    $("prontAviso").textContent = "Anotações salvas.";
  });
  ["fecharProntuario", "fecharProntuario2"].forEach((id) =>
    $(id).addEventListener("click", fecharTudo),
  );
  $("fecharModal").addEventListener("click", fecharTudo);
  [$("modal"), $("modalProntuario")].forEach((el) =>
    el.addEventListener("click", (e) => {
      if (e.target === el) fecharTudo();
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharTudo();
    // consultas da semana são "botões" focáveis: Enter/Espaço abrem o prontuário
    if (e.key === "Enter" || e.key === " ") {
      const ev = e.target.closest && e.target.closest(".ev[data-nome]");
      if (ev) {
        e.preventDefault();
        abrirProntuario(ev.dataset.nome);
      }
    }
  });

  // ===== NOVA CONSULTA =====
  $("abrirModal").addEventListener("click", () => {
    const d = todos() ? DENTISTAS[0] : dentista;
    $("formAgendamento").reset();
    $("data").value = dataSel;
    $("dentistaForm").value = d;
    $("sala").value = SALA_PADRAO[d];
    $("duracao").value = "60";
    atualizarValidacao();
    $("modal").classList.add("ativo");
    $("nome").focus();
  });

  ["nome", "data", "hora", "duracao", "sala"].forEach((id) => {
    $(id).addEventListener("input", atualizarValidacao);
    $(id).addEventListener("change", atualizarValidacao);
  });
  $("dentistaForm").addEventListener("change", () => {
    $("sala").value = SALA_PADRAO[$("dentistaForm").value] || SALAS[0];
    atualizarValidacao();
  });
  // botões de sugestão dentro do aviso ("Usar este horário" / "Trocar para Sala 02")
  $("alertaAgenda").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-acao]");
    if (!b) return;
    if (b.dataset.acao === "sala") $("sala").value = b.dataset.valor;
    if (b.dataset.acao === "horario") {
      $("data").value = b.dataset.data;
      $("hora").value = b.dataset.hora;
    }
    atualizarValidacao();
  });

  $("formAgendamento").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = lerForm();
    if (!v.nome) {
      $("nome").focus();
      return;
    }
    if (atualizarValidacao().length) return; // não salva com choque
    consultas.push({
      id: proximoId++,
      data: v.data,
      hora: v.hora,
      fim: aHora(aMin(v.hora) + v.duracao),
      nome: v.nome,
      procedimento: $("procedimento").value.trim(),
      status: $("status").value,
      dentista: v.dentista,
      sala: v.sala,
    });
    $("formAgendamento").reset();
    fecharTudo();
    if (!todos() && dentista !== v.dentista) {
      // mostra a consulta nova mesmo que seja de outro dentista
      dentista = v.dentista;
      $("dentista").value = v.dentista;
    }
    popularNomes();
    selecionarData(v.data);
    aviso(`Consulta agendada para ${fmtBR(v.data)} às ${v.hora}.`);
  });

  // ===== INÍCIO =====
  if (location.hash === "#semana") visao = "semana"; // agenda.html#semana abre direto na semana
  popularNomes();
  renderTudo();
});
