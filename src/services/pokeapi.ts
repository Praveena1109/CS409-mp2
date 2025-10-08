const BASE_URL = 'https://pokeapi.co/api/v2';

const pokemonCache = new Map<number, any>();
let allPokemonCache: any = null;

/** Get all Pokémon names */
export async function getAllPokemonNames() {
  if (allPokemonCache) return allPokemonCache;

  const res = await fetch(`${BASE_URL}/pokemon?limit=1025`);
  if (!res.ok) throw new Error('Failed to fetch Pokémon list');

  const data = await res.json();
  allPokemonCache = data;
  return data;
}

/** Get Pokémon details */
export async function getPokemon(id: string | number) {
  const numericId = Number(id);

  if (pokemonCache.has(numericId)) {
    return pokemonCache.get(numericId);
  }

  const res = await fetch(`${BASE_URL}/pokemon/${numericId}`);
  if (!res.ok) throw new Error(`Failed to fetch Pokémon #${numericId}`);

  const data = await res.json();
  pokemonCache.set(numericId, data);
  return data;
}

/** Preload Pokémon data silently  */
export function preloadPokemon(id: number) {
  if (!pokemonCache.has(id)) {
    getPokemon(id).catch(() => {}); 
  }
}

/** Artwork URL */
export function artworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** Extract ID from API URL */
export function idFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}
