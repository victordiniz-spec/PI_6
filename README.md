# PRODSYNC

Aplicativo mobile para controle, acompanhamento e rastreabilidade da produção no chão de fábrica.

O **PRODSYNC** está sendo desenvolvido como Projeto Integrador do curso de **Sistemas de Informação do Centro Universitário de Patos de Minas — UNIPAM**.

O objetivo do projeto é disponibilizar aos operadores uma aplicação Android integrada ao **ERP Sankhya**, permitindo consultar Ordens de Produção, registrar o andamento da produção, controlar quantidades, emitir etiquetas e validar pacotes de maneira simples, rápida e organizada.

---

## 📌 Sobre o projeto

Atualmente, diversas informações relacionadas à produção precisam ser registradas fora do local onde o processo produtivo acontece.

O PRODSYNC busca aproximar esse registro do chão de fábrica por meio de um aplicativo mobile específico para os operadores.

A aplicação deverá permitir:

- consultar Ordens de Produção;
- localizar OPs por código ou código de barras;
- iniciar uma produção;
- realizar parada;
- retomar uma produção;
- finalizar uma produção;
- informar quantidades produzidas;
- acompanhar quantidade planejada;
- acompanhar quantidade produzida;
- acompanhar quantidade pendente;
- emitir etiquetas;
- reimprimir etiquetas;
- validar pacotes;
- realizar bipagem;
- acompanhar indicadores da produção;
- sincronizar informações com o Sankhya.

O **Sankhya continuará sendo o sistema principal de gestão dos dados**, enquanto o PRODSYNC funcionará como uma interface mobile para facilitar a operação no chão de fábrica.

---

# 🎯 Objetivo geral

Desenvolver um aplicativo Android integrado ao Sankhya por API para facilitar o controle e o registro da produção.

O aplicativo permitirá consultar Ordens de Produção, registrar o andamento e as quantidades produzidas, imprimir e validar etiquetas e enviar essas informações para o ERP.

---

# 🎯 Objetivos específicos

- Levantar o fluxo atual da produção.
- Identificar os dados necessários para consultar e atualizar as Ordens de Produção no Sankhya.
- Implementar consulta de OP por código.
- Implementar consulta por leitura de código de barras.
- Registrar início da produção.
- Registrar parada da produção.
- Registrar retomada da produção.
- Registrar finalização da produção.
- Controlar quantidade planejada.
- Controlar quantidade produzida.
- Controlar quantidade pendente.
- Integrar a emissão de etiquetas.
- Relacionar OP, produto, pacote e etiqueta.
- Permitir reimpressão individual de etiquetas.
- Registrar reimpressões para rastreabilidade.
- Realizar leitura das etiquetas.
- Validar pacotes em um ponto de bipagem.
- Apresentar indicadores da produção.
- Integrar os apontamentos com o Sankhya.
- Manter os status das OPs sincronizados com o ERP.

---

# 👥 Equipe

Projeto desenvolvido por:

- Gustavo Ferreira Braga
- João Pedro Fonseca Santana
- João Vitor de Sá Melo
- Luis Felipe de Oliveira Silva
- Victor Nascimento Diniz

Curso:

**Sistemas de Informação — UNIPAM**

---

# 🏗️ Arquitetura planejada

A arquitetura geral do sistema deverá seguir aproximadamente o seguinte fluxo:

```text
┌───────────────────────────────┐
│         PRODSYNC MOBILE       │
│                               │
│ React Native                  │
│ Expo                          │
│ TypeScript                    │
└───────────────┬───────────────┘
                │
                │ HTTPS / API
                ▼
┌───────────────────────────────┐
│           BACKEND             │
│                               │
│ Regras de negócio             │
│ Autenticação                  │
│ Integrações                   │
│ Validações                    │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          SANKHYA ERP          │
│                               │
│ Ordens de Produção            │
│ Produtos                      │
│ Apontamentos                  │
│ Produção                      │
└───────────────────────────────┘
```

A arquitetura poderá ser ajustada durante o desenvolvimento conforme os requisitos da API Sankhya forem validados.

---

# 📱 Aplicativo Mobile

