# Service Directory — Telegram Mini App

A static, searchable/filterable directory (à la propfirmmatch.com), built to run inside Telegram.
Works for any list of services — prop firms, brokers, tools, whatever — you just edit `data.json`.

## Files

- `index.html` — page shell
- `style.css` — dark/light "ledger" theme, auto-adapts to Telegram's color scheme
- `app.js` — loads `data.json`, handles search + tag filters, renders rows
- `data.json` — **this is the only file you edit to add/remove/update services**

## Editing your listings

Open `data.json`. Each entry looks like:

```json
{
  "id": "example-one",
  "name": "Example Firm One",
  "logo": "https://yoursite.com/logo.png",
  "rating": 4.7,
  "reviews": 1254,
  "tags": ["Forex", "Crypto", "Metals"],
  "note": "10% OFF",
  "link": "https://example.com/one",
  "featured": true
}
```

- `logo` — path to an image in `assets/logos/` (e.g. `"assets/logos/examplefirm.png"`). Leave `""` empty and it'll fall back to a letter avatar. If a path is wrong or the image fails to load, it also falls back to the letter avatar automatically — no broken image icons.

### Adding logos

Drop image files straight into `assets/logos/` and point to them with a relative path:

```json
"logo": "assets/logos/examplefirm.png"
```

Keep them square (68×68px or larger) and small in file size (under ~50KB each) so the list stays fast to load.
- `rating` / `reviews` — optional, omit `rating` and the rating meter is hidden.
- `tags` — anything you want; the filter chips at the top are generated from the `tags` array in the root of the file (or auto-collected from all services if you delete it).
- `note` — small badge, e.g. a promo code or short label. Optional.
- `featured` — pins it to the top with a highlight border.

No build step, no dependencies to install — just save the file.

## Testing locally

Opening `index.html` directly (`file://`) won't work because browsers block `fetch()` on local files.
Run a tiny local server from the project folder instead:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Hosting on GitHub

1. Push this folder to a GitHub repo.
2. Repo → Settings → Pages → Deploy from branch → pick `main` (or `master`) and `/ (root)`.
3. Your app will be live at `https://<username>.github.io/<repo>/`.

(GitHub Pages serves over HTTPS by default — Telegram requires HTTPS for Mini Apps, so this just works.)

## Registering with BotFather

1. Message **@BotFather** → `/newbot` (if you don't have a bot yet).
2. `/mybots` → select your bot → **Bot Settings** → **Menu Button** → **Configure Menu Button**.
3. Send the GitHub Pages URL from above.
4. Give it a short label (e.g. "Open Directory").

Now opening a chat with your bot shows a menu button that launches the app.

You can also register it as a full Mini App via `/newapp` under the same bot if you want it launchable from an inline button or a direct `t.me` link instead of just the menu button.

## Notes

- The app calls `Telegram.WebApp.ready()` and `.expand()` on load, and switches between the dark/light palette based on the user's Telegram theme automatically.
- Links open via `Telegram.WebApp.openLink()` so they behave correctly inside the Telegram in-app browser, with a normal `<a>` fallback if opened outside Telegram (e.g. while testing in a regular browser tab).
