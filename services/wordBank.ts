
export interface CategoryMap {
  [key: string]: string[];
}

export const WORD_BANK: CategoryMap = {
  "Kitchen": [
    "Toaster", "Blender", "Refrigerator", "Microwave", "Dishwasher", "Oven", "Kettle", "Spatula", 
    "Frying Pan", "Knife Block", "Cutting Board", "Sink", "Coffee Maker", "Spice Rack"
  ],
  "School": [
    "Blackboard", "Chalk", "Desk", "Textbook", "Backpack", "Pencil Case", "Teacher", "Principal", 
    "Homework", "Recess", "Library", "Cafeteria", "Gymnasium", "School Bus"
  ],
  "Beach": [
    "Sandcastle", "Sunscreen", "Surfboard", "Towel", "Umbrella", "Seagull", "Crab", "Ocean", 
    "Lifeguard", "Volleyball", "Ice Cream", "Flip Flops", "Shell", "Bucket"
  ],
  "Space": [
    "Astronaut", "Rocket", "Moon", "Sun", "Black Hole", "Satellite", "Meteor", "Alien", 
    "Spacesuit", "Telescope", "Galaxy", "Mars", "Space Station", "Gravity"
  ],
  "Hospital": [
    "Doctor", "Nurse", "Stethoscope", "Wheelchair", "Ambulance", "Bandage", "Syringe", "X-Ray", 
    "Patient", "Surgery", "Waiting Room", "Thermometer", "Crutches", "Medicine"
  ],
  "Cinema": [
    "Popcorn", "Ticket", "Screen", "Projector", "3D Glasses", "Seat", "Trailer", "Actor", 
    "Director", "Usher", "Soda", "Candy", "Credits", "Red Carpet"
  ],
  "Supermarket": [
    "Trolley", "Cashier", "Barcode Scanner", "Vegetables", "Freezer", "Receipt", "Basket", 
    "Aisle", "Checkout", "Paper Bag", "Discount", "Shelf", "Dairy", "Bakery"
  ],
  "Pirate Ship": [
    "Captain", "Parrot", "Treasure Chest", "Map", "Cannon", "Anchor", "Sail", "Eye Patch", 
    "Peg Leg", "Sword", "Skull Flag", "Barrel", "Compass", "Plank"
  ],
  "Zoo": [
    "Lion", "Giraffe", "Elephant", "Penguin", "Zookeeper", "Cage", "Ticket Booth", "Monkey", 
    "Snake", "Map", "Souvenir Shop", "Bear", "Zebra", "Fence"
  ],
  "Airport": [
    "Passport", "Suitcase", "Pilot", "Stewardess", "Security Check", "Runway", "Ticket", 
    "Boarding Pass", "Duty Free", "Luggage Belt", "Gate", "Airplane", "Control Tower"
  ]
};

export const getRandomLocalWord = (specificCategory?: string) => {
  const categories = Object.keys(WORD_BANK);
  let category = specificCategory;

  if (!category || !WORD_BANK[category]) {
    category = categories[Math.floor(Math.random() * categories.length)];
  }

  const words = WORD_BANK[category];
  const word = words[Math.floor(Math.random() * words.length)];

  return { category, word };
};
