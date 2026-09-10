import type { CpNavKey } from '../types';

export const accountProfile: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/account/useraccount/infos',
      text: {
        en: { product: 'Edit my profile', crumbs: ['Access my account', 'Edit my profile'] },
        fr: { product: 'Éditer mon profil', crumbs: ['Mon compte', 'Éditer mon profil'] },
        de: { product: 'Mein Profil bearbeiten', crumbs: ['Zu meinem Account', 'Mein Profil bearbeiten'] },
        es: { product: 'Editar mi perfil', crumbs: ['Acceder a mi cuenta', 'Editar mi perfil'] },
        it: { product: 'Modifica il tuo profilo', crumbs: ['Accedere al mio account', 'Modifica il tuo profilo'] },
        pl: { product: 'Edytuj mój profil', crumbs: ['Dostęp do konta', 'Edytuj mój profil'] },
        pt: { product: 'Editar o meu perfil', crumbs: ['Aceder à minha conta', 'Editar o meu perfil'] },
      },
    },
  ],
};
