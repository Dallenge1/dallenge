import {
  LayoutDashboard,
  Video,
  FileText,
  BrainCircuit,
  HeartPulse,
  Bot,
  ClipboardList,
  Users,
  User,
  Trophy,
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
  { href: '/users/all', label: 'All Users', icon: Users, description: "Browse all users in the community."},
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: "See who's at the top." },
  { href: '/profile', label: 'Profile', icon: User, description: 'Manage your account settings.' },
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
    { id: 3, title: 'Emily White', authorAvatarId: 'user-avatar-4', timestamp: '1 day ago', content: 'I love the logic puzzles in the IQ games section. They are challenging but so rewarding when you solve one.' },
];

export const leaderboardData = [
  { id: 1, rank: 1, name: 'Alex Johnson', points: 15200, avatarId: 'user-avatar-5' },
  { id: 2, rank: 2, name: 'Maria Garcia', points: 14800, avatarId: 'user-avatar-6' },
  { id: 3, rank: 3, name: 'David Smith', points: 14500, avatarId: 'user-avatar-7' },
  { id: 4, rank: 4, name: 'Sophia Wang', points: 13900, avatarId: 'user-avatar-8' },
  { id: 5, rank: 5, name: 'Daniel Kim', points: 13750, avatarId: 'user-avatar-9' },
  { id: 6, rank: 6, name: 'Jane Doe', points: 13200, avatarId: 'user-avatar-2' },
  { id: 7, rank: 7, name: 'John Smith', points: 12800, avatarId: 'user-avatar-3' },
  { id: 8, rank: 8, name: 'Michael Brown', points: 12500, avatarId: 'user-avatar-10' },
  { id: 9, rank: 9, name: 'Emily White', points: 12100, avatarId: 'user-avatar-4' },
  { id: 10, rank: 10, name: 'Chris Lee', points: 11900, avatarId: 'user-avatar-11' },
];
