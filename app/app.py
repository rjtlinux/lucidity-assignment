"""Hello World microservice for Lucidity DevOps Assignment."""

from flask import Flask, jsonify
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

app = Flask(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint']
)


@app.before_request
def start_timer():
    from flask import request as req
    req._start_time = time.time()


@app.after_request
def record_metrics(response):
    from flask import request as req
    latency = time.time() - getattr(req, '_start_time', time.time())
    REQUEST_COUNT.labels(
        method=req.method,
        endpoint=req.path,
        status=response.status_code
    ).inc()
    REQUEST_LATENCY.labels(
        method=req.method,
        endpoint=req.path
    ).observe(latency)
    return response


@app.route('/')
def hello():
    return jsonify({"message": "Hello World"})


@app.route('/health')
def health():
    return jsonify({"status": "healthy"})


@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
