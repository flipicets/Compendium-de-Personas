/* Oie prof, aqui é o Fellipe fazendo o comentário...
Então, obviamente a gente não deu conta de fazer TUDO sozinho, algumas coisas mais legais que a gente
queria fazer a gente teve que pesquisar ou até mesmo... glup... usar IA... MAS a gente não pediu pra ela 
gerar o codigo tipo ok faça para mim, foi mais tipo, a gente teve essa ideia pra colocar no nosso projeto
de site, mas não sabemos como fazer, nos de um exemplo, e dai a gente foi adaptando pro nosso site, mas é 
por isso que talvez tenha algumas coisas mais chiques porque, genuinamente, a gente foi descobrindo...
Tive que aprender dicionário também KKKKKKKKK mas na verdade é bem mais fácil do que parece
É isso obrigado profe!!
*/
const API_URL = "https://raw.githubusercontent.com/luyluish/persona-compendium/main/docs/compendium.tsv";
const API_RESERVA = "data/personas.json";
const DESCRICOES_PT = "data/descricoes-pt.json";
const POST_URL = "https://jsonplaceholder.typicode.com/posts";
const CEP_URL = "https://viacep.com.br/ws/";
const CHAVE_FAVORITOS = "compendium:favoritos";
const CHAVE_MODO_ESCURO = "compendium:modoEscuro";
const CHAVE_IDIOMA = "compendium:idioma";
const IMAGENS_LOCAIS = true;
const PASTA_IMAGENS = "img/";
const PROXY_IMAGENS = "https://wsrv.nl/?w=480&we&url=";
const CARTOES_POR_LOTE = 24;
const MAXIMO_STATUS = 80;
const ATRIBUTOS = ["strength", "magic", "endurance", "agility", "luck"];
const NOMES_ATRIBUTOS = {
  level: "Nível",
  strength: "Força",
  magic: "Magia",
  endurance: "Vitalidade",
  agility: "Agilidade",
  luck: "Sorte"
};

const NOMES_ELEMENTOS = {
  Slash: "Corte",
  Strike: "Impacto",
  Pierce: "Perfuração",
  Fire: "Fogo",
  Ice: "Gelo",
  Electric: "Elétrico",
  Wind: "Vento",
  Light: "Luz",
  Dark: "Trevas"
};

const ALGARISMOS = {
  Fool: "0", Magician: "I", Priestess: "II", Empress: "III", Emperor: "IV",
  Hierophant: "V", Lovers: "VI", Chariot: "VII", Justice: "VIII", Hermit: "IX",
  Fortune: "X", Strength: "XI", Hanged: "XII", Death: "XIII", Temperance: "XIV",
  Devil: "XV", Tower: "XVI", Star: "XVII", Moon: "XVIII", Sun: "XIX",
  Judgement: "XX", Aeon: "XX"
};

let listaDePersonas = [];
let favoritos = [];
let fonteDosDados = "api";
let idiomaDasDescricoes = "pt";
let traducaoDisponivel = false;
let traducaoTentada = false;
let personaDoDiaAtual = null;

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) {
    elemento.className = classe;
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}


const normalizarTexto = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const traduzirElemento = (nome) => NOMES_ELEMENTOS[nome] || nome;

const somarStatus = (persona) => ATRIBUTOS.reduce((total, atributo) => total + persona[atributo], 0);

function converterTsv(texto) {
  const linhas = texto.split("\n").map((linha) => linha.replace("\r", "")).filter((linha) => linha.trim() !== "");
  const cabecalho = linhas[0].split("\t");
  return linhas.slice(1).map((linha) => {
    const colunas = linha.split("\t");
    const registro = {};
    cabecalho.forEach((nomeColuna, indice) => {
      registro[nomeColuna] = colunas[indice] || "";
    });
    return normalizarPersona(registro);
  });
}

function separarLista(texto) {
  return texto ? texto.split(",") : [];
}

function normalizarPersona(registro) {
  return {
    id: Number(registro.id),
    name: registro.name,
    arcana: registro.arcana,
    level: Number(registro.level),
    description: registro.description.replace(/''/g, "\""),
    image: registro.image,
    strength: Number(registro.strength),
    magic: Number(registro.magic),
    endurance: Number(registro.endurance),
    agility: Number(registro.agility),
    luck: Number(registro.luck),
    weak: separarLista(registro.weak),
    resists: separarLista(registro.resists),
    reflects: separarLista(registro.reflects),
    absorbs: separarLista(registro.absorbs),
    nullifies: separarLista(registro.nullifies),
    dlc: registro.dlc === "1",
    query: registro.query
  };
}

