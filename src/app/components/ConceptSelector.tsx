'use client';

import { useEffect, useState } from 'react';

interface GrammaticalConcept {
  id: number;
  name: string;
  description: string;
}

interface ConceptSelectorProps {
  languagePairId: number | null;
  onSelect: (conceptId: number) => void;
}

export default function ConceptSelector({ languagePairId, onSelect }: ConceptSelectorProps) {
  const [concepts, setConcepts] = useState<GrammaticalConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!languagePairId) return;

    async function fetchConcepts() {
      setLoading(true);
      try {
        const response = await fetch(`/api/concepts?languagePairId=${languagePairId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch concepts');
        }
        const data = await response.json();
        setConcepts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchConcepts();
  }, [languagePairId]);

  if (!languagePairId) {
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

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Grammatical Concept
      </label>
      <select
        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => onSelect(Number(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>Choose a concept</option>
        {concepts.map((concept) => (
          <option key={concept.id} value={concept.id} title={concept.description}>
            {concept.name}
          </option>
        ))}
      </select>
      {concepts.length > 0 && (
        <p className="mt-2 text-sm text-gray-500">
          {concepts[0].description}
        </p>
      )}
    </div>
  );
} 