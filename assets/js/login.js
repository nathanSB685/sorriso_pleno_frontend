// Login: autentica na API; o perfil (recepção ou dentista) vem da conta, não de uma escolha na tela
const form = document.getElementById("f");
const erro = document.getElementById("e");
const botao = form.querySelector("button[type=submit]");

form.onsubmit = async (ev) => {
  ev.preventDefault();
  const email = document.getElementById("u").value.trim();
  const senha = document.getElementById("s").value;
  erro.style.color = "";
  if (!email || !senha) {
    erro.textContent = "Informe e-mail e senha para entrar.";
    erro.style.display = "block";
    return;
  }
  localStorage.removeItem("sp_token");
  botao.disabled = true;
  botao.textContent = "Entrando...";
  erro.style.display = "none";
  // o servidor gratuito dorme quando ocioso: avisa se a primeira resposta demorar
  const aviso = setTimeout(() => {
    erro.textContent =
      "Conectando ao servidor… a primeira entrada do dia pode levar até 1 minuto.";
    erro.style.color = "var(--txt)";
    erro.style.display = "block";
  }, 4000);
  try {
    const { token, usuario } = await api.post("/auth/login", { email, senha });
    localStorage.setItem("sp_token", token);
    sv("sp_user", {
      perfil: usuario.perfil === "admin" ? "recepcao" : usuario.perfil, // admin usa as telas da recepção
      papel: usuario.perfil,
      nome: usuario.nome,
      dentista_id: usuario.dentista_id,
    });
    location.href =
      usuario.perfil === "dentista" ? "dentista-agenda.html" : "agenda.html";
  } catch (e) {
    erro.textContent = e.detalhe;
    erro.style.color = "";
    erro.style.display = "block";
  } finally {
    clearTimeout(aviso);
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
};

