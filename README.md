# Expresso FR V17 — Vite corrigido

## Executar localmente
```powershell
npm install
npm run dev
```
Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Build de produção
```powershell
npm run build
npm run preview
```

## Correções V17
- `vite.config.js` corrigido para ESM (sem `__dirname` inválido).
- `script.js` agora é carregado como módulo e entra corretamente no build do Vite.
- loader com fallback para nunca prender a página em branco.
- `base: './'` para caminhos de build mais robustos.
- parceiros e demais alterações da V16 preservados.
