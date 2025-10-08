export type NamedAPIResource = {
  name: string;
  url: string;
};

export type PokemonType = {
  slot: number;
  type: NamedAPIResource;
};

export type PokemonAbility = {
  ability: NamedAPIResource;
};

export type PokemonStat = {
  base_stat: number;
  stat: NamedAPIResource;
};

export type Pokemon = {
  id: number;
  name: string;
  sprites: {
    other?: {
      ['official-artwork']?: {
        front_default: string | null;
      };
    };
  };
  types: PokemonType[];
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  stats: PokemonStat[];
};
