// Destination and transit countries an ATA Carnet can be used in, as supplied by the user (20 October 2026).
// EU member states are covered by the single "European Union" entry.
export const ATA_CARNET_COUNTRIES = [
  'Albania', 'Algeria', 'Andorra', 'Australia', 'Bahrain', 'Belarus', 'Bosnia & Herzegovina', 'Botswana', 'Canada',
  'Canary Islands', 'Ceuta', 'Chile', 'China', "Côte d'Ivoire", 'European Union', 'Faroe Islands', 'French Guiana',
  'French Polynesia', 'Gibraltar', 'Guadeloupe', 'Guernsey', 'Hong Kong, China', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Israel', 'Japan', 'Jersey', 'Kazakhstan', 'Kingdom of Eswatini', 'Lebanon', 'Lesotho', 'Liechtenstein', 'Macau',
  'Macedonia', 'Madagascar', 'Malaysia', 'Martinique', 'Mauritius', 'Mayotte', 'Melilla', 'Mexico', 'Moldova', 'Mongolia',
  'Montenegro', 'Morocco', 'Namibia', 'New Caledonia', 'New Zealand', 'Norway', 'Pakistan', 'Peru', 'Philippines',
  'Puerto Rico', 'Qatar', 'Republic of Korea', 'Reunion', 'Russian Federation', 'Saint Barthélemy',
  'Saint Martin (French part)', 'Saint Pierre et Miquelon', 'Saipan', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore',
  'South Africa', 'Sri Lanka', 'Switzerland', 'Thailand', 'Tunisia', 'Türkiye', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'USA', 'Vietnam', 'Wallis and Futuna',
];

export const isAtaCarnetCountry = country => ATA_CARNET_COUNTRIES.includes(country);

/** Dropdown options; a saved country that is no longer on the list stays visible so it can be changed. */
export function ataCountryOptions(current) {
  const options = ATA_CARNET_COUNTRIES.map(country => ({value: country, label: country}));
  return current && !isAtaCarnetCountry(current) ? [{value: current, label: `${current} (not on the ATA Carnet list)`}, ...options] : options;
}

// Goods types for Box C (Intended use of Goods), in the order supplied by the user (20 October 2026).
export const ATA_GOODS_TYPES = [
  'Antiques', 'Books', 'Caravans', 'Carpets and Rugs', 'Catering Equipment', 'Clothing', 'Computer Equipment',
  'Concert and Musical Equipment - Electric/Electronic', 'Concert and Musical Equipment - non Electric/Electronic',
  'Display Stands', 'Electric/Electronic and Scientific Video Equipment (excluding Computers)', 'Engine Machinery',
  'Footwear', 'Furniture and Furnishings', 'Hand Tools', 'Hides, Skins, Furs and Leather Goods',
  'Imitation/Costume Jewellery', 'Jewellery and Articles of Precious Metal/Stones', 'Livestock', 'Loose Precious Stones',
  'Machinery (non electrical)', 'Original Paintings/Works of Art', 'Sports Equipment', 'Stamps',
  'Still Photography (35mm film)', 'Theatrical Effects', 'Toys (Electric or not)', 'Yachts and Boats',
];
/** Dropdown options in the supplied order; an older saved type stays visible so it can be changed. */
export function ataGoodsTypeOptions(current) {
  const options = ATA_GOODS_TYPES.map(type => ({value: type, label: type}));
  return current && !ATA_GOODS_TYPES.includes(current) ? [{value: current, label: `${current} (not on the list)`}, ...options] : options;
}
