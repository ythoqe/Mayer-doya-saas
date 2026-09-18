export type CanonicalChemicalCategory = 
  | 'জুট'
  | 'ব্লিচিং'
  | 'সোডা'
  | 'কাস্টিং'
  | 'এসিড'
  | 'ব্লু'
  | 'বিএমবি';

export interface ChemicalCategoryDefinition {
  id: CanonicalChemicalCategory;
  bn: string;
  en: string;
  aliases: string[];
}

/**
 * Strictly restricted 7 chemical categories for Mayer Doya Washing & Dyeing Factory ERP.
 * 1. জুট (Jute)
 * 2. ব্লিচিং (Bleaching)
 * 3. সোডা (Soda)
 * 4. কাস্টিং (Casting)
 * 5. এসিড (Acid)
 * 6. ব্লু (Blue)
 * 7. বিএমবি (BMB)
 */
export const CHEMICAL_CATEGORIES: ChemicalCategoryDefinition[] = [
  {
    id: 'জুট',
    bn: 'জুট',
    en: 'Jute',
    aliases: ['জুট', 'Jute', 'jute', 'Jute Chemical', 'jute chemical']
  },
  {
    id: 'ব্লিচিং',
    bn: 'ব্লিচিং',
    en: 'Bleaching',
    aliases: ['ব্লিচিং', 'Bleaching', 'Bleach', 'bleaching', 'bleach', 'Oxidizer']
  },
  {
    id: 'সোডা',
    bn: 'সোডা',
    en: 'Soda',
    aliases: ['সোডা', 'Soda', 'soda', 'Alkali', 'alkali', 'Soda Ash']
  },
  {
    id: 'কাস্টিং',
    bn: 'কাস্টিং',
    en: 'Casting',
    aliases: ['কাস্টিং', 'Casting', 'casting', 'Caustic', 'caustic', 'Caustic Soda']
  },
  {
    id: 'এসিড',
    bn: 'এসিড',
    en: 'Acid',
    aliases: ['এসিড', 'Acid', 'acid', 'Acetic Acid', 'Oxalic Acid']
  },
  {
    id: 'ব্লু',
    bn: 'ব্লু',
    en: 'Blue',
    aliases: ['ব্লু', 'Blue', 'blue', 'Dye', 'dye', 'Colorant', 'colorant', 'Indigo']
  },
  {
    id: 'বিএমবি',
    bn: 'বিএমবি',
    en: 'BMB',
    aliases: ['বিএমবি', 'BMB', 'bmb', 'Bmb', 'BMB Auxiliary', 'Auxiliary']
  }
];

/**
 * Normalizes any category string (including legacy ones) into one of the 7 canonical categories.
 */
export const normalizeChemicalCategory = (rawCategory: string | undefined | null): CanonicalChemicalCategory => {
  if (!rawCategory) return 'জুট';
  const trimmed = rawCategory.trim();

  // Direct match on id, bn, or en
  const exact = CHEMICAL_CATEGORIES.find(
    c => c.id === trimmed || c.bn === trimmed || c.en.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact.id;

  // Match alias
  const aliasMatch = CHEMICAL_CATEGORIES.find(c =>
    c.aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())
  );
  if (aliasMatch) return aliasMatch.id;

  return 'জুট';
};

/**
 * Returns the display label for a chemical category in the selected language.
 * Preserves legacy categories for existing database records without breaking.
 */
export const getCategoryLabel = (category: string | undefined | null, lang: 'bn' | 'en' = 'bn'): string => {
  if (!category) return '';
  const trimmed = category.trim();

  const found = CHEMICAL_CATEGORIES.find(
    c => c.id === trimmed || c.bn === trimmed || c.en.toLowerCase() === trimmed.toLowerCase() || c.aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())
  );

  if (found) {
    return lang === 'bn' ? found.bn : found.en;
  }

  // Graceful fallback for legacy database items (Enzyme, Softener, Detergent, Other)
  if (lang === 'bn') {
    const legacyBnMap: Record<string, string> = {
      'Enzyme': 'এনজাইম',
      'Softener': 'সফটনার',
      'Detergent': 'ডিটারজেন্ট',
      'Fixing Agent': 'ফিক্সিং এজেন্ট',
      'Other': 'অন্যান্য'
    };
    return legacyBnMap[trimmed] || trimmed;
  }

  return trimmed;
};

/**
 * Checks whether an inventory item's category matches a selected filter.
 * Supports legacy categories, English and Bengali representations.
 */
export const matchesChemicalCategory = (itemCategory: string | undefined | null, filterCategory: string): boolean => {
  if (!filterCategory || filterCategory === 'all') return true;
  if (!itemCategory) return false;

  const itemTrim = itemCategory.trim().toLowerCase();
  const filterTrim = filterCategory.trim().toLowerCase();

  if (itemTrim === filterTrim) return true;

  // Look up filter category in canonical list
  const target = CHEMICAL_CATEGORIES.find(
    c => c.id.toLowerCase() === filterTrim || c.bn.toLowerCase() === filterTrim || c.en.toLowerCase() === filterTrim
  );

  if (target) {
    if (
      target.id.toLowerCase() === itemTrim ||
      target.bn.toLowerCase() === itemTrim ||
      target.en.toLowerCase() === itemTrim
    ) {
      return true;
    }
    return target.aliases.some(a => a.toLowerCase() === itemTrim);
  }

  return false;
};

/**
 * Returns Tailwind badge styles for the chemical category.
 */
export const getChemicalCategoryBadge = (category: string) => {
  const norm = normalizeChemicalCategory(category);
  switch (norm) {
    case 'জুট':
      return {
        bg: 'bg-[#E5F8F1]',
        text: 'text-[#1E825F]',
        border: 'border-[#1E825F]/30',
        dot: '#1E825F'
      };
    case 'ব্লিচিং':
      return {
        bg: 'bg-[#FFF3DF]',
        text: 'text-[#C47D1C]',
        border: 'border-[#F3B562]/30',
        dot: '#C47D1C'
      };
    case 'সোডা':
      return {
        bg: 'bg-[#FFF0E6]',
        text: 'text-[#E06D28]',
        border: 'border-[#E06D28]/30',
        dot: '#E06D28'
      };
    case 'কাস্টিং':
      return {
        bg: 'bg-[#F0EEFF]',
        text: 'text-[#6366F1]',
        border: 'border-[#6366F1]/30',
        dot: '#6366F1'
      };
    case 'এসিড':
      return {
        bg: 'bg-[#FEECEE]',
        text: 'text-[#EA7185]',
        border: 'border-[#EA7185]/30',
        dot: '#EA7185'
      };
    case 'ব্লু':
      return {
        bg: 'bg-[#EAF7F8]',
        text: 'text-[#0B9FA5]',
        border: 'border-[#0B9FA5]/30',
        dot: '#0B9FA5'
      };
    case 'বিএমবি':
      return {
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#2563EB]',
        border: 'border-[#2563EB]/30',
        dot: '#2563EB'
      };
    default:
      return {
        bg: 'bg-[#F1FAFA]',
        text: 'text-[#688285]',
        border: 'border-[#D9EAEB]',
        dot: '#688285'
      };
  }
};