async function buscarDados(url, formato) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error("Erro HTTP " + resposta.status);
  }
  if (formato === "json") {
    return await resposta.json();
  }
  const texto = await resposta.text();
  return converterTsv(texto);
}

async function traduzirDescricoes(lista) {
  try {
    const resposta = await fetch(DESCRICOES_PT);
    if (!resposta.ok) {
      throw new Error("Erro HTTP " + resposta.status);
    }
    const traducoes = await resposta.json();
    lista.forEach((persona) => {
      persona.descricaoPt = traducoes[persona.id] || "";
    });
    traducaoDisponivel = true;
  } catch (erro) {
    traducaoDisponivel = false;
  }
  traducaoTentada = true;
  const botaoIdioma = document.getElementById("botaoIdioma");
  if (botaoIdioma) {
    atualizarBotaoIdioma(botaoIdioma);
  }
  return lista;
}

function obterDescricao(persona) {
  if (idiomaDasDescricoes === "pt" && persona.descricaoPt) {
    return persona.descricaoPt;
  }
  return persona.description;
}

function atualizarBotaoIdioma(botao) {
  const emPortugues = idiomaDasDescricoes === "pt";
  botao.textContent = "Descrições: " + (emPortugues ? "PT" : "EN");
  botao.setAttribute("aria-pressed", String(emPortugues));
  botao.title = "Alternar entre descrições em português e em inglês";
  // Só avisa depois de tentar carregar a tradução
  if (traducaoTentada && !traducaoDisponivel) {
    botao.title = "A tradução não carregou: confira se data/descricoes-pt.json está no projeto";
    botao.classList.add("sem-traducao");
  }
}

function iniciarIdioma() {
  const botao = document.getElementById("botaoIdioma");
  try {
    idiomaDasDescricoes = localStorage.getItem(CHAVE_IDIOMA) === "en" ? "en" : "pt";
  } catch (erro) {
    idiomaDasDescricoes = "pt";
  }
  atualizarBotaoIdioma(botao);

  botao.addEventListener("click", () => {
    idiomaDasDescricoes = idiomaDasDescricoes === "pt" ? "en" : "pt";
    try {
      localStorage.setItem(CHAVE_IDIOMA, idiomaDasDescricoes);
    } catch (erro) {
      // sem storage, só não salva
    }
    atualizarBotaoIdioma(botao);
    const descricaoDoDia = document.getElementById("descricaoDoDia");
    if (descricaoDoDia && personaDoDiaAtual) {
      descricaoDoDia.textContent = obterDescricao(personaDoDiaAtual);
    }
  });
}

async function carregarPersonas() {
  let lista;
  try {
    fonteDosDados = "api";
    lista = await buscarDados(API_URL, "tsv");
  } catch (erro) {
    fonteDosDados = "reserva";
    lista = await buscarDados(API_RESERVA, "json");
  }
  return await traduzirDescricoes(lista);
}

function lerFavoritos() {
  try {
    const salvo = localStorage.getItem(CHAVE_FAVORITOS);
    return salvo ? JSON.parse(salvo) : [];
  } catch (erro) {
    return [];
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (erro) {

  }
}

function alternarFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos.splice(favoritos.indexOf(id), 1);
  } else {
    favoritos.push(id);
  }
  salvarFavoritos();
}

function atualizarBotaoFavorito(botao, persona) {
  const marcado = favoritos.includes(persona.id);
  botao.classList.toggle("marcado", marcado);
  botao.setAttribute("aria-pressed", String(marcado));
  botao.textContent = marcado ? "★ Favorito" : "☆ Favoritar";
  botao.setAttribute("aria-label", (marcado ? "Desfavoritar " : "Favoritar ") + persona.name);
}

function atualizarBotaoModo(botao) {
  const escuro = document.body.classList.contains("escuro");
  botao.textContent = escuro ? "Velvet Room" : "Dark Hour";
  botao.setAttribute("aria-pressed", String(escuro));
}

