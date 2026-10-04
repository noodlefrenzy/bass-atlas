# Bass Atlas

An interactive listening map of jungle, drum & bass, dubstep, and neighboring sounds. Browse 74 artists by era and genre, follow documented connections, or take a curated listening route.

The year on each profile belongs to its featured gateway track. It is an editorial entry point, not necessarily the artist's first release or first hit. Track and connection links point to supporting sources; suggested listening paths are labeled separately.

## Run locally

The site is plain HTML, CSS, and JavaScript with no build step or backend. From the repository root, run:

```sh
python -m http.server 4173 --directory dist
```

Then open `http://127.0.0.1:4173/`.

## Project files

- `dist/index.html` — page structure
- `dist/styles.css` — layout and visual design
- `dist/data.js` and `dist/additions-*.js` — artist and connection catalog
- `dist/app.js` — search, filters, map, routes, and navigation

## Publish with GitHub Pages

GitHub Pages serves the root of the `gh-pages` branch. The `main` branch keeps the editable project, while `dist/` is the complete publishable site. After committing and pushing a change to `main`, publish its `dist/` tree with:

```powershell
pwsh -File scripts/publish-gh-pages.ps1
```

The script creates a commit from `main:dist` on `gh-pages` and pushes it. It does not switch branches or copy files in your working tree.

The site uses relative asset paths, so it also works at `https://noodlefrenzy.github.io/bass-atlas/`. The `.nojekyll` file in `dist/` keeps GitHub Pages from applying Jekyll processing.

## License

MIT. See [LICENSE](LICENSE).
