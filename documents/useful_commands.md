## Reset the DB

```
cd /opt/stonefruit

# Stop containers and remove them + their named volumes

docker compose down -v # same as: docker compose down --volumes

# (Optional) clean up any dangling volumes/images

docker volume prune -f
docker image prune -f # this keeps the repo small
```

## Restart the app

`docker compose restart app`
