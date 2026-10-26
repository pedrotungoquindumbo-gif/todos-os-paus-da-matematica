# Plano de Execução: Carrossel Horizontal "Mensagens de membros"

## Estado das Tarefas
- [x] Adaptar a secção de testemunhos ao layout exato da imagem de referência enviada pelo cliente (`image_96e9a1a8.png`):
  - Título em destaque no topo: **Mensagens de membros** com subtítulo explicativo.
  - Carrossel horizontal de smartphones com proporção de ecrã vertical, cantos arredondados (`border-radius: 22px`) e borda sutil sobre fundo escuro.
  - Exibição de todos os 5 prints reais do WhatsApp (Rafael, Manuel, Edmilson, Mário e Bruno).
  - Barra de controlo horizontal inferior idêntica à referência: botão de seta esquerda `◀`, calha de scrollbar personalizada com barra de progresso / indicador de arrasto ativo, e botão de seta direita `▶`.
  - Suporte completo a navegação por toque (touch swipe no telemóvel), clique nas setas, arraste com o rato no desktop e clique na barra de progresso.
- [x] Integração com Lightbox Modal:
  - Ao clicar em qualquer telemóvel, abre a visualização em ecrã inteiro com zoom e texto do depoimento.
- [x] Manutenção das fotografias e do atendimento oficial sem interferências de cliques.
- [x] Sincronização em `index.html`, `public/index.html` e `public/site.html`.
- [x] Compilação (`compile_applet`) e reinício do servidor concluídos com sucesso.
