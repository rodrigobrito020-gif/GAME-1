# PROMPT MESTRE PARA O CODEX — LINEAGE 2D IDLE

Você é o engenheiro principal de um MMORPG 2D idle multiplayer para navegador, chamado provisoriamente **Lineage 2D Idle**. Trabalhe **diretamente no repositório aberto** e **implemente uma primeira versão REALMENTE JOGÁVEL**, não apenas uma proposta, documentação, landing page ou mockup. Analise os arquivos existentes antes de criar ou modificar algo; não apague trabalho pré-existente. Se o repositório estiver vazio, crie a estrutura completa. Escreva código funcional, rode as verificações disponíveis, corrija erros e documente como executar no Windows.

## OBJETIVO DO PRIMEIRO MARCO

Entregar um vertical slice jogável de ponta a ponta, com:
1. Tela inicial, criação/carregamento de personagem e escolha de raça/classe inicial.
2. Uma cidade social navegável manualmente, em pixel art/chibi 2D com estética medieval fantástica e UI escura/dourada, inspirada na função social de Giran (sem copiar arte proprietária de Lineage 2).
3. NPC/portal/menu de seleção de hunts com doze faixas de nível, requisitos de entrada, especialização física/mágica até 150 e hunts mistas de 151 a 300.
4. Entrada em instância individual quando solo ou compartilhada com integrantes da Party (até 5), movimentação automática entre múltiplos pontos de respawn, seleção de alvos, ataques automáticos, cooldowns, MP/HP, loots, EXP e retorno à cidade.
5. HUD e painéis reais: HP/MP/EXP, alvo, barra das quatro skills, auto-farm, inventário/equipamento, personagem/atributos, party, registro de combate e drops, forja/crafting básico e configurações. Implementar UI de fato conectada ao estado do jogo.
6. Personagens e summons visíveis no mundo, animações simples/procedurais de movimento, ataques e habilidades (não sprites estáticos sem ação). Os summons seguem o mestre e sempre atacam o alvo inimigo dele.
7. Persistência de personagem, progressão e inventário; servidor responsável pelas regras, chances e recompensas.
8. Forma prática de TESTAR o conteúdo antes dos níveis altos: modo de desenvolvimento com personagens/dados de teste e troca de classe/nível, isolado e desativado em produção.

**Importante:** a maior parte do game design abaixo está APROVADA. Não substitua decisões aprovadas. Quando um número, monstro, receita, segunda profissão ou efeito não estiver definido, use um valor/identificador TEMPORÁRIO claramente sinalizado como exemplo, centralizado em configuração e fácil de substituir. Não apresente exemplos como decisões oficiais.

## TECNOLOGIA E ESTRUTURA

Preferência para repositório novo: **TypeScript + Phaser 3** no jogo 2D; **React + Vite** para menus/HUD; **Node.js + Express ou Fastify + Socket.IO** no servidor; **SQLite com Prisma** em desenvolvimento; npm workspaces com `/apps/client`, `/apps/server` e `/packages/shared`. Caso o repositório já possua uma stack compatível e funcional, mantenha-a e explique a escolha. Prepare a arquitetura para PostgreSQL no futuro, sem exigir implantação em nuvem agora.

Usar lógica de jogo em módulos data-driven com tipagem e responsabilidades claras: classes, raças, progressão, habilidades, armas, precisão, estatísticas, monstros, caça, spawn, combate, summons, party, inventário, drops, spoil, crafting, bosses, talentos, save e rede. Não colocar regras de negócio em componentes visuais. O servidor valida todas as ações para prevenir manipulação do cliente. Separar configs de balanceamento dos sistemas.

O projeto precisa iniciar no Windows com um fluxo documentado (`npm install`, migrar/popular banco, `npm run dev` ou equivalentes). Entregar README, arquivos `.env.example`, script de seed e testes básicos. Não depender de serviços externos pagos ou de arte com licença incompatível. Criar pixel art temporária ORIGINAL/procedural que funcione sem downloads adicionais. Deixar estrutura para trocar assets depois.

## IDENTIDADE E MUNDO

