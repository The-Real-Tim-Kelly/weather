# Weather Radar App

[![Deploy to GitHub Pages](https://github.com/The-Real-Tim-Kelly/weather/actions/workflows/deploy.yml/badge.svg)](https://github.com/The-Real-Tim-Kelly/weather/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live%20Site-GitHub%20Pages-blue?logo=github)](https://the-real-tim-kelly.github.io/weather/)

A live weather radar app built with **React**, **Vite**, and **Tailwind CSS**.

🌐 **Live site:** https://the-real-tim-kelly.github.io/weather/

## Features

- 🔍 Search by city name, "City, ST", or ZIP code (via Nominatim / OpenStreetMap)
- 🌡️ Current conditions: temperature, feels-like, humidity, wind speed
- 🌅 Sunrise & sunset times
- 📅 7-day forecast with high/low, wind, and precipitation
- 🕐 24-hour hourly forecast with precipitation probability and wind
- 🌙 Night icons based on day/night flag from weather data
- 🗺️ Live Doppler radar overlay (RainViewer) on a dark Leaflet map
- 📍 "Use my location" with browser geolocation + localStorage persistence

## Data Sources

| Service                                                   | Usage                            |
| --------------------------------------------------------- | -------------------------------- |
| [Open-Meteo](https://open-meteo.com) (CC BY 4.0)          | Weather forecasts (no API key)   |
| [Nominatim / OpenStreetMap](https://nominatim.org) (ODbL) | Forward geocoding (no API key)   |
| [BigDataCloud](https://www.bigdatacloud.com)              | Reverse geocoding (no API key)   |
| [RainViewer](https://www.rainviewer.com)                  | Radar tile overlay (no API key)  |
| [CartoDB](https://carto.com/attributions)                 | Dark base map tiles (no API key) |

**No API keys are used or embedded** — this app is safe to host publicly on GitHub Pages.

## Local Development

```bash
cd weather-radar-app
npm install
npm run dev
```

## Deployment

Pushes to `main` automatically trigger a GitHub Actions build and deploy to the `gh-pages` branch via the workflow in `.github/workflows/deploy.yml`.

To deploy manually:

```bash
cd weather-radar-app
npm run build
# dist/ is published to gh-pages by the GitHub Actions workflow
```
