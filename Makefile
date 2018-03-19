local_redis:
	docker run --name chatbot-city-redis -d -p 127.0.0.1:6379:6379 redis

start_redis:
	cf create-service compose-for-redis Standard smartmall-chatbot-redis

launch_app:
	cf push
test:
	nodemon
