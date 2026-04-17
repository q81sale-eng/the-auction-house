const en = {
  nav: {
    auctions: 'Auctions',
    marketplace: 'Marketplace',
    vault: 'Watch Vault',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    joinNow: 'Join Now',
    admin: 'Admin',
    balance: 'balance',
  },
  home: {
    hero: {
      eyebrow: 'Est. 2024 · London',
      line1: 'Where Collectors Meet',
      line2: 'Extraordinary Timepieces',
      subtitle:
        "Curated auctions and private sales of the world's most coveted watches. Authenticated, verified, and delivered with confidence.",
      cta1: 'View Live Auctions',
      cta2: 'Browse Marketplace',
    },
    stats: ['Watches Sold', 'In Sales', 'Authenticated'],
    liveAuctions: {
      eyebrow: 'Ending Soon',
      title: 'Live Auctions',
      viewAll: 'View All →',
      empty: 'No live auctions at the moment.',
      emptyLink: 'Check upcoming auctions →',
    },
    howItWorks: {
      eyebrow: 'Simple Process',
      title: 'How It Works',
      steps: [
        {
          step: '01',
          title: 'Create Account',
          desc: 'Register and verify your identity. Our team reviews all members to ensure a trusted community.',
        },
        {
          step: '02',
          title: 'Place a Deposit',
          desc: "Add funds to participate in auctions. Your deposit is secure and refundable if you don't win.",
        },
        {
          step: '03',
          title: 'Bid & Win',
          desc: 'Bid with confidence on authenticated timepieces. Win the auction and complete your purchase.',
        },
      ],
    },
    marketplaceCta: {
      eyebrow: 'Immediate Purchase',
      title: 'Buy Now Marketplace',
      desc: 'Browse our curated selection of pre-owned luxury watches available for immediate purchase. No waiting, no bidding — just exceptional timepieces.',
      cta: 'Explore Marketplace',
    },
  },
  auctions: {
    eyebrow: 'Discover',
    title: 'Auctions',
    previewMode: 'Preview Mode',
    filters: {
      status: 'Status',
      brand: 'Brand',
      allBrands: 'All Brands',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      minPlaceholder: '£0',
      maxPlaceholder: 'Any',
      statuses: { '': 'All', live: 'Live', upcoming: 'Upcoming', ended: 'Ended' },
    },
    found: (n: number) => `${n} auction${n !== 1 ? 's' : ''} found`,
    empty: 'No auctions found',
    clearFilters: 'Clear filters',
  },
};

export default en;
export type Strings = typeof en;
