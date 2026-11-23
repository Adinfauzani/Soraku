export const SCHEDULE = `
  query ($page: Int, $perPage: Int, $weekStart: Int, $weekEnd: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      airingSchedules(airingAt_greater: $weekStart, airingAt_lesser: $weekEnd, sort: TIME) {
        id
        airingAt
        episode
        mediaId
        media { id title { romaji english native } coverImage { large } format episodes averageScore season seasonYear status studios { nodes { name } } }
      }
    }
  }`;

export const AIRING_SCHEDULE = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      airingSchedules(notYetAired: true, sort: TIME) {
        id
        airingAt
        episode
        mediaId
        media { id title { romaji english native } coverImage { large } format episodes averageScore season seasonYear status }
      }
    }
  }`;
