# 🤖 Google Gemini AI Integration Guide

## Step 1: Get Your Google Gemini API Key

### 1.1 Visit Google AI Studio
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Accept the terms of service

### 1.2 Create API Key
1. Click **"Get API Key"** in the top navigation
2. Click **"Create API Key"**
3. Select **"Create API key in new project"** (or choose existing project)
4. Copy the generated API key (starts with `AIza...`)

### 1.3 Important Notes
- **Free Tier**: 60 requests per minute, 1,500 requests per day
- **Paid Tier**: Higher limits available
- **Models Available**: Gemini 1.5 Flash (fast), Gemini 1.5 Pro (advanced)

## Step 2: Configure Your Environment

### 2.1 Update Environment Files

**Root `.env` file:**
```env
# Add your actual Gemini API key here
GOOGLE_AI_API_KEY=AIzaSyYourActualAPIKeyHere
USE_MOCK_AI=false
AI_SERVICE_PROVIDER=gemini
```

**Backend `.env` file:**
```env
# Add your actual Gemini API key here
GOOGLE_AI_API_KEY=AIzaSyYourActualAPIKeyHere
USE_MOCK_AI=false
AI_SERVICE_PROVIDER=gemini
```

### 2.2 Install Dependencies
```bash
cd backend
npm install @google/generative-ai
```

## Step 3: Test the Integration

### 3.1 Start Your Application
```bash
# From root directory
npm run dev
```

### 3.2 Test AI Features
1. **Login** to your application
2. **Navigate** to AI Assistant page
3. **Try Course Recommendations:**
   - Fill out the recommendation form
   - Click "Get Recommendations"
   - Should see real AI-generated suggestions

4. **Try Syllabus Generation:**
   - Fill out the syllabus form
   - Click "Generate Syllabus"
   - Should see AI-generated curriculum

### 3.3 Check Logs
Look for these messages in your backend logs:
```
[AiService] Google Gemini AI initialized successfully
[AiService] Gemini AI recommendation generated successfully
[AiService] Gemini AI syllabus generated successfully
```

## Step 4: Switching Between Mock and Real AI

### 4.1 Use Real AI (Gemini)
```env
USE_MOCK_AI=false
GOOGLE_AI_API_KEY=AIzaSyYourActualAPIKeyHere
```

### 4.2 Use Mock AI (for development/testing)
```env
USE_MOCK_AI=true
# GOOGLE_AI_API_KEY can be empty or commented out
```

## Step 5: Monitoring Usage

### 5.1 Google AI Studio Dashboard
- Visit [Google AI Studio](https://makersuite.google.com/)
- Check **"API Usage"** section
- Monitor requests and quotas

### 5.2 Application Logs
The service logs all AI interactions:
- Successful generations
- API errors with fallback to mock data
- Usage patterns

## Step 6: Error Handling

### 6.1 Automatic Fallback
If Gemini AI fails, the system automatically falls back to mock data:
- API key issues
- Rate limit exceeded
- Network problems
- Invalid responses

### 6.2 Common Issues

**Issue: "API key not valid"**
```
Solution: Double-check your API key in the .env file
```

**Issue: "Quota exceeded"**
```
Solution: Wait for quota reset or upgrade to paid tier
```

**Issue: "Model not found"**
```
Solution: Ensure you're using supported models (gemini-1.5-flash)
```

## Step 7: Production Considerations

### 7.1 Security
- Never commit API keys to version control
- Use environment variables in production
- Rotate API keys regularly

### 7.2 Rate Limiting
- Implement request queuing for high traffic
- Cache responses when appropriate
- Monitor usage patterns

### 7.3 Cost Management
- Set up billing alerts in Google Cloud
- Monitor token usage
- Implement request limits per user

## Example API Usage

### Course Recommendations Request
```json
{
  "academicLevel": "intermediate",
  "interests": ["programming", "ai"],
  "preferredDifficulty": "medium",
  "timeCommitment": 15
}
```

### Expected Response
```json
{
  "success": true,
  "recommendations": [
    {
      "title": "Machine Learning Fundamentals",
      "description": "Comprehensive introduction to ML concepts...",
      "matchScore": 0.95
    }
  ],
  "metadata": {
    "algorithmVersion": "gemini-1.5-flash",
    "confidenceScore": 0.92
  }
}
```

## Troubleshooting

### Check API Key
```bash
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
```

### Verify Environment Variables
```bash
# In your backend directory
node -e "console.log('API Key:', process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Not Set')"
```

## Support

- **Google AI Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **API Reference**: [https://ai.google.dev/api](https://ai.google.dev/api)
- **Community Forum**: [https://discuss.ai.google.dev/](https://discuss.ai.google.dev/)

---

🎉 **You're all set!** Your ExcelMind AI application now uses real Google Gemini AI for intelligent course recommendations and syllabus generation.