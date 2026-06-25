const TEAM_FLAGS = {
  Algeria: 'DZ',
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Belgium: 'BE',
  'Bosnia-Herzegovina': 'BA',
  Brazil: 'BR',
  Canada: 'CA',
  'Cape Verde Islands': 'CV',
  Colombia: 'CO',
  'Congo DR': 'CD',
  Croatia: 'HR',
  Curaçao: 'CW',
  Czechia: 'CZ',
  Ecuador: 'EC',
  Egypt: 'EG',
  England: 'gb-eng',
  France: 'FR',
  Germany: 'DE',
  Ghana: 'GH',
  Haiti: 'HT',
  Iran: 'IR',
  Iraq: 'IQ',
  'Ivory Coast': 'CI',
  Japan: 'JP',
  Jordan: 'JO',
  Mexico: 'MX',
  Morocco: 'MA',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Norway: 'NO',
  Panama: 'PA',
  Paraguay: 'PY',
  Portugal: 'PT',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Scotland: 'gb-sct',
  Senegal: 'SN',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Spain: 'ES',
  Sweden: 'SE',
  Switzerland: 'CH',
  Tunisia: 'TN',
  Turkey: 'TR',
  'United States': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
};

function flagEmoji(code) {
  if (!code) return '';
  const c = code.toLowerCase();
  if (c.includes('-')) {
    const tagBase = 0xE0000;
    const cancelTag = 0xE007F;
    const subCode = c.replace('-', '');
    const points = [0x1F3F4];
    for (const ch of subCode) {
      points.push(tagBase + ch.charCodeAt(0));
    }
    points.push(cancelTag);
    return String.fromCodePoint(...points);
  }
  if (c.length !== 2) return '';
  const codePoints = [...c.toUpperCase()].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export function getTeamFlag(teamName) {
  const code = TEAM_FLAGS[teamName];
  return code ? flagEmoji(code) : '';
}
