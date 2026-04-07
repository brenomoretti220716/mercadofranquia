/**
 * Canonical segment and subsegment lists for franchise classification.
 * Keep in sync with franchise-web:
 *   - franchise-web/src/data/quiz-segments.ts (QUIZ_SEGMENTS, QUIZ_SUBSEGMENTS)
 *   - franchise-web/src/schemas/segments/segments.ts (SEGMENTS)
 */

export type QuizSegmentKey =
  | 'Serviços e Outros Negócios'
  | 'Serviços Automotivos'
  | 'Alimentação'
  | 'Casa e Construção'
  | 'Comunicação, Informática e Eletrônicos'
  | 'Educação'
  | 'Entretenimento e Lazer'
  | 'Hotelaria e Turismo'
  | 'Limpeza e Conservação'
  | 'Moda'
  | 'Saúde, Beleza e Bem-Estar';

export interface QuizSubsegmentItem {
  segment: QuizSegmentKey;
  value: string;
  label: string;
}

export const QUIZ_SEGMENTS: QuizSegmentKey[] = [
  'Serviços e Outros Negócios',
  'Serviços Automotivos',
  'Alimentação',
  'Casa e Construção',
  'Comunicação, Informática e Eletrônicos',
  'Educação',
  'Entretenimento e Lazer',
  'Hotelaria e Turismo',
  'Limpeza e Conservação',
  'Moda',
  'Saúde, Beleza e Bem-Estar',
];

export const QUIZ_SUBSEGMENTS: QuizSubsegmentItem[] = [
  {
    segment: 'Alimentação',
    value: 'Bares e Restaurantes',
    label: 'Bares e Restaurantes',
  },
  {
    segment: 'Alimentação',
    value: 'Docerias, Padarias e Cafés',
    label: 'Docerias, Padarias e Cafés',
  },
  {
    segment: 'Alimentação',
    value: 'Mercados e Distribuição',
    label: 'Mercados e Distribuição',
  },
  { segment: 'Alimentação', value: 'Saudáveis', label: 'Saudáveis' },
  {
    segment: 'Alimentação',
    value: 'Sorveterias, Açaíterias, Gelatterias',
    label: 'Sorveterias, Açaíterias, Gelatterias',
  },
  {
    segment: 'Casa e Construção',
    value: 'Construção e Reforma',
    label: 'Construção e Reforma',
  },
  {
    segment: 'Casa e Construção',
    value: 'Móveis e Decoração',
    label: 'Móveis e Decoração',
  },
  {
    segment: 'Casa e Construção',
    value: 'Serviços e Imobiliárias',
    label: 'Serviços e Imobiliárias',
  },
  {
    segment: 'Comunicação, Informática e Eletrônicos',
    value: 'Comunicação e Mídia',
    label: 'Comunicação e Mídia',
  },
  {
    segment: 'Comunicação, Informática e Eletrônicos',
    value: 'Serviços Gráficos e Impressão',
    label: 'Serviços Gráficos e Impressão',
  },
  {
    segment: 'Comunicação, Informática e Eletrônicos',
    value: 'Tecnologia e Eletrônicos',
    label: 'Tecnologia e Eletrônicos',
  },
  {
    segment: 'Educação',
    value: 'Ensino e Formação Acadêmica',
    label: 'Ensino e Formação Acadêmica',
  },
  { segment: 'Educação', value: 'Idiomas', label: 'Idiomas' },
  {
    segment: 'Educação',
    value: 'Treinamento Profissional e Capacitação',
    label: 'Treinamento Profissional e Capacitação',
  },
  {
    segment: 'Entretenimento e Lazer',
    value: 'Lazer Infantil e Recreação',
    label: 'Lazer Infantil e Recreação',
  },
  {
    segment: 'Entretenimento e Lazer',
    value: 'Serviços de Entretenimento e Experiências',
    label: 'Serviços de Entretenimento e Experiências',
  },
  {
    segment: 'Hotelaria e Turismo',
    value: 'Agências de Turismo',
    label: 'Agências de Turismo',
  },
  { segment: 'Hotelaria e Turismo', value: 'Hospedagem', label: 'Hospedagem' },
  {
    segment: 'Limpeza e Conservação',
    value: 'Lavanderia',
    label: 'Lavanderia',
  },
  { segment: 'Limpeza e Conservação', value: 'Reparos', label: 'Reparos' },
  {
    segment: 'Limpeza e Conservação',
    value: 'Serviços de Limpeza',
    label: 'Serviços de Limpeza',
  },
  {
    segment: 'Moda',
    value: 'Acessórios Pessoais',
    label: 'Acessórios Pessoais',
  },
  { segment: 'Moda', value: 'Calçados', label: 'Calçados' },
  { segment: 'Moda', value: 'Vestuários', label: 'Vestuários' },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Cosméticos e Perfumarias',
    label: 'Cosméticos e Perfumarias',
  },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Esportes e Vida Ativa',
    label: 'Esportes e Vida Ativa',
  },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Farmácias e Manipulação',
    label: 'Farmácias e Manipulação',
  },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Odontologia',
    label: 'Odontologia',
  },
  { segment: 'Saúde, Beleza e Bem-Estar', value: 'Óticas', label: 'Óticas' },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Serviços Estéticos e Bem-Estar',
    label: 'Serviços Estéticos e Bem-Estar',
  },
  {
    segment: 'Saúde, Beleza e Bem-Estar',
    value: 'Serviços Médicos e Clínicas',
    label: 'Serviços Médicos e Clínicas',
  },
  {
    segment: 'Serviços Automotivos',
    value: 'Locação de veículos',
    label: 'Locação de veículos',
  },
  {
    segment: 'Serviços Automotivos',
    value: 'Peças, Acessórios e Manutenção',
    label: 'Peças, Acessórios e Manutenção',
  },
  {
    segment: 'Serviços e Outros Negócios',
    value: 'Consultorias e Serviços Empresariais',
    label: 'Consultorias e Serviços Empresariais',
  },
  {
    segment: 'Serviços e Outros Negócios',
    value: 'Logística e Operações',
    label: 'Logística e Operações',
  },
  {
    segment: 'Serviços e Outros Negócios',
    value: 'Negócios Especializados',
    label: 'Negócios Especializados',
  },
  {
    segment: 'Serviços e Outros Negócios',
    value: 'Pet Shop',
    label: 'Pet Shop',
  },
];

/** ABF-style segment labels (from franchise-web/src/schemas/segments/segments.ts) */
export const SEGMENTS_ABF = [
  'Alimentação - Comercialização e Distribuição',
  'Entretenimento e Lazer',
  'Limpeza e Conservação',
  'Saúde, Beleza e Bem-estar',
  'Serviços automotivos',
  'Alimentação - Food Service',
  'Hotelaria e Turismo',
  'Comunicação, Informática e Eletrônicos',
  'Moda',
  'Casa e Construção',
  'Serviços e Outros Negócios',
  'Educação',
] as const;
