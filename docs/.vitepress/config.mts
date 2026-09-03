import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Glossaire de Drissa',
  description: "Lexique personnel — tech & business pour un dev senior fondateur de Kelenpe",
  lang: 'fr-FR',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Rechercher un terme', buttonAriaLabel: 'Rechercher un terme' },
              modal: {
                noResultsText: 'Aucun résultat pour',
                resetButtonTitle: 'Réinitialiser la recherche',
                footer: { selectText: 'sélectionner', navigateText: 'naviguer', closeText: 'fermer' }
              }
            }
          }
        }
      }
    },

    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Glossaire A-Z', link: '/glossaire' },
      {
        text: 'Sections',
        items: [
          { text: 'Backend & architecture', link: '/backend/' },
          { text: 'Frontend & UI/UX', link: '/frontend/' },
          { text: 'DevOps & infra', link: '/devops/' },
          { text: 'Transcoding & streaming vidéo', link: '/streaming/' },
          { text: 'Édition média & traitement image', link: '/media/' },
          { text: 'Jargon entrepreneurial & investisseurs', link: '/business/' }
        ]
      }
    ],

    sidebar: {
      '/backend/': [{ text: 'Backend & architecture', items: [{ text: 'Vue d’ensemble', link: '/backend/' }] }],
      '/frontend/': [{ text: 'Frontend & UI/UX', items: [{ text: 'Vue d’ensemble', link: '/frontend/' }] }],
      '/devops/': [{ text: 'DevOps & infra', items: [{ text: 'Vue d’ensemble', link: '/devops/' }] }],
      '/streaming/': [{ text: 'Transcoding & streaming vidéo', items: [{ text: 'Vue d’ensemble', link: '/streaming/' }] }],
      '/media/': [{ text: 'Édition média & traitement image', items: [{ text: 'Vue d’ensemble', link: '/media/' }] }],
      '/business/': [{ text: 'Jargon entrepreneurial & investisseurs', items: [{ text: 'Vue d’ensemble', link: '/business/' }] }],
      '/': [{ text: 'Glossaire', items: [{ text: 'Index alphabétique', link: '/glossaire' }] }]
    },

    socialLinks: [],

    footer: {
      message: 'Lexique personnel — mis à jour en continu.',
      copyright: 'Drissa Sidiki Traoré · Kelenpe'
    },

    outline: { label: 'Sur cette page' },
    docFooter: { prev: 'Page précédente', next: 'Page suivante' },
    lastUpdatedText: 'Dernière mise à jour'
  }
})
