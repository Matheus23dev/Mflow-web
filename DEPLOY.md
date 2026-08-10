# Publicação do MFlow

## Ordem recomendada

1. Criar ou reativar o MySQL gratuito no Aiven.
2. Publicar a API no Render pelo arquivo `render.yaml`.
3. Publicar o frontend na Vercel.
4. Atualizar no Render a URL definitiva da Vercel.

## 1. Aiven

- Crie um serviço **MySQL** no plano **Free**.
- Use o banco `defaultdb` ou crie um banco chamado `mflow`.
- Em **Quick connect**, copie a URI de conexão.
- Baixe o arquivo **CA certificate**.
- Nunca envie a URI, a senha ou o certificado em um repositório público.

Se o endereço antigo do serviço não resolver mais, o serviço foi removido ou está
indisponível. Use a URI e o certificado exibidos atualmente no painel do Aiven.

## 2. Render

No painel do Render, escolha **New > Blueprint** e importe o repositório da API
(`mflow-api`). O Render encontrará o arquivo `render.yaml` e configurará:

- Runtime: Node.js 22
- Plano: Free
- Build: `npm ci && npm run build`
- Start: `npm run start:deploy`
- Health check: `/api`

Durante a criação, informe:

```dotenv
DATABASE_URL=mysql://USUARIO:SENHA@HOST:PORTA/defaultdb
DATABASE_CA="-----BEGIN CERTIFICATE-----\nCERTIFICADO_CA_DO_AIVEN\n-----END CERTIFICATE-----"
FRONTEND_URL=http://localhost:5173
```

O `JWT_SECRET` será criado automaticamente pelo Render. O comando de início cria
o certificado temporário, executa `prisma migrate deploy` e só então inicia a API.
O Render fornece a variável `PORT` automaticamente.

Ao terminar, teste `https://SUA-API.onrender.com/api`. O retorno deve conter
`"status":"ok"`.

## 3. Vercel

Importe o repositório do frontend (`Mflow`). A configuração em `vercel.json`
seleciona Vite, executa `npm run build` e publica a pasta `dist`.

Adicione a variável abaixo nos ambientes Production, Preview e Development:

```dotenv
VITE_API_URL=https://SUA-API.onrender.com/api
```

Depois do primeiro deploy, copie a URL final da Vercel, altere `FRONTEND_URL` no
Render para essa URL sem barra no final e faça um novo deploy da API.

## Primeiro acesso

Em um banco vazio, a tela inicial permite criar somente o primeiro administrador.
Faça esse cadastro imediatamente depois da publicação e use uma senha forte.

## Limitações gratuitas

- A instância gratuita do Render hiberna após 15 minutos sem tráfego; a primeira
  requisição depois disso pode levar cerca de um minuto.
- O Aiven Free pode pausar um serviço inativo e não oferece SLA.
- O plano Hobby da Vercel permite apenas uso pessoal e não comercial. Para uso
  comercial, use um plano permitido ou outro provedor compatível.
