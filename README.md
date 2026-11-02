# Jogo local — 0.6.41: furacão do Orc por três segundos

Esta versão usa o cliente do seu `recursos-publicos.zip` com nosso servidor local. A cidade inicial agora é **Praça da Coroa**, um cenário próprio com palácio, comércio, armazém, fonte, jardins, muralhas e estandartes. A arquitetura usa pedra marfim, paredes brancas e telhados dourados.

A interface acompanha o padrão branco, marfim e dourado: painéis, HUD, chat, menus, loja, mochila, botões e confirmações. Texto escuro e cores de vida/mana preservam a leitura. As cores de raridade continuam identificando os itens.

## Atualização 0.6.41

Revisão da skill 2 após o vídeo enviado pelo jogador. O giro anterior foi reprovado: o pedido é um **furacão durante cerca de três segundos**.

- **Redemoinho Selvagem:** duração real de **3 segundos**, com cerca de dez voltas do corpo e das duas machadinhas. A apresentação segue a mesma fase de rotação do vento; não depende de reaplicar uma imagem nem fica parada entre atualizações da rede. O corpo gira em pé, na mesma escala fixa, sem a inclinação/deslocamento de reações cosméticas interromper o furacão.
- **Vórtice vermelho contínuo:** faixas de vento em hélice formam um volume afunilado dos pés até acima da cabeça. Geometria projetada com partes à frente e atrás do Orc, dois rastros de lâmina na altura das mãos, partículas ascendentes e poeira no chão. Acompanha a posição real durante a perseguição; entrada e dissipação curtas dentro dos três segundos.
- **Combate preservado:** perseguição, colisões e troca de alvo continuam. Mantidos alcance 300, raio 110, custo 12 MP, recarga 8s e cinco acertos de 50% ATK. Os acertos agora acontecem em 0,3 / 0,9 / 1,5 / 2,1 / 2,7s. Sons acompanham a nova duração. Não altera a duração com Fúria ou Grito de Guerra.
- **Escopo:** mesmas artes do Orc e das três classes anteriores; avanço, ultimates, barras, poções e progresso preservados. Galeria usa a nova cadência do giro.

**158 testes com o ZIP real**, incluindo duração, rotações, continuidade do vórtice, profundidade e acertos. Conferência adicional no Chromium/WebGL de perseguição, corpo, vento, Fúria, zoom e limpeza. A avaliação visual continua com o jogador.

**Windows:** feche o servidor antigo, extraia em outra pasta e copie `.local-runtime` da versão anterior. Mantenha `recursos-publicos.zip`, abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.41**.

## Atualização 0.6.40

- **Duas machadinhas:** uma em cada mão nas poses de repouso, caminhada, corrida, ataques, giro, reações e Fúria. Retrato, cartas e máscaras de Ki reconstruídos para as novas armas. Porte do Orc 30% maior e escala fixa mantidos.
- **Redemoinho Selvagem, tecla 2:** substitui a Ruptura da Terra, mantendo o identificador salvo `ruptura-da-terra`. O corpo gira por oito vistas e avança de verdade em direção ao inimigo durante 2,4s. Retoma outro alvo próximo se o primeiro morrer, respeita paredes e para antes do alvo. Cinco pulsos de 50% ATK atingem os ocupantes atuais em raio de 110 ao redor do Orc; alcance inicial 300, custo 12 MP e recarga 8s. Arcos vermelhos animados nas duas armas e sons durante as voltas.
- **Ultimate no personagem nas quatro classes:** barra na cor da classe imediatamente acima do HP sobre a cabeça. Acompanha a posição, o zoom e a visibilidade da placa nativa, com espaço para o nome. Usa carga real e mostra a fração de tempo restante durante a transformação. A barra do painel acima do HP foi mantida.
- **Fúria e primeira habilidade preservadas:** Avanço Selvagem continua no slot 1. Fúria mantém 60s ativos, recarga de 180s a partir do uso, ATK +30%, AS +50%, regeneração de 2% HP máximo/s e corrida até o alvo. Guerreiro continua como referência; arte e regras das três classes aprovadas preservadas.

**156 testes passaram com o ZIP real**, incluindo perseguição/colisão/acertos. Conferência no Chromium/WebGL nas quatro classes e combate real do Orc com o minuto completo de Fúria. A apresentação nova continua sujeita à avaliação do jogador. Nenhuma conta real foi usada nos testes.

**Windows:** feche o servidor antigo, extraia em outra pasta e copie `.local-runtime` da versão anterior. Mantenha `recursos-publicos.zip`, abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.40**.

## Atualização 0.6.39

O jogador aprovou a aparência do Orc na 0.6.38 e pediu avanço na primeira habilidade de todos os melees, além de um modo de fúria mais forte para o Berserker. O guerreiro continua sendo a referência aprovada.

- **Avanço Selvagem, tecla 1:** o antigo identificador `corte-selvagem` foi mantido para preservar escolhas salvas. Avança até um alvo entre 160 e 300 unidades, para a 66 e golpeia na chegada (220% ATK). Usa a mesma lógica do Avanço de Luz: percurso validado antes do custo, deslocamento real, rastro HD, respeito a paredes e cancelamento do dano se o alvo morrer ou escapar. O golpe é dirigido ao alvo; não mantém o antigo cone parado.
- **Padrão dos melees:** primeira habilidade de aproximação/avanço nas classes de combate corpo a corpo atuais e futuras. O guerreiro já segue o padrão e conserva seus valores, animação e efeito dourado; o Orc usa seu machado e rastro vermelho.
- **Fúria Ancestral:** 100 de energia, **1 minuto ativo** e **3 minutos de recarga contados a partir do uso**. Bônus iniciais: **ATK +30%**, **velocidade de ataque +50%**, **regeneração de 2% da vida máxima por segundo** e **corrida a 300 unidades/s para alcançar o alvo**. Mantém a redução de dano de 25% e os básicos em área da versão anterior. Grito de Guerra continua independente; seus +30% de velocidade de ataque podem coexistir com a fúria.
- **Corrida de verdade:** novas oito fases nas quatro direções, com inclinação do tronco e alternância de apoio e elevação dos joelhos, mesma escala fixa do Orc (30% maior) e machado completo. A caminhada, o repouso e os golpes aprovados são preservados. Ao terminar a fúria, a aproximação volta a 160 unidades/s e à caminhada habitual. A galeria inclui o botão Correr.
- **Regeneração real:** cura em pulsos de 1s pelo servidor, com frações acumuladas para respeitar os 2%, limite de vida máxima e sem armazenar cura quando cheio. Não revive, não continua ao sair/morrer e os bônus não se acumulam a cada atualização. Barra da ultimate continua acima do HP.

**154 testes com o ZIP real**, incluindo avanço nas oito direções, colisões, alcance/cancelamento, uso automático, regeneração, expiração, recarga persistente e retorno dos atributos. A conferência no Chromium/WebGL usa o avanço real e acompanha o minuto inteiro de fúria: corrida, cura, Ki ligado às novas poses e volta à caminhada. Guerreiro e classes a distância preservados; números dos bônus são valores iniciais para teste.

**Windows:** feche o servidor antigo, extraia em outra pasta e copie `.local-runtime` da versão anterior. Mantenha `recursos-publicos.zip`, abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.39**.

## Atualização 0.6.38

O guerreiro continua sendo a **base principal de todas as classes**, como reforçado pelo jogador após aprovar a 0.6.37. Esta versão acrescenta a quarta classe inicial e a mudança de posição da barra de ultimate solicitada durante a construção.

- **Berserker Orc:** pele verde, porte robusto e machado de duas mãos. É 30% mais alto que o guerreiro no mundo e na comparação de personagens, com escala uniforme fixa em todas as poses. Seis sequências completas, oito fases de caminhada, retrato, quatro cartas e Dash próprios. Proporções e âncoras seguem o contrato do guerreiro; a cadência de caminhada considera a passada maior do Orc.
- **Vermelho é a cor da classe:** cortes, impactos, ruptura, Dash, brilho do corpo e Ki da ultimate seguem a paleta vermelha. Realces claros são secundários; o level up também usa vermelho. A energia acompanha a silhueta, a superfície e a pose real do corpo, usando a mesma apresentação de Ki aprovada no guerreiro.
- **Habilidades:** Corte Selvagem (cone de machado de 140°, 220% ATK); Ruptura da Terra (salto e impacto em área na aterrissagem, 250% ATK); Grito de Guerra (+30% de velocidade de ataque por 30s); Fúria Ancestral (100 de energia, 45s de transformação, velocidade +50%, dano recebido -25% e básicos em área). Golpes anunciam a preparação antes do impacto; efeitos têm 16 quadros distintos e dissipação. Valores iniciais para teste.
- **Ultimate acima do HP nas quatro classes:** barra compacta integrada ao painel do personagem, na cor da classe, com carga/tempo de transformação e detalhes ao passar o mouse. Aparece também na cidade. A tecla 4, o ícone na barra de habilidades e as opções AUTO/MANUAL continuam funcionando; o medidor que ficava sobre as habilidades foi movido.
- **Troca de classe:** quatro cartas e galeria com o porte maior do Orc. Conserva nível, inventários, ouro, equipamentos e escolhas independentes de habilidades. Equipamentos completos continuam para depois das cinco classes iniciais.

**147 testes com o ZIP real**, mais conferência no Chromium/WebGL de caminhada, troca das quatro classes, posição da barra de ultimate, habilidades reais do Orc, escala fixa, Ki vermelho, Shift, sons e limpeza ao sair. Artes e regras aprovadas das outras três classes preservadas. A apresentação nova do Orc continua sujeita à avaliação do jogador.

**Windows:** feche o servidor antigo, extraia em outra pasta e copie `.local-runtime` da versão anterior. Mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads, abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.38**.

## Atualização 0.6.37

Revisão após os vídeos da arqueira e pistoleira: o problema apontado inclui **movimento do corpo e efeitos de habilidades**. O guerreiro é a referência aprovada.

