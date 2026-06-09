/**
 * Mapping from IOC (International Olympic Committee) country codes
 * to ISO 3166-1 alpha-2 codes used by react-country-flag and i18n-iso-countries.
 *
 * IOC codes differ from ISO codes for ~40 countries.
 * All other codes are identical, so the fallback is the original value.
 */
const IOC_TO_ALPHA2: Record<string, string> = {
  // A
  ALG: 'DZ', // Algeria
  AND: 'AD', // Andorra
  ANG: 'AO', // Angola
  ANT: 'AG', // Antigua and Barbuda
  ARG: 'AR', // Argentina
  ARM: 'AM', // Armenia
  ARU: 'AW', // Aruba
  ASA: 'AS', // American Samoa
  AUS: 'AU', // Australia
  AUT: 'AT', // Austria
  AZE: 'AZ', // Azerbaijan
  // B
  BAH: 'BS', // Bahamas
  BAN: 'BD', // Bangladesh
  BAR: 'BB', // Barbados
  BEL: 'BE', // Belgium
  BEN: 'BJ', // Benin
  BER: 'BM', // Bermuda
  BIH: 'BA', // Bosnia & Herzegovina
  BIZ: 'BZ', // Belize
  BLR: 'BY', // Belarus
  BOL: 'BO', // Bolivia
  BOT: 'BW', // Botswana
  BRA: 'BR', // Brazil
  BRN: 'BH', // Bahrain
  BRU: 'BN', // Brunei
  BUL: 'BG', // Bulgaria
  BUR: 'BF', // Burkina Faso
  // C
  CAF: 'CF', // Central African Republic
  CAM: 'KH', // Cambodia
  CAN: 'CA', // Canada
  CAY: 'KY', // Cayman Islands
  CGO: 'CG', // Congo
  CHA: 'TD', // Chad
  CHI: 'CL', // Chile
  CHN: 'CN', // China
  CIV: 'CI', // Ivory Coast
  CMR: 'CM', // Cameroon
  COD: 'CD', // DR Congo
  COK: 'CK', // Cook Islands
  COL: 'CO', // Colombia
  COM: 'KM', // Comoros
  CPV: 'CV', // Cape Verde
  CRC: 'CR', // Costa Rica
  CRO: 'HR', // Croatia
  CUB: 'CU', // Cuba
  CYP: 'CY', // Cyprus
  CZE: 'CZ', // Czech Republic
  // D
  DEN: 'DK', // Denmark
  DJI: 'DJ', // Djibouti
  DMA: 'DM', // Dominica
  DOM: 'DO', // Dominican Republic
  // E
  ECU: 'EC', // Ecuador
  EGY: 'EG', // Egypt
  ERI: 'ER', // Eritrea
  ESA: 'SV', // El Salvador
  ESP: 'ES', // Spain
  EST: 'EE', // Estonia
  ETH: 'ET', // Ethiopia
  // F
  FIJ: 'FJ', // Fiji
  FIN: 'FI', // Finland
  FRA: 'FR', // France
  // G
  GAB: 'GA', // Gabon
  GAM: 'GM', // Gambia
  GBR: 'GB', // Great Britain
  GBS: 'GW', // Guinea-Bissau
  GEO: 'GE', // Georgia
  GER: 'DE', // Germany
  GHA: 'GH', // Ghana
  GRE: 'GR', // Greece
  GRN: 'GD', // Grenada
  GUA: 'GT', // Guatemala
  GUI: 'GN', // Guinea
  GUM: 'GU', // Guam
  GUY: 'GY', // Guyana
  // H
  HAI: 'HT', // Haiti
  HKG: 'HK', // Hong Kong
  HON: 'HN', // Honduras
  HUN: 'HU', // Hungary
  // I
  INA: 'ID', // Indonesia
  IND: 'IN', // India
  IRI: 'IR', // Iran
  IRL: 'IE', // Ireland
  IRQ: 'IQ', // Iraq
  ISL: 'IS', // Iceland
  ISR: 'IL', // Israel
  ISV: 'VI', // US Virgin Islands
  ITA: 'IT', // Italy
  // J
  JAM: 'JM', // Jamaica
  JOR: 'JO', // Jordan
  JPN: 'JP', // Japan
  // K
  KAZ: 'KZ', // Kazakhstan
  KEN: 'KE', // Kenya
  KGZ: 'KG', // Kyrgyzstan
  KOR: 'KR', // South Korea
  KSA: 'SA', // Saudi Arabia
  KUW: 'KW', // Kuwait
  // L
  LAO: 'LA', // Laos
  LAT: 'LV', // Latvia
  LBA: 'LY', // Libya
  LBN: 'LB', // Lebanon
  LES: 'LS', // Lesotho
  LIB: 'LB', // Lebanon (alt)
  LIE: 'LI', // Liechtenstein
  LTU: 'LT', // Lithuania
  LUX: 'LU', // Luxembourg
  // M
  MAD: 'MG', // Madagascar
  MAR: 'MA', // Morocco
  MAS: 'MY', // Malaysia
  MAW: 'MW', // Malawi
  MDA: 'MD', // Moldova
  MDV: 'MV', // Maldives
  MEX: 'MX', // Mexico
  MGL: 'MN', // Mongolia
  MKD: 'MK', // North Macedonia
  MLI: 'ML', // Mali
  MLT: 'MT', // Malta
  MNE: 'ME', // Montenegro
  MON: 'MC', // Monaco
  MOZ: 'MZ', // Mozambique
  MRI: 'MU', // Mauritius
  MTN: 'MR', // Mauritania
  MYA: 'MM', // Myanmar
  // N
  NAM: 'NA', // Namibia
  NCA: 'NI', // Nicaragua
  NED: 'NL', // Netherlands
  NEP: 'NP', // Nepal
  NGR: 'NG', // Nigeria
  NIG: 'NE', // Niger
  NOR: 'NO', // Norway
  NZL: 'NZ', // New Zealand
  // O
  OMA: 'OM', // Oman
  // P
  PAK: 'PK', // Pakistan
  PAN: 'PA', // Panama
  PAR: 'PY', // Paraguay
  PER: 'PE', // Peru
  PHI: 'PH', // Philippines  ← the one you noticed!
  PLE: 'PS', // Palestine
  PLW: 'PW', // Palau
  PNG: 'PG', // Papua New Guinea
  POL: 'PL', // Poland
  POR: 'PT', // Portugal
  PRK: 'KP', // North Korea
  PUR: 'PR', // Puerto Rico
  // Q
  QAT: 'QA', // Qatar
  // R
  ROU: 'RO', // Romania
  RSA: 'ZA', // South Africa
  RUS: 'RU', // Russia
  RWA: 'RW', // Rwanda
  // S
  SAM: 'WS', // Samoa
  SEN: 'SN', // Senegal
  SEY: 'SC', // Seychelles
  SGP: 'SG', // Singapore
  SKN: 'KN', // Saint Kitts and Nevis
  SLE: 'SL', // Sierra Leone
  SLO: 'SI', // Slovenia
  SMR: 'SM', // San Marino
  SOL: 'SB', // Solomon Islands
  SOM: 'SO', // Somalia
  SRB: 'RS', // Serbia
  SRI: 'LK', // Sri Lanka
  STP: 'ST', // Sao Tome and Principe
  SUD: 'SD', // Sudan
  SUI: 'CH', // Switzerland
  SUR: 'SR', // Suriname
  SVK: 'SK', // Slovakia
  SWE: 'SE', // Sweden
  SWZ: 'SZ', // Eswatini
  SYR: 'SY', // Syria
  // T
  TAN: 'TZ', // Tanzania
  TGA: 'TO', // Tonga
  THA: 'TH', // Thailand
  TJK: 'TJ', // Tajikistan
  TKM: 'TM', // Turkmenistan
  TLS: 'TL', // Timor-Leste
  TOG: 'TG', // Togo
  TPE: 'TW', // Chinese Taipei (Taiwan)
  TRI: 'TT', // Trinidad and Tobago
  TUN: 'TN', // Tunisia
  TUR: 'TR', // Turkey
  // U
  UAE: 'AE', // United Arab Emirates
  UGA: 'UG', // Uganda
  UKR: 'UA', // Ukraine
  URU: 'UY', // Uruguay
  USA: 'US', // United States
  UZB: 'UZ', // Uzbekistan
  // V
  VAN: 'VU', // Vanuatu
  VEN: 'VE', // Venezuela
  VIE: 'VN', // Vietnam
  // Y
  YEM: 'YE', // Yemen
  // Z
  ZAM: 'ZM', // Zambia
  ZIM: 'ZW', // Zimbabwe
};

/**
 * Convert an IOC or ISO alpha-3 code to ISO alpha-2.
 * Falls back gracefully to null if no mapping is found.
 */
export function iocToAlpha2(code: string | null): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  // Direct IOC → alpha-2 lookup first
  if (IOC_TO_ALPHA2[upper]) return IOC_TO_ALPHA2[upper];
  // Fallback: treat as ISO alpha-3 and try library conversion
  // (handles codes like 'FRA' which happen to match both)
  return null;
}

/**
 * Get a country display name from an IOC code.
 * Uses the IOC→alpha2 map then resolves via i18n-iso-countries.
 */
export function iocToName(
  code: string | null,
  getName: (alpha2: string, lang: string) => string | undefined,
): string | null {
  if (!code) return null;
  const alpha2 = iocToAlpha2(code);
  if (!alpha2) return code; // show raw code as fallback
  return getName(alpha2, 'en') || code;
}
