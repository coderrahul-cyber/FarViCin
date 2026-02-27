### ENV PROBLEM IN TURBOREPO (I don't know what happen after this the code runs fine , if future it crash use the method below to fix it again)
There is an issue with environment variables not being picked up correctly in a Turborepo monorepo setup, particularly when using Bun as the runtime. The problem seems to stem from how environment variables are loaded and accessed across different packages in the monorepo.   

* __Environment variables are read from the process environment (process.env) at runtime. .env files are not automatically read by Node/Bun — a loader (e.g. dotenv)__ 
* __When you import code from packages/tokenconfig, that code runs in the backend process. If tokenconfig expects process.env.MY_SECRET but nobody called dotenv.config() before reading it, process.env.MY_SECRET will be undefined.__
* __Also: path resolution — relative .env path depends on the current working directory or where dotenv.config({ path }) points. Running backend from repo root vs from apps/backend changes relative paths.__   
__SOLUTION:__  
what i have i done exporting the ENV VARIABLE from the folder in packages and import it in the apps where its needed.  

