# rank-app
## Technologies
Backend `viz/api` - NodeJS (expressJS), PostgreSQL
Frontend `viz/frontend` - React, Nginx, Vite, CSS
Both Frontend/Backend - Npm, Linux, Docker-Compose, Typescript
App `compare` - typed python, curses terminal GUI, Plackett-Luce,

## Overview
Terminal curses-based pairwise song rating app with a 
PostgreSQL, Node.js (express.js) + React + Typescript + Nginx 
interactive web dashboard/visualization tool. Uses docker-compose for 
easy setup.

### App
Continually listen to two songs and pick the winner on a terminal curses based GUI, 
the project updates ranking information using the api service.

### Frontend
Visualize match history and song statistics on an interactive web dashboard.

### API 
Coordinates the app and frontend.

Please note that the current api backend is poorly guarded against 
DoS attacks and malicious payloads, and is not meant to be used in a 
non-local context. The docker-compose is set to be local-host only by default.

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
Requires python and docker-compose to run.

## Building and Running
Currently the web services are run localhost only.

### General Setup
1. Change directory into the root of the project before performing the following.
2. An environment variables file (.env) is needed to authenticate the PostgreSQL service.</br>
   Run the following to create one with dummy values (windows/linux):</br> 
  `printf 'PG_USER=app\nPG_DB=app_db\nPG_PASSWORD=pass\n' > .env`
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