- MMORPG idle 2D para navegador, estética fantasy medieval / pixel art chibi, câmera acompanha personagem.
- **Uma única cidade principal social**, com movimento livre e NPCs (forja, loja, portal de hunts, party etc.). Cidade suporta vários jogadores em tempo real.
- Fora da cidade, caça por **instâncias**. Jogador solo sempre em instância privada; integrantes de uma Party entram na mesma instância. Instâncias de Parties diferentes não disputam monstros.
- Nas hunts, Auto Farm anda de um ponto de respawn a outro, procura inimigos, usa ataques/skills conforme regras e pega recompensas. Não deixar o personagem parado no mesmo spawn.
- Party até **cinco personagens**, sem restrição de classes repetidas. Cinco Warsmiths são permitidos.
- Cada spawn produz **um monstro por integrante** da instância; com cinco membros são cinco monstros por ponto, respeitando cada espécie configurada. Cada hunt tem vários pontos.
- Opção de seguir/assistir alvo do líder. Se um personagem muda de alvo, TODOS os summons dele mudam para esse mesmo alvo, nunca escolhem inimigos por conta própria.
- Summons não ocupam vagas de Party nem recebem parcela própria de EXP.

## PROGRESSÃO

- Raças: Humanos, Elfos Brancos, Elfos Negros, Orcs, Anões, com classes Fighter e Mystic somente nas raças em que existem no Interlude (Anões não têm Mystic).
- Classe inicial: níveis **1–49**.
- **Nível 50:** primeira profissão, mudança para quatro skills específicas da profissão/arma.
- **Nível 150:** segunda profissão, quatro skills específicas escolhidas futuramente pelo dono do projeto; **a árvore de talentos é desbloqueada SOMENTE aqui**.
- **Nível 300:** terceira profissão; o personagem continua com nível infinito, mas EXP recebida tem fator **0,5x a partir de 300**.
- Antes do nível 150: **NENHUMA passiva ou talento**. Passivas só existem na árvore de talentos a partir do 150. São sempre exatamente **quatro skills ativas** por personagem, contando invocação, Spoil e Sweeper quando presentes.
- O design e os nomes das skills exclusivas da segunda/terceira profissão serão informados pelo usuário; **NÃO inventar kits definitivos de nível 150+**. Usar bloqueios/placeholder explicitamente marcados se necessário para tornar a demo testável.
- Grades de equipamento, por nível mínimo: **No Grade 1, D 50, C 100, B 150, A 200, S 250. Grade S é a máxima**, inclusive no endgame.
- Raridades possíveis em todas as grades: Comum, Incomum, Raro, Épico, Lendário.
- Equipamentos visíveis no sprite quando trocados; iniciar com peças representativas, não tentar recriar centenas de assets de uma vez.

## ARMAS — FILTRO OBRIGATÓRIO POR PRIMEIRA PROFISSÃO (APROVADO)

FIGHTERS:
- Human Warrior: SOMENTE Dual Swords ou Lança/Polearm → Gladiator/Duelist ou Warlord/Dreadnought.
- Human Knight: SOMENTE Espada + Escudo → Paladin/Phoenix Knight ou Dark Avenger/Hell Knight.
- Rogue: SOMENTE Adaga ou Arco → Treasure Hunter/Adventurer ou Hawkeye/Sagittarius.
- Elven Knight: SOMENTE Espada + Escudo → Temple Knight/Eva's Templar ou Swordsinger/Sword Muse.
- Elven Scout: SOMENTE Adaga ou Arco → Plains Walker/Wind Rider ou Silver Ranger/Moonlight Sentinel.
- Palus Knight: SOMENTE Espada + Escudo ou Dual Swords → Shillien Knight/Shillien Templar ou Bladedancer/Spectral Dancer.
- Assassin (Dark Elf): SOMENTE Adaga ou Arco → Abyss Walker/Ghost Hunter ou Phantom Ranger/Ghost Sentinel.
- Orc Raider: SOMENTE Espadão de duas mãos → Destroyer/Titan.
- Orc Monk: SOMENTE Soqueira (Fist) → Tyrant/Grand Khavatari.
- Scavenger: SOMENTE Martelo/Maça ou Adaga → Bounty Hunter/Fortune Seeker.
- Artisan: SOMENTE Martelo/Maça ou Lança → Warsmith/Maestro.

MYSTICS:
- Human Wizard, Elven Wizard, Dark Wizard: **SOMENTE Cajado**.
- Cleric, Elven Oracle, Shillien Oracle, Orc Shaman: **SOMENTE Maça Mágica**.

Arma incompatível NÃO pode ser equipada. No nível 150, a arma deve respeitar a especialização da segunda profissão escolhida. Na primeira profissão, a troca entre as opções autorizadas deve trocar automaticamente o conjunto de quatro skills correspondente.

