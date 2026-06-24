# veerla-ai-site

Personal website for **Venkat Ram Rao** — [veerla-ramrao.ai](https://veerla-ramrao.ai).

Static site hosted on **GitHub Pages**. Dark slate + cyan theme, no framework.

## What's here

```
├── index.html            # landing: bio, nav, Medium article cards, Contact Me
├── posts.json            # generated from the Medium RSS feed (committed by CI)
├── CNAME                 # custom domain: veerla-ramrao.ai
├── package.json          # build script + fast-xml-parser
├── assets/               # optional PNG icons (site uses inline SVG by default)
├── scripts/
│   └── build-medium.mjs  # fetch Medium RSS -> posts.json
├── .github/workflows/
│   └── medium.yml        # daily + manual rebuild of posts.json
└── ontologies/
    ├── index.html
    ├── geography_ontology.owl
    └── viao_intelligence_artifact_ontology_v2.owl
```

## Local preview

```bash
python3 -m http.server 8000      # then open http://localhost:8000/
```

To regenerate the article cards (needs Node 20+ and network access to Medium):

```bash
npm install
npm run build:medium             # writes posts.json
```

## How the Medium feed works

Medium's RSS (`https://medium.com/@venkat.ramrao/feed`) **cannot be fetched from the
browser** (CORS). Instead, the GitHub Action in `.github/workflows/medium.yml` runs
`scripts/build-medium.mjs`, which fetches the feed, extracts each article's title,
thumbnail image, date, excerpt, and tags, and writes `posts.json`. The page loads that
same-origin file and renders the cards. The Action runs **daily** and can be triggered
manually from the repo's **Actions** tab → *Build Medium feed* → *Run workflow*.

## Dereferenceable ontology IRIs

The ontologies use **hash (`#`) namespaces**, so every term shares one base
document. To make those IRIs resolve over the web, the ontology files are also
published (extensionless) at the exact namespace paths:

| IRI namespace base                                   | File served            |
|------------------------------------------------------|------------------------|
| `https://veerla-ramrao.ai/ontology/intelligence-artifact` | `ontology/intelligence-artifact` |
| `https://veerla-ramrao.ai/ontology/geography`             | `ontology/geography`             |

So e.g. `…/ontology/intelligence-artifact#Document` dereferences to the VIAO
document. These two files are **copies** of the `.owl` files in `ontologies/` —
**keep them in sync** when you update an ontology (re-copy the `.owl` over them).

`.nojekyll` is present so GitHub Pages serves these extensionless files verbatim.

> Caveat: GitHub Pages can't set `Content-Type: application/rdf+xml` or do
> content negotiation, so browsers may download these rather than render them.
> Ontology tools (Protégé, rdflib) still parse them fine. For fully correct
> content-negotiated linked data, route the namespace through w3id.org / purl.org.

## Deploy (GitHub Pages + custom domain)

1. Push this folder to `https://github.com/vvr-rao/veerla-ai-site` on the `main` branch.
2. Repo → **Settings → Pages** → Source = **Deploy from a branch**, Branch = `main` / `/ (root)`.
3. Under **Custom domain**, enter `veerla-ramrao.ai` and save (the `CNAME` file already
   sets this). Tick **Enforce HTTPS** once the certificate is issued.
4. At your domain registrar, add DNS records:
   - **Apex** `veerla-ramrao.ai` → four `A` records:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (and optionally `AAAA`: `2606:50c0:8000::153`, `…:8001::153`, `…:8002::153`, `…:8003::153`)
   - **`www`** → `CNAME` → `vvr-rao.github.io`
5. Go to **Actions → Build Medium feed → Run workflow** once to generate `posts.json`.

DNS can take from minutes to ~24h to propagate.

## Set up Google Calendar so people can book time

Use Google Calendar's **Appointment scheduling** (the built-in Calendly-style booking
pages). Available on personal Gmail accounts and most Google Workspace plans.

1. Open **[Google Calendar](https://calendar.google.com)** on desktop.
2. Click **Create** (top-left) → **Appointment schedule**
   (or click any empty slot and choose the *Appointment schedule* tab).
3. Name it (e.g. *"Book time with Venkat"*) and set the **appointment duration**
   (e.g. 30 min).
4. Set **General availability** — the weekly windows you're open for meetings —
   and any buffer time / max bookings per day / minimum notice.
5. (Optional) Add **booking form questions**, a **Google Meet** link (added
   automatically), and a description.
6. Click **Save**.
7. Reopen the appointment schedule and click **Open booking page** → **Share** →
   **Copy link**. It looks like:
   `https://calendar.app.google/XXXXXXXXXXXX`
8. Paste that link into the site: open `index.html` and replace **both**
   occurrences of `BOOKING_LINK_PLACEHOLDER` (the *Book Time* nav button and the
   *Book a time* button in the Contact section) with your link.

> Tip: you can verify the page works by opening the copied link in an incognito
> window — you should see your open slots and be able to book a test meeting.

If you don't see *Appointment schedule*, your account is on an older booking feature
(*Appointment slots*) or a Workspace edition without it; switching to a personal
Gmail account is the simplest fix.
