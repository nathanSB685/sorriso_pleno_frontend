// Tela de login (protótipo): qualquer usuário e senha entram
let perfil = "recepcao";
document.querySelectorAll(".perfis button").forEach((b) => {
  b.onclick = () => {
    perfil = b.dataset.p;
    document.querySelectorAll(".perfis button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  };
});
document.getElementById("f").onsubmit = (e) => {
  e.preventDefault();
  const u = document.getElementById("u").value.trim();
  const s = document.getElementById("s").value;
  if (!u || !s) {
    document.getElementById("e").style.display = "block";
    return;
  }
  sv("sp_user", { perfil, nome: perfil === "dentista" ? DENTISTA : u });
  location.href = perfil === "dentista" ? "dentista-agenda.html" : "agenda.html";
};
