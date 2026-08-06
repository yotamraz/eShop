import './CartMenu.module.css';

export function CartMenu() {
  return (
    <a aria-label="cart" href="/cart">
      <img role="presentation" src="/icons/cart.svg" />
    </a>
  );
}
