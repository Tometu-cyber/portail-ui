# @portail/ui

Composants React du design system **Portail** (Liquid Glass sur mobile, style macOS sur ordi),
partagés entre Pecunia et hop. Référence visuelle : l'artefact « Portail ».

- React 19, sans dépendance à un framework : marche avec Next.js comme avec Vite.
- Styles en CSS classique (classes `pt-*`), sans Tailwind. Les apps qui utilisent Tailwind
  peuvent brancher les tokens dessus (voir plus bas).
- Pictogrammes : [lucide-react](https://lucide.dev), au trait de 1,75.

## Installation (depuis git)

Depuis npm 12, les dépendances git sont refusées par défaut (`EALLOWGIT`). Dans l'app, les
autoriser pour celles de son propre `package.json`, dans un fichier `.npmrc` à la racine :

```ini
allow-git=root
```

Puis :

```bash
npm install github:Tometu-cyber/portail-ui#v0.1.0
```

npm clone le dépôt au tag demandé, lance le build (`prepare`) dans ce clone et n'installe que
le paquet construit (`dist/` et `src/`). npm affiche ensuite « install scripts blocked » pour
`@portail/ui` : c'est sans effet, le build a déjà eu lieu.

Pour mettre à jour : poser un nouveau tag ici, puis changer le tag dans l'app.

## Utilisation

```tsx
import "@portail/ui/styles.css"; // une fois, à la racine de l'app
import { Button, ListRow, TabBar } from "@portail/ui";

<Button icon="plus" href="/depenses/nouvelle">Ajouter une dépense</Button>
```

### Thème et couleur d'app

- Thème sombre : `data-theme="dark"` sur `<html>` (clair par défaut).
- Couleur d'accent : la classe `pt-app-<app>` (`finances`, `sport`, `alternance`,
  `alimentation`, `notes`) sur un conteneur. **La poser sur `<body>`** : la `Modal` et la liste
  du `Select` sont rendues à la racine du document et la prennent de là. Sans classe, c'est le
  bleu du portail. La plupart des composants acceptent aussi une prop `app`.

### Liens

Avec `href`, `Button`, `GlassButton`, `ListRow`, `AppTile`, `Menu`, `Sidebar` et `TabBar`
rendent une balise `<a>`. Pour utiliser le lien de l'app (navigation sans rechargement) :

```tsx
import { setLinkComponent } from "@portail/ui";
setLinkComponent(Link); // une fois, au démarrage (React Router, Next.js…)

<Button href="/budgets" linkAs={Link}>Voir</Button> // ou pour un seul composant
```

Avec Next.js (App Router), le code serveur et le code client sont deux mondes séparés :
appeler `setLinkComponent(Link)` dans un module `"use client"` chargé par le layout racine
couvre les composants client (`TabBar`, `Menu`, `Sidebar`…). Dans un composant serveur, passer
`linkAs={Link}`.

### Pictogrammes

Toutes les props `icon` acceptent un nom du design system (`icon="plus"`, la liste `IconName`
de l'artefact) ou un composant lucide (`icon={Plus}`) pour un pictogramme hors liste.
`<Icon name="trash" />` affiche un pictogramme seul.

### Avec Tailwind (Pecunia)

```css
@import "tailwindcss";
@import "@portail/ui/styles.css" layer(components); /* une classe utilitaire peut surcharger un composant */
@import "@portail/ui/tailwind-theme.css";           /* bg-bg-grouped, text-label, rounded-lg… */
```

## Contenu

| Fichier | Composants |
| --- | --- |
| `app-header` | `AppHeader` |
| `app-icon`, `app-tile` | `AppIcon`, `AppTile` |
| `button`, `glass-button` | `Button`, `GlassButton` |
| `card`, `list` | `Card`, `List`, `ListRow` |
| `text-field`, `select`, `toggle`, `segmented-control`, `date-picker` | champs et contrôles, `Calendar` |
| `menu`, `sheet`, `overlay` | `Menu`, `Sheet`, `Modal`, `ToastProvider` / `useToast` |
| `tab-bar`, `sidebar` | `TabBar`, `Sidebar` |
| `bar-chart`, `line-chart`, `progress-ring` | graphiques |
| `swipe-actions`, `spinner` | `SwipeActions`, `Spinner` |
| `icon`, `category-icon` | `Icon`, `Glyph` ; `IconBadge`, `iconFor` (icônes de catégories de Pecunia) |
| `link` | `setLinkComponent`, types `LinkComponent`, `Linkable` |

## Écarts avec l'API de l'artefact

Les composants viennent de Pecunia. Un seul diffère de l'artefact, et c'est un choix :

- `Select` garde l'API de Pecunia, celle d'un `<select>` natif : options en enfants
  (`<option value>`) et `onChange(event)` avec `event.target.value`. L'artefact (et donc hop
  aujourd'hui) prend `options={[…]}`, `onChange(value)` et `size`.

  Pour passer un appel de hop à cette API :

  ```tsx
  // avant (artefact)
  <Select options={options} value={vue} onChange={changeVue} size="small" app="notes" />
  // après (@portail/ui) ; la taille suit l'écran : regular sur mobile, small à partir de 768 px
  <Select value={vue} onChange={(e) => changeVue(e.target.value)} app="notes">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </Select>
  ```

## Développement

```bash
npm install       # installe et construit dist/
npm run typecheck # vérifie les types
npm run build     # reconstruit dist/
```

Pour essayer une modification dans une app sans poser de tag : `npm link` ici, puis
`npm link @portail/ui` dans l'app (et `npm run build` ici après chaque changement).
