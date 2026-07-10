import Link from 'next/link';
import PawLogo from './PawLogo';
import ThemeToggle from './ThemeToggle';
import HeaderCta from './HeaderCta';

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
          <Link href="/blog">Learn</Link>
        </nav>
        <div className="nav__r">
          <ThemeToggle />
          <HeaderCta />
        </div>
      </div>
    </header>
  );
}
