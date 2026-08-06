import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test-utils';
import { CatalogListItem } from '../../src/features/catalog/CatalogListItem';
import type { CatalogItem } from '../../src/api/types';

const mockItem: CatalogItem = {
  id: 42,
  name: 'Alpine Explorer Tent',
  description: 'A sturdy tent for alpine adventures',
  price: 149.99,
  pictureUrl: '/product-images/42',
  catalogBrandId: 1,
  catalogBrand: { id: 1, brand: 'Alpine' },
  catalogTypeId: 2,
  catalogType: { id: 2, type: 'Tents' },
};

describe('CatalogListItem', () => {
  it('renders the product name', () => {
    render(<CatalogListItem item={mockItem} />);
    expect(screen.getByText('Alpine Explorer Tent')).toBeInTheDocument();
  });

  it('renders the product price formatted to two decimals', () => {
    render(<CatalogListItem item={mockItem} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('links to the correct item page', () => {
    render(<CatalogListItem item={mockItem} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/item/42');
  });

  it('shows the product image with correct alt text and src', () => {
    render(<CatalogListItem item={mockItem} />);
    const img = screen.getByAltText('Alpine Explorer Tent');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/product-images/42');
  });
});
