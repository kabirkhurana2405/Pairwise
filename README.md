# Pairwise — Full MVP Prototype

A minimal matchmaking product with a working demo journey, Supabase authentication and storage, profile building, discovery, likes, mutual matches, chat, and AI Chemistry.

## What is included

- Email/password sign-up, login, persisted Supabase sessions and logout.
- Profile creation and editing (name, age, city, work, bio, interests, values, relationship intention and communication style).
- Discovery cards populated with fictional seed profiles.
- Like, pass, incoming likes, reciprocal likes and automatic mutual-match creation.
- One-to-one chat after a mutual match.
- AI Chemistry: shared context, interesting overlaps, a difference to explore, a personal opener and a date idea.
- Demo mode that works without Supabase or OpenAI keys.
- Responsive minimal interface (no admin dashboard).

## 1. Run the demo immediately

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Explore the live demo**. Demo mode includes:
- A pre-filled editable profile.
- Sample discovery profiles.
- Two incoming likes.
- One existing match with an example conversation.
- A simulated mutual-match flow (liking Dev creates a match).
- Sample AI Chemistry responses.

Demo activity is local to the current browser session and is not written to Supabase.

## 2. Create and configure Supabase

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor → New query**.
3. Paste the full contents of `supabase/schema.sql` and run it.
4. In **Project Settings → API**, copy the Project URL and the `anon` / publishable key.
5. In the project root, create `.env.local` using this format:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

6. Restart `npm run dev`.

Never put the Supabase `service_role` key in a browser environment variable. This application only needs the anon/publishable key; Row Level Security policies protect member data.

### Configure email authentication

In Supabase, open **Authentication → URL Configuration**:
- Set Site URL to `http://localhost:3000` for local testing.
- Add `http://localhost:3000/**` to Redirect URLs.
- Before going live, add the deployed Vercel URL and its `/**` redirect pattern.
- Keep email confirmation enabled for a real launch. During a quick private test you may disable email confirmations in **Authentication → Providers → Email**, but turn it back on before inviting real users.

When email confirmation is enabled, signing up may show a “check your inbox” message. Confirm the address, then log in.

## 3. How the seeded match flow works

The SQL creates six fictional demo profiles. Mira and Zoya are configured as starter incoming likes: whenever a new member profile is created, they are added as incoming likes for that profile.

- Open **Likes** and choose **Like back** to create a mutual match.
- In **Discover**, liking someone who has already liked you creates a match automatically.
- A database trigger creates the match row only when both directional likes exist.
- Matched profiles appear under **Matches** and can exchange messages.

The seed profiles are fictional examples. Replace them with consented test data before any public launch.

## 4. Enable live AI Chemistry (optional)

Add an OpenAI API key to `.env.local` (and later Vercel Environment Variables):

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

The key is used only inside the server-side route `app/api/chemistry/route.ts`; it is never exposed via `NEXT_PUBLIC_`. Without a key, the app uses locally-written sample chemistry notes. The AI is instructed to use only profile details, avoid sensitive inferences and avoid predicting relationship success.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Add these Environment Variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (optional; omit for sample chemistry)
   - `OPENAI_MODEL` (optional)
4. In Supabase **Authentication → URL Configuration**, set Site URL to the Vercel production URL and add the production URL / redirect pattern.
5. Deploy or redeploy after adding the environment variables.

No separate server, database migration service, or storage bucket is required for the current prototype.

## Database and privacy notes

- Profiles are visible to authenticated Pairwise members for discovery.
- Members can insert likes only from their own profile.
- Members can read likes and matches involving their own profile.
- Messages can be read and sent only in matches involving the current member.
- Passwords are managed by Supabase Auth; Pairwise does not store passwords.
- Do not use real personal profiles without clear consent. Add reporting, blocking, moderation, age/identity checks, rate limits and an appropriate privacy policy before a public production launch.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
