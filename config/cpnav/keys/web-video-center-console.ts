import type { CpNavKey } from '../types';

// Console (v8) twin of web-video-center, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the Console
// menu lists it directly under Web Cloud (web-cloud-sidebar.products.videoCenter, the same in
// every locale).
export const webVideoCenterConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/video-center',
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
