// scripts/populate-usernames.js
// Run this script to populate the username pool

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Your 300 nostalgic usernames
const baseUsernames = [
  '90210fan', '90sCartoon', '90sNick', '98SecondEd', 'AbbeyRoadie', 'Abercrombie', 'Aeropostale', 'AIMaway', 'AIMstatus', 'AllThat',
  'AngryBeav', 'Animaniac', 'Animorphs', 'AOL', 'AOLBuddy', 'AOLDial', 'ArcadeCab', 'ArcadeHero', 'ArcadeRat', 'ArcadeToken',
  'AreYouAfraid', 'Atari', 'AtariWizard', 'ATeam', 'AuntViv', 'AwayMsg', 'BabsBunny', 'BabysitterClub', 'BagelBite', 'BartDude',
  'BaysideTiger', 'Baywatch', 'BeanieBaby', 'BeeperKing', 'BeKindRewind', 'BelAirLife', 'BellBottoms', 'BenderBot', 'BillieJean', 'Blockbuster',
  'Blogger', 'Blogroll', 'BonusLife', 'BonusRound', 'BonusStage', 'BoogieDown', 'BoogieJam', 'BoogieNights', 'BoogieShoes', 'BoomBox',
  'BoomboxHero', 'BopIt', 'BossLevel', 'BossRush', 'BoyBand', 'BradyBunch', 'BreakfastClub', 'Broadband', 'BucketHat', 'BuddyIcon',
  'Bueller', 'Bugles', 'BusyTone', 'ButterflyClip', 'CandyLand', 'CapriSun', 'CareBear', 'CarltonDance', 'CarmenSandiego', 'CartridgeBlow',
  'CartridgeJam', 'CassetteDeck', 'CassetteMix', 'CatDogged', 'CatScratch', 'CDPlayerX', 'ChainWallet', 'Cheetos', 'ChesterMode', 'ChiliPepper',
  'CircuitCity', 'ClueMaster', 'CompUSA', 'ConnectFour', 'CourageDog', 'CourageWolf', 'CreepyCrawly', 'CRTVision', 'CrystalPepsi', 'CyndiFun',
  'DanceFloor', 'DancePadder', 'DannyPhant', 'DawsonCreek', 'DawsonDrama', 'DenimJacket', 'DexterLab', 'DialTone', 'DiscmanDude', 'DiscoBall',
  'DonkeyByte', 'DoorsOpen', 'DoritosCool', 'DoubleDare', 'DougFunny', 'Dreamcast', 'DSL', 'DuckHunt', 'DuckTales', 'Dunkaroos',
  'DVDplayer', 'Earthlink', 'EasyBake', 'EasyMac', 'EdEddnEddy', 'EjectDisc', 'ExtraLife', 'FairlyOdd', 'FamilyMatters', 'FamilyTies',
  'FannyPack', 'FerrisDay', 'Flintstones', 'FosterFriends', 'FreshPrince', 'FriendsFan', 'Friendster', 'FroggerHop', 'FruitByFoot', 'FruitGushers',
  'FryFuture', 'FullHouse', 'FunkSoul', 'FunkyFresh', 'FunkyTown', 'Funyun', 'FurbyTime', 'FuturamaX', 'Galaga', 'GameBoyz',
  'GameCube', 'GameLink', 'GameOfLife', 'GamePak', 'Ghostbusters', 'GigaPet', 'GilmoreFan', 'GlowNecklace', 'GlowPaint', 'GlowStick',
  'GoldfishSnack', 'Goosebumps', 'GooseFan', 'GooseReader', 'GreaseLightning', 'GuessWho', 'HackySack', 'HamsterDance', 'HappyDays', 'HeyArnold',
  'HiCjuice', 'HiddenTemple', 'HighScore', 'Hollister', 'HomerTime', 'Hotmail', 'HotTopic', 'HotTopicScene', 'HoundDog', 'InsertCoin',
  'InsertDisc', 'JamesBrownie', 'JengaJam', 'Jetsons', 'JNCOjeans', 'JoeyCutItOut', 'JohnnyBravo', 'KangolHat', 'KarateKid', 'KITTcar',
  'KnightRider', 'KoolAid', 'Kramerica', 'LavaLamp', 'LeatherStud', 'LegendsTemple', 'LegWarmers', 'LimeWire', 'LisaFrank', 'LisaTurtle',
  'LiteBrite', 'LiveJournal', 'LoadingBar', 'LoadingNoise', 'LoadScreen', 'LooneyTune', 'LoveShack', 'LuigiMansion', 'Lunchables', 'MagicSchool',
  'MagnumStache', 'MallHair', 'MallMadness', 'MallRat', 'MarioKarted', 'MarioSunshine', 'MartyMcFly', 'MetroidPrime', 'MiamiVice', 'MiniDisc',
  'MixTape', 'MixtapeGal', 'MixtapeMan', 'Miyagi', 'MMMBop', 'MojoJojo', 'MonopolyBank', 'MoodNecklace', 'MoodRing', 'MoonShoes',
  'MorkMindy', 'MouseTrap', 'MSNbutterfly', 'MSNMessenger', 'MSNstatus', 'MTV', 'MustachePencil', 'MySpaceHTML', 'MySpaceTop8', 'N64',
  'Napster', 'Neopet', 'NeopetFan', 'NeopetMall', 'NESMaster', 'Netscape', 'NetscapeGold', 'Netsurf', 'NetZero', 'NewCoke',
  'NickArcade', 'Nickelodeon', 'NickGuts', 'OperationBuzz', 'OrangeJulius', 'OregonTrail', 'OreosRule', 'PacManiac', 'PagerBuzz', 'PeanutButter',
  'PepsiBlue', 'PinkyBrain', 'PixelBoss', 'PixelNinja', 'PixelPerfect', 'PixelPunk', 'PizzaRolls', 'PlaidPunk', 'PlatformShoe', 'PluckyDuck',
  'PogsRule', 'PollyPocket', 'PongChamp', 'PongMaster', 'PongWizard', 'PopLock', 'PopPunk', 'PopRocks', 'PopTarted', 'PoundPuppy',
  'PowerPuff', 'PringlesCan', 'ProdigyNet', 'RadioStar', 'RageAgainst', 'Ramen', 'RapBattle', 'RapLyric', 'REMstart', 'Ripley',
  'RiskyBiz', 'RockyBalboa', 'Rollerblade', 'RollerBoogie', 'RollerRink', 'RollerTycoon', 'Rubiks', 'RugratsRule', 'SabrinaTeen', 'SailorMoon',
  'SaturdayFever', 'SaturdayNight', 'SavedBell', 'Scooby', 'ScoobySnack', 'Screech', 'ScreenName', 'SegaStar', 'SeinfeldTime', 'SerenaMoon',
  'SheRa', 'ShineCrazy', 'SimonGame', 'SimonSays', 'SimpsonsFan', 'SkateJam', 'SkatePark', 'SkateShoes', 'SkipBo', 'SkipIt',
  'SkittlesRain', 'SlapBrace', 'SlaterTime', 'SmashingPump', 'Snapback', 'SNESFan', 'SonicSpin', 'SonyDiscman', 'SorryBoard', 'SpaceInvader',
  'SpaceRace', 'SprayCan', 'SprayPaint', 'StarWars', 'StayinAlive', 'StayPuft', 'StepByStep', 'StonesRoll', 'SummerOf69', 'SunnyDtime',
  'SweetValley', 'SylvesterX', 'Tamagotchi', 'TaxiDriver', 'TeddyBear', 'TeddyGrahams', 'TeddyRuxpin', 'TetrisMaster', 'ThreeCompany', 'TieDye',
  'TieDyeJam', 'TimmyTurn', 'TinyToon', 'Toonami', 'Tooniverse', 'ToonTownie', 'ToonVibe', 'ToonWorld', 'TrapperKeeper', 'TrivialPursuit',
  'TRL', 'TroublePop', 'TruckerHat', 'TubeScreen', 'TweetyBirdy', 'UggBoots', 'UncleJesse', 'UnclePhil', 'Uno', 'Velcro',
  'VH1rules', 'VHSMode', 'VHSRewind', 'VHSstack', 'VideoKilled', 'ViewMaster', 'Walkman', 'WalkmanWave', 'WallArt', 'WebRing',
  'WebShooter', 'WelcomeBack', 'WideCollar', 'Win95Fan', 'WinAmp', 'WonderToon', 'Woodstock', 'XboxLive', 'XFiles', 'YahooChat',
  'YahooMail', 'YahooPager', 'Yahtzee', 'YooHoo', 'ZeldaQuest', 'ZeldaWind', 'Zoey101'
];

console.log(`Total usernames: ${baseUsernames.length}`);

async function populateUsernamePool() {
  console.log('Populating username pool...');
  
  // Create batches of usernames
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < baseUsernames.length; i += batchSize) {
    batches.push(baseUsernames.slice(i, i + batchSize));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = Math.floor(batchIndex * batchSize / 500) + 1;
    
    const usernameData = batch.map(username => ({
      username,
      batch_number: batchNumber
    }));
    
    const { error } = await supabase
      .from('username_pool')
      .insert(usernameData);
    
    if (error) {
      console.error(`Error inserting batch ${batchIndex + 1}:`, error);
    } else {
      console.log(`Inserted batch ${batchIndex + 1}/${batches.length}`);
    }
  }
  
  console.log('Username pool populated successfully!');
}

// Run the script
populateUsernamePool().catch(console.error);