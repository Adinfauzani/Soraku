export const ANIME_INFO = `
  query ($id: Int) {
    Media(id: $id, type: ANIME, isAdult: false) {
      id
      title { romaji english native }
      coverImage { large }
      bannerImage
      description
      genres
      averageScore
      status
      season
      seasonYear
      format
      episodes
      duration
      source
      countryOfOrigin
      hashtag
      trailer { id site thumbnail }
      studios { nodes { name } }
      nextAiringEpisode { episode timeUntilAiring airingAt }
      relations {
        edges {
          relationType
          node {
            id title { romaji english } coverImage { large } format status episodes averageScore isAdult
          }
        }
      }
      recommendations(perPage: 5, sort: RATING_DESC) {
        nodes {
          mediaRecommendation {
            id title { romaji english } coverImage { large } format status episodes averageScore isAdult
          }
        }
      }
    }
  }`;

export const CHARACTERS = `
  query ($id: Int, $page: Int, $perPage: Int) {
    Media(id: $id, type: ANIME, isAdult: false) {
      characters(page: $page, perPage: $perPage) {
        edges {
          role
          node { id name { full native } image { large } }
          voiceActors { id name { full } language image { large } }
        }
      }
    }
  }`;
