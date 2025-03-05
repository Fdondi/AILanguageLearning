import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranslationEvaluation {
  overallScore: number;
  conceptScore: number;
  feedback: string;
}

export async function evaluateTranslation(
  sourceText: string,
  userTranslation: string,
  targetLanguage: string,
  grammaticalConcept: string
): Promise<TranslationEvaluation> {
  const prompt = `
    Evaluate this translation:
    Source text: "${sourceText}"
    User's translation: "${userTranslation}"
    Target language: ${targetLanguage}
    Grammatical concept being tested: ${grammaticalConcept}

    Please provide a JSON response with the following structure:
    {
      "overallScore": (1-10 score for overall translation quality),
      "conceptScore": (1-10 score for how well the translation demonstrates understanding of the specific grammatical concept),
      "feedback": "Brief explanation of the scores"
    }
  `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || "{}");
  
  return {
    overallScore: response.overallScore,
    conceptScore: response.conceptScore,
    feedback: response.feedback,
  };
} 