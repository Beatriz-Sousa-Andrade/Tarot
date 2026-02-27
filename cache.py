import time

class SimpleCache:
    """
    Cache simples compatível com ambiente serverless (Vercel)
    OBS: o cache vive apenas durante a execução da função.
    """

    def __init__(self, maxsize=100, ttl=3600):
        self.maxsize = maxsize
        self.ttl = ttl
        self._cache = {}
        self._timestamps = {}

    # ======================
    # GET
    # ======================
    def get(self, key):
        if key not in self._cache:
            return None

        age = time.time() - self._timestamps.get(key, 0)

        if age >= self.ttl:
            self._delete(key)
            return None

        return self._cache[key]

    # ======================
    # SET
    # ======================
    def set(self, key, value):
        if len(self._cache) >= self.maxsize and key not in self._cache:
            self._remove_oldest()

        self._cache[key] = value
        self._timestamps[key] = time.time()
        return True

    # ======================
    # DELETE
    # ======================
    def delete(self, key):
        return self._delete(key)

    def _delete(self, key):
        self._cache.pop(key, None)
        self._timestamps.pop(key, None)
        return True

    # ======================
    # REMOVE OLDEST
    # ======================
    def _remove_oldest(self):
        if not self._timestamps:
            return

        oldest_key = min(
            self._timestamps,
            key=self._timestamps.get
        )
        self._delete(oldest_key)

    # ======================
    # CLEAN EXPIRED
    # ======================
    def cleanup_expired(self):
        removed = 0
        now = time.time()

        for key in list(self._timestamps.keys()):
            if now - self._timestamps[key] >= self.ttl:
                self._delete(key)
                removed += 1

        return removed

    # ======================
    # KEYS
    # ======================
    def get_all_keys(self):
        return list(self._cache.keys())

    # ======================
    # STATS
    # ======================
    def get_stats(self):
        return {
            "total_items": len(self._cache),
            "maxsize": self.maxsize,
            "ttl_seconds": self.ttl
        }


# ======================================
# INSTÂNCIAS GLOBAIS
# ======================================

cards_cache_obj = SimpleCache(maxsize=10, ttl=300)
translation_cache_obj = SimpleCache(maxsize=200, ttl=3600)


# ======================================
# FUNÇÃO UTILITÁRIA
# ======================================

def get_cached(key, fetch_func=None, cache_obj=None):
    if cache_obj is None:
        cache_obj = cards_cache_obj

    value = cache_obj.get(key)

    if value is not None:
        return value

    if fetch_func:
        value = fetch_func()
        if value is not None:
            cache_obj.set(key, value)

    return value

# Adicione no final do cache.py

def cached(key, ttl=None):
    """Decorator para cache de funções"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Usa o cache de cartas como padrão
            cache_obj = cards_cache_obj
            value = cache_obj.get(key)
            
            if value is not None:
                return value
            
            value = func(*args, **kwargs)
            if value is not None:
                cache_obj.set(key, value)
            return value
        return wrapper
    return decorator


def start_cleanup_thread(interval=300):
    """Inicia thread para limpeza automática do cache"""
    import threading
    import time
    
    def cleanup_worker():
        while True:
            time.sleep(interval)
            cards_cache_obj.cleanup_expired()
            translation_cache_obj.cleanup_expired()
    
    thread = threading.Thread(target=cleanup_worker, daemon=True)
    thread.start()
    return thread