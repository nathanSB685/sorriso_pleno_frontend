/* Sorriso Pleno – JS compartilhado por todas as telas (ícones, dados de exemplo, utilitários, sessão e menu) */
const P = {
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  dentist:
    '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6"/><path d="m16 19 2 2 4-4"/>',
  wallet:
    '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  agenda:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pacientes:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  sair: '<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>',
  sala: '<path d="M4 21V4h12v17M16 9h4v12M2 21h20"/>',
  proc: '<path d="M14 6l4 4M3 21l4-1 12-12-3-3L4 17z"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  ficha: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>',
};
const svg = (n) => `<svg class="ic" viewBox="0 0 24 24">${P[n] || ""}</svg>`;
const icon = svg;

const PACIENTES = [
  {
    id: 1,
    nome: "Mariana Costa",
    cpf: "123.456.789-09",
    nasc: "1988-04-12",
    whats: "(11) 98888-1111",
    tipo: "Particular",
    obs: "Prefere contato à tarde.",
    inad: 0,
    alerg: "Penicilina",
    hiper: true,
    cond: "",
    pref: "Atendimento sem pressa, ansiedade leve.",
    queixa: "Dor no dente 26 ao mastigar.",
    hist: "Hipertensão controlada.",
    med: "Losartana 50 mg",
    cir: "Nenhuma",
    anot: "",
  },
  {
    id: 2,
    nome: "João Pereira",
    cpf: "987.654.321-00",
    nasc: "1975-11-02",
    whats: "(11) 97777-2222",
    tipo: "Convênio",
    conv: "OdontoMais",
    cart: "0456 7788 1200",
    val: "2027-03-31",
    obs: "",
    inad: 0,
    alerg: "",
    hiper: false,
    cond: "",
    pref: "",
    queixa: "Limpeza semestral.",
    hist: "Sem alterações.",
    med: "",
    cir: "",
    anot: "",
  },
  {
    id: 3,
    nome: "Beatriz Almeida",
    cpf: "456.789.123-55",
    nasc: "1994-07-23",
    whats: "(11) 96666-3333",
    tipo: "Particular",
    obs: "Deixar recado no WhatsApp.",
    inad: 45,
    alerg: "Látex",
    hiper: false,
    cond: "Gestante (2º trimestre)",
    pref: "Prefere horários pela manhã.",
    queixa: "Sensibilidade ao frio.",
    hist: "Gestação sem intercorrências.",
    med: "Ácido fólico",
    cir: "",
    anot: "",
  },
  {
    id: 4,
    nome: "Carlos Eduardo Lima",
    cpf: "321.654.987-11",
    nasc: "1969-01-30",
    whats: "(11) 95555-4444",
    tipo: "Convênio",
    conv: "Saúde Sorriso",
    cart: "7788 3300 9911",
    val: "2026-08-31",
    obs: "",
    inad: 0,
    alerg: "",
    hiper: true,
    cond: "Diabetes tipo 2",
    pref: "",
    queixa: "Canal no dente 36.",
    hist: "Diabetes e hipertensão.",
    med: "Metformina, Enalapril",
    cir: "Ponte de safena (2018)",
    anot: "",
  },
  {
    id: 5,
    nome: "Fernanda Rocha",
    cpf: "741.852.963-22",
    nasc: "2001-09-15",
    whats: "(11) 94444-5555",
    tipo: "Particular",
    obs: "",
    inad: 0,
    alerg: "",
    hiper: false,
    cond: "",
    pref: "",
    queixa: "Avaliação ortodôntica.",
    hist: "Sem alterações.",
    med: "",
    cir: "",
    anot: "",
  },
];
const DENTISTA = "Dra. Renata Santos";
const DUR = {
  Limpeza: 30,
  Restauração: 90,
  Canal: 90,
  Avaliação: 30,
  Extração: 60,
};
const CONSULTAS = [
  {
    id: 1,
    pac: 1,
    dia: 0,
    ini: "08:00",
    proc: "Restauração",
    sala: "Sala 01",
    status: "Concluída",
  },
  {
    id: 2,
    pac: 2,
    dia: 0,
    ini: "09:30",
    proc: "Limpeza",
    sala: "Sala 01",
    status: "Em Atendimento",
  },
  {
    id: 3,
    pac: 3,
    dia: 0,
    ini: "10:00",
    proc: "Avaliação",
    sala: "Sala 02",
    status: "Confirmada",
  },
  {
    id: 4,
    pac: 4,
    dia: 0,
    ini: "14:00",
    proc: "Canal",
    sala: "Sala 01",
    status: "Agendada",
  },
  {
    id: 5,
    pac: 5,
    dia: 0,
    ini: "16:00",
    proc: "Avaliação",
    sala: "Sala 02",
    status: "Agendada",
  },
  {
    id: 6,
    pac: 1,
    dia: 1,
    ini: "09:00",
    proc: "Limpeza",
    sala: "Sala 01",
    status: "Confirmada",
  },
  {
    id: 7,
    pac: 4,
    dia: 1,
    ini: "10:30",
    proc: "Extração",
    sala: "Sala 02",
    status: "Agendada",
  },
];