- **Peso nos disparos:** arqueira prepara o arco, transfere o peso ao soltar e recupera a postura; pistoleira tem recuo curto em cada mão. Chuvas e ativações de buffs também têm movimento. Usa o tempo da própria ação, inclusive sob bônus de velocidade, com deslocamento/rotação pequenos e recuperação contínua. A escala permanece fixa em 0,5 × 0,5; modelos, rostos, caminhada e Dash são os mesmos da 0.6.36.
- **Impactos animados:** dois conjuntos originais de 16 quadros, com abertura, fragmentação e dissipação distintas. Usados nos acertos reais das habilidades ofensivas e nas chegadas das chuvas. Atualizar o estado de rede não reinicia o efeito; os quadros evoluem mantendo o mesmo tamanho de exibição.
- **Chuvas:** retirado o grande desenho fixo da área. Arcos segmentados e faíscas móveis indicam o chão; flechas/balas aceleram com rastros até os mesmos pontos e horários das três ondas. Explosões animadas aparecem nas posições dos projéteis.
- **Identidade:** cone de flechas com fios de energia em movimento; projétil incendiário e queimadura com filamentos e brasas móveis; ativação dos buffs com partículas ascendentes. Cores verde/dourado e violeta/dourado mantidas. Ki continua ligado ao quadro, posição e rotação reais do corpo.

Guerreiro, artes corporais das três classes, Ki, efeito de nível, sons, dano, cadência, custos, durações/recargas, automação, poções e progresso preservados. **139 testes passaram com o ZIP real**; testes adicionais no Chromium/WebGL verificam ações reais, quadros dos impactos, escala, aura, Shift e limpeza dos efeitos. A avaliação artística continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.37**.

## Atualização 0.6.36

- **Proporções da arqueira e pistoleira:** revisão das seis sequências — repouso, caminhada/corrida, disparos, chuva em área e reações/buffs. Poses neutras de repouso, preparação e recuperação reutilizam exatamente a mesma figura completa. Exibição com escala uniforme fixa e altura corporal de 112 unidades, sem herdar variações de escala do ajuste de pixels do cliente. Figuras inteiras, sem montar ou esticar partes do corpo.
- **Passadas no padrão do guerreiro:** oito fases laterais com passagem estreita entre os contatos; quatro fases verticais de apoio, amostradas nos oito quadros HD. Coroas e botas completas, alternância de apoio verificada nas duas direções. Disparos frontais/de costas e origem das balas ajustados às novas poses. Retratos e máscaras de energia acompanham a revisão.
- **Ki nas três ultimates:** mesmo movimento de energia do guerreiro na arqueira e pistoleira, ligado à silhueta real, superfície do corpo e armas. Filamentos sobem das bordas em camadas, mantendo verde/dourado na arqueira e violeta/dourado na pistoleira. Guerreiro aprovado preservado.
- **Level up com mais impacto:** anel texturizado de energia em rotação, selo rúnico e descargas no chão, espirais que passam à frente/atrás do corpo, feixes, partículas e setas ascendentes. Dourado no guerreiro, verde na arqueira e violeta na pistoleira, seguindo as referências enviadas. Dura 2,2s, usa o evento real de nível e o som nativo, sem pausar o combate. Não se repete ao reconectar.

Dano, cadência, duração/recarga das habilidades, automação, poções, equipamentos e progresso mantidos. **135 testes passaram com o ZIP real**, além da conferência no Chromium/WebGL. A avaliação artística continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.36**.

## Atualização 0.6.35

- **Avatar da Luz:** aura dourada vinculada à silhueta de cada pose do guerreiro. A luz percorre roupa, corpo e armas; filamentos de Ki sobem das bordas reais da figura e acompanham ataques, caminhada, Dash e rotação. A imagem fixa de fundo foi retirada. A espada e o escudo continuam iluminados. Inclui a aparência com peitoral de treino.
- **Subida de nível nas três classes:** animação original inspirada no Ragnarok, com selo nos pés, coluna de luz, traços radiais semelhantes a plumas, partículas e “LEVEL UP!”. Dura 2,2s e acompanha a posição do personagem. Usa somente eventos reais de nível, mantém o som nativo e reúne níveis ganhos juntos em uma única celebração. Reconectar não repete a animação.
- **Pistoleira parada:** repouso redesenhado a partir do modelo atual da caminhada, corrigindo a volta à figura antiga mais estreita. Frente, perfis e costas com altura e linha dos pés comuns; retrato e máscaras de energia atualizados. Caminhada, tiros e habilidades preservados.

As regras de combate, experiência, equipamentos, automação, poções, interface e progresso são mantidas. A aura da arqueira e a da pistoleira conservam seus efeitos; apenas as máscaras da nova pose parada da pistoleira foram atualizadas. **132 testes passaram com o ZIP real**, com conferência das auras e da subida real de nível nas três classes no Chromium/WebGL. A avaliação artística continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.35**.

## Atualização 0.6.34

- **Elfa de costas:** o exportador identifica a figura inteira antes de dividir a folha de poses, incluindo a cabeça que ultrapassava a antiga divisão entre linhas. A caminhada conserva o topo arredondado do cabelo e a linha dos pés.
- **Pistoleira:** caminhada redesenhada nas quatro direções com referência no modelo parado, mantendo corpo, rosto, roupa e armas coerentes ao virar. As máscaras da transformação acompanham as novas poses.
- **Dash das três classes:** um único rastro HD com até quatro silhuetas, espaçadas pelo deslocamento real. Cada silhueta desaparece em 175ms, independentemente da próxima animação; o efeito nativo duplicado foi removido apenas da esquiva comum.
- **Impactos distintos:** cortes dourados de espada no guerreiro, ponta de flecha e faíscas verdes na arqueira, clarão violeta da pistoleira. Cada desenho aparece no evento real de dano, com números e críticos preservados.
- **Passos suaves:** gravações de caminhada/corrida filtradas, com ataque e final suavizados; ganho próprio dos passos reduzido sem diminuir os sons de combate. Volume e silenciar continuam nos controles existentes.

Regras de dano, duração, recarga e automação preservadas. Contas reais não são usadas nos testes. **130 testes passaram com o ZIP real**, além das verificações de Dash, áudio, impactos e auras no Chromium/WebGL. A avaliação artística continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.34**.

## Atualização 0.6.33

**Arqueira e pistoleira:** a energia das ultimates agora usa a silhueta real de cada pose. Um brilho suave acompanha o contorno do corpo e das armas, faixas de luz se movem sobre a roupa e partículas nascem nas bordas dos braços, pernas e cabelo, passando à frente e atrás. As máscaras acompanham caminhada, disparos, esquiva e recuo; a região central do rosto recebe pouca luz para manter os traços legíveis. A apresentação da ultimate do guerreiro é preservada.

**Impactos das habilidades:** os acertos da arqueira recebem energia verde/dourada; os da pistoleira usam fogo/dourado no projétil com queimadura e violeta na Chuva de Balas. Os clarões aparecem no evento real de dano. Os números legíveis, críticos e efeitos básicos inspirados em Soulshot continuam presentes.

**Sons nas três classes:** gravações de espada, arco, disparos, esquiva, impactos, buffs e ultimates do próprio pacote passam a tocar nos instantes das ações. O áudio usa o controle de efeitos, o botão de silenciar e o limite de vozes já existentes. Quando não existe preferência de volume salva, os efeitos começam em 25%; escolhas anteriores são respeitadas. O navegador libera áudio após uma interação com o jogo, como clicar ou usar uma tecla.

Dano, cadência, alcance, duração e recarga das habilidades são mantidos. As artes e proporções aprovadas dos personagens são preservadas. Conferência nas três classes no cliente real e 126 testes automatizados sem falhas; a avaliação visual continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.33**.

## Atualização 0.6.32

A pistoleira recebeu uma apresentação mais marcante nos tiros, com inspiração no ritmo visual dos jogos de ação com duas pistolas:

- Clarão direcional branco/dourado com vapor violeta, rastros luminosos mais longos e pequenos cartuchos em arco. Recuo visual curto em cada disparo, com retorno suave; os pés e a posição do servidor permanecem fixos.
- O tamanho do rastro cresce com a distância percorrida pela bala, e a ponta acompanha a direção do tiro. O projétil com queimadura mantém a própria chama; Chuva de Balas e Eclipse continuam com seus efeitos.
- **Dano nos monstros mais legível:** números maiores, contorno escuro, posições alternadas e subida suave. Críticos maiores e dourados; queimadura em laranja. O número usa o dano efetivamente aplicado.
- **Impacto inspirado no Soulshot:** clarão curto com núcleo branco, faíscas azuladas e violeta no corpo do inimigo, sincronizado com o acerto real. Números e impactos também aparecem nos ataques do guerreiro e da arqueira. Ticks de queimadura usam sua própria apresentação, sem repetir o clarão de bala.

A revisão mantém dano, alcance, cadência, duração e recarga das habilidades. As artes e proporções aprovadas dos três personagens são preservadas. Conferência no cliente real e 124 testes automatizados sem falhas; a avaliação visual continua com o jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.32**.

## Atualização 0.6.31

As três mudanças combinadas para a pistoleira estão disponíveis para teste:

- **1 · Disparo Sombrio:** projétil com chama dourada e violeta, dano inicial de 220% do ataque e **queimadura de 20% do ataque por segundo durante 5 segundos**. Mantém a trajetória perfurante. O dano contínuo não causa críticos; uma nova aplicação renova a duração sem acumular queimaduras. São valores iniciais para teste. Custo de 8 MP e recarga de 5s mantidos.
- **2 · Chuva de Balas:** levanta as duas pistolas para disparar para o alto, seguida por três ondas de balas sobre a área marcada. Cada onda causa 110% do ataque; raio 125, custo 18 MP e recarga 10s. As ondas atingem em 0,7s, 1,2s e 1,7s. A área permanece se o alvo inicial morrer, e os inimigos são verificados novamente a cada onda.
- **4 · Eclipse:** transformação com energia de corpo inteiro e luz nas duas pistolas acompanhando a pose, usando a apresentação do guerreiro como referência. Substitui a órbita anterior e mantém o rosto legível. Duração 45s, recarga 60s, energia 100, velocidade de ataque +75% e redução de dano 15% mantidos.

