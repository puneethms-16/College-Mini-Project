def rank_candidates(resumes, job_description):
    """
    Rank candidates based on match scores and other criteria
    
    Args:
        resumes: List of resume documents from MongoDB
        job_description: Job description text
    
    Returns:
        Sorted list of resumes by match score (descending)
    """
    # Sort by match_score in descending order
    ranked = sorted(resumes, key=lambda x: x.get('match_score', 0), reverse=True)
    
    return ranked

def apply_filters(resumes, filters):
    """
    Apply filters to resumes
    
    Args:
        resumes: List of resume documents
        filters: Dictionary of filter criteria
            - min_experience: Minimum years of experience
            - required_skills: List of required skills
            - education_level: Required education level
    
    Returns:
        Filtered list of resumes
    """
    filtered_resumes = resumes.copy()
    
    # Filter by minimum experience
    if 'min_experience' in filters:
        min_exp = filters['min_experience']
        filtered_resumes = [
            r for r in filtered_resumes 
            if r.get('extracted_data', {}).get('experience_years', 0) >= min_exp
        ]
    
    # Filter by required skills
    if 'required_skills' in filters:
        required_skills = [s.lower() for s in filters['required_skills']]
        filtered_resumes = [
            r for r in filtered_resumes
            if any(
                skill.lower() in [s.lower() for s in r.get('extracted_data', {}).get('skills', [])]
                for skill in required_skills
            )
        ]
    
    # Filter by education keywords
    if 'education_keywords' in filters:
        edu_keywords = [e.lower() for e in filters['education_keywords']]
        filtered_resumes = [
            r for r in filtered_resumes
            if any(
                any(keyword in edu.lower() for keyword in edu_keywords)
                for edu in r.get('extracted_data', {}).get('education', [])
            )
        ]
    
    return filtered_resumes

def get_top_candidates(resumes, top_n=10):
    """Get top N candidates"""
    return resumes[:top_n]