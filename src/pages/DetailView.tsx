import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPokemon, artworkUrl } from '../services/pokeapi';
import type { Pokemon } from '../types/pokemon';
import styles from './DetailView.module.css';

const MIN_ID = 1;
const MAX_ID = 1025;

const DetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [list, setList] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericId = id ? parseInt(id, 10) : 0;

  useEffect(() => {
    if (location.state?.list) {
      setList(location.state.list);
    }
  }, [location.state]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Uses cached data if available
    getPokemon(id)
      .then(data => {
        if (data.id < MIN_ID || data.id > MAX_ID) {
          setError('Not a valid main Pokémon.');
          setPokemon(null);
          return;
        }
        setPokemon(data);
      })
      .catch(() => setError('Failed to load Pokémon data.'))
      .finally(() => setLoading(false));
  }, [id]);

  const currentIndex = list.length ? list.indexOf(numericId) : -1;
  const prevId = currentIndex > 0 ? list[currentIndex - 1] : null;
  const nextId = currentIndex !== -1 && currentIndex < list.length - 1 ? list[currentIndex + 1] : null;

  const goBack = () => navigate(-1);
  const goToPokemon = (newId: number | null) => {
    if (newId) navigate(`/pokemon/${newId}`, { state: { list } });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!pokemon) return null;

  return (
    <main className={styles.detail}>
      <div className={styles.backWrapper}>
        <button className={`${styles.navButton} ${styles.backButton}`} onClick={goBack}>
          ← Back
        </button>
      </div>

      <h1 className={styles.title}>
        #{pokemon.id} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
      </h1>

      <div className={styles.imageContainer}>
        <img src={artworkUrl(pokemon.id)} alt={pokemon.name} className={styles.image} />
      </div>

      <div className={styles.info}>
        <p><strong>Height:</strong> {pokemon.height / 10} m</p>
        <p><strong>Weight:</strong> {pokemon.weight / 10} kg</p>
        <p><strong>Types:</strong> {pokemon.types.map(t => t.type.name).join(', ')}</p>
        <p><strong>Abilities:</strong> {pokemon.abilities.map(a => a.ability.name).join(', ')}</p>

        <div>
          <strong>Base Stats:</strong>
          <ul className={styles.statsList}>
            {pokemon.stats.map(stat => (
              <li key={stat.stat.name} className={styles.statItem}>
                <span className={styles.statName}>{stat.stat.name}: {stat.base_stat}</span>
                <div className={styles.statBar}>
                  <div
                    className={styles.statFill}
                    style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className={styles.navigation}>
        <button className={styles.navButton} onClick={() => goToPokemon(prevId)} disabled={!prevId}>
          ← Previous
        </button>
        <button className={styles.navButton} onClick={() => goToPokemon(nextId)} disabled={!nextId}>
          Next →
        </button>
      </div>
    </main>
  );
};

export default DetailView;
