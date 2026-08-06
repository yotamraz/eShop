import { Link } from 'react-router-dom';

export function CartMenu() {
  return (
    <Link aria-label="cart" to="/cart">
      <img role="presentation" src="/icons/cart.svg" />
    </Link>
  );
}
