const pseudonymNouns = [
  'Iris',
  'Trillium',
  'Lamium',
  'Snowdrop',
  'Snapdragon',
  'Scilla',
  'Scylla',
  'Hawthorn',
  'Violet',
  'Poppy',
  'Clover',
  'Ipomoea',
  'Lily',
  'Jupiter',
  'Neptune',
  'Saturn',
  'Mars',
  'Venus',
  'Sirius',
  'Betelgeuse',
  'Pollux',
  'Vega',
  'Lyra',
  'Pegasus',
  'Delphinus',
  'Orion',
  'Hydra',
  'Columba',
  'Aeolus',
  'Alastor',
  'Apollo',
  'Atlas',
  'Attis',
  'Castor',
  'Cerus',
  'Charon',
  'Cronos',
  'Crios',
  'Cronus',
  'Dionysus',
  'Erebus',
  'Helios',
  'Heracles',
  'Hermes',
  'Hypnos',
  'Kratos',
  'Morpheus',
  'Oceanus',
  'Pallas',
  'Plutus',
  'Pontus',
  'Poseidon',
  'Tartarus',
  'Triton',
  'Epona',
  'Luna',
  'Moon',
  'Baldur',
  'Aloe',
  'Agave',
  'Calamus',
  'Calathea',
  'Juniper',
  'Dahlia',
  'Opal',
  'Echeveria',
  'Hemlock',
  'Cyprus',
  'Gardenia',
  'Phlox',
  'Pieris',
  'Kohlrabi',
  'Larch',
  'Liatris',
  'Lupine',
  'Lychee',
  'Nigella',
  'Melia',
  'Tank',
  'Orchid',
  'Caudex',
  'Codex',
  'Pepper',
  'Pagoda',
  'Pilea',
  'Jasmine',
  'Quill',
  'Plumbago',
  'Sumac',
  'Privet',
  'Rockrose',
  'Birch',
  'Anemone',
  'Crocus',
  'Shamrock',
  'Ginger',
  'Stargazer',
  'Woodruff',
  'Sycamore',
  'Tatsoi',
  'Tupelo',
  'Verbena',
  'Yarrow',
  'Yew',
  'Popstar',
  'Saffron',
  'Boromir',
  'Galadriel',
  'Legolas',
  'Kite',
  'Star',
  'Cactus',
  'Architect',
  'Parsnip',
  'Dragonfly',
  'Moth',
  'Camel',
  'Horse',
  'Kitten',
  'Elephant',
  'Basilisk',
  'Lichen',
  'Jasper',
  'Agate',
  'Oak',
  'Maple',
  'Seahorse',
  'Urchin',
  'Dinosaur',
  'King',
  'Caz',
  'Sushi',
  'Parallelogram',
  'Tomato',
  'Sunflower',
  'Pancake',
  'Orb',
  'Muffin',
  'Potato',
  'Rabbit',
  'Fox',
  'Turtle',
  'Hare',
  'Sphinx',
  'Lynx',
  'Bobcat',
  'Squirrel',
  'Grape',
  'Raspberry',
  'Painter',
  'Geographer',
  'Deer',
  'Detective',
  'Flame',
  'Frond',
  'Alien',
  'Dancer',
  'Alligator',
  'Pike',
  'Angelfish',
  'Carp',
  'Shark',
  'Batfish',
  'Blenny',
  'Monarch',
  'Salmon',
  'Wrasse',
  'Trout',
  'Dogfish',
  'Grouper',
  'Stingray',
  'Lamprey',
  'Tetra',
  'Marlin',
  'Danio',
  'Ray',
  'Goby',
  'Snapper',
  'Stonefish',
  'Tadpole',
  'Zebra',
  'Impala',
  'Hyena',
  'Ostrich',
  'Lion',
  'Leopard',
  'Panther',
  'Cheetah',
  'Finch',
  'Crocodile',
  'Beluga',
  'Tern',
  'Whale',
  'Wolf',
  'Eagle',
  'Caribou',
  'Orca',
  'Moose',
  'Ox',
  'Seal',
  'Puffin',
  'Wolverine',
  'Ptarmigan',
  'Sheep',
  'Ermine',
  'Lemming',
  'Walrus',
  'Owl',
  'Falcon',
  'Dragon',
  'Fairy',
  'Bandit',
  'Albatross',
  'Auklet',
  'Blackbird',
  'Bluebird',
  'Bunting',
  'Chickadee',
  'Cormorant',
  'Crow',
  'Dove',
  'Egret',
  'Grackle',
  'Gull',
  'Hawk',
  'Heron',
  'Hummingbird',
  'Ibis',
  'Loon',
  'Oriole',
  'Pelican',
  'Plover',
  'Raven',
  'Starling',
  'Tern',
  'Warbler',
  'Woodpecker',
  'Wren',
  'Engineer',
  'Octopus',
  'Kelpie',
  'Selkie',
  'Horus',
  'Griffin',
  'Callisto',
  'Tiger',
  'Yeti',
  'Jackalope',
  'Python',
  'Galatea',
  'Nephele',
  'Medusa',
  'Genie',
  'Leprechaun',
  'Deity',
  'Gremlin',
  'Elf',
  'Yokai',
  'Valkyrie',
  'Zaratan',
  'Bunyip',
  'Triton',
  'Unicorn',
  'Nixie',
  'Mugwump',
  'Monk',
  'Phoenix',
  'Mandrake',
  'Dryad',
  'Sprite',
  'Triffid',
  'Treant',
  'Obliviax',
  'Piranha',
  'Barnacle',
  'Lotus',
  'Amarok',
  'Anubis',
  'Arion',
  'Asrai',
  'Avalerion',
  'Buraq',
  'Baku',
  'Centaur',
  'Ceto',
  'Damysus',
  'Diomedes',
  'Taraxippi',
  'Pegasus',
  'Crane',
  'Nightingale',
  'Argos',
  'Minotaur',
  'Lamia',
  'Seraph',
  'Werecat',
  'Merlion',
  'Broccoli',
  'Endive',
  'Toucan',
  'Tapir',
  'Marmoset',
  'Iguana',
  'Lemur',
  'Gecko',
  'Cottontail',
  'Cephalopod',
  'Nautilus',
  'Ammonite',
  'Belemnite',
  'Cuttlefish',
  'Arthropod',
  'Invertebrate',
  'Protist',
  'Mollusk',
  'Puma',
  'Orangutan',
  'Jellyfish',
  'Starfish',
  'Adonis',
  'Bacchus',
  'Odin',
  'Osiris',
  'Bastet',
  'Aardvark',
  'Badger',
  'Bandicoot',
  'Binturong',
  'Bilby',
  'Caracal',
  'Capybara',
  'Cougar',
  'Cricket',
  'Firefly',
  'Dingo',
  'Hedgehog',
  'Hyena',
  'Jerboa',
  'Jaguar',
  'Kangaroo',
  'Koala',
  'Mink',
  'Armadillo',
  'Ocelot',
  'Platypus',
  'Quoll',
  'Raccoon',
  'Scorpion',
  'Loris',
  'Bear',
  'Glider',
  'Wombat',
  'Petrel',
  'Kestrel',
  'Operator',
  'Orator',
  'Author',
  'Babbler',
  'Composer',
  'Crooner',
  'Hacker',
  'Observer',
  'Oversleeper',
  'Summarizer',
  'Verbalizer',
  'Systemizer',
  'Watcher',
  'Pontificator',
  'Rhetorician',
  'Lector',
  'Scholar',
  'Editor',
  'Copywriter',
  'Negotiator',
  'Commentator',
  'Logician',
  'Scientist',
  'Philosopher',
  'Lawyer',
  'Artist',
  'Writer',
  'Thinker',
  'Tinkerer',
  'Robot',
  'Automaton',
  'Android',
  'Cyborg',
  'Caterpillar',
  'Biscuit',
  'Crumpet',
  'Foxhound',
  'Barbet',
  'Collie',
  'Shepherd',
  'Dalmatian',
  'Traveler',
  'Character'
]
const pseudonymAdjectives = [
  'Noble',
  'Urgent',
  'Ferric',
  'Symphonic',
  'Celestial',
  'Scarlet',
  'Funky',
  'Crimson',
  'Alabaster',
  'Amethyst',
  'Antique',
  'Aquamarine',
  'Atomic',
  'Auburn',
  'Azure',
  'Blue',
  'Celadon',
  'Cinnamon',
  'Citrine',
  'Citron',
  'Cobalt',
  'Cosmic',
  'Eerie',
  'Fiery',
  'Glossy',
  'Irresistable',
  'Mystic',
  'Olivine',
  'Majestic',
  'Purple',
  'Red',
  'Colorful',
  'Bountiful',
  'Truthful',
  'Fanciful',
  'Graceful',
  'Mirthful',
  'Artful',
  'Willful',
  'Mindful',
  'Scientific',
  'Magical',
  'Systematic',
  'Artistic',
  'Academic',
  'Magnetic',
  'Symbolic',
  'Atmospheric',
  'Catalytic',
  'Embryonic',
  'Mythic',
  'Telescopic',
  'Meteoric',
  'Telepathic',
  'Dendritic',
  'Dualistic',
  'Radiographic',
  'Diachronic',
  'Eidetic',
  'Honorific',
  'Pharonic',
  'Virtuosic',
  'Astronomic',
  'Heroic',
  'Algorithmic',
  'Telephonic',
  'Galvanic',
  'Diatomic',
  'Beatific',
  'Shamanic',
  'Bionic',
  'Cherubic',
  'Nomic',
  'Galactic',
  'Prolific',
  'Poetic',
  'Dynamic',
  'Historic',
  'Terrific',
  'Geometric',
  'Monastic',
  'Emphatic',
  'Melodic',
  'Nordic',
  'Angelic',
  'Biotic',
  'Iconoclastic',
  'Totemic',
  'Mercuric',
  'Modern',
  'Spry',
  'Serpentine',
  'Singing',
  'Gold',
  'Golden',
  'Silver',
  'Platinum',
  'Bronze',
  'Turquoise',
  'Metallic',
  'Epiphanic',
  'Indulgent',
  'Immense',
  'Rough',
  'Horizontal',
  'Cartesian',
  'Cerebral',
  'Meaningful',
  'Translucent',
  'Opaque',
  'Transparent',
  'Extravagant',
  'Serious',
  'Multispectral',
  'Spherical',
  'Smooth',
  'Deep',
  'Wise',
  'Velvety',
  'Calm',
  'Smoky',
  'Rhythmic',
  'Massive',
  'Evolving',
  'Dazzling',
  'Pure',
  'Pink',
  'Enhanced',
  'Halcyon',
  'Fancy',
  'Alpine',
  'Arctic',
  'Abiotic',
  'Active',
  'Adaptive',
  'Aerobic',
  'Archaeic',
  'Artificial',
  'Basal',
  'Adventive',
  'Aerial',
  'Autumnal',
  'Festive',
  'Shiny',
  'Reflective',
  'Toothy',
  'Watchful',
  'Helpful',
  'Tasteful',
  'Skillful',
  'Jolly',
  'Jovial',
  'Merry',
  'Chirpy',
  'Sportive',
  'Jubilant',
  'Convivial',
  'Chipper',
  'Upbeat',
  'Bright',
  'Rosy',
  'Blithe',
  'Crested',
  'Precise',
  'Amiable',
  'Courageous',
  'Courteous',
  'Diligent',
  'Generous',
  'Intuitive',
  'Inventive',
  'Persistent',
  'Practical',
  'Dexterous',
  'Aristotelian',
  'Epicurean',
  'Mosaic',
  'Ambitious',
  'Articulate',
  'Audacious',
  'Brave',
  'Charming',
  'Confident',
  'Curious',
  'Dignified',
  'Elusive',
  'Feisty',
  'Honest',
  'Noble',
  'Regal',
  'Perceptive',
  'Authentic',
  'Candid',
  'Expressive',
  'Intentional',
  'Lively',
  'Orange',
  'Magenta',
  'Green',
  'Dusky',
  'Numinous',
  'Freshwater',
  'Sweet',
  'Wild',
  'Special',
  'Eternal',
  'Steely',
  'Courtly',
  'Stately',
  'Curly',
  'Wooly',
  'Worldly',
  'Heavenly',
  'Proactive',
  'Crafty',
  'Craftiest',
  'Drowsy',
  'Coy',
  'Edgy',
  'Pithy',
  'Chatty',
  'Saintly',
  'Hunky',
  'Hunkier',
  'Minor',
  'Major',
  'Radioactive',
  'Strange',
  'Glamorous',
  'Strategic',
  'Synthetic',
  'Showy',
  'Precious',
  'Tough',
  'Volcanic',
  'Crystalline',
  'Iridescent',
  'Inorganic',
  'Common',
  'Rare',
  'Essential',
  'Specialized',
  'Complex',
  'Terrestrial',
  'Refined',
  'Tenacious',
  'Foliated',
  'Teumessian',
  'Dark',
  'Marbled',
  'Silky',
  'Shaded',
  'Speckled',
  'Stellate',
  'Taoist',
  'Devoted',
  'Tender',
  'Loyal',
  'Amorous',
  'Zealous',
  'Friendly',
  'Factual',
  'Genuine',
  'Sincere',
  'Reliable',
  'Forthright',
  'Honorable',
  'Sneaky',
  'Sly',
  'Wily',
  'Earnest',
  'Observant',
  'Invincible',
  'Scrupulous',
  'Tricky',
  'Eager',
  'Efficient',
  'Enchanting',
  'Humble',
  'Diplomatic',
  'Creative',
  'Lustrous',
  'Elegant',
  'Vibrant',
  'Resourceful',
  'Gentle',
  'Clever',
  'Faithful',
  'Patient',
  'Bold',
  'Cheeky',
  'Dapper',
  'Fierce',
  'Futuristic',
  'Gallant',
  'Graceful',
  'Joyful',
  'Mystical',
  'Ineffable',
  'Visionary',
  'Wizardly',
  'Dutiful',
  'Lawful',
  'Orderly',
  'Virtuous',
  'Obedient',
  'Duteous',
  'Talkative',
  'Intelligent',
  'Shrewd',
  'Savvy',
  'Perceptive',
  'Stylish',
  'Debonair',
  'Nifty',
  'Trendy',
  'Fashionable',
  'Jaunty',
  'Spirited',
  'Droll',
  'Astute',
  'Brainy',
  'Sensible',
  'Witty',
  'Scholarly',
  'Cultured',
  'Studious',
  'Dreamy',
  'Pithy',
  'Wistful',
  'Impish',
  'Jaunty',
  'Chic',
  'Saucy',
  'Classy',
  'Delicate',
  'Exquisite',
  'Spiffy',
  'Posh',
  'Mellow',
  'Knowing',
  'Savvy',
  'Endearing',
  'Alluring',
  'Intriguing',
  'Bewitching',
  'Lovable',
  'Engaging',
  'Ravishing',
  'Riveting',
  'Charismatic',
  'Quirky',
  'Royal',
  'Nocturnal',
  'Paradoxical',
  'Hypothetical',
  'Rhetorical',
  'Baffling',
  'Harsh',
  'Spectacular',
  'Reclusive',
  'Mechanical',
  'Furious',
  'Mysterious',
  'Bizarre',
  'Universal',
  'Shadowy',
  'Arboreal',
  'Articulate',
  'Tolerant',
  'Tactful',
  'Insightful',
  'Corporate',
  'Peaceful',
  'Legal',
  'Brilliant',
  'Classic',
  'Classical',
  'Ideal',
  'Typical',
  'Outrageous',
  'Resolute',
  'Fearless',
  'Valiant',
  'Intrepid',
  'Notorious',
  'Wicked',
  'Shady',
  'Groovy',
  'Naughty',
  'Probable',
  'Mathematical',
  'Logical',
  'Literary',
  'Aesthetic',
  'Absolute',
  'Altruistic',
  'Accidental',
  'Agnostic',
  'Experimental',
  'Expressive',
  'Hedonic',
  'Legendary',
  'Marvelous',
  'Enthusiastic',
  'Remarkable',
  'Characteristic',
  'Innocent',
  'Rhapsodic',
  'Ecstatic',
  'Elated',
  'Ordinary'
]

module.exports = {
  pseudonymNouns,
  pseudonymAdjectives
}
