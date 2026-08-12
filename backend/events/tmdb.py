import requests
from django.conf import settings


TMDB_BASE = 'https://api.themoviedb.org/3'


def search_movies(query: str, language: str = 'pt-BR'):
    api_key = (getattr(settings, 'TMDB_API_KEY', None) or '').strip()
    if not api_key:
        raise RuntimeError(
            'TMDB_API_KEY não configurada. Defina no arquivo backend/.env'
        )

    response = requests.get(
        f'{TMDB_BASE}/search/movie',
        params={'api_key': api_key, 'query': query, 'language': language},
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    results = []
    for item in data.get('results', [])[:12]:
        poster = item.get('poster_path')
        results.append(
            {
                'tmdbId': item.get('id'),
                'title': item.get('title') or item.get('original_title'),
                'overview': item.get('overview') or '',
                'imageUrl': (
                    f'https://image.tmdb.org/t/p/w500{poster}' if poster else ''
                ),
                'releaseDate': item.get('release_date') or '',
            }
        )
    return results
