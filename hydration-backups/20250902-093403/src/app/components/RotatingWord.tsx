"use client"
import { safeRandom } from '../lib/clientUtils'
import { useState, useEffect } from 'react'

export default function RotatingWord() {
  const words = [
    'Result', 'Creation', 'Tidbit', 'Idea', 'Masterpiece', 'Prompt', 'Bit of Brilliance', 'Win', 'Spark', 'Remix',
    'Workflow', 'Make', 'Magic', 'Hack', 'Demo', 'Draft', 'Upgrade', 'Glow-up', 'Screenshot', 'Rework',
    'Prototype', 'Reply', 'Essay', 'Poem', 'Email', 'Caption', 'Reel', 'Recipe', 'Plan', 'Trip Plan',
    'Story', 'Summary', 'Message', 'Rewrite', 'Upgrade', 'Script', 'Visual', 'Post', 'Tagline', 'Trick',
    'Code Snippet', 'Rewrite', 'Fix', 'Boost', 'Win', 'AI Power Move', 'Brainchild', 'Caption', 'Bit of Genius', 'Meme',
    'Surprise', 'Caption Hack', 'Clever Move', 'Design', 'Play', 'Experiment', 'Quote', 'Reframe', 'Draft 2.0', 'Refactor',
    'Lesson', 'Little Victory', 'Expression', 'Swipe File', 'Pitch', 'Note', 'Message Boost', 'Tidbit Hack', 'Chat Result', 'Template',
    'Tidbit Remix', 'Thread', 'Outline', 'Assistant Response', 'Hot Take', 'Flip', 'Cheat Code', 'Highlight', 'First Try', 'Idea Spark',
    'Day-Maker', 'Phrase', 'Micro-Win', 'Clever Bit', 'Tiny Triumph', 'Thought', 'Draft Magic', 'Response', 'Highlight Reel', 'Caption Magic',
    'Write-Up', 'Piece', 'Daily Win', 'AI Move', 'Polished Take', 'Workflow Magic', 'Daily Creation', 'Your Bit', 'This Thing You Made',
    'Masterpiece Theater 🎭', 'Mic Drop 🎤', 'Brain Blast 💥', 'Work of Weirdness', 'Thought Nugget', 'Chat Magic™', 'Jazzy Bit',
    'AI Art Attack 🎨', 'Happy Little Output', 'Fresh Bit of Bel-Air', 'Data Doodle', 'Nerd Flex', 'Y2K Hack', 'Hack to the Future',
    'Idea Rollerblade', 'Dial-Up Download', 'Bit of Funk', 'Groovy Move 🕺', 'AI-yo!', 'Byte-Sized Brilliance', 'Fax Machine Poetry',
    'Clippy Certified 📎', 'Saved by the Prompt', 'Digital Daydream', 'Lisa Frank Magic 🦄🌈', 'AI-riffic Take', 'Zine-Worthy Tidbit',
    'Little Bit o\' Logic', 'Madlib Moment', 'Idea Scrunchie', 'Hotline Hack', 'VHS Idea Dump', 'Cassette Creation', 'Cyber Scribble',
    'LaserDisc Legacy', 'Banana Phone Response 🍌📞', 'Promposal Draft', 'ChatGPT After Dark™', 'TRL-Worthy Tidbit 📺', 'Think Thing',
    'Brainwave™', 'Sonic Boom 💥', 'Meme Draft', 'Groovy Gem', 'Polaroid Moment', 'Neon Nugget', 'Retro Rant', 'Mixtape Thought',
    'Pager Message', 'Napkin Idea', 'Disco Data', 'Commodore Creation 🖥️', 'Funky Fragment', 'AI High-Five ✋', 'Lava Lamp Logic',
    'Braincell Banger', 'Glitchy Genius', 'Sticker Sheet Thought', 'AOL Away Message', 'Prompt Punk', 'Vibe Vortex', 'LimeWire Download 🚨',
    'T9 Text', 'Space Jam Script', 'Saved Game', 'Beta Byte', 'Jolt Cola Concept ⚡', 'Oregon Trail Moment', 'Lisa Frank Daydream 🦄',
    'Moon Shoes Thought', 'Prom Night Draft', 'Cringe-to-Win Creation', 'ChatRage', 'AI YOLO', 'Magic 8-Bit', 'Internet Relic',
    'Genius Gremlin', 'Roller Riff', 'Thought Thang', 'Mind Skateboard', 'Fanny Pack Find', 'Mall Fountain Monologue', 'Hackstreet Byte',
    'Digital Doodle', 'Icebreaker Entry', 'Roller Rant', 'Prompt Poem', 'Cherry Cola Creation', 'Walkman Wisdom', 'Mind Mood Ring 🌈',
    'Cosmic Bit', 'Algorithmic Bop', 'Party Line Drop', 'Pizza Bagel Theory 🍕🥯', 'Cyber Snack', 'Dial-Up Daydream', 'Keychain Pet Thought',
    'Glitched Glory', 'Digital Mood Swing', 'Ask Jeeves\' Revenge', 'Waffle Cone Wisdom', 'Dreamcast Download', 'Quirky Quip',
    'Matrix Monologue', 'VHS Vibe', 'Screen Name Sparkle ✨', 'Slap Bracelet Take', 'Reality TV Draft', 'Thought Troll Doll',
    'Retro Riff', 'AIM Away Message', 'Bop It Breakdown', 'Mall Kiosk Miracle', 'Calculator Confession', 'Early Internet Energy',
    'Promptcore Drop', 'Zip Drive Download', 'AIZilla Moment 🦖', 'Pogs-Inspired Post', 'Pixel Pal Thought', 'AI in a Bottle 🧞‍♂️',
    'Millennium Mic Drop', 'Hackathon Haiku', 'RAM Rant', 'Y2K Yell', 'Drive-Thru Draft', 'Glitter Pen Letter', 'Phone Cord Revelation',
    'Jetsons Fanfiction ✈️', 'Backstreet Byte', 'Saturday Cartoon Prompt', 'Brick Phone Message 📞', 'Rewind-Worthy', 'Brainstorm Tamagotchi',
    'Game Boy Idea', 'Kazaa Download', 'Magic Marker Take', 'ChatGPT Confessional', 'Legend of the BitBoard 💫', 'Jazzercise Flashback',
    'Secret Sauce 🥫', 'The One With The AI', 'New Bit Who Dis', 'Snack-Sized Spark', 'Byte Me Moment 💻', 'Mom Said It Was Good',
    'The Forbidden Prompt', 'Dial-Up Delight', 'Captain Crunch Thought 🛳️', 'Bootleg Brilliance', 'Word Vomit (but make it art)',
    'Pager Poetry', 'Freakin\' Tidbit™', 'Spice Girl Strategy', 'Recess Revelation', 'Free Trial Feeling', 'Airbrushed Insight',
    'Promposal Prototype', 'Spice Rack Epiphany', 'Zany Brainy Byte 🧠', 'Trapper Keeper Entry', 'Meemageddon', 'Brainstorm Boogie',
    'CD-ROM Rant', 'Channel 3 Discovery', 'Lunch Tray Logic', 'Skate Rink Story', 'AOL Keyword: Bitboard', 'Smells Like Smart Spirit',
    'Cereal Box Essay', '56K Download Speed 🌐', 'Static Shock Thought', 'JNCO-Wide Idea', 'Psychic Hotline Prompt 🔮', 'Capri Sun Wisdom',
    'Glitter Bomb Take', 'Happy Meal Theory', 'Fax Machine Feeling', 'Yassified Rant', 'Lite Brite Brainwave', 'Guess Jeans Draft',
    'Napster Memory', 'The Opposite of Mid', 'TBT Bit', 'Haunted Bitboard', 'TGIF Prompt', 'Brain Freeze Creation', 'Fuzzy TV Channel Spark',
    'Midnight AIM Message', 'Mind Yo-Yo', 'Late Fee Idea', 'Radio Shack Riff', 'Bratz Philosophy', 'Smash Mouth Strategy',
    'The Forbidden Recipe', 'Brainstorm in Zubaz', 'Prompt Gremlin™', 'Scooby-Doo Theory', 'Bubble Tape Rant', 'Brain Bling 💎',
    'Hoverboard Moment', 'Bedazzled Byte', 'The One That Got Typed', 'Hack-and-Cheese Thought 🧀', 'The Final Countdown Take',
    'Brainstorm Barbie 💅', 'Thought Pop Rocks', 'Zzzap Zap Zap!', 'Myspace Monologue', 'The Lost Prompt Scroll',
    'The PowerPoint of Destiny', 'Bitboard Baby One More Time', 'Stretch Armstrong Stretch Idea', 'Cosmic Slime Splatter',
    'GeoCities Gold', 'Ctrl+Alt+Del Revelation', 'Dot Matrix Wisdom', 'YakBak Rant', 'Velcro Vibe', 'Rollercoaster Tycoon Theory',
    'Ghost of Chatrooms Past', 'Prom Queen Thought', 'Mind Mullet Moment', 'Rad-iator Rant', 'VHS-Level Clarity', 'Juice Box Spark',
    'Mood Swing Byte', 'Meme Supreme', 'GigaPet Manifesto', 'The Goonies Gumption', 'Glitch Gremlin Prompt', 'The Clippy Doctrine',
    'Slime Time Spark', 'Saved by the Bell Bit', 'AIM Chain Message', 'Power Ranger Perspective', 'Pizza Party Take', 'AI-r Jordan Thought',
    'VHS Vibe Check', 'Psychic Friend Hotline', 'Scooby Snack Strategy', 'Etch-A-Sketch Blueprint', 'Magic School Bus Memory',
    'Walkie Talkie Take', '80s Montage Draft', 'The Final Form', 'Sparkle Motion', 'Pop Quiz Panic', 'The Thinkinator™',
    'Mario Kart Revelation', 'Speak & Spell Solution', 'Flip Phone Flashback', 'Car Phone Commentary', 'Funky Fresh Fact',
    'The Drama Bit', 'Bling Ring Blueprint 💍', 'Retro Rocket Fuel', 'Cassette Tape Rant', 'Lisa Frank Logic', 'Tamagotchi Prompt',
    'Rewind Rant', 'Mall Madness Moment', 'AI-Tanic Thought', '3AM Sleepover Spark', 'Cringe With Benefits', 'Reality Bites Byte',
    'The Notebook Moment', 'Decoder Ring Message', 'AI Cabbage Patch Creation', 'Slam Book Confession', 'Funkadelic File',
    'Millennium Prompt Panic', 'Fridge Magnet Poetry', 'Vision Board Thought', 'Don\'t @ Me Take', 'Friendster Flashback',
    'Dial Tone Download', 'Pre-GPS Prompt', 'Bingeable Byte', 'MySpace Top 8 Vibes', 'The Spark That Started It All',
    'VHS Tape Truth', 'Polaroid Brainstorm', 'Nap Room Revelation', 'Gusher-Infused Idea', 'AOL Trial CD Inspiration',
    'Poptart Poetry', 'Early Internet Chaos Draft', 'The 404 Thought', 'Neon Sign Signal', 'Homework Hack', 'Magic Marker Manifesto',
    'Scholastic Book Fair Entry', '"Why Not?" Byte', 'Comic Sans Confession', 'Password Journal Prompt', 'Flipbook Fantasy',
    'The AI Saved by the Bell', 'Post-It Philosophy', 'The Forbidden Snack', 'Bit Happens', 'The Zing Zone', 'Quantum Thought Leap',
    'Ctrl+Z Memory', 'Pager Drama', 'The Bit That Bit Back', 'Friendzone Philosophy', 'Y2K Bit Panic', 'In Your Feels',
    'Bit of a Stretch', 'Overcaffeinated Idea ☕', 'Alt-Rock Epiphany', 'AI\'s Lil Secret', 'Old School Cool', 'The Mega Byte',
    'AOL Away Message', 'Rollerblade Rant', 'The Missing No. of Thoughts', 'Retro Ramble', 'TV Guide Theory', 'Downloaded from Limewire',
    'Midnight Snack Thought', 'Garage Band Breakdown', 'Pizza Bagel Prompt', 'The Opposite of Cringe', 'That One Episode',
    'Code Red Chaos', 'High Score Creation', 'Cracked CD Wisdom', 'The Thought Awakens', 'Tony Hawk Trick', 'Rant-a-saurus Rex',
    'Invisible Ink Truth', 'The Deep Cut', 'Waffle House Philosophy', 'Friday Night Lights Idea', 'Flip-Flop Theory',
    'Moonwalk Moment', 'Twilight Zone Take', 'Data Disc Drop', 'Weird Science Spark', 'Stickers on a Trapper Keeper',
    'Something Bit This Way Comes', 'Ringtone Riff', 'Zip Drive Memory', 'Lisa Frank Daydream', 'Brain Drain Delight',
    'Mall Food Court Flash', 'The Thinkinator Returns™', 'Hacky Sack Prompt', 'The Plot Twist', 'VHS Training Montage',
    'Choose Your Own Adventure Ending', 'The After School Special', 'Rewind Worthy', 'Text Me Later Thought', '16-Bit Insight',
    'Burned CD Revelation', 'Forbidden Glitter', 'School Bus Theory', 'Instant Messenger Mood', 'Slow Dance Thought 💃',
    'Walkman Wisdom', 'Lava Lamp Logic', 'Saved Draft Drama', 'Away Message Monologue', 'Dreamcast Download', 'That\'s So Prompt',
    'MySpace Breakup Post', 'Cassette Confession', 'Bumper Sticker Brainwave', 'Honor Roll Hack', 'Home Video Truth',
    'Drive-Thru Epiphany', 'One-Liner Wonder', 'Gummy Bear Rant', 'Glitter Pen Manifesto', 'Keyboard Smash Thought',
    'Folder Full of Fire', 'The Meme Before Memes', 'Daydream Download', 'The Doodle Zone', 'Pre-Filter Creation',
    'Emo Phase Byte', 'Deep Fried Thought', 'Click Wheel Clarity', 'Cyber Monday Memory', 'The Thought Awakens II',
    'Dream Journal Dump', 'Permanent Marker Prompt', 'Banana Seat Brilliance', 'Static Vision', 'CRT Monitor Revelation',
    'The Undownloadable Truth', 'Late Night Infomercial Take', 'Hello Moto Hack', 'T9 Text Theory', 'Cassette Tape Confession',
    'Brainstorm in a Bottle'
  ]

  // ✅ HYDRATION SAFETY: Stable state management
  const [mounted, setMounted] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0) // Start with first word

  // ✅ HYDRATION SAFETY: Set mounted state after client hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ HYDRATION SAFETY: Only start rotation after component is mounted
  useEffect(() => {
    if (!mounted) return

    // ✅ FIXED: Set initial random word only AFTER mounting
    setCurrentWordIndex(Math.floor(safeRandom.number() * words.length))

    const interval = setInterval(() => {
      setCurrentWordIndex(prev => {
        let newIndex
        do {
          newIndex = Math.floor(safeRandom.number() * words.length)
        } while (newIndex === prev && words.length > 1)
        return newIndex
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [mounted, words.length])

  // ✅ HYDRATION SAFETY: Show static fallback during SSR/hydration
  if (!mounted) {
    return (
      <span className="text-brand-blue body-bold transition-all duration-300 font-serif">
        Creation
      </span>
    )
  }

  return (
    <span 
      className="text-brand-blue body-bold transition-all duration-300 font-serif"
      role="text"
      aria-live="polite"
      aria-atomic="true"
    >
      {words[currentWordIndex]}
    </span>
  )
}