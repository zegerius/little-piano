# Little Piano Songbook

A play-along songbook for the **Hape × Baby Einstein Magic Touch Piano**, the wooden
toy piano with 8 coloured keys.

Pick a song and the score scrolls by, with each note in the colour and number of its key.
Play the toy piano and the phone listens through its microphone, then moves on when you hit
the right key. Live at <https://little-piano.aram.workers.dev/>.

## Features

- **24 songs.** Nursery rhymes, Dutch classics like *Vader Jacob* and *In de maneschijn*,
  and a few longer ones like *Ode to Joy*. Each has real rhythms, rests and time signatures.
- **Play-along.** The mic detects which key was played. Quick repeats and overlapping notes
  work too.
- **Tuning wizard.** You play each key once so the app learns what your piano sounds like,
  whatever the room or batteries.

  > **Tip:** use the toy's **xylophone** sound. It's the only one where all 8 keys are
  > really in tune. On the other sounds some keys are off, so songs sound wrong.
- **On-screen keys** with piano and xylophone sounds, for when the real piano isn't nearby.
- **Preview.** Each song card can play its whole song back.
- **Printable cards.** Pick songs to print as A6 cards, four to an A4 sheet, by AirPrint or
  as a PDF.
- **Installable** on the home screen as a PWA, and it works offline once loaded. The screen
  stays on while you play.
- Built for iPhone in portrait and landscape.

## How it's built

All of it is one Cloudflare Worker, [`worker.js`](worker.js). It serves the HTML, CSS and
icons, plus the client script. That script is the `client()` function, sent to the browser
via `Function#toString`, so `keep_names` is off in `wrangler.jsonc`. There are no
dependencies and no build step. Pitch detection and sound both use the Web Audio API.

Songs are in the `SONGS` array as `key:beats` tokens. Keys go from `1` (C4) to `8` (C5),
`r` is a rest and `|` marks a bar line:

```js
{ id: 'ode', title: 'Ode to Joy', time: '4/4', notes: '3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3:1.5 2:.5 2:2 | …' }
```

## Develop and deploy

Uses [bun](https://bun.sh):

```sh
bunx wrangler dev          # http://localhost:8787
bunx wrangler deploy
```

Deploys go to a personal Cloudflare account. Put `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` in a gitignored `.env`, then load it before deploying:

```sh
set -a; source .env; set +a; bunx wrangler deploy
```

The mic needs a secure context, so test on a phone over HTTPS: use the deployed site or a
tunnel, not a LAN IP.