## QUATRO SKILLS INICIAIS — NÍVEL 1 A 49

Para todos os personagens, EXCETO Dwarf Fighter:
1. Ataque Reforçado — ataque acima do automático, tipo físico/mágico conforme arma.
2. Ataque em Área — dano contra vários monstros próximos ao alvo.
3. Proteção — redução temporária de dano.
4. Recuperação — recuperação pequena do próprio HP.

**EXCEÇÃO EXCLUSIVA DO DWARF FIGHTER, APROVADA:**
1. Ataque Reforçado.
2. Summon — até um summon inicial.
3. Spoil — marca um monstro.
4. Sweeper — recolhe recompensa adicional de Spoil válido após morte.

TODAS são ATIVAS, com cooldown e consumo de recursos configuráveis; nenhum botão extra gratuito para Spoil/Sweeper/Summon. Na classe inicial anã, os dois caminhos de profissão começam iguais. A diferenciação ocorre no nível 50.

## SKILLS DE PRIMEIRA PROFISSÃO — 25 KITS APROVADOS, NÍVEIS 50–149

Cada linha indica exatamente os QUATRO slots na ordem. Implementar dados e efeitos coerentes com a descrição. As habilidades de segunda profissão e talentos NÃO entram nestes kits.

### Humanos — 5 kits

1. Warrior / Dual Swords: **Corte Duplo** (dois golpes no alvo); **Lâminas Giratórias** (AoE próximo); **Aparar Lâminas** (redução temporária de dano físico); **Fôlego de Combate** (pequena recuperação de HP).
2. Warrior / Lança: **Estocada em Linha** (dano em linha, MULTIALVO); **Varredura de Lança** (AoE frontal); **Impacto de Haste** (golpe/controle AoE, interrupção para sobreviver cercado); **Vampirismo de Batalha** (efeito ATIVO temporário que recupera HP proporcional ao dano dos ataques AoE). Este kit é **100% focado em farm AoE**, sem cura fixa. Geometria e nomes da revisão são base de trabalho aprovada em espírito; números permanecem pendentes.
3. Human Knight / Espada+Escudo: **Corte de Guarda** (dano e ameaça/aggro); **Impacto Circular** (AoE com aggro); **Muralha de Escudo** (bloqueio e mitigação); **Vontade de Ferro** (pequena cura própria).
4. Rogue / Adaga: **Punhalada Precisa** (bônus pelas costas); **Corte em Leque** (AoE curto); **Passo Evasivo** (evasão temporária); **Fôlego do Assassino** (cura própria pequena).
5. Rogue / Arco: **Tiro Concentrado** (tiro preciso); **Disparo em Leque** (AoE de flechas); **Recuo Tático** (recuo e redução de dano); **Respiração do Caçador** (cura pequena).

### Elfos Brancos — 3 kits

6. Elven Knight / Espada+Escudo: **Corte da Aurora** (dano e aggro); **Varredura Élfica** (AoE circular); **Guarda de Eva** (defesa de escudo e evasão); **Brisa Revigorante** (regeneração breve de HP).
7. Elven Scout / Adaga: **Estocada Veloz** (dano rápido, bônus pelas costas); **Cortes Relâmpago** (AoE); **Passo Élfico** (evasão e velocidade); **Fôlego da Floresta** (cura pequena).
8. Elven Scout / Arco: **Flecha da Brisa** (tiro rápido/preciso); **Salva Élfica** (AoE); **Recuo Ágil** (recuo e evasão); **Respiração da Floresta** (cura pequena).

### Elfos Negros — 4 kits

9. Palus Knight / Espada+Escudo: **Golpe da Penumbra** (dano e aggro); **Espiral Sombria** (AoE e aggro); **Escudo de Shilen** (mitigação e reflexão limitada do dano sofrido); **Drenagem Vital** (ataque com roubo de HP).
10. Palus Knight / Dual Swords: **Corte Cruzado Sombrio** (duplo golpe); **Redemoinho de Lâminas** (AoE); **Guarda Cruel** (redução de dano e revide); **Golpe Sanguíneo** (ataque que rouba HP).
11. Assassin / Adaga: **Punhalada Negra** (bônus pelas costas); **Corte Sangrento** (AoE + sangramento); **Sombra Fugaz** (evasão e velocidade); **Punção Vital** (ataque que rouba HP).
12. Assassin / Arco: **Disparo Obscuro** (alto dano single-target); **Chuva de Espinhos** (AoE + sangramento); **Camuflagem Sombria** (evasão e mitigação); **Flecha Sanguessuga** (disparo com roubo de HP).

