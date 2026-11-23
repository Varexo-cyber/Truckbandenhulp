# Truckbandenhulp

Website van Truckbandenhulp, de mobiele bandenservice voor vrachtwagens,
trailers en zwaar transport van D&D Mobiliteit B.V.

- **Domein:** truckbandenhulp.nl
- **Telefoon en WhatsApp:** 085 744 4166

## Inhoud

| Pagina | Wat het is |
|---|---|
| `/` | Home: kentekenmelder, diensten, bandenkiezer, werkwijze, veiligheid, werkgebied, vragen |
| `/diensten.html` | Zes diensten uitgewerkt |
| `/pech-melden.html` | Bandenkiezer: band aantikken, kenteken, bandmaat en locatie, verstuurd via WhatsApp |
| `/veelgestelde-vragen.html` | Vragen en antwoorden |
| `/contact.html` | Gegevens, adres, KvK, bereikbaarheid |
| `/werkgebied/` en `/werkgebied/{provincie}/` | Provincies en gemeenten |
| `/bandenservice/{gemeente}/` | Een eigen pagina voor elk van de 342 gemeenten |

## Publiceren

De site staat op Netlify en is gekoppeld aan deze repository. Bij elke push naar
`main` draait Netlify `python3 versie.py` en publiceert daarna de site (zie
`netlify.toml`). Dat script zet een nieuw versienummer achter de stylesheet en
scripts, zodat bezoekers meteen de nieuwe versie zien.

## Google

1. Search Console: property `https://truckbandenhulp.nl/`, verifiëren via DNS
   of HTML-tag, daarna `sitemap.xml` indienen.
2. Bedrijfsprofiel: zodra de reviewlink er is kan de knop "Beoordeel ons op
   Google" op de homepage worden toegevoegd.

## Beeld

Alle foto's en video's staan met maker en licentie op
`/beeldverantwoording.html`.
