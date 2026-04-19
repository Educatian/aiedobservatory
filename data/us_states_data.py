"""US state geographic and demographic data"""

STATE_FIPS = {
    'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06',
    'CO': '08', 'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13',
    'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19',
    'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
    'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29',
    'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
    'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
    'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
    'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49', 'VT': '50',
    'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56',
}

STATE_POPULATIONS = {
    'CA': 39.0, 'TX': 30.0, 'FL': 22.2, 'NY': 19.5, 'PA': 12.9,
    'IL': 12.6, 'OH': 11.8, 'GA': 10.9, 'NC': 10.7, 'MI': 10.0,
    'NJ': 9.3, 'VA': 8.6, 'WA': 7.8, 'AZ': 7.4, 'MA': 7.0,
    'TN': 7.0, 'IN': 6.8, 'MO': 6.2, 'MD': 6.2, 'WI': 5.9,
    'CO': 5.8, 'MN': 5.7, 'SC': 5.3, 'AL': 5.1, 'LA': 4.6,
    'KY': 4.5, 'OR': 4.2, 'OK': 4.0, 'CT': 3.6, 'UT': 3.4,
    'IA': 3.2, 'NV': 3.2, 'AR': 3.0, 'MS': 2.9, 'KS': 2.9,
    'NM': 2.1, 'NE': 2.0, 'ID': 1.9, 'WV': 1.8, 'HI': 1.4,
    'NH': 1.4, 'ME': 1.4, 'RI': 1.1, 'MT': 1.1, 'DE': 1.0,
    'SD': 0.9, 'ND': 0.8, 'AK': 0.7, 'VT': 0.6, 'WY': 0.6,
}


def get_state_fips(state_abbr: str) -> str:
    return STATE_FIPS.get(state_abbr, '00')


def get_state_population(state_abbr: str) -> float:
    return STATE_POPULATIONS.get(state_abbr, 0.0)
