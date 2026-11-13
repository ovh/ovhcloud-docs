import type { CpNavKey } from '../types';

// Console (v8) twin of telecom-xdsl-fttx, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml: the
// product moves from Telecom to Web Cloud, and the Console menu lists it under Web Cloud as
// « Accès internet » (web-cloud-sidebar.products.internetAccess, translated in every locale).
export const telecomXdslFttxConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/internet-access',
      text: {
        en: { product: 'Internet access', crumbs: ['Internet access'] },
        fr: { product: 'Accès internet', crumbs: ['Accès internet'] },
        de: { product: 'Internetzugang', crumbs: ['Internetzugang'] },
        es: { product: 'Acceso a internet', crumbs: ['Acceso a internet'] },
        it: { product: 'Accesso a internet', crumbs: ['Accesso a internet'] },
        pl: { product: 'Dostęp do internetu', crumbs: ['Dostęp do internetu'] },
        pt: { product: 'Acesso à internet', crumbs: ['Acesso à internet'] },
      },
    },
  ],
};
