// Validate that the query is food/recipe related
export function validateFoodQuery(query: string): { isValid: boolean; suggestion?: string } {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Common non-food keywords that should be rejected
  const nonFoodKeywords = [
    'car', 'engine', 'java', 'javascript', 'python', 'code', 'program', 'website',
    'computer', 'software', 'hardware', 'build', 'create', 'develop', 'install',
    'download', 'upload', 'server', 'database', 'api', 'framework', 'library',
    'algorithm', 'function', 'class', 'variable', 'array', 'object', 'method',
    'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'mongodb',
    'sql', 'mysql', 'postgresql', 'firebase', 'aws', 'azure', 'docker',
    'kubernetes', 'git', 'github', 'npm', 'yarn', 'webpack', 'babel',
    'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart',
    'flutter', 'android', 'ios', 'mobile', 'desktop', 'web development',
    'machine learning', 'ai model', 'neural network', 'data science',
    'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'nft',
    'marketing', 'business plan', 'resume', 'cv', 'cover letter',
    'email template', 'presentation', 'spreadsheet', 'document',
    'math', 'physics', 'chemistry', 'biology', 'science', 'homework',
    'essay', 'report', 'thesis', 'research', 'study', 'exam',
    'workout', 'exercise', 'fitness', 'gym', 'training', 'muscle',
    'travel', 'vacation', 'hotel', 'flight', 'booking', 'itinerary',
    'music', 'song', 'lyrics', 'instrument', 'guitar', 'piano',
    'movie', 'film', 'video', 'youtube', 'streaming', 'netflix',
    'game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam',
    'fashion', 'clothing', 'shoes', 'accessories', 'makeup', 'skincare',
    'furniture', 'decoration', 'interior design', 'home improvement',
    'gardening', 'plants', 'flowers', 'landscaping', 'lawn care',
    'car repair', 'automotive', 'mechanic', 'engine repair', 'oil change',
    'plumbing', 'electrical', 'construction', 'renovation', 'diy project'
  ];
  
  // Check if query contains non-food keywords (must be exact word matches, not partial)
  const words = normalizedQuery.split(/\s+/);
  const containsNonFood = nonFoodKeywords.some(keyword => 
    words.includes(keyword) || normalizedQuery === keyword
  );
  
  if (containsNonFood) {
    return {
      isValid: false,
      suggestion: "Try searching for food items like 'chicken pasta', 'chocolate cake', or 'vegetable soup' instead."
    };
  }
  
  // Additional check for very short or generic queries
  if (normalizedQuery.length < 2) {
    return {
      isValid: false,
      suggestion: "Please enter a more specific food or recipe name."
    };
  }
  
  // If it passes all checks, it's likely food-related
  return { isValid: true };
}