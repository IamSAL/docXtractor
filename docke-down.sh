# Stop the containers
docker compose down

# Force remove any orphaned containers that might be "locking" a network
docker rm -f $(docker ps -aq)

# Remove all networks not in use
docker network prune -f

# Restart the Docker service to clear the daemon's internal cache
sudo systemctl restart docker