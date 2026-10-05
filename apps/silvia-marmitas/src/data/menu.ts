// Cardápio fixo do protótipo. Para ajustar preços, grupos ou fotos, edite só este arquivo.

/** Desconto do cardápio próprio sobre o preço do iFood (só no item principal). */
export const DISCOUNT_VS_IFOOD = 2;

export const RESTAURANT = {
  name: "Silvia Marmitas & Lanches",
  // TODO: confirmar número real do restaurante (formato 55 + DDD + número).
  whatsapp: process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP ?? "5542999999999",
  // TODO: confirmar endereço/coordenadas exatas (valores abaixo são aproximados de Nova Rússia, Ponta Grossa-PR).
  lat: Number(process.env.NEXT_PUBLIC_RESTAURANT_LAT ?? -25.0945),
  lng: Number(process.env.NEXT_PUBLIC_RESTAURANT_LNG ?? -50.1612),
};

export const RULES = {
  deliveryFee: 8,
  freeDeliveryBeyondKm: 3, // regra simplificada do protótipo: acima de 3 km, frete grátis
  ifoodDeliveryFee: 10,
  minOrder: 0, // 0 = desligado (no iFood é 24,50)
  etaText: "15–25 min",
};

export type Option = { id: string; name: string; price: number };

export type OptionGroup = {
  id: string;
  name: string;
  options: Option[];
  /** Mostra stepper de quantidade por opção (ex.: bebidas). */
  stepper?: boolean;
  /** Permite repetir a mesma opção (ex.: 2× bisteca). Pendente de confirmação com o cliente. */
  allowRepeat?: boolean;
};

export type GroupRef = { id: string; min: number; max: number };

export type Product = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  ifoodPrice: number;
  price: number;
  image: string;
  featured?: boolean;
  groups: GroupRef[];
};

export type CategoryId = "econ" | "monte" | "dia" | "bebidas";

export const CATEGORIES: { id: "destaques" | CategoryId; label: string }[] = [
  { id: "destaques", label: "Destaques" },
  { id: "econ", label: "Marmitas Econômicas" },
  { id: "monte", label: "Monte Sua Marmita" },
  { id: "dia", label: "Marmitas do Dia" },
  { id: "bebidas", label: "Bebidas" },
];

const o = (id: string, name: string, price = 0): Option => ({ id, name, price });

export const GROUPS: Record<string, OptionGroup> = {
  ADICIONAIS: {
    id: "ADICIONAIS",
    name: "Deseja Adicionais?",
    stepper: true,
    options: [
      o("ovo", "Ovo (un)", 4.99),
      o("batata", "Batata Frita", 6),
      o("arroz100", "Arroz 100g", 5),
      o("farofa-calabresa", "Farofa de Calabresa", 3.5),
    ],
  },
  BEBIDAS: {
    id: "BEBIDAS",
    name: "Escolha sua Bebida Favorita!",
    stepper: true,
    options: [
      o("guarana-2l", "Guaraná Uliana 2L", 11.47),
      o("framboesa-2l", "Framboesa Uliana 2L", 11.47),
      o("coca-lata", "Coca-Cola Lata 350ml", 8.99),
      o("agua", "Água Crystal sem gás 500ml", 5.99),
      o("agua-gas", "Água Crystal com gás 500ml", 5.99),
      o("coca-zero-600", "Coca-Cola Zero 600ml", 11.49),
      o("coca-600", "Coca-Cola 600ml", 11.47),
    ],
  },
  PROTEINA_1: {
    id: "PROTEINA_1",
    name: "Escolha sua Proteína!",
    options: [o("ovo-frito", "Ovo Frito"), o("bisteca", "Bisteca"), o("file-frango", "Filé de Frango Grelhado")],
  },
  PROTEINAS_2: {
    id: "PROTEINAS_2",
    name: "Escolha até Duas Proteínas!",
    allowRepeat: false, // TODO: confirmar com o cliente se pode repetir (2× a mesma). Trocar para true libera.
    options: [o("ovo-frito", "Ovo Frito"), o("bisteca", "Bisteca grelhada"), o("file-frango", "Filé de Frango Grelhado")],
  },
  SALADA: {
    id: "SALADA",
    name: "Deseja Salada?",
    options: [o("rucula", "Rúcula (50g)", 1.99), o("beterraba", "Beterraba cozida", 0.99), o("brocolis", "Brócolis", 2.99)],
  },
  TAMANHO: {
    id: "TAMANHO",
    name: "Escolha o Tamanho da Sua Marmita",
    options: [o("tam-m", "Tamanho M"), o("tam-g", "Tamanho G", 4.99)],
  },
  BASES: {
    id: "BASES",
    name: "Bases",
    options: [
      o("macarrao", "Macarrão alho e óleo"),
      o("repolho", "Refogado de Repolho"),
      o("arroz", "Arroz Branco"),
      o("feijao", "Feijão Preto"),
      o("viradinho", "Viradinho de Feijão"),
      o("pure", "Purê"),
      o("capeleti", "Capeleti"),
      o("farofa-legumes", "Farofa de Legumes"),
    ],
  },
  ACOMPANHAMENTO: {
    id: "ACOMPANHAMENTO",
    name: "Acompanhamentos!",
    options: [o("torresmo", "Torresmo"), o("ovo-frito", "Ovo Frito"), o("laranja", "Laranja")],
  },
  TALHER: {
    id: "TALHER",
    name: "Talher",
    options: [o("sim", "Sim, quero talheres"), o("nao", "Não quero talheres")],
  },
};

