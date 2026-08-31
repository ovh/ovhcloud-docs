// Centralized reusable text fragments, resolved per locale at build time.
// Hand-maintained.
//
// Usage in MDX: place [[fragment:key]] on its own line, surrounded by blank
// lines. Expansion happens via config/fragment-rules.ts (Rspress replaceRules)
// BEFORE MDX compilation, so fragment bodies are markdown and may contain
// (/links/key) tokens — they resolve in the same pass. Bodies must expand to
// pure markdown or import-free JSX (native HTML elements only): components
// that need an import would pass the per-locale build but fail CI SSG.
// Unresolved tokens fail the build via plugins/remarkNoUnresolvedFragments.
import type { Locale } from './shared';

export type FragmentMap = Record<string, Partial<Record<Locale, string>>>;

export const textFragments: FragmentMap = {
  // Support-scope disclaimer: customer responsibility, third-party support
  // limits, and all assistance channels. Replaces the many drifted
  // "OVHcloud provides services for which you are responsible…" warnings.
  // Styling: details.support in styles/index.css.
  'support-scope': {
    en: `<details className="support">

<summary>Information regarding OVHcloud service administration and how to find appropriate assistance</summary>

When using OVHcloud guides, please be aware of the following conditions:

- User instructions aim to provide as many details as possible but cannot cover individual use cases. You might need to adapt the pertinent actions to your requirements.
- The OVHcloud ecosystem is built for flexibility and freedom of choice.  Customers are therefore responsible for the secure and proper configuration of their services. To prevent data loss, we strongly recommend to apply backup strategies to all your important data.
- Our guides and tutorials may reference third-party software or services in combination with OVHcloud solutions. The technical support provided by OVHcloud does not include the configuration of systems or products outside of our responsibility. This includes but is not limited to:
  - Operating systems and user interfaces (Windows, Debian, Plesk, etc.).
  - Any other third-party software (FTP clients, email software, etc.).
  - Services offered by other providers (DNS, APIs, user interfaces, etc.).

To receive the appropriate assistance for any issues you might experience, follow these guidelines:

- **You seek personalized advice or you would like to discuss a topic that is not covered in detail by our documentation?**<br />
  Join the [OVHcloud Community](/links/community) to search for your topic and reach out to other users.
- **You need to report an incident regarding your OVHcloud service or you are experiencing difficulties in the OVHcloud Control Panel?**<br />
  Create a support request in our [Help Centre](/links/support-contact).
- **You require professional assistance for your project or you need help with tasks outside our support scope?**<br />
  Visit our [partner portal](/links/partner) to search for experts who are familiar with OVHcloud solutions.
- **You are looking for more detailed information regarding our support levels and Professional Services?**<br />
  Please visit our web pages for [OVHcloud support levels](/links/support) and [OVHcloud Professional Services](/links/professional-services).

You can participate in improving our documentation:

- **You would like to share feedback to improve a guide page or you want to report insufficient information on a specific page?**<br />
  Use the "Was this page helpful?" buttons at the bottom of the page to let us know.
- **You would like to propose a specific documentation update?**<br />
  Use the "Edit this page" function, available at the bottom of the page and in the sidebar.

</details>`,
    fr: `<details className="support">

<summary>Informations sur l’administration des services OVHcloud et sur la manière d’obtenir l’assistance appropriée</summary>

Lors de l’utilisation des guides OVHcloud, veuillez tenir compte des points suivants :

- Les instructions visent à fournir un maximum de détails, mais ne peuvent pas couvrir tous les cas d’utilisation particuliers. Il peut être nécessaire d’adapter les actions décrites à vos besoins.
- L’écosystème OVHcloud est conçu pour offrir flexibilité et liberté de choix. Vous êtes donc responsable de la configuration correcte et sécurisée de vos services. Afin d’éviter toute perte de données, nous vous recommandons vivement de mettre en place des stratégies de sauvegarde pour toutes vos données importantes.
- Nos guides et tutoriels peuvent faire référence à des logiciels ou services tiers utilisés en combinaison avec les solutions OVHcloud. Le support technique fourni par OVHcloud n’inclut pas la configuration de systèmes ou de produits ne relevant pas de notre responsabilité. Cela inclut notamment :
  - Les systèmes d’exploitation et les interfaces utilisateur (Windows, Debian, Plesk, etc.).
  - Tout autre logiciel tiers (clients FTP, logiciels de messagerie, etc.).
  - Les services proposés par d’autres fournisseurs (DNS, API, interfaces utilisateur, etc.).
  - Le matériel personnel utilisé avec nos services VoIP (téléphone IP, iPBX, etc.).
  - Le matériel personnel utilisé avec nos offres d’accès internet (modem, routeur, etc.).

Pour recevoir l’assistance appropriée en cas de problème, suivez ces recommandations :

- **Vous souhaitez obtenir des conseils personnalisés ou discuter d’un sujet qui n’est pas traité en détail dans notre documentation ?**<br />
  Rejoignez la [communauté OVHcloud](/links/community) pour y rechercher votre sujet et échanger avec d’autres utilisateurs.
- **Vous devez signaler un incident concernant votre service OVHcloud ou vous rencontrez des difficultés dans l’espace client OVHcloud ?**<br />
  Créez une demande d’assistance dans notre [centre d’aide](/links/support-contact).
- **Vous avez besoin d’une assistance professionnelle pour votre projet ou d’aide pour des tâches en dehors de notre périmètre de support ?**<br />
  Consultez notre [portail des partenaires](/links/partner) pour trouver des experts des solutions OVHcloud.
- **Vous recherchez des informations plus détaillées sur nos niveaux de support et Professional Services ?**<br />
  Consultez nos pages [niveaux de support OVHcloud](/links/support) et [OVHcloud Professional Services](/links/professional-services).

Vous pouvez participer à l’amélioration de notre documentation :

- **Vous souhaitez faire un retour pour améliorer un guide ou signaler des informations insuffisantes sur une page spécifique ?**<br />
  Utilisez les boutons « Cette page vous a-t-elle aidé ? » en bas de page pour nous en informer.
- **Vous souhaitez proposer directement une modification de la documentation ?**<br />
  Utilisez la fonction « Modifier cette page », disponible en bas de page et dans la barre latérale.

</details>`,
    de: `<details className="support">

<summary>Informationen zur Verwaltung Ihrer OVHcloud Dienste und wie Sie die passende Unterstützung finden</summary>

Beachten Sie bei der Verwendung der OVHcloud Anleitungen die folgenden Bedingungen:

- Die Anweisungen sind so detailliert wie möglich, können jedoch nicht alle individuellen Anwendungsfälle abdecken. Gegebenenfalls müssen Sie die beschriebenen Schritte an Ihre Anforderungen anpassen.
- Das OVHcloud Ökosystem ist auf Flexibilität und Wahlfreiheit ausgelegt. Kunden sind daher für die sichere und ordnungsgemäße Konfiguration ihrer Dienste verantwortlich. Um Datenverlust vorzubeugen, empfehlen wir dringend, Backup-Strategien für alle wichtigen Daten anzuwenden.
- Unsere Anleitungen und Tutorials können Software oder Dienste von Drittanbietern in Kombination mit OVHcloud Lösungen umfassen. Der technische Support von OVHcloud beinhaltet nicht die Konfiguration von Systemen oder Produkten außerhalb unserer Verantwortung. Dazu zählen unter anderem:
  - Betriebssysteme und Benutzeroberflächen (Windows, Debian, Plesk etc.).
  - Jegliche andere Drittanbieter-Software (FTP-Clients, E-Mail-Programme etc.).
  - Dienste anderer Anbieter (DNS, APIs, Benutzeroberflächen etc.).

Um bei Problemen die passende Unterstützung zu erhalten, beachten Sie folgende Hinweise:

- **Sie benötigen individuelle Hilfe oder möchten ein Thema besprechen, das in unserer Dokumentation nicht ausführlich behandelt wird?**<br />
  Treten Sie der [OVHcloud Community](/links/community) bei, um nach Ihrem Thema zu suchen und sich mit anderen Nutzern auszutauschen.
- **Sie möchten einen Vorfall zu Ihrem OVHcloud Dienst melden oder haben Schwierigkeiten im OVHcloud Kundencenter?**<br />
  Erstellen Sie eine Supportanfrage in unserem [Help Center](/links/support-contact).
- **Sie benötigen professionelle Unterstützung für Ihr Projekt oder Hilfe bei Aufgaben außerhalb unseres Support-Bereichs?**<br />
  Besuchen Sie unser [Partnerportal](/links/partner), um Experten zu finden, die mit OVHcloud Lösungen vertraut sind.
- **Sie suchen ausführlichere Informationen zu unseren Support Levels und Professional Services?**<br />
  Besuchen Sie unsere Webseiten zu den [OVHcloud Support Levels](/links/support) und den [OVHcloud Professional Services](/links/professional-services).

Sie können dazu beitragen, unsere Dokumentation zu verbessern:

- **Sie möchten Feedback zur Verbesserung einer Anleitung geben oder unzureichende Informationen auf einer bestimmten Seite melden?**<br />
  Nutzen Sie die Schaltflächen unter „War diese Seite hilfreich?“ am Ende der Seite.
- **Sie möchten eine konkrete Aktualisierung der Dokumentation vorschlagen?**<br />
  Verwenden Sie die Funktion „Diese Seite bearbeiten“ am Ende der Seite oder in der Seitenleiste.

</details>`,
    es: `<details className="support">

<summary>Información sobre la administración de los servicios de OVHcloud y cómo encontrar la asistencia adecuada</summary>

Al utilizar las guías de OVHcloud, tenga en cuenta las siguientes condiciones:

- Las instrucciones pretenden ofrecer el mayor detalle posible, pero no pueden cubrir todos los casos de uso individuales. Es posible que deba adaptar las acciones descritas a sus necesidades.
- El ecosistema de OVHcloud está diseñado para ofrecer flexibilidad y libertad de elección. Por lo tanto, los clientes son responsables de la configuración correcta y segura de sus servicios. Para evitar la pérdida de datos, recomendamos encarecidamente aplicar estrategias de copia de seguridad a todos sus datos importantes.
- Nuestras guías y tutoriales pueden hacer referencia a software o servicios de terceros en combinación con las soluciones de OVHcloud. El soporte técnico de OVHcloud no incluye la configuración de sistemas o productos fuera de nuestra responsabilidad. Esto incluye, entre otros:
  - Sistemas operativos e interfaces de usuario (Windows, Debian, Plesk, etc.).
  - Cualquier otro software de terceros (clientes FTP, software de correo electrónico, etc.).
  - Servicios ofrecidos por otros proveedores (DNS, API, interfaces de usuario, etc.).

Para recibir la asistencia adecuada ante cualquier problema, siga estas recomendaciones:

- **¿Busca asesoramiento personalizado o desea tratar un tema que no se aborda en detalle en nuestra documentación?**<br />
  Únase a la [comunidad de OVHcloud](/links/community) para buscar su tema y contactar con otros usuarios.
- **¿Necesita informar de un incidente relacionado con su servicio de OVHcloud o tiene dificultades en el área de cliente de OVHcloud?**<br />
  Cree una solicitud de soporte en nuestro [centro de ayuda](/links/support-contact).
- **¿Necesita asistencia profesional para su proyecto o ayuda con tareas fuera de nuestro ámbito de soporte?**<br />
  Visite nuestro [portal de partners](/links/partner) para encontrar expertos familiarizados con las soluciones de OVHcloud.
- **¿Busca información más detallada sobre nuestros niveles de soporte y Professional Services?**<br />
  Visite nuestras páginas web sobre los [niveles de soporte de OVHcloud](/links/support) y los [OVHcloud Professional Services](/links/professional-services).

Puede participar en la mejora de nuestra documentación:

- **¿Desea enviar comentarios para mejorar una guía o informar de información insuficiente en una página concreta?**<br />
  Utilice los botones «¿Le ha resultado útil esta página?» al final de la página para hacérnoslo saber.
- **¿Desea proponer una actualización concreta de la documentación?**<br />
  Utilice la función «Editar esta página», disponible al final de la página y en la barra lateral.

</details>`,
    it: `<details className="support">

<summary>Informazioni sull’amministrazione dei servizi OVHcloud e su come trovare l’assistenza appropriata</summary>

Durante l’utilizzo delle guide OVHcloud, tieni presente le seguenti condizioni:

- Le istruzioni mirano a fornire il maggior numero possibile di dettagli, ma non possono coprire tutti i casi d’uso individuali. Potrebbe essere necessario adattare le azioni descritte alle tue esigenze.
- L’ecosistema OVHcloud è progettato per garantire flessibilità e libertà di scelta. I clienti sono quindi responsabili della configurazione corretta e sicura dei propri servizi. Per evitare la perdita di dati, ti consigliamo vivamente di applicare strategie di backup a tutti i tuoi dati importanti.
- Le nostre guide e i nostri tutorial possono fare riferimento a software o servizi di terze parti in combinazione con le soluzioni OVHcloud. Il supporto tecnico fornito da OVHcloud non include la configurazione di sistemi o prodotti al di fuori della nostra responsabilità. Questo include, a titolo esemplificativo:
  - Sistemi operativi e interfacce utente (Windows, Debian, Plesk, ecc.).
  - Qualsiasi altro software di terze parti (client FTP, software di posta elettronica, ecc.).
  - Servizi offerti da altri provider (DNS, API, interfacce utente, ecc.).

Per ricevere l’assistenza appropriata in caso di problemi, segui queste indicazioni:

- **Cerchi una consulenza personalizzata o vuoi discutere di un argomento non trattato in dettaglio nella nostra documentazione?**<br />
  Unisciti alla [Community OVHcloud](/links/community) per cercare il tuo argomento e confrontarti con altri utenti.
- **Devi segnalare un incidente relativo al tuo servizio OVHcloud o riscontri difficoltà nello Spazio Cliente OVHcloud?**<br />
  Crea una richiesta di supporto nel nostro [centro assistenza](/links/support-contact).
- **Hai bisogno di assistenza professionale per il tuo progetto o di aiuto per attività al di fuori del nostro perimetro di supporto?**<br />
  Visita il nostro [portale dei partner](/links/partner) per trovare esperti che conoscono le soluzioni OVHcloud.
- **Cerchi informazioni più dettagliate sui nostri livelli di supporto e sui Professional Services?**<br />
  Visita le nostre pagine web sui [livelli di supporto OVHcloud](/links/support) e sugli [OVHcloud Professional Services](/links/professional-services).

Puoi partecipare al miglioramento della nostra documentazione:

- **Vuoi condividere un feedback per migliorare una guida o segnalare informazioni insufficienti su una pagina specifica?**<br />
  Utilizza i pulsanti "Questa pagina ti è stata utile?" in fondo alla pagina per farcelo sapere.
- **Vuoi proporre un aggiornamento concreto della documentazione?**<br />
  Utilizza la funzione "Modifica questa pagina", disponibile in fondo alla pagina e nella barra laterale.

</details>`,
    pl: `<details className="support">

<summary>Informacje dotyczące administrowania usługami OVHcloud oraz jak znaleźć odpowiednią pomoc</summary>

Podczas korzystania z przewodników OVHcloud pamiętaj o następujących warunkach:

- Instrukcje zawierają możliwie najwięcej szczegółów, ale nie mogą obejmować wszystkich indywidualnych przypadków użycia. Może być konieczne dostosowanie opisanych działań do Twoich potrzeb.
- Ekosystem OVHcloud został zaprojektowany z myślą o elastyczności i swobodzie wyboru. Klienci są zatem odpowiedzialni za bezpieczną i prawidłową konfigurację swoich usług. Aby zapobiec utracie danych, zdecydowanie zalecamy stosowanie strategii kopii zapasowych dla wszystkich ważnych danych.
- Nasze przewodniki i tutoriale mogą odwoływać się do oprogramowania lub usług firm trzecich w połączeniu z rozwiązaniami OVHcloud. Wsparcie techniczne OVHcloud nie obejmuje konfiguracji systemów ani produktów pozostających poza naszą odpowiedzialnością. Dotyczy to między innymi:
  - Systemów operacyjnych i interfejsów użytkownika (Windows, Debian, Plesk itp.).
  - Wszelkiego innego oprogramowania firm trzecich (klienty FTP, programy pocztowe itp.).
  - Usług oferowanych przez innych dostawców (DNS, API, interfejsy użytkownika itp.).

Aby uzyskać odpowiednią pomoc w przypadku problemów, postępuj zgodnie z poniższymi wskazówkami:

- **Szukasz spersonalizowanej porady lub chcesz omówić temat, który nie został szczegółowo opisany w naszej dokumentacji?**<br />
  Dołącz do [społeczności OVHcloud](/links/community), aby wyszukać swój temat i skontaktować się z innymi użytkownikami.
- **Musisz zgłosić incydent dotyczący Twojej usługi OVHcloud lub masz trudności w panelu klienta OVHcloud?**<br />
  Utwórz zgłoszenie do wsparcia w naszym [centrum pomocy](/links/support-contact).
- **Potrzebujesz profesjonalnej pomocy przy swoim projekcie lub wsparcia w zadaniach wykraczających poza zakres naszego wsparcia?**<br />
  Odwiedź nasz [portal partnerów](/links/partner), aby znaleźć ekspertów znających rozwiązania OVHcloud.
- **Szukasz bardziej szczegółowych informacji o naszych poziomach wsparcia i usługach Professional Services?**<br />
  Odwiedź nasze strony internetowe: [poziomy wsparcia OVHcloud](/links/support) oraz [OVHcloud Professional Services](/links/professional-services).

Możesz uczestniczyć w ulepszaniu naszej dokumentacji:

- **Chcesz przekazać opinię, aby ulepszyć stronę przewodnika, lub zgłosić niewystarczające informacje na konkretnej stronie?**<br />
  Skorzystaj z przycisków „Czy ta strona była pomocna?” na dole strony, aby nas o tym poinformować.
- **Chcesz zaproponować konkretną aktualizację dokumentacji?**<br />
  Skorzystaj z funkcji „Edytuj tę stronę”, dostępnej na dole strony oraz w panelu bocznym.

</details>`,
    pt: `<details className="support">

<summary>Informações sobre a administração dos serviços OVHcloud e como encontrar a assistência adequada</summary>

Ao utilizar os guias da OVHcloud, tenha em conta as seguintes condições:

- As instruções procuram fornecer o máximo de detalhes possível, mas não podem abranger todos os casos de utilização individuais. Poderá ser necessário adaptar as ações descritas às suas necessidades.
- O ecossistema OVHcloud foi concebido para oferecer flexibilidade e liberdade de escolha. Os clientes são, por isso, responsáveis pela configuração correta e segura dos seus serviços. Para evitar a perda de dados, recomendamos vivamente a aplicação de estratégias de cópia de segurança a todos os seus dados importantes.
- Os nossos guias e tutoriais podem fazer referência a software ou serviços de terceiros em combinação com as soluções OVHcloud. O suporte técnico fornecido pela OVHcloud não inclui a configuração de sistemas ou produtos fora da nossa responsabilidade. Isto inclui, entre outros:
  - Sistemas operativos e interfaces de utilizador (Windows, Debian, Plesk, etc.).
  - Qualquer outro software de terceiros (clientes FTP, software de e-mail, etc.).
  - Serviços oferecidos por outros fornecedores (DNS, API, interfaces de utilizador, etc.).

Para receber a assistência adequada em caso de problemas, siga estas orientações:

- **Procura aconselhamento personalizado ou pretende discutir um tema que não é abordado em detalhe na nossa documentação?**<br />
  Junte-se à [comunidade OVHcloud](/links/community) para pesquisar o seu tema e falar com outros utilizadores.
- **Precisa de comunicar um incidente relativo ao seu serviço OVHcloud ou tem dificuldades na Área de Cliente OVHcloud?**<br />
  Crie um pedido de suporte no nosso [Centro de Ajuda](/links/support-contact).
- **Necessita de assistência profissional para o seu projeto ou de ajuda com tarefas fora do âmbito do nosso suporte?**<br />
  Visite o nosso [portal de parceiros](/links/partner) para encontrar especialistas familiarizados com as soluções OVHcloud.
- **Procura informações mais detalhadas sobre os nossos níveis de suporte e Professional Services?**<br />
  Visite as nossas páginas web sobre os [níveis de suporte OVHcloud](/links/support) e os [OVHcloud Professional Services](/links/professional-services).

Pode participar na melhoria da nossa documentação:

- **Pretende partilhar comentários para melhorar uma página de guia ou comunicar informações insuficientes numa página específica?**<br />
  Utilize os botões «Esta página foi útil?» no final da página para nos informar.
- **Pretende propor uma atualização concreta da documentação?**<br />
  Utilize a função «Editar esta página», disponível no final da página e na barra lateral.

</details>`,
  },
};
