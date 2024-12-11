# Threads API

## Description

This is the backend API for [berkmancenter/nymspace_client](https://github.com/berkmancenter/nymspace_client).

## Installation

### Using Docker

- Create file `.env.local` and copy contents of `.env.example`. Feel free to change the port number in the file but make sure to make changes on fronend env file to reflect the correct port number. Also, if you change the port number, make sure to change the port numbers in `docker-compose.yml` as well. The port number for socket io is defined implicitly in the app as `5555` and can be changed by making change to file `/src/websockets/index.js`
- Edit `docker-compose.dev.yml` file to add the following block to the `node-app` service

```
    env_file:
      - .env.local
```

the full block should then look like this:

```
services:
  node-app:
    env_file:
      - .env.local

```

- Run below docker compose command to start the server

```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Running locally

1. Start by copying `.env.example` to `.env.local`.
2. Install `mongodb`
3. Run MongoDB with `mongod`
>💡 **Note:** Mac users who have used Homebrew to install MongoDB should use the command `brew services start mongodb-community` to run the MongoDB service instead.
4. Install `node.js` and set to version specified in `package.json` file (Consider using [nvm](https://github.com/nvm-sh/nvm))
5. Install [yarn](https://classic.yarnpkg.com/lang/en/docs/install)
6. Install all dependencies with `yarn install`.
7. Run `yarn run dev` to serve the API locally.

## Tests

### Unit and integration tests

Unit and integration tests can be run with `yarn run test`, and a coverage report can be seen with `yarn run coverage`.

Note that the tests use the `.env` file instead of `.env.local`. Copy `.env.local` to `.env` for local running tests in local development environment.

### Stress tests

Stress tests can be run from the client repo in the [k6 directory](https://github.com/berkmancenter/threads_client/blob/main/k6).

## Deployment

1. Pull the latest code from Github (currently the dev branch)
2. Configure .env and install dependencies
3. Run `yarn run start` to serve the API with [PM2](https://pm2.keymetrics.io/docs/usage/process-management/)
