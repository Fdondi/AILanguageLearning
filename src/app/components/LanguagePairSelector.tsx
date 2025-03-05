'use client';

import { useEffect, useState } from 'react';

interface Language {
  id: number;
  name: string;
  code: string;
}

interface LanguagePair {
  id: number;
  fromLanguage: Language;
  toLanguage: Language;
}

interface LanguagePairSelectorProps {
  onSelect: (languagePairId: number) => void;
}

export default function LanguagePairSelector({ onSelect }: LanguagePairSelectorProps) {
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguagePairs() {
      try {
        const response = await fetch('/api/languagePairs');
        if (!response.ok) {
          throw new Error('Failed to fetch language pairs');
        }
        const data = await response.json();
        setLanguagePairs(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    fetchLanguagePairs();
  }, []);

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
    <div className="w-full max-w-md mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Language Pair
      </label>
      <select
        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => onSelect(Number(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>Choose a language pair</option>
        {languagePairs.map((pair) => (
          <option key={pair.id} value={pair.id}>
            {pair.fromLanguage.name} → {pair.toLanguage.name}
          </option>
        ))}
      </select>
    </div>
  );
} 