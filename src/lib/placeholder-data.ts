import {
  LayoutDashboard,
  Video,
  FileText,
  BrainCircuit,
  HeartPulse,
  Bot,
  ClipboardList,
  Users,
} from 'lucide-react';

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: "Get an overview of your activity." },
  { href: '/videos', label: 'Videos', icon: Video, description: "Watch educational videos." },
  { href: '/documents', label: 'Documents', icon: FileText, description: "Access shared documents."},
  { href: '/games', label: 'IQ Games', icon: BrainCircuit, description: "Challenge your cognitive skills." },
  { href: '/bmi-calculator', label: 'BMI Calculator', icon: HeartPulse, description: "Calculate your Body Mass Index."},
  { href: '/personal-trainer', label: 'AI Personal Trainer', icon: Bot, description: "Get AI-powered fitness plans."},
  { href: '/tracking', label: 'Tracking', icon: ClipboardList, description: "Track your diet and exercise."},
  { href: '/feed', label: 'Social Feed', icon: Users, description: "Connect with the community." },
];

export const videoData = [
    { id: 1, title: 'Introduction to Quantum Physics', description: 'A beginner-friendly introduction to the world of quantum mechanics.', author: 'Dr. Quantum', duration: '15:23', imageId: 'video-thumb-1' },
    { id: 2, title: 'The History of Ancient Rome', description: 'Explore the rise and fall of the Roman Empire in this detailed documentary.', author: 'Historia Civilis', duration: '45:10', imageId: 'video-thumb-2' },
    { id: 3, title: 'Mastering Javascript Promises', description: 'A deep dive into asynchronous Javascript and how to use Promises effectively.', author: 'CodeWizard', duration: '25:45', imageId: 'video-thumb-3' },
    { id: 4, title: 'The Art of Mindful Meditation', description: 'Learn techniques for mindfulness and meditation to reduce stress.', author: 'Zen Master', duration: '10:05', imageId: 'video-thumb-4' },
];

export const documentData = [
    { id: 1, title: 'The E-Myth Revisited Summary', category: 'Business', type: 'PDF', dateAdded: '2024-05-10' },
    { id: 2, title: 'Calculus Cheat Sheet', category: 'Mathematics', type: 'PDF', dateAdded: '2024-05-09' },
    { id: 3, title: 'Project Proposal Template', category: 'Templates', type: 'DOCX', dateAdded: '2024-05-08' },
    { id: 4, title: 'Marketing Strategy 2024', category: 'Business', type: 'PPTX', dateAdded: '2024-05-07' },
    { id: 5, title: 'General Relativity Lecture Notes', category: 'Physics', type: 'PDF', dateAdded: '2024-05-06' },
];

export const gameData = [
    { id: 1, title: 'Memory Lane', description: 'Test your short-term memory by matching pairs of cards.', imageId: 'game-thumb-1' },
    { id: 2, title: 'Pattern Recognition', description: 'Identify the next sequence in a complex pattern. A true test of logic.', imageId: 'game-thumb-2' },
    { id: 3, title: 'Logic Grid Puzzles', description: 'Solve intricate logic puzzles to find the correct solution from given clues.', imageId: 'game-thumb-3' },
];

export const socialFeedData = [
    { id: 1, authorName: 'Jane Doe', authorAvatarId: 'user-avatar-2', timestamp: '2 hours ago', content: 'Just finished the intro to Quantum Physics video! Mind-blowing stuff. Can anyone recommend further reading?' },
    { id: 2, authorName: 'John Smith', authorAvatarId: 'user-avatar-3', timestamp: '5 hours ago', content: 'Hit a new personal best on my 5k run today! The AI trainer plan is really paying off. #fitness #goals' },
    { id: 3, authorName: 'Emily White', authorAvatarId: 'user-avatar-4', timestamp: '1 day ago', content: 'I love the logic puzzles in the IQ games section. They are challenging but so rewarding when you solve one.' },
];
