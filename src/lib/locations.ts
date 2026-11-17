/**
 * Nigerian cities and towns for the location picker, grouped by state.
 * Typing a town ("osogbo") completes it to the full location
 * ("Osogbo, Osun State, Nigeria"). Bundled like the university list; the
 * picker still accepts a typed place that is not listed.
 */
const TOWNS_BY_STATE: Record<string, string[]> = {
  'Abia State': ['Umuahia', 'Aba', 'Ohafia', 'Arochukwu', 'Bende'],
  'Adamawa State': ['Yola', 'Jimeta', 'Mubi', 'Numan', 'Ganye'],
  'Akwa Ibom State': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak'],
  'Anambra State': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Ihiala', 'Agulu'],
  'Bauchi State': ['Bauchi', 'Azare', 'Misau', "Jama'are"],
  'Bayelsa State': ['Yenagoa', 'Brass', 'Ogbia', 'Sagbama'],
  'Benue State': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'],
  'Borno State': ['Maiduguri', 'Biu', 'Bama', 'Monguno'],
  'Cross River State': ['Calabar', 'Ikom', 'Ogoja', 'Ugep', 'Obudu'],
  'Delta State': ['Asaba', 'Warri', 'Effurun', 'Sapele', 'Ughelli', 'Agbor', 'Abraka', 'Oleh'],
  'Ebonyi State': ['Abakaliki', 'Afikpo', 'Onueke'],
  'Edo State': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Igarra'],
  'Ekiti State': ['Ado-Ekiti', 'Ikere-Ekiti', 'Ikole-Ekiti', 'Oye-Ekiti', 'Ijero-Ekiti'],
  'Enugu State': ['Enugu', 'Nsukka', 'Agbani', 'Oji River', 'Udi'],
  FCT: ['Abuja', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi', 'Utako', 'Life Camp', 'Kubwa', 'Lugbe', 'Gwagwalada', 'Kuje', 'Bwari'],
  'Gombe State': ['Gombe', 'Kumo', 'Billiri', 'Kaltungo'],
  'Imo State': ['Owerri', 'Orlu', 'Okigwe', 'Oguta'],
  'Jigawa State': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Birnin Kudu'],
  'Kaduna State': ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro'],
  'Kano State': ['Kano', 'Wudil', 'Gaya', 'Rano'],
  'Katsina State': ['Katsina', 'Funtua', 'Daura', 'Malumfashi', 'Dutsin-Ma'],
  'Kebbi State': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru'],
  'Kogi State': ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Anyigba', 'Ankpa'],
  'Kwara State': ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba', 'Lafiagi'],
  'Lagos State': [
    'Lagos', 'Ikeja', 'Lekki', 'Victoria Island', 'Ikoyi', 'Lagos Island', 'Yaba', 'Surulere', 'Ajah',
    'Sangotedo', 'Ibeju-Lekki', 'Apapa', 'Festac Town', 'Ojo', 'Alimosho', 'Ikotun', 'Oshodi', 'Isolo',
    'Mushin', 'Maryland', 'Ojota', 'Gbagada', 'Magodo', 'Ogba', 'Agege', 'Ikorodu', 'Epe', 'Badagry',
  ],
  'Nasarawa State': ['Lafia', 'Keffi', 'Akwanga', 'Karu', 'Mararaba', 'Nasarawa'],
  'Niger State': ['Minna', 'Bida', 'Suleja', 'Kontagora', 'New Bussa'],
  'Ogun State': ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota', 'Sango-Ota', 'Ilaro', 'Ago-Iwoye', 'Mowe', 'Ifo', 'Ilishan-Remo'],
  'Ondo State': ['Akure', 'Ondo', 'Owo', 'Ikare-Akoko', 'Okitipupa', 'Ore'],
  'Osun State': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo', 'Ikirun', 'Ila-Orangun', 'Ejigbo'],
  'Oyo State': ['Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki', 'Igboho', 'Eruwa'],
  'Plateau State': ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Vom'],
  'Rivers State': ['Port Harcourt', 'Obio-Akpor', 'Rumuokoro', 'Trans-Amadi', 'Eleme', 'Onne', 'Bonny', 'Omoku', 'Ahoada'],
  'Sokoto State': ['Sokoto', 'Tambuwal', 'Wamakko', 'Gwadabawa'],
  'Taraba State': ['Jalingo', 'Wukari', 'Bali', 'Takum', 'Serti'],
  'Yobe State': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru'],
  'Zamfara State': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka'],
}

/** "Town, State, Nigeria" for every listed town, then each state on its own. */
export const NIGERIAN_LOCATIONS: readonly string[] = [
  ...Object.entries(TOWNS_BY_STATE).flatMap(([state, towns]) => towns.map(town => `${town}, ${state}, Nigeria`)),
  ...Object.keys(TOWNS_BY_STATE).map(state => `${state}, Nigeria`),
]

/** "Town, State" for a City field that sits next to a separate Country field. */
export const NIGERIAN_CITIES: readonly string[] = Object.entries(TOWNS_BY_STATE).flatMap(([state, towns]) =>
  towns.map(town => `${town}, ${state}`),
)

/** City suggestions only exist for Nigeria; other countries take a typed city. */
export function citiesFor(country: string): readonly string[] {
  const value = country.trim().toLowerCase()
  return !value || value === 'nigeria' ? NIGERIAN_CITIES : []
}

/** Nigeria first, then every other country A–Z. */
export const COUNTRIES: readonly string[] = [
  'Nigeria',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Congo', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Türkiye', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]