Os ícones das duas primeiras habilidades e suas cartas acompanham as novas funções. AUTO/MANUAL e escolhas salvas continuam funcionando. As proporções, caminhada e disparos normais aprovados da pistoleira são preservados, assim como as artes e habilidades do guerreiro e da arqueira, as poções e o progresso. As próximas ultimates devem seguir o padrão de transformação do personagem, com identidade própria para cada classe.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.31**.

## Atualização 0.6.30

A pistoleira recebeu um novo modelo de corpo inteiro: rosto maior, tronco e quadril menos estreitos e pernas menos alongadas, usando a arqueira como referência de proporção. Os traços do rosto, cabelo preto ondulado, roupas iniciais e duas pistolas simples são mantidos no novo desenho.

- Repouso, oito fases de caminhada em cada direção, disparos alternados, buff, ferimento e derrota reconstruídos a partir do mesmo modelo. As figuras são exportadas inteiras, com altura e linha dos pés comuns às três classes.
- Pares de mira/disparo alinhados à mesma mão e origem dos projéteis recalibrada para as novas pistolas.
- Projéteis, clarões e impactos com núcleo violeta mais saturado e detalhes dourados. Tiros básicos e Disparo Sombrio maiores; impactos permanecem legíveis por mais tempo. Cada efeito é isolado inteiro antes da exportação, evitando pontas cortadas ou pedaços de um efeito no outro.
- Marca da Rajada e órbita do Eclipse com maior opacidade. O centro da aura continua aberto para permitir a leitura do personagem.

As artes aprovadas do guerreiro e da arqueira, valores das habilidades, regras de combate e poções são preservados. Conferência no cliente real e 119 testes automatizados sem falhas; a avaliação artística final cabe ao jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.30**.

## Atualização 0.6.29

A revisão dos dois vídeos corrige o corte da cabeça e refaz a apresentação das habilidades da pistoleira.

- **Caminhada vertical:** novas poses completas, oito de frente e oito de costas. O exportador encontra a figura inteira antes de separar os quadros; assim, a cabeça não é cortada quando ultrapassa uma divisão nominal da imagem de origem. A altura de corpo e a linha dos pés continuam no contrato das três classes.
- **Transição para os tiros:** em combate, parada e com alvo vivo, a pistoleira mantém a mira entre os pares de disparos. As sequências começam e terminam em prontidão, evitando baixar e levantar as pistolas a cada ataque. Caminhada e repouso na cidade mantêm suas poses próprias.
- **Disparo Sombrio:** carga na boca da pistola, projétil de energia e impacto direcional próprios.
- **Rajada do Crepúsculo:** marca de crescente no chão durante os seis disparos, com desaparecimento suave. O centro e o raio correspondem à área registrada pelo servidor.
- **Instinto Noturno:** brilho discreto na arma durante a mira. **Eclipse:** órbita violeta/dourada em camadas, com pontos de luz passando à frente e atrás do corpo, substituindo a moldura vertical anterior.
- Os tiros básicos acompanham a posição interpolada do alvo no cliente, mantendo os instantes de dano do servidor. Dano, alcances, custos, recargas, duração dos buffs e bônus permanecem iguais à 0.6.28.

O rosto, as roupas e as poses aprovadas de repouso/disparo continuam iguais. As duas classes anteriores, poções e progresso são preservados. A revisão visual continua aguardando avaliação do jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.29**.

## Atualização 0.6.28

Terceira classe inicial: **Pistoleira Dark Elf**, com o visual aprovado, cabelos pretos ondulados, roupas simples e duas pistolas de madeira/ferro. Possui figuras completas para repouso, caminhada, disparos, buff, ferimento e derrota nas quatro direções. Usa a mesma altura de corpo e linha dos pés das duas classes anteriores.

- **Ataque básico:** duas balas alternadas, com dano e chegada próprios. Somadas, causam o ataque normal antes dos críticos. O projétil sai do cano da pistola ativa.
- **1 · Disparo Sombrio:** tiro perfurante de 220% do ataque, alcance 420, 8 MP, recarga 5s.
- **2 · Rajada do Crepúsculo:** seis disparos em uma área de raio 125, cada impacto de 55% do ataque; 18 MP e recarga 10s. A área continua se o alvo inicial morrer.
- **3 · Instinto Noturno:** +25 pontos percentuais de chance de crítico por 5 minutos (5% → 30%). Críticos causam 150% do dano; recarga 120s e 10 MP. Não acumula bônus em reaplicações.
- **4 · Eclipse:** +75% de velocidade de ataque e redução de dano recebido de 15% por 45s. Requer 100 de energia e tem recarga 60s; o dano normal de cada bala é preservado.
- **Shift · Dash:** ícone e silhuetas HD em violeta. Cada habilidade permite AUTO/MANUAL, com a mesma carta ao passar o mouse. Buff e ultimate ficam visíveis separadamente sobre o personagem.

Na cidade, use **Trocar classe → Escolher Pistoleira Dark Elf**. As três classes guardam suas escolhas de habilidades; poções, equipamentos e progresso são mantidos. O comparador em `/personagens` agora mostra as três classes. Guerreiro e arqueira mantêm suas artes, movimentos, habilidades e valores aprovados. Esta é a primeira versão jogável da pistoleira, para revisão de animação e equilíbrio. Os equipamentos completos continuam para depois das cinco classes iniciais.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione Ctrl+F5 e confira **v0.6.28**. Para jogar basta Node.js; reconstrução opcional das artes da nova classe: `npm run art:gunslinger` com Python/Pillow.

## Atualização 0.6.27

A revisão visual substitui os contornos grossos e as setas geométricas da 0.6.26 pelas artes de flechas, folhas e energia verde/dourada da própria arqueira. O cone usa flechas com textura, sombra suave e partículas curtas; a Chuva de Flechas usa a mesma arte em três ondas, uma marca de folhas no chão e pequenos impactos com textura. A ativação dos buffs também usa folhas e luz. A ultimate ganha uma aura mais aberta: fluxos suaves de verde e dourado nas laterais, sem a moldura fechada anterior. O círculo dos pés volta aos valores aprovados na 0.6.25.

**Espírito da Floresta:** substituído o bônus de 35% de ataque por **50% de velocidade de ataque**. O intervalo entre disparos básicos passa de 1s para aproximadamente 0,667s durante a ultimate; cada flecha mantém o seu dano normal. A duração de 45s, a recarga de 60s, a energia e a redução de dano de 15% continuam iguais. Olhos da Floresta mantém seu bônus próprio de 20% de ataque. Alcance, áreas atingidas e recargas das demais habilidades são preservados, assim como a caminhada, o Dash de cada classe e a barra compacta de poções. O acabamento visual ainda depende da avaliação do jogador.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione Ctrl+F5 e confira **v0.6.27**.

## Atualização 0.6.26

Os efeitos da arqueira agora usam verde mais intenso, contorno verde-escuro e centro luminoso para continuar legíveis sobre o piso branco e dourado. As três flechas têm pontas e rastros mais definidos; a Chuva de Flechas ganhou hastes maiores, área de queda marcada e impactos com contorno. A ativação dos buffs fica visível por 0,9s e o círculo sob os pés está mais nítido. A aura corporal aprovada é mantida.

Esta revisão altera a apresentação visual. Dano, alcance, área atingida, velocidade dos projéteis, animações, recargas e duração dos buffs continuam iguais. As artes e habilidades do guerreiro e a barra compacta de poções são preservadas.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione Ctrl+F5 e confira **v0.6.26**.

## Atualização 0.6.25

- **Espírito da Floresta:** aura de energia verde envolvendo o corpo, com o mesmo formato de apresentação da transformação do guerreiro. O centro transparente mantém a arqueira legível; os indicadores dos buffs continuam separados.
- **Caminhada vertical:** novos desenhos de frente e costas, com alternância do pé de apoio e linha de chão comum. Corpo inteiro e escala constante entre as poses; caminhada lateral mantida.
- **Tiro Perfurante (1):** três flechas verdes simultâneas abrem um cone. Os inimigos nas trajetórias recebem 200% do ataque, uma única vez por uso mesmo na sobreposição. Mana, alcance e recarga mantidos; novo ícone representa as três flechas.
- **Dash universal (Shift):** ícone, carta e rastro seguem a cor da classe. Verde na arqueira, dourado no guerreiro. A criação das silhuetas usa o deslocamento real, incluindo movimentos curtos em telas com alta taxa de atualização. Distância, colisão e recarga permanecem os mesmos.
- **Poções:** um espaço de HP e um de mana, ao lado das habilidades, cada qual com botão AUTO/MANUAL. Abra o ícone para escolher pequena/média/grande, o limite de 30/50/70%, comprar na cidade ou usar manualmente. Z usa a poção de HP selecionada; X usa a de mana selecionada. Somente o tipo selecionado é consumido no AUTO. A seleção, o modo e o limite são salvos; níveis 1/55/150, estoque e recuperação compartilhada de 1,5s continuam valendo.

As artes e habilidades aprovadas do guerreiro são preservadas. A cor do Dash de cada classe passa a ser registrada em `class-visuals.mjs`, padrão para as classes seguintes.

**Windows:** feche o servidor antigo, extraia o ZIP em outra pasta, copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione Ctrl+F5 e confira **v0.6.25**.

## Atualização 0.6.24

A revisão dos vídeos da arqueira levou a ajustes próprios para o arco e suas habilidades, preservando a gameplay aprovada do guerreiro.