### Orcs Fighters — 2 kits, AMBOS 100% FARM AoE

13. Orc Raider / Espadão: **Corte Devastador** (arco frontal de múltiplos alvos); **Terremoto Orc** (AoE 360°); **Rugido de Guerra** (provoca AoE e reduz dano recebido); **Instinto de Sobrevivência** (efeito ativo de recuperação de HP ao atingir múltiplos monstros com AoE).
14. Orc Monk / Soqueira: **Punhos Relâmpago** (combo em cone multialvo); **Ciclone de Punhos** (AoE circular); **Contra-Ataque Orc** (postura de revide em área ao sofrer golpes); **Ritmo de Combate** (recupera HP com golpes sucessivos em múltiplos monstros).

### Anões — 4 kits DEFINITIVOS, Spoil/Summon OCUPAM SLOTS

15. Scavenger / Martelo-Maça: **Martelada Precisa** (alvo único/possível stun); **Impacto de Mineração** (AoE); **Spoil** (até 2 monstros); **Sweeper** (coleta ativa).
16. Scavenger / Adaga: **Punhalada do Caçador** (bônus pelas costas); **Cortes de Saque** (AoE); **Spoil** (até 2 monstros); **Sweeper** (coleta ativa).
17. Artisan / Martelo-Maça: **Martelo de Combate** (dano); **Impacto de Engrenagem** (AoE); **Blindagem de Combate** (protege personagem e invocações); **Summon** (uma skill de invocação com cooldown, até 2 summons).
18. Artisan / Lança: **Estocada de Haste** (dano em linha multialvo); **Varredura Mecânica** (AoE); **Formação Defensiva** (protege personagem e invocações); **Summon** (mesma skill, até 2 summons).

### Humanos Mystics — 2 kits

19. Human Wizard / Cajado: **Rajada Arcana** (dano mágico em um alvo); **Explosão Elemental** (AoE mágico); **Barreira Arcana** (absorção/mitigação); **Restauração Mística** (recupera HP e MP).
20. Cleric / Maça Mágica: **Luz Sagrada** (dano mágico de luz em um alvo); **Onda Consagrada** (AoE mágico moderado); **Bênção Protetora** (mitigação própria/aliado); **Cura Restauradora** (cura própria/aliado).

### Elfos Brancos Mystics — 2 kits

21. Elven Wizard / Cajado: **Lança de Gelo** (dano mágico e slow); **Tempestade Glacial** (AoE mágico e slow); **Barreira de Cristal** (escudo mágico); **Fonte de Eva** (recupera HP e MP).
22. Elven Oracle / Maça Mágica: **Raio de Eva** (dano mágico de luz); **Onda de Luz** (AoE mágico); **Proteção Élfica** (barreira para si/aliado); **Bênção Restauradora** (cura própria/aliado, prioriza menos HP no Auto Farm).

### Elfos Negros Mystics — 2 kits

23. Dark Wizard / Cajado: **Lança das Sombras** (dano mágico sombrio single-target); **Nuvem Venenosa** (AoE + poison); **Véu Obscuro** (mitigação temporária); **Toque Vampírico** (ataque mágico que rouba HP).
24. Shillien Oracle / Maça Mágica: **Raio Sombrio** (dano mágico single-target); **Névoa Debilitante** (AoE e redução de ataque dos inimigos); **Bênção Vampírica** (buff ativo temporário de vampirismo de dano físico para si/aliado); **Cura de Shilen** (cura própria/aliado).

### Orc Mystic — 1 kit

25. Orc Shaman / Maça Mágica: **Dreno Espiritual** (dano mágico com roubo de HP); **Maldição de Pa'agrio** (debuff AoE de ataque dos monstros); **Cântico de Batalha** (buff de ataque para Party inteira); **Cântico de Proteção** (buff de defesa para Party inteira).

Todos os 25 kits acima foram APROVADOS; não trocá-los por skills novas. Pode usar valores de balanceamento de teste explícitos em configuração, sem alegar que são finais. Os cooldowns de Spoil, Sweeper e Summon são obrigatórios.

