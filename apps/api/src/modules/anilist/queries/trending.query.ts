export const TRENDING = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id title { romaji english native } bannerImage coverImage { large } genres format episodes averageScore season seasonYear status description studios { nodes { name } } nextAiringEpisode { episode timeUntilAiring }
      }
    }
  }`;

export const POPULAR = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id title { romaji english native } coverImage { large } description genres averageScore status season seasonYear format episodes }
    }
  }`;

export const TOP_RATED = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: SCORE_DESC, type: ANIME, isAdult: false) { id title { romaji english native } bannerImage coverImage { large } genres format episodes averageScore season seasonYear status description studios { nodes { name } } }
    }
  }`;

export const AIRING = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(status: RELEASING, sort: TRENDING_DESC, type: ANIME, isAdult: false) { id title { romaji english native } bannerImage coverImage { large } genres format episodes averageScore season seasonYear status description studios { nodes { name } } nextAiringEpisode { episode timeUntilAiring } }
    }
  }`;

export const RECENT = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: START_DATE_DESC, status: RELEASING, type: ANIME, isAdult: false) { id title { romaji english native } bannerImage coverImage { large } genres format episodes averageScore season seasonYear status description studios { nodes { name } } nextAiringEpisode { episode timeUntilAiring } }
    }
  }`;

export const SEASONAL = `
  query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(season: $season, seasonYear: $seasonYear, sort: TRENDING_DESC, type: ANIME, isAdult: false) { id title { romaji english native } bannerImage coverImage { large } genres format episodes averageScore season seasonYear status description studios { nodes { name } } }
    }
  }`;
