import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <main>{children}</main>
      <footer className="bg-obsidian-950 border-t border-obsidian-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-gold-500 text-xl tracking-widest uppercase mb-4">The Auction House</h3>
              <p className="text-obsidian-400 text-sm leading-relaxed max-w-sm">
                The world's premier destination for rare and collectible timepieces.
                Connecting discerning collectors with extraordinary watches.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2 text-obsidian-400 text-sm">
                <li><a href="/auctions" className="hover:text-gold-500 transition-colors">Live Auctions</a></li>
                <li><a href="/marketplace" className="hover:text-gold-500 transition-colors">Marketplace</a></li>
                <li><a href="/vault" className="hover:text-gold-500 transition-colors">Watch Vault</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest mb-4">Support</h4>
              <ul className="space-y-2 text-obsidian-400 text-sm">
                <li><a href="#" className="hover:text-gold-500 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Authentication</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-obsidian-800 mt-8 pt-8 text-center text-obsidian-500 text-xs">
            © {new Date().getFullYear()} The Auction House. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
