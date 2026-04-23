import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useT } from '../../i18n/useLanguage';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { tr } = useT();
  const t = tr.footer;

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <main>{children}</main>
      <footer className="bg-obsidian-950 border-t border-obsidian-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-gold-500 text-xl tracking-widest uppercase mb-4">The Auction House</h3>
              <p className="text-obsidian-400 text-sm leading-relaxed max-w-sm">{t.tagline}</p>
            </div>
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest mb-4">{t.platform}</h4>
              <ul className="space-y-2 text-obsidian-400 text-sm">
                <li><Link to="/auctions" className="hover:text-gold-500 transition-colors">{t.liveAuctions}</Link></li>
                <li><Link to="/marketplace" className="hover:text-gold-500 transition-colors">{t.marketplace}</Link></li>
                <li><Link to="/vault" className="hover:text-gold-500 transition-colors">{t.watchVault}</Link></li>
                <li><Link to="/about" className="hover:text-gold-500 transition-colors">{t.about}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest mb-4">{t.support}</h4>
              <ul className="space-y-2 text-obsidian-400 text-sm">
                <li><Link to="/how-it-works" className="hover:text-gold-500 transition-colors">{t.howItWorks}</Link></li>
                <li><Link to="/authentication" className="hover:text-gold-500 transition-colors">{t.authentication}</Link></li>
                <li><Link to="/contact" className="hover:text-gold-500 transition-colors">{t.contactUs}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-obsidian-800 mt-8 pt-8 text-center text-obsidian-500 text-xs">
            © {new Date().getFullYear()} {t.rights}
          </div>
        </div>
      </footer>
    </div>
  );
};
