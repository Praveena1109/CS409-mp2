import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAllPokemonNames,
  getPokemon,
  artworkUrl,
  idFromUrl,
  preloadPokemon
} from '../services/pokeapi';
import { Link } from 'react-router-dom';
import styles from './GalleryView.module.css';

type PokemonSummary = {
  id: number;
  name: string;
  types: string[];
};

const ALL_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const PAGE_SIZE = 50;

const GalleryView: React.FC = () => {
  const [allPokemon, setAllPokemon] = useState<{ name: string; url: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [detailsCache, setDetailsCache] = useState<Record<number, PokemonSummary>>({});
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Fetch all Pokémon names/URLs once
  useEffect(() => {
    const fetchNames = async () => {
      const data = await getAllPokemonNames();
      setAllPokemon(data.results);
      setLoading(false);
    };
    fetchNames();
  }, []);

  const baseList = useMemo(
    () =>
      allPokemon.map(p => ({
        id: idFromUrl(p.url),
        name: p.name
      })),
    [allPokemon]
  );

  // Fetch all Pokémon details if a type filter is applied
  const fetchAllDetailsIfNeeded = useCallback(async () => {
    if (selectedTypes.length === 0 || Object.keys(detailsCache).length === baseList.length) return;

    setLoadingTypes(true);
    const idsToFetch = baseList
      .map(p => p.id)
      .filter(id => !detailsCache[id]);

    const fetched: Record<number, PokemonSummary> = {};
    await Promise.all(
      idsToFetch.map(async id => {
        const info = await getPokemon(id);
        fetched[id] = {
          id,
          name: info.name,
          types: info.types.map((t: any) => t.type.name)
        };
      })
    );
    setDetailsCache(prev => ({ ...prev, ...fetched }));
    setLoadingTypes(false);
  }, [selectedTypes, baseList, detailsCache]);

  useEffect(() => {
    fetchAllDetailsIfNeeded();
  }, [selectedTypes, fetchAllDetailsIfNeeded]);

  // Filter based on types 
  const filteredBase = useMemo(() => {
    if (selectedTypes.length === 0) return baseList;

    return baseList.filter(p => {
      const details = detailsCache[p.id];
      return details && selectedTypes.every(t => details.types.includes(t));
    });
  }, [baseList, selectedTypes, detailsCache]);

  // Slice for infinite scroll
  const visible = useMemo(
    () => filteredBase.slice(0, visibleCount),
    [filteredBase, visibleCount]
  );

  // Fetch details for visible Pokémon
  const fetchDetailsForVisible = useCallback(async () => {
    const toFetch = visible.filter(p => !detailsCache[p.id]).map(p => p.id);

    if (toFetch.length > 0) {
      const fetched: Record<number, PokemonSummary> = {};
      await Promise.all(
        toFetch.map(async id => {
          const info = await getPokemon(id);
          fetched[id] = {
            id,
            name: info.name,
            types: info.types.map((t: any) => t.type.name)
          };
        })
      );
      setDetailsCache(prev => ({ ...prev, ...fetched }));
    }
  }, [visible, detailsCache]);

  useEffect(() => {
    fetchDetailsForVisible();
  }, [visible, fetchDetailsForVisible]);

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const bottom = document.documentElement.offsetHeight - 300;

      if (scrollPosition >= bottom && !fetching && visibleCount < filteredBase.length) {
        setFetching(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + PAGE_SIZE);
          setFetching(false);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetching, visibleCount, filteredBase.length]);

  // Preload visible Pokémon
  useEffect(() => {
    visible.slice(0, 50).forEach(p => preloadPokemon(p.id));
  }, [visible]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setVisibleCount(PAGE_SIZE);
  };

  if (loading) return <div className={styles.loading}>Loading Pokédex...</div>;
  if (loadingTypes) return <div className={styles.loading}>Loading type data...</div>;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Pokémon Gallery</h1>

      <div className={styles.filterContainer}>
        <p className={styles.filterLabel}>Filter by Type:</p>
        <div className={styles.typeList}>
          {ALL_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`${styles.typeButton} ${selectedTypes.includes(type) ? styles[`type-${type}`] : ''
                }`}
            >
              {type}
            </button>
          ))}
          {selectedTypes.length > 0 && (
            <button className={styles.clearButton} onClick={clearFilters}>
              Clear Filters ✖
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.noResults}>❌ No Pokémon match this type combination.</div>
      ) : (
        <div className={styles.grid}>
          {visible.map(p => {
            const details = detailsCache[p.id];
            if (!details) return null;

            return (
              <Link
                key={p.id}
                to={`/pokemon/${p.id}`}
                state={{ list: filteredBase.map(x => x.id) }}
                className={styles.card}
                onMouseEnter={() => preloadPokemon(p.id)}
              >
                <img src={artworkUrl(p.id)} alt={p.name} className={styles.image} />
                <div className={styles.name}>#{p.id} {p.name}</div>
                <div className={styles.types}>
                  {details.types.map(t => (
                    <span key={t} className={`${styles.typeTag} ${styles[`type-${t}`]}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {fetching && (
        <div className={styles.loadingMore}>
          Loading more Pokémon...
        </div>
      )}
    </main>
  );
};

export default GalleryView;





