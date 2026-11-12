/* Cliente da API do Sorriso Pleno – use api.get/post/put/patch em todas as telas */
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3333/api/v1"
  : "https://sorriso-pleno-api.onrender.com/api/v1";

class ApiError extends Error {
  constructor(status, mensagem, campos = []) {
    super(mensagem);
    this.status = status;
    this.campos = campos; // [{ campo, mensagem }] quando a validação falha (400)
  }
  // Texto pronto para mostrar na tela
  get detalhe() {
    return this.campos.length
      ? this.campos.map((c) => c.mensagem).join(" · ")
      : this.message;
  }
}

async function api(caminho, { metodo = "GET", corpo, params } = {}) {
  const url = new URL(API_URL + caminho);
  for (const [k, v] of Object.entries(params ?? {}))
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  const token = localStorage.getItem("sp_token");
  let resp;
  try {
    resp = await fetch(url, {
      method: metodo,
      headers: {
        ...(corpo ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Verifique a internet e tente de novo.",
    );
  }
  const dados = await resp.json().catch(() => null);
  if (resp.status === 401 && token) {
    // sessão expirada: volta para o login
    localStorage.removeItem("sp_token");
    localStorage.removeItem("sp_user");
    location.href = "index.html";
  }
  if (!resp.ok)
    throw new ApiError(
      resp.status,
      dados?.erro ?? "Erro inesperado",
      dados?.campos ?? [],
    );
  return dados;
}
api.get = (caminho, params) => api(caminho, { params });
api.post = (caminho, corpo) => api(caminho, { metodo: "POST", corpo });
api.put = (caminho, corpo) => api(caminho, { metodo: "PUT", corpo });
api.patch = (caminho, corpo) => api(caminho, { metodo: "PATCH", corpo });