## ESPECIALIZAÇÕES DO NÍVEL 150 — NÃO INVENTAR SKILLS

- Segunda profissão no nível 150, terceira no 300, talentos (únicas passivas) começam no 150.
- O USUÁRIO definirá os nomes e as habilidades exatas da segunda profissão e suas evoluções.
- EXCEÇÕES JÁ DEFINIDAS: Bounty Hunter passa a **Spoil Festival e Sweeper Festival** (ambas skills ativas e ocupam slots); Warsmith usa a skill **Summon** para manter até TRÊS summons ativos; Overlord terá 1 skill mágica de dano com roubo de HP + 3 debuffs EM ÁREA; Warcryer terá a MESMA skill mágica de dano com roubo de HP + 3 conjuntos de buffs aplicados DE UMA VEZ na Party inteira, abrangendo ataque, defesa, Attack Speed, Cast Speed, chance de crítico e dano crítico. O usuário escolherá nomes/valores dos pacotes e dos debuffs.
- Classes híbridas possíveis apenas entre ramos compatíveis com armas e conceito. Um híbrido, quando aprovado, verá 8 habilidades dos dois ramos parentais e escolherá 4 PERMANENTES; não poderá trocar depois. Bishop + Prophet é candidato, NÃO uma combinação aprovada. Gladiator + Warlord foi REJEITADO por incompatibilidade de armas. NÃO implementar automaticamente uma lista de híbridos não aprovada.

## SUMMONS E SPOIL — REGRAS QUE NÃO PODEM SER VIOLADAS

- Dwarf Fighter níveis 1–49: 1 summon e Spoil em 1 monstro; `Summon`, `Spoil` e `Sweeper` ocupam 3 dos 4 slots ativos.
- Primeira profissão nível 50+: Scavenger PERDE summon e passa a marcar até 2 monstros com Spoil, usando Sweeper; Artisan PERDE Spoil/Sweeper e pode manter até 2 summons, com a SKILL `Summon` no slot 4.
- Segunda profissão nível 150+: Bounty Hunter ganha Spoil Festival e Sweeper Festival em área; Warsmith pode manter até 3 summons pela skill `Summon`. Maestro mantém até 3. Scavenger/Bounty Hunter/Fortune Seeker não utilizam summon.
- Os 3 summons temáticos do Warsmith são **Siege Golem, Wild Hog Cannon e Swoop Cannon**, adaptados para luta NORMAL em hunts e Bosses, não só siege. Ordem exata de desbloqueio/estatísticas pendentes; use ID/config de placeholder.
- Uma ativação de Summon invoca uma unidade por vez (proposta técnica de cooldown); cada invocação consome recursos e a skill entra em cooldown, respeitando o limite simultâneo da profissão. Não criar skills extras ou botões fora da barra.
- TODOS os summons de todas as classes atacam SEMPRE o alvo do seu mestre. Mudou alvo do mestre → mudou alvo dos summons. Seguem o mestre fisicamente.
- 5 Warsmiths podem ter 15 summons e formar 20 unidades combatentes. Não restringir classes repetidas na Party ou limitar summons da Party artificialmente. Projetar para bom desempenho.
- Spoil e Sweeper são skills ATIVAS e têm cooldown. Spoil pode gerar recompensas adicionais diferentes do loot normal. Exemplo APROVADO: um monstro que dá normalmente 1–2 unidades de **Animal Bone** poderá dar 5–10 unidades via Spoil bem-sucedido; se os dois ocorrerem, total 6–12. Não transformar esse exemplo automaticamente em multiplicador global para todos os materiais. Usar tabelas específicas configuráveis.

## HUNTS — ORGANIZAÇÃO DA VERSÃO 1