- Novas poses de disparo de frente/costas e sequência de preparação, corda tensionada, soltura e recuperação. A flecha sai no quadro de soltura e começa junto ao arco. Corrigida a orientação da textura: a ponta acompanha o sentido do disparo.
- **Chuva de Flechas:** animação própria apontando o arco para o alto; três ondas visuais chegam nos mesmos instantes dos impactos de dano, em 600, 1150 e 1700ms. O alvo morrer não cancela a área restante.
- **Tiro Perfurante:** preparação breve, projétil destacado e retorno ao próximo disparo. Mantidos os valores de dano, mana e recarga.
- **Olhos/Espírito da Floresta:** ativação com partículas, aura discreta e espírito atrás do personagem, mantendo o corpo visível e os dois indicadores independentes.
- A arqueira conserva a mira no alvo vivo ao alcance entre ataques. Uma ordem explícita com botão direito tem prioridade; alvo morto ou distante permite nova seleção.
- Ao ser pressionada de perto, faz um afastamento curto durante o intervalo entre tiros, com verificação de colisão e limite de frequência. Não interrompe a própria habilidade nem deixa de atirar por estar encurralada.
- Os tempos aprovados das habilidades e os dados da conta são mantidos. O guerreiro conserva sua arte, poses, animações, habilidades e regras de seleção de alvo.

**Windows:** feche o servidor antigo; extraia o novo ZIP em outra pasta; copie `.local-runtime` da versão anterior e mantenha `recursos-publicos.zip` junto do jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.24**. O comparador em `/personagens` mostra as novas poses da arqueira ao lado do guerreiro.

## Atualização 0.6.23

A gravação mostrou o personagem deslizando com as pernas quase sempre abertas. A revisão da caminhada inclui fases laterais de contato, apoio, passagem e elevação, com oito quadros de exibição e passada de 120 unidades. A cadência usa a distância percorrida pelo ator: parar ou esbarrar em um obstáculo não mantém o personagem caminhando no lugar.

- Parada com conclusão curta do apoio antes de voltar ao repouso; mudança de direção conserva a fase da passada.
- Mantidas as poses verticais existentes para conservar o desenho do corpo; a revisão das poses concentra-se nos perfis esquerdo e direito. Figuras completas, escala corporal comum e identidade das roupas/equipamentos preservadas.
- As referências nativas continuam com quatro quadros de compatibilidade. A camada de exibição usa os oito quadros e informa a pose correta aos rastros e às máscaras de energia da ultimate.
- Peitoral de treino preparado para cada pose visível, incluindo as fases intermediárias. Comparador `/personagens` e prévia `/guerreiro` acompanham a caminhada revisada.
- Combate, tempos das habilidades e dados da conta mantidos. A revisão de movimento fica disponível para teste do jogador.

**Windows:** feche o servidor antigo; extraia o ZIP; copie a pasta `.local-runtime` da versão anterior; mantenha `recursos-publicos.zip` junto ao jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione Ctrl+F5 e confira **v0.6.23** no topo.

## Atualização 0.6.22

O ajuste da 0.6.21 foi rejeitado na revisão visual: juntar peças de tronco e pernas continuava produzindo proporções incoerentes. Esta versão substitui essa montagem por **novas figuras completas**, desenhadas a partir de uma referência comum do Guerreiro Humano e da Arqueira Elfa.

- Mesma escala corporal nas duas classes: cabeça, tronco, quadril, pernas e botas seguem uma anatomia adulta estilizada consistente. Rosto, cores das roupas iniciais e armas simples mantêm a identidade dos personagens.
- Repouso, caminhada, espada, arco, salto/cravada, buffs, reações e morte têm novas poses de corpo inteiro. A construção atual não recorta nem estica partes das pernas.
- Folhas de exibição com quadros de **384px e corpo de 224px**, desenhadas a partir das fontes grandes. A escala de exibição mantém **112 unidades de altura corporal no mapa**. O restante do quadro é espaço para armas erguidas e saltos; a habilidade não encolhe o personagem para caber nesse espaço.
- Rastro do dash e luz das armas da ultimate acompanham a nova folha de alta resolução, com o mesmo ponto de apoio no chão. Mantidos os efeitos e tempos aprovados das habilidades.
- Retratos da seleção de classe usam a mesma altura e linha de chão. O peitoral de treino existente também acompanha as novas poses quando está realmente equipado.

**Comparação visual:** na seleção de classe, clique em **“Comparar animações dos personagens”**. Também é possível abrir http://127.0.0.1:5188/personagens . Os dois aparecem lado a lado em repouso, caminhada, ataque, área, buff e ultimate, nas quatro direções. A prévia não altera a conta. A prévia individual `/guerreiro` continua disponível.

Os testes verificam contratos e funcionamento; a nova arte fica disponível para a revisão visual do jogador. Inventário, armazém, classes, níveis, ouro, configurações e regras de combate são preservados. Equipamentos por peça continuam para depois das cinco classes iniciais.

**Windows:** feche o servidor antigo; extraia o novo ZIP; copie `.local-runtime` da pasta anterior e mantenha `recursos-publicos.zip` junto do jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.22** no topo. Somente Node.js é necessário para jogar. Para reconstruir as artes, opcionalmente use Python 3 com Pillow e `npm run art:characters`.

## Atualização 0.6.21

Corrigida a montagem das pernas do **Guerreiro Humano e da Arqueira Elfa**, inclusive na variante do guerreiro com peitoral equipado. A parte fixa da calça cobria as coxas e as partes móveis eram comprimidas sob o corpo. Agora o quadril, as coxas, os joelhos e as botas têm proporções completas, com encaixes contínuos. As bordas de couro usadas para separar as peças na arte-fonte não aparecem como cortes nos joelhos.

A postura parada de lado mantém as pernas estendidas. A caminhada alterna o apoio dos pés, com menor elevação e passada compatível com a cadência e o deslocamento no chão. Folhas nativas de 64px, HD de 128px, corrida reutilizada, retratos e prévia foram reconstruídos. Rostos, roupas, arco, espada e escudo mantêm suas artes; golpes, habilidades e tempos de combate permanecem os anteriores.

Atualize com o servidor fechado, copiando `.local-runtime` da pasta anterior e mantendo `recursos-publicos.zip` junto do jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, pressione **Ctrl+F5** e confira **v0.6.21** no topo. Nenhum item, ouro, nível ou configuração é reiniciado.

## Atualização 0.6.20

Na cidade, clique em **“Trocar classe”**, abaixo do painel do personagem, para escolher **Guerreiro Humano** ou **Arqueira Elfa**. Itens, peças equipadas, mochila, armazém, ouro e EXP são preservados. As escolhas AUTO/MANUAL de habilidades são lembradas separadamente por classe. Não é possível trocar durante a caçada.

A arqueira tem arte própria em 128px, caminhada articulada, arco, disparo com preparação e recuperação nas quatro direções e dano real à distância. Suas habilidades aprovadas são:

| Tecla | Habilidade | Funcionamento desta primeira versão |
| --- | --- | --- |
| 1 | Tiro Perfurante | Flecha atravessa inimigos alinhados, 200% do ataque; 8 MP, recarga 5s. |
| 2 | Chuva de Flechas | Área no alvo, três impactos de 70% do ataque em 1,7s; 15 MP, recarga 8s. Continua mesmo após a morte do primeiro alvo. |
| 3 | Olhos da Floresta | Ataque próprio +20% por 5min; 10 MP, recarga 120s; não acumula bônus. |
| 4 | Espírito da Floresta | Ultimate com 100 de energia, dura 45s e recarrega em 60s; ataque +35%, disparos a cada 700ms e dano recebido −15%. |
| Shift esquerdo | Dash | Mesma esquiva universal de 2,5s de recarga, com pose da arqueira. |

O combate básico e a perseguição continuam automáticos. Cada habilidade pode ser AUTO ou MANUAL. Flechas têm trajeto e tempo de viagem; não causam dano antes da chegada. A ultimate carrega com combate real e, se em AUTO, ativa com energia cheia e recarga concluída. **Os números novos da arqueira são balanceamento inicial para teste**, além dos nomes e do conjunto aprovados. Os tempos já aprovados do guerreiro permanecem.

**Todos os buffs ativos aparecem juntos**, lado a lado acima do personagem, cada um com sua própria duração e carta de descrição ao passar o mouse/focar/pressionar. Por exemplo: Égide + Avatar e Olhos + Espírito. Expirar um efeito não remove o outro. As recargas continuam na barra, sem duplicá-las na cabeça.

**Seis atalhos de poções**, no canto inferior direito: três HP e três mana. Clique no ícone para configurar Manual/Auto, limite de **30%, 50% ou 70%**, usar ou comprar na cidade.

| Poção de HP ou mana | Libera | Recupera | Preço unitário |
| --- | --- | --- | --- |
| Pequena | Nível 1 | 40% do recurso máximo | 10 ouro |
| Média | Nível 55 | 60% | 40 ouro |
| Grande | Nível 150 | 80% | 100 ouro |

A força da poção e o limite de ativação são independentes. No AUTO, o servidor consome estoque quando o recurso fica **igual ou abaixo do percentual escolhido**, somente em caçada e vivo. Se várias forças do mesmo recurso estiverem em AUTO, prioriza a maior habilitada que tenha estoque; HP tem prioridade sobre mana. Todas compartilham intervalo de uso de 1,5s. No MANUAL, o limite escolhido fica salvo para uso futuro no AUTO e o jogador escolhe o momento de consumir. Bloqueios de nível e estoque também são validados no servidor. As preferências das seis poções são salvas separadamente. As poções novas são compradas, sem concessão de estoque na migração.

**Equipamentos:** aguardaremos as cinco classes iniciais antes de adaptar os sets, como combinado. Guerreiro e Arqueira são as duas classes prontas desta etapa; as outras três ainda precisam de definição.

**Windows:** feche o servidor antigo; extraia o novo ZIP em outra pasta; copie `.local-runtime` da pasta anterior para preservar a conta e mantenha `recursos-publicos.zip` junto do jogo ou em Downloads. Abra `ABRIR_CLIENTE_COPIADO.bat`, use Ctrl+F5 e confira **v0.6.20** no topo. Endereço: http://127.0.0.1:5188/jogar?demo=1 .

As seções abaixo registram versões anteriores; regras modificadas na 0.6.20 são descritas acima.

