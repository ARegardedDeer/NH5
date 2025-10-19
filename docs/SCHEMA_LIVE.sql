--
-- PostgreSQL database dump
--

\restrict ojRzucF8NvIUFlqEYedghVpjEWxEXi7c8FDU8U2j6euusCgoeGKfw3WrOcOPmEY

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: anime; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anime (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    synopsis text,
    air_date date,
    voice_actors text[],
    episodes_count integer,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text,
    name text,
    description text,
    type text,
    tier integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT badges_type_check CHECK ((type = ANY (ARRAY['progress'::text, 'event'::text, 'genre'::text, 'secret'::text])))
);


--
-- Name: quest_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_responses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    quest_id uuid,
    user_responder_id uuid,
    anime_1 uuid,
    anime_2 uuid,
    notes text,
    accepted_by_requester boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_requester_id uuid,
    tag_requested text,
    short_note text,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'claimed'::text, 'closed'::text])))
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    anime_id uuid,
    user_id uuid,
    score_overall integer,
    score_by_tag jsonb,
    is_eleven_out_of_ten boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    device_user_id uuid,
    CONSTRAINT ratings_score_overall_check CHECK (((score_overall >= 1) AND (score_overall <= 10)))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    anime_id uuid,
    body text NOT NULL,
    score_by_criteria jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now(),
    is_showcased boolean DEFAULT false
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    bio text,
    show_level boolean DEFAULT true,
    show_socials boolean DEFAULT true,
    top_list_limit integer DEFAULT 10,
    updated_at timestamp with time zone DEFAULT now(),
    handle text,
    twitch text,
    x text,
    youtube text
);


--
-- Name: user_social_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_social_links (
    user_id uuid NOT NULL,
    platform text NOT NULL,
    url text NOT NULL,
    CONSTRAINT user_social_links_platform_check CHECK ((platform = ANY (ARRAY['youtube'::text, 'twitch'::text, 'twitter'::text])))
);


