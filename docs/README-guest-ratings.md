# Guest Ratings (device_user_id) — How to apply

## Apply SQL migration in Supabase
Open Supabase Dashboard → SQL Editor, paste and run:
`docs/sql/2025-guest-ratings-device.sql`

## Verify via REST
1) Pick an existing anime UUID from `rest/v1/anime`
2) Replace tokens below and run:

```bash
SUPABASE_URL="https://lnlkxrqrnkgjbbpjmszu.supabase.co"
SUPABASE_ANON_KEY="<your anon key>"
ANIME_ID="<uuid from anime>"
DEVICE_ID="00000000-0000-4000-8000-000000000000"

curl -s -o /tmp/r.json -w "\nHTTP %{http_code}\n" \
  -X POST "$SUPABASE_URL/rest/v1/ratings?on_conflict=device_user_id,anime_id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d "{\"device_user_id\":\"$DEVICE_ID\",\"anime_id\":\"$ANIME_ID\",\"score_overall\":9,\"is_eleven_out_of_ten\":false}"

cat /tmp/r.json
```
