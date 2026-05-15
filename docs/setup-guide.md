# Guia de Setup - Midsea desde Cero

## Paso 1: Crear el Directorio y Repo
```bash
mkdir midsea
cd midsea
git init
```

## Paso 2: Copiar tu Documento MD
Copia tu archivo .md principal (el de especificaciones) como PRD.md en la raiz.

## Paso 3: Instalar Dependencias Base (segun tu PRD)
Si tu PRD especifica Next.js + TypeScript:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

## Paso 4: Configurar Claude Code
```bash
claude
```
Dentro de Claude Code, tu primer prompt debe ser:
> "Lee PRD.md y configura el proyecto inicial segun ese documento. Este es Midsea - rebrand de EduNexo. Ninguna referencia a EduNexo debe existir."

## Flujo de Trabajo Recomendado
1. Nunca empieces a codear sin contexto. Siempre pide a Claude que lea PRD.md primero.
2. Feature por feature: auth -> dashboard -> tutoring -> gamification.
3. Revisa i18n: Despues de cada feature, verifica que los textos usen t('key').
4. Revisa el nombre: Corre `grep -ri "edunexo" .` antes de cada commit.
5. Commits atomicos: Un feature = un commit con mensaje claro.

## Checklist antes del primer commit real
- [ ] PRD.md esta en la raiz y actualizado
- [ ] CLAUDE.md esta en la raiz
- [ ] .gitignore ignora .env* y node_modules
- [ ] No hay referencias a "EduNexo" ni "edunexo"
- [ ] El stack base esta instalado y corre (npm run dev funciona)