function iniciarModoEscuro() {
  const botao = document.getElementById("botaoModo");
  let salvo = "false";
  try {
    salvo = localStorage.getItem(CHAVE_MODO_ESCURO);
  } catch (erro) {
    salvo = "false";
  }
  if (salvo === "true") {
    document.body.classList.add("escuro");
  }
  atualizarBotaoModo(botao);

  botao.addEventListener("click", function () {
    const ligado = document.body.classList.toggle("escuro");
    try {
      localStorage.setItem(CHAVE_MODO_ESCURO, String(ligado));
    } catch (erro) {
      // sem storage, só não salva
    }
    atualizarBotaoModo(botao);
  });
}

function gerarImagemReserva(persona) {
  const algarismo = ALGARISMOS[persona.arcana] || "?";
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>" +
    "<rect width='200' height='200' fill='#0a2a6b'/>" +
    "<polygon points='100,20 180,100 100,180 20,100' fill='none' stroke='#e6c878' stroke-width='3'/>" +
    "<text x='100' y='122' font-size='62' text-anchor='middle' fill='#7fd0ff' font-family='serif'>" + algarismo + "</text></svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function listarFontesDaImagem(persona) {
  const fontes = [];
  if (IMAGENS_LOCAIS) {
    fontes.push(PASTA_IMAGENS + persona.query + ".png");
  }
  fontes.push(PROXY_IMAGENS + encodeURIComponent(persona.image));
  return fontes;
}

function criarImagem(persona) {
  const fontes = listarFontesDaImagem(persona);
  let tentativa = 0;
  const imagem = document.createElement("img");
  imagem.alt = "Arte de " + persona.name + ", Persona do arcano " + persona.arcana;
  imagem.loading = "lazy";
  imagem.referrerPolicy = "no-referrer";
  imagem.src = fontes[tentativa];
  imagem.addEventListener("error", () => {
    tentativa++;
    if (tentativa < fontes.length) {
      imagem.src = fontes[tentativa];
    } else {
      imagem.src = gerarImagemReserva(persona);
    }
  });
  return imagem;
}

function listarElementos(lista) {
  return lista.length > 0 ? lista.map(traduzirElemento).join(", ") : "Nenhuma";
}

function criarCartao(persona, aoFavoritar, aoVerDetalhes) {
  const cartao = criarElemento("article", "cartao");

  const figura = criarElemento("figure", "cartao-figura");
  figura.appendChild(criarImagem(persona));
  figura.appendChild(criarElemento("figcaption", "", ALGARISMOS[persona.arcana] + " · " + persona.arcana));
  cartao.appendChild(figura);

  cartao.appendChild(criarElemento("h3", "cartao-nome", persona.name));

  const dados = criarElemento("ul", "cartao-dados");
  const itens = [
    ["Nível", String(persona.level)],
    ["Fraco contra", listarElementos(persona.weak)],
    ["Status base", String(somarStatus(persona))]
  ];
  itens.forEach(([rotulo, valor]) => {
    const item = criarElemento("li");
    item.appendChild(criarElemento("strong", "", rotulo + ": "));
    item.appendChild(document.createTextNode(valor));
    dados.appendChild(item);
  });
  cartao.appendChild(dados);

  const acoes = criarElemento("div", "cartao-acoes");

  const botaoFavorito = criarElemento("button", "botao botao-favorito");
  botaoFavorito.type = "button";
  atualizarBotaoFavorito(botaoFavorito, persona);
  botaoFavorito.addEventListener("click", () => {
    alternarFavorito(persona.id);
    atualizarBotaoFavorito(botaoFavorito, persona);
    aoFavoritar(persona);
  });

  const botaoDetalhes = criarElemento("button", "botao botao-secundario", "Detalhes");
  botaoDetalhes.type = "button";
  botaoDetalhes.addEventListener("click", () => aoVerDetalhes(persona));

  acoes.appendChild(botaoFavorito);
  acoes.appendChild(botaoDetalhes);
  cartao.appendChild(acoes);
  return cartao;
}

function escolherPersonaDoDia(lista) {
  const hoje = new Date();
  const inicioDoAno = new Date(hoje.getFullYear(), 0, 0);
  const diaDoAno = Math.floor((hoje - inicioDoAno) / 86400000);
  return lista[diaDoAno % lista.length];
}

