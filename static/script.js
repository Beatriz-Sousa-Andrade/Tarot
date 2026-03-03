// script.js - Versão Melhorada com Busca Aprimorada e Correções

const API_BASE_URL = window.location.origin;

// Estado da aplicação
let currentSpread = null;
let isLoading = false;
let abortController = null; // Para cancelar requisições anteriores

// Elementos DOM
const loadingEl = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

// Objeto com traduções
const translations = {
    positions: {
        upright: '✨ Reta',
        reversed: '🌙 Invertida'
    },
    meanings: {
        advice: '✨ Conselho',
        context: '🌟 Contexto',
        summary: '🔮 Resumo da Leitura',
        interpretation: '📜 Interpretação da Tirada',
        yourQuestion: '💭 Sua Pergunta',
        searchResults: '📚 Resultados da Busca',
        description: '📖 Descrição',
        upright: '✨ Sentido Reto',
        reversed: '🌙 Sentido Invertido',
        back: '← Voltar',
        search: '🔍 Buscar',
        clear: '✕ Limpar'
    },
    messages: {
        loading: '🔮 Conectando com o místico...',
        noCards: '😔 Nenhuma carta encontrada',
        searchPlaceholder: 'Ex: amor, trabalho, mudança, dinheiro...',
        questionPlaceholder: 'Faça uma pergunta ao tarot...',
        typeQuestion: '📝 Por favor, digite sua pergunta',
        searchPrompt: '🔍 Digite um termo para buscar significados',
        noResults: '😕 Nenhuma carta encontrada para este termo',
        apiError: '🌋 Erro ao conectar com o tarot. Tente novamente.',
        searching: '🔮 Buscando cartas...',
        tryAgain: '🔄 Tentar novamente'
    },
    dailyMessages: {
        // Mensagens para cartas específicas (Arc Maiores)
        'The Fool': 'Hoje é dia de dar um salto de fé! O Louco te convida a embarcar em uma nova aventura com coração aberto.',
        'The Magician': 'Seu poder de manifestação está no auge! Use suas habilidades para criar a realidade que deseja.',
        'The High Priestess': 'Confie na sua intuição. Os mistérios do universo estão se revelando para você hoje.',
        'The Empress': 'A energia da abundância te cerca. Cultive amor, criatividade e conexão com a natureza.',
        'The Emperor': 'Estrutura e autoridade são necessárias hoje. Organize-se e lidere com sabedoria.',
        'The Hierophant': 'Busque conhecimento e tradição. Um mentor ou ensinamento importante pode aparecer.',
        'The Lovers': 'Escolhas do coração estão em foco. Siga seu verdadeiro desejo, não apenas a razão.',
        'The Chariot': 'Determinação e controle te levarão à vitória. Mantenha o foco no seu objetivo.',
        'Strength': 'A verdadeira força vem da compaixão. Enfrente desafios com gentileza e coragem.',
        'The Hermit': 'Momento de introspecção. A solidão hoje traz sabedoria e autoconhecimento.',
        'Wheel of Fortune': 'Mudanças estão a caminho! A roda da fortuna gira e traz novas oportunidades.',
        'Justice': 'Equilíbrio e verdade prevalecem. Suas ações de hoje terão consequências justas.',
        'The Hanged Man': 'Olhe de outra perspectiva. A rendição pode trazer a resposta que você busca.',
        'Death': 'Transformação profunda. Algo precisa morrer para que o novo possa nascer.',
        'Temperance': 'Equilíbrio é a chave. Encontre o meio-termo e integre opostos em harmonia.',
        'The Devil': 'Liberte-se das amarras. Identifique o que te prende e busque sua liberdade.',
        'The Tower': 'Mudança repentina. O que parece caótico hoje é na verdade uma libertação necessária.',
        'The Star': 'Esperança e inspiração. O universo te envia sinais de que dias melhores virão.',
        'The Moon': 'Navegue pelas ilusões. Sua intuição é mais confiável que a lógica hoje.',
        'The Sun': 'Alegria e sucesso! Um dia radiante te espera, cheio de otimismo e realizações.',
        'Judgement': 'Chamado interior. É hora de ouvir sua alma e se libertar do passado.',
        'The World': 'Ciclo completo! Celebre suas conquistas e prepare-se para um novo começo.',
        
        // Mensagens para naipes (Arc Menores)
        'Ace of Wands': 'Nova energia criativa surge! Um projeto ou paixão está pronto para começar.',
        'Two of Wands': 'Planeje seu próximo passo. O mundo está diante de você, escolha com sabedoria.',
        'Three of Wands': 'Seus esforços começam a dar frutos. A expansão está a caminho.',
        'Four of Wands': 'Celebração e harmonia no lar. Momento de comemorar conquistas.',
        'Five of Wands': 'Conflitos e competição. Busque o meio-termo nas discussões de hoje.',
        'Six of Wands': 'Vitória e reconhecimento! Seu talento será notado e aplaudido.',
        'Seven of Wands': 'Defenda suas ideias. Desafios aparecem, mas você tem força para vencê-los.',
        'Eight of Wands': 'Ação rápida e progresso. Notícias chegam e tudo se acelera.',
        'Nine of Wands': 'Resiliência é a chave. Você está quase lá, não desista agora.',
        'Ten of Wands': 'Sobrecarga de responsabilidades. Peça ajuda e delegue tarefas.',
        'Page of Wands': 'Notícias empolgantes chegam. Uma nova oportunidade criativa aparece.',
        'Knight of Wands': 'Ação e aventura! Siga seus impulsos com paixão e entusiasmo.',
        'Queen of Wands': 'Confiança e calor humano. Sua autenticidade atrai boas energias.',
        'King of Wands': 'Liderança visionária. Use sua influência para inspirar outros.',
        
        'Ace of Cups': 'Novo amor ou emoção profunda. Seu coração se abre para receber.',
        'Two of Cups': 'Conexão especial. Um encontro significativo ou parceria amorosa.',
        'Three of Cups': 'Amizade e celebração. Momento de confraternizar com pessoas queridas.',
        'Four of Cups': 'Insatisfação ou apatia. Olhe ao redor, talvez você esteja ignorando bênçãos.',
        'Five of Cups': 'Foco na perda. Não se esqueça do que ainda permanece com você.',
        'Six of Cups': 'Nostalgia e memórias. O passado traz conforto ou lições importantes.',
        'Seven of Cups': 'Muitas escolhas e ilusões. Cuidado com fantasias, busque clareza.',
        'Eight of Cups': 'Deixar para trás. É hora de seguir em frente emocionalmente.',
        'Nine of Cups': 'Realização de desejos! Seu pedido será atendido em breve.',
        'Ten of Cups': 'Felicidade familiar e plenitude. Harmonia completa no amor.',
        'Page of Cups': 'Mensagem de amor ou criatividade. Um convite romântico ou artístico.',
        'Knight of Cups': 'Romance e idealismo. Alguém pode fazer uma declaração de sentimentos.',
        'Queen of Cups': 'Intuição e compaixão. Ouça sua voz interior com carinho.',
        'King of Cups': 'Equilíbrio emocional e maturidade. Controle suas emoções com sabedoria.',
        
        'Ace of Swords': 'Clareza mental! Uma ideia brilhante ou verdade importante se revela.',
        'Two of Swords': 'Indecisão. Você precisa fazer uma escolha, mesmo sendo difícil.',
        'Three of Swords': 'Dor e sofrimento. Permita-se sentir, a cura virá depois.',
        'Four of Swords': 'Descanso necessário. Faça uma pausa para recuperar energias.',
        'Five of Swords': 'Conflito e derrota. Escolha suas batalhas, nem todas valem a pena.',
        'Six of Swords': 'Transição tranquila. Deixando dificuldades para trás, rumo à paz.',
        'Seven of Swords': 'Estratégia e discrição. Às vezes é melhor não revelar todos os planos.',
        'Eight of Swords': 'Sentindo-se preso. As amarras são mais mentais que reais.',
        'Nine of Swords': 'Ansiedade e preocupação. A mente cria monstros, busque tranquilidade.',
        'Ten of Swords': 'Fim de um ciclo difícil. O pior já passou, o recomeço está próximo.',
        'Page of Swords': 'Curiosidade e vigilância. Busque informações, mas evite fofocas.',
        'Knight of Swords': 'Ação rápida e direta. Comunique-se com clareza e objetividade.',
        'Queen of Swords': 'Independência e sabedoria. Corte o que não serve com honestidade.',
        'King of Swords': 'Autoridade intelectual. Use a lógica e a verdade para decidir.',
        
        'Ace of Pentacles': 'Nova oportunidade material! Prosperidade e abundância chegando.',
        'Two of Pentacles': 'Equilíbrio financeiro. Gerencie múltiplas prioridades com leveza.',
        'Three of Pentacles': 'Trabalho em equipe. Colabore e aprenda com outros.',
        'Four of Pentacles': 'Apego e segurança. Cuidado com a avareza, compartilhe.',
        'Five of Pentacles': 'Dificuldade material. Momentos difíceis, mas temporários.',
        'Six of Pentacles': 'Generosidade e partilha. Dar e receber em equilíbrio.',
        'Seven of Pentacles': 'Paciência e cultivo. Seus esforços darão frutos com tempo.',
        'Eight of Pentacles': 'Dedicação ao trabalho. Aperfeiçoe suas habilidades com esmero.',
        'Nine of Pentacles': 'Independência financeira. Desfrute do que conquistou com orgulho.',
        'Ten of Pentacles': 'Legado e família. Prosperidade que atravessa gerações.',
        'Page of Pentacles': 'Estudo e aprendizado. Invista em conhecimento prático.',
        'Knight of Pentacles': 'Trabalho constante. Passo a passo, com paciência e método.',
        'Queen of Pentacles': 'Nutrição e conforto. Cuide do lar e das finanças com carinho.',
        'King of Pentacles': 'Segurança e abundância. Liderança prática e confiável.'
    },
    spreadInterpretations: {
        mostlyUpright: '✨ A maioria das cartas está na posição reta, indicando um momento favorável para ação e crescimento. As energias estão fluindo positivamente.',
        mostlyReversed: '🌙 Há várias cartas invertidas, sugerindo a necessidade de introspecção e cuidado. Desafios podem estar presentes, mas trazem oportunidades de aprendizado.',
        balanced: '⚖️ Há um equilíbrio entre cartas retas e invertidas. Momentos de luz e sombra se alternam, trazendo oportunidades para integração e equilíbrio.'
    },
    positionNames: {
        past: 'Passado',
        present: 'Presente',
        future: 'Futuro',
        you: 'Você',
        other: 'O Outro',
        relationship: 'A Relação',
        challenges: 'Desafios',
        potential: 'Potencial',
        above: 'Acima',
        below: 'Abaixo',
        advice: 'Conselho',
        external: 'Influências Externas',
        hopes: 'Esperanças/Medos',
        outcome: 'Resultado'
    },
    cardTypes: {
        major: '⭐ Arcano Maior',
        minor: '📜 Arcano Menor'
    },
    suits: {
        wands: '⚡ Paus',
        cups: '💧 Copas',
        swords: '🗡️ Espadas',
        pentacles: '💰 Ouros'
    }
};