## Atualização 0.6.19

- O combate básico e a movimentação na caçada são **automáticos**. A seleção global de modo manual foi removida; saves anteriores que estavam no manual retomam a caça automática, mantendo as escolhas de habilidades e todo o progresso.
- **Cada habilidade tem um botão AUTO/MANUAL acima do ícone.** AUTO permite que o servidor use a habilidade quando suas condições forem atendidas. MANUAL retira somente o uso automático: você continua usando por clique ou pelos atalhos 1–4. Mesmo com todas em MANUAL, o personagem continua andando e atacando com golpes básicos. As escolhas são salvas no servidor.
- **Dash na barra:** quinto ícone, com atalho **Shift esquerdo**, compartilhado por todas as classes por meio do catálogo universal. Começa em MANUAL; clicar no ícone e apertar Shift usam a mesma recarga de 2,5s. Se habilitar AUTO, o personagem tenta usá-lo para escapar de marcações inimigas iminentes, quando houver espaço livre. Não concede invulnerabilidade e não cancela golpes já em execução.
- **Indicadores sobre o personagem:** Égide e Avatar usam exatamente as novas ilustrações da barra. Passar o mouse, focar pelo teclado ou pressionar mostra a carta no mesmo padrão, com descrição, custo, recarga, duração, modo escolhido e tempo restante. Consultar o efeito não lança a habilidade. Acima da cabeça continua aparecendo somente a duração do efeito; recargas ficam na barra.
- Mantidos os tempos aprovados: Avatar 45s/60s e Égide 5min/120s; dash 2,5s. Clique direito mantém a prioridade do inimigo escolhido na caçada automática.

## Atualização 0.6.18

- **Shift esquerdo corrigido:** tentar o dash durante a recarga, durante outro golpe ou diante de uma parede é uma recusa normal de gameplay. Não fecha a conexão e não encerra a caçada. Pressionamentos repetidos também são filtrados no cliente; a validação final continua no servidor.
- **Botão direito no inimigo:** seleciona o alvo e dá a ordem de se aproximar e atacar. No modo manual, usa ataques básicos somente nesse inimigo, sem ativar habilidades ou procurar outro alvo quando ele morre. WASD/setas, outra ordem de movimento, dash bem-sucedido, troca de modo e limpeza do alvo interrompem a ordem. No automático, o inimigo clicado vira a prioridade da caçada.
- Clique esquerdo/F e todos os visuais, habilidades, tempos e progressão da 0.6.17 mantidos.

## Atualização 0.6.17

- **Personagem mais nítido:** folhas de 128×128 por quadro, reamostradas das artes grandes originais. Mantém o tamanho no mundo, as roupas aprovadas, armadura equipada e as poses. Não é uma ampliação do PNG de 64 pixels. A prévia `/guerreiro` também usa as imagens maiores.
- **Modo manual ou automático:** botão no canto inferior direito da caçada. A escolha fica salva e não altera as habilidades que o jogador habilitou para automação. No manual, não há perseguição, patrulha ou uso automático de habilidades. No automático, as regras anteriores continuam funcionando, incluindo a ultimate com carga cheia e recarga concluída.
- **Manual:** WASD/setas para mover, Tab para escolher alvo, clique no inimigo ou F para um ataque básico ao alcance; 1–4 usam as habilidades. Ande até o inimigo para atacar. Cada golpe tem impacto e recuperação reais, sem repetição instantânea por spam.
- **Shift esquerdo:** dash direcional, separado do Avanço de Luz. Usa a direção de movimento ou a direção para a qual o personagem está olhando. Percorre até 128 unidades em 240ms, com intervalo de 2,5s; paredes encurtam ou bloqueiam o trajeto. Funciona na cidade e na caçada. Não concede invulnerabilidade nem atravessa colisões.
- **Monstros maiores e com papéis distintos:** guardião com golpe em área, arqueiro que recua e dispara flechas, feiticeiro que marca uma área antes do impacto. Os ataques têm preparação e alvo fixado; sair da marcação pode evitar o dano. Matar o conjurador cancela seu ataque pendente. As artes de monstros ainda usam o sprite-base disponível, com tamanhos e tons por papel; modelos próprios continuam nas próximas etapas.
- **Quatro ícones ilustrados novos:** linguagem visual marfim, luz e dourado sobre fundo azul escuro. Passar o mouse ou focar o botão mostra uma carta com efeito, custo, duração, recarga e atalho. Pressionar por 350ms consulta a carta sem lançar a habilidade; clique curto usa normalmente.
- Mantidos **Avatar 45s/60s**, **Égide 5min/120s**, equipamentos, itens, progressão e dados salvos.

Reconstruir as folhas maiores: `npm run art:hd`, depois de reconstruir as folhas básicas caso tenha alterado suas fontes. O jogo utiliza somente os PNGs já prontos. O recorte das novas ilustrações fica em `tools/pack-skill-icons.py` (ferramenta opcional de arte que usa Pillow).

## Atualização 0.6.16

- Espada inicial de ferro simples e escudo de madeira, preservando o corpo, roupas, rosto, encaixes e poses aprovados. Nenhum equipamento ou atributo foi concedido ao save.
- Avatar da Luz: **45 segundos de duração e 60 segundos de recarga**, contados do início da ativação; exige também 100 de energia. Usa automaticamente na caçada quando tiver carga cheia, recarga concluída e um alvo vivo, respeitando o golpe em andamento.
- Saves antigos recebem a automação da ultimate uma única vez. As escolhas das outras habilidades são preservadas; alterações posteriores da automação também ficam salvas.
- Égide de Luz: **5 minutos de duração e 120 segundos de recarga**. Como a duração é maior que a recarga, não gasta mana reaplicando uma proteção ainda ativa: renova depois que ela termina, sem acumular bônus.
- Sobre a cabeça aparece somente a duração ativa (minutos:segundos quando necessário). A recarga continua na barra de habilidades.
- `npm run art:weapons` reconstrói as armas e a variante equipada. As máscaras de cada pose também são usadas pela energia visual da ultimate.

## Quarta habilidade — Avatar da Luz

**Avatar da Luz (4)** é uma transformação temporária. O guerreiro ergue a espada, recebe uma coroa de ativação e mantém uma aura dourada. A energia da espada e do escudo acompanha o quadro real da animação: rosto, roupa, equipamento e identidade do personagem não são substituídos. A ativação leva 600 ms; depois o guerreiro continua andando e usando as três habilidades anteriores durante a transformação.

Valores atuais:

- **100 de energia** para ativar, sem gasto de mana. Começa em zero. Um impacto acertado dá +4, um ataque recebido +2 e cada inimigo derrotado +6. Um golpe em área não multiplica os +4 por quantidade de alvos. Não carrega na cidade, parado, contra um inimigo já morto ou durante a própria transformação.
- **45 segundos** ativos: ataques básicos atingem também inimigos vivos a até 100 unidades do alvo principal, uma vez por inimigo no impacto. O dano do ataque primário mantém seu valor anterior. O guerreiro recebe **35% menos dano**, depois da defesa normal/Égide, com mínimo de 1. A ultimate não cura nem dá invulnerabilidade.
- Intervalo mínimo de **60 segundos** entre ativações, além de precisar carregar novamente os 100 pontos. Energia e prazo da recarga ficam no save; sair/reentrar ou reiniciar não libera outra ativação. A transformação em si termina ao sair da caçada, morrer ou desconectar; morrer também zera a energia.

Na caçada, a barra acima das habilidades mostra a carga. Ao ficar pronta, **pressione 4 ou clique no quarto ícone**. A ativação manual funciona junto do combate automático das outras habilidades. Se houver um golpe em andamento, o Avatar aguarda a recuperação desse golpe, sem cancelar sua animação. A ultimate é automática por padrão nesta atualização, inclusive em saves antigos, e preserva as escolhas anteriores das outras habilidades. Também pode ser acionada manualmente quando pronta.

Na versão 0.6.15 existia **um único círculo de duração** (substituído por indicadores simultâneos na 0.6.20): durante a transformação mostra o Avatar; ao terminar, volta à duração restante da Égide, caso ela ainda esteja ativa. A recarga fica na barra de habilidades e é restaurada corretamente ao recarregar o jogo. Aura e energia desaparecem na expiração, morte ou troca de cena.

Para examinar a habilidade isolada, abra **http://127.0.0.1:5188/guerreiro** e selecione **4 · Avatar da Luz**. A prévia não muda o inventário, a energia ou o save. `npm run art:avatar` reconstrói a aura, a ativação, o corte em área e o ícone a partir de `art/warrior/source/avatar-vfx.png`.

No Windows: feche o servidor antigo, extraia o novo ZIP, copie `.local-runtime` e `recursos-publicos.zip` da pasta anterior e abra `ABRIR_CLIENTE_COPIADO.bat`. Use Ctrl+F5 e confira **v0.6.15** no topo.

A implementação desta versão cobre o Guerreiro Humano. Os valores são provisórios para revisão jogando; as ultimates de outras classes ainda precisam de definição. A troca da espada e do escudo iniciais por modelos simples continua pendente: o jogador pediu para pausar essa alteração antes de aprovar a ultimate. Os sets do Lineage 2 continuam preservados como referência para adaptação 2D, conforme `LINEAGE_SETS.md`.

As seções abaixo registram versões anteriores.

> As seções de versões anteriores abaixo registram o histórico. Os tempos e indicadores vigentes são os da 0.6.16 descritos acima.

## Roupas redesenhadas nas próprias poses — 0.6.14

O visual da 0.6.13 foi rejeitado pelo jogador: as substituições de cor por máscaras deixaram blocos e contornos de armadura nas roupas. Esse processo foi retirado. As novas fontes em `art/warrior/source/novice/` trazem o personagem desenhado de camisa de linho, calça de tecido, cinto e botas de couro, com ombros e braços de roupa e sem capa ou saiote de armadura. Caminhada, golpes, salto, reações e repouso são empacotados dessas artes; não são pintados sobre as folhas antigas.

