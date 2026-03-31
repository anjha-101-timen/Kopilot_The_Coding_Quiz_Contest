import { setPillStatus } from "../shared/ui.js";

const el = (id) => document.getElementById(id);

const PLATFORM_FEATURES_100 = [
  { icon: "🚀", title: "Lightning Quizzes", desc: "Rapid-fire coding MCQs for instant practice.", tags: ["Quizzes", "Fast"] },
  { icon: "⚡", title: "Live Contests", desc: "Compete in real-time with coders worldwide.", tags: ["Contests", "Live"] },
  { icon: "🏆", title: "Leaderboard", desc: "Climb ranks and showcase your coding prowess.", tags: ["Ranking", "CP"] },
  { icon: "�", title: "Performance Analytics", desc: "Deep insights into your strengths and weaknesses.", tags: ["Analytics", "Stats"] },
  { icon: "�", title: "Targeted Practice", desc: "Focus on specific topics and master them.", tags: ["Practice", "Topics"] },
  { icon: "💎", title: "Premium Packs", desc: "Exclusive question packs for top companies.", tags: ["Premium", "Companies"] },
  { icon: "�", title: "Streak System", desc: "Maintain daily streaks and earn bonus CP.", tags: ["Gamification", "Rewards"] },
  { icon: "🌟", title: "Achievement Badges", desc: "Unlock badges for milestones and skills.", tags: ["Achievements", "Rewards"] },
  { icon: "📈", title: "Progress Tracking", desc: "Visualize your learning journey over time.", tags: ["Progress", "Visualization"] },
  { icon: "�", title: "Battle Mode", desc: "Head-to-head coding battles with friends.", tags: ["Multiplayer", "Battles"] },
  { icon: "📚", title: "Topic Library", desc: "Comprehensive collection of coding topics.", tags: ["Library", "Topics"] },
  { icon: "🔍", title: "Smart Search", desc: "Find questions by topic, difficulty, or company.", tags: ["Search", "Discovery"] },
  { icon: "⏰", title: "Timed Challenges", desc: "Race against the clock in timed quizzes.", tags: ["Timer", "Speed"] },
  { icon: "�", title: "Weekly Tournaments", desc: "Compete in themed weekly events.", tags: ["Events", "Tournaments"] },
  { icon: "�", title: "Certificate System", desc: "Earn certificates for completing milestones.", tags: ["Certificates", "Credentials"] },
  { icon: "📱", title: "Mobile Optimized", desc: "Practice seamlessly on any device.", tags: ["Mobile", "Responsive"] },
  { icon: "�", title: "Global Community", desc: "Connect with coders from around the world.", tags: ["Community", "Social"] },
  { icon: "💡", title: "Hint System", desc: "Get intelligent hints when stuck.", tags: ["Learning", "Support"] },
  { icon: "�", title: "Dark Mode", desc: "Comfortable coding in any lighting.", tags: ["UI", "Accessibility"] },
  { icon: "🔐", title: "Secure Profiles", desc: "Keep your progress safe and private.", tags: ["Security", "Privacy"] },
  { icon: "�", title: "Detailed Solutions", desc: "Learn with comprehensive explanations.", tags: ["Learning", "Solutions"] },
  { icon: "🎯", title: "Difficulty Levels", desc: "From beginner to expert challenges.", tags: ["Difficulty", "Levels"] },
  { icon: "🔄", title: "Reattempt Feature", desc: "Practice until you perfect each concept.", tags: ["Practice", "Mastery"] },
  { icon: "�", title: "Score Breakdown", desc: "Understand where you lost points.", tags: ["Analytics", "Feedback"] },
  { icon: "🎪", title: "Custom Contests", desc: "Create and host your own contests.", tags: ["Create", "Custom"] },
  { icon: "⚙️", title: "Adaptive Learning", desc: "AI adjusts difficulty based on performance.", tags: ["AI", "Personalization"] },
  { icon: "�", title: "Hall of Fame", desc: "Permanent recognition for top performers.", tags: ["Recognition", "Elite"] },
  { icon: "📈", title: "Skill Radar", desc: "Visual map of your coding skills.", tags: ["Visualization", "Skills"] },
  { icon: "�", title: "Quick Play", desc: "Jump into random challenges instantly.", tags: ["Quick", "Casual"] },
  { icon: "�", title: "Mentorship Program", desc: "Learn from experienced coders.", tags: ["Mentorship", "Learning"] },
  { icon: "📚", title: "Study Groups", desc: "Form groups and practice together.", tags: ["Social", "Collaboration"] },
  { icon: "�", title: "Power-ups", desc: "Special abilities to boost your scores.", tags: ["Gamification", "Boosts"] },
  { icon: "💎", title: "VIP Access", desc: "Exclusive features for premium members.", tags: ["Premium", "VIP"] },
  { icon: "�", title: "Precision Mode", desc: "No hints, no mistakes allowed.", tags: ["Challenge", "Hardcore"] },
  { icon: "�", title: "Comparison Tools", desc: "Compare your stats with friends.", tags: ["Social", "Analytics"] },
  { icon: "�", title: "Seasonal Events", desc: "Special challenges during holidays.", tags: ["Events", "Seasonal"] },
  { icon: "⏰", title: "Speed Runs", desc: "How fast can you solve?", tags: ["Speed", "Challenge"] },
  { icon: "�", title: "Skill Certificates", desc: "Prove expertise in specific topics.", tags: ["Certificates", "Skills"] },
  { icon: "�", title: "Push Notifications", desc: "Never miss new challenges.", tags: ["Notifications", "Engagement"] },
  { icon: "�", title: "Multi-language", desc: "Practice in multiple programming languages.", tags: ["Languages", "Versatility"] },
  { icon: "💡", title: "Concept Explorer", desc: "Interactive coding concept tutorials.", tags: ["Learning", "Tutorial"] },
  { icon: "🎨", title: "Custom Themes", desc: "Personalize your learning environment.", tags: ["UI", "Personalization"] },
  { icon: "�", title: "Two-Factor Auth", desc: "Extra security for your account.", tags: ["Security", "2FA"] },
  { icon: "📝", title: "Code Editor", desc: "Built-in editor for coding challenges.", tags: ["Editor", "Tools"] },
  { icon: "�", title: "Smart Recommendations", desc: "AI suggests perfect next challenges.", tags: ["AI", "Recommendations"] },
  { icon: "�", title: "Practice Mode", desc: "No pressure, just learning.", tags: ["Practice", "Learning"] },
  { icon: "�", title: "Performance Graphs", desc: "Visual trends in your progress.", tags: ["Analytics", "Visualization"] },
  { icon: "�", title: "Team Contests", desc: "Collaborate with teammates.", tags: ["Teams", "Collaboration"] },
  { icon: "⚙️", title: "Auto-Save Progress", desc: "Never lose your place in a quiz.", tags: ["Convenience", "Reliability"] },
  { icon: "�", title: "Elite Ranks", desc: "Unlock exclusive high-level ranks.", tags: ["Ranks", "Prestige"] },
  { icon: "�", title: "Growth Metrics", desc: "Track improvement over time.", tags: ["Analytics", "Growth"] },
  { icon: "🎮", title: "Challenge Friends", desc: "Direct challenges to your connections.", tags: ["Social", "Challenges"] },
  { icon: "�", title: "Learning Paths", desc: "Structured journeys to mastery.", tags: ["Learning", "Guidance"] },
  { icon: "📚", title: "Resource Library", desc: "Curated learning materials.", tags: ["Resources", "Learning"] },
  { icon: "🔥", title: "Combo System", desc: "Chain correct answers for bonuses.", tags: ["Gamification", "Combos"] },
  { icon: "�", title: "Crystal Analytics", desc: "Crystal-clear performance insights.", tags: ["Analytics", "Premium"] },
  { icon: "🎯", title: "Focus Mode", desc: "Distraction-free coding environment.", tags: ["Focus", "Productivity"] },
  { icon: "📊", title: "Leaderboard Filters", desc: "Filter by region, company, or skill.", tags: ["Leaderboard", "Filters"] },
  { icon: "🎪", title: "Mystery Challenges", desc: "Surprise questions with bonus rewards.", tags: ["Surprise", "Rewards"] },
  { icon: "⏰", title: "Marathon Mode", desc: "Extended coding sessions.", tags: ["Endurance", "Marathon"] },
  { icon: "�", title: "Completion Streaks", desc: "Track consistency over time.", tags: ["Streaks", "Consistency"] },
  { icon: "📱", title: "Offline Mode", desc: "Practice without internet connection.", tags: ["Offline", "Accessibility"] },
  { icon: "�", title: "Global Rankings", desc: "See where you stand worldwide.", tags: ["Global", "Ranking"] },
  { icon: "�", title: "Smart Tips", desc: "Context-aware learning suggestions.", tags: ["AI", "Learning"] },
  { icon: "�", title: "Profile Customization", desc: "Show off your coding style.", tags: ["Profile", "Customization"] },
  { icon: "🔐", title: "Privacy Controls", desc: "Control what you share.", tags: ["Privacy", "Control"] },
  { icon: "�", title: "Solution Sharing", desc: "Share and discuss solutions.", tags: ["Community", "Sharing"] },
  { icon: "�", title: "Skill Assessments", desc: "Evaluate your current level.", tags: ["Assessment", "Evaluation"] },
  { icon: "🔄", title: "Instant Feedback", desc: "Learn immediately from mistakes.", tags: ["Feedback", "Learning"] },
  { icon: "�", title: "Heat Maps", desc: "Visual activity patterns.", tags: ["Visualization", "Patterns"] },
  { icon: "🎪", title: "Tournament Brackets", desc: "Elimination-style competitions.", tags: ["Tournaments", "Brackets"] },
  { icon: "⚙️", title: "Smart Reminders", desc: "Never miss practice sessions.", tags: ["Reminders", "Consistency"] },
  { icon: "�", title: "Champion Titles", desc: "Earn prestigious titles.", tags: ["Titles", "Prestige"] },
  { icon: "�", title: "Progress Photos", desc: "Snapshot your journey milestones.", tags: ["Milestones", "Sharing"] },
  { icon: "🎮", title: "Quick Challenges", desc: "5-minute skill boosters.", tags: ["Quick", "Microlearning"] },
  { icon: "🌟", title: "Expert Sessions", desc: "Learn from industry professionals.", tags: ["Experts", "Learning"] },
  { icon: "📚", title: "Code Playground", desc: "Experiment with code freely.", tags: ["Playground", "Experimentation"] },
  { icon: "�", title: "Fire Challenges", desc: "High-difficulty burning questions.", tags: ["Challenge", "Expert"] },
  { icon: "💎", title: "Diamond Tier", desc: "Ultimate premium experience.", tags: ["Premium", "Ultimate"] },
  { icon: "🎯", title: "Precision Training", desc: "Targeted skill improvement.", tags: ["Training", "Focus"] },
  { icon: "�", title: "Stat Comparisons", desc: "Benchmark against peers.", tags: ["Analytics", "Comparison"] },
  { icon: "🎪", title: "Festival Events", desc: "Cultural coding celebrations.", tags: ["Events", "Cultural"] },
  { icon: "⏰", title: "Time Trials", desc: "Beat the clock challenges.", tags: ["Speed", "Trials"] },
  { icon: "🏅", title: "Milestone Badges", desc: "Celebrate key achievements.", tags: ["Achievements", "Milestones"] },
  { icon: "�", title: "Cross-Platform Sync", desc: "Seamless progress across devices.", tags: ["Sync", "Cloud"] },
  { icon: "�", title: "Language Exchange", desc: "Practice in different languages.", tags: ["Languages", "Exchange"] },
  { icon: "💡", title: "Concept Mastery", desc: "Deep dive into core concepts.", tags: ["Learning", "Mastery"] },
  { icon: "�", title: "Achievement Showcase", desc: "Display your proudest moments.", tags: ["Showcase", "Pride"] },
  { icon: "�", title: "Data Encryption", desc: "Your data is always secure.", tags: ["Security", "Encryption"] },
  { icon: "📝", title: "Discussion Forums", desc: "Engage with the community.", tags: ["Community", "Discussion"] },
  { icon: "�", title: "Goal Setting", desc: "Set and achieve coding goals.", tags: ["Goals", "Achievement"] },
  { icon: "🔄", title: "Adaptive Difficulty", desc: "Challenges grow with you.", tags: ["Adaptive", "Personalization"] },
  { icon: "📊", title: "Performance Reports", desc: "Detailed monthly progress reports.", tags: ["Reports", "Analytics"] },
  { icon: "�", title: "Celebration Mode", desc: "Special events for achievements.", tags: ["Celebration", "Rewards"] },
  { icon: "⚙️", title: "Smart Dashboard", desc: "Your coding command center.", tags: ["Dashboard", "Control"] },
  { icon: "�", title: "Legacy Points", desc: "Build your coding legacy.", tags: ["Legacy", "Long-term"] },
  { icon: "�", title: "Skill Trees", desc: "Visual path to mastery.", tags: ["Visualization", "Progression"] },
  { icon: "�", title: "Instant Play", desc: "No setup, just coding.", tags: ["Instant", "Convenience"] },
  { icon: "🌟", title: "Mentor Matching", desc: "Connect with perfect mentors.", tags: ["Mentorship", "Matching"] },
  { icon: "📚", title: "Knowledge Base", desc: "Comprehensive coding encyclopedia.", tags: ["Knowledge", "Reference"] },
  { icon: "�", title: "Blazing Speed", desc: "Optimized for lightning performance.", tags: ["Performance", "Speed"] },
  { icon: "💎", title: "Crystal Clear UI", desc: "Beautiful, intuitive interface.", tags: ["UI", "Design"] },
  { icon: "�", title: "Perfect Practice", desc: "Science-backed learning methods.", tags: ["Science", "Learning"] },
  { icon: "📊", title: "Success Metrics", desc: "Measure what matters most.", tags: ["Metrics", "Success"] },
  { icon: "🎪", title: "Community Challenges", desc: "Crowd-sourced coding problems.", tags: ["Community", "Crowdsourcing"] },
  { icon: "⏰", title: "Flexible Timing", desc: "Practice on your schedule.", tags: ["Flexibility", "Convenience"] },
  { icon: "🏅", title: "Elite Recognition", desc: "Stand out in the coding world.", tags: ["Recognition", "Elite"] },
  { icon: "�", title: "Touch Optimized", desc: "Perfect mobile experience.", tags: ["Mobile", "Touch"] },
  { icon: "�", title: "Worldwide Access", desc: "Code from anywhere, anytime.", tags: ["Global", "Access"] },
  { icon: "💡", title: "Bright Future", desc: "Your coding journey starts here.", tags: ["Future", "Journey"] },
  { icon: "🎨", title: "Beautiful Design", desc: "Aesthetics meet functionality.", tags: ["Design", "Beauty"] },
  { icon: "🔐", title: "Trust & Safety", desc: "Safe learning environment.", tags: ["Safety", "Trust"] },
  { icon: "📝", title: "Code Quality", desc: "Industry-standard practices.", tags: ["Quality", "Standards"] },
  { icon: "�", title: "Target Success", desc: "Your goals, our platform.", tags: ["Success", "Goals"] },
  { icon: "�", title: "Continuous Improvement", desc: "Always getting better.", tags: ["Improvement", "Evolution"] },
  { icon: "📊", title: "Data-Driven Growth", desc: "Analytics-powered learning.", tags: ["Data", "Analytics"] }
];

function renderPlatformFeatures() {
  const host = el("codingCardsGrid");
  if (!host) return;

  host.innerHTML = PLATFORM_FEATURES_100.map((card, idx) => `
    <div class="codingCard" data-index="${idx}">
      <div class="cardHeader">
        <span class="cardIcon">${card.icon}</span>
        <span class="cardTitle">${card.title}</span>
      </div>
      <div class="cardDesc">${card.desc}</div>
      <div class="cardTags">
        ${card.tags.map(tag => `<span class="cardTag">${tag}</span>`).join("")}
      </div>
    </div>
  `).join("");

  // Add click animation
  host.addEventListener("click", (e) => {
    const card = e.target.closest(".codingCard");
    if (!card) return;
    card.style.transform = "scale(0.96)";
    setTimeout(() => {
      card.style.transform = "";
    }, 150);
  });
}

async function init() {
  setPillStatus("Connected", true);
  renderPlatformFeatures();
}

init();