## Tecnologias utilizadas atualmente

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- NativeWind 4
- React Native Reanimated
- React Native Safe Area Context
- React Native SVG
- Lucide React Native

---

# 🎨 Design

O design do PRODSYNC está sendo desenvolvido no **Figma**.

O projeto seguirá um Design System próprio para manter consistência visual em todas as telas.

Serão padronizados:

- cores;
- tipografia;
- espaçamentos;
- bordas;
- sombras;
- botões;
- inputs;
- cards;
- cabeçalhos;
- ícones;
- mensagens;
- estados de erro;
- estados de sucesso;
- indicadores de produção;
- estados de carregamento.

---

## 🎨 Identidade visual

A identidade atual utiliza principalmente:

- azul-marinho;
- azul/ciano;
- branco;
- cinza claro;
- verde para sucesso;
- amarelo/laranja para alertas;
- vermelho para erros.

> Os valores definitivos das cores serão sincronizados com o Design System do Figma.

---

# 📲 Telas planejadas

Entre as telas previstas estão:

```text
Splash
│
▼
Login
│
▼
Home / Dashboard
│
├── Consultar OP
│
├── Ler código
│
├── OP em andamento
│   ├── Iniciar
│   ├── Parar
│   ├── Retomar
│   └── Finalizar
│
├── Quantidades
│
├── Etiquetas
│   ├── Emitir
│   └── Reimprimir
│
├── Bipagem
│   └── Validar pacote
│
├── Histórico
│
└── Perfil / Configurações
```

Esse fluxo poderá evoluir ao longo do desenvolvimento.

---

# 🔐 Autenticação

A aplicação possuirá autenticação para impedir acesso não autorizado.

A autenticação definitiva ainda será integrada ao backend/Sankhya.

## Diretrizes de segurança

- Senhas não devem ser armazenadas diretamente no dispositivo.
- Credenciais não devem ser inseridas diretamente no código.
- Tokens devem ser armazenados de forma segura.
- Dados sensíveis não devem ser enviados para o GitHub.
- A aplicação deverá utilizar HTTPS.
- Mensagens de autenticação não devem revelar informações desnecessárias.
- Sessões expiradas deverão exigir nova autenticação.
- O aplicativo deverá possuir opção de logout.

Durante o desenvolvimento poderá ser utilizada autenticação simulada para testes.

---

# 🔄 Integração com Sankhya

O PRODSYNC será integrado ao ERP **Sankhya** através de API.

A integração deverá possibilitar operações como:

```text
PRODSYNC
    │
    ├── Consultar OP
    │
    ├── Consultar produto
    │
    ├── Consultar quantidade
    │
    ├── Registrar apontamento
    │
    ├── Atualizar produção
    │
    ├── Registrar etiqueta
    │
    └── Consultar status
    │
    ▼
SANKHYA ERP
```

Os endpoints e métodos definitivos serão documentados após a validação da API utilizada no ambiente do projeto.

---

# 🏷️ Etiquetas

O aplicativo deverá possuir recursos relacionados à emissão e rastreabilidade de etiquetas.

Cada pacote deverá poder ser relacionado a:

```text
Ordem de Produção
       │
       ▼
Produto
       │
       ▼
Pacote
       │
       ▼
Etiqueta
       │
       ▼
Bipagem
```

Também deverá ser possível realizar a reimpressão de uma etiqueta específica sem perder o vínculo com o pacote original.

---

# 📷 Código de barras

O aplicativo deverá permitir leitura de códigos utilizando a câmera do dispositivo ou leitor compatível.

A leitura será utilizada principalmente para:

- localizar OP;
- identificar etiquetas;
- identificar pacotes;
- realizar bipagem;
- validar produção.

---

# 📊 Indicadores

A Home deverá apresentar informações importantes ao operador, como:

- OP atual;
- produto;
- quantidade planejada;
- quantidade produzida;
- quantidade restante;
- percentual produzido;
- número de etiquetas;
- pacotes aguardando bipagem;
- status da integração;
- alertas de sincronização.

---

# 🗂️ Estrutura atual do projeto

