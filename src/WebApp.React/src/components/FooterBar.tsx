import styles from './FooterBar.module.css';

export function FooterBar() {
  return (
    <footer className={styles.eshopFooter}>
      <div className={styles.eshopFooterContent}>
        <div className={styles.eshopFooterRow}>
          <img role="presentation" src="/images/logo-footer.svg" className={`${styles.logo} ${styles.logoFooter}`} />
          <p>&copy; AdventureWorks</p>
        </div>
      </div>
    </footer>
  );
}
