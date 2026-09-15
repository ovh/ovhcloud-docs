import type { CpNavKey } from '../types';

// Manager nav tree: node 'video-center' carries a direct `url` instead of a routing block,
// so the route is that url verbatim rather than an application + hash composition.
// The product name is a brand, identical in every locale (sidebar_web_hosting_video_center).
export const webVideoCenter: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/beta/#/web-cloud/video-center',
      source: { node: 'video-center' },
      text: {
        en: { product: 'Video Center', crumbs: ['Video Center'] },
        fr: { product: 'Video Center', crumbs: ['Video Center'] },
        de: { product: 'Video Center', crumbs: ['Video Center'] },
        es: { product: 'Video Center', crumbs: ['Video Center'] },
        it: { product: 'Video Center', crumbs: ['Video Center'] },
        pl: { product: 'Video Center', crumbs: ['Video Center'] },
        pt: { product: 'Video Center', crumbs: ['Video Center'] },
      },
    },
  ],
};