O corpo inicial continua sem armadura equipada. Equipar o peitoral existente modifica sua aparência e retirar restaura as roupas. Não há concessão de equipamentos nem reset de progresso. Cidade, mapas, inimigos, habilidades e seus tempos permanecem nas regras aprovadas. Acima da cabeça fica somente a duração da Égide; a recarga fica na barra.

No Windows, atualizar com o servidor fechado, copiar `.local-runtime` e `recursos-publicos.zip`, abrir `ABRIR_CLIENTE_COPIADO.bat`, usar Ctrl+F5 e conferir **v0.6.14**.

As seções abaixo são históricas. A técnica por máscaras descrita na 0.6.13 foi substituída nesta revisão.

## Roupas iniciais e um único indicador de duração — 0.6.13

- Sem peitoral equipado, o Guerreiro Humano usa camisa de linho, calça de tecido e botas simples, sem placas metálicas no corpo. As seis folhas de animação usam esse visual. Rosto, silhuetas, contato dos pés, espada, escudo e os movimentos aprovados continuam preservados.
- Equipar o peitoral de treino existente muda o tronco; retirar restaura as roupas simples. Não é preciso criar personagem novo. Saves que já têm o peitoral equipado continuam com a peça, sem perda de equipamento ou alteração de atributos.
- Acima do personagem aparece **somente DURAÇÃO**, em um círculo durante os 12 segundos da Égide. O círculo some ao terminar o buff. **A recarga permanece na barra nativa de habilidades**; não há segundo indicador nem contagem de recarga sobre a cabeça. Posição acima do nome e três escudos orbitais mantidos.
- Os sets do Lineage 2 preparados no GAME-1 continuam sendo a referência aprovada, do comum ao lendário. Seus catálogos, modelos e texturas são 3D; ainda não estão convertidos em todas as aparências desta base 2D. O peitoral de treino é a peça de teste existente, não um substituto desses sets. Ver [LINEAGE_SETS.md](LINEAGE_SETS.md) para as fontes e a correspondência de graus.
- `npm run art:clothes` reconstrói as roupas sem degradar as poses; `npm run art:armor` reconstrói a variante equipada. As referências anteriores ficam em `art/warrior/armored-reference` apenas para o empacotamento. A prévia `/guerreiro` identifica roupas iniciais e peitoral equipado.
- No Windows: fechar o servidor, extrair o ZIP novo, copiar `.local-runtime` e `recursos-publicos.zip` da pasta anterior e abrir `ABRIR_CLIENTE_COPIADO.bat`. Usar Ctrl+F5 e conferir **v0.6.13** no topo.

As seções abaixo são o histórico das versões; a regra atual dos indicadores é a descrita acima.

## Escudos legíveis, tempos acima do nome e primeiro peitoral visual — 0.6.12

- A Égide mantém **três escudos pintados orbitando na altura do corpo** durante a proteção. Eles acompanham caminhada, salto e ataque, passando pela frente e por trás do guerreiro. O tamanho mínimo na tela mantém a leitura mesmo com a câmera afastada. A órbita não depende do limite de efeitos decorativos do cliente. O aro no chão continua como complemento.
- **DURAÇÃO** e **RECARGA** aparecem em dois círculos acima de toda a identificação do personagem. Duração conta os 12 segundos do buff; recarga conta os 20 segundos até o próximo uso. O indicador antigo junto ao painel foi transferido para essa faixa. A posição considera o nome/barra já renderizados e é atualizada depois da câmera, para evitar a sobreposição durante deslocamento/zoom.
- O nível foi retirado da identificação acima do próprio jogador e do anúncio numérico flutuante de evolução. O nível no painel superior esquerdo, com foto e HP, continua atualizado. Níveis dos inimigos permanecem identificados.
- **Peitoral de treino:** novo desenho de aço azul, couro e prata, aplicado somente ao tronco. Equipar a peça muda a aparência no mapa, na mochila e na foto; retirar restaura o visual inicial. O mesmo conjunto de poses continua sendo usado. Rosto, braços, pernas, capa, espada, escudo e silhuetas originais são preservados. A capa continua cobrindo o peitoral nas costas.
- O visual deriva do item realmente equipado, sem conceder uma skin nem gravar uma aparência independente no save. A aparência retorna corretamente ao carregar o equipamento salvo. A peça conserva seus atributos existentes (+3 DEF e +25 HP); esta atualização não altera seus valores nem concede equipamentos.
- Esta primeira entrega cobre o único peitoral de armadura já existente na base local. Outras peças/modelos poderão ser acrescentados ao mesmo mapeamento quando seus itens e artes forem criados.
- Na prévia **/guerreiro**, a seleção de peitoral permite comparar o visual inicial com a peça de treino sem alterar o inventário da partida. O seletor é somente uma demonstração visual.
- O topo da tela identifica **v0.6.12**, facilitando conferir se a versão nova está aberta. O vídeo recebido mostra uma barra contendo apenas a primeira habilidade; a versão atual mantém as três habilidades disponíveis.

Defesa, custos e tempos da Égide, dash, cravada, loot, progressão e inventários mantêm as regras da versão anterior. Formação de equipes e múltiplas contas continuam pendentes nesta base local.

## Aura contínua e círculo de recarga — 0.6.11

A Égide agora mantém um **aro dourado com três pequenos escudos/luzes orbitando os pés**, em vez da cúpula discreta atrás do corpo. O efeito permanece em loop durante os 12 segundos de proteção, acompanha o deslocamento e se dissipa ao remover o buff. A borda em ouro escuro melhora a leitura sobre o piso claro do Pátio da Coroa. A ativação anterior foi preservada.

Acima do personagem aparece o ícone circular da Égide com um arco de progresso e a contagem da **recarga real de 20 segundos**. Ele acompanha o personagem, os movimentos da câmera e as mudanças de tamanho da janela. Não cobre o nome/barra de vida e não recebe cliques. Some quando a recarga termina, ao morrer/sair da tela ou ao trocar de cena; uma nova ativação reinicia a contagem. O relógio vem dos eventos de recarga do servidor.

O indicador de 12 segundos junto ao painel continua representando a **duração do buff**, e o círculo acima da cabeça representa a **recarga**. Portanto, a aura termina antes do círculo. A prévia também mantém a aura pelos 12 segundos reais. Defesa, custos, recarga, animações aprovadas, automação, progresso e inventários foram preservados. O adaptador local acrescenta apenas a comunicação dos indicadores de HUD; o ZIP capturado permanece intacto.

## Terceira habilidade — Égide de Luz (0.6.10)

**Égide de Luz (3)** é um buff de defesa. O guerreiro assume a postura de proteção, manifesta um escudo branco/dourado e recebe uma aura discreta. Um indicador junto ao painel do personagem mostra o tempo restante. As teclas 1 e 2 continuam sendo Avanço de Luz e Impacto de Luz.

- **Valores provisórios para avaliação:** DEF +30% sobre a defesa base dos equipamentos, arredondado para cima, com bônus mínimo de +2. Duração 12s, mana 10, recarga 20s. Não causa dano, não cura, não concede vida de escudo nem invulnerabilidade.
- Conjuração de 650ms; o bônus começa aos 300ms. O servidor aplica a defesa antes de calcular novos danos. Expiração, morte ou saída da instância removem o bônus e a aura. Sair/morrer antes da aplicação cancela o buff pendente. O bônus não se torna atributo permanente ao salvar/reabrir o jogo.
- O mesmo efeito não acumula. Outra aplicação pode renovar sua duração, mantendo um único bônus. A morte do conjurador não retira o buff de aliados vivos que já o receberam.
- A regra coletiva inclui o próprio guerreiro e **todos os jogadores e companheiros vivos do mesmo grupo e da mesma instância**, sem limite de distância dentro dela. Inimigos, desconhecidos, outros grupos e outras instâncias são excluídos. A lista de aliados vem do servidor; escolher um alvo pelo cliente não concede participação no grupo.
- **Limite desta versão local:** o jogo continua com uma única conta/um personagem local. Formação de grupos, contas multijogador, recrutamento de companheiros e a distribuição de estados entre jogadores ainda não existem. Portanto, na partida atual, o buff protege o guerreiro. A aplicação coletiva foi implementada no motor e validada com jogadores e companheiros em testes do servidor; não é um modo cooperativo já disponível na interface.
- O farm usa a proteção antes da aproximação quando há inimigos e o bônus está inativo. Depois, continua a combinação aprovada de dash e cravada, respeitando recargas e mana. Não desperdiça o buff com a arena vazia. Uma ordem automática vazia continua desativada; ordens anteriores ativas recebem a terceira habilidade uma única vez, preservando edições posteriores.
- Personagem, efeitos aprovados do dash/cravada, mapas, inventários, níveis e moedas foram preservados. A aplicação não concede itens.

A prévia em **http://127.0.0.1:5188/guerreiro** inclui o botão da terceira habilidade e as quatro direções. `client-defense-buff.mjs` encaminha apenas os eventos desse buff do próprio personagem para o indicador local; o cliente compatível continua renderizando as animações e a aura. O ZIP original de recursos permanece intacto.

## Duas habilidades no automático — 0.6.9

**Avanço de Luz (1)** e **Impacto de Luz (2)** agora funcionam juntos no farm. O guerreiro usa o dash contra um inimigo distante, respeita a recuperação e então salta/crava a espada em área quando está perto. Se uma habilidade estiver em recarga ou sem mana, os ataques básicos continuam normalmente. Não há nova regra de combo obrigatório: cada habilidade conserva seus requisitos, custo, recarga e animação aprovados.

Ao carregar um save anterior com habilidades automáticas ativadas, a ordem passa uma única vez para Avanço de Luz → Impacto de Luz. Uma ordem vazia continua desativada, e escolhas posteriores do jogador continuam salvas. Cidade, hunt, monstros, itens e progresso são preservados. Rascunhos das outras habilidades continuam bloqueados.

## Segunda habilidade — Impacto de Luz (0.6.8)

