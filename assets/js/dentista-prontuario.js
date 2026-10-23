const m = shell("dentista-pacientes.html");
      const id = new URLSearchParams(location.search).get("id");
      const p = pac(id);
      if (!p) {
        m.innerHTML =
          '<div class="vazio">Paciente não encontrado. <a href="dentista-pacientes.html">Buscar paciente</a></div>';
      } else {
        const idade = Math.floor((Date.now() - new Date(p.nasc)) / 31557600000);
        m.innerHTML = `<div class="topo"><div><h1>${esc(p.nome)}</h1><p>${idade} anos · CPF ${p.cpf} · WhatsApp ${p.whats}</p></div><a class="btn sec" href="dentista-agenda.html">‹ Voltar à agenda</a></div>
${p.inad ? '<div class="tarja">' + icon("alerta") + "Inadimplente há " + p.inad + " dias – avisar a recepção.</div>" : ""}
<div id="alertas"></div>
<div class="grid2" style="align-items:start">
<form class="card form" id="f" novalidate><h2>Anamnese e alertas clínicos</h2>
<label>Queixa principal *<textarea id="queixa">${esc(p.queixa)}</textarea></label><span class="erro" id="e1">Informe a queixa principal.</span>
<label>Histórico médico *<textarea id="hist">${esc(p.hist)}</textarea></label><span class="erro" id="e2">Informe o histórico médico.</span>
<div class="grid2"><label>Medicamentos em uso<input id="med" value="${esc(p.med)}"></label><label>Cirurgias anteriores<input id="cir" value="${esc(p.cir)}"></label></div>
<label>Alergias<input id="alerg" value="${esc(p.alerg)}" placeholder="Ex.: penicilina, látex"></label>
<label class="check"><input type="checkbox" id="hiper" ${p.hiper ? "checked" : ""}> Hipertensão</label>
<label>Condições especiais<input id="cond" value="${esc(p.cond)}" placeholder="Ex.: gestante, diabetes"></label>
<label>Preferências<input id="pref" value="${esc(p.pref)}" placeholder="Ex.: prefere manhã"></label>
<label>Anotação desta atualização<textarea id="anot" placeholder="Opcional"></textarea></label>
<button class="btn" type="submit">Salvar prontuário</button></form>
<div style="display:grid;gap:16px"><section class="card"><h2>Dados cadastrais</h2><div class="dados">
<div><b>Atendimento</b>${p.tipo}</div>${p.conv ? "<div><b>Convênio</b>" + esc(p.conv) + "</div><div><b>Carteirinha</b>" + p.cart + "</div><div><b>Validade</b>" + fmtData(p.val) + (p.val < hoje() ? ' <span class="chip">Vencida</span>' : "") + "</div>" : ""}
<div><b>Nascimento</b>${fmtData(p.nasc)}</div><div><b>Recados</b>${esc(p.obs) || "—"}</div></div></section>
<section class="card"><h2>Histórico de alterações</h2><ul class="hlist" id="hl"></ul></section></div></div>`;
        const HK = "sp_ph_" + id;
        function alertas() {
          const a = alertasDe(pac(id));
          document.getElementById("alertas").innerHTML = a.length
            ? '<div class="alertas" role="alert"><h2>' +
              icon("alerta") +
              'Atenção antes de iniciar o procedimento</h2><div class="barra">' +
              a
                .map(
                  (x) =>
                    '<span class="chip' +
                    (x[1] ? " at" : "") +
                    '">' +
                    esc(x[0]) +
                    "</span>",
                )
                .join("") +
              "</div></div>"
            : '<div class="alertas ok"><h2>Nenhum alerta clínico ativo</h2></div>';
        }
        function histo() {
          const h = ld(HK, []).slice().reverse();
          document.getElementById("hl").innerHTML = h.length
            ? h
                .map(
                  (x) =>
                    "<li>" +
                    esc(x.t) +
                    "<small>" +
                    x.q +
                    " · " +
                    esc(x.u) +
                    "</small></li>",
                )
                .join("")
            : "<li>Nenhuma alteração registrada.</li>";
        }
        alertas();
        histo();
        document.getElementById("f").onsubmit = (e) => {
          e.preventDefault();
          const v = (i) => document.getElementById(i).value.trim();
          const ok1 = !!v("queixa"),
            ok2 = !!v("hist");
          document.getElementById("e1").style.display = ok1 ? "none" : "block";
          document.getElementById("e2").style.display = ok2 ? "none" : "block";
          document.getElementById("queixa").classList.toggle("invalido", !ok1);
          document.getElementById("hist").classList.toggle("invalido", !ok2);
          if (!ok1 || !ok2) return;
          if (!confirm("Confirmar as alterações no prontuário?")) return;
          const novo = {
            queixa: v("queixa"),
            hist: v("hist"),
            med: v("med"),
            cir: v("cir"),
            alerg: v("alerg"),
            hiper: document.getElementById("hiper").checked,
            cond: v("cond"),
            pref: v("pref"),
          };
          sv("sp_pront_" + id, novo);
          const h = ld(HK, []);
          h.push({
            t: v("anot") || "Prontuário atualizado.",
            q: agora(),
            u: DENTISTA,
          });
          sv(HK, h);
          document.getElementById("anot").value = "";
          alertas();
          histo();
          toast("Prontuário atualizado");
        };
      }
