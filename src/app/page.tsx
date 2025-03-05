'use client';

import { useState } from 'react';
import LanguagePairSelector from './components/LanguagePairSelector';
import ConceptSelector from './components/ConceptSelector';
import TranslationExercise from './components/TranslationExercise';

export default function Home() {
  const [selectedLanguagePairId, setSelectedLanguagePairId] = useState<number | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Language Learning
        </h1>
        
        <div className="space-y-8">
          <LanguagePairSelector
            onSelect={(id) => {
              setSelectedLanguagePairId(id);
              setSelectedConceptId(null);
            }}
          />

          <ConceptSelector
            languagePairId={selectedLanguagePairId}
            onSelect={setSelectedConceptId}
          />

          <TranslationExercise
            conceptId={selectedConceptId}
          />
        </div>
      </div>
    </main>
  );
}
