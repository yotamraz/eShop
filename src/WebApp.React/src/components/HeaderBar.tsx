import { Link, useLocation } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { CartMenu } from './CartMenu';
import styles from './HeaderBar.module.css';

export function HeaderBar() {
  const location = useLocation();
  const isCatalog = location.pathname === '/';
  const headerImage = isCatalog ? '/images/header-home.webp' : '/images/header.webp';

  return (
    <div className={`${styles.eshopHeader} ${isCatalog ? styles.home : ''}`}>
      <div className={styles.eshopHeaderHero}>
        <img role="presentation" src={headerImage} />
      </div>
      <div className={styles.eshopHeaderContainer}>
        <nav className={styles.eshopHeaderNavbar}>
          <Link className={styles.logoHeader} to="/">
            <img alt="AdventureWorks" src="/images/logo-header.svg" className={styles.logoHeader} />
          </Link>

          <UserMenu />
          <CartMenu />
        </nav>
        <div className={styles.eshopHeaderIntro}>
          <h1 id="page-header-title"></h1>
          <p id="page-header-subtitle"></p>
        </div>
      </div>
    </div>
  );
}
