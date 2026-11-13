// Prontuário (dentista): dados do paciente, anamnese, alertas clínicos e histórico, tudo pela API.
// Usa shell(), icon(), esc(), toast() e fmtData() do common.js e api.get/put do api.js.
const m = shell("dentista-pacientes.html");
if (m) iniciar(m);

async function iniciar(m) {
  const id = new URLSearchParams(location.search).get("id");
  const vazio = (msg) => {
    m.innerHTML = `<div class="vazio">${esc(msg)} <a href="dentista-pacientes.html">Buscar paciente</a></div>`;
  };
  if (!id) return vazio("Nenhum paciente selecionado.");

  m.innerHTML = `<div class="vazio">Carregando…</div>`;
  let p, dados;
  try {
    [p, dados] = await Promise.all([api.get(`/pacientes/${id}`), api.get(`/pacientes/${id}/anamnese`)]);
  } catch (e) {
    return vazio(e.status === 404 ? "Paciente não encontrado." : (e.detalhe ?? e.message));
  }

  const a = dados.anamnese ?? {};
  const idade = Math.floor((Date.now() - new Date(p.data_nascimento)) / 31557600000);
  const quando = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const val = (v) => esc(v ?? "");

  m.innerHTML = `<div class="topo"><div><h1>${esc(p.nome)}</h1><p>${idade} anos · CPF ${esc(p.cpf_mascarado)} · WhatsApp ${esc(p.whatsapp || "—")}</p></div><a class="btn sec" href="dentista-agenda.html">‹ Voltar à agenda</a></div>
${p.inadimplente ? `<div class="tarja">${icon("alerta")}Inadimplente há ${p.dias_pendencia} dias – avisar a recepção.</div>` : ""}
<div id="alertas"></div>
<div class="grid2" style="align-items:start">
<form class="card form" id="f" novalidate><h2>Anamnese e alertas clínicos</h2>
${dados.preenchida ? "" : '<p class="sub">Anamnese ainda não registrada para este paciente.</p>'}
<label>Queixa principal *<textarea id="queixa">${val(a.queixa_principal)}</textarea></label><span class="erro" id="e1">Informe a queixa principal.</span>
<label>Histórico médico *<textarea id="hist">${val(a.historico_medico)}</textarea></label><span class="erro" id="e2">Informe o histórico médico.</span>
<div class="grid2"><label>Medicamentos em uso<input id="med" value="${val(a.medicamentos)}"></label><label>Cirurgias anteriores<input id="cir" value="${val(a.cirurgias)}"></label></div>
<label>Alergias<input id="alerg" value="${val(a.alergias)}" placeholder="Ex.: penicilina, látex"></label>
<label class="check"><input type="checkbox" id="hiper" ${a.hipertensao ? "checked" : ""}> Hipertensão</label>
<label>Condições especiais<input id="cond" value="${val(a.condicoes_especiais)}" placeholder="Ex.: gestante, diabetes"></label>
<label>Preferências<input id="pref" value="${val(a.preferencias)}" placeholder="Ex.: prefere manhã"></label>
<label>Anotação desta atualização<textarea id="anot" placeholder="Opcional"></textarea></label>
<span class="erro" id="eApi" role="alert"></span>
<button class="btn" type="submit">Salvar prontuário</button></form>
<div style="display:grid;gap:16px"><section class="card"><h2>Dados cadastrais</h2><div class="dados">
<div><b>Atendimento</b>${esc(p.tipo_atendimento)}</div>${
    p.tipo_atendimento === "Convênio"
      ? `<div><b>Convênio</b>${esc(p.convenio_nome)}</div><div><b>Carteirinha</b>${esc(p.convenio_carteirinha)}</div><div><b>Validade</b>${fmtData(p.convenio_validade)}${p.convenio_vencido ? ' <span class="chip">Vencida</span>' : ""}</div>`
      : ""
  }
<div><b>Nascimento</b>${fmtData(p.data_nascimento)}</div><div><b>Recados</b>${esc(p.observacoes) || "—"}</div></div></section>
<section class="card"><h2>Histórico de alterações</h2><ul class="hlist" id="hl"></ul></section></div></div>`;

  const $ = (i) => document.getElementById(i);

  function alertas() {
    $("alertas").innerHTML = dados.alertas.length
      ? '<div class="alertas" role="alert"><h2>' + icon("alerta") + 'Atenção antes de iniciar o procedimento</h2><div class="barra">' +
        dados.alertas.map((x) => `<span class="chip${x.nivel === "atencao" ? " at" : ""}">${esc(x.texto)}</span>`).join("") +
        "</div></div>"
      : '<div class="alertas ok"><h2>Nenhum alerta clínico ativo</h2></div>';
  }
  function histo() {
    $("hl").innerHTML = dados.historico.length
      ? dados.historico.map((h) => `<li>${esc(h.anotacao)}<small>${quando(h.criado_em)} · ${esc(h.usuario_nome ?? "—")}</small></li>`).join("")
      : "<li>Nenhuma alteração registrada.</li>";
  }
  alertas();
  histo();

  $("f").onsubmit = async (e) => {
    e.preventDefault();
    const v = (i) => $(i).value.trim();
    const ok1 = !!v("queixa"), ok2 = !!v("hist");
    $("e1").style.display = ok1 ? "none" : "block";
    $("e2").style.display = ok2 ? "none" : "block";
    $("queixa").classList.toggle("invalido", !ok1);
    $("hist").classList.toggle("invalido", !ok2);
    if (!ok1 || !ok2) return;
    if (!confirm("Confirmar as alterações no prontuário?")) return;
    const botao = $("f").querySelector("button[type=submit]");
    botao.disabled = true;
    $("eApi").style.display = "none";
    try {
      dados = await api.put(`/pacientes/${id}/anamnese`, {
        queixa_principal: v("queixa"), historico_medico: v("hist"), medicamentos: v("med"), cirurgias: v("cir"),
        alergias: v("alerg"), hipertensao: $("hiper").checked, condicoes_especiais: v("cond"), preferencias: v("pref"),
        anotacao: v("anot"),
      });
      $("anot").value = "";
      alertas();
      histo();
      toast("Prontuário atualizado");
    } catch (err) {
      $("eApi").textContent = err.detalhe ?? err.message;
      $("eApi").style.display = "block";
    } finally {
      botao.disabled = false;
    }
  };
}
