import React, { useEffect, useMemo, useState } from 'react';
import { getAllPokemonNames, idFromUrl, artworkUrl, preloadPokemon } from '../services/pokeapi';
import { Link } from 'react-router-dom';
import styles from './ListView.module.css';

type SortField = 'name' | 'id';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 50;

const ListView: React.FC = () => {
  const [allPokemon, setAllPokemon] = useState<{ name: string; url: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Fetch ALL Pokémon metadata once
  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllPokemonNames();
      setAllPokemon(data.results);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter ALL Pokémon
  const filtered = useMemo(() => {
    return allPokemon.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      idFromUrl(p.url).toString().includes(search)
    );
  }, [allPokemon, search]);

  // Sort ALL Pokémon
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        const idA = idFromUrl(a.url);
        const idB = idFromUrl(b.url);
        return sortOrder === 'asc' ? idA - idB : idB - idA;
      }
    });
  }, [filtered, sortField, sortOrder]);

  // Slice based on visibleCount
  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const bottom = document.documentElement.offsetHeight - 300;

      if (scrollPosition >= bottom && !fetching && visibleCount < sorted.length) {
        setFetching(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + PAGE_SIZE);
          setFetching(false);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetching, visibleCount, sorted.length]);

  // Preload details for visible Pokémon
  useEffect(() => {
    visible.slice(0, 50).forEach(p => preloadPokemon(idFromUrl(p.url)));
  }, [visible]);

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (loading) {
    return <div className={styles.container}>Loading Pokémon list...</div>;
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Pokémon List</h1>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by name or ID..."
          className={styles.search}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
        />

        <div className={styles.sortControls}>
          <label htmlFor="sortField">Sort by:</label>
          <select
            id="sortField"
            className={styles.select}
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
          >
            <option value="id">ID (Rank)</option>
            <option value="name">Name</option>
          </select>

          <button className={styles.sortButton} onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {visible.map(p => {
          const id = idFromUrl(p.url);
          return (
            <Link
              to={`/pokemon/${id}`}
              state={{ list: sorted.map(p => idFromUrl(p.url)) }}
              key={id}
              className={styles.card}
              onMouseEnter={() => preloadPokemon(id)}
            >
              <img src={artworkUrl(id)} alt={p.name} className={styles.image} />
              <div className={styles.name}>#{id} {p.name}</div>
            </Link>
          );
        })}
      </div>

      {fetching && (
        <div className={styles.loadingMore}>
          Loading more Pokémon...
        </div>
      )}
    </main>
  );
};

export default ListView;

