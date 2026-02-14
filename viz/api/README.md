# Overview
Npm package and docker image to allow the creation of an api capable of 
sending/recieving song and match information. The docker image 
listens on port 8000.

Uses NodeJS + ExpressJS written in Typescript to handle HTTP routing, 
"pg" to handle PostgreSQL able querying and 
"zod" to do json parsing on POST requests.

Please note that the current api backend is poorly guarded against 
DoS attacks and malicious payloads, and is not meant to be used in a 
non-local context.