async function iniciarInicio() {
  const estado = document.getElementById("estadoInicio");
  const cartaoDoDia = document.getElementById("personaDoDia");
  try {
    listaDePersonas = await carregarPersonas();
  } catch (erro) {
    estado.textContent = "Não foi possível carregar o compêndio agora. Tente recarregar a página.";
    estado.classList.add("falha");
    return;
  }

  const persona = escolherPersonaDoDia(listaDePersonas);
  const figura = criarElemento("figure", "cartao-figura");
  figura.appendChild(criarImagem(persona));
  figura.appendChild(criarElemento("figcaption", "", ALGARISMOS[persona.arcana] + " · " + persona.arcana));
  cartaoDoDia.appendChild(figura);
  cartaoDoDia.appendChild(criarElemento("h3", "cartao-nome", persona.name));
  personaDoDiaAtual = persona;
  const descricaoDoDia = criarElemento("p", "", obterDescricao(persona));
  descricaoDoDia.id = "descricaoDoDia";
  cartaoDoDia.appendChild(descricaoDoDia);
  const link = criarElemento("a", "botao", "Ver no compêndio");
  link.href = "explorar.html?arcano=" + encodeURIComponent(persona.arcana);
  cartaoDoDia.appendChild(link);
  cartaoDoDia.hidden = false;
  estado.hidden = true;
  const arcanos = [...new Set(listaDePersonas.map((p) => p.arcana))];
  const nivelMaximo = listaDePersonas.reduce((maior, p) => Math.max(maior, p.level), 0);
  const totalDlc = listaDePersonas.filter((p) => p.dlc).length;
  const valores = document.querySelectorAll("#numeros dd");
  valores[0].textContent = listaDePersonas.length;
  valores[1].textContent = arcanos.length;
  valores[2].textContent = nivelMaximo;
  valores[3].textContent = totalDlc;
  const listaArcanos = document.getElementById("listaArcanos");
  arcanos.forEach((arcano) => {
    const item = criarElemento("li");
    const etiqueta = criarElemento("a", "etiqueta", ALGARISMOS[arcano] + " " + arcano);
    etiqueta.href = "explorar.html?arcano=" + encodeURIComponent(arcano);
    item.appendChild(etiqueta);
    listaArcanos.appendChild(item);
  });
}

let listaFiltrada = [];
let quantidadeVisivel = CARTOES_POR_LOTE;

function filtrarPersonas() {
  const termo = normalizarTexto(document.getElementById("campoBusca").value.trim());
  const arcano = document.getElementById("filtroArcano").value;
  const fraqueza = document.getElementById("filtroFraqueza").value;
  const soFavoritos = document.getElementById("somenteFavoritos").checked;
  const ordem = document.getElementById("ordenacao").value;

  const resultado = listaDePersonas.filter((persona) => {
    const bateNome = normalizarTexto(persona.name).includes(termo);
    const bateArcano = arcano === "" || persona.arcana === arcano;
    const bateFraqueza = fraqueza === "" || persona.weak.includes(fraqueza);
    const bateFavorito = !soFavoritos || favoritos.includes(persona.id);
    return bateNome && bateArcano && bateFraqueza && bateFavorito;
  });

  if (ordem === "nome") {
    resultado.sort((a, b) => a.name.localeCompare(b.name));
  } else if (ordem === "nivel-asc") {
    resultado.sort((a, b) => a.level - b.level);
  } else if (ordem === "nivel-desc") {
    resultado.sort((a, b) => b.level - a.level);
  } else if (ordem === "status-desc") {
    resultado.sort((a, b) => somarStatus(b) - somarStatus(a));
  } else {
    resultado.sort((a, b) => a.id - b.id);
  }
  return resultado;
}

function mostrarCartoes() {
  const lista = document.getElementById("listaCartoes");
  const contador = document.getElementById("contador");
  const botaoMais = document.getElementById("botaoMais");

  lista.replaceChildren();
  const exibidos = listaFiltrada.slice(0, quantidadeVisivel);
  exibidos.forEach((persona) => {
    lista.appendChild(criarCartao(persona, aoMudarFavorito, abrirDetalhes));
  });

  if (listaFiltrada.length === 0) {
    contador.textContent = "Nenhuma Persona encontrada com esses filtros.";
  } else {
    contador.textContent = "Mostrando " + exibidos.length + " de " + listaFiltrada.length + " Personas.";
  }
  botaoMais.hidden = exibidos.length >= listaFiltrada.length;
}

function atualizarLista() {
  listaFiltrada = filtrarPersonas();
  quantidadeVisivel = CARTOES_POR_LOTE;
  mostrarCartoes();
}

function aoMudarFavorito() {
  if (document.getElementById("somenteFavoritos").checked) {
    listaFiltrada = filtrarPersonas();
    mostrarCartoes();
  }
}

