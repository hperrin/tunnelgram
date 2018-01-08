# Importing/Exporting Nymph Data for Maintenance

If you are upgrading to a new version of Nymph, you may need to rebuild the database. These import/export scripts will help you to do that. They need to be run inside the Docker container.

1. Run `docker ps` to find the name of the web container. (Something like yourapp_web_1.)
2. Using that name, run `docker exec -it yourapp_web_1 /bin/bash`, replacing yourapp_web_1 with the real name, to attach a terminal to the container.
3. Run `cd /maintenance`.
4. Run `php export.php` to export Nymph data to a file in the directory, or `php import.php` to import from a file.

Once you've exported Nymph's data, you can shut down your containers, delete the db_data directory to wipe your DB, bring the containers up, then import the Nymph data to rebuild the database.
