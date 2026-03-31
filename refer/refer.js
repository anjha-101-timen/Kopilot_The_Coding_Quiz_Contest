import { setPillStatus, toast } from "../shared/ui.js";
import { getDeviceId, loadProfileLocal, syncProfile } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

const REFER_FAQS = [
  {
    q: "How does the referral program work?",
    a: "Share your unique referral link with friends. When they sign up and complete quizzes, both of you earn CP rewards based on their milestones.",
    hook: "🚀 Start Earning Instantly",
    tags: ["Basics", "Rewards"]
  },
  {
    q: "What rewards do I get for referring friends?",
    a: "You earn 15 CP when a friend completes their first quiz, 20 CP at their 5th quiz, 30 CP at their 10th quiz, and 50 CP at their 25th quiz. Your friend also gets bonus CP!",
    hook: "💎 Multi-Tier Rewards",
    tags: ["CP", "Tiers"]
  },
  {
    q: "Is there a limit to how many friends I can refer?",
    a: "No! There's no limit to referrals. The more friends you refer, the more CP you can earn. Build your coding empire!",
    hook: "🌟 Unlimited Potential",
    tags: ["Limits", "Growth"]
  },
  {
    q: "When do I receive my CP rewards?",
    a: "CP rewards are credited instantly when your friend reaches each milestone. Check your stats section to track your earnings in real-time.",
    hook: "⚡ Instant Gratification",
    tags: ["Timing", "Instant"]
  },
  {
    q: "Do my friends get benefits too?",
    a: "Absolutely! Your friends receive bonus CP when they join through your link: 10 CP for their first quiz, plus additional CP at milestones.",
    hook: "🤝 Win-Win Situation",
    tags: ["Benefits", "Friends"]
  },
  {
    q: "How can I track my referral performance?",
    a: "Your referral stats show total friends referred, CP earned, pending rewards, and your referral level. Check the 'Your Referral Empire' section.",
    hook: "📊 Real-Time Analytics",
    tags: ["Tracking", "Stats"]
  },
  {
    q: "What happens if my friend doesn't use my link?",
    a: "If your friend signs up without your referral link, you won't earn CP from their activities. Make sure they use your unique link for proper tracking.",
    hook: "🔗 Link Matters",
    tags: ["Tracking", "Requirements"]
  },
  {
    q: "Can I refer friends from different countries?",
    a: "Yes! Coding Quiz Contest is global. You can refer friends from anywhere in the world and earn CP rewards.",
    hook: "🌍 Global Community",
    tags: ["Global", "International"]
  },
  {
    q: "Do referral CP rewards count toward my level?",
    a: "Yes! All CP earned from referrals contributes to your overall CP total, helping you level up faster and climb the leaderboard.",
    hook: "📈 Level Up Faster",
    tags: ["Levels", "Progress"]
  },
  {
    q: "What are referral levels and how do they work?",
    a: "Referral levels are based on your total referrals and CP earned. Higher levels unlock special badges and recognition in the community.",
    hook: "🏆 Elite Status",
    tags: ["Levels", "Status"]
  },
  {
    q: "Can I share my referral link on social media?",
    a: "Absolutely! Share your link on Twitter, LinkedIn, Facebook, Discord, or any platform where coding enthusiasts gather.",
    hook: "📱 Share Everywhere",
    tags: ["Social", "Sharing"]
  },
  {
    q: "How long is my referral link valid?",
    a: "Your referral link never expires! It's permanently tied to your account and will work as long as Coding Quiz Contest exists.",
    hook: "⏰ Lifetime Valid",
    tags: ["Validity", "Permanent"]
  },
  {
    q: "What if my friend forgets to use my link initially?",
    a: "Unfortunately, referrals must be tracked at signup. Remind your friends to use your link before creating their account.",
    hook: "⚠️ One-Time Only",
    tags: ["Rules", "Signup"]
  },
  {
    q: "Can I earn CP from friends of friends?",
    a: "Currently, the referral program is single-level. You only earn CP from direct referrals, but we're always exploring new features!",
    hook: "🎯 Direct Referrals",
    tags: ["Structure", "Future"]
  },
  {
    q: "How do I become a top referrer?",
    a: "Consistently share your link, engage with coding communities, and help friends succeed. Top referrers earn special recognition and rewards.",
    hook: "👑 Join the Elite",
    tags: ["Goals", "Achievement"]
  },
  {
    q: "Are there bonus rewards for top referrers?",
    a: "Yes! Monthly top referrers receive bonus CP, special badges, and featured placement on the referral leaderboard.",
    hook: "🎁 Monthly Bonuses",
    tags: ["Bonuses", "Recognition"]
  },
  {
    q: "Can I customize my referral message?",
    a: "While the referral link is fixed, you can add your personal touch when sharing. Tell friends why you love Coding Quiz Contest!",
    hook: "✨ Personal Touch",
    tags: ["Customization", "Personal"]
  },
  {
    q: "What happens if I change devices?",
    a: "Your referral stats are tied to your account, not your device. Log in on any device to access your referral link and track earnings.",
    hook: "🔄 Cross-Device",
    tags: ["Devices", "Sync"]
  },
  {
    q: "Can I refer myself with multiple accounts?",
    a: "No, self-referral is against our terms. Each person should have only one account. Focus on genuine referrals!",
    hook: "🚫 Fair Play",
    tags: ["Rules", "Fairness"]
  },
  {
    q: "How do I know if my referral was successful?",
    a: "Check your stats section - successful referrals appear immediately. You'll also see CP rewards when milestones are reached.",
    hook: "✅ Confirmation",
    tags: ["Verification", "Tracking"]
  },
  {
    q: "Can I earn CP from inactive referrals?",
    a: "CP rewards are only given when friends complete quiz milestones. Encourage your referrals to stay active!",
    hook: "🎯 Active Engagement",
    tags: ["Activity", "Requirements"]
  },
  {
    q: "What's the best way to share my referral link?",
    a: "Share in coding communities, with classmates, or on social media. Explain the benefits and why you enjoy the platform.",
    hook: "💡 Smart Sharing",
    tags: ["Strategy", "Tips"]
  },
  {
    q: "Are there referral contests or events?",
    a: "Yes! We host special referral events with bonus rewards. Follow our announcements for upcoming opportunities.",
    hook: "🎪 Special Events",
    tags: ["Events", "Contests"]
  },
  {
    q: "Can I track individual friend progress?",
    a: "Currently, you can see total stats and pending rewards. We're working on detailed referral tracking features!",
    hook: "🔮 Coming Soon",
    tags: ["Features", "Future"]
  },
  {
    q: "What if my referral link isn't working?",
    a: "Ensure you're copying the complete link from the button. If issues persist, contact support with your device ID.",
    hook: "🛠️ Tech Support",
    tags: ["Troubleshooting", "Support"]
  },
  {
    q: "Do referral rewards expire?",
    a: "No! Once earned, CP rewards are yours forever and contribute to your permanent progress.",
    hook: "💾 Permanent Rewards",
    tags: ["Expiration", "Permanence"]
  },
  {
    q: "Can I earn CP from premium features referrals?",
    a: "All quiz completions earn referral CP, whether using free or premium features. Premium status doesn't affect referral rewards.",
    hook: "💎 Premium Compatible",
    tags: ["Premium", "Features"]
  },
  {
    q: "How do referral leaderboards work?",
    a: "Monthly leaderboards rank users by CP earned from referrals. Top performers get special recognition and bonus rewards.",
    hook: "🏅 Competitive Edge",
    tags: ["Leaderboard", "Competition"]
  },
  {
    q: "Can I create custom referral campaigns?",
    a: "While you can't create official campaigns, you can organize personal referral drives among friends or communities.",
    hook: "🎨 Creative Sharing",
    tags: ["Campaigns", "Creative"]
  },
  {
    q: "What if my friend uses ad-blockers?",
    a: "Ad-blockers don't affect referral tracking. As long as they use your link during signup, you'll earn CP rewards.",
    hook: "🛡️ Unaffected",
    tags: ["Technical", "Compatibility"]
  },
  {
    q: "Are there referral achievement badges?",
    a: "Yes! Earn special badges for reaching referral milestones like 10 friends, 100 CP earned, or top referrer status.",
    hook: "🎖️ Achievement Hunter",
    tags: ["Achievements", "Badges"]
  },
  {
    q: "Can I export my referral data?",
    a: "Currently, referral data is available in your profile. We're working on data export features for detailed analytics.",
    hook: "📊 Data Analytics",
    tags: ["Data", "Analytics"]
  },
  {
    q: "Do referrals work on mobile apps?",
    a: "Yes! Referral links work across web and mobile. Your friends can sign up on any platform using your link.",
    hook: "📱 Mobile Ready",
    tags: ["Mobile", "Cross-Platform"]
  },
  {
    q: "What's the average CP per referral?",
    a: "Active friends typically earn you 100+ CP through all milestones. The more engaged your friends, the more you earn!",
    hook: "💰 Earning Potential",
    tags: ["Earnings", "Statistics"]
  },
  {
    q: "Can I pause my referral link?",
    a: "Your referral link is always active. If you don't want new referrals, simply stop sharing the link.",
    hook: "⏸️ Always Active",
    tags: ["Control", "Management"]
  },
  {
    q: "Are there referral bonuses for specific communities?",
    a: "Sometimes! We partner with coding bootcamps, universities, and tech communities for special bonus events.",
    hook: "🎓 Community Partners",
    tags: ["Partnerships", "Bonuses"]
  },
  {
    q: "How do I report referral issues?",
    a: "Contact support with details about the issue, your device ID, and your friend's information if possible.",
    hook: "🛟 Support Ready",
    tags: ["Support", "Issues"]
  },
  {
    q: "Can I earn CP from contest referrals?",
    a: "Yes! When referred friends participate in contests and complete quizzes, you earn CP from their quiz milestones.",
    hook: "🏆 Contest Compatible",
    tags: ["Contests", "Events"]
  },
  {
    q: "What's the best time to share referral links?",
    a: "Share during coding events, when friends are job hunting, or when new features launch. Timing can boost success!",
    hook: "⏰ Perfect Timing",
    tags: ["Strategy", "Timing"]
  },
  {
    q: "Are there referral limits per day?",
    a: "No daily limits! You can refer as many friends as you want, whenever you want.",
    hook: "∞ No Limits",
    tags: ["Limits", "Unlimited"]
  },
  {
    q: "Can I see my referral history?",
    a: "Currently, you can see total stats. We're building detailed referral history with individual friend progress.",
    hook: "📜 History Coming",
    tags: ["Features", "History"]
  },
  {
    q: "Do referrals affect my leaderboard ranking?",
    a: "Yes! CP from referrals contributes to your total CP, which determines your position on the main leaderboard.",
    hook: "🚀 Rank Boost",
    tags: ["Leaderboard", "Ranking"]
  },
  {
    q: "What makes a successful referral strategy?",
    a: "Share genuinely, explain benefits, help friends get started, and celebrate their milestones. Personal touch works best!",
    hook: "🌟 Pro Tips",
    tags: ["Strategy", "Success"]
  }
];

