from flask import Flask, jsonify, request, send_from_directory, render_template, redirect
#import flask_cors
import requests
import random
import os
from dotenv import load_dotenv
from datetime import datetime
import logging
from deep_translator import GoogleTranslator
import hashlib
import time

# Importar o sistema de cache
from cache import (
    SimpleCache, 
    cards_cache_obj, 
    translation_cache_obj,
    get_cached,
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static',
            static_url_path='/static')

# flask_cors.CORS(app)

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

app.after_request(add_cors_headers)

# Configuração da API tarotapi.dev
TAROT_API_URL = "https://tarotapi.dev/api/v1"

# Cache para as cartas (usando o objeto já importado)
cards_cache = cards_cache_obj
translation_cache = translation_cache_obj

def fetch_all_cards(force_refresh=False):
    """
    Busca todas as cartas da API usando o sistema de cache
    """
    cache_key = "all_cards"
    
    if force_refresh:
        # Força remoção do cache
        cards_cache.delete(cache_key)
    
    # Usa a função utilitária get_cached
    def fetch_from_api():
        try:
            logger.info("Buscando cartas da API...")
            response = requests.get(f"{TAROT_API_URL}/cards", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                cards = data.get('cards', [])
                logger.info(f"API retornou {len(cards)} cartas")
                return cards
            else:
                logger.error(f"Erro na API: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Erro ao buscar cartas: {e}")
            return None
    
    # Tenta obter do cache ou buscar da API
    cards = get_cached(cache_key, fetch_from_api, cards_cache)
    
    if cards is None:
        logger.warning("Não foi possível obter cartas da API nem do cache")
        return []
    
    return cards

def adapt_card_format(card, position=None):
    """Adapta o formato da carta da API para o formato do frontend"""
    try:
        name = card.get('name', 'Carta desconhecida')
        
        adapted = {
            'id': card.get('value_int', 0),
            'name': translate_text(name),
            'name_short': card.get('name_short', ''),
            'type': card.get('type', 'major'),
            'value': card.get('value', ''),
            'meaning_upright': translate_text(card.get('meaning_up', '')),
            'meaning_reversed': translate_text(card.get('meaning_rev', '')),
            'description': translate_text(card.get('desc', '')),
            'suit': translate_text(card.get('suit', '')) if card.get('type') == 'minor' else None,
            'original_name': name
        }
        
        if position:
            adapted['position'] = position
            if position == 'upright':
                adapted['interpretation'] = adapted['meaning_upright']
            else:
                adapted['interpretation'] = adapted['meaning_reversed']
        
        return adapted
    except Exception as e:
        logger.error(f"Erro ao adaptar carta: {e}")
        return {}

def translate_text(text):
    """Traduz texto do inglês para português com cache"""
    if not text or not isinstance(text, str):
        return text
    
    # Cria chave baseada no texto
    cache_key = f"translation:{hashlib.md5(text.encode()).hexdigest()}"
    
    # Tenta obter do cache de traduções
    cached = translation_cache.get(cache_key)
    if cached is not None:
        return cached
    
    try:
        # Limitar tamanho para evitar timeout
        if len(text) > 500:
            text = text[:500]
        
        translated = GoogleTranslator(source='en', target='pt').translate(text)
        
        # Armazenar no cache de traduções
        translation_cache.set(cache_key, translated)
        
        return translated
    except Exception as e:
        logger.warning(f"Erro na tradução: {e}")
        return text

def generate_spread_summary(cards, spread_type):
    """Gera um resumo significativo baseado nas cartas e no tipo de tirada"""
    if not cards:
        return "Não foi possível gerar um resumo."
    
    # Contar posições
    upright_count = sum(1 for c in cards if c.get('position') == 'upright')
    reversed_count = len(cards) - upright_count
    
    # Identificar tipos de cartas
    major_count = sum(1 for c in cards if c.get('type') == 'major')
    minor_count = len(cards) - major_count
    
    # Analisar naipes (para cartas menores)
    suits = {}
    for card in cards:
        if card.get('suit'):
            suit = card['suit'].lower()
            suits[suit] = suits.get(suit, 0) + 1
    
    # Construir resumo baseado no tipo de tirada
    summary_parts = []
    
    # Análise geral de energia
    if upright_count > reversed_count:
        summary_parts.append("✨ A maioria das cartas está na posição reta, indicando que as energias estão fluindo de forma favorável e direta.")
    elif reversed_count > upright_count:
        summary_parts.append("🌙 Há várias cartas invertidas, sugerindo a necessidade de introspecção e cuidado com energias bloqueadas.")
    else:
        summary_parts.append("⚖️ Há um equilíbrio entre cartas retas e invertidas, indicando um momento de integração entre luz e sombra.")
    
    # Análise de Arcanos Maiores vs Menores
    if major_count > minor_count:
        summary_parts.append("🃏 A presença forte de Arcanos Maiores indica que lições importantes do destino estão se manifestando.")
    elif major_count == 0:
        summary_parts.append("📜 Apenas Arcanos Menores surgiram, sugerindo que o foco está em situações práticas do dia a dia.")
    
    # Análise de naipes (se houver)
    if suits:
        suit_meanings = []
        if suits.get('wands', 0) >= 2:
            suit_meanings.append("⚡ energia criativa e ação (Paus)")
        if suits.get('cups', 0) >= 2:
            suit_meanings.append("💧 emoções e relacionamentos (Copas)")
        if suits.get('swords', 0) >= 2:
            suit_meanings.append("🌪️ conflitos e pensamentos (Espadas)")
        if suits.get('pentacles', 0) >= 2:
            suit_meanings.append("🌱 questões materiais e trabalho (Ouros)")
        
        if suit_meanings:
            summary_parts.append(f"Os naipes em destaque são: {', '.join(suit_meanings)}.")
    
    # Adicionar contexto específico da tirada
    if spread_type == 'three':
        summary_parts.append("\n🔮 Nesta tirada de Passado/Presente/Futuro, observe como as energias evoluem através do tempo.")
    elif spread_type == 'love':
        summary_parts.append("\n💕 Esta tirada do amor revela a dinâmica entre você, o outro e a relação.")
    elif spread_type == 'celtic':
        summary_parts.append("\n🌀 A Cruz Celta é uma tirada profunda que mostra desde as influências inconscientes até o resultado potencial.")
    
    # Citar carta de destaque
    if cards:
        first_card = cards[0]
        card_name = first_card.get('name', '')
        card_position = first_card.get('position', 'upright')
        card_meaning = first_card.get('meaning_upright' if card_position == 'upright' else 'meaning_reversed', '')
        
        if card_meaning:
            short_meaning = card_meaning[:100] + "..." if len(card_meaning) > 100 else card_meaning
            summary_parts.append(f"\n🎴 Destaque para {card_name}: {short_meaning}")
    
    return " ".join(summary_parts)

# ========== FUNÇÕES DE TRATAMENTO DE ERRO ==========

def handle_error(code, default_message, error_detail=None):
    """
    Função genérica para lidar com erros HTTP
    """
    if request.path.startswith('/api/'):
        return jsonify({
            "error": default_message,
            "code": code,
            "detail": error_detail if error_detail else None,
            "timestamp": datetime.now().isoformat()
        }), code
    
    try:
        # Renderizar página de erro usando template
        return render_template('error.html', 
                             error_code=code, 
                             error_message=default_message,
                             error_detail=error_detail), code
    except Exception as e:
        logger.error(f"Erro ao servir página de erro: {e}")
        # Fallback para HTML simples se o template não existir
        return f"""
        <html>
            <head><title>Erro {code}</title></head>
            <body style="background: #0a0a0f; color: white; text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1 style="color: #9333ea;">{code} - {default_message}</h1>
                <p style="color: #9ca3af;">{error_detail if error_detail else 'Ocorreu um erro místico.'}</p>
                <a href="/" style="color: #c084fc; text-decoration: none;">Voltar ao início</a>
            </body>
        </html>
        """, code

# ========== HANDLERS DE ERRO ==========

@app.errorhandler(404)
def page_not_found(error):
    """Página 404 personalizada"""
    logger.info(f"Página não encontrada: {request.path}")
    try:
        return render_template('404.html'), 404
    except Exception as e:
        logger.error(f"Erro ao servir página 404: {e}")
        return handle_error(404, "Página não encontrada", "O portal que você busca não existe nesta dimensão.")

@app.errorhandler(500)
def internal_server_error(error):
    """Erro 500 personalizado"""
    logger.error(f"Erro interno do servidor: {error}")
    return handle_error(500, "Erro interno do servidor", str(error))

# Registrar outros handlers de erro
for code in [400, 401, 403, 405, 408, 429, 502, 503, 504]:
    app.errorhandler(code)(lambda e, c=code: handle_error(c, str(e)))

# ========== ROTAS PARA SERVIR O FRONTEND ==========

@app.route('/error')
def error_page():
    """Rota para mostrar página de erro personalizada"""
    code = request.args.get('code', '500')
    message = request.args.get('message', 'Erro desconhecido')
    detail = request.args.get('detail', '')
    
    try:
        return render_template('error.html', 
                             error_code=int(code), 
                             error_message=message,
                             error_detail=detail), int(code)
    except Exception as e:
        logger.error(f"Erro ao renderizar error.html: {e}")
        return handle_error(int(code), message, detail)

@app.route('/')
def index():
    """Rota principal - serve a página inicial"""
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Erro ao renderizar index.html: {e}")
        return handle_error(500, "Erro ao carregar página inicial", "Template index.html não encontrado")

@app.route('/about')
def about():
    """Página sobre o projeto"""
    try:
        return render_template('about.html')
    except Exception as e:
        logger.error(f"Erro ao renderizar about.html: {e}")
        return handle_error(404, "Página não encontrada", "A página 'about' não existe")

@app.route('/spreads')
def spreads():
    """Página de tipos de tiradas"""
    try:
        return render_template('spreads.html')
    except Exception as e:
        logger.error(f"Erro ao renderizar spreads.html: {e}")
        return handle_error(404, "Página não encontrada", "A página 'spreads' não existe")

@app.route('/card/<string:card_id>')
def card_detail(card_id):
    """Página de detalhe de uma carta específica"""
    try:
        return render_template('card_detail.html', card_id=card_id)
    except Exception as e:
        logger.error(f"Erro ao renderizar card_detail.html: {e}")
        return handle_error(404, "Página não encontrada", f"Detalhe da carta {card_id} não disponível")

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve arquivos estáticos (CSS, JS)"""
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo estático {filename}: {e}")
        return handle_error(404, f"Arquivo não encontrado: {filename}")

# Rota catch-all para SPA - redireciona tudo que não é API para o index
@app.route('/<path:path>')
def catch_all(path):
    """
    Rota genérica para capturar todos os outros caminhos
    e redirecionar para o index.html (comportamento SPA)
    """
    # Evita conflito com rotas da API
    if path.startswith('api/'):
        return handle_error(404, f"Endpoint API não encontrado: {path}")
    
    # Verifica se é uma requisição para arquivo estático
    if '.' in path and not path.startswith('api/'):
        return handle_error(404, f"Arquivo não encontrado: {path}")
    
    # Para qualquer outra rota, tenta servir o index.html (comportamento SPA)
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Erro ao renderizar index.html para path {path}: {e}")
        return handle_error(404, f"Página não encontrada: {path}")

# ========== ROTAS DA API ==========
# (Todas as rotas da API permanecem exatamente iguais)

@app.route('/api', methods=['GET'])
def api_home():
    """Rota principal da API"""
    return jsonify({
        "message": "API de Tarot Online",
        "version": "1.2",
        "cache_stats": {
            "cards": cards_cache.get_stats(),
            "translations": translation_cache.get_stats()
        },
        "endpoints": {
            "GET /api/status": "Status da API e cache",
            "GET /api/tarot/cards": "Listar todas as cartas",
            "GET /api/tarot/random?count=3": "Tirar cartas aleatórias",
            "GET /api/tarot/spread/three": "Tirada de 3 cartas",
            "GET /api/tarot/spread/celtic": "Tirada Cruz Celta",
            "GET /api/tarot/spread/love": "Tirada do Amor",
            "GET /api/tarot/card/<name_short>": "Detalhes de uma carta",
            "GET /api/tarot/search?q=amor": "Buscar cartas",
            "GET /api/tarot/daily": "Carta do dia",
            "POST /api/tarot/interpret": "Interpretar pergunta",
            "GET /api/cache/stats": "Estatísticas do cache",
            "POST /api/cache/cleanup": "Limpar itens expirados"
        }
    })

@app.route('/api/status', methods=['GET'])
def status():
    """Verifica status da API e cache"""
    try:
        response = requests.get(f"{TAROT_API_URL}/cards/random?n=1", timeout=3)
        api_status = "online" if response.status_code == 200 else "offline"
    except:
        api_status = "offline"
    
    cards = fetch_all_cards()
    
    return jsonify({
        "api_status": api_status,
        "cache_stats": cards_cache.get_stats(),
        "translation_cache_stats": translation_cache.get_stats(),
        "cards_in_cache": len(cards) if cards else 0,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Retorna estatísticas detalhadas do cache"""
    return jsonify({
        "cards_cache": cards_cache.get_stats(),
        "translation_cache": translation_cache.get_stats(),
        "cards_keys": cards_cache.get_all_keys()[:10],
        "translation_keys": translation_cache.get_all_keys()[:10]
    })

@app.route('/api/cache/cleanup', methods=['POST'])
def cleanup_cache():
    """Limpa itens expirados do cache manualmente"""
    cards_removed = cards_cache.cleanup_expired()
    trans_removed = translation_cache.cleanup_expired()
    
    return jsonify({
        "success": True,
        "cards_removed": cards_removed,
        "translations_removed": trans_removed,
        "message": f"Removidos {cards_removed} itens do cache de cartas e {trans_removed} do cache de traduções"
    })

@app.route('/api/tarot/cards', methods=['GET'])
def get_cards():
    """Listar todas as cartas com filtros opcionais"""
    cards = fetch_all_cards()
    
    if not cards:
        return jsonify({"error": "Não foi possível carregar as cartas"}), 503
    
    card_type = request.args.get('type')
    suit = request.args.get('suit')
    
    filtered_cards = cards
    if card_type:
        filtered_cards = [c for c in filtered_cards if c.get('type') == card_type]
    if suit:
        filtered_cards = [c for c in filtered_cards if c.get('suit', '').lower() == suit.lower()]
    
    adapted_cards = [adapt_card_format(card) for card in filtered_cards]
    
    return jsonify({
        "total": len(adapted_cards),
        "cards": adapted_cards
    })

@app.route('/api/tarot/random', methods=['GET'])
def random_cards():
    """Tirar cartas aleatórias"""
    try:
        count = request.args.get('count', '1')
        
        try:
            n = int(count)
            n = max(1, min(n, 10))
        except:
            n = 1
        
        try:
            response = requests.get(f"{TAROT_API_URL}/cards/random?n={n}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                cards = data.get('cards', [])
                
                result = []
                for card in cards:
                    position = random.choice(['upright', 'reversed'])
                    adapted = adapt_card_format(card, position)
                    result.append(adapted)
                
                return jsonify(result)
        except Exception as e:
            logger.warning(f"Erro ao buscar da API, usando cache: {e}")
        
        cards = fetch_all_cards()
        if not cards:
            return jsonify({"error": "Sem cartas disponíveis"}), 503
        
        selected = random.sample(cards, min(n, len(cards)))
        result = []
        for card in selected:
            position = random.choice(['upright', 'reversed'])
            result.append(adapt_card_format(card, position))
        
        return jsonify(result)
            
    except Exception as e:
        logger.error(f"Erro em random_cards: {e}")
        return jsonify({"error": "Erro ao buscar cartas"}), 500

@app.route('/api/tarot/spread/three', methods=['GET'])
def three_card_spread():
    """Tirada de 3 cartas: Passado, Presente, Futuro"""
    positions = [
        {"name": "Passado", "meaning": "Influências que já passaram"},
        {"name": "Presente", "meaning": "Situação atual"},
        {"name": "Futuro", "meaning": "Tendências futuras"}
    ]
    
    try:
        cards = fetch_all_cards()
        if not cards:
            return jsonify({"error": "Sem cartas disponíveis"}), 503
        
        selected = random.sample(cards, 3)
        
        spread = []
        for i, card in enumerate(selected):
            position = random.choice(['upright', 'reversed'])
            adapted = adapt_card_format(card, position)
            adapted['position_name'] = positions[i]['name']
            adapted['position_meaning'] = positions[i]['meaning']
            spread.append(adapted)
        
        summary = generate_spread_summary(spread, 'three')
        
        return jsonify({
            "cards": spread,
            "summary": summary,
            "spread_type": "three"
        })
        
    except Exception as e:
        logger.error(f"Erro em three_card_spread: {e}")
        return jsonify({"error": "Erro ao criar tirada"}), 500

@app.route('/api/tarot/spread/celtic', methods=['GET'])
def celtic_cross_spread():
    """Tirada da Cruz Celta (10 cartas)"""
    positions = [
        {"name": "Presente", "meaning": "A situação atual"},
        {"name": "Desafio", "meaning": "O que está cruzando/desafiando"},
        {"name": "Passado", "meaning": "Fundamentos do passado"},
        {"name": "Futuro", "meaning": "O que se aproxima"},
        {"name": "Acima", "meaning": "Objetivos ou melhor resultado"},
        {"name": "Abaixo", "meaning": "Influências inconscientes"},
        {"name": "Conselho", "meaning": "Como proceder"},
        {"name": "Influências Externas", "meaning": "Pessoas/eventos ao redor"},
        {"name": "Esperanças/Medos", "meaning": "Sentimentos internos"},
        {"name": "Resultado", "meaning": "Resultado final potencial"}
    ]

    try:
        cards = fetch_all_cards()
        if not cards:
            return jsonify({"error": "Sem cartas disponíveis"}), 503
        
        selected = random.sample(cards, min(10, len(cards)))

        spread = []
        for i, card in enumerate(selected):
            position = random.choice(['upright', 'reversed'])
            adapted = adapt_card_format(card, position)
            adapted['position_name'] = positions[i]['name']
            adapted['position_meaning'] = positions[i]['meaning']
            spread.append(adapted)

        summary = generate_spread_summary(spread, 'celtic')

        return jsonify({
            "cards": spread,
            "summary": summary,
            "spread_type": "celtic"
        })

    except Exception as e:
        logger.error(f"Erro em celtic_cross_spread: {e}")
        return jsonify({"error": "Erro ao criar tirada"}), 500

@app.route('/api/tarot/spread/love', methods=['GET'])
def love_spread():
    """Tirada especial para amor/relacionamentos (5 cartas)"""
    positions = [
        {"name": "Você", "meaning": "Seus sentimentos atuais"},
        {"name": "O Outro", "meaning": "Sentimentos da outra pessoa"},
        {"name": "A Relação", "meaning": "Dinâmica do relacionamento"},
        {"name": "Desafios", "meaning": "O que precisa ser trabalhado"},
        {"name": "Potencial", "meaning": "Futuro do relacionamento"}
    ]
    
    try:
        cards = fetch_all_cards()
        if not cards:
            return jsonify({"error": "Sem cartas disponíveis"}), 503
        
        selected = random.sample(cards, 5)
        
        spread = []
        for i, card in enumerate(selected):
            position = random.choice(['upright', 'reversed'])
            adapted = adapt_card_format(card, position)
            adapted['position_name'] = positions[i]['name']
            adapted['position_meaning'] = positions[i]['meaning']
            spread.append(adapted)
        
        summary = generate_spread_summary(spread, 'love')
        
        return jsonify({
            "cards": spread,
            "summary": summary,
            "spread_type": "love"
        })
        
    except Exception as e:
        logger.error(f"Erro em love_spread: {e}")
        return jsonify({"error": "Erro ao criar tirada"}), 500

@app.route('/api/tarot/card/<string:card_id>', methods=['GET'])
def get_card_by_id(card_id):
    """Buscar uma carta específica pelo ID"""
    try:
        cards = fetch_all_cards()
        card = next((c for c in cards if c.get('name_short') == card_id), None)
        
        if card:
            return jsonify(adapt_card_format(card))
        
        return jsonify({"error": "Carta não encontrada"}), 404
            
    except Exception as e:
        logger.error(f"Erro em get_card_by_id: {e}")
        return jsonify({"error": "Erro ao buscar carta"}), 500

@app.route('/api/tarot/search', methods=['GET'])
def search_cards():
    """Buscar cartas por palavra-chave no significado"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({"error": "Termo de busca não fornecido"}), 400
    
    cards = fetch_all_cards()
    if not cards:
        return jsonify({"error": "Sem dados disponíveis"}), 503
    
    results = []
    
    for card in cards:
        name_pt = translate_text(card.get('name', ''))
        meaning_up_pt = translate_text(card.get('meaning_up', ''))
        meaning_rev_pt = translate_text(card.get('meaning_rev', ''))
        desc_pt = translate_text(card.get('desc', ''))
        
        if (query in card.get('name', '').lower() or
            query in card.get('meaning_up', '').lower() or
            query in card.get('meaning_rev', '').lower() or
            query in card.get('desc', '').lower() or
            query in name_pt.lower() or
            query in meaning_up_pt.lower() or
            query in meaning_rev_pt.lower() or
            query in desc_pt.lower()):
            
            adapted = adapt_card_format(card)
            results.append(adapted)
    
    return jsonify({
        "query": query,
        "total": len(results),
        "results": results[:20]
    })

@app.route('/api/tarot/daily', methods=['GET'])
def daily_card():
    """Carta do dia - baseada na data atual"""
    today = datetime.now().date()
    random.seed(str(today))
    
    cards = fetch_all_cards()
    if not cards:
        return jsonify({"error": "Sem dados disponíveis"}), 503
    
    card_index = random.randint(0, len(cards) - 1)
    card = cards[card_index]
    position = random.choice(['upright', 'reversed'])
    
    random.seed()
    
    adapted = adapt_card_format(card, position)
    adapted['date'] = str(today)
    
    return jsonify(adapted)

@app.route('/api/tarot/interpret', methods=['POST'])
def interpret_question():
    """Interpretar uma pergunta específica com 3 cartas"""
    data = request.get_json()
    question = data.get('question', '')
    
    if not question:
        return jsonify({"error": "Pergunta não fornecida"}), 400
    
    try:
        cards = fetch_all_cards()
        if not cards:
            return jsonify({"error": "Sem cartas disponíveis"}), 503
        
        selected = random.sample(cards, 3)
        
        interpretation = {
            "question": question,
            "cards": [],
            "summary": ""
        }
        
        for i, card in enumerate(selected):
            position = random.choice(['upright', 'reversed'])
            adapted = adapt_card_format(card, position)
            
            if i == 0:
                adapted['role'] = "Fatores que influenciam a situação"
            elif i == 1:
                adapted['role'] = "O caminho a seguir"
            else:
                adapted['role'] = "Resultado potencial"
            
            interpretation['cards'].append(adapted)
        
        upright_count = sum(1 for c in interpretation['cards'] if c.get('position') == 'upright')
        
        if upright_count >= 2:
            interpretation['summary'] = "As cartas indicam um caminho favorável para sua questão. Confie no processo."
        elif upright_count == 1:
            interpretation['summary'] = "Há aspectos positivos e desafiadores em sua questão. Busque equilíbrio."
        else:
            interpretation['summary'] = "Momento de introspecção. Reavalie sua abordagem antes de agir."
        
        return jsonify(interpretation)
        
    except Exception as e:
        logger.error(f"Erro em interpret_question: {e}")
        return jsonify({"error": "Erro ao interpretar"}), 500

@app.route('/api/admin/refresh-cache', methods=['POST'])
def refresh_cache():
    """Força a atualização do cache de cartas"""
    try:
        cards = fetch_all_cards(force_refresh=True)
        return jsonify({
            "success": True,
            "cards_count": len(cards) if cards else 0,
            "cache_stats": cards_cache.get_stats(),
            "message": "Cache atualizado com sucesso"
        })
    except Exception as e:
        logger.error(f"Erro ao atualizar cache: {e}")
        return jsonify({"error": "Erro ao atualizar cache"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    # Verificar estrutura de pastas
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    
    if not os.path.exists(templates_dir):
        logger.warning(f"Pasta 'templates' não encontrada em {templates_dir}")
    if not os.path.exists(static_dir):
        logger.warning(f"Pasta 'static' não encontrada em {static_dir}")
    
    # Carregar cache inicial
    with app.app_context():
        cards = fetch_all_cards()
        logger.info(f"Cache inicial carregado com {len(cards) if cards else 0} cartas")
        logger.info(f"Estatísticas do cache: {cards_cache.get_stats()}")
    
    logger.info(f"Servidor rodando em http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)