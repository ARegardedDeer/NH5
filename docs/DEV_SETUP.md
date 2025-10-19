# NH5 Dev Setup & Recovery

## Package manager
- **npm only**. We enforce this with `only-allow`.
- If you used Yarn previously, run: `rm -rf node_modules && npm ci`.

## Watchman
Metro asks Watchman for files (incl. dependencies). Keep `node_modules` **visible**.
`.watchmanconfig`:
```json
{ "ignore_dirs": [".git", "ios/Pods", "android/build", "android/app/build"] }
```

## Handy dev scripts
- `npm run dev:metro` starts Metro with a cache reset.
- `npm run dev:ios` launches the iPhone 15 simulator build.
- `npm run dev:android` launches Android in the default Terminal app.
- `npm run dev:kill` frees the Metro port in case it is stuck.
- `npm run dev:reset` runs the full recovery script below.

## Full reset workflow
`tools/dev/reset.sh` reinitializes Watchman, frees Metro (`:8081`), and restarts it with a clean cache:
```bash
bash ./tools/dev/reset.sh
```
Use it when Metro gets stuck, simulators refuse to connect, or Watchman throws permission errors.
