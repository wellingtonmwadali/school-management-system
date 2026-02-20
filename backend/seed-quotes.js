// Seed script to populate inspiring quotes for the dashboard
const mongoose = require('mongoose');
require('dotenv').config();

const quoteSchema = new mongoose.Schema({
  text: String,
  author: String,
  category: String,
  isActive: Boolean,
}, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);

const quotes = [
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "education",
    isActive: true
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "education",
    isActive: true
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success",
    isActive: true
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation",
    isActive: true
  },
  {
    text: "Excellence is not a skill, it's an attitude.",
    author: "Ralph Marston",
    category: "success",
    isActive: true
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    category: "motivation",
    isActive: true
  },
  {
    text: "Leadership is not about being in charge. It's about taking care of those in your charge.",
    author: "Simon Sinek",
    category: "leadership",
    isActive: true
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "motivation",
    isActive: true
  },
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey",
    category: "education",
    isActive: true
  },
  {
    text: "Intelligence plus character—that is the goal of true education.",
    author: "Martin Luther King Jr.",
    category: "education",
    isActive: true
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "motivation",
    isActive: true
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "motivation",
    isActive: true
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "success",
    isActive: true
  },
  {
    text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.",
    author: "Albert Einstein",
    category: "wisdom",
    isActive: true
  },
  {
    text: "A person who never made a mistake never tried anything new.",
    author: "Albert Einstein",
    category: "wisdom",
    isActive: true
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
    category: "education",
    isActive: true
  },
  {
    text: "Your attitude, not your aptitude, will determine your altitude.",
    author: "Zig Ziglar",
    category: "success",
    isActive: true
  },
  {
    text: "Teaching is the one profession that creates all other professions.",
    author: "Unknown",
    category: "education",
    isActive: true
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    category: "education",
    isActive: true
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "motivation",
    isActive: true
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "wisdom",
    isActive: true
  },
  {
    text: "In learning you will teach, and in teaching you will learn.",
    author: "Phil Collins",
    category: "education",
    isActive: true
  },
  {
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
    category: "education",
    isActive: true
  },
  {
    text: "What we learn with pleasure we never forget.",
    author: "Alfred Mercier",
    category: "education",
    isActive: true
  },
  {
    text: "Knowledge is power. Information is liberating.",
    author: "Kofi Annan",
    category: "education",
    isActive: true
  }
];

async function seedQuotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-erp');
    console.log('Connected to MongoDB');

    // Clear existing quotes
    await Quote.deleteMany({});
    console.log('Cleared existing quotes');

    // Insert new quotes
    const result = await Quote.insertMany(quotes);
    console.log(`Successfully seeded ${result.length} quotes`);

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding quotes:', error);
    process.exit(1);
  }
}

seedQuotes();
