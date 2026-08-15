import requests
from django.conf import settings

TM_BASE = 'https://app.ticketmaster.com/discovery/v2'


class TicketmasterConfigError(Exception):
    pass


def search_attractions(query: str, country_code: str = 'BR'):
    api_key = (getattr(settings, 'TICKETMASTER_API_KEY', None) or '').strip()
    if not api_key:
        raise TicketmasterConfigError(
            'TICKETMASTER_API_KEY não configurada no servidor.'
        )

    response = requests.get(
        f'{TM_BASE}/attractions.json',
        params={
            'apikey': api_key,
            'keyword': query,
            'countryCode': country_code,
            'size': 12,
        },
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    embedded = data.get('_embedded', {})
    attractions = embedded.get('attractions', [])
    results = []
    for item in attractions:
        images = item.get('images') or []
        image_url = ''
        if images:
            image_url = images[0].get('url') or ''
        classifications = item.get('classifications') or []
        genre = ''
        if classifications:
            genre = (classifications[0].get('genre') or {}).get('name') or ''
        results.append(
            {
                'ticketmasterId': item.get('id') or '',
                'title': item.get('name') or '',
                'overview': genre or (item.get('url') or ''),
                'imageUrl': image_url,
                'url': item.get('url') or '',
            }
        )
    return results
