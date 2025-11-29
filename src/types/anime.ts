export interface Anime {
  id: string;
  title: string;
  thumbnail_url: string | null;
  synopsis?: string | null;
  tags?: string[] | null;
  episodes_count: number | null;
  air_date?: string | null;
  created_at?: string;
  has_specials: boolean;
}
