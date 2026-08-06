import { useAuthStore } from '../stores/authStore';
import styles from './UserMenu.module.css';

export function UserMenu() {
  const { isAuthenticated, userName, logout } = useAuthStore();

  if (isAuthenticated) {
    return (
      <>
        <h3>{userName}</h3>
        <div className={styles.dropdownMenu}>
          <span className={styles.dropdownButton}>
            <img role="presentation" src="/icons/user.svg" />
          </span>
          <div className={styles.dropdownContent}>
            <a className={styles.dropdownItem} href="/user/orders">My orders</a>
            <div className={styles.dropdownItem}>
              <button type="button" onClick={() => { void logout(); }}>Log out</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <a aria-label="Sign in" href="/user/login">
      <img role="presentation" src="/icons/user.svg" />
    </a>
  );
}
