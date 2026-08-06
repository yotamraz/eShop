import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getCatalogItem } from '../../api/catalogApi';
import { useAuthStore } from '../../stores/authStore';
import { usePageHeader } from '../../hooks/usePageHeader';
import styles from './ItemPage.module.css';

export function ItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const id = Number(itemId);
  const { isAuthenticated, login } = useAuthStore();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['catalogItem', id],
    queryFn: () => getCatalogItem(id),
    enabled: !isNaN(id),
  });

  const headerTitle = item ? item.name : (error || (!isLoading && !item)) ? 'Not found' : '';
  const headerSubtitle = item ? (item.catalogBrand?.brand ?? '') : '';

  usePageHeader(headerTitle, headerSubtitle);

  useEffect(() => {
    if (item) {
      document.title = `${item.name} | AdventureWorks`;
    }
  }, [item]);

  if (isLoading) {
    return null;
  }

  if (error || !item) {
    return (
      <div className={styles.itemDetails}>
        <p>Sorry, we couldn&apos;t find any such product.</p>
      </div>
    );
  }

  return (
    <div className={styles.itemDetails}>
      <img alt={item.name} src={`/product-images/${item.id}`} />
      <div className={styles.description}>
        <p>{item.description}</p>
        <p>
          Brand: <strong>{item.catalogBrand?.brand}</strong>
        </p>
        <div className={styles.addToCart}>
          <span className={styles.price}>${item.price.toFixed(2)}</span>

          {isAuthenticated ? (
            <button type="button" title="Add to basket">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6H21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add to shopping bag
            </button>
          ) : (
            <button type="button" title="Log in to purchase" onClick={() => login(window.location.pathname + window.location.search + window.location.hash)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log in to purchase
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
