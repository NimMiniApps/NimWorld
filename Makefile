.PHONY: install dev build docker-up docker-down docker-logs

install:
	npm install

dev:
	npm run dev

build:
	npm run build

docker-up:
	docker compose up -d --build --remove-orphans

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