```text
PI_6/
│
├── assets/
│
├── src/
│   │
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   │
│   ├── components/
│   │   ├── forms/
│   │   │   └── TextField.tsx
│   │   │
│   │   ├── layout/
│   │   │
│   │   └── ui/
│   │       └── Button.tsx
│   │
│   └── theme/
│       └── colors.ts
│
├── global.css
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
├── tailwind.config.js
├── app.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
├── .nvmrc
└── README.md
```

A estrutura será expandida conforme novas funcionalidades forem implementadas.

Uma possível evolução será:

```text
src/
│
├── app/
├── components/
│   ├── forms/
│   ├── layout/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── production/
│   ├── orders/
│   ├── labels/
│   └── scanning/
│
├── services/
├── hooks/
├── stores/
├── schemas/
├── types/
├── utils/
├── constants/
└── theme/
```

---

# 💻 Pré-requisitos

Antes de executar o projeto, é necessário instalar algumas ferramentas.

## Git

Verifique:

```bash
git --version
```

---

## Node.js

Versão utilizada atualmente no desenvolvimento:

```text
24.13.1
```

Verifique:

```bash
node -v
```

---

## npm

Versão utilizada atualmente:

```text
11.8.0
```

Verifique:

```bash
npm -v
```

---

## Visual Studio Code

Editor utilizado pelo projeto.

Extensões recomendadas:

- ESLint
- Prettier
- GitLens
- Error Lens
- Pretty TypeScript Errors

---

## Expo Go

Pode ser utilizado para testar o aplicativo diretamente em um dispositivo físico.

O computador e o celular devem estar preferencialmente conectados à mesma rede.

---

## Android Studio

Opcional neste momento.

É necessário caso o desenvolvedor deseje utilizar um emulador Android local ou trabalhar futuramente com configurações nativas específicas.

---

# 🚀 Instalando o projeto

## 1. Acesso ao GitHub

O desenvolvedor precisa possuir acesso ao repositório privado.

Repositório:

```text
https://github.com/victordiniz-spec/PI_6
```

---

## 2. Clonar o projeto

```bash
git clone https://github.com/victordiniz-spec/PI_6.git
```

---

## 3. Entrar na pasta

```bash
cd PI_6
```

---

## 4. Abrir no VS Code

```bash
code .
```

---

## 5. Instalar dependências

Execute:

```bash
npm ci
```

O comando utilizará o `package-lock.json` para instalar as versões das dependências utilizadas pelo projeto.

Não é necessário instalar individualmente:

- Expo;
- NativeWind;
- Lucide;
- React Native SVG;
- Reanimated;
- Expo Router;
- outras dependências presentes no `package.json`.

---

# ▶️ Executando o projeto

Execute:

```bash
npx expo start
```

O Expo iniciará o Metro Bundler.

---

## Limpar cache

Se houver problemas relacionados ao cache:

```bash
npx expo start --clear
```

---

# 📱 Executar no celular

Com o Expo iniciado, um QR Code será exibido.

Abra o **Expo Go** e escaneie o código.

---

# 🌐 Executar no navegador

Com o Expo em execução, pressione:

```text
w
```

Ou execute:

```bash
npm run web
```

---

# 🤖 Executar no Android

Caso o Android Studio e um emulador estejam configurados:

```bash
npm run android
```

Ou pressione:

```text
a
```

no terminal do Expo.

---

# 🍎 iOS

A compilação nativa local para iOS exige macOS.

Durante o desenvolvimento, dispositivos compatíveis poderão utilizar as ferramentas disponíveis pelo ecossistema Expo.

---

# 🌿 Git e GitHub

O projeto utiliza Git para versionamento e GitHub como repositório remoto.

---

## Branch principal

```text
main
```

A branch `main` deve manter uma versão funcional do projeto.

---

# 🌳 Fluxo de branches

Para evitar conflitos, novas funcionalidades devem ser desenvolvidas em branches próprias.

Exemplos:

```text
feature/login
feature/home
feature/auth
feature/consulta-op
feature/detalhes-op
feature/leitor-codigo
feature/producao
feature/etiquetas
feature/bipagem
feature/dashboard
```

