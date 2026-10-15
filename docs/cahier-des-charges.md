# Cahier des Charges - Patch Note Software

## 1. Contexte et Objectifs
L'objectif de ce projet est de fournir une interface web intuitive permettant de gérer le cycle de vie des "Notes de Patch" (Patch Notes). Ces documents sont essentiels pour communiquer les nouveautés, correctifs et évolutions logicielles aux utilisateurs et parties prenantes.

L'application permet à un utilisateur de :
- Créer facilement une nouvelle note de patch.
- Consulter l'historique des notes de patch existantes.
- Éditer une note de patch existante pour y apporter des corrections ou des ajouts.
- Visualiser et Imprimer les notes de patch pour diffusion.

## 2. Fonctionnalités Clés

### 2.1 Création et Édition de Note de Patch (Builder)
- **Formulaire d'édition** : Interface riche pour saisir les informations.
- **Actions de Navigation** :
    - Bouton **"Retour"** (Header) : Revient intelligemment à la page précédente (Historique ou Vue Détail).
    - Bouton **"Enregistrer / Mettre à jour"** : Disponible en haut (Header) et en bas de page pour faciliter la sauvegarde. Redirige vers la page précédente après succès.
    - **Validation** : Les boutons d'enregistrement sont désactivés si le formulaire est invalide ou si une soumission est en cours.
- **Champs requis** :
  - **Auteur** : Sélection parmi les collaborateurs gérés dans les Paramètres.
  - **Date de MEP** (Mise en Production) : Sélecteur de date.
  - **Introduction** : Zone de texte libre pour le contexte global.
  - **Logiciels Impactés** : 
    - Ajout dynamique de sections par logiciel.
    - **Sélection du Logiciel** : Menu déroulant alimenté par la liste des logiciels gérée dans les Paramètres.
    - **Tablette** : un champ « numéro de version » apparaît, affiché sur la page de garde.
    - Pour chaque logiciel, ajout de lignes "Nouveautés" et "Correctifs".
    - **Smart Paste** : Le collage d'un bloc de texte multi-lignes dans un champ "Nouveauté" ou "Correctif" découpe automatiquement le texte pour créer une entrée par ligne.
    - **Affichage** : Les accordéons des logiciels sont ouverts par défaut en mode édition pour une vue d'ensemble rapide.

### 2.2 Consultation des Notes de Patch (Accueil)
- **Liste des notes** : Vue d'ensemble des cartes, triées par date.
- **Carte Patch Note (PatchNoteCard)** :
    - **Header** : Date et Auteur.
    - **Contenu** : Introduction tronquée pour la lisibilité.
    - **Logos Logiciels** : Logo à plat de chaque logiciel concerné ; ceux sans logo importé sont regroupés derrière un seul logo Ianord.
    - **Actions** : Menu déroulant permettant de :
        - **Voir / Imprimer** : Redirige vers la vue détaillée.
        - **Supprimer** : Archive/Supprime la note (avec confirmation).
    - **Bouton Éditer** : Accès direct au Builder.

### 2.3 Vue Détaillée et Impression (/note/[id])
- **Visualisation** : Affichage propre et structuré de la note complète.
- **Actions Toolbar** :
    - **Bouton Retour** : Retour à l'accueil.
    - **Bouton Éditer** : Accès rapide à la modification de la note en cours.
    - **Bouton Imprimer** : Déclenche l'impression navigateur (optimisée avec CSS `@media print` pour masquer l'interface inutile).

### 2.4 Paramètres (/settings)
- **Collaborateurs** : ajout, modification et suppression (prénom, nom, poste). Le poste s'affiche dans le PDF (« Présentation préparée par … »). Renommer un collaborateur met à jour ses notes.
- **Logiciels** : ajout, renommage (répercuté dans les notes existantes), suppression et ordre du menu.
  - **Logo à plat** : accueil et en-tête de chaque section du PDF. Sans logo importé : logo Ianord.
  - **Logo 3D** : page de garde du PDF. Sans logo 3D, le logiciel n'apparaît pas sur la page de garde.
  - Formats acceptés : SVG, PNG, WebP, JPEG (2 Mo max). Les logos sont stockés dans la base et servis par `/api/logos/[id]/[kind]`.

## 3. Stack Technique

Le projet repose sur une architecture moderne :

### 3.1 Frontend & Framework
- **[Next.js 16](https://nextjs.org/)** : App Router, Server Components.
- **[React 19](https://react.dev/)** : Hooks (`useForm`, `useFieldArray`).
- **TypeScript** : Pour la sécurité du typage.

### 3.2 Interface & Design System
- **[Tailwind CSS v4](https://tailwindcss.com/)** : Styling utility-first.
- **[Shadcn/ui](https://ui.shadcn.com/)** : Composants (Card, Button, Select, Accordion, DropdownMenu).
- **[Lucide React](https://lucide.dev/)** : Icônes (Pencil, Printer, Trash2, Save, etc.).

### 3.3 Identité Visuelle (Brand - Ianord)
- **Couleurs** :
  - **Primaire (Brand 800)** : `#35415A` (utilisé pour les headers et éléments forts).
  - **Secondaire / Accent** : Orange (utilisé pour les mises en avant dans la vue impression).
- **Typographie** :
  - **Titres** : **Poppins**.
  - **Corps** : **Inter**.

### 3.4 Gestion des Formulaires
- **React Hook Form** + **Zod** : Validation robuste et gestion d'état performante.

### 3.5 Backend
- **Neon (Postgres)** : Base de données.
- **Server Actions** : Mutations de données sécurisées.

## 4. Structure de Données
Schéma complet : `db/schema.sql`. Mise à jour de la base : `npm run db:migrate`.
- `PatchNote` : id, date, author, intro, content (JSONB : tableau des sections `{ name, features, fixes, tabletVersion? }`).
- `Member` : id, firstName, lastName, role.
- `Software` : id, name, position, logo3d / logoFlat (fichiers, NULL = logo Ianord) et leur type MIME.
