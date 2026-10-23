const m = shell("dentista-pacientes.html");
      m.innerHTML = `<div class="topo"><div><h1>Pacientes</h1><p>Busque por nome ou CPF para abrir o prontuário.</p></div></div>
<div class="card" style="margin-bottom:16px"><label>Nome ou CPF<input id="q" type="search" placeholder="Ex.: Mariana ou 123.456.789-09" autofocus></label></div>
<div id="res"></div>`;
      const num = (s) => s.replace(/\D/g, "");
      function busca() {
        const q = document.getElementById("q").value.trim().toLowerCase(),
          n = num(q);
        const r = PACIENTES.map((p) => pac(p.id)).filter(
          (p) =>
            !q ||
            p.nome.toLowerCase().includes(q) ||
            (n && num(p.cpf).includes(n)),
        );
        document.getElementById("res").innerHTML = r.length
          ? `<table><thead><tr><th>Paciente</th><th>CPF</th><th>Atendimento</th><th>Alertas</th><th></th></tr></thead><tbody>${r.map((p) => `<tr><td><b>${esc(p.nome)}</b></td><td>${p.cpf}</td><td>${p.tipo}${p.conv ? " – " + esc(p.conv) : ""}</td><td>${alertasDe(p).length ? '<span class="chip">' + icon("alerta") + alertasDe(p).length + "</span>" : "—"}</td><td><a href="dentista-prontuario.html?id=${p.id}">Abrir prontuário</a></td></tr>`).join("")}</tbody></table>`
          : '<div class="vazio">Nenhum paciente encontrado.</div>';
      }
      document.getElementById("q").oninput = busca;
      busca();