const ld = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || d;
  } catch (e) {
    return d;
  }
};
const sv = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const pac = (id) => {
  const p = PACIENTES.find((x) => x.id == id);
  return p && Object.assign({}, p, ld("sp_pront_" + id, {}));
};
const hoje = () => new Date().toISOString().slice(0, 10);
const addDias = (d, n) => {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};
const fmtData = (d) => d.split("-").reverse().join("/");
const agora = () =>
  new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
const toast = (m) => {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = m;
  t.style.display = "block";
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.display = "none"), 2600);
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const PERFIS = { recepcao: "Recepção", dentista: "Dentista" };
const MENUS = {
  recepcao: [
    ["agenda.html", "calendar", "Agenda"],
    ["dentistas.html", "dentist", "Dentistas"],
    ["financeiro.html", "wallet", "Financeiro"],
    ["whatsapp.html", "chat", "WhatsApp"],
  ],
  dentista: [
    ["dentista-agenda.html", "calendar", "Minha agenda"],
    ["dentista-pacientes.html", "users", "Pacientes"],
  ],
};
function sessao() {
  return ld("sp_user", null);
}
function sair() {
  localStorage.removeItem("sp_user");
}
function guard(perfil) {
  const s = sessao();
  if (!s || s.perfil !== perfil) {
    location.href = "index.html";
    return null;
  }
  return s;
}
function menuHTML(s, ativo) {
  const L = MENUS[s.perfil];
  return `<a href="${L[0][0]}" class="logo-img" aria-label="Sorriso Pleno"><img src="assets/image/logo_sorriso_pleno.png" alt="Sorriso Pleno"></a>
<nav class="nav" aria-label="Principal">${L.map((l) => `<a href="${l[0]}" class="${l[0] === ativo || l[0] === ativo + ".html" ? "on" : ""}">${svg(l[1])} ${l[2]}</a>`).join("")}</nav>
<div class="quem"><b>${esc(s.nome)}</b>${PERFIS[s.perfil]}<br><a href="index.html" onclick="sair()">${svg("sair")} Sair</a></div>`;
}
// Telas do dentista: monta menu + área principal dentro de #app
function shell(ativo) {
  const s = guard("dentista");
  if (!s) return;
  document.getElementById("app").innerHTML =
    `<aside class="side">${menuHTML(s, ativo)}</aside><main class="main" id="main"></main>`;
  return document.getElementById("main");
}
// Telas da recepção: menu em <aside id="menu" data-perfil data-ativo>; ícones via [data-i]
document.addEventListener("DOMContentLoaded", () => {
  const m = document.getElementById("menu");
  if (m) {
    const s = guard(m.dataset.perfil);
    if (s) m.innerHTML = menuHTML(s, m.dataset.ativo);
  }
  document
    .querySelectorAll("[data-i]")
    .forEach((e) => e.insertAdjacentHTML("afterbegin", svg(e.dataset.i)));
});
function alertasDe(p) {
  const a = [];
  if (p.alerg) a.push(["Alergia: " + p.alerg, 0]);
  if (p.hiper) a.push(["Hipertensão", 0]);
  if (p.cond) a.push([p.cond, 0]);
  if (p.pref) a.push(["Preferência: " + p.pref, 1]);
  return a;
}
