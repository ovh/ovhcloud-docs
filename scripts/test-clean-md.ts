#!/usr/bin/env npx tsx
/**
 * Tests for the per-page Markdown cleanup (scripts/lib/llms/clean-md.ts).
 * Run: npx tsx scripts/test-clean-md.ts   (part of `pnpm llms:test`)
 *
 * Each input reproduces a shape found in real Rspress `.md` output.
 */
import { cleanMarkdown, findResidue, htmlLinks } from './lib/llms/clean-md';

let passed = 0;
const failures: string[] = [];
function check(label: string, condition: boolean, detail = ''): void {
  if (condition) passed += 1;
  else failures.push(detail ? `${label}\n${detail}` : label);
}
function expectClean(
  label: string,
  input: string,
  expected: string,
  options: Parameters<typeof cleanMarkdown>[1] = { locale: 'en' },
): void {
  const out = cleanMarkdown(input, options);
  check(
    label,
    out === expected,
    `--- got:\n${out}\n--- expected:\n${expected}`,
  );
  check(`${label} (idempotent)`, cleanMarkdown(out, options) === out);
}

// --- UI labels ---
expectClean(
  'action code and ManagerLink become quoted labels (en)',
  'Open <ManagerLink to="/#/web-domains/domain">Domain names</ManagerLink>, then click <code className="action">Edit</code>.\n',
  'Open "Domain names", then click "Edit".\n',
);
expectClean(
  'quotes follow the locale (fr)',
  '- **Lien direct :** <ManagerLink to="/#/x">Noms de domaine</ManagerLink>\n- <code className="action">Web Cloud</code> > <code className="action">Noms de domaine</code>\n',
  '- **Lien direct :** « Noms de domaine »\n- « Web Cloud » > « Noms de domaine »\n',
  { locale: 'fr' },
);
expectClean(
  'ManagerLink with an object prop',
  "From <ManagerLink urls={{ eu: 'https://a/', ca: 'https://b/' }}>So you Start</ManagerLink>.\n",
  'From "So you Start".\n',
);
expectClean(
  'ApiLink, Tooltip and CreateToken keep their text',
  'Open the <ApiLink>OVHcloud API</ApiLink> and a <Tooltip term="dnsZone">DNS zone</Tooltip> from <CreateToken rights="GET=/x">this page</CreateToken>.\n',
  'Open the OVHcloud API and a DNS zone from this page.\n',
);
expectClean(
  'Api call becomes an inline endpoint',
  '1. Call:\n\n   <Api version="v1" section="/dedicatedCloud" method="POST" route={"/dedicatedCloud/\\\\{serviceName\\\\}/user"} />\n',
  '1. Call:\n\n   `POST /dedicatedCloud/{serviceName}/user`\n',
);

// --- Callouts ---
expectClean(
  'callout becomes a labelled paragraph, glued paragraph split',
  'Plug in your key.\n:::warning\nA pop-up will open.\n:::\nNext step.\n',
  'Plug in your key.\n\n**Warning:** A pop-up will open.\n\nNext step.\n',
);
expectClean(
  'callout labels and colon spacing follow the locale (fr)',
  ':::danger\nCette action est irréversible.\n:::\n',
  '\n**Important :** Cette action est irréversible.\n',
  { locale: 'fr' },
);
expectClean(
  'callout opening with a list keeps the label on its own line',
  ':::info\n- one\n- two\n:::\n',
  '\n**Note:**\n- one\n- two\n',
);
expectClean(
  'callout glued behind an image',
  'Text.\n![Shot](/images/a.png):::tip\nUse it.\n:::\n',
  'Text.\n\n**Tip:** Use it.\n',
);
expectClean(
  ':::details becomes a subheading',
  '## Charts\n\n:::details Chart editor tabs\nBody.\n:::\n',
  '## Charts\n\n### Chart editor tabs\n\nBody.\n',
);

// --- Visual-only content and anchors ---
expectClean(
  'images removed, glued text kept',
  'Before.\n![Tab](/images/tab.png)Click the button.\n<img className="thumbnail" alt="x" src="/a.png" loading="lazy" />\n',
  'Before.\nClick the button.\n',
);
expectClean(
  'video in a table cell removed',
  '| <video className="thumbnail" autoPlay loop muted src="/a.mp4" /> | 1. Go to Mail. |\n',
  '|  | 1. Go to Mail. |\n',
);
expectClean(
  'heading anchors and empty links removed',
  '### Best practices [](#)\nText.\n\n#### Launching <a name="via-cp" />\n[](#)#### Step 1.3\n',
  '### Best practices\n\nText.\n\n#### Launching\n\n#### Step 1.3\n',
);

