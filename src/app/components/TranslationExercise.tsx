'use client';

import { useState, useEffect } from 'react';

interface TranslationFeedback {
  overallScore: number;
  conceptScore: number;
  explanation?: string;
}

interface Sentence {
  id: number;
  canonicalFrom: string;
  canonicalTo: string;
  acceptableTranslations: {
    fromToText: string | null;
    toFromText: string | null;
  }[];
}

interface TranslationExerciseProps {
  conceptId: number | null;
}

export default function TranslationExercise({ conceptId }: TranslationExerciseProps) {
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState<TranslationFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNextSentence() {
    if (!conceptId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sentences/random?conceptId=${conceptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sentence');
      }
      const data = await response.json();
      setCurrentSentence(data);
      setUserTranslation('');
      setFeedback(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function checkTranslation() {
    if (!currentSentence || !userTranslation.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/check-translation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentenceId: currentSentence.id,
          translation: userTranslation.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check translation');
      }

      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Fetch first sentence when concept changes
  useEffect(() => {
    if (conceptId) {
      fetchNextSentence();
    }
  }, [conceptId]);

  if (!conceptId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50">
        Error: {error}
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="text-center p-4">
        <button
          onClick={fetchNextSentence}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Start Exercise
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Translate this sentence:
        </h3>
        <p className="text-xl mb-6 text-gray-800">
          {currentSentence.canonicalFrom}
        </p>
        <textarea
          value={userTranslation}
          onChange={(e) => setUserTranslation(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Enter your translation..."
        />
        <div className="mt-4 flex space-x-4">
          <button
            onClick={checkTranslation}
            disabled={!userTranslation.trim()}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Check Translation
          </button>
          <button
            onClick={fetchNextSentence}
            className="px-4 py-2 text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50"
          >
            Skip
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
          <div className="space-y-2">
            <p>
              Overall Score: <span className="font-medium">{feedback.overallScore}/10</span>
            </p>
            <p>
              Concept Score: <span className="font-medium">{feedback.conceptScore}/10</span>
            </p>
            {feedback.explanation && (
              <p className="text-sm text-gray-600 mt-2">{feedback.explanation}</p>
            )}
            {feedback.overallScore === 10 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={fetchNextSentence}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Next Sentence
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 