function abrirDetalhes(persona) {
  const janela = document.getElementById("janelaDetalhes");
  const conteudo = document.getElementById("conteudoDetalhes");
  conteudo.replaceChildren();

  const topo = criarElemento("div", "detalhes-topo");
  const figura = criarElemento("figure");
  figura.appendChild(criarImagem(persona));
  figura.appendChild(criarElemento("figcaption", "cartao-arcano", ALGARISMOS[persona.arcana] + " · " + persona.arcana));
  topo.appendChild(figura);

  const texto = criarElemento("div", "detalhes-texto");
  const titulo = criarElemento("h2", "", persona.name);
  titulo.id = "detalheNome";
  texto.appendChild(titulo);
  texto.appendChild(criarElemento("p", "", "Nível " + persona.level + (persona.dlc ? " · Conteúdo de DLC" : "")));
  texto.appendChild(criarElemento("p", "", obterDescricao(persona)));
  topo.appendChild(texto);
  conteudo.appendChild(topo);

  conteudo.appendChild(criarElemento("h3", "", "Status base"));
  const listaStatus = criarElemento("ul", "lista-status");
  ATRIBUTOS.forEach((atributo) => {
    const item = criarElemento("li");
    item.appendChild(criarElemento("span", "", NOMES_ATRIBUTOS[atributo]));
    const medidor = document.createElement("meter");
    medidor.min = 0;
    medidor.max = MAXIMO_STATUS;
    medidor.value = persona[atributo];
    medidor.setAttribute("aria-label", NOMES_ATRIBUTOS[atributo] + ": " + persona[atributo]);
    item.appendChild(medidor);
    item.appendChild(criarElemento("span", "", String(persona[atributo])));
    listaStatus.appendChild(item);
  });
  conteudo.appendChild(listaStatus);

  conteudo.appendChild(criarElemento("h3", "", "Afinidades"));
  const afinidades = criarElemento("dl", "afinidades");
  const grupos = [
    ["Fraco", persona.weak],
    ["Resiste", persona.resists],
    ["Reflete", persona.reflects],
    ["Absorve", persona.absorbs],
    ["Anula", persona.nullifies]
  ];
  grupos.forEach(([rotulo, elementos]) => {
    afinidades.appendChild(criarElemento("dt", "", rotulo));
    const definicao = criarElemento("dd");
    if (elementos.length === 0) {
      definicao.textContent = "-";
    }
    elementos.forEach((elemento) => {
      definicao.appendChild(criarElemento("span", "elemento elemento-" + elemento.toLowerCase(), traduzirElemento(elemento)));
    });
    afinidades.appendChild(definicao);
  });
  conteudo.appendChild(afinidades);

  janela.showModal();
}

async function iniciarExplorar() {
  const estado = document.getElementById("estadoCarregamento");
  const areaTentar = document.getElementById("areaTentar");
  const filtroArcano = document.getElementById("filtroArcano");
  estado.textContent = "Carregando...";
  estado.classList.remove("falha");
  estado.hidden = false;
  areaTentar.hidden = true;

  try {
    listaDePersonas = await carregarPersonas();
  } catch (erro) {
    estado.textContent = "Não foi possível carregar as Personas. Verifique sua conexão e tente novamente.";
    estado.classList.add("falha");
    areaTentar.hidden = false;
    return;
  }
  estado.hidden = true;
  if (filtroArcano.options.length === 1) {
    const arcanos = [...new Set(listaDePersonas.map((p) => p.arcana))];
    arcanos.forEach((arcano) => {
      const opcao = criarElemento("option", "", ALGARISMOS[arcano] + " · " + arcano);
      opcao.value = arcano;
      filtroArcano.appendChild(opcao);
    });
  }

  const parametros = new URLSearchParams(window.location.search);
  const arcanoDaUrl = parametros.get("arcano");
  if (arcanoDaUrl) {
    filtroArcano.value = arcanoDaUrl;
  }

  atualizarLista();
}

