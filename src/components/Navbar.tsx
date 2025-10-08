import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/list" className={styles.brand}>Pokédex</Link>
      </div>
      <div className={styles.links}>
        <Link
          to="/list"
          className={`${styles.link} ${location.pathname === '/list' ? styles.active : ''}`}
        >
          List
        </Link>
        <Link
          to="/gallery"
          className={`${styles.link} ${location.pathname === '/gallery' ? styles.active : ''}`}
        >
          Gallery
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
