import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("sprintmind_runner")

def run():
    port = int(os.getenv("PORT", 5000))
    flask_env = os.getenv("FLASK_ENV", "production")
    
    if flask_env.lower() == "development":
        logger.info(f"Starting SprintMind AI in DEVELOPMENT mode on http://localhost:{port}...")
        from app import app
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        logger.info(f"Starting SprintMind AI in PRODUCTION mode on http://localhost:{port}...")
        try:
            from waitress import serve
            from app import app
            logger.info("Serving WSGI application via Waitress...")
            serve(app, host="0.0.0.0", port=port)
        except ImportError:
            logger.warning("Waitress package is not installed. Falling back to default Flask server.")
            logger.warning("For production security and concurrency, please run: pip install waitress")
            from app import app
            app.run(host="0.0.0.0", port=port, debug=False)

if __name__ == "__main__":
    run()
