import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService, RecommendationRequest, SyllabusRequest } from '../api/aiService';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Calculator, 
  Code, 
  Globe,
  Sparkles,
  Clock,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  topic?: string;
  data?: any;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI learning assistant. I can help you get personalized course recommendations or generate detailed syllabi for your courses. What would you like to explore today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('recommendations');
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [showSyllabusForm, setShowSyllabusForm] = useState(false);

  // Recommendation form state
  const [recommendationForm, setRecommendationForm] = useState<RecommendationRequest>({
    academicLevel: 'beginner',
    interests: [],
    preferredDifficulty: 'easy',
    timeCommitment: 10,
    learningStyle: 'mixed',
    previousCourses: [],
    careerGoals: []
  });

  // Syllabus form state
  const [syllabusForm, setSyllabusForm] = useState<SyllabusRequest>({
    courseTitle: '',
    topics: [],
    duration: 12,
    difficultyLevel: 'beginner',
    learningObjectives: [],
    prerequisites: []
  });

  const topics = [
    { value: 'recommendations', label: 'Course Recommendations', icon: Sparkles },
    { value: 'syllabus', label: 'Syllabus Generator', icon: BookOpen },
    { value: 'computer-science', label: 'Computer Science', icon: Code },
    { value: 'mathematics', label: 'Mathematics', icon: Calculator },
    { value: 'study-tips', label: 'Study Tips', icon: Globe },
  ];

  // Mutations for AI endpoints
  const recommendationMutation = useMutation({
    mutationFn: aiService.getRecommendations,
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `I've generated ${data.recommendations.length} personalized course recommendations for you based on your preferences!`,
        sender: 'ai',
        timestamp: new Date(),
        topic: 'recommendations',
        data: data
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (_error) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: "I apologize, but I encountered an error while generating recommendations. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        topic: 'recommendations'
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  });

  const syllabusMutation = useMutation({
    mutationFn: aiService.generateSyllabus,
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `I've generated a comprehensive ${data.syllabus.duration} syllabus for "${data.syllabus.courseTitle}" with ${data.syllabus.weeks.length} weeks of content!`,
        sender: 'ai',
        timestamp: new Date(),
        topic: 'syllabus',
        data: data
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (_error) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: "I apologize, but I encountered an error while generating the syllabus. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        topic: 'syllabus'
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      topic: selectedTopic,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Generate contextual AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateContextualResponse(inputMessage, selectedTopic),
        sender: 'ai',
        timestamp: new Date(),
        topic: selectedTopic,
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const generateContextualResponse = (question: string, topic: string) => {
    const responses = {
      'recommendations': "I can help you find the perfect courses! Use the recommendation form below to get personalized suggestions based on your interests and goals.",
      'syllabus': "I can generate a detailed syllabus for any course! Fill out the syllabus form with your course requirements and I'll create a comprehensive curriculum.",
      'computer-science': "Computer Science is a fascinating field! Whether you're interested in programming, algorithms, or AI, I can help guide your learning journey.",
      'mathematics': "Mathematics is the foundation of many fields! From basic algebra to advanced calculus, I can help you find the right level and approach.",
      'study-tips': "Effective studying is key to success! I can share proven techniques for time management, note-taking, and exam preparation."
    };
    return responses[topic as keyof typeof responses] || "That's an interesting question! How can I help you with your learning goals?";
  };

  const handleRecommendationSubmit = () => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Please generate course recommendations for: ${recommendationForm.academicLevel} level, interested in ${recommendationForm.interests?.join(', ')}, ${recommendationForm.timeCommitment} hours/week commitment.`,
      sender: 'user',
      timestamp: new Date(),
      topic: 'recommendations'
    };
    setMessages(prev => [...prev, userMessage]);
    setShowRecommendationForm(false);
    recommendationMutation.mutate(recommendationForm);
  };

  const handleSyllabusSubmit = () => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Please generate a syllabus for "${syllabusForm.courseTitle}" - ${syllabusForm.duration} weeks, ${syllabusForm.difficultyLevel} level, covering: ${syllabusForm.topics.join(', ')}.`,
      sender: 'user',
      timestamp: new Date(),
      topic: 'syllabus'
    };
    setMessages(prev => [...prev, userMessage]);
    setShowSyllabusForm(false);
    syllabusMutation.mutate(syllabusForm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addToList = (list: string[], value: string, setter: (list: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
    }
  };

  const removeFromList = (list: string[], index: number, setter: (list: string[]) => void) => {
    setter(list.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Learning Assistant</h1>
        <p className="text-gray-600 mt-1">Get personalized recommendations and generate course syllabi with AI.</p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col">
        {/* Topic Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.value}
                onClick={() => setSelectedTopic(topic.value)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTopic === topic.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <topic.icon className="h-4 w-4" />
                <span>{topic.label}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => setShowRecommendationForm(!showRecommendationForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Get Recommendations</span>
            </button>
            <button
              onClick={() => setShowSyllabusForm(!showSyllabusForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Generate Syllabus</span>
            </button>
          </div>
        </div>

        {/* Recommendation Form */}
        {showRecommendationForm && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Recommendation Preferences</h3>
              <button
                onClick={() => setShowRecommendationForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
                <select
                  value={recommendationForm.academicLevel}
                  onChange={(e) => setRecommendationForm({...recommendationForm, academicLevel: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Difficulty</label>
                <select
                  value={recommendationForm.preferredDifficulty}
                  onChange={(e) => setRecommendationForm({...recommendationForm, preferredDifficulty: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Commitment (hours/week)</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={recommendationForm.timeCommitment}
                  onChange={(e) => setRecommendationForm({...recommendationForm, timeCommitment: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
                <select
                  value={recommendationForm.learningStyle}
                  onChange={(e) => setRecommendationForm({...recommendationForm, learningStyle: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="kinesthetic">Kinesthetic</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests (add one at a time)</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., programming, mathematics, design"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToList(recommendationForm.interests || [], e.currentTarget.value, 
                        (list) => setRecommendationForm({...recommendationForm, interests: list}));
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {recommendationForm.interests?.map((interest, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                    {interest}
                    <button
                      onClick={() => removeFromList(recommendationForm.interests || [], index,
                        (list) => setRecommendationForm({...recommendationForm, interests: list}))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRecommendationSubmit}
                disabled={recommendationMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {recommendationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{recommendationMutation.isPending ? 'Generating...' : 'Get Recommendations'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Syllabus Form */}
        {showSyllabusForm && (
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Syllabus Generation Requirements</h3>
              <button
                onClick={() => setShowSyllabusForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  value={syllabusForm.courseTitle}
                  onChange={(e) => setSyllabusForm({...syllabusForm, courseTitle: e.target.value})}
                  placeholder="e.g., Introduction to Machine Learning"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                <input
                  type="number"
                  min="4"
                  max="24"
                  value={syllabusForm.duration}
                  onChange={(e) => setSyllabusForm({...syllabusForm, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <select
                  value={syllabusForm.difficultyLevel}
                  onChange={(e) => setSyllabusForm({...syllabusForm, difficultyLevel: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topics to Cover</label>
              <input
                type="text"
                placeholder="Press Enter to add topics"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToList(syllabusForm.topics, e.currentTarget.value, 
                      (list) => setSyllabusForm({...syllabusForm, topics: list}));
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {syllabusForm.topics.map((topic, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                    {topic}
                    <button
                      onClick={() => removeFromList(syllabusForm.topics, index,
                        (list) => setSyllabusForm({...syllabusForm, topics: list}))}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
              <input
                type="text"
                placeholder="Press Enter to add learning objectives"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToList(syllabusForm.learningObjectives, e.currentTarget.value, 
                      (list) => setSyllabusForm({...syllabusForm, learningObjectives: list}));
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {syllabusForm.learningObjectives.map((objective, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                    {objective}
                    <button
                      onClick={() => removeFromList(syllabusForm.learningObjectives, index,
                        (list) => setSyllabusForm({...syllabusForm, learningObjectives: list}))}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSyllabusSubmit}
                disabled={syllabusMutation.isPending || !syllabusForm.courseTitle || syllabusForm.topics.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {syllabusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                <span>{syllabusMutation.isPending ? 'Generating...' : 'Generate Syllabus'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-4xl ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Render AI Response Data */}
              {message.data && message.topic === 'recommendations' && (
                <div className="mt-4 ml-11">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Course Recommendations</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Confidence: {Math.round(message.data.metadata.confidenceScore * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {message.data.recommendations.slice(0, 4).map((course: any) => (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{course.title}</h5>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{course.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{course.duration} weeks</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{course.enrolledStudents.toLocaleString()}</span>
                            </div>
                            <span className="font-medium text-blue-600">${course.price}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {course.tags.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {message.data && message.topic === 'syllabus' && (
                <div className="mt-4 ml-11">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{message.data.syllabus.courseTitle}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{message.data.metadata.totalHours} total hours</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{message.data.syllabus.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Course Details</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>Duration: {message.data.syllabus.duration}</li>
                          <li>Level: {message.data.syllabus.difficultyLevel}</li>
                          <li>Total Weeks: {message.data.syllabus.weeks.length}</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Grading Scheme</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>Assignments: {message.data.syllabus.gradingScheme.assignments}%</li>
                          <li>Midterm: {message.data.syllabus.gradingScheme.midtermExam}%</li>
                          <li>Final Project: {message.data.syllabus.gradingScheme.finalProject}%</li>
                          <li>Participation: {message.data.syllabus.gradingScheme.participation}%</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Weekly Schedule (First 4 Weeks)</h5>
                      <div className="space-y-2">
                        {message.data.syllabus.weeks.slice(0, 4).map((week: any) => (
                          <div key={week.weekNumber} className="border border-gray-200 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h6 className="font-medium text-gray-900">{week.title}</h6>
                              <span className="text-xs text-gray-500">{week.estimatedHours}h</span>
                            </div>
                            <p className="text-sm text-gray-600">Topics: {week.topics.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about courses, or use the forms above for AI-powered recommendations and syllabus generation..."
              className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}