// --- Regions: every zone kept, labelled ---
const OPEN = '\u{F0004}';
const SEP = '\u{F0005}';
const CLOSE = '\u{F0006}';
expectClean(
  'nested Region blocks become labelled quotes, dedented in their list',
  "- Offers:\n  <Region zones={['eu']}>\n    - MX Plan EU\n  </Region>\n  <Region zones={['ca', 'apac']}>\n    - MX Plan CA\n  </Region>\n  - Other\n",
  '- Offers:\n\n  > **Zone: Europe / Africa**\n  >\n  > - MX Plan EU\n\n  > **Zones: Canada / Americas, Asia / Pacific**\n  >\n  > - MX Plan CA\n\n  - Other\n',
);
expectClean(
  'adjacent inline variants share one parenthetical; excludeZones is the other zones',
  "Mail: <Region zones={['ca']}>mx.ovh.ca</Region><Region excludeZones={['ca']}>mx.ovh.net</Region>.\n",
  'Mail: (Canada / Americas: mx.ovh.ca; Europe / Africa, Asia / Pacific: mx.ovh.net).\n',
);
expectClean(
  'labels follow the locale (fr)',
  "Offre : <Region zones={['eu']}>Perso, Pro</Region> <Region zones={['ca', 'apac']}>Perso</Region>.\n\n<Region zones={['ca']}>\nTexte CA.\n</Region>\n",
  'Offre : (Europe / Afrique : Perso, Pro ; Canada / Amérique, Asie / Pacifique : Perso).\n\n> **Zone : Canada / Amérique**\n>\n> Texte CA.\n',
  { locale: 'fr' },
);
expectClean(
  'callout and code inside a zone block are cleaned, then quoted',
  "<Region zones={['ca']}>\n:::warning\nCheck the server.\n:::\n\n```bash\ndig mx.ovh.ca\n```\n</Region>\n",
  '> **Zone: Canada / Americas**\n>\n> **Warning:** Check the server.\n>\n> ```bash\n> dig mx.ovh.ca\n> ```\n',
);
expectClean(
  'a variant shown in every zone needs no label',
  '<Region excludeZones={[]}>\nEverywhere.\n</Region>\n',
  'Everywhere.\n',
);
expectClean(
  'markers rendered by the Region component (block and inline)',
  `Intro.\n\n${OPEN}eu${SEP}\nEU only.\n\n${CLOSE}\n\nPlans: ${OPEN}eu,ca${SEP}MX Plan${CLOSE}${OPEN}apac${SEP}Starter${CLOSE}.\n`,
  'Intro.\n\n> **Zone: Europe / Africa**\n>\n> EU only.\n\nPlans: (Europe / Africa, Canada / Americas: MX Plan; Asia / Pacific: Starter).\n',
);

expectClean(
  'regions wrapping only cards: inline markers, rendered lines, back to back',
  `- [A](https://x/a)\n${OPEN}eu,ca${SEP}- [B](https://x/b)\n- [C](https://x/c)\n${CLOSE}${OPEN}eu${SEP}- [D](https://x/d)\n${CLOSE}\n`,
  '- [A](https://x/a)\n\n> **Zones: Europe / Africa, Canada / Americas**\n>\n> - [B](https://x/b)\n> - [C](https://x/c)\n\n> **Zone: Europe / Africa**\n>\n> - [D](https://x/d)\n',
);

expectClean(
  'inline variants rendered by the component keep their sentence',
  `Disponible pour ${OPEN}eu${SEP}Hosted, Private et Trusted\n${CLOSE}${OPEN}ca,apac${SEP}Hosted\n${CLOSE}. Suite.\n\n${OPEN}eu${SEP}MX Plan\n${CLOSE} est inclus.\n`,
  'Disponible pour (Europe / Afrique : Hosted, Private et Trusted ; Canada / Amérique, Asie / Pacifique : Hosted). Suite.\n\n(Europe / Afrique : MX Plan) est inclus.\n',
  { locale: 'fr' },
);
expectClean(
  'a block rendered by the component, text right after the marker',
  `Intro.\n\n${OPEN}ca${SEP}First paragraph.\n\nSecond.\n${CLOSE}\n\nAfter.\n`,
  'Intro.\n\n> **Zone: Canada / Americas**\n>\n> First paragraph.\n>\n> Second.\n\nAfter.\n',
);