**Impacto de Luz (2)**: o guerreiro salta, segura a espada com as duas mãos e crava a lâmina no chão. O escudo acompanha o antebraço esquerdo. A onda de luz, fissuras e partículas dissipam no piso sem travar o corpo durante toda a duração do efeito.

- Preparação de 100ms, salto até 550ms, dano único na aterrissagem e recuperação até 950ms. A posição no chão permanece fixa; não há teleporte nem tremor de câmera.
- Área de 150 unidades ao redor da posição inicial do guerreiro. O servidor verifica os inimigos vivos dentro do círculo no instante do impacto, inclusive quem entrar/sair durante o salto. A morte do alvo inicial não cancela o impacto nos demais.
- Alcance de ativação 75, dano 2,5× ataque, custo 12 de mana e recarga 7s são **valores provisórios para avaliação**, ainda sujeitos à aprovação de balanceamento.
- Para avaliar a segunda habilidade, a ordem automática antiga passa uma única vez a conter somente Impacto de Luz. Uma ordem vazia continua desativada; alterações posteriores do jogador são preservadas. Avanço de Luz permanece no atalho 1 com seu comportamento aprovado. Rascunhos das habilidades 3/4 seguem bloqueados.
- Cidade, hunt, navegação, monstros, inventário e progresso são preservados. Nenhum item ou atributo é concedido. Morrer ou sair da hunt cancela dano pendente.
- Prévia quadro a quadro e nas quatro direções em **http://127.0.0.1:5188/guerreiro**. A folha técnica `axeheavy` é o nome compatível com o renderizador e contém exclusivamente nossas novas poses de espada com duas mãos.

## Rastro do personagem — 0.6.7

O Avanço de Luz deixa cópias translúcidas do próprio guerreiro nos pontos por onde ele passa, preservando a pose, direção, espada e escudo. As cópias têm tonalidade suave de luz, desaparecem em 320ms e ficam limitadas a cinco visíveis. Só são emitidas com deslocamento durante o dash; não permanecem como personagens no mapa.

O efeito comprido que parecia um projétil foi retirado da ativação. As faíscas de contato continuam na chegada. A prévia também usa poses anteriores ao longo do caminho para mostrar o rastro. Distância mínima de 160, alcance de 300, dano, mana, recarga e progresso foram preservados; somente o Avanço de Luz segue disponível.

Para tornar as silhuetas visíveis sobre o piso claro, `client-afterimages.mjs` adapta localmente o pequeno trecho de renderização dos rastros do cliente compatível. O ZIP de recursos permanece intacto. O adaptador é validado na inicialização e limita o novo comportamento ao Avanço de Luz; outros rastros conservam o funcionamento anterior. Não há mudança no cálculo do combate.

## Dash reservado para inimigos distantes — 0.6.6

O Avanço de Luz exige um alvo a **160–300 unidades**. Perto do inimigo, o guerreiro continua com ataques básicos e guarda o dash para outra aproximação. A tecla **1** também respeita o alcance mínimo e mostra um aviso de alvo próximo demais. A tentativa recusada não gasta mana nem inicia recarga, deslocamento ou efeito da habilidade.

O limite é validado pelo servidor, inclusive ao usar a referência antiga da primeira habilidade. A regra mede a distância entre as posições do personagem e do alvo no instante da ativação. Movimento, efeitos e parâmetros restantes do dash foram mantidos; só o Avanço de Luz continua ativo.

## Teste isolado da habilidade — 0.6.5

Somente **Avanço de Luz (1)** está disponível para uso manual e automático. Investida, Golpe Destruidor e Fúria foram retiradas do catálogo jogável e da prévia, e o servidor recusa tentativas de usá-las ou reativá-las pela automação. As definições anteriores ficam guardadas no código para o trabalho futuro.

Ao carregar um progresso antigo, a ordem automática é filtrada para a habilidade em revisão; uma ordem vazia continua desativada. Ataques básicos, movimentação, poções, inventário e progresso permanecem funcionando. O dash conserva seu comportamento, custo e recarga da 0.6.4.

## Primeira habilidade — Avanço de Luz (0.6.4)

A habilidade **1** agora é **Avanço de Luz**: avanço real em linha reta na direção do inimigo, rastro branco/dourado e golpe na chegada. Ela funciona na aproximação automática e pelo atalho **1**, com alvo válido na hunt. As outras três habilidades continuam como antes, aguardando definição individual.

- Alcance de ativação: 300 unidades. O deslocamento termina 52 unidades antes da posição inicial do alvo, sem atravessá-lo. Na versão atual, alvos próximos demais impedem a ativação.
- Preparação de 50ms, dash até 300ms e recuperação até 550ms. O dano acontece uma vez aos 300ms, somente se o alvo ainda estiver vivo e ao alcance de contato (75 unidades).
- Dano 2× ataque, oito de mana e recarga de quatro segundos preservam os valores da primeira habilidade anterior. São valores provisórios para testar esta habilidade.
- O servidor valida o corredor inteiro antes de consumir mana/recarga e verifica colisões durante o movimento. Caminho bloqueado recusa o dash; a caça automática continua pela navegação normal. Um obstáculo surgido durante o avanço interrompe o movimento e cancela o dano.
- Morte, saída da hunt ou perda do alvo cancelam o avanço pendente. Um alvo que se afaste da chegada não recebe dano remoto. O corpo não recebe um segundo deslocamento visual nem retorna à origem.
- A ordem automática salva é migrada de `corte-poderoso` para `avanco-de-luz`, mantendo a posição na ordem e os espaços desativados. Nenhum item, atributo, nível ou moeda é concedido/reiniciado.

## Atualização — 0.6.3

- Recortes do personagem limpos: resíduos semitransparentes e pedaços das poses vizinhas deixaram de aparecer como manchas na cidade. Arte revisada com rosto maior, olhos/contornos mais claros e amostragem pontual, preservando detalhes no quadro de 64px. Escudo esquerdo e espada direita mantidos.
- Golpes mais ágeis: básico/retorno 400 ms (impacto 150 ms); Corte 650 ms (250 ms); Investida 600 ms (250 ms); Destruidor 850 ms (400 ms); Fúria 600 ms (250 ms). Efeitos dissipam de forma independente, sem bloquear o corpo por toda sua duração. Tremores de câmera removidos dessas ações e salto do Destruidor reduzido.
- Doze monstros distribuídos por regiões do Pátio da Coroa. A altura considera a parte desenhada da imagem, deixando-os aproximadamente do tamanho do herói. As artes dos inimigos continuam provisórias.
- Reaparecimento escalonado entre 20 e 28 segundos em suas regiões, com uma nova identidade de rede a cada vida. Inimigos distantes conservam posição; os próximos reagem e retornam à região de origem ao se afastarem demais.
- Farm automático escolhe o inimigo vivo mais próximo entre as ações. O alvo de um golpe já iniciado é mantido até a recuperação; uma seleção manual continua valendo até o alvo morrer ou ser removida. Sem inimigos vivos, o herói patrulha o mapa.
- Travessias em piso livre usam uma linha direta com verificação de colisões, evitando virar a cada quadrado. O caminho pela grade continua disponível quando existe obstáculo.

Custos, danos, cura, recargas e progresso preservados. A maior agilidade altera a cadência prática do combate. A aparência continua fixa, sem conceder itens ou atributos.

## Atualização — 0.6.2

- Escudo de marfim, ouro e aço azul no braço esquerdo, acompanhando repouso, caminhada, espada, habilidades, ferimento e derrota. A espada continua na direita. O escudo faz parte da aparência inicial fixa; não concede item, defesa ou bloqueio novo.
- Nove efeitos pintados em PNG transparente substituem os desenhos geométricos das habilidades. Arco de lâmina, vento da investida, fissuras com detritos e aura recebem contraste azul-aço, brilho branco/dourado, partículas e dissipação gradual.
- Preparação e recuperação mais legíveis: Corte Poderoso 1,4 s (impacto 700 ms), Investida 1,3 s (750 ms), Golpe Destruidor 1,9 s (1100 ms) e Fúria 1,7 s (700 ms). Os efeitos principais duram entre 1,6 e 2,67 s, com antecipação antes do golpe. O dano continua aplicado uma única vez no impacto; não foi criado dano contínuo.
- Dano, cura, mana e recargas preservados. A sequência de ações fica naturalmente mais cadenciada pela preparação maior. A área do Golpe Destruidor considera os inimigos que estão dentro do círculo no instante do impacto.
- Prévia atualizada para usar as novas durações, camadas e dissipação. Praça da Coroa, Pátio da Coroa, inventários e reaparecimento dos monstros continuam preservados.

## Correções — 0.6.1

- Caminhada refeita com pernas articuladas, apoio alternado e eixo no quadril. O tronco mantém posição e escala; os lados usam a mesma sequência espelhada. A passada lateral considera o deslocamento no chão em escala 2.
- Ataques com novas poses, escala constante, preparação, corte e recuperação. O ataque básico alterna um golpe descendente com um golpe de retorno; ambos têm impacto aos 200 ms e recuperação total de 500 ms. As quatro habilidades mantêm seus valores de dano, mana e recarga.
- Nova arena própria **Pátio da Coroa**, com pedra marfim, detalhes dourados, muralhas e vegetação. As duas caçadas deixaram de usar o mapa capturado antigo. A prévia do mapa também está disponível no menu de caçadas.
- Reaparecimento dos monstros corrigido: cada nova vida tem um identificador diferente. Assim, a animação de morte/transparência anterior não se aplica ao inimigo que acabou de nascer. Retornam após três segundos, como antes, e aparecem maiores para facilitar a leitura.

Nível, ouro, EXP, equipamentos, mochila e armazém são preservados. A atualização não concede nem substitui itens.

## Guerreiro Humano

O jogador agora usa um personagem humano original: cabelo escuro, rosto visível, armadura marfim com detalhes dourados, capa curta e espada de aço. As folhas próprias incluem repouso, caminhada, espada, preparação de habilidade, reação a dano e derrota, com quatro direções. A corrida reutiliza os quadros de caminhada em cadência maior.

