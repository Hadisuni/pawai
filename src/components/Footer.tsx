import PawLogo from './PawLogo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div>
            <a className="brand" href="/" aria-label="PAWai — home">
              <PawLogo size={28} />
              PAW<b>ai</b>
            </a>
            <p>The AI health companion for every animal. Vet-reviewed care, available any hour of the day.</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#">Symptom checker</a></li>
              <li><a href="#">Health timeline</a></li>
              <li><a href="#">For vets</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help center</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bot">
          <span>© 2026 PAWai, Inc. PAWai is not a substitute for emergency veterinary care.</span>
          <span>Made with 🐾 for animals everywhere</span>
        </div>
      </div>
    </footer>
  );
}
