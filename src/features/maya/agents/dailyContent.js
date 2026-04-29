/**
 * Daily content — fun facts, riddles, quotes.
 * Rotates daily using date as seed. Personalizes by hobby tags when profile is given.
 */

const FACTS = [
  { tags: ['general'], icon: '🧬', text: 'Your DNA is about 99.9% identical to every other human on Earth. The 0.1% is what makes you, you.' },
  { tags: ['tennis'], icon: '🎾', text: 'The fastest tennis serve ever recorded was 263 km/h by Sam Groth. That\'s faster than most highway speed limits.' },
  { tags: ['coding','tech'], icon: '💻', text: 'The first computer programmer was Ada Lovelace — in 1843, over 100 years before modern computers existed.' },
  { tags: ['general'], icon: '🧠', text: 'Your brain uses 20% of your body\'s total energy — even though it\'s only 2% of your body weight.' },
  { tags: ['tennis'], icon: '🎾', text: 'Roger Federer lost his first Grand Slam final, then won 20. Losing first is part of the recipe.' },
  { tags: ['tech'], icon: '🚀', text: 'SpaceX was founded with Elon Musk\'s last $100M. The first three rockets blew up. The fourth changed history.' },
  { tags: ['piano','music'], icon: '🎹', text: 'Mozart composed his first piece at age 5. He also had 10,000+ hours of practice by age 10.' },
  { tags: ['general'], icon: '💡', text: 'Thomas Edison failed 1,000 times before inventing the lightbulb. He said each failure was a step, not a stop.' },
  { tags: ['tennis'], icon: '🎾', text: 'Novak Djokovic changed his diet and went from good to the greatest. Small changes, massive results.' },
  { tags: ['coding','tech'], icon: '🖥️', text: 'The entire Apollo 11 moon landing computer had less processing power than your phone.' },
  { tags: ['reading'], icon: '📖', text: 'Reading 20 minutes a day exposes you to ~1.8 million words per year. That compounds fast.' },
  { tags: ['tennis'], icon: '🎾', text: 'Tennis balls are fuzzy because the felt slows them down. Without it, the game would be unplayable.' },
  { tags: ['general'], icon: '🧪', text: 'Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs — still edible.' },
  { tags: ['coding','tech'], icon: '💻', text: 'The first website ever created is still online: info.cern.ch. It went live in 1991.' },
  { tags: ['tennis'], icon: '🎾', text: 'Rafael Nadal won his first French Open at 19. He\'s won it 14 times. Consistency is the cheat code.' },
  { tags: ['general'], icon: '🌍', text: 'If Earth\'s history were compressed into 24 hours, humans would appear in the last 1.2 seconds.' },
  { tags: ['coding','tech'], icon: '💻', text: 'GitHub hosts over 200 million repositories. Most of the world\'s software is built by people sharing code for free.' },
  { tags: ['general','sleep'], icon: '🧠', text: 'Sleep is when your brain consolidates memories. Pulling all-nighters literally makes you dumber.' },
  { tags: ['piano','music'], icon: '🎹', text: 'A piano has 88 keys but can produce over 88 billion possible combinations of notes.' },
  { tags: ['general'], icon: '🏗️', text: 'The Great Wall of China took over 2,000 years to build. Every wall starts with one brick.' },
  { tags: ['coding'], icon: '💻', text: 'Python (the programming language) was named after Monty Python, not the snake.' },
  { tags: ['tennis'], icon: '🎾', text: 'Serena Williams started playing tennis at age 3. She practiced on cracked courts in Compton.' },
  { tags: ['general'], icon: '🔬', text: 'There are more bacteria in your mouth than people on Earth. Brush your teeth.' },
  { tags: ['tech'], icon: '🚀', text: 'Jeff Bezos started Amazon in his garage selling books. Now it sells everything to everyone.' },
  { tags: ['general'], icon: '📱', text: 'The average person spends 4 hours a day on their phone. That\'s 60 days per year. Use them.' },
  { tags: ['tennis'], icon: '🎾', text: 'A tennis match can theoretically last forever. The longest ever was 11 hours 5 minutes at Wimbledon.' },
  { tags: ['coding','tech'], icon: '💻', text: 'Mark Zuckerberg built the first version of Facebook in his dorm room in 2 weeks.' },
  { tags: ['general'], icon: '🧠', text: 'Your brain can process an image in just 13 milliseconds. Faster than you can blink.' },
  { tags: ['piano','music'], icon: '🎹', text: 'Beethoven was almost completely deaf when he composed his 9th Symphony — his greatest work.' },
  { tags: ['general'], icon: '🌊', text: 'The ocean is so deep that if you put Mount Everest at the bottom of the Mariana Trench, the peak would still be underwater.' },
  // New hobby-tagged additions
  { tags: ['math'], icon: '🧮', text: 'Pi has been calculated to over 100 trillion digits. We only need 39 to measure the observable universe to the width of a hydrogen atom.' },
  { tags: ['math'], icon: '♟️', text: 'There are more possible chess games than atoms in the observable universe. About 10^120 vs 10^80.' },
  { tags: ['football','soccer'], icon: '⚽', text: 'Lionel Messi missed only 1 of his first 28 penalty kicks. The mind under pressure is built, not born.' },
  { tags: ['basketball'], icon: '🏀', text: 'Kobe Bryant practiced his footwork until his shoes wore through — at age 36, with 5 rings already.' },
  { tags: ['swimming'], icon: '🏊', text: 'Michael Phelps trained 6 hours a day, 6 days a week, for 6 years. 22 Olympic gold medals later — yeah.' },
  { tags: ['art','drawing'], icon: '🎨', text: 'Picasso produced over 50,000 works. Quantity is the path to quality — most masters out-volume out-think.' },
  { tags: ['general'], icon: '🎯', text: '10,000 hours is the rough threshold for mastery. That\'s ~3 hours a day for ~10 years. Start the clock.' },
  { tags: ['general'], icon: '🧠', text: 'The brain rewires itself based on what you do, not what you intend. Action shapes you, not thought.' },
]