function configurarEventosExplorar() {
  const campoBusca = document.getElementById("campoBusca");
  const janela = document.getElementById("janelaDetalhes");
  campoBusca.addEventListener("input", atualizarLista);
  ["filtroArcano", "filtroFraqueza", "ordenacao", "somenteFavoritos"].forEach((id) => {
    document.getElementById(id).addEventListener("change", atualizarLista);
  });
  document.getElementById("formFiltros").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  document.getElementById("botaoLimpar").addEventListener("click", () => {
    document.getElementById("formFiltros").reset();
    atualizarLista();
  });
  document.getElementById("botaoMais").addEventListener("click", () => {
    quantidadeVisivel += CARTOES_POR_LOTE;
    mostrarCartoes();
  });
  document.getElementById("botaoTentar").addEventListener("click", iniciarExplorar);
  document.getElementById("fecharDetalhes").addEventListener("click", () => janela.close());
  janela.addEventListener("click", (evento) => {
    if (evento.target === janela) {
      janela.close();
    }
  });

  document.addEventListener("keydown", (evento) => {
    const digitando = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
    if (evento.key === "/" && !digitando) {
      evento.preventDefault();
      campoBusca.focus();
    }
  });
}

//tde01

function somar(a, b) {
  return a + b;
}

function subtrair(a, b) {
  return a - b;
}

function multiplicar(a, b) {
  return a * b;
}

function dividir(a, b) {
  if (b === 0) {
    return "Não é possível dividir por zero.";
  }
  return a / b;
}

function calcular(a, b, operacao) {
  return operacao(a, b);
}

const OPERACOES = {
  somar: { funcao: somar, simbolo: "+" },
  subtrair: { funcao: subtrair, simbolo: "−" },
  multiplicar: { funcao: multiplicar, simbolo: "×" },
  dividir: { funcao: dividir, simbolo: "÷" }
};

const calcularMedia = (lista, campo) => {
  if (lista.length === 0) {
    return 0;
  }
  return lista.reduce((soma, persona) => soma + persona[campo], 0) / lista.length;
};

function filtrarPorNivel(lista, nivelMinimo) {
  return lista.filter((persona) => persona.level >= nivelMinimo);
}

const historicoDeCalculos = [];

function mostrarHistorico() {
  const lista = document.getElementById("historico");
  lista.replaceChildren();
  historicoDeCalculos.forEach((linha) => {
    lista.appendChild(criarElemento("li", "", linha));
  });
}

function configurarCalculadora() {
  const campoA = document.getElementById("numeroA");
  const campoB = document.getElementById("numeroB");
  const resultado = document.getElementById("resultado");

  document.getElementById("formCalculadora").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  document.querySelectorAll("[data-operacao]").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (campoA.value === "" || campoB.value === "") {
        resultado.textContent = "Preencha os dois valores.";
        return;
      }
      const a = Number(campoA.value);
      const b = Number(campoB.value);
      const operacao = OPERACOES[botao.dataset.operacao];
      const valor = calcular(a, b, operacao.funcao);

      if (typeof valor === "string") {
        resultado.textContent = valor;
        return;
      }
      const arredondado = Number(valor.toFixed(2));
      resultado.textContent = a + " " + operacao.simbolo + " " + b + " = " + arredondado;
      historicoDeCalculos.push(resultado.textContent);
      mostrarHistorico();
    });
  });

  document.getElementById("limparHistorico").addEventListener("click", () => {
    historicoDeCalculos.splice(0);
    mostrarHistorico();
  });
}

function preencherValores() {
  const atributo = document.getElementById("atributoCalc").value;
  [["personaA", "numeroA"], ["personaB", "numeroB"]].forEach(([idSelect, idCampo]) => {
    const id = Number(document.getElementById(idSelect).value);
    const persona = listaDePersonas.find((p) => p.id === id);
    if (persona) {
      document.getElementById(idCampo).value = persona[atributo];
    }
  });
}

function atualizarMediasDosFavoritos() {
  const semFavoritos = document.getElementById("semFavoritos");
  const area = document.getElementById("areaFavoritos");
  const meusFavoritos = listaDePersonas.filter((p) => favoritos.includes(p.id));

  semFavoritos.hidden = meusFavoritos.length > 0;
  area.hidden = meusFavoritos.length === 0;
  if (meusFavoritos.length === 0) {
    return;
  }

  const nivelMinimo = Number(document.getElementById("nivelMinimo").value) || 1;
  const considerados = filtrarPorNivel(meusFavoritos, nivelMinimo);

  const corpo = document.getElementById("tabelaMedias");
  corpo.replaceChildren();
  ["level", ...ATRIBUTOS].forEach((campo) => {
    const linha = criarElemento("tr");
    linha.appendChild(criarElemento("td", "", NOMES_ATRIBUTOS[campo]));
    linha.appendChild(criarElemento("td", "", calcularMedia(considerados, campo).toFixed(1)));
    corpo.appendChild(linha);
  });

  const lista = document.getElementById("listaFavoritosFiltrados");
  lista.replaceChildren();
  if (considerados.length === 0) {
    lista.appendChild(criarElemento("li", "", "Nenhum favorito atende a esse nível."));
  }
  considerados.forEach((persona) => {
    lista.appendChild(criarElemento("li", "", persona.name + " (nível " + persona.level + ")"));
  });
}

