# TRASE

[![Build Status](https://travis-ci.org/Vizzuality/trase.svg?branch=master)](https://travis-ci.org/Vizzuality/trase)

[![Maintainability](https://api.codeclimate.com/v1/badges/93fec294b49106c35c18/maintainability)](https://codeclimate.com/github/Vizzuality/trase/maintainability)

[![Test Coverage](https://api.codeclimate.com/v1/badges/93fec294b49106c35c18/test_coverage)](https://codeclimate.com/github/Vizzuality/trase/test_coverage)

Source code for [Trase](http://trase.earth)

![TRASE](trase-screenshot.png)

## About TRASE

Trase brings unprecedented transparency to commodity supply chains revealing new pathways towards achieving a
deforestation-free economy.

## Project structure

This repository contains two technically independent applications:
- `/frontend` contains the frontend application, including a dedicated nodejs server (for dev purposes only)
- `/` contains the Rails 5.x API that serves data to the above mentioned frontend application

While technically independent, the frontend application is heavily dependent on the API spec served by the rails application.

## Requirements

This project uses:
- Ruby 2.4.2
- Rails 5.1+
- Nodejs 8.2+
- PostgreSQL 9.5+ with `intarray` and `tablefunc` extensions
- [Bundler](http://bundler.io/)

## Setup

For the API:
- Make sure you have Ruby and Bundler installed
- Use Bundler's `bundle install` to install all ruby dependencies
- Copy `.env.sample` to `.env` and replace the values accordingly. See the API documentation below for more information.
- To setup the development database, first create a database in PostgreSQL and then import a base dump into it
- Next, run `rake db:migrate` and `rake content:db:migrate` to update its structure
- only while working on API V3 migration: please follow instructions in "Schema revamp: migration and documentation"

You can now use `rails server` to start the API application

For the frontend application:
- `cd` into the `frontend` folder
- Copy `.env.sample` to `.env` and replace the values accordingly. See the frontend application documentation below for more information.
- Install dependencies using `npm install`

You can start the development server with `npm start`

## Deployment

We use [Capistrano](http://capistranorb.com/) as a deployment tool, which deploys both API and frontend application simultaneously.
To deploy, simply use:

```
cap <staging|production> deploy
```

## Git hooks

This project includes a set of git hooks that you may find useful
- Run `bundle install` when loading `Gemfile.lock` modifications from remotes
- Run `npm install` when loading `frontend/package.json` modifications from remotes
- Receive a warning when loading `.env.sample` or `frontend/.env.sample` modifications from remotes
- Run `Rubocop` and `JS Lint` before committing

To enable then, simply execute once: `bin/git/init-hooks`


# API

## Configuration

The project's main configuration values can be set using [environment variables](https://en.wikipedia.org/wiki/Environment_variable)

* SECRET_KEY_BASE: Rails secret key. Use a random value
* POSTGRES_HOSTNAME: Hostname of your database server
* POSTGRES_DATABASE: Name of your data database
* POSTGRES_CONTENT_DATABASE: Name of your content database
* POSTGRES_USERNAME: Username used to connect to your PostgreSQL server instance
* POSTGRES_PASSWORD: Password used to connect to your PostgreSQL server instance
* POSTGRES_PORT: Port used to connect to your PostgreSQL server instance
* MAILCHIMP_API_KEY: API key for Mailchimp mailing service
* MAILCHIMP_LIST_ID: List ID for Mailchimp mailing service
* GOLD_MASTER_HOST_V1:
* GOLD_MASTER_HOST_V2:
* GOLD_MASTER_HOST_V3:

## Test

```
RAILS_ENV=test rake db:drop db:create db:structure:load
bundle exec rspec spec
```

## Gold master tests

There are 2 rake tasks:

- `bundle exec rake gold_master:record` - this one should be re-run when `spec/support/gold_master_urls.yml` is updated. It records the gold master responses for all the urls and zips them in `spec/support/gold_master.zip`. It should be run using the pre-revamp version of the backend code and database:
    * https://github.com/sei-international/TRASE/releases/tag/pre-revamp
    * https://github.com/Vizzuality/trase-api/releases/tag/pre-revamp
    * Note: some responses are huge, over 1 MB. They're zipped and stored using GLFS.
- `bundle exec rake gold_master:test` - this one collects responses as generated by the current version of the code and compares with the gold master using json & csv diffing tools. It's intended to be used with the same version of the database as the gold master.
  * Note: the responses are stored uncompressed in `tmp/actual` and are not cleaned after the tests have run.

Both tasks are parametrised by same env variables to specify the hosts on which to run, when running in local environment this is going to be something like:

```
GOLD_MASTER_HOST_V1=http://localhost:8080
GOLD_MASTER_HOST_V2=http://localhost:3000
GOLD_MASTER_HOST_V3=http://localhost:3000
```

## Database tuning

This is a useful post: [Performance Tuning Queries in PostgreSQL](https://www.geekytidbits.com/performance-tuning-postgres/)

Always use either in production or an equivalent staging environment. No point running in local environment.

### Enabling statistics collection in PostgreSQL
In the target database:

`CREATE EXTENSION pg_stat_statements;`

In postgresql.conf:

`
shared_preload_libraries = 'pg_stat_statements'         # (change requires restart)
pg_stat_statements.max = 10000
pg_stat_statements.track = all
`

Restart postgres server. Wait for usage statistics to be collected, then run this for list of longest running queries:

`SELECT * FROM pg_stat_statements ORDER BY total_time DESC;`

https://www.postgresql.org/docs/current/static/pgstatstatements.html

### Identifying missing indexes

`
SELECT relname, seq_scan-idx_scan AS too_much_seq, CASE WHEN seq_scan-idx_scan>0 THEN 'Missing Index?' ELSE 'OK' END, pg_relation_size(relname::regclass) AS rel_size, seq_scan, idx_scan FROM pg_stat_all_tables WHERE schemaname='public' AND pg_relation_size(relname::regclass)>80000 ORDER BY too_much_seq DESC;
`

### Identifying unused indexes

`
SELECT indexrelid::regclass as index, relid::regclass as table, 'DROP INDEX ' || indexrelid::regclass || ';' as drop_statement FROM pg_stat_user_indexes JOIN pg_index USING (indexrelid) WHERE idx_scan = 0 AND indisunique is false;
`

## Schema revamp: migration and documentation

In the transition period as work on changing the database schema continues, new tables are living in a separate `revamp` schema (~namespace), whereas the default `public` schema still contains the old tables. This means we can work on both schemas as necessary.

The base version of the database at this point is:




To migrate the database:

1. TEMPORARILY comment out `schema_search_path: "public"` in `config/database.yml`
2. run `bundle exec rake db:migrate` to create revamped database objects
3. run the queries in `db/revamp_cleanup.sql` to remove duplicates from the original database
4. run `bundle exec rake db:revamp:copy` to copy data between old and new structure
5. `bundle exec rake db:revamp:doc:sql`
6. ideally after running all this you shouldn't have any changes on the structure.sql file, other than PostgreSQL version in some cases
7. you can now uncomment `schema_search_path` in `config/database.yml`

Schema documentation is generated directly from the database and requires the following steps:

1. The file `db/schema_comments.yml` contains documentation of schema objects, which is prepared in a way to easily insert it into the database schema itself using `COMMENT IS` syntax.
That is done using a dedicated rake task:

    `rake db:revamp:doc:sql`

    Note: this rake task also creates a new dump of structure.sql, as comments are part of the schema.
2. Once comments are in place, it is possible to generate html documentation of the entire schema using an external tool. One os such tools is SchemaSpy, which is an open source java library.
    1. install [Java](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
    2. install [Graphviz](http://www.graphviz.org/)
    3. the [SchemaSpy 6.0.0-rc2](http://schemaspy.readthedocs.io/en/latest/index.html) jar file and [PostgreSQL driver](https://jdbc.postgresql.org/download.html) file are already in doc/db
    4. `rake db:revamp:doc:html` (Please note: I added an extra param to SchemaSpy command which is `-renderer :quartz` which helps with running it on macOS Sierra. No idea if it prevents it from running elsewhere.)
    5. output files are in `doc/db/html`
3. to update the [GH pages site](https://vizzuality.github.io/trase-api/) all the generated files from `doc/db/html` need to land in the top-level of the `gh-pages` branch. This is currently a manual process, easiest to have the repo checked out twice on local drive to be able to copy between branches (not great and not final.)

# Frontend

The frontend application can be found inside the `frontend` folder. All files mentioned below can be found inside this folder,
and command instructions should be executed inside the `frontend` folder.

## About this application

This project consists of only the frontend application for the TRASE website.
All data displayed is loaded through requests to the TRASE API.

This project mainly uses D3 and Leaflet, plus Redux for managing app state.
More on the stack [here](https://github.com/Vizzuality/TRASE-frontend/issues/9)

Besides the frontend code, the project also includes a standalone nodejs web server, which should be used only for
development purposes


## Lexicon

```
+-------+             +-------+
|       |             |       |
|       |             |       |
+-------+ ---\        |       |
| node  |     \-------+-------+
+-------+--\  link    | node  |
|       |   \         |       |
|       |    \--------+-------+
|       |             |       |   
+-------+             +-------+
  column                column

```

## Configuration

The project's main configuration values can be set using [environment variables](https://en.wikipedia.org/wiki/Environment_variable)

* PORT: port used by the development web server. defaults to 8081
* NODE_ENV: environment used by the nodejs tasks
* API_V1_URL: URL of the data API V1
* API_V2_URL: URL of the data API V2
* API_V3_URL: URL of the data API V3
* API_CMS_URL: URL of the homepage stories API
* API_STORY_CONTENT: URL of the deep dive stories API
* API_SOCIAL: URL of the tweets API
* GOOGLE_ANALYTICS_KEY: API key for Google Analytics
* USER_REPORT_KEY: API key for User Report
* DATA_FORM_ENABLED: enable contact form in Data page
* DATA_FORM_ENDPOINT: end point to send form values in Data page
* PDF_DOWNLOAD_URL: end point to download a PDF snapshot of the page
* PERF_TEST: boolean flag to enable/disable development live performance testing (true | false)

If you are using the included development server, you can set those variables in the `.env` file (use the included `.env.sample` as an example)


## Tools to generate CARTO maps

### Generate vector map layers

This is needed when an update is needed on the map's vector layers, aka TopoJSON files used in the Leaflet map, for instance when adding countries or subnational entities, or when needing an extra column, etc. A CARTO API key is not needed to run this.

Vector layers are generated with one of the two workflows:
- CARTO (remote DB) -> geoJSON -> topoJSON
- local shapefiles -> geoJSON -> topoJSON

All can be generated by running:
```
cd frontend
./gis/vector_maps/getVectorMaps.sh
```

All dependencies should be installed by npm install, except ogr2ogr (used for shapefile conversion), which you have to install globally with GDAL.

#### Generate municipalities by state TopoJSON files (only for Brazil for now)

Those are the maps used by D3 in place profile pages.

```
cd frontend
./gis/vector_maps/get_brazil_municip_states.js
```


### generate CARTO named maps (context layers)

This is necessary when context maps stored in CARTO tables need to be updated. A CARTO API key is needed.

- Copy CARTO credentials:
```
cd frontend
cp ./gis/cartodb/cartodb-config.sample.json ./gis/cartodb/cartodb-config.json
```
- Replace api_key value in `cartodb-config.json`
- To update or instantiate context layers run
```
cd frontend
./gis/getContextMaps.sh
```
This will use the layers configuration stored in `frontend/gis/cartodb/templates.json`, to create a named map for each item. Then, a JS file to be used by the front-end is created at `cd frontend/scripts/actions/map/context_layers_carto.js`. This file contains the unique name for the created template as well as the layergroupid. The rest of the configuration (legend, title) is located in the constants.

## Production

Run `npm run build`, it will create a production-ready version of the project in `/dist`.

## LICENSE

[MIT](LICENSE)
