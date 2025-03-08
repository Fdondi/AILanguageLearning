'use client';

import { useState, useEffect } from 'react';

interface TranslationFeedback {
  overallScore: number;
  conceptScore: number;
  explanation?: string;
  missingTopics?: string[];
  acceptableTranslations?: string[];
  closestMatch?: string | null;
  translationsWithDiffs?: Array<{
    translation: string;
    diffs: {
      text: string;
      diffs: Array<{
        start: number;
        end: number;
        type: 'missing' | 'extra' | 'wrong';
      }>;
    };
  }>;
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

interface DiffResult {
  text: string;
  diffs: Array<{
    start: number;
    end: number;
    type: 'missing' | 'extra' | 'wrong';
  }>;
}

function HighlightedText({ text, diffs, isUserTranslation = false }: { 
  text: string, 
  diffs: DiffResult,
  isUserTranslation?: boolean 
}) {
  if (!diffs) return <span>{text}</span>;

  const parts: JSX.Element[] = [];
  let lastIndex = 0;

  // Sort diffs by start position
  const sortedDiffs = [...diffs.diffs].sort((a, b) => a.start - b.start);

  sortedDiffs.forEach((diff, index) => {
    // Add text before the difference
    if (diff.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, diff.start)}
        </span>
      );
    }

    // Add the highlighted difference
    const highlightClass = isUserTranslation
      ? (diff.type === 'wrong' ? 'bg-red-200' :
         diff.type === 'missing' ? 'bg-yellow-200' :
         'bg-orange-200') // extra
      : (diff.type === 'wrong' ? 'bg-green-200' :
         diff.type === 'missing' ? 'bg-blue-200' :
         'bg-purple-200'); // Show different colors for reference translations

    parts.push(
      <span 
        key={`diff-${index}`} 
        className={`${highlightClass} rounded px-0.5`} 
        title={isUserTranslation ? diff.type : `This ${diff.type === 'wrong' ? 'differs' : diff.type === 'missing' ? 'is missing' : 'is extra'} in your translation`}
      >
        {text.substring(diff.start, diff.end)}
      </span>
    );

    lastIndex = diff.end;
  });

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
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
            {feedback.missingTopics && feedback.missingTopics.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">Topics to Review:</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.missingTopics.map((topic, index) => (
                    <li key={index} className="text-sm text-yellow-700">{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.overallScore < 10 && feedback.translationsWithDiffs && feedback.translationsWithDiffs.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Your translation:</p>
                <p className="text-sm text-gray-600 mb-4">{userTranslation}</p>
                <p className="text-sm font-medium text-gray-700 mb-2">Acceptable translations:</p>
                <ul className="list-disc pl-5 space-y-2">
                  {feedback.translationsWithDiffs.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      <HighlightedText 
                        text={item.translation} 
                        diffs={item.diffs} 
                        isUserTranslation={false}
                      />
                      {item.translation === feedback.closestMatch && (
                        <span className="ml-2 text-xs text-gray-500">(closest match)</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <div className="space-x-2">
                    <span className="inline-block px-2 bg-green-200 rounded">green: different character</span>
                    <span className="inline-block px-2 bg-blue-200 rounded">blue: missing in your translation</span>
                    <span className="inline-block px-2 bg-purple-200 rounded">purple: extra in your translation</span>
                  </div>
                </div>
              </div>
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