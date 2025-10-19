import React from 'react';
import {render} from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import {useProfileData} from '../../hooks/useProfileData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../hooks/useProfileData');

describe('ProfileScreen', () => {
  beforeEach(() => {
    (useProfileData as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      user: {
        id: 'user-1',
        username: 'jj',
        avatar_url: null,
        level: 12,
      },
      profile: {
        bio: 'Connoisseur of joy.',
        show_level: true,
        show_socials: true,
      },
      badges: [],
      eleven: null,
      topList: [],
      socials: [
        {
          platform: 'twitter',
          url: 'https://x.com/jj',
        },
      ],
      refetch: jest.fn(),
    });
  });

  it('renders the primary profile sections', () => {
    const {getByTestId, getByText} = render(<ProfileScreen />);

    expect(getByTestId('ProfileHeader')).toBeTruthy();
    expect(getByText('Showcased Badges')).toBeTruthy();
    expect(getByTestId('ElevenHighlightSection')).toBeTruthy();
    expect(getByTestId('TopListSection')).toBeTruthy();
    expect(getByTestId('SocialLinksSection')).toBeTruthy();
  });
});
