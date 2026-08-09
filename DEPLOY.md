# Publicação do MFlow

## Ordem recomendada

1. Criar o MySQL gratuito no Aiven.
2. Publicar a API no Koyeb.
3. Publicar o frontend na Vercel.
4. Voltar ao Koyeb e configurar a URL definitiva da Vercel no CORS.

## 1. Aiven

- Crie um serviço **MySQL** no plano **Free**.
- Use o banco `defaultdb` ou crie um banco chamado `mflow`.
- Em **Quick connect**, copie a URI de conexão.
- Baixe o certificado **CA certificate**.
- Nunca envie a URI, a senha ou o certificado em um repositório público.

## 2. Koyeb

Importe o repositório da API (`mflow-api`) como um **Web Service** usando o builder **Buildpack** e a instância **Free**.

- Branch: `main`
- Build command: automático (`npm run build`)
- Run command: automático pelo `Procfile` (`npm run start:deploy`)
- Porta HTTP: `8000`
- Rota: `/`
- Health check HTTP: `/api`

Variáveis:

```dotenv
DATABASE_URL=mysql://USUARIO:SENHA@HOST:PORTA/defaultdb
DATABASE_CA="-----BEGIN CERTIFICATE-----\nCERTIFICADO_CA_DO_AIVEN\n-----END CERTIFICATE-----"
JWT_SECRET=SEGREDO_ALEATORIO_LONGO
FRONTEND_URL=https://endereco-final.vercel.app
```

O comando de início cria o arquivo temporário do certificado, executa `prisma migrate deploy` e só então inicia a API. A Koyeb fornece `PORT` automaticamente.

Teste a API em `https://SUA-API.koyeb.app/api`. O retorno deve conter `"status":"ok"`.

## 3. Vercel

Importe o repositório do frontend (`Mflow`). A configuração em `vercel.json` seleciona Vite, executa `npm run build` e publica `dist`.

Adicione a variável abaixo nos ambientes Production, Preview e Development:

```dotenv
VITE_API_URL=https://SUA-API.koyeb.app/api
```

Depois do primeiro deploy, copie a URL final da Vercel, atualize `FRONTEND_URL` no Koyeb e faça um novo deploy da API.

## Primeiro acesso

Em um banco vazio, a tela inicial permite criar somente o primeiro administrador. Faça esse cadastro imediatamente depois da publicação. Use uma senha forte em uma instalação pública.

## Limitações gratuitas

- A instância gratuita da Koyeb hiberna sem tráfego; a primeira requisição pode ser lenta.
- O Aiven Free pode pausar um serviço inativo e não oferece SLA.
- O plano Hobby da Vercel permite apenas uso pessoal e não comercial. Para uso comercial, escolha um plano permitido ou outro provedor compatível.