// --- Structure recovered from the source ---
const faqSource = `### Topic

<details>

<summary>How do I **create** an account?</summary>

Answer.

<Tabs>
  <Tab label="Step 1">
    Go.
  </Tab>
</Tabs>

</details>
`;
expectClean(
  'summary and nested tab label become nested subheadings',
  '### Topic\n\n\nHow do I create an account?\n\nAnswer.\n\n**Step 1**\n\nGo.\n',
  '### Topic\n\n#### How do I create an account?\n\nAnswer.\n\n##### Step 1\n\nGo.\n',
  { locale: 'en', source: faqSource },
);
expectClean(
  'a bold line that is not a tab label stays bold',
  '## Intro\n\n**Step 1**\n\n## Next\n\n**Step 1**\n\nGo.\n',
  '## Intro\n\n### Step 1\n\n## Next\n\n**Step 1**\n\nGo.\n',
  { locale: 'en', source: '<Tab label="Step 1">\n  Go.\n</Tab>\n' },
);
expectClean(
  'raw nested details',
  '1. Check:\n\n    <details>\n      <summary>\n        Example\n      </summary>\n\n      Result.\n    </details>\n',
  '1. Check:\n\n## Example\n\n      Result.\n',
  { locale: 'en' },
);

expectClean(
  'a zone tab carries its zones in its heading',
  '## Email\n\n**MX Plan**\n\nText.\n\n**Exchange**\n\nMore.\n\n**Any**\n\nAll.\n',
  '## Email\n\n### MX Plan (Europe / Africa)\n\nText.\n\n### Exchange (Europe / Africa, Canada / Americas)\n\nMore.\n\n### Any\n\nAll.\n',
  {
    locale: 'en',
    source:
      '<ZoneTabs>\n  <Tab label="MX Plan" availableIn={[\'eu\']}>\n  </Tab>\n  <Tab label="Exchange" availableIn={[\'eu\', \'ca\']}>\n  </Tab>\n  <Tab label="Any">\n  </Tab>\n</ZoneTabs>\n',
  },
);

// --- Code is never touched ---
expectClean(
  'fenced and inline code preserved',
  'Use `<ManagerLink>` here.\n\n```mdx\n:::info\n<code className="action">X</code> ![a](b)\n:::\n```\n',
  'Use `<ManagerLink>` here.\n\n```mdx\n:::info\n<code className="action">X</code> ![a](b)\n:::\n```\n',
);
expectClean(
  'fence glued behind an image',
  'Shot:\n![Interfaces](/images/i.png)```sh\nip a ![x](y)\n```\n',
  'Shot:\n\n```sh\nip a ![x](y)\n```\n',
);

// --- Lists ---
expectClean(
  'paragraph glued to a list is separated',
  '- one\n- two\nOn the next page.\n',
  '- one\n- two\n\nOn the next page.\n',
);

// --- Links rendered by components ---
expectClean(
  'site-relative links become absolute .md, empty destinations plain text',
  '- [DNS zone](/en/guides/web-cloud/domains/dns-zone#records): The file.\n- [Soon](#)\n- [Docs](https://docs.example.com/en/guides/a.md)\n- [PDF](/files/a.pdf)\n',
  '- [DNS zone](https://docs.example.com/en/guides/web-cloud/domains/dns-zone.md#records): The file.\n- Soon\n- [Docs](https://docs.example.com/en/guides/a.md)\n- [PDF](https://docs.example.com/files/a.pdf)\n',
  { locale: 'en', siteUrl: 'https://docs.example.com' },
);

// --- llms-full links ---
check(
  'htmlLinks: own .md links to web pages, other sites untouched',
  htmlLinks(
    '[A](https://docs.example.com/fr/guides/a.md) [B](https://docs.example.com/fr/guides/b.md#step-2) [R](https://github.com/o/r/blob/main/README.md) [C](https://docs.example.com/fr/llms.txt)',
    'https://docs.example.com',
  ) ===
    '[A](https://docs.example.com/fr/guides/a) [B](https://docs.example.com/fr/guides/b#step-2) [R](https://github.com/o/r/blob/main/README.md) [C](https://docs.example.com/fr/llms.txt)',
);

// --- Residue ---
check(
  'residue finds components and directives, not placeholders',
  JSON.stringify(
    findResidue(
      'Use <host> and <IP>.\n<Foo bar="1">x</Foo>\n:::info\n`<Code />`\n',
    ),
  ) === JSON.stringify(['<Foo bar=', '</Foo>', ':::info']),
);
check(
  'residue reports an unmatched zone marker',
  findResidue('Text \u{F0004}eu\u{F0005} left open.\n').includes(
    'unmatched <Region> marker',
  ),
);

console.log(`clean-md: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}\n`);
  process.exit(1);
}