function renderFAQs() {
  const host = el("faqList");
  if (!host) return;

  host.innerHTML = REFER_FAQS.map((faq, idx) => `
    <div class="faqItem" data-index="${idx}">
      <button class="faqBtn" aria-expanded="false">
        <span class="faqQuestion">
          <span class="faqHook">${faq.hook}</span>
          <span class="faqText">${faq.q}</span>
        </span>
        <svg class="faqChevron" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="faqPanel">
        <div class="faqContent">
          <div class="faqAnswer">${faq.a}</div>
          <div class="faqTags">
            ${faq.tags.map(tag => `<span class="faqTag">${tag}</span>`).join("")}
          </div>
        </div>
      </div>
    </div>
  `).join("");

  // Add accordion functionality
  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".faqBtn");
    if (!btn) return;
    
    const item = btn.closest(".faqItem");
    const isOpen = item.classList.contains("open");
    
    // Close all items
    host.querySelectorAll(".faqItem").forEach(faqItem => {
      faqItem.classList.remove("open");
      faqItem.querySelector(".faqBtn").setAttribute("aria-expanded", "false");
    });
    
    // Open clicked item if it wasn't open
    if (!isOpen) {
      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
  });
}

function renderLeaderboard() {
  const host = el("leaderboardList");
  if (!host) return;

  // Sample data - in real app, this would come from API
  const topReferrers = [
    { rank: 1, user: "CodeMaster99", score: "1,250 CP" },
    { rank: 2, user: "QuizNinja", score: "980 CP" },
    { rank: 3, user: "AlgoWizard", score: "875 CP" },
    { rank: 4, user: "ByteCrusher", score: "720 CP" },
    { rank: 5, user: "LogicKing", score: "650 CP" }
  ];

  host.innerHTML = topReferrers.map(referrer => `
    <div class="leaderboardItem">
      <div class="rank">${referrer.rank}</div>
      <div class="user">${referrer.user}</div>
      <div class="score">${referrer.score}</div>
    </div>
  `).join("");
}

