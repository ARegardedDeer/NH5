import { AppNavigationProp } from '../types/navigation';

// Navigate to the root-level AnimeDetail screen from any nested navigator
export const navigateToAnimeDetail = (
  navigation: AppNavigationProp & { getParent?: () => any },
  animeId: string,
  title?: string,
) => {
  const params = { animeId, title };
  let nav: any = navigation;
  let parent = nav?.getParent?.();
  while (parent) {
    nav = parent;
    parent = nav?.getParent?.();
  }
  nav.navigate('AnimeDetail', params);
};