const g = (id: string, min: number, max: number): GroupRef => ({ id, min, max });

const ECON_DESC =
  "Arroz branco soltinho · Feijão bem temperado · Macarrão ao molho suculento · Farofa de cenoura úmida e saborosa. Escolha sua carne preferida nos complementos.";
const ECON_DESC_P =
  "Arroz branco soltinho · Feijão temperado da casa · Macarrão ao alho e óleo dourado · Farofa crocante de calabresa. Escolha sua carne preferida nos complementos.";
const MONTE_DESC = "Escolha 4 bases, 1 acompanhamento e 2 proteínas e monte do seu jeito.";
const DIA_DESC =
  "Arroz branco soltinho · Feijão bem temperado · Macarrão ao alho e óleo · Farofa de cenoura úmida e saborosa · Refogado de repolho macio. Escolha 2 proteínas.";
const DIA_DESC_P =
  "Arroz branco soltinho · Feijão temperado da casa · Macarrão ao alho e óleo dourado · Farofa crocante de calabresa · Repolho refogado no azeite. Escolha 2 proteínas.";

const own = (ifood: number) => Math.round((ifood - DISCOUNT_VS_IFOOD) * 100) / 100;

const IMG = "/pratos/";
const BEBIDA_PLACEHOLDER = IMG + "bebida.svg"; // TODO: fotos de bebida do iFood retornam 403; substituir.