function getReferralLink(deviceId) {
  const base = window.location.origin;
  return `${base}/?ref=${encodeURIComponent(deviceId)}`;
}

async function copyReferralLink() {
  const deviceId = getDeviceId();
  const link = getReferralLink(deviceId);
  try {
    await navigator.clipboard.writeText(link);
    toast("Referral link copied!", "success", 2000);
  } catch {
    toast("Failed to copy link.", "error", 2000);
  }
}

async function shareReferralLink() {
  const deviceId = getDeviceId();
  const link = getReferralLink(deviceId);
  const title = "Join Coding Quiz Contest";
  const text = "Practice coding quizzes, earn CP, and compete with friends!";
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: link });
    } catch {
      // ignore
    }
  } else {
    await copyReferralLink();
  }
}

function renderStats(profile) {
  const referrals = Number(profile.referralCount || 0);
  const cpEarned = Number(profile.referralCpEarned || 0);
  const pending = Number(profile.referralPending || 0);
  const level = Math.floor(referrals / 5) + 1; // Simple level calculation
  
  el("statReferrals").textContent = referrals;
  el("statCpEarned").textContent = cpEarned;
  el("statPending").textContent = pending;
  el("statLevel").textContent = level;
}

async function init() {
  setPillStatus("Connected", true);
  const deviceId = getDeviceId();
  const profile = loadProfileLocal(deviceId);
  
  renderStats(profile);
  renderFAQs();
  renderLeaderboard();

  // Sync profile in background (best effort)
  syncProfile(deviceId)
    .then((p) => renderStats(p))
    .catch(() => {});

  el("btnCopy")?.addEventListener("click", copyReferralLink);
  el("btnShare")?.addEventListener("click", shareReferralLink);
}

init();
