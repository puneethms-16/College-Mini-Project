from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os
from config import Config
from services.pdf_parser import extract_text_from_resume
from services.nlp_processor import process_resume, calculate_match_score
from services.ranking import rank_candidates
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# MongoDB Connection
client = MongoClient(app.config['MONGO_URI'])
db = client[app.config['DB_NAME']]
resumes_collection = db['resumes']
jobs_collection = db['jobs']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return jsonify({
        'message': 'Resume Screening API',
        'version': '1.0',
        'endpoints': {
            'upload': '/api/upload',
            'screen': '/api/screen',
            'results': '/api/results/<job_id>'
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_resume():
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        job_description = request.form.get('job_description', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF and DOCX allowed'}), 400
        
        # Save file temporarily
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from resume
        resume_text = extract_text_from_resume(filepath)
        
        if not resume_text:
            os.remove(filepath)
            return jsonify({'error': 'Could not extract text from resume'}), 400
        
        # Process resume with NLP
        resume_data = process_resume(resume_text)
        
        # Calculate match score if job description provided
        match_score = 0
        if job_description:
            match_score = calculate_match_score(resume_data, job_description)
        
        # Store in MongoDB
        resume_doc = {
            'filename': file.filename,
            'filepath': filepath,
            'upload_date': datetime.now(),
            'resume_text': resume_text,
            'extracted_data': resume_data,
            'match_score': match_score,
            'job_description': job_description
        }
        
        result = resumes_collection.insert_one(resume_doc)
        
        # Clean up temporary file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Resume uploaded and processed successfully',
            'resume_id': str(result.inserted_id),
            'match_score': round(match_score, 2),
            'extracted_data': {
                'skills': resume_data.get('skills', [])[:10],
                'education': resume_data.get('education', []),
                'experience_years': resume_data.get('experience_years', 0)
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screen', methods=['POST'])
def screen_resumes():
    try:
        data = request.get_json()
        job_description = data.get('job_description', '')
        
        if not job_description:
            return jsonify({'error': 'Job description is required'}), 400
        
        # Get all resumes from database
        resumes = list(resumes_collection.find({}))
        
        if not resumes:
            return jsonify({'error': 'No resumes found in database'}), 404
        
        # Recalculate match scores for all resumes
        for resume in resumes:
            match_score = calculate_match_score(
                resume.get('extracted_data', {}),
                job_description
            )
            resumes_collection.update_one(
                {'_id': resume['_id']},
                {'$set': {'match_score': match_score, 'last_screened': datetime.now()}}
            )
            resume['match_score'] = match_score
        
        # Rank candidates
        ranked_results = rank_candidates(resumes, job_description)
        
        # Prepare response
        results = []
        for idx, resume in enumerate(ranked_results[:app.config['TOP_CANDIDATES']], 1):
            results.append({
                'rank': idx,
                'filename': resume.get('filename'),
                'match_score': round(resume.get('match_score', 0), 2),
                'skills': resume.get('extracted_data', {}).get('skills', [])[:10],
                'education': resume.get('extracted_data', {}).get('education', []),
                'experience_years': resume.get('extracted_data', {}).get('experience_years', 0),
                'email': resume.get('extracted_data', {}).get('email', 'N/A'),
                'phone': resume.get('extracted_data', {}).get('phone', 'N/A')
            })
        
        return jsonify({
            'success': True,
            'total_resumes': len(resumes),
            'candidates': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes', methods=['GET'])
def get_all_resumes():
    try:
        resumes = list(resumes_collection.find({}).sort('match_score', -1))
        
        results = []
        for resume in resumes:
            results.append({
                'id': str(resume['_id']),
                'filename': resume.get('filename'),
                'upload_date': resume.get('upload_date').strftime('%Y-%m-%d %H:%M:%S'),
                'match_score': round(resume.get('match_score', 0), 2)
            })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'resumes': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear', methods=['DELETE'])
def clear_database():
    try:
        result = resumes_collection.delete_many({})
        return jsonify({
            'success': True,
            'message': f'Deleted {result.deleted_count} resumes'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)