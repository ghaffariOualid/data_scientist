"""
Simple caching mechanism for analysis results to improve performance and reduce API costs.
"""

import hashlib
import json
import logging
import time
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from threading import Lock

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    key: str
    data: Any
    timestamp: float
    ttl: int  # Time to live in seconds
    access_count: int = 0

    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        return time.time() - self.timestamp > self.ttl

    def touch(self):
        """Update access timestamp and count."""
        self.access_count += 1

class AnalysisCache:
    """Thread-safe cache for analysis results."""

    def __init__(self, max_size: int = 100, default_ttl: int = 3600):  # 1 hour default TTL
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: Dict[str, CacheEntry] = {}
        self.lock = Lock()
        logger.info(f"Initialized AnalysisCache with max_size={max_size}, default_ttl={default_ttl}s")

    def _generate_key(self, query: str, data_hash: str) -> str:
        """
        Generate a cache key from query and data hash.

        Args:
            query: The user query
            data_hash: Hash of the dataset

        Returns:
            Cache key string
        """
        combined = f"{query.strip().lower()}|{data_hash}"
        return hashlib.md5(combined.encode()).hexdigest()

    def _hash_dataframe(self, df) -> str:
        """
        Generate a hash for the dataframe to detect changes.

        Args:
            df: Pandas DataFrame

        Returns:
            Hash string
        """
        try:
            # Include column names, shape, and a sample of data
            cache_data = {
                'columns': list(df.columns),
                'shape': df.shape,
                'sample': df.head(5).to_dict() if len(df) > 0 else {}
            }
            return hashlib.md5(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()
        except Exception as e:
            logger.warning(f"Error hashing dataframe: {e}")
            return "error_hash"

    def get(self, query: str, df) -> Optional[Any]:
        """
        Retrieve cached result if available and valid.

        Args:
            query: The user query
            df: The dataframe

        Returns:
            Cached result or None
        """
        data_hash = self._hash_dataframe(df)
        key = self._generate_key(query, data_hash)

        with self.lock:
            entry = self.cache.get(key)
            if entry and not entry.is_expired():
                entry.touch()
                logger.info(f"Cache hit for key: {key[:8]}... (accessed {entry.access_count} times)")
                return entry.data
            elif entry and entry.is_expired():
                logger.info(f"Cache expired for key: {key[:8]}...")
                del self.cache[key]

        logger.debug(f"Cache miss for key: {key[:8]}...")
        return None

    def set(self, query: str, df, data: Any, ttl: Optional[int] = None) -> None:
        """
        Store result in cache.

        Args:
            query: The user query
            df: The dataframe
            data: The result to cache
            ttl: Time to live in seconds (optional)
        """
        data_hash = self._hash_dataframe(df)
        key = self._generate_key(query, data_hash)
        ttl = ttl or self.default_ttl

        entry = CacheEntry(
            key=key,
            data=data,
            timestamp=time.time(),
            ttl=ttl
        )

        with self.lock:
            # Clean up expired entries if we're at capacity
            if len(self.cache) >= self.max_size:
                self._cleanup_expired()

            # If still at capacity, remove least recently used
            if len(self.cache) >= self.max_size:
                self._evict_lru()

            self.cache[key] = entry
            logger.info(f"Cached result for key: {key[:8]}... (TTL: {ttl}s)")

    def invalidate_by_query(self, query: str) -> int:
        """
        Invalidate all cache entries for a specific query.

        Args:
            query: The query to invalidate

        Returns:
            Number of entries invalidated
        """
        query_lower = query.strip().lower()
        invalidated = 0

        with self.lock:
            keys_to_remove = []
            for key, entry in self.cache.items():
                # Extract query part from key (before the | separator)
                if '|' in key:
                    cached_query = key.split('|')[0]
                    if cached_query == query_lower:
                        keys_to_remove.append(key)
                        invalidated += 1

            for key in keys_to_remove:
                del self.cache[key]

        if invalidated > 0:
            logger.info(f"Invalidated {invalidated} cache entries for query: {query}")
        return invalidated

    def clear(self) -> int:
        """
        Clear all cache entries.

        Returns:
            Number of entries cleared
        """
        with self.lock:
            cleared = len(self.cache)
            self.cache.clear()

        logger.info(f"Cleared {cleared} cache entries")
        return cleared

    def stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        with self.lock:
            total_entries = len(self.cache)
            expired_entries = sum(1 for entry in self.cache.values() if entry.is_expired())
            total_accesses = sum(entry.access_count for entry in self.cache.values())

            return {
                'total_entries': total_entries,
                'expired_entries': expired_entries,
                'valid_entries': total_entries - expired_entries,
                'total_accesses': total_accesses,
                'hit_rate': total_accesses / max(1, total_accesses + (total_entries - total_accesses))
            }

    def _cleanup_expired(self) -> int:
        """Remove expired entries."""
        expired_keys = [key for key, entry in self.cache.items() if entry.is_expired()]
        for key in expired_keys:
            del self.cache[key]
        return len(expired_keys)

    def _evict_lru(self) -> None:
        """Remove least recently used entry."""
        if not self.cache:
            return

        # Find entry with oldest access time
        oldest_key = min(self.cache.keys(),
                        key=lambda k: self.cache[k].timestamp)

        logger.debug(f"Evicting LRU cache entry: {oldest_key[:8]}...")
        del self.cache[oldest_key]

# Global cache instance
analysis_cache = AnalysisCache()