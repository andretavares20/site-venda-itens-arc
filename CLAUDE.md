@AGENTS.md

# Regras de Git — obrigatórias

Após qualquer modificação de código:

1. **Antes de qualquer push, sempre dê `git pull origin main` para sincronizar com a main.**
2. **Se a modificação pertence ao contexto da branch atual**: commite e faça push para a branch atual.
3. **Se a modificação está fora do contexto da branch atual**: crie uma nova branch com nome descritivo (`feat/`, `fix/`, etc.), commite e faça push para essa nova branch.
4. **Nunca faça push direto para `main`**, em nenhuma circunstância.
