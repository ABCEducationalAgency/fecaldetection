export const HELMINTH_SPECIES = [
  { id: 0, name: "Ascaris lumbricoides", note: "Giant roundworm \u2014 most common soil-transmitted helminth worldwide" },
  { id: 1, name: "Capillaria philippinensis", note: "Intestinal capillariasis \u2014 causes chronic diarrhea and malabsorption" },
  { id: 2, name: "Enterobius vermicularis", note: "Pinworm \u2014 the most common helminth in temperate climates" },
  { id: 3, name: "Fasciolopsis buski", note: "Giant intestinal fluke \u2014 largest fluke infecting humans" },
  { id: 4, name: "Hookworm egg", note: "Ancylostoma / Necator \u2014 leading cause of iron-deficiency anemia" },
  { id: 5, name: "Hymenolepis diminuta", note: "Rat tapeworm \u2014 uncommon in humans, usually asymptomatic" },
  { id: 6, name: "Hymenolepis nana", note: "Dwarf tapeworm \u2014 most common cestode in humans" },
  { id: 7, name: "Opisthorchis viverrine", note: "Liver fluke \u2014 linked to cholangiocarcinoma risk" },
  { id: 8, name: "Paragonimus spp", note: "Lung fluke \u2014 causes paragonimiasis, mimics tuberculosis" },
  { id: 9, name: "Taenia spp. egg", note: "Tapeworm \u2014 beef (T. saginata) or pork (T. solium) tapeworm" },
  { id: 10, name: "Trichuris trichiura", note: "Whipworm \u2014 infects the large intestine, common in tropics" },
] as const;

export type HelminthSpecies = (typeof HELMINTH_SPECIES)[number];
