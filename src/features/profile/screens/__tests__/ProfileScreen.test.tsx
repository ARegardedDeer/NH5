import React from 'react';
import {render} from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import {useProfileData} from '../../hooks/useProfileData';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate}),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../hooks/useProfileData');

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    (useProfileData as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      errorText: undefined,
      user: {
        id: 'user-1',
        username: 'jj',
        avatar_url: null,
        level: 12,
        exp: 3200,
        handle: 'jj',
      },
      profile: {
        display_name: 'J.J.',
        bio: 'Connoisseur of joy.',
        show_socials: true,
        social_x: '@jj',
      },
      badges: [],
      eleven: undefined,
      topList: [],
      socials: [],
      stats: {
        watchedCount: 42,
        reviewedCount: 7,
        accountScore: 3200,
      },
      isOwner: false,
      refetch: jest.fn(),
    });
  });

  it('renders stats for the profile and hides edit for non-owners', () => {
    const {getByText, queryByText} = render(<ProfileScreen />);

    expect(getByText('Animes Watched')).toBeTruthy();
    expect(getByText('Animes Reviewed')).toBeTruthy();
    expect(getByText('Account Score')).toBeTruthy();
    expect(queryByText('Edit')).toBeNull();
  });
});