As quatro habilidades têm movimentos e efeitos próprios: corte crescente de aço e luz, rastro da investida, impacto do golpe destruidor e aura da fúria. Cada golpe reserva sua preparação e recuperação; o servidor aplica o dano no quadro de impacto (250, 250, 400 e 250 ms, respectivamente). O ataque básico usa 150 ms. Sair da hunt ou morrer cancela os golpes pendentes. Valores de dano, custo de mana e recarga foram preservados.

**Prévia interativa:** com o servidor aberto, acesse **http://127.0.0.1:5188/guerreiro**. É possível ver as quatro direções, pausar, avançar quadros e testar cada sequência. A prévia usa as mesmas folhas e sequências do jogo; o jogador também está integrado à cidade e às hunts.

A atualização troca apenas a aparência do jogador. Não concede equipamentos, não substitui itens e não reinicia nível, ouro, EXP, mochila ou armazém. NPCs e monstros conservam os visuais provisórios atuais. A espada e o escudo desenhados continuam no visual básico. A partir da 0.6.12, equipar o peitoral de treino também muda o tronco; as demais peças aguardam modelos próprios.

Fontes e contrato de animação estão em **art/warrior/README.md**, **manifest.json** e **warrior.mjs**. Servirão como base técnica para as próximas classes, que precisarão de suas próprias artes e ações.

## Correção da hunt — 0.5.1

Os monstros agora são desenhados no ponto correto do mapa. O pivô da imagem estava em pixels (`48`, `100`), mas o renderer utiliza valores proporcionais ao quadro (`0.5`, `100/112`). Isso deixava a imagem e a barra sobre o monstro fora da tela, embora o servidor calculasse os ataques e as recompensas. A correção preserva os dados salvos, as regras do farm e o visual medieval.

## Abrir no Windows

1. Encerre a versão anterior com **Ctrl+C** no terminal.
2. Extraia o novo ZIP em uma pasta nova.
3. Coloque **recursos-publicos.zip** junto de **ABRIR_CLIENTE_COPIADO.bat**, sem extrair o arquivo de recursos. Ele também pode ficar em Downloads.
4. Para manter o progresso da versão anterior, copie a pasta **.local-runtime** inteira para a nova pasta, com ambos os servidores fechados. Se não copiar, será criada outra conta local de teste.
5. Abra **ABRIR_CLIENTE_COPIADO.bat**. O navegador entra automaticamente na conta local em **http://127.0.0.1:5188/jogar?demo=1**. Deixe o terminal aberto.

Requer Node.js **22.12+ ou 24 LTS**. O iniciador instala a dependência `ws` na primeira execução. Login manual: **teste**, senha **Teste123!**. Nenhuma conta do site original é utilizada.

## Testar o farm

1. Na cidade, pressione **M** para abrir **Caçadas**.
2. Em **Pátio da Coroa — treino**, clique em **Iniciar**. O personagem procura e ataca monstros automaticamente. A segunda arena exige nível 5.
3. As quatro habilidades são usadas automaticamente por padrão. **1–4** também permitem acioná-las respeitando alvo, alcance, mana e recarga. **Z** usa uma poção de vida e **X**, de mana. Cada conta recebe dez pequenas de cada, uma única vez.
4. Observe a vida dos inimigos, os números de dano, EXP, ouro, contador de abates e drops. Os inimigos reaparecem entre 20 e 28 segundos depois de morrer, em suas regiões.
5. Clique em **Sair da caçada** no canto superior direito e confirme. **I** abre a mochila. Selecione uma espada ou peitoral de treino recebido e use a opção de equipar. Equipamentos só são trocados na cidade.
6. Feche e reabra o servidor: nível, EXP, ouro, itens, equipamentos, poções e ordem das habilidades permanecem salvos. A conta retorna à cidade; não existe ganho offline nesta versão.

Na cidade: **WASD/setas** para andar, **I** inventário, **M** caçadas e **Esc** fecha painéis. O cliente usa clique para selecionar/interagir, não para caminhar pelo chão. Na caçada, a movimentação é automática.

Ao morrer, o farm para e o personagem volta à cidade em três segundos, recuperado. Não há perda de EXP neste teste. Uma segunda janela autenticada encerra a conexão da primeira: existe **um único personagem local**, sem duplicar recompensas por abas abertas.

## Serviços da cidade

Perto do ponto onde o personagem aparece existem três NPCs com aparência provisória:

- **Mercador**, à esquerda: aproxime-se e pressione **E** para abrir a loja. Compre poções, confirme em **Adquirir** e veja o estoque e o ouro atualizarem. **Vender itens** abre a seleção de drops para venda.
- **Armazém**, à direita: aproxime-se e pressione **E**. Guarde itens da mochila e retire os itens do cofre usando as ações da interface. São cem espaços em cada inventário. Itens guardados continuam salvos ao reiniciar.
- **Guia de caçadas**, acima: abre a lista das arenas. **M** continua sendo o atalho.

O personagem começa perto dos três. Dê alguns passos na direção do NPC desejado antes de pressionar E, ou selecione o NPC com o mouse. O serviço só funciona dentro do alcance de 128 pixels e na cidade.

Na mochila, **Equipar melhores** mostra uma prévia das trocas antes de aplicar. Os critérios de ataque, defesa, vida e poder usam os atributos implementados no servidor local. A ordenação por poder, nível, raridade ou tipo também funciona. O botão direito trava/destrava um item; equipamentos travados não são vendidos. Vendas de parte de uma pilha descontam apenas a quantidade escolhida. Transferências para o armazém preservam o item e recusam o que não couber.

O nível sobre o personagem é atualizado ao evoluir, sem precisar sair da caçada. Os NPCs ainda usam a sombra provisória; o jogador já utiliza o Guerreiro Humano com animações próprias.

## Conteúdo e limites deste teste

- A cidade medieval é um mapa e arte próprios do projeto, com colisões correspondentes no cliente e no servidor. As duas caçadas utilizam o novo Pátio da Coroa, com arte e grade próprias, separado da praça segura. A praça medieval permanece segura, sem monstros.
- Não vieram os sprites completos de monstros nem as animações completas dos personagens. O jogador usa o Guerreiro Humano original desta versão. NPCs e inimigos ainda usam a sombra provisória disponível no pacote; suas novas artes ficam para outra etapa.
- As habilidades usam eventos reais de combate no cliente, com dano e cura calculados no servidor. Os efeitos das quatro habilidades do guerreiro foram criados localmente. Alguns outros efeitos gráficos e áudios não vieram no pacote e continuam indisponíveis.
- Itens implementados: fragmento empilhável, espada e peitoral de treino. Cada abate dá fragmento se houver espaço; a cada três abates da caçada, uma espada ou peitoral. Com mochila cheia, não entram itens novos; o jogo continua concedendo EXP e ouro. Retirar equipamento com a mochila cheia é recusado.
- Poções pequenas de vida/mana consomem estoque, recuperam 40% e têm intervalo de 1,5 segundo. O protocolo de compra funciona na cidade: dez ouros por poção, sem ouro ou itens gratuitos repetidos.
- Números de dano, monstros, drops, progressão, cura na cidade e preços são **regras provisórias para testar a base**, não o balanceamento do jogo original nem decisões finais aprovadas.
- Ainda não há criação de personagens, novas classes, todos os equipamentos originais, chefes, negociação entre jogadores, guildas, rankings, talentos ou multiplayer implementados. Os três serviços locais descritos acima estão funcionais. Os menus capturados desses sistemas podem existir, mas suas operações continuam recusadas. Consultas de avisos/listas recebem estados vazios, sem criar eventos ou recompensas.

## Executar e testar pelo terminal

Dentro da pasta extraída, no CMD:

```bat
npm ci --omit=dev --ignore-scripts
node server.mjs "C:\Users\Brito\Downloads\recursos-publicos.zip"
```

Abra **http://127.0.0.1:5188/jogar?demo=1**. Não use a porta 5173 do projeto anterior.

```bat
npm test
```

Se o ZIP não estiver nesta pasta ou em Downloads:

```bat
set "TEST_CAPTURE_ZIP=C:\caminho\recursos-publicos.zip"
npm test
```

São **39 testes automatizados**: protocolo, PNG, combate, habilidades, morte, progressão, itens, equipamentos, vendas, armazém, cidade e integração real WebSocket. Os novos testes verificam quadros distintos, transparência, ausência de corte das armas, alinhamento dos pés, efeitos locais e sincronização dos golpes. Também verificam apoio alternado dos pés, tronco estável, escala constante dos golpes e 50 ciclos consecutivos de reaparecimento (600 novas vidas). A integração também migra uma aparência antiga e verifica ouro, EXP, poções e item guardado após reiniciar o processo. Sem o ZIP, a integração é explicitamente pulada. O jogo e a prévia também são verificados no Chromium. Consulte **RESULTADO_TESTE.txt**.

Para reempacotar as fontes originais do guerreiro (não é necessário para jogar):

```bat
npm run art:warrior
npm run art:vfx
```

## Dados e isolamento

Conta e progresso: **.local-runtime/account.json**. Não apague essa pasta para conservar os dados. Senha armazenada com scrypt; tokens locais duram até oito horas no processo. Ao reiniciar o servidor, a entrada automática faz novo login.

Servidor somente em **127.0.0.1**. Não é uma instalação multiplayer/VPS pronta. Nenhuma conexão, proxy, conta ou sessão do servidor original é utilizada. O servidor adapta o rastro do Avanço de Luz no script entregue ao navegador, mantendo o ZIP de recursos intacto. Uma folha de estilo própria aplica o tema branco e dourado. O servidor fornece a cidade com `art/medieval-ivory-gold.png` e a arena com `art/royal-hunt.png`, cada uma com sua grade de colisão. Os demais recursos continuam sendo lidos do ZIP local.

O GitHub contém código próprio e adaptadores, com as artes próprias da cidade, da arena e do guerreiro e sem redistribuir o pacote capturado. Os outros jogos e branches foram preservados.

Diagnóstico: **http://127.0.0.1:5188/diagnostico**.
