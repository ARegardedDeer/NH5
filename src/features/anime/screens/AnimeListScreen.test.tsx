import React from 'react';
import {render} from '@testing-library/react-native';

import AnimeListScreen from './AnimeListScreen';

describe('AnimeListScreen', () => {
  it('shows the anime library placeholder copy', () => {
    const {getByText} = render(<AnimeListScreen />);

    expect(getByText('Anime Library')).toBeTruthy();
    expect(
      getByText('Your curated watchlist will live here.'),
    ).toBeTruthy();
  });
});