Correções podem utilizar:

```text
fix/login
fix/home
fix/scanner
```

---

# 🔄 Antes de começar a trabalhar

Atualize seu repositório:

```bash
git checkout main
```

Depois:

```bash
git pull
```

Crie uma nova branch:

```bash
git checkout -b feature/nome-da-funcionalidade
```

Exemplo:

```bash
git checkout -b feature/home
```

---

# 💾 Salvando alterações

Verifique os arquivos alterados:

```bash
git status
```

Adicione:

```bash
git add -A
```

Crie o commit:

```bash
git commit -m "feat: cria tela inicial"
```

Envie a branch:

```bash
git push -u origin feature/home
```

Depois a alteração deverá ser revisada antes de entrar na `main`.

---

# 📝 Padrão de commits

O projeto utiliza mensagens de commit simples e padronizadas.

## Nova funcionalidade

```text
feat: cria tela de login
```

## Correção

```text
fix: corrige validação do formulário
```

## Alteração visual

```text
style: ajusta espaçamento da home
```

## Refatoração

```text
refactor: reorganiza componentes de produção
```

## Configuração

```text
chore: configura NativeWind
```

## Documentação

```text
docs: atualiza README
```

## Testes

```text
test: adiciona testes de autenticação
```

---

# ⚠️ Regras para o desenvolvimento em equipe

1. Sempre executar `git pull` antes de iniciar o trabalho.

2. Evitar desenvolver diretamente na branch `main`.

3. Cada funcionalidade deve possuir sua própria branch.

4. Não enviar código que não esteja funcionando.

5. Não apagar código de outro integrante sem alinhamento prévio.

6. Não enviar `node_modules` ao GitHub.

7. Não enviar senhas.

8. Não enviar tokens.

9. Não enviar chaves de API.

10. Não enviar arquivos `.env` contendo informações sensíveis.

11. Antes de realizar `push`, verificar:

```bash
git status
```

12. Testar o aplicativo antes de enviar alterações.

---

# 🔒 Variáveis de ambiente

Credenciais e configurações sensíveis deverão ser armazenadas utilizando variáveis de ambiente.

