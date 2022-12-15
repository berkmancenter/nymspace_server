# Threads API

## Description
This is the backend API for the new version of the [Berkman Threads application](https://github.com/berkmancenter/threads_client).

## Setup
Add a .env file to the root of the project with configuration details for Mongo, SMTP, etc. See the .env.example for more details.

Install all dependencies with `npm install`.

## Development
Start by copying `.env.example` to `.env`.

Run `npm run dev` to serve the API locally.

## Tests
Tests can be run with `npm run test`, and a coverage report can be seen with `npm run coverage`.

## Deployment
To deploy:
1. Pull the latest code from Github (currently the dev branch)
2. Configure .env and install dependencies
3. Run `npm run start` to serve the API with [PM2](https://pm2.keymetrics.io/docs/usage/process-management/)
