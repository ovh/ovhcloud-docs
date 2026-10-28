import type { CpNavKey } from '../types';

// The DNS zone reached through the Domain names entry: the direct link lands on the domain
// list, then the chain names the domain and the DNS zone TAB. Same route as `web-domains`.
// For the standalone DNS zones sidebar entry, see `web-dns-zones`.
// Manager nav tree: application 'web-domains' + hash '#/domain'; the tab has no nav node.
export const webDomainDnsZone: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web-domains/domain',
      source: { node: 'domains-list', labels: ['sidebar_domain'] },
      text: {
        en: {
          product: 'Domain names',
          crumbs: [
            'Domain names',
            { text: 'select your domain name' },
            { text: '{0} tab', labels: ['DNS zone'] },
          ],
        },
        fr: {
          product: 'Noms de domaine',
          crumbs: [
            'Noms de domaine',
            { text: 'sélectionnez votre nom de domaine' },
            { text: 'onglet {0}', labels: ['Zone DNS'] },
          ],
        },
        de: {
          product: 'Domainnamen',
          crumbs: [
            'Domainnamen',
            { text: 'Wählen Sie Ihren Domainnamen aus' },
            { text: 'Tab {0}', labels: ['DNS-Zone'] },
          ],
        },
        es: {
          product: 'Dominios',
          crumbs: [
            'Dominios',
            { text: 'seleccione su nombre de dominio' },
            { text: 'pestaña {0}', labels: ['Zona DNS'] },
          ],
        },
        it: {
          product: 'Domini',
          crumbs: [
            'Domini',
            { text: 'seleziona il tuo nome di dominio' },
            { text: 'scheda {0}', labels: ['Zona DNS'] },
          ],
        },
        pl: {
          product: 'Domeny',
          crumbs: [
            'Domeny',
            { text: 'wybierz nazwę domeny' },
            { text: 'zakładka {0}', labels: ['Strefa DNS'] },
          ],
        },
        pt: {
          product: 'Nomes de domínio',
          crumbs: [
            'Nomes de domínio',
            { text: 'selecione o seu nome de domínio' },
            { text: 'separador {0}', labels: ['Zona DNS'] },
          ],
        },
      },
    },
  ],
};
