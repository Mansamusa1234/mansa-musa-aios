.PHONY: install run scheduler test docker up down

install:
	pip install -r requirements.txt

run:            ## start the API locally
	uvicorn backend.main:app --reload --port 8000

scheduler:      ## run the daily workflow loop
	python scheduler/daily_workflow.py

slot:           ## run one slot now, e.g. make slot S=09:00
	python scheduler/daily_workflow.py --run-now $(S)

test:           ## run smoke tests
	pytest -q

docker:         ## build the production image
	docker build -t mansa-musa-aios .

up:             ## run API + scheduler via docker compose
	docker compose up --build

down:
	docker compose down
