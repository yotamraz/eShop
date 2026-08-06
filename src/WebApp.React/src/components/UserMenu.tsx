import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import styles from './UserMenu.module.css';

export function UserMenu() {
  const { isAuthenticated, userName, login, logout } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <>
        <h3>{userName}</h3>
        <div className={styles.dropdownMenu}>
          <span>
            <img role="presentation" src="/icons/user.svg" />
          </span>
          <div className={styles.dropdownContent}>
            <Link className={styles.dropdownItem} to="/user/orders">My orders</Link>
            <div className={styles.dropdownItem}>
              <button type="button" onClick={() => { void logout(); }}>Log out</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <button
      type="button"
      aria-label="Sign in"
      className={styles.signInButton}
      onClick={() => login(location.pathname + location.search + location.hash)}
    >
      <img role="presentation" src="/icons/user.svg" />
    </button>
  );
}