Doze faixas EXATAS: `1–25, 26–50, 51–75, 76–100, 101–125, 126–150, 151–175, 176–200, 201–225, 226–250, 251–275, 276–300`.
- Até o nível 150, cada faixa tem **duas hunts SEPARADAS**: uma favorece DPS mágico, outra favorece DPS físico. Seis faixas * 2 = 12 hunts. As classes não são proibidas de entrar no tipo oposto; a eficiência muda segundo resistências físicas/mágicas.
- Da faixa 151–175 em diante, cada faixa tem **uma hunt MISTA com duas espécies distintas de monstros no mesmo mapa**: uma difícil para DPS físico e outra difícil para DPS mágico. Seis faixas * 1 = 6 hunts mistas.
- TOTAL: **18 instâncias/modelos de hunt** e **24 espécies comuns** (duas espécies em cada uma das 12 faixas). As espécies e mapas reais serão escolhidos mais tarde. Usar nomes de placeholder visíveis como `Monstro Físico 1–25` e `Monstro Mágico 1–25`, nunca inventar nomes oficiais.
- Entrada exige **nível mínimo E precisão mínima**; poder de combate é somente indicador/recomendação e nunca bloqueia. Diferenciar precisão física e mágica conforme o ataque. Valores mínimos de precisão definitivos estão pendentes; dados de teste são configuráveis.
- Auto Farm usa busca de alvos, movimentação entre respawns, skills por prioridade, potions e coleta; adicionar painel de métricas de EXP/h, loot/h (podem ser métricas locais de sessão).
- Primeval Isle é o ENDGAME da Fase 1. Existem marcos de Boss **225, 250, 275 e 300**, cada um com um boss, sendo **Sailren o FINAL no 300**. Pterosaur e Tyrannosaurus também são considerados BOSSES no nosso jogo, mesmo que a classificação original seja diferente. O quarto boss e a colocação exata dos outros três não foram definitivamente aprovados; usar placeholders. Não introduzir conteúdo de crônicas posteriores ao Interlude.
- Level 300 é último marco de conteúdo atual, mas personagem continua ganhando níveis para sempre.

## COMBATE, PARTY, EXP E LOOT

- Taxas BASE `1x` de EXP/SP/Adena/drops como filosofia de referência Interlude, mas as tabelas de drops do NOSSO jogo são adaptadas à progressão. Não alegar correspondência exata com datapack original sem fonte verificada.
- EXP de cada monstro é dividida igualmente pelos personagens da Party que participam da hunt; suporte/healer recebem parcela igual; summons NÃO ganham parcela.
- Só Party COMPLETA de 5 jogadores recebe **+20% de EXP TOTAL antes da divisão** e **+10% RELATIVO sobre chance de drop normal** (ex.: chance 1% → 1,1%); não aplica bônus de drop a Boss/Raid/Epic e não há bônus especial para 2–4 membros.
- O monstro faz UMA rolagem de loot normal, não uma por jogador. O líder escolhe distribuição: (a) integrante aleatório, (b) tudo para líder, (c) tudo para integrante escolhido. Não duplicar itens por ter mais summons.
- Bosses acima do nível 150 podem dropar peças de armadura B/A/S PRONTAS, além dos sistemas próprios de Boss; chances definitivas ficam em config.
- Combat system: ataque físico/mágico, DEF/MDEF, precisão/esquiva, crítico, aggro, debuffs, buffs, DoT/veneno, lifesteal, AoE, redução de dano, stun, heal, MP, cooldowns e efeitos temporários. Criar fórmulas testáveis e balanceamento centralizado, não números mágicos no UI.

## DROPS, ITENS, CRAFT E FORJA

- Hunts 1–25 e 26–50: DROP de equipamentos **No Grade PRONTOS**.
- Hunts 51–75 e 76–100: **Grade D PRONTA**.
- Hunts 101–125 e 126–150: **Grade C PRONTA**.
- Hunts 151–175 e 176–200: MATERIAIS de craft Grade B, não set pronto normalmente.
- Hunts 201–225 e 226–250: MATERIAIS de craft Grade A.
- Hunts 251–275 e 276–300: MATERIAIS de craft Grade S.
- Bosses 150+: podem dropar PEÇAS PRONTAS dos sets B/A/S conforme etapa.
- Crafting é **UNIVERSAL**: todo personagem pode fabricar; NÃO exigir Warsmith/Anão. Spoil é vantagem de materiais, NÃO monopólio.
- Equipamentos: usar inicialmente sets ICÔNICOS por grade e poucas armas principais por tipo, não todo inventário de todas as crônicas. Grade S é a máxima.
- Raridades: Comum / Incomum / Raro / Épico / Lendário em cada grade. Distribuição de reforja aprovada para atributo inteiro de `+1` a `+10`: `{1:14%, 2:14%, 3:13%, 4:12%, 5:11%, 6:10%, 7:10%, 8:8%, 9:6%, 10:2%}`. Percentuais de outros tipos de stats, número final de linhas e raridade do RESULTADO DE CRAFT ainda não foram confirmados: centralizar configurações e deixar pendentes.
- Planejar inventário, equipamento visível, crafting, reforja individual de atributos, encantamentos, reparo, desmonte, troca/mercado e receitas; implementar núcleo funcional primeiro e expandir sem menus falsos.