--
-- Name: user_toplist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_toplist (
    user_id uuid NOT NULL,
    anime_id uuid NOT NULL,
    "position" integer,
    note text,
    added_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_toplist_position_check CHECK (("position" > 0))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    username text,
    email text,
    avatar_url text,
    level integer DEFAULT 1,
    exp integer DEFAULT 0,
    badges text[] DEFAULT '{}'::text[],
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: xp_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    event_type public.xp_event_type NOT NULL,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: anime anime_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anime
    ADD CONSTRAINT anime_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: badges badges_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_slug_key UNIQUE (slug);


--
-- Name: quest_responses quest_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_responses
    ADD CONSTRAINT quest_responses_pkey PRIMARY KEY (id);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_anime_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_anime_id_user_id_key UNIQUE (anime_id, user_id);


--
-- Name: ratings ratings_device_anime_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_device_anime_key UNIQUE (device_user_id, anime_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- Name: user_profiles user_profiles_handle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_handle_key UNIQUE (handle);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_social_links user_social_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_links
    ADD CONSTRAINT user_social_links_pkey PRIMARY KEY (user_id, platform);


--
-- Name: user_toplist user_toplist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toplist
    ADD CONSTRAINT user_toplist_pkey PRIMARY KEY (user_id, anime_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: xp_events xp_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_events
    ADD CONSTRAINT xp_events_pkey PRIMARY KEY (id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_user_toplist_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_toplist_user ON public.user_toplist USING btree (user_id);


--
-- Name: ux_one_eleven_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_one_eleven_per_user ON public.ratings USING btree (user_id) WHERE (is_eleven_out_of_ten = true);


--
-- Name: ux_user_toplist_user_pos; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_user_toplist_user_pos ON public.user_toplist USING btree (user_id, "position");


--
-- Name: quest_responses quest_responses_anime_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_responses
    ADD CONSTRAINT quest_responses_anime_1_fkey FOREIGN KEY (anime_1) REFERENCES public.anime(id);


--
-- Name: quest_responses quest_responses_anime_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_responses
    ADD CONSTRAINT quest_responses_anime_2_fkey FOREIGN KEY (anime_2) REFERENCES public.anime(id);


--
-- Name: quest_responses quest_responses_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_responses
    ADD CONSTRAINT quest_responses_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quest_responses quest_responses_user_responder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_responses
    ADD CONSTRAINT quest_responses_user_responder_id_fkey FOREIGN KEY (user_responder_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quests quests_user_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_user_requester_id_fkey FOREIGN KEY (user_requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_social_links user_social_links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_links
    ADD CONSTRAINT user_social_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_toplist user_toplist_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toplist
    ADD CONSTRAINT user_toplist_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(id) ON DELETE RESTRICT;


--
-- Name: user_toplist user_toplist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toplist
    ADD CONSTRAINT user_toplist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: xp_events xp_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_events
    ADD CONSTRAINT xp_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: anime; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;

--
-- Name: ratings anon_insert_device_ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_insert_device_ratings ON public.ratings FOR INSERT TO anon WITH CHECK ((user_id IS NULL));


--
-- Name: ratings anon_select_device_ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_select_device_ratings ON public.ratings FOR SELECT TO anon USING (true);


--
-- Name: ratings anon_update_device_ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_update_device_ratings ON public.ratings FOR UPDATE TO anon USING ((user_id IS NULL)) WITH CHECK ((user_id IS NULL));


--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: anime dev_anime_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_anime_insert ON public.anime FOR INSERT WITH CHECK (true);


--
-- Name: anime dev_anime_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_anime_read ON public.anime FOR SELECT USING (true);


--
-- Name: badges dev_badges_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_badges_insert ON public.badges FOR INSERT WITH CHECK (true);


--
-- Name: badges dev_badges_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_badges_read ON public.badges FOR SELECT USING (true);


--
-- Name: quest_responses dev_qr_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_qr_insert ON public.quest_responses FOR INSERT WITH CHECK (true);


--
-- Name: quest_responses dev_qr_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_qr_read ON public.quest_responses FOR SELECT USING (true);


--
-- Name: quests dev_quests_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_quests_insert ON public.quests FOR INSERT WITH CHECK (true);


--
-- Name: quests dev_quests_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_quests_read ON public.quests FOR SELECT USING (true);


--
-- Name: ratings dev_ratings_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_ratings_insert ON public.ratings FOR INSERT WITH CHECK (true);


--
-- Name: ratings dev_ratings_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_ratings_read ON public.ratings FOR SELECT USING (true);


--
-- Name: ratings dev_ratings_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_ratings_select ON public.ratings FOR SELECT USING (true);


--
-- Name: ratings dev_ratings_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_ratings_update ON public.ratings FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: reviews dev_reviews_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_reviews_insert ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: reviews dev_reviews_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_reviews_read ON public.reviews FOR SELECT USING (true);


--
-- Name: user_badges dev_user_badges_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_user_badges_insert ON public.user_badges FOR INSERT WITH CHECK (true);


--
-- Name: user_badges dev_user_badges_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_user_badges_read ON public.user_badges FOR SELECT USING (true);


--
-- Name: users dev_users_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_users_insert ON public.users FOR INSERT WITH CHECK (true);


--
-- Name: users dev_users_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_users_read ON public.users FOR SELECT USING (true);


--
-- Name: xp_events dev_xp_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_xp_insert ON public.xp_events FOR INSERT WITH CHECK (true);


--
-- Name: xp_events dev_xp_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_xp_read ON public.xp_events FOR SELECT USING (true);


--
-- Name: quest_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quest_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: quests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

--
-- Name: ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: xp_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ojRzucF8NvIUFlqEYedghVpjEWxEXi7c8FDU8U2j6euusCgoeGKfw3WrOcOPmEY

