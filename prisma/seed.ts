const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create languages
  const english = await prisma.language.create({
    data: {
      name: 'English',
      code: 'en'
    }
  })

  const spanish = await prisma.language.create({
    data: {
      name: 'Spanish',
      code: 'es'
    }
  })

  // Create language pair
  const enEs = await prisma.languagePair.create({
    data: {
      fromLanguageId: english.id,
      toLanguageId: spanish.id
    }
  })

  // Create grammatical concepts
  const presentTense = await prisma.grammaticalConcept.create({
    data: {
      name: 'Simple Present Tense',
      description: 'Basic present tense expressions for regular actions and states',
      languagePairId: enEs.id,
    }
  })

  const serEstar = await prisma.grammaticalConcept.create({
    data: {
      name: 'Ser vs Estar',
      description: 'Understanding the difference between permanent and temporary states in Spanish',
      languagePairId: enEs.id,
    }
  })

  // Create sentences with their acceptable translations
  await prisma.sentence.create({
    data: {
      canonicalFrom: 'I eat breakfast every morning',
      canonicalTo: 'Desayuno todas las mañanas',
      conceptId: presentTense.id,
      acceptableTranslations: {
        create: [
          {
            fromToText: 'Como el desayuno todas las mañanas',
            toFromText: 'I have breakfast every morning'
          },
          {
            fromToText: 'Tomo el desayuno todas las mañanas',
            toFromText: 'I take breakfast every morning'
          }
        ]
      }
    }
  })

  await prisma.sentence.create({
    data: {
      canonicalFrom: 'She works in a hospital',
      canonicalTo: 'Ella trabaja en un hospital',
      conceptId: presentTense.id,
      acceptableTranslations: {
        create: [
          {
            fromToText: 'Trabaja en un hospital',
            toFromText: 'She works at a hospital'
          }
        ]
      }
    }
  })

  await prisma.sentence.create({
    data: {
      canonicalFrom: 'He is a doctor',
      canonicalTo: 'Él es médico',
      conceptId: serEstar.id,
      acceptableTranslations: {
        create: [
          {
            fromToText: 'Es médico',
            toFromText: 'He is a physician'
          },
          {
            fromToText: 'Él es doctor',
            toFromText: 'He is a doctor'
          }
        ]
      }
    }
  })

  await prisma.sentence.create({
    data: {
      canonicalFrom: 'The soup is hot',
      canonicalTo: 'La sopa está caliente',
      conceptId: serEstar.id,
      acceptableTranslations: {
        create: [
          {
            fromToText: 'La sopa está muy caliente',
            toFromText: 'The soup is very hot'
          }
        ]
      }
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 