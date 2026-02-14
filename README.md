# rank-app
## Overview
Pariwise compare and rate songs on a terminal UI app, 
then visualize your ratings on a React-based web dashboard.
All data is handled using an web api and NodeJS (express) 
based server. Docker-compose creates and links the backend/frontend and 
database together with one command, in a cross-platform way.

## Technologies
Backend `viz/api` - NodeJS (expressJS), PostgreSQL. </br>
Frontend `viz/frontend` - React, Nginx, Vite, CSS. </br>
Both Frontend/Backend - Npm, Linux, Docker-Compose, Typescript. </br>
App `compare` - modular typed python, curses terminal GUI, Plackett-Luce. </br>

## Features
- PostgreSQL + NodeJS (ExpressJS) written in Typescript is used to drive the backend api service.
- Nginx + React written in Typescript + Vite frontend provides a dynamic visualization dashboard
  of match history.
- Utilizes Openskill Plackett-Luce ratings, with custom algorithms for song certainty and match selection.
- Match selection uses an EV system built upon player Plackett-Luce statistics. Optimises information
  gained from pairwise comparisons to beat O(n^2) comparisons.
- The rating app integrates directly with the backend api service to seamlessly save/load session
  information. It is also built out of modules, allowing swapping of GUI/Media-Player/IO/Rating-Algorithm.
- Terminal (curses) UI for head-to-head song ratings with pre-buffered and responsive VLC playback.
- Docker-Compose is used to efficiently containerize PostgreSQL as well as frontend+backend services.

## Dependencies
Requires python and docker-compose to run. The compare app requires VLC to be installed.

## Building and Running
Currently the web services are run localhost only.

### General Setup
1. Change directory into the root of the project before performing the following.
2. An environment variables file (.env) is needed to authenticate the PostgreSQL service.</br>
   Run the following to create one as a copy of .env.example (DO NOT USE NON-LOCALLY):</br> 
   (windows): `copy .env.example .env`</br>
   (linux): `cp .env.example .env`
3. Use the following to start the necessary services:</br>
   `docker compose up database -d`
4. When finished, use the following to stop the services</br>
   `docker compose down`</br>
   The following stops the services and deletes data created:</br>
   `docker compose down -v`

### Using the Python Rating App
1. (Optionally) Create a python virtual environment and activate it to install the package locally.
   - Windows (CMD): `python3 -m venv venv && venv\Scripts\activate.bat`
   - Linux: `python3 -m venv venv && source venv/bin/activate`
2. Install the python package:</br>
   `python3 -m pip install ./compare`
3. Run the python package with (omit --music-folder to continue from previous session):</br>
   `python3 -m compare --runs x --music-folder path/to/folder`

### Viewing the Web Dashboard
1. Go to http://localhost:3000/ to view the local dashboard.
