import Link from 'next/link';
import PawLogo from './PawLogo';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="nav">
      <div className="nav__i">
        <Link className="brand" href="/" aria-label="PAWai — home">
          <PawLogo size={30} />
          PAW<b>ai</b>
        </Link>
        <nav className="nav__l" aria-label="Main navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/demo">AI Care Journey</Link>
          <Link href="/#vets">For vets</Link>
          <Link href="/#pricing">Pricing</Link>
        </nav>
        <div className="nav__r">
          <ThemeToggle />
          <a className="nav__login" href="#">Log in</a>
          <Link href="/welcome" className="btn btn--pri btn--sm" data-mag>Get Started</Link>
        </div>
      </div>
    </header>
  );
}