const RIDDLES = [
  { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', a: 'An echo' },
  { q: 'The more you take, the more you leave behind. What am I?', a: 'Footsteps' },
  { q: 'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?', a: 'A map' },
  { q: 'What has keys but no locks?', a: 'A piano' },
  { q: 'I can be cracked, made, told, and played. What am I?', a: 'A joke' },
  { q: 'What gets wetter the more it dries?', a: 'A towel' },
  { q: 'What has a head and a tail but no body?', a: 'A coin' },
  { q: 'I have branches but no fruit, trunk, or leaves. What am I?', a: 'A bank' },
  { q: 'What can travel around the world while staying in a corner?', a: 'A stamp' },
  { q: 'The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they\'re using it. What is it?', a: 'A coffin' },
]

const QUOTES = [
  { tags: ['general'], text: 'Hard work beats talent when talent doesn\'t work hard.', by: 'Tim Notke' },
  { tags: ['general'], text: 'You miss 100% of the shots you don\'t take.', by: 'Wayne Gretzky' },
  { tags: ['general'], text: 'The only way to do great work is to love what you do.', by: 'Steve Jobs' },
  { tags: ['basketball'], text: 'I\'ve missed more than 9,000 shots in my career. I\'ve lost almost 300 games. 26 times, I\'ve been trusted to take the game-winning shot and missed.', by: 'Michael Jordan' },
  { tags: ['general'], text: 'It does not matter how slowly you go as long as you do not stop.', by: 'Confucius' },
  { tags: ['general'], text: 'The best time to plant a tree was 20 years ago. The second best time is now.', by: 'Proverb' },
  { tags: ['general'], text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', by: 'Winston Churchill' },
  { tags: ['general'], text: 'If you want to go fast, go alone. If you want to go far, go together.', by: 'African Proverb' },
  { tags: ['tennis'], text: 'Champions keep playing until they get it right.', by: 'Billie Jean King' },
  { tags: ['general'], text: 'Discipline is choosing between what you want now and what you want most.', by: 'Abraham Lincoln' },
  { tags: ['tech'], text: 'Stay hungry, stay foolish.', by: 'Steve Jobs' },
  { tags: ['general'], text: 'Every expert was once a beginner.', by: 'Helen Hayes' },
  { tags: ['general'], text: 'The grind includes days you don\'t feel like grinding.', by: 'Unknown' },
  { tags: ['general'], text: 'You don\'t rise to the level of your goals. You fall to the level of your systems.', by: 'James Clear' },
  { tags: ['tennis'], text: 'You can\'t put a limit on anything. The more you dream, the further you get.', by: 'Michael Phelps' },
  { tags: ['piano','music'], text: 'To play a wrong note is insignificant; to play without passion is inexcusable.', by: 'Beethoven' },
  { tags: ['math','general'], text: 'Pure mathematics is, in its way, the poetry of logical ideas.', by: 'Albert Einstein' },
  { tags: ['coding','tech'], text: 'The function of good software is to make the complex appear to be simple.', by: 'Grady Booch' },
  { tags: ['general'], text: 'The cave you fear to enter holds the treasure you seek.', by: 'Joseph Campbell' },
]

function dayIndex() {
  const d = new Date()
  return d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

// Map profile.hobbies (e.g. ["Tennis","Piano"]) → tag set
function profileTags(profile) {
  if (!profile) return null
  const hobbies = (profile.hobbies || []).map(h => String(h).toLowerCase())
  const subjects = [
    ...(profile.favoriteSubjects || []),
    ...(profile.hardSubjects || []),
  ].map(s => String(s).toLowerCase())
  const tags = new Set()
  const map = {
    tennis: 'tennis', piano: 'piano', guitar: 'music', violin: 'music', drums: 'music',
    coding: 'coding', programming: 'coding', python: 'coding', javascript: 'coding',
    math: 'math', maths: 'math', mathematics: 'math', chess: 'math',
    football: 'football', soccer: 'football', basketball: 'basketball',
    swimming: 'swimming', reading: 'reading', drawing: 'art', painting: 'art',
  }
  for (const h of [...hobbies, ...subjects]) {
    for (const k of Object.keys(map)) {
      if (h.includes(k)) tags.add(map[k])
    }
  }
  return tags.size > 0 ? tags : null
}

function pickPersonalized(items, profile) {
  const tags = profileTags(profile)
  if (!tags) return items[dayIndex() % items.length]
  const matched = items.filter(it => (it.tags || []).some(t => tags.has(t)))
  if (matched.length === 0) return items[dayIndex() % items.length]
  // 70% chance to pick a personalized one, 30% generic — keeps variety
  const usePersonal = (dayIndex() % 10) < 7
  const pool = usePersonal ? matched : items
  return pool[dayIndex() % pool.length]
}

function getDailyFact(profile) { return pickPersonalized(FACTS, profile) }
function getDailyQuote(profile) { return pickPersonalized(QUOTES, profile) }
function getDailyRiddle() { return RIDDLES[dayIndex() % RIDDLES.length] }

export { getDailyFact, getDailyRiddle, getDailyQuote, FACTS, RIDDLES, QUOTES }
