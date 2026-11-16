# Compendium de Persona

Compêndio das Personas baseado nos presentes em **Persona 3 Reload** e na estética da Velvet Room. Projeto Final - RA 3 (Desenvolvimento Web).

- **Repositório:** https://github.com/flipicets/Compendium-de-Personas
- **Site publicado:** https://flipicets.github.io/Compendium-de-Personas/
- **Tema:** Basicamente uma Pokédex mas para a série de jogos Persona.

## Integrantes

| Integrante |
|---|
| Fellipe Picetskei |
| Gale Dreveniaki |
| Rafael Olesko |
| Adrian Amorim |

## APIs usadas

A API original [luyluish/persona-compendium](https://github.com/luyluish/persona-compendium) **está fora do ar** (o autor avisa no README dela). Os dados, porém, estão publicados no próprio repositório, em um arquivo TSV público que libera CORS (`access-control-allow-origin: *`). O site faz o `GET` direto nele.

| Uso | Endpoint |
|---|---|
| GET principal (213 personas, TSV) | `https://raw.githubusercontent.com/luyluish/persona-compendium/main/docs/compendium.tsv` |
| GET reserva (mesmo conteúdo, JSON local) | `data/personas.json` |
| Descrições em português (arquivo local) | `data/descricoes-pt.json` |
| POST do formulário | `https://jsonplaceholder.typicode.com/posts` |
| CEP (opcional) | `https://viacep.com.br/ws/{cep}/json/` |

As descrições originais estão em inglês. Elas foram traduzidas para o português e ficam em `data/descricoes-pt.json` (id da persona busca o texto), a função `traduzirDescricoes` troca o texto depois do GET. O botão **Descrições: PT/EN** do cabeçalho alterna entre as duas versões (a escolha fica salva no `localStorage`, na chave `compendium:idioma`). Se o arquivo de tradução falhar, o site mostra o original em inglês e o botão fica vermelho. A tradução foi feita com ajuda de IA por se tratar de um volume muito grande de texto, por isso, erros podem estar presentes.

O TSV é convertido em um array de objetos pela função `converterTsv`. Se a fonte principal falhar, o site usa `data/personas.json` automaticamente.

Créditos dos dados: [Megaten Database](https://github.com/aqiu384/megaten-database) (aqiu384), imagens do Megami Tensei Wiki. Persona e Megami Tensei são propriedade da Atlus.

## Como rodar

Abra a pasta no VS Code e use o **Live Server** em `index.html`. (Abrir o arquivo direto com `file://` pode bloquear o `fetch`.)

## TDE 01 - Funções em JS

Página **Ferramentas** (`ferramentas.html`), código em `script.js`.

| Função | Recebe | Devolve | Onde é usada |
|---|---|---|---|
| `somar(a, b)` | dois números | `a + b` | Botão "Somar" da calculadora |
| `subtrair(a, b)` | dois números | `a - b` | Botão "Subtrair" |
| `multiplicar(a, b)` | dois números | `a * b` | Botão "Multiplicar" |
| `dividir(a, b)` | dois números | `a / b`, ou a mensagem "Não é possível dividir por zero." se `b` for 0 | Botão "Dividir" |
| `calcular(a, b, operacao)` | dois números e **uma função (callback)** | o resultado de `operacao(a, b)` | Chamada no clique dos 4 botões: `calcular(a, b, operacao.funcao)` |
| `calcularMedia(lista, campo)` (arrow) | array de personas e o nome de um campo | média do campo, usando `reduce` | Tabela "Médias dos seus favoritos" e resumo geral |
| `filtrarPorNivel(lista, nivelMinimo)` | array de personas e um nível | novo array só com as personas de nível maior ou igual (`filter`) | Filtro de nível mínimo dos favoritos |
| `mostrarHistorico()` | nada | nada (redesenha a lista) | Após cada conta; o array `historicoDeCalculos` usa `push` e `splice` |
| `preencherValores()` | nada | nada | Evento `change` dos selects de Persona A/B e atributo |

**Arrow functions:** `calcularMedia`, `normalizarTexto`, `somarStatus`, `traduzirElemento` e os callbacks de `map`, `filter` e `reduce`.

**Função anônima:** o `addEventListener("click", function () {...})` do botão de modo escuro e o do `DOMContentLoaded`.

**Callback:** `calcular(10, 2, dividir)` devolve `5`; `calcular(10, 0, dividir)` devolve a mensagem de divisão por zero.

---

## TDE 02 - Debugging em JavaScript

### Erro 1 - Imagens bloqueadas pelo navegador (`NotSameOrigin`)

- **Origem:** apareceu durante o desenvolvimento (cartões mostravam só o losango com o algarismo do arcano).
- **Sintoma e mensagem do console:** `Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` repetido uma vez por imagem (`megatenwiki.com/images/...Artwork.png`).
- **Como foi identificado:** aba **Console** (47 erros vermelhos) e aba **Network** filtrada por *Img*, onde as requisições para `megatenwiki.com` aparecem bloqueadas. A causa é o cabeçalho `Cross-Origin-Resource-Policy: same-origin` da wiki: ela proíbe que outros sites exibam suas imagens, e o navegador obedece.
- **Código antes** (`criarImagem`, versão inicial):

```js
const imagem = document.createElement("img");
imagem.src = persona.image; // endereço direto da wiki
```

- **Código depois** (`listarFontesDaImagem` + `criarImagem`): as artes foram baixadas para a pasta `img/` do projeto e o código tenta, em ordem, a pasta local, o proxy e a arte SVG de reserva.

```js
function listarFontesDaImagem(persona) {
  const fontes = [];
  if (IMAGENS_LOCAIS) {
    fontes.push(PASTA_IMAGENS + persona.query + ".png");
  }
  fontes.push(PROXY_IMAGENS + encodeURIComponent(persona.image));
  return fontes;
}
```

- **Solução aplicada:** download das imagens para `img/` (scripts `baixar-imagens.ps1` e `baixar-imagens-navegador.js`) e `IMAGENS_LOCAIS = true`.
- **Print:** 
- <img width="1405" height="696" alt="Erro 1" src="https://github.com/user-attachments/assets/9b90e3f9-fb02-4f2a-b564-1f71c47fb070" />


---

### Erro 2 - `CORS error` ao abrir o projeto por duplo clique (`file:///`)

- **Origem:** apareceu durante o desenvolvimento (a descrição das Personas continuava em inglês).
- **Sintoma e mensagem do console:** na aba Network, `descricoes-pt.json` com status **CORS error** e tamanho 0,0 kB, enquanto `compendium.tsv` voltava `200`.
- **Como foi identificado:** aba **Network**. O `compendium.tsv` funciona porque vem da internet (`https://raw.githubusercontent.com/...`, que libera CORS), mas o `descricoes-pt.json` é um arquivo local, e o navegador bloqueia `fetch` de arquivos locais quando a página é aberta com endereço `file:///C:/...`.
- **Código antes** (`traduzirDescricoes`): o `catch` engolia o erro e o usuário não sabia por que a tradução não aparecia.

```js
  } catch (erro) {
    // Sem tradução: mantém a descrição em inglês
  }
  return lista;
```

- **Código depois:** o erro passa a ser sinalizado (botão de idioma fica vermelho com aviso).

```js
  } catch (erro) {
    traducaoDisponivel = false;
  }
  traducaoTentada = true;
  const botaoIdioma = document.getElementById("botaoIdioma");
  if (botaoIdioma) {
    atualizarBotaoIdioma(botaoIdioma);
  }
```

- **Solução aplicada:** abrir o projeto pelo **Live Server** (`http://127.0.0.1:5500`) em vez de `file:///`. No GitHub Pages o endereço é `https://`, então também funciona.
- **Print:** 
- <img width="1087" height="81" alt="Erro 2A" src="https://github.com/user-attachments/assets/caed2d9b-7b4a-4b6a-af49-701b0a177673" />
- <img width="1568" height="775" alt="Erro 2B" src="https://github.com/user-attachments/assets/f02c640b-f3b0-4d1d-905c-9e097f6db11c" />


---

### Erro 3 - Aviso de "tradução não carregou" aparecendo sempre (bug de lógica)

- **Origem:** encontrado durante o desenvolvimento do botão **Descrições: PT/EN**.
- **Sintoma:** o código rodava sem nenhum erro no Console, mas o botão ficava vermelho e mostrava o aviso de falha **mesmo com o `descricoes-pt.json` carregando certo**. Resultado errado, sem mensagem de erro: é um erro de lógica.
- **Como foi identificado:** breakpoint em `atualizarBotaoIdioma` e **Watch** de `traducaoDisponivel`. Na primeira chamada (quando a página abre) o valor ainda era `false` porque o `fetch` da tradução não tinha terminado, e a condição tratava "ainda não tentei" como "tentei e falhou".
- **Código antes:**

```js
function atualizarBotaoIdioma(botao) {
  const emPortugues = idiomaDasDescricoes === "pt";
  botao.textContent = "Descrições: " + (emPortugues ? "PT" : "EN");
  if (emPortugues && !traducaoDisponivel) {
    botao.title = "A tradução não carregou...";
    botao.classList.add("sem-traducao");
  }
}
```

- **Código depois:** nova variável `traducaoTentada`, que só vira `true` depois do `fetch` terminar (com sucesso ou com falha).

```js
  if (traducaoTentada && !traducaoDisponivel) {
    botao.title = "A tradução não carregou: confira se data/descricoes-pt.json está no projeto";
    botao.classList.add("sem-traducao");
  }
```

- **Print:** 
- <img width="1919" height="946" alt="Erro 3" src="https://github.com/user-attachments/assets/ee47a34e-e2a1-4dd0-9b57-cf3ffb6013f6" />


---

## Imagens das Personas

As artes vêm do Megami Tensei Wiki, que bloqueia o uso das suas imagens em outros sites (cabeçalho `Cross-Origin-Resource-Policy: same-origin`, erro `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` no console). Por isso as imagens ficam **dentro do projeto**, na pasta `img/`:

