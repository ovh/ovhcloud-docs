import type { CpNavKey } from '../types';

export const webDomains: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web-domains/domain',
      source: { node: 'domains-list', labels: ['sidebar_domain'] },
      text: {
        en: {
          product: 'Domain names',
          crumbs: ['Domain names'],
          step: 'Select your domain name',
        },
        fr: {
          product: 'Noms de domaine',
          crumbs: ['Noms de domaine'],
          step: 'Sélectionnez votre nom de domaine',
        },
        de: {
          product: 'Domainnamen',
          crumbs: ['Domainnamen'],
          step: 'Wählen Sie Ihren Domainnamen aus',
        },
        es: {
          product: 'Dominios',
          crumbs: ['Dominios'],
          step: 'Seleccione su nombre de dominio',
        },
        it: {
          product: 'Domini',
          crumbs: ['Domini'],
          step: 'Seleziona il tuo nome di dominio',
        },
        pl: {
          product: 'Domeny',
          crumbs: ['Domeny'],
          step: 'Wybierz nazwę domeny',
        },
        pt: {
          product: 'Nomes de domínio',
          crumbs: ['Nomes de domínio'],
          step: 'Selecione o seu nome de domínio',
        },
      },
    },
  ],
};
