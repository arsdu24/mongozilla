export type SearchOptionsCriteria<T extends {}> = {
  $sort?: SearchSortCriteria<T>;
  $skip?: number;
  $limit?: number;
};

export type SearchSortCriteria<T extends {}> = {
  [P in keyof T]?: T[P] extends {} ? SearchSortCriteria<T[P]> : -1 | 1;
};
