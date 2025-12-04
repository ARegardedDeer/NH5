<!--
WARNING: Do not rename this file manually!
File name: architecture-00004.md
This file is managed by ByteRover CLI. Only edit the content below.
Renaming this file will break the link to the playbook metadata.
-->

Add to list flow: useAddToList hook upserts to user_lists table with onConflict: 'user_id,anime_id'. For 'Watching' status, set current_episode=1, started_at=now, last_watched_at=now. Always invalidate queries: ['continue-watching', userId], ['my-list-active'], ['my-list-status'] after mutations.