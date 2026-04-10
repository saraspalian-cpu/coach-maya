/**
 * Daily content — fun facts, riddles, quotes.
 * Rotates daily using date as seed. No API needed.
 */

const FACTS = [
  { icon: '🧬', text: 'Your DNA is about 99.9% identical to every other human on Earth. The 0.1% is what makes you, you.' },
  { icon: '🎾', text: 'The fastest tennis serve ever recorded was 263 km/h by Sam Groth. That\'s faster than most highway speed limits.' },
  { icon: '💻', text: 'The first computer programmer was Ada Lovelace — in 1843, over 100 years before modern computers existed.' },
  { icon: '🧠', text: 'Your brain uses 20% of your body\'s total energy — even though it\'s only 2% of your body weight.' },
  { icon: '🎾', text: 'Roger Federer lost his first Grand Slam final, then won 20. Losing first is part of the recipe.' },
  { icon: '🚀', text: 'SpaceX was founded with Elon Musk\'s last $100M. The first three rockets blew up. The fourth changed history.' },
  { icon: '🎹', text: 'Mozart composed his first piece at age 5. He also had 10,000+ hours of practice by age 10.' },
  { icon: '💡', text: 'Thomas Edison failed 1,000 times before inventing the lightbulb. He said each failure was a step, not a stop.' },
  { icon: '🎾', text: 'Novak Djokovic changed his diet and went from good to the greatest. Small changes, massive results.' },
  { icon: '🖥️', text: 'The entire Apollo 11 moon landing computer had less processing power than your phone.' },
  { icon: '📖', text: 'Reading 20 minutes a day exposes you to ~1.8 million words per year. That compounds fast.' },
  { icon: '🎾', text: 'Tennis balls are fuzzy because the felt slows them down. Without it, the game would be unplayable.' },
  { icon: '🧪', text: 'Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs — still edible.' },
  { icon: '💻', text: 'The first website ever created is still online: info.cern.ch. It went live in 1991.' },
  { icon: '🎾', text: 'Rafael Nadal won his first French Open at 19. He\'s won it 14 times. Consistency is the cheat code.' },
  { icon: '🌍', text: 'If Earth\'s history were compressed into 24 hours, humans would appear in the last 1.2 seconds.' },
  { icon: '💻', text: 'GitHub hosts over 200 million repositories. Most of the world\'s software is built by people sharing code for free.' },
  { icon: '🧠', text: 'Sleep is when your brain consolidates memories. Pulling all-nighters literally makes you dumber.' },
  { icon: '🎹', text: 'A piano has 88 keys but can produce over 88 billion possible combinations of notes.' },
  { icon: '🏗️', text: 'The Great Wall of China took over 2,000 years to build. Every wall starts with one brick.' },
  { icon: '💻', text: 'Python (the programming language) was named after Monty Python, not the snake.' },
  { icon: '🎾', text: 'Serena Williams started playing tennis at age 3. She practiced on cracked courts in Compton.' },
  { icon: '🔬', text: 'There are more bacteria in your mouth than people on Earth. Brush your teeth.' },
  { icon: '🚀', text: 'Jeff Bezos started Amazon in his garage selling books. Now it sells everything to everyone.' },
  { icon: '📱', text: 'The average person spends 4 hours a day on their phone. That\'s 60 days per year. Use them.' },
  { icon: '🎾', text: 'A tennis match can theoretically last forever. The longest ever was 11 hours 5 minutes at Wimbledon.' },
  { icon: '💻', text: 'Mark Zuckerberg built the first version of Facebook in his dorm room in 2 weeks.' },
  { icon: '🧠', text: 'Your brain can process an image in just 13 milliseconds. Faster than you can blink.' },
  { icon: '🎹', text: 'Beethoven was almost completely deaf when he composed his 9th Symphony — his greatest work.' },
  { icon: '🌊', text: 'The ocean is so deep that if you put Mount Everest at the bottom of the Mariana Trench, the peak would still be underwater.' },
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
  { text: 'Hard work beats talent when talent doesn\'t work hard.', by: 'Tim Notke' },
  { text: 'You miss 100% of the shots you don\'t take.', by: 'Wayne Gretzky' },
  { text: 'The only way to do great work is to love what you do.', by: 'Steve Jobs' },
  { text: 'I\'ve missed more than 9,000 shots in my career. I\'ve lost almost 300 games. 26 times, I\'ve been trusted to take the game-winning shot and missed.', by: 'Michael Jordan' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', by: 'Confucius' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', by: 'Proverb' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', by: 'Winston Churchill' },
  { text: 'If you want to go fast, go alone. If you want to go far, go together.', by: 'African Proverb' },
  { text: 'Champions keep playing until they get it right.', by: 'Billie Jean King' },
  { text: 'Discipline is choosing between what you want now and what you want most.', by: 'Abraham Lincoln' },
  { text: 'Stay hungry, stay foolish.', by: 'Steve Jobs' },
  { text: 'Every expert was once a beginner.', by: 'Helen Hayes' },
  { text: 'The grind includes days you don\'t feel like grinding.', by: 'Unknown' },
  { text: 'You don\'t rise to the level of your goals. You fall to the level of your systems.', by: 'James Clear' },
]

function dayIndex() {
  const d = new Date()
  return d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

function getDailyFact() { return FACTS[dayIndex() % FACTS.length] }
function getDailyRiddle() { return RIDDLES[dayIndex() % RIDDLES.length] }
function getDailyQuote() { return QUOTES[dayIndex() % QUOTES.length] }

export { getDailyFact, getDailyRiddle, getDailyQuote, FACTS, RIDDLES, QUOTES }