Exemplo futuro:

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_USE_MOCK_AUTH=
```

O arquivo real:

```text
.env
```

não deverá conter credenciais versionadas publicamente.

Quando necessário, será criado:

```text
.env.example
```

contendo apenas os nomes das variáveis utilizadas.

---

# 📦 Dependências

Depois que um integrante instalar uma nova biblioteca necessária ao projeto, os arquivos:

```text
package.json
package-lock.json
```

devem ser enviados ao GitHub.

Os demais integrantes deverão executar:

```bash
npm ci
```

ou, quando necessário:

```bash
npm install
```

para atualizar as dependências locais.

---

# 🧹 node_modules

A pasta:

```text
node_modules/
```

não deve ser enviada para o GitHub.

Cada desenvolvedor possuirá sua própria cópia local criada pelo npm.

---

# 🔐 Segurança

O projeto deverá seguir boas práticas de segurança.

Entre elas:

- comunicação utilizando HTTPS;
- autenticação no backend;
- validação das informações recebidas;
- armazenamento seguro de tokens;
- nenhuma senha armazenada em texto puro;
- nenhuma credencial dentro do código;
- tratamento de sessão expirada;
- controle de acesso;
- validação no backend;
- tratamento de erros sem exposição de informações sensíveis.

---

# 🧪 Testes

O projeto deverá possuir testes durante sua evolução.

Serão avaliados principalmente:

- autenticação;
- formulários;
- consulta de OP;
- apontamentos;
- leitura de códigos;
- emissão de etiquetas;
- bipagem;
- integração com Sankhya;
- falhas de conexão;
- sincronização de informações.

---

# 🔌 Funcionamento em caso de falhas

Como o aplicativo será utilizado no chão de fábrica, deverão ser previstos cenários como:

- perda de internet;
- Sankhya indisponível;
- API indisponível;
- código de barras inválido;
- OP inexistente;
- etiqueta inválida;
- tentativa de bipagem duplicada;
- falha de impressão;
- sessão expirada;
- tentativa de apontamento duplicado.

A estratégia definitiva de tratamento e sincronização será definida durante o desenvolvimento.

---

# 🖨️ Impressão

O projeto deverá ser integrado a uma impressora de etiquetas utilizada no ambiente produtivo.

A integração ainda será validada conforme:

- modelo da impressora;
- protocolo utilizado;
- conexão disponível;
- linguagem de impressão;
- funcionamento da rede da fábrica.

---

# 🛠️ Backend

O backend ainda será implementado.

Arquitetura inicialmente considerada:

- Node.js;
- TypeScript;
- NestJS;
- API REST;
- autenticação;
- Swagger / OpenAPI;
- Prisma;
- PostgreSQL.

> Essas tecnologias ainda são consideradas parte da arquitetura planejada e poderão ser ajustadas conforme os requisitos técnicos da integração com o Sankhya.

---

# 🗄️ Banco de dados

O banco próprio do projeto ainda será definido durante a implementação do backend.

Existe previsão de utilização de banco relacional para dados auxiliares relacionados a:

- usuários do aplicativo;
- eventos;
- logs;
- rastreabilidade;
- etiquetas;
- reimpressões;
- bipagens;
- sincronizações.

O Sankhya continuará sendo responsável pelos dados principais relacionados ao ERP.

---

# 📚 Documentação da API

Quando o backend for implementado, a API deverá possuir documentação.

Está previsto utilizar:

```text
Swagger / OpenAPI
```

Permitindo visualizar:

```text
Método
Endpoint
Parâmetros
Body
Resposta
Erros
Autenticação
```

---

# 📍 Status atual

## Concluído

- [x] Repositório GitHub criado
- [x] Git configurado
- [x] Projeto Expo criado
- [x] Expo SDK 57 configurado
- [x] TypeScript configurado
- [x] Expo Router configurado
- [x] NativeWind configurado
- [x] Design System inicial criado
- [x] Lucide configurado
- [x] Componente Button criado
- [x] Componente TextField criado
- [x] Campo de senha com mostrar/ocultar
- [x] Tela inicial de login criada
- [x] Projeto testado no navegador

---

## Em desenvolvimento

- [ ] Autenticação temporária
- [ ] Navegação protegida
- [ ] Home
- [ ] Navegação inferior

---

## Planejado

- [ ] Integração real de autenticação
- [ ] Integração Sankhya
- [ ] Consulta de OP
- [ ] Detalhes da OP
- [ ] Leitura de código de barras
- [ ] Início da produção
- [ ] Parada da produção
- [ ] Retomada da produção
- [ ] Finalização da produção
- [ ] Controle das quantidades
- [ ] Emissão de etiquetas
- [ ] Reimpressão de etiquetas
- [ ] Histórico de reimpressões
- [ ] Bipagem
- [ ] Validação de pacotes
- [ ] Indicadores
- [ ] Tratamento de sincronização
- [ ] Backend
- [ ] Banco de dados
- [ ] Testes
- [ ] Documentação da API
- [ ] Build Android
- [ ] Testes no ambiente real

---

# 🗓️ Metodologia

O desenvolvimento será realizado de forma incremental.

A implementação será dividida em etapas, priorizando inicialmente o fluxo principal:

```text
Login
  ↓
Home
  ↓
Consulta OP
  ↓
Produção
  ↓
Quantidades
  ↓
Etiquetas
  ↓
Bipagem
  ↓
Sincronização Sankhya
```

Depois serão adicionadas funcionalidades complementares e melhorias.

---

# 📖 Documentação

Este README deverá ser atualizado durante todo o desenvolvimento.

Sempre que houver alterações importantes, como:

- nova tecnologia;
- nova dependência;
- nova tela;
- nova funcionalidade;
- alteração na estrutura;
- configuração de API;
- configuração do banco;
- novo comando;
- mudança no fluxo Git;

a documentação também deverá ser atualizada.

---

# 🏭 PRODSYNC

**Controle de produção simples, integrado e próximo do chão de fábrica.**

Projeto acadêmico desenvolvido no curso de Sistemas de Informação — UNIPAM.

2026