const m = shell("dentista-agenda.html");
      m.innerHTML = `<div class="topo"><div><h1>Minha agenda</h1><p id="sub"></p></div>
<div class="barra"><button class="btn sec peq" id="ant" aria-label="Dia anterior">‹</button><input type="date" id="dia" aria-label="Dia"><button class="btn sec peq" id="prox" aria-label="Próximo dia">›</button><button class="btn sec peq" id="hj">Hoje</button></div></div>
<div class="lista" id="lista"></div>`;
      const FLUXO = {
        Agendada: [["Confirmada", "Confirmar"]],
        Confirmada: [["Em Atendimento", "Iniciar atendimento"]],
        "Em Atendimento": [["Concluída", "Concluir"]],
        Concluída: [],
        "Falta Injustificada": [],
      };
      const key = (s) =>
        ({
          "Em Atendimento": "Atendimento",
          "Falta Injustificada": "Falta",
          Concluída: "Concluida",
        })[s] || s;
      const dia = document.getElementById("dia");
      dia.value = hoje();
      const estados = () => ld("sp_status", {});
      const hist = () => ld("sp_hist", []);
      const fim = (ini, d) => {
        const t = +ini.slice(0, 2) * 60 + +ini.slice(3) + d;
        return (
          String(Math.floor(t / 60)).padStart(2, "0") +
          ":" +
          String(t % 60).padStart(2, "0")
        );
      };
      function mudar(id, de, para) {
        const e = estados();
        e[id] = para;
        sv("sp_status", e);
        const h = hist();
        h.push({ id, de, para, q: agora(), u: DENTISTA });
        sv("sp_hist", h);
        toast("Status atualizado para " + para);
        desenha();
      }
      function desenha() {
        const d = dia.value,
          off = Math.round(
            (new Date(d + "T12:00:00") - new Date(hoje() + "T12:00:00")) /
              864e5,
          );
        const lista = CONSULTAS.filter((c) => c.dia === off).sort((a, b) =>
          a.ini.localeCompare(b.ini),
        );
        document.getElementById("sub").textContent =
          fmtData(d) +
          " · " +
          lista.length +
          " consulta" +
          (lista.length == 1 ? "" : "s") +
          " · " +
          DENTISTA;
        const L = document.getElementById("lista");
        if (!lista.length) {
          L.innerHTML =
            '<div class="vazio">Nenhuma consulta agendada para este dia.</div>';
          return;
        }
        L.innerHTML = lista
          .map((c) => {
            const p = pac(c.pac),
              st = estados()[c.id] || c.status,
              k = key(st),
              du = DUR[c.proc],
              al = alertasDe(p),
              h = hist().filter((x) => x.id == c.id);
            const bt =
              (FLUXO[st] || [])
                .map(
                  (f) =>
                    `<button class="btn peq" data-id="${c.id}" data-de="${st}" data-para="${f[0]}">${f[1]}</button>`,
                )
                .join("") +
              (st == "Agendada" || st == "Confirmada"
                ? `<button class="btn perigo peq" data-id="${c.id}" data-de="${st}" data-para="Falta Injustificada">Registrar falta</button>`
                : "");
            return `<article class="cons ${k}"><div class="hora">${c.ini}<small>até ${fim(c.ini, du)}</small></div>
  <div><div class="pac"><a href="dentista-prontuario.html?id=${p.id}">${esc(p.nome)}</a> <span class="st ${k}">${st}</span></div>
  <div class="meta"><span>${icon("proc")}${c.proc}</span><span>${icon("clock")}${du} min</span><span>${icon("sala")}${c.sala}</span></div>
  <div class="meta">${p.inad ? '<span class="chip">' + icon("alerta") + "Inadimplente</span>" : ""}${al.map((a) => '<span class="chip' + (a[1] ? " at" : "") + '">' + icon("alerta") + esc(a[0]) + "</span>").join("")}</div></div>
  <div class="acoes">${bt}<a class="btn sec peq" href="dentista-prontuario.html?id=${p.id}">${icon("ficha")}Prontuário</a><button class="btn sec peq" data-h="${c.id}">Histórico (${h.length})</button></div>
  <div class="hist" id="h${c.id}">${h.length ? h.map((x) => x.q + " · " + esc(x.u) + ": " + x.de + " → " + x.para).join("<br>") : "Sem alterações de status registradas."}</div></article>`;
          })
          .join("");
        L.querySelectorAll("[data-para]").forEach(
          (b) =>
            (b.onclick = () =>
              mudar(b.dataset.id, b.dataset.de, b.dataset.para)),
        );
        L.querySelectorAll("[data-h]").forEach(
          (b) =>
            (b.onclick = () =>
              document
                .getElementById("h" + b.dataset.h)
                .classList.toggle("aberto")),
        );
      }
      dia.onchange = desenha;
      document.getElementById("ant").onclick = () => {
        dia.value = addDias(dia.value, -1);
        desenha();
      };
      document.getElementById("prox").onclick = () => {
        dia.value = addDias(dia.value, 1);
        desenha();
      };
      document.getElementById("hj").onclick = () => {
        dia.value = hoje();
        desenha();
      };
      desenha();
