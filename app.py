from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables
load_dotenv()

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})  # Configure CORS for all routes

# Configure Gemini API key securely from environment variables
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logging.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required. Please set it in your .env file.")

genai.configure(api_key=api_key)

# Create the generative model - using the correct model name
try:
    # Try getting the list of available models first
    models = genai.list_models()
    model_names = [m.name for m in models]
    logging.info(f"Available models: {model_names}")
    
    # Find an appropriate Gemini model from available options
    selected_model = None
    
    # Check for Gemini models in preferred order
    for model_name in ['models/gemini-1.5-pro', 'models/gemini-1.5-pro-latest', 
                     'models/gemini-1.5-flash', 'models/gemini-1.0-pro-vision-latest']:
        if model_name in model_names:
            selected_model = model_name
            break
    
    if not selected_model:
        # If no preferred models found, pick the first gemini model
        for name in model_names:
            if 'gemini' in name.lower():
                selected_model = name
                break
    
    if selected_model:
        model = genai.GenerativeModel(selected_model)
        logging.info(f"Using model: {selected_model}")
    else:
        # Just use the first available model as fallback
        selected_model = model_names[0]
        model = genai.GenerativeModel(selected_model)
        logging.info(f"Defaulting to first available model: {selected_model}")
        
except Exception as e:
    logging.error(f"Error listing models: {str(e)}")
    # Default to a model name with full path
    model = genai.GenerativeModel("models/gemini-1.5-pro")
    logging.info("Defaulting to models/gemini-1.5-pro")

@app.route('/')
def index():
    """Route for the main page"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """API endpoint to handle chat interactions with Gemini AI"""
    try:
        user_input = request.json.get("message", "")
        if not user_input:
            return jsonify({"response": "No input provided"}), 400

        # Enhance the prompt to focus on shoe recommendations
        enhanced_prompt = f"You are ShoeBot, a shoe recommendation expert. Please provide helpful advice about footwear for the following query: {user_input}"
        
        response = model.generate_content(enhanced_prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        return jsonify({"response": "I'm having trouble processing your request. Please try again in a moment."}), 500

if __name__ == "__main__":
    # Run on port 5000 and bind to all interfaces
    app.run(host="0.0.0.0", port=5000, debug=True)