function mostrarEstatisticasGerais() {
  const maisForte = listaDePersonas.reduce((melhor, p) => (somarStatus(p) > somarStatus(melhor) ? p : melhor));
  const nivelMedio = calcularMedia(listaDePersonas, "level").toFixed(1);
  document.getElementById("resumoGeral").textContent =
    "São " + listaDePersonas.length + " Personas, com nível médio " + nivelMedio +
    ". A de maior status base é " + maisForte.name + " (" + somarStatus(maisForte) + " pontos).";

  const contagem = listaDePersonas.reduce((acumulado, p) => {
    acumulado[p.arcana] = (acumulado[p.arcana] || 0) + 1;
    return acumulado;
  }, {});
  const maiorContagem = Math.max(...Object.values(contagem));

  const barras = document.getElementById("barrasArcano");
  Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .forEach(([arcano, quantidade]) => {
      const item = criarElemento("li");
      item.appendChild(criarElemento("span", "", arcano));
      const medidor = document.createElement("meter");
      medidor.min = 0;
      medidor.max = maiorContagem;
      medidor.value = quantidade;
      medidor.setAttribute("aria-label", arcano + ": " + quantidade + " personas");
      item.appendChild(medidor);
      item.appendChild(criarElemento("span", "", String(quantidade)));
      barras.appendChild(item);
    });
}

async function iniciarFerramentas() {
  configurarCalculadora();
  const estado = document.getElementById("estadoFerramentas");

  try {
    listaDePersonas = await carregarPersonas();
  } catch (erro) {
    estado.textContent = "Não foi possível carregar as Personas. A calculadora manual continua funcionando.";
    estado.classList.add("falha");
    return;
  }
  estado.hidden = true;

  ["personaA", "personaB"].forEach((idSelect) => {
    const select = document.getElementById(idSelect);
    listaDePersonas.forEach((persona) => {
      const opcao = criarElemento("option", "", persona.name);
      opcao.value = persona.id;
      select.appendChild(opcao);
    });
    select.addEventListener("change", preencherValores);
  });
  document.getElementById("atributoCalc").addEventListener("change", preencherValores);
  document.getElementById("nivelMinimo").addEventListener("input", atualizarMediasDosFavoritos);

  atualizarMediasDosFavoritos();
  mostrarEstatisticasGerais();
}

//post validacao e viacep
function mensagemDeErro(campo) {
  const estado = campo.validity;
  if (estado.valueMissing) {
    return campo.type === "checkbox" ? "Marque esta opção para continuar." : "Preencha este campo.";
  }
  if (estado.typeMismatch) {
    return "Informe um valor válido (ex.: nome@site.com).";
  }
  if (estado.tooShort) {
    return "Escreva pelo menos " + campo.minLength + " caracteres.";
  }
  if (estado.rangeUnderflow || estado.rangeOverflow) {
    return "Use um valor entre " + campo.min + " e " + campo.max + ".";
  }
  if (estado.patternMismatch) {
    return "Formato inválido.";
  }
  return "Valor inválido.";
}

function validarCampo(campo) {
  const valido = campo.checkValidity();
  campo.classList.toggle("erro", !valido);
  campo.setAttribute("aria-invalid", String(!valido));
  const aviso = campo.parentElement.querySelector(".mensagem-erro");
  if (aviso) {
    aviso.textContent = valido ? "" : mensagemDeErro(campo);
  }
  return valido;
}