## VISUAL E EXPERIÊNCIA

- Jogo REAL, com canvas 2D, mapa tile/grid, colisão, movimento com WASD/clique na cidade, câmera acompanhando, sprites chibi pixel art com animação de caminhada, ataque, cast, hit e morte, partículas e feedback de dano.
- UI dark-fantasy medieval, molduras ouro discreto, inventário em grade com tooltips, barra 4 skills com cooldown desenhado, indicadores HP/MP/EXP/level, painel de alvo HP, minimapa opcional, painel de Party e chat da cidade.
- Distinção visual para Warrior, Knight, Rogue, Mystic, Orc e Dwarf. Texturas temporárias originais, sem extrair sprites oficiais de Lineage 2.
- Quando houver 20 unidades aliadas (5 Warsmiths + 15 summons), lógica e renderização devem continuar operantes; aplicar pooling e limitações visuais de partículas sem diminuir limites de combate aprovados.

## ORDEM DE IMPLEMENTAÇÃO, TESTES E ENTREGA

1. Faça inventário do repositório; crie plano técnico curto no README, depois implemente.
2. Inicialize workspace, projetos, dependências e scripts. Garanta `npm install` / `npm run dev` funcionais.
3. Crie tipos e configs compartilhados com TODOS os 25 kits, raças, classes, armas, grades, 12 faixas e 18 hunts; valide em testes. Dados pendentes marcados como `TODO_APROVACAO`, nunca passados por aprovados.
4. Implemente o loop vertical: criação de personagem, cidade navegável, NPC hunts, entrada em hunt, auto-farm caminhando por múltiplos spawns, combate com quatro skills e cooldowns, EXP/loot, inventário, saída e persistência.
5. Implemente troca de arma e kit da primeira profissão, requisito de precisão+nível, Dwarf Spoil/Sweeper, summons seguindo alvo, duas espécies nas hunts mistas, party e sincronização pelo servidor.
6. Implemente crafting básico, drops por grade, bônus Full Party, três modos de distribuição e teste as regras com Vitest.
7. Use placeholders de boss e skills 150+ onde os detalhes não foram aprovados, mas construa sistemas prontos para preenchimento.
8. Execute lint/typecheck/test/build, corrija tudo que falhar, registre pendências reais no README e forneça comandos para rodar.

**Testes obrigatórios de regras:**
- Ninguém entra em hunt sem nível OU precisão mínimos; poder não bloqueia.
- Solo e Parties diferentes não compartilham instância; Party 5 recebe respawns proporcionais.
- EXP do mob em party 5 = EXP_base * 1,20 / 5 por membro (antes de modificadores pessoais autorizados); chance 1% de drop normal passa a 1,1% relativo.
- Não aplicar buff de Full Party ao drop de Boss.
- Loot rola uma única vez por monstro e segue o método do líder.
- Arma incompatível não equipa; troca da arma autorizada troca kit correto.
- Cada personagem sempre tem apenas quatro slots ativos. Dwarf Fighter tem Ataque Reforçado/Summon/Spoil/Sweeper.
- Scavenger perde summon; Artisan perde Spoil; Scavenger marca até 2; Artisan tem 2 summons; Warsmith tem 3.
- Spoil tem tabela independente com exemplo Animal Bone normal 1–2 e spoil 5–10, sem duplicar roll por membro.
- Summons atacam SEMPRE o alvo do mestre, independentemente de quantos estejam ativos.
- Não proibir 5 Warsmiths na Party; talentos não funcionam antes do nível 150.
- As grades por nível, as 18 hunts e 24 espécies/slots estão corretas.

**Condição de conclusão:** NÃO termine ao criar a estrutura ou uma tela bonita. Entregue um jogo local executável com o loop básico funcionando e verificações rodadas. Se o escopo completo não couber em uma execução, conclua primeiro o vertical slice funcional, liste as etapas ainda não implementadas com honestidade e preserve a arquitetura para continuar no repositório. Não alegue que multiplayer, crafting, forja, Bosses ou sistemas de classe estão funcionando se forem apenas placeholders. Ao finalizar, mostre exatamente arquivos criados/alterados, comandos para executar e o que realmente está jogável.