export const PRODUCTS: Product[] = [
  {
    id: "econ-g",
    category: "econ",
    name: "Marmita G (950ml) – Econômica Filé de Frango ou Bisteca",
    description: ECON_DESC,
    ifoodPrice: 26.98,
    price: own(26.98),
    image: IMG + "eco-g.jpeg",
    groups: [g("ADICIONAIS", 0, 3), g("BEBIDAS", 0, 6), g("PROTEINA_1", 1, 1), g("SALADA", 0, 2), g("TAMANHO", 0, 1), g("TALHER", 0, 1)],
  },
  {
    id: "econ-m",
    category: "econ",
    name: "Marmita M (700ml) – Econômica Filé de Frango ou Bisteca",
    description: ECON_DESC,
    ifoodPrice: 24.9,
    price: own(24.9),
    image: IMG + "eco-m.jpeg",
    groups: [g("ADICIONAIS", 0, 3), g("BEBIDAS", 0, 6), g("PROTEINA_1", 1, 1), g("SALADA", 0, 2), g("TAMANHO", 0, 1), g("TALHER", 1, 1)],
  },
  {
    id: "econ-p",
    category: "econ",
    name: "Marmita P (500ml) – Econômica Filé de Frango ou Bisteca",
    description: ECON_DESC_P,
    ifoodPrice: 22.8,
    price: own(22.8),
    image: IMG + "eco-p.jpeg",
    groups: [g("ADICIONAIS", 0, 1), g("BEBIDAS", 0, 1), g("PROTEINA_1", 1, 1), g("SALADA", 0, 2), g("TAMANHO", 0, 1), g("TALHER", 1, 1)],
  },
  {
    id: "monte-p",
    category: "monte",
    name: "Marmita P (Monte)",
    description: MONTE_DESC,
    ifoodPrice: 26.8,
    price: own(26.8),
    image: IMG + "monte-p.jpeg",
    featured: true,
    groups: [g("BEBIDAS", 0, 1), g("BASES", 4, 4), g("ACOMPANHAMENTO", 0, 1), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 0, 1)],
  },
  {
    id: "monte-m",
    category: "monte",
    name: "Marmita M (Monte)",
    description: MONTE_DESC,
    ifoodPrice: 27.9,
    price: own(27.9),
    image: IMG + "monte-m.jpeg",
    featured: true,
    groups: [g("BEBIDAS", 0, 1), g("BASES", 4, 4), g("ACOMPANHAMENTO", 1, 1), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 0, 1), g("ADICIONAIS", 0, 5)],
  },
  {
    id: "monte-g",
    category: "monte",
    name: "Marmita G (Monte)",
    description: MONTE_DESC,
    // No iFood a G aparece hoje por R$ 27,90 (promoção). Preço cheio de catálogo: R$ 29,90 ("de" riscado R$ 43,50).
    ifoodPrice: 27.9,
    price: own(27.9),
    image: IMG + "monte-g.jpeg",
    featured: true,
    groups: [g("BEBIDAS", 0, 1), g("BASES", 4, 4), g("ACOMPANHAMENTO", 1, 1), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 1, 1)],
  },
  {
    id: "dia-p",
    category: "dia",
    name: "Marmita do Dia (Pequena)",
    description: DIA_DESC_P,
    ifoodPrice: 22.9,
    price: own(22.9),
    image: IMG + "dia-p.jpeg",
    featured: true,
    groups: [g("ADICIONAIS", 0, 1), g("BEBIDAS", 0, 1), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 1, 1)],
  },
  {
    id: "dia-m",
    category: "dia",
    name: "Marmita do Dia (Média)",
    description: DIA_DESC,
    ifoodPrice: 28.6,
    price: own(28.6),
    image: IMG + "dia-m.jpeg",
    groups: [g("ADICIONAIS", 0, 3), g("BEBIDAS", 0, 10), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 1, 1)],
  },
  {
    id: "dia-g",
    category: "dia",
    name: "Marmita do Dia (Grande)",
    description: DIA_DESC,
    ifoodPrice: 38.1,
    price: own(38.1),
    image: IMG + "dia-g.jpeg",
    groups: [g("ADICIONAIS", 0, 3), g("BEBIDAS", 0, 6), g("PROTEINAS_2", 2, 2), g("SALADA", 0, 5), g("TALHER", 0, 1)],
  },
  // Bebidas avulsas: sem desconto (preço do iFood = preço próprio).
  ...[
    ["agua", "Água Mineral Sem Gás Crystal 500ml", 5.99],
    ["agua-gas", "Água Mineral Com Gás Crystal 500ml", 5.99],
    ["coca", "Coca-Cola 350ml", 8.99],
    ["coca-zero", "Coca-Cola Zero 350ml", 8.99],
  ].map(
    ([id, name, price]): Product => ({
      id: `beb-${id}`,
      category: "bebidas",
      name: name as string,
      description: "Gelada, direto da geladeira.",
      ifoodPrice: price as number,
      price: price as number,
      image: BEBIDA_PLACEHOLDER,
      groups: [],
    }),
  ),
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
