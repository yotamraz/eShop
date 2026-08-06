import { Outlet } from 'react-router-dom';
import { HeaderBar } from './HeaderBar';
import { FooterBar } from './FooterBar';

export function Layout() {
  return (
    <>
      <HeaderBar />
      <Outlet />
      <FooterBar />
    </>
  );
}