async function buscarCep() {
  const campoCep = document.getElementById("cep");
  const campoCidade = document.getElementById("cidade");
  const aviso = campoCep.parentElement.querySelector(".mensagem-erro");
  const digitos = campoCep.value.replace(/\D/g, "");

  campoCep.classList.remove("erro");
  aviso.textContent = "";
  if (digitos === "") {
    return;
  }
  if (digitos.length !== 8) {
    campoCep.classList.add("erro");
    aviso.textContent = "O CEP precisa ter 8 números.";
    return;
  }

  try {
    const resposta = await fetch(CEP_URL + digitos + "/json/");
    if (!resposta.ok) {
      throw new Error("Erro HTTP " + resposta.status);
    }
    const endereco = await resposta.json();
    if (endereco.erro) {
      campoCep.classList.add("erro");
      aviso.textContent = "CEP não encontrado.";
      return;
    }
    campoCidade.value = endereco.localidade + " / " + endereco.uf;
  } catch (erro) {
    campoCep.classList.add("erro");
    aviso.textContent = "Não foi possível consultar o CEP agora. Preencha a cidade manualmente.";
  }
}

async function enviarContato(formulario) {
  const botao = document.getElementById("botaoEnviar");
  const painel = document.getElementById("respostaEnvio");
  const dados = {
    userId: 1,
    title: formulario.assunto.value + " - " + formulario.nome.value.trim(),
    body: formulario.mensagem.value.trim(),
    nome: formulario.nome.value.trim(),
    email: formulario.email.value.trim(),
    telefone: formulario.telefone.value.trim(),
    jogos: Number(formulario.jogos.value),
    arcanoFavorito: formulario.arcanoFavorito.value,
    cep: formulario.cep.value.trim(),
    cidade: formulario.cidade.value.trim()
  };

  botao.disabled = true;
  botao.textContent = "Enviando...";
  try {
    const resposta = await fetch(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    if (!resposta.ok) {
      throw new Error("Erro HTTP " + resposta.status);
    }
    const retorno = await resposta.json();

    document.getElementById("titulo-resposta").textContent = "Mensagem recebida";
    document.getElementById("textoConfirmacao").textContent =
      "Obrigado, " + dados.nome + "! Sua mensagem foi enviada (o JSONPlaceholder apenas simula o salvamento).";
    document.getElementById("statusEnvio").textContent = resposta.status + (resposta.status === 201 ? " Created" : "");
    document.getElementById("jsonEnvio").textContent = JSON.stringify(retorno, null, 2);
    formulario.reset();
    document.getElementById("contadorMensagem").textContent = "0/500";
  } catch (erro) {
    document.getElementById("titulo-resposta").textContent = "Não foi possível enviar";
    document.getElementById("textoConfirmacao").textContent =
      "Algo deu errado ao enviar. Verifique sua conexão e tente de novo. Seus dados continuam no formulário.";
    document.getElementById("statusEnvio").textContent = "falha";
    document.getElementById("jsonEnvio").textContent = String(erro.message);
  } finally {
    botao.disabled = false;
    botao.textContent = "Enviar mensagem";
    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function iniciarContato() {
  const formulario = document.getElementById("formContato");
  const campos = formulario.querySelectorAll("input, select, textarea");
  const selectArcano = document.getElementById("arcanoFavorito");

  Object.keys(ALGARISMOS).forEach((arcano) => {
    const opcao = criarElemento("option", "", ALGARISMOS[arcano] + " · " + arcano);
    opcao.value = arcano;
    selectArcano.appendChild(opcao);
  });

  campos.forEach((campo) => {
    campo.addEventListener("blur", () => {
      if (campo.id !== "cep") {
        validarCampo(campo);
      }
    });
    campo.addEventListener("input", () => {
      if (campo.classList.contains("erro") && campo.id !== "cep") {
        validarCampo(campo);
      }
    });
  });

  document.getElementById("cep").addEventListener("blur", buscarCep);

  const campoMensagem = document.getElementById("mensagem");
  campoMensagem.addEventListener("input", () => {
    document.getElementById("contadorMensagem").textContent = campoMensagem.value.length + "/500";
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const camposInvalidos = [...campos].filter((campo) => campo.id !== "cep" && !validarCampo(campo));
    if (camposInvalidos.length > 0) {
      camposInvalidos[0].focus();
      return;
    }
    enviarContato(formulario);
  });
}

//inicio programa

document.addEventListener("DOMContentLoaded", function () {
  favoritos = lerFavoritos();
  iniciarModoEscuro();
  iniciarIdioma();

  const pagina = document.body.dataset.pagina;
  if (pagina === "inicio") {
    iniciarInicio();
  } else if (pagina === "explorar") {
    configurarEventosExplorar();
    iniciarExplorar();
  } else if (pagina === "ferramentas") {
    iniciarFerramentas();
  } else if (pagina === "contato") {
    iniciarContato();
  }
});
//quase mil linhas meu jesus