// Função para obter mensagem traduzida da carta do dia
function getDailyMessage(card) {
    const cardName = card.original_name || card.name;
    const customMessage = translations.dailyMessages[cardName];
    
    if (customMessage) {
        return customMessage;
    }
    
    if (card.type === 'major') {
        return `Hoje o arcano ${card.name} traz sua energia poderosa para seu dia. Reflita sobre seus significados e como eles se aplicam à sua vida.`;
    } else if (card.suit) {
        const suitLower = card.suit.toLowerCase();
        const suitMessages = {
            'wands': 'Hoje a energia do fogo traz criatividade e ação para sua vida.',
            'cups': 'As águas da emoção fluem hoje, trazendo sentimentos à tona.',
            'swords': 'O ar da razão sopra forte hoje, trazendo clareza mental.',
            'pentacles': 'A terra da prosperidade se manifesta hoje em questões materiais.'
        };
        return suitMessages[suitLower] || `A energia de ${card.name} se apresenta hoje em sua vida.`;
    }
    
    return `Sua carta para hoje é ${card.name}. Medite sobre sua mensagem e como ela se aplica ao seu momento.`;
}

// Função para obter nome da posição traduzido
function getPositionName(positionKey) {
    const positionMap = {
        'Passado': 'past',
        'Presente': 'present',
        'Futuro': 'future',
        'Você': 'you',
        'O Outro': 'other',
        'A Relação': 'relationship',
        'Desafios': 'challenges',
        'Potencial': 'potential',
        'Acima': 'above',
        'Abaixo': 'below',
        'Conselho': 'advice',
        'Influências Externas': 'external',
        'Esperanças/Medos': 'hopes',
        'Resultado': 'outcome'
    };
    
    const key = positionMap[positionKey];
    return key ? translations.positionNames[key] : positionKey;
}

// Função para obter ícone do naipe
function getSuitIcon(suit) {
    const icons = {
        'wands': '⚡',
        'cups': '💧',
        'swords': '🗡️',
        'pentacles': '💰'
    };
    return icons[suit?.toLowerCase()] || '📜';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSpread('daily');
    checkAPIStatus();
    setupSearchListeners();
    setupQuestionListeners();
    
    const questionInput = document.getElementById('questionInput');
    const searchInput = document.getElementById('searchInput');
    
    if (questionInput) {
        questionInput.placeholder = translations.messages.questionPlaceholder;
    }
    
    if (searchInput) {
        searchInput.placeholder = translations.messages.searchPlaceholder;
    }
});

mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
});

// Funções de utilidade
function showLoading(message = translations.messages.loading) {
    isLoading = true;
    loadingEl?.classList.remove('hidden');
    const loadingText = loadingEl?.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function hideLoading() {
    isLoading = false;
    loadingEl?.classList.add('hidden');
}

function showError(message) {
    mainContent.innerHTML = `
        <div class="error-message bg-red-900/50 backdrop-blur-sm border border-red-500 text-white p-6 rounded-lg text-center max-w-md mx-auto">
            <div class="text-5xl mb-4">🌋</div>
            <p class="text-lg mb-4">${message}</p>
            <button onclick="loadSpread('daily')" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                🔄 Tentar novamente
            </button>
        </div>
    `;
}

// Funções de API melhoradas
async function fetchAPI(endpoint, options = null) {
    // Cancelar requisição anterior se existir
    if (abortController) {
        abortController.abort();
    }
    
    abortController = new AbortController();
    
    try {
        showLoading();
        
        let url = `${API_BASE_URL}/api${endpoint}`;
        let fetchOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: abortController.signal
        };

        if (options) {
            fetchOptions = { ...fetchOptions, ...options };
        }

        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Requisição cancelada');
            return null;
        }
        console.error('Erro na requisição:', error);
        showError(translations.messages.apiError);
        return null;
    } finally {
        hideLoading();
        abortController = null;
    }
}

async function checkAPIStatus() {
    const data = await fetchAPI('/status');
    if (data) {
        console.log('✨ API Status:', data);
    }
}

// Funções de renderização
function renderCards(data, title) {
    if (!data) {
        mainContent.innerHTML = `<p class="text-center text-gray-400">${translations.messages.noCards}</p>`;
        return;
    }

    let cards = [];
    let summary = '';
    let spreadType = '';

    if (Array.isArray(data)) {
        cards = data;
    } else if (data.cards) {
        cards = data.cards;
        summary = data.summary || '';
        spreadType = data.spread_type || '';
    } else {
        cards = [data];
    }

    const isDaily = title === 'Carta do Dia';
    const isCeltic = title === 'Cruz Celta' || cards.length === 10;
    
    // Adiciona classes específicas baseado na quantidade de cartas
    let cardsGridClass = 'cards-grid';
    
    if (cards.length === 1) {
        cardsGridClass += ' single-card';
    } else if (cards.length === 3) {
        cardsGridClass += ' three-cards';
    } else if (isCeltic || cards.length === 10) {
        cardsGridClass += ' celtic-cross';
    }
    
    let html = `
        <h2 class="title-font text-2xl sm:text-3xl text-white mb-6 sm:mb-8 text-center animate-fade-in px-4">${title}</h2>
        <div class="${cardsGridClass}">
    `;

    cards.forEach((card, index) => {
        html += renderCard(card, isDaily, index);
    });

    html += '</div>';
    
    // Resumo da leitura - SEM TRUNCAMENTO
    if (cards.length > 1) {
        // Garante que o summary seja uma string completa
        let summaryText = summary || generateSpreadInterpretation(cards);
        
        // Se o summary veio truncado do backend, aqui podemos tentar completar
        // Mas isso é só uma salvaguarda - o ideal é o backend enviar completo
        if (summaryText && summaryText.includes('...') && summaryText.length < 500) {
            console.warn('Possível resumo truncado:', summaryText);
            // Tenta gerar um resumo mais completo localmente
            summaryText = generateDetailedInterpretation(cards, summaryText);
        }
        
         html += `
        <div class="info-box animate-slide-up">
            <h3 class="title-font text-xl sm:text-2xl text-white mb-4 flex items-center gap-2">
    
                ${translations.meanings.summary}
            </h3>
            <div class="summary-content">
                ${summaryText}
            </div>
            <div class="mt-6 text-purple-400/70 text-sm italic border-t border-purple-500/20 pt-4">
                Confie na sabedoria das cartas, mas lembre-se: você tem o livre arbítrio para fazer suas escolhas.
            </div>
        </div>
    `;

        
    }

    mainContent.innerHTML = html;
    
    // Scroll suave para o resumo após renderizar
    setTimeout(() => {
        const infoBox = document.querySelector('.info-box');
        if (infoBox) {
            infoBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 200);
}

// Função auxiliar para gerar interpretação mais detalhada se necessário
function generateDetailedInterpretation(cards, originalSummary) {
    // Se o original já parece completo, retorna ele
    if (!originalSummary.includes('...') || originalSummary.length > 800) {
        return originalSummary;
    }
    
    // Gera uma interpretação básica baseada nas cartas
    const uprightCount = cards.filter(c => c.position === 'upright').length;
    const reversedCount = cards.filter(c => c.position === 'reversed').length;
    const majorCount = cards.filter(c => c.type === 'major').length;
    
    let detailedSummary = '';
    
    // Análise de posições
    if (uprightCount > reversedCount) {
        detailedSummary += '✨ A maioria das cartas está na posição reta, indicando um momento favorável para ação e crescimento. As energias estão fluindo positivamente.\n\n';
    } else if (reversedCount > uprightCount) {
        detailedSummary += '🌙 Há várias cartas invertidas, sugerindo a necessidade de introspecção e cuidado com energias bloqueadas. Desafios podem estar presentes, mas trazem oportunidades de aprendizado.\n\n';
    } else {
        detailedSummary += '⚖️ Há um equilíbrio entre cartas retas e invertidas. Momentos de luz e sombra se alternam, trazendo oportunidades para integração e equilíbrio.\n\n';
    }
    
    // Análise de tipos de carta
    if (majorCount === 0) {
        detailedSummary += '📜 Apenas Arcanos Menores surgiram, sugerindo que o foco está em situações práticas do dia a dia, eventos cotidianos e aspectos mais mundanos da sua vida.\n\n';
    } else if (majorCount === cards.length) {
        detailedSummary += '⭐ Todos são Arcanos Maiores! Isso indica que questões profundas do destino e lições importantes de vida estão em jogo. Preste muita atenção a estas mensagens.\n\n';
    } else {
        detailedSummary += `🎴 ${majorCount} Arcano(s) Maior(es) apareceu(ram), indicando que há aspectos espirituais ou lições importantes misturados com situações práticas.\n\n`;
    }
    
    // Adiciona destaque para cartas notáveis
    const notableCards = cards.filter(c => 
        c.name.includes('Rei') || 
        c.name.includes('Rainha') || 
        c.name.includes('Cavaleiro') || 
        c.name.includes('Ás') ||
        c.type === 'major'
    );
    
    if (notableCards.length > 0) {
        detailedSummary += '🎴 Destaques da tirada:\n';
        notableCards.slice(0, 3).forEach(card => {
            const position = card.position === 'upright' ? '✨' : '🌙';
            detailedSummary += `• ${position} ${card.name}: ${card.meaning_upright ? card.meaning_upright.substring(0, 100) + '...' : 'Carta de destaque'}\n`;
        });
    }
    
    return detailedSummary;
}




function renderCard(card, isDaily = false, index = 0) {
    const position = card.position || 'upright';
    const positionClass = position === 'upright' ? 'upright' : 'reversed';
    const positionText = translations.positions[position];
    const positionColor = position === 'upright' ? 'text-green-400' : 'text-red-400';
    
    let meaning = position === 'upright' ? card.meaning_upright : card.meaning_reversed;
    meaning = meaning || 'Significado não disponível';

    const suitIcon = card.suit ? getSuitIcon(card.suit) : '';
    const cardTypeIcon = card.type === 'major' ? '⭐' : suitIcon;

    // Número da carta para Cruz Celta
    const cardNumber = index + 1;

    let html = `
        <div class="card bg-gradient-to-b from-purple-900/40 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${positionClass}">
            <div class="card-header bg-gradient-to-r from-purple-800/50 to-indigo-800/50 p-3 sm:p-4 border-b border-purple-500/30">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xl sm:text-2xl">${cardTypeIcon}</span>
                    <h3 class="card-name text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">${card.name}</h3>
                </div>
                <div class="flex justify-between items-center">
                    <span class="card-position ${positionColor} font-semibold flex items-center gap-1 text-xs sm:text-sm">
                        ${positionText}
                    </span>
                    ${card.position_name ? `
                        <span class="text-xs bg-purple-700/50 px-2 py-1 rounded-full text-purple-300">
                            ${cardNumber}ª
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="card-content p-4 sm:p-5">
    `;

    if (card.position_name) {
        const translatedPosition = getPositionName(card.position_name);
        html += `<div class="position-badge bg-purple-700/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm inline-block mb-3 backdrop-blur-sm">${translatedPosition}</div>`;
    }

    if (isDaily) {
        const dailyMessage = getDailyMessage(card);
        html += `<div class="daily-message bg-gradient-to-r from-purple-800/30 to-indigo-800/30 p-3 sm:p-4 rounded-lg mb-3 italic text-purple-200 border-l-4 border-purple-500 text-sm sm:text-base">✨ ${dailyMessage}</div>`;
    }

    html += `
                <p class="card-meaning text-gray-300 leading-relaxed mb-3 text-sm sm:text-base">${meaning}</p>
    `;

    if (card.suit) {
        const suitTranslated = translations.suits[card.suit.toLowerCase()] || card.suit;
        html += `<span class="card-suit inline-block bg-purple-700/30 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-purple-300 backdrop-blur-sm">${suitIcon} ${suitTranslated}</span>`;
    }

    if (card.advice) {
        html += `
            <div class="interpretation-text mt-3 p-2 sm:p-3 bg-purple-800/20 rounded-lg backdrop-blur-sm text-xs sm:text-sm">
                <strong class="text-purple-400">${translations.meanings.advice}:</strong> 
                <span class="text-gray-300">${card.advice}</span>
            </div>
        `;
    }

    if (card.context) {
        html += `
            <div class="interpretation-text mt-2 p-2 sm:p-3 bg-purple-800/20 rounded-lg backdrop-blur-sm text-xs sm:text-sm">
                <strong class="text-purple-400">${translations.meanings.context}:</strong> 
                <span class="text-gray-300">${card.context}</span>
            </div>
        `;
    }

    if (card.role) {
        html += `
            <div class="interpretation-text mt-2 p-2 sm:p-3 bg-purple-800/20 rounded-lg backdrop-blur-sm text-xs sm:text-sm">
                <strong class="text-purple-400">Papel na leitura:</strong> 
                <span class="text-gray-300">${card.role}</span>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Função de emergência para garantir que o resumo não seja truncado
function ensureFullSummary(summary) {
    if (!summary) return '';
    
    // Remove qualquer limitação artificial
    let fullSummary = summary
        .replace(/\.\.\.$/, '') // Remove "..." do final
        .replace(/\s+/g, ' ')    // Normaliza espaços
        .trim();
    
    // Se ainda parece truncado, adiciona um aviso
    if (fullSummary.length < 300 && fullSummary.includes('...')) {
        fullSummary += ' (O resumo completo será carregado em breve)';
    }
    
    return fullSummary;
}


function generateSpreadInterpretation(cards) {
    const uprightCount = cards.filter(c => c.position === 'upright').length;
    const reversedCount = cards.filter(c => c.position === 'reversed').length;
    
    if (uprightCount > reversedCount) {
        return translations.spreadInterpretations.mostlyUpright;
    } else if (reversedCount > uprightCount) {
        return translations.spreadInterpretations.mostlyReversed;
    } else {
        return translations.spreadInterpretations.balanced;
    }
}

// Funções de carregamento de spreads
async function loadSpread(type) {
    let endpoint = '';
    let title = '';
    
    switch(type) {
        case 'daily':
            endpoint = '/tarot/daily';
            title = 'Carta do Dia';
            break;
        case 'three':
            endpoint = '/tarot/spread/three';
            title = 'Tirada de Três Cartas';
            break;
        case 'love':
            endpoint = '/tarot/spread/love';
            title = 'Tirada do Amor';
            break;
        case 'celtic':
            endpoint = '/tarot/spread/celtic';
            title = 'Cruz Celta';
            break;
        default:
            return;
    }
    
    const data = await fetchAPI(endpoint);
    
    if (data) {
        if (type === 'daily') {
            renderCards([data], title);
        } else {
            renderCards(data, title);
        }
    }
    
    mobileMenu?.classList.add('hidden');
}

// Função ASK QUESTION melhorada
async function askQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();
    
    if (!question) {
        alert(translations.messages.typeQuestion);
        questionInput.focus();
        return;
    }
    
    const data = await fetchAPI('/tarot/interpret', {
        method: 'POST',
        body: JSON.stringify({ question })
    });
    
    if (data && data.cards) {
        let html = `
            <h2 class="title-font text-2xl sm:text-3xl text-white mb-4 text-center animate-fade-in px-4">${translations.meanings.yourQuestion}</h2>
            <div class="question-bubble bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 relative animate-slide-down max-w-3xl mx-auto">
                <p class="text-center text-purple-300 text-base sm:text-lg italic">"${data.question}"</p>
            </div>
            <div class="cards-grid ${data.cards.length === 3 ? 'three-cards' : ''}">
        `;
        
        data.cards.forEach(card => {
            html += renderCard(card);
        });
        
        html += '</div>';
        
        if (data.summary) {
            // Garante que o summary seja mostrado completo
            const fullSummary = ensureFullSummary(data.summary);
            
            html += `
                <div class="info-box animate-slide-up">
                    <h3 class="title-font text-xl sm:text-2xl text-white mb-6 flex items-center gap-3">
                        <span class="text-2xl">🔮</span> 
                        ${translations.meanings.summary}
                    </h3>
                    <div class="summary-content">
                        ${fullSummary}
                    </div>
                    <div class="mt-8 text-purple-400/70 text-sm italic border-t border-purple-500/20 pt-6">
                        Confie na sabedoria das cartas, mas lembre-se: você tem o livre arbítrio para fazer suas escolhas.
                    </div>
                </div>
            `;
        }
        
        mainContent.innerHTML = html;
        questionInput.value = '';
        
        // Scroll suave para o resultado
        setTimeout(() => {
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}
// ===== FUNÇÃO DE BUSCA COMPLETAMENTE REFEITA =====
async function searchCards() {
    // Elementos DOM
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('searchResults');
    const searchBtn = document.getElementById('searchBtn');
    
    // Validação
    if (!searchInput) {
        console.error('❌ Erro: Elemento searchInput não encontrado');
        return;
    }
    
    if (!resultsDiv) {
        console.error('❌ Erro: Elemento searchResults não encontrado');
        return;
    }
    
    const query = searchInput.value.trim();
    
    // Se busca vazia, mostrar mensagem
    if (!query) {
        resultsDiv.innerHTML = `
            <div class="bg-purple-900/20 backdrop-blur-sm rounded-lg p-6 text-center border border-purple-500/30">
                <p class="text-gray-400 mb-3">${translations.messages.searchPrompt}</p>
                <div class="flex flex-wrap gap-2 justify-center">
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('amor')">💕 amor</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('trabalho')">💼 trabalho</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('dinheiro')">💰 dinheiro</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('mudança')">🔄 mudança</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('sucesso')">🏆 sucesso</span>
                </div>
            </div>
        `;
        return;
    }
    
    // Mostrar loading
    resultsDiv.innerHTML = `
        <div class="bg-purple-900/30 backdrop-blur-sm rounded-lg p-8 text-center border border-purple-500/30">
            <div class="animate-spin inline-block w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mb-4"></div>
            <p class="text-purple-400">${translations.messages.searching}</p>
            <p class="text-gray-500 text-sm mt-2">Buscando por "${query}"...</p>
        </div>
    `;
    
    // Fazer requisição
    const data = await fetchAPI(`/tarot/search?q=${encodeURIComponent(query)}`);
    
    if (!data) {
        resultsDiv.innerHTML = `
            <div class="bg-red-900/30 backdrop-blur-sm border border-red-500/50 rounded-lg p-6 text-center">
                <p class="text-red-400 mb-3">${translations.messages.apiError}</p>
                <button onclick="searchCards()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    ${translations.messages.tryAgain}
                </button>
            </div>
        `;
        return;
    }
    
    // Processar resultados
    if (data.results && data.results.length > 0) {
        let html = `
            <div class="bg-gradient-to-b from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-white text-lg font-semibold flex items-center gap-2">
                        <span class="text-2xl">📚</span> 
                        ${translations.meanings.searchResults}
                    </h3>
                    <div class="flex items-center gap-2">
                        <span class="text-sm bg-purple-700/50 px-3 py-1 rounded-full text-purple-300">
                            ${data.total} ${data.total === 1 ? 'carta' : 'cartas'}
                        </span>
                        <button onclick="clearSearch()" class="text-gray-400 hover:text-white transition-colors" title="Limpar busca">
                            ${translations.meanings.clear}
                        </button>
                    </div>
                </div>
                <p class="text-purple-400 text-sm mb-4 italic">Buscando por: "${data.query}"</p>
                <div class="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        `;
        
        data.results.forEach((card, index) => {
            const suitIcon = card.suit ? getSuitIcon(card.suit) : '⭐';
            const cardType = card.type === 'major' ? translations.cardTypes.major : translations.cardTypes.minor;
            const meaning = card.meaning_upright || card.meaning_reversed || 'Significado em processamento...';
            const shortMeaning = meaning.length > 120 ? meaning.substring(0, 120) + '...' : meaning;
            
            html += `
                <div class="search-result-item bg-purple-800/30 border border-purple-500/30 rounded-lg p-4 cursor-pointer hover:bg-purple-700/40 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                     onclick="showCardDetails('${card.name_short}')">
                    <div class="flex items-start gap-3">
                        <div class="text-3xl mt-1">${suitIcon}</div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="text-white font-bold text-lg">${card.name}</h4>
                                <span class="text-xs bg-purple-700/50 px-2 py-1 rounded-full text-purple-300">
                                    ${cardType}
                                </span>
                            </div>
                            <p class="text-gray-300 text-sm mb-3 leading-relaxed">${shortMeaning}</p>
                            <div class="flex gap-2 text-xs">
                                <span class="bg-green-600/30 text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                                    <span>✨</span> Sentido Reto
                                </span>
                                <span class="bg-red-600/30 text-red-300 px-2 py-1 rounded-full flex items-center gap-1">
                                    <span>🌙</span> Sentido Invertido
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                ${data.total > data.results.length ? 
                    `<p class="text-gray-500 text-xs mt-4 text-center border-t border-purple-500/20 pt-3">
                        Mostrando ${data.results.length} de ${data.total} resultados. 
                        Seja mais específico para refinar a busca.
                    </p>` : 
                    ''
                }
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        
    } else {
        // Sem resultados
        resultsDiv.innerHTML = `
            <div class="bg-purple-900/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-8 text-center">
                <div class="text-6xl mb-4">😕</div>
                <p class="text-gray-300 text-lg mb-2">Nenhuma carta encontrada para <span class="text-purple-400 font-semibold">"${query}"</span></p>
                <p class="text-gray-500 text-sm mb-6">Tente outros termos ou seja mais específico</p>
                <div class="flex flex-wrap gap-2 justify-center mb-4">
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('amor')">💕 amor</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('trabalho')">💼 trabalho</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('dinheiro')">💰 dinheiro</span>
                    <span class="suggestion-chip bg-purple-800/50 px-3 py-1 rounded-full text-purple-300 text-sm cursor-pointer hover:bg-purple-700 transition-all" onclick="setSearchTerm('mudança')">🔄 mudança</span>
                </div>
                <button onclick="clearSearch()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                    ${translations.meanings.clear}
                </button>
            </div>
        `;
    }
}

// Função auxiliar para definir termo de busca
function setSearchTerm(term) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = term;
        searchCards();
    }
}

// Função para configurar listeners de busca
function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        // Buscar ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCards();
            }
        });
        
        // Mostrar botão de limpar quando houver texto
        searchInput.addEventListener('input', function() {
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                if (this.value.length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
        });
    }
    
    // Buscar ao clicar no botão
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchCards();
        });
    }
    
    // Limpar busca
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSearch();
        });
    }
}

// Função para configurar listeners da pergunta
function setupQuestionListeners() {
    const questionInput = document.getElementById('questionInput');
    const askBtn = document.getElementById('askBtn');
    
    if (questionInput) {
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askQuestion();
            }
        });
    }
    
    if (askBtn) {
        askBtn.addEventListener('click', (e) => {
            e.preventDefault();
            askQuestion();
        });
    }
}

// Função para limpar resultados da busca
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('searchResults');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="bg-purple-900/20 backdrop-blur-sm rounded-lg p-4 text-center border border-purple-500/30">
                <p class="text-gray-400">${translations.messages.searchPrompt}</p>
            </div>
        `;
    }
    
    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }
}

// Função para mostrar detalhes da carta
async function showCardDetails(cardId) {
    const data = await fetchAPI(`/tarot/card/${cardId}`);
    
    if (data) {
        const suitIcon = data.suit ? getSuitIcon(data.suit) : '⭐';
        const cardType = data.type === 'major' ? translations.cardTypes.major : translations.cardTypes.minor;
        
        let html = `
            <button onclick="loadSpread('daily')" class="mb-6 text-purple-400 hover:text-white transition-colors flex items-center gap-2">
                <span>←</span> ${translations.meanings.back}
            </button>
            <h2 class="title-font text-4xl text-white mb-2 text-center flex items-center justify-center gap-3">
                <span>${suitIcon}</span> ${data.name}
            </h2>
            <p class="text-center text-purple-400 mb-8">${cardType}</p>
            
            <div class="max-w-3xl mx-auto">
                <div class="card bg-gradient-to-b from-purple-900/40 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden shadow-xl">
                    <div class="card-content p-8">
                        ${data.description ? `
                            <div class="mb-8">
                                <h4 class="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                                    <span>📖</span> ${translations.meanings.description}
                                </h4>
                                <p class="text-gray-300 leading-relaxed">${data.description}</p>
                            </div>
                        ` : ''}
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-gradient-to-br from-green-900/20 to-green-800/10 p-5 rounded-lg border border-green-500/30">
                                <h4 class="text-green-400 font-semibold mb-3 flex items-center gap-2">
                                    <span>✨</span> ${translations.meanings.upright}
                                </h4>
                                <p class="text-gray-300">${data.meaning_upright || 'Não disponível'}</p>
                            </div>
                            <div class="bg-gradient-to-br from-red-900/20 to-red-800/10 p-5 rounded-lg border border-red-500/30">
                                <h4 class="text-red-400 font-semibold mb-3 flex items-center gap-2">
                                    <span>🌙</span> ${translations.meanings.reversed}
                                </h4>
                                <p class="text-gray-300">${data.meaning_reversed || 'Não disponível'}</p>
                            </div>
                        </div>
                        
                        ${data.suit ? `
                            <div class="mt-6 text-center">
                                <span class="inline-block bg-purple-700/30 px-4 py-2 rounded-full text-purple-300 backdrop-blur-sm">
                                    ${getSuitIcon(data.suit)} ${translations.suits[data.suit.toLowerCase()] || data.suit}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    }
}

// CSS adicional via JavaScript (opcional - pode ser movido para arquivo CSS)
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
    }
    
    .animate-slide-up {
        animation: slideUp 0.5s ease-out;
    }
    
    .animate-slide-down {
        animation: slideDown 0.5s ease-out;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(139, 92, 246, 0.1);
        border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.5);
        border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 92, 246, 0.7);
    }
    
    .suggestion-chip {
        transition: all 0.3s ease;
    }
    
    .suggestion-chip:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// Detectar mudanças de orientação e redimensionamento
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce para evitar muitas chamadas
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Fechar menu mobile em tablets/desktop
        if (window.innerWidth >= 768) {
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
        
        // Ajustar altura mínima do conteúdo principal
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            const windowHeight = window.innerHeight;
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            const minHeight = windowHeight - headerHeight - 100;
            mainContent.style.minHeight = `${Math.max(300, minHeight)}px`;
        }
    }, 250);
});

// Detectar orientação em dispositivos móveis
if (window.matchMedia) {
    const orientationMedia = window.matchMedia("(orientation: portrait)");
    orientationMedia.addEventListener('change', function(e) {
        if (e.matches) {
            // Modo retrato
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        } else {
            // Modo paisagem
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        }
    });
}

// Exportar funções para uso global
window.loadSpread = loadSpread;
window.askQuestion = askQuestion;
window.searchCards = searchCards;
window.showCardDetails = showCardDetails;
window.clearSearch = clearSearch;
window.setSearchTerm = setSearchTerm;