# crux
Script to execute Google Chrome UX Reports Queries in Google BigQuery.

## Setup
Requires node.js and npm to be installed. Also, create a google cloud service account with permission to run big query jobs; save the generated JSON-file as `credentials.json` in the root folder of this repository.
```
# install dependencies
npm i
``` 

## Run in Development
The dev mode leverages typescript-watchers and nodemon to automatically recompile and re-run the project whenever a file is saved.
```
npm run dev
```
