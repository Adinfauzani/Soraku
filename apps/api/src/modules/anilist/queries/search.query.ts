export const SEARCH = `
  query ($q: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(search: $q, type: ANIME, isAdult: false) { id title { romaji english native } coverImage { large } description genres averageScore status season seasonYear format episodes studios { nodes { name } } }
    }
  }`;

export const FILTER = `
  query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $format: MediaFormat, $genre: String, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(season: $season, seasonYear: $seasonYear, status: $status, format: $format, genre: $genre, sort: $sort, type: ANIME, isAdult: false) { id title { romaji english native } coverImage { large } description genres averageScore status season seasonYear format episodes }
    }
  }`;
