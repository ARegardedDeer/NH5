<!--
WARNING: Do not rename this file manually!
File name: architecture-00005.md
This file is managed by ByteRover CLI. Only edit the content below.
Renaming this file will break the link to the playbook metadata.
-->

My List screen: FAB + bottom sheet integrated at screen level. Use useRef<BottomSheet> for programmatic control (expand/close). isAddSheetOpen state syncs FAB fade animation. Sheet stays open after adding anime (allows batch adding). Components: FloatingActionButton, AddAnimeSheet, SearchResultRow.