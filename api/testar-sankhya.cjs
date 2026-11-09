
const path = require("node:path");

// Carrega as variaveis do arquivo api/.env
process.loadEnvFile(path.join(__dirname, ".env"));

function verificarVariavel(nome) {
  const valor = process.env[nome];

  if (!valor || !valor.trim()) {
    console.error(`[ERRO] Variavel ${nome} nao configurada.`);
    return false;
  }

  console.log(`[OK] ${nome}: configurado`);
  return true;
}

function mensagemSegura(valor) {
  if (typeof valor !== "string") {
    return "Nao informado";
  }

  // Evita imprimir possiveis tokens, senhas e segredos
  // que possam aparecer nas mensagens do servidor.
  const segredos = [
    process.env.SANKHYA_CLIENT_ID,
    process.env.SANKHYA_CLIENT_SECRET,
    process.env.SANKHYA_X_TOKEN,
  ].filter(Boolean);

  let texto = valor;

  for (const segredo of segredos) {
    texto = texto.split(segredo).join("[REDACTED]");
  }

  return texto
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[JWT REDACTED]"
    )
    .slice(0, 250);
}

async function testarConexao() {
  console.log("\n======================================");
  console.log(" PRODSYNC - TESTE DE API SANKHYA");
  console.log("======================================\n");

  const variaveis = [
    "SANKHYA_BASE_URL",
    "SANKHYA_CLIENT_ID",
    "SANKHYA_CLIENT_SECRET",
    "SANKHYA_X_TOKEN",
  ];

  const configuracaoValida = variaveis
    .map(verificarVariavel)
    .every(Boolean);

  if (!configuracaoValida) {
    console.error("\nCorrija o arquivo api/.env.");
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.SANKHYA_BASE_URL.trim();

  const url = new URL("/authenticate", baseUrl);

  if (url.protocol !== "https:") {
    throw new Error("A API Sankhya precisa utilizar HTTPS.");
  }

  console.log("\nEndpoint:", url.origin + url.pathname);

  if (url.hostname === "api.sankhya.com.br") {
    console.log("Ambiente identificado: PRODUCAO");
  } else if (
    url.hostname === "api.sandbox.sankhya.com.br"
  ) {
    console.log("Ambiente identificado: SANDBOX");
  } else {
    console.log("Ambiente: URL personalizada");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SANKHYA_CLIENT_ID,
    client_secret: process.env.SANKHYA_CLIENT_SECRET,
  });

  console.log("\nEnviando requisicao...");
  console.log("Metodo: POST");
  console.log("Formato: application/x-www-form-urlencoded");
  console.log("X-Token: configurado\n");

  const inicio = Date.now();

  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "X-Token": process.env.SANKHYA_X_TOKEN,
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  const duracao = Date.now() - inicio;

  console.log("Status HTTP:", resposta.status);
  console.log("Tempo de resposta:", duracao, "ms");

  // Lemos a resposta uma unica vez.
  const textoResposta = await resposta.text();

  let dados = {};

  try {
    dados = JSON.parse(textoResposta);
  } catch {
    console.log("Resposta recebida nao esta em formato JSON.");
  }

  if (!resposta.ok) {
    console.log("\n[ERRO] Falha na autenticacao.");

    if (dados.error) {
      console.log(
        "Codigo:",
        mensagemSegura(dados.error)
      );
    }

    if (dados.error_description) {
      console.log(
        "Descricao:",
        mensagemSegura(dados.error_description)
      );
    }

    console.log("\nDiagnostico:");

    switch (resposta.status) {
      case 400:
        console.log(
          "Requisicao invalida. Verifique os parametros enviados."
        );
        break;

      case 401:
        console.log(
          "Autenticacao recusada pelo Sankhya."
        );
        console.log(
          "Verifique Client ID, Client Secret, X-Token e ambiente."
        );
        break;

      case 403:
        console.log(
          "Acesso negado. Verifique as permissoes da integracao."
        );
        break;

      case 404:
        console.log(
          "Endpoint nao encontrado. Verifique a URL da API."
        );
        break;

      case 429:
        console.log(
          "Limite de requisicoes atingido."
        );
        break;

      default:
        console.log(
          "A API retornou um erro HTTP:",
          resposta.status
        );
    }

    console.log(
      "\nPor seguranca, o corpo completo da resposta nao sera exibido."
    );

    process.exitCode = 1;
    return;
  }

  if (!dados.access_token) {
    console.error(
      "\n[ERRO] A resposta foi bem-sucedida, mas nao retornou access_token."
    );

    process.exitCode = 1;
    return;
  }

  console.log("\n======================================");
  console.log(" AUTENTICACAO REALIZADA COM SUCESSO!");
  console.log("======================================");

  console.log(
    "Tipo de token:",
    dados.token_type ?? "Bearer"
  );

  console.log(
    "Expiracao:",
    dados.expires_in ?? "Nao informada",
    "segundos"
  );

  console.log("Access Token: recebido e protegido");

  console.log(
    "\nO PRODSYNC conseguiu autenticar na API Sankhya."
  );
}

testarConexao().catch((erro) => {
  if (erro.name === "TimeoutError") {
    console.error(
      "\n[ERRO] Tempo limite de conexao excedido (15 segundos)."
    );
  } else {
    console.error(
      "\n[ERRO] Falha durante a conexao:",
      erro.name || "Erro desconhecido"
    );
  }

  process.exitCode = 1;
});
