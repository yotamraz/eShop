import type { CatalogItem } from '../../api/types';
import styles from './CatalogListItem.module.css';

interface CatalogListItemProps {
  item: CatalogItem;
}

export function CatalogListItem({ item }: CatalogListItemProps) {
  return (
    <div className={styles.catalogItem}>
      <a className={styles.catalogProduct} href={`/item/${item.id}`}>
        <span className={styles.catalogProductImage}>
          <img alt={item.name} src={`/product-images/${item.id}`} />
        </span>
        <span className={styles.catalogProductContent}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.price}>${item.price.toFixed(2)}</span>
        </span>
      </a>
    </div>
  );
}
