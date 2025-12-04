export type UserListStatus =
  | 'Watching'
  | 'Rewatching'
  | 'Plan to Watch'
  | 'On Hold'
  | 'Completed'
  | 'Dropped';

export const USER_LIST_STATUSES: UserListStatus[] = [
  'Watching',
  'Rewatching',
  'Plan to Watch',
  'On Hold',
  'Completed',
  'Dropped',
];

export function assertUserListStatus(x: string): asserts x is UserListStatus {
  if (!USER_LIST_STATUSES.includes(x as UserListStatus)) {
    throw new Error(
      `[MyListStatus] invalid status "${x}". Must be one of: ${USER_LIST_STATUSES.join(', ')}`
    );
  }
}

export function coerceUserListStatus(x: string): UserListStatus | null {
  return USER_LIST_STATUSES.includes(x as UserListStatus) ? (x as UserListStatus) : null;
}
