export default {
  sitemap: [
    {
      url: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString()
    },
    {
      url: '/about',
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString()
    },
    {
      url: '/dashboard',
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString()
    },
    {
      url: '/news',
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString()
    },
    {
      url: '/auth',
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      url: '/terms',
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString()
    },
    {
      url: '/privacy',
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString()
    }
  ]
};
