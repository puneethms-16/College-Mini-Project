import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords

# Common skills to look for
SKILLS_DATABASE = [
    'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go',
    'react', 'angular', 'vue', 'node.js', 'nodejs', 'django', 'flask', 'spring', 'express',
    'html', 'css', 'sass', 'bootstrap', 'tailwind',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'cicd',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
    'data analysis', 'data science', 'pandas', 'numpy', 'scikit-learn', 'sklearn',
    'rest api', 'restful', 'graphql', 'microservices', 'agile', 'scrum', 'devops',
    'linux', 'unix', 'windows server', 'networking', 'security',
    'excel', 'powerpoint', 'tableau', 'power bi', 'sap', 'salesforce'
]

def extract_email(text):
    """Extract email from text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    """Extract phone number from text"""
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    return phones[0] if phones else None

def extract_skills(text):
    """Extract skills from resume text"""
    text_lower = text.lower()
    found_skills = []
    
    for skill in SKILLS_DATABASE:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    
    return list(set(found_skills))

def extract_education(text):
    """Extract education information"""
    education_keywords = [
        'bachelor', 'master', 'phd', 'doctorate', 'diploma', 'degree',
        'b.tech', 'm.tech', 'b.e', 'm.e', 'b.sc', 'm.sc', 'mba', 'bba',
        'bca', 'mca', 'engineering', 'university', 'college', 'institute'
    ]
    
    education = []
    sentences = text.split('.')
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(keyword in sentence_lower for keyword in education_keywords):
            education.append(sentence.strip())
    
    return education[:3]

def extract_experience_years(text):
    """Estimate years of experience"""
    experience_patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience)?',
        r'(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)'
    ]
    
    years = []
    text_lower = text.lower()
    
    for pattern in experience_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if isinstance(match, tuple):
                years.append(int(match[0]))
            else:
                years.append(int(match))
    
    return max(years) if years else 0

def process_resume(resume_text):
    """Process resume and extract all information"""
    return {
        'email': extract_email(resume_text),
        'phone': extract_phone(resume_text),
        'skills': extract_skills(resume_text),
        'education': extract_education(resume_text),
        'experience_years': extract_experience_years(resume_text),
        'raw_text': resume_text
    }

def calculate_match_score(resume_data, job_description):
    """Calculate match score between resume and job description"""
    try:
        # Extract skills from job description
        job_skills = extract_skills(job_description)
        resume_skills = resume_data.get('skills', [])
        
        # Calculate skill match percentage
        if not job_skills:
            skill_match = 0
        else:
            matched_skills = set(resume_skills).intersection(set(job_skills))
            skill_match = len(matched_skills) / len(job_skills)
        
        # Calculate text similarity using TF-IDF
        resume_text = resume_data.get('raw_text', '')
        
        if resume_text and job_description:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
            text_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        else:
            text_similarity = 0
        
        # Experience bonus
        experience_years = resume_data.get('experience_years', 0)
        experience_score = min(experience_years / 10, 1)
        
        # Weighted score
        final_score = (
            skill_match * 0.5 +
            text_similarity * 0.3 +
            experience_score * 0.2
        ) * 100
        
        return round(final_score, 2)
        
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return 0