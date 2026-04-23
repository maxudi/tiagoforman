# ⚠️ ERRO: supabaseUrl is required - SOLUÇÃO COMPLETA

## Problema
O site está mostrando página em branco e o erro no console:
```
Uncaught Error: supabaseUrl is required.
```

## Causa Raiz Explicada
O **Vite** substitui variáveis `VITE_*` **durante o build** (quando compila o código), NÃO em runtime (quando o site roda). Isso significa que:

1. ❌ Adicionar nas Environment Variables do Easypanel não funciona (elas só existem em runtime)
2. ✅ Você precisa que as variáveis estejam disponíveis DURANTE O BUILD
3. 📦 O arquivo `.env` não vai para o Git (por segurança)

## ✅ ESCOLHA UMA DAS 3 SOLUÇÕES:

---

### 🎯 SOLUÇÃO 1: Build Arguments (RECOMENDADA)

Esta é a melhor solução se o Easypanel suportar Build Arguments.

#### Passo 1: Acessar Easypanel
1. Acesse seu painel do Easypanel
2. Selecione o projeto **tiagoforman**
3. Vá em **Settings** → **Build** (ou procure por "Build Arguments")

#### Passo 2: Adicionar Build Arguments

Procure por uma opção chamada:
- **Build Arguments**
- **Build Args**
- **Docker Build Args**
- **ARG Variables**

Adicione as 2 variáveis:

**Build Argument 1:**
```
VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host
```

**Build Argument 2:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

#### Passo 3: Redeploy
1. Salve as configurações
2. Faça um **novo build/deploy** (não apenas restart!)
3. Aguarde a imagem ser construída (2-5 minutos)

---

### 🔧 SOLUÇÃO 2: Runtime Injection (SE NÃO TIVER BUILD ARGS)

Se o Easypanel NÃO tem Build Arguments, use esta solução alternativa.

#### Passo 1: Renomear Dockerfile

No Easypanel, configure para usar o arquivo `Dockerfile.runtime` ao invés de `Dockerfile`:

1. Acesse **Settings** → **Build**
2. Procure por "Dockerfile Path" ou similar
3. Mude de `Dockerfile` para `Dockerfile.runtime`

#### Passo 2: Adicionar Environment Variables

Agora sim, adicione nas **Environment Variables** (não Build Args):

**Variável 1:**
```
VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host
```

**Variável 2:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

#### Passo 3: Redeploy
1. Salve tudo
2. Faça um redeploy completo
3. O script `start.sh` vai injetar as variáveis automaticamente

---

### 🚀 SOLUÇÃO 3: GitHub Actions (MAIS ROBUSTA)

Build no GitHub Actions e só deploye a imagem pronta.

**Vantagens:**
- ✅ Controle total do processo de build
- ✅ Secrets gerenciados pelo GitHub
- ✅ Build cache otimizado
- ✅ Logs detalhados

**Desvantagens:**
- Requer configuração inicial mais complexa

*Entre em contato se quiser implementar esta solução.*

---

## 🧪 Como Testar Localmente

Para testar o build com Docker localmente:

```bash
# Com Build Arguments (Solução 1)
docker build \
  --build-arg VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE \
  -t tiagoforman .

docker run -p 8080:80 tiagoforman
```

```bash
# Com Runtime Injection (Solução 2)
docker build -f Dockerfile.runtime -t tiagoforman .

docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host \
  -e VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE \
  tiagoforman
```

Acesse: http://localhost:8080

---

## 📝 Diferença Importante

| Tipo | Quando Disponível | Onde Usar |
|------|------------------|-----------|
| **Environment Variables** | Runtime (container rodando) | Configurações que mudam por ambiente |
| **Build Arguments** | Build time (criando a imagem) | Variáveis do Vite (`VITE_*`) |

**Para Vite apps, você SEMPRE precisa de Build Arguments!**

---

## ❓ Ainda com problemas?

1. **Verifique qual solução você está usando** (1, 2 ou 3)
2. **Confirme que fez um novo BUILD** (não apenas restart)
3. **Limpe o cache do navegador** (Ctrl + Shift + R)
4. **Abra o console** (F12) e veja se há outros erros
5. **Verifique os logs do build** no Easypanel para confirmar que as variáveis foram passadas
