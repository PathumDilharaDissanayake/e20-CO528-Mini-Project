/**
 * DECP Platform — Comprehensive Database Seeder
 * Populates all 9 databases with 200 users and rich interactions.
 * Run from backend root: node seed.js
 */

const { Pool } = require('./auth-service/node_modules/pg');
const bcrypt = require('./auth-service/node_modules/bcryptjs');
const { randomUUID } = require('crypto');

// ── DB Connections ──────────────────────────────────────────────────────────
const BASE = { host: 'localhost', port: 5432, user: 'postgres', password: '12345' };
const pools = {
  auth:          new Pool({ ...BASE, database: 'decp_auth' }),
  users:         new Pool({ ...BASE, database: 'decp_users' }),
  feed:          new Pool({ ...BASE, database: 'decp_feed' }),
  jobs:          new Pool({ ...BASE, database: 'decp_jobs' }),
  events:        new Pool({ ...BASE, database: 'decp_events' }),
  research:      new Pool({ ...BASE, database: 'decp_research' }),
  messaging:     new Pool({ ...BASE, database: 'decp_messaging' }),
  notifications: new Pool({ ...BASE, database: 'decp_notifications' }),
};

const q = async (db, sql, params = []) => {
  try { return await pools[db].query(sql, params); }
  catch (e) {
    if (e.code === '23505') return null; // unique conflict — skip
    if (e.code === '42P01') { console.warn(`  [skip] table not found in ${db}: ${e.message.split('\n')[0]}`); return null; }
    throw e;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const ago = days => new Date(Date.now() - days * 86400000);
const future = days => new Date(Date.now() + days * 86400000);
const uuid = () => randomUUID();

// ── Static Data ──────────────────────────────────────────────────────────────
const ROLES = ['student', 'student', 'student', 'student', 'student', 'student',
               'alumni', 'alumni', 'faculty', 'admin'];

const DEPARTMENTS = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Business Administration', 'Data Science', 'Biotechnology', 'Civil Engineering',
  'Mathematics', 'Physics', 'Information Technology'];

const FIRST_NAMES = [
  'Aarav','Aisha','Alex','Amelia','Amir','Ana','Andrew','Angela','Arjun','Aria',
  'Benjamin','Brianna','Carlos','Catherine','Chen','Chris','Chloe','Daniel','David','Diana',
  'Elena','Emma','Ethan','Fatima','Gabriel','Grace','Hannah','Henry','Isabella','Ivan',
  'James','Jasmine','Jason','Jennifer','Jessica','Jordan','Julia','Kevin','Layla','Liam',
  'Lily','Lucas','Madison','Maria','Mark','Matthew','Maya','Michael','Michelle','Mohamed',
  'Nadia','Nathan','Nicole','Noah','Olivia','Omar','Priya','Rachel','Rafael','Ryan',
  'Samantha','Sara','Sarah','Siddharth','Sofia','Sophia','Stefan','Susan','Taylor','Thomas',
  'Tyler','Uma','Victor','Victoria','Wei','William','Yasmin','Zara','Zhang','Zoe',
  'Abigail','Adam','Adrian','Aditya','Ahmed','Akira','Alba','Alberto','Alejandro','Alicia',
  'Alina','Aliya','Alok','Alondra','Alvaro','Amara','Amelie','Ami','Amit','Amy',
  'Andrea','Andres','Angel','Angelica','Anita','Anna','Anthony','Antonia','Antonio','Ariana',
  'Arnav','Aryan','Ash','Ashley','Avery','Ayaan','Ayesha','Ayush','Beatriz','Beth',
  'Bianca','Blake','Brandon','Brenda','Brian','Bridget','Brittany','Bryan','Byron','Camila',
  'Carmen','Carolina','Cassandra','Cecilia','Charlotte','Chiara','Clara','Claudia','Connie','Conor',
  'Cristina','Cyrus','Dakota','Daniela','Darius','Dean','Deepak','Deja','Denis','Derek',
  'Destiny','Diego','Dilnoza','Dominic','Dylan','Eduardo','Elaine','Elijah','Elizabeth','Emily'
];

const LAST_NAMES = [
  'Adams','Ahmed','Ali','Anderson','Arora','Baker','Brown','Campbell','Carter','Chen',
  'Clark','Cooper','Cruz','Davis','Edwards','Evans','Fisher','Garcia','Green','Gupta',
  'Hall','Harris','Hernandez','Hill','Hughes','Jackson','Johnson','Jones','Kapoor','Kim',
  'Kumar','Lee','Lewis','Li','Liu','Lopez','Martin','Martinez','Miller','Mitchell',
  'Moore','Morales','Morgan','Nguyen','Patel','Perez','Peterson','Phillips','Ramirez','Reed',
  'Rivera','Roberts','Robinson','Rodriguez','Ross','Sanchez','Santos','Scott','Shah','Singh',
  'Smith','Stewart','Sullivan','Taylor','Thomas','Thompson','Torres','Turner','Walker','Wang',
  'White','Williams','Wilson','Wood','Wright','Young','Zhang','Zhou','Parker','Collins',
  'Brooks','Murphy','James','Diaz','Cox','Ward','Richardson','Howard','Myers','Long',
  'Gonzalez','Nelson','Morris','Barnes','King','Allen','Price','Simmons','Foster','Hayes'
];

const SKILLS_POOL = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Machine Learning', 'Deep Learning',
  'Data Analysis', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP',
  'Azure', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'Java', 'C++', 'Go', 'Rust',
  'Flutter', 'Swift', 'Kotlin', 'GraphQL', 'REST APIs', 'Microservices', 'DevOps', 'CI/CD',
  'System Design', 'Agile', 'Scrum', 'Leadership', 'Research', 'Statistics', 'Linear Algebra',
  'Blockchain', 'Cybersecurity', 'Networking', 'Embedded Systems', 'FPGA', 'MATLAB',
  'R', 'Tableau', 'Power BI', 'Excel', 'Product Management', 'UX Design', 'Figma'
];

const COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Tesla', 'Uber',
  'Airbnb', 'Stripe', 'Shopify', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA',
  'Deloitte', 'McKinsey', 'Accenture', 'PwC', 'Goldman Sachs', 'JPMorgan', 'Twitter',
  'LinkedIn', 'Spotify', 'Zoom', 'Slack', 'Atlassian', 'Palantir', 'Snowflake',
  'DataBricks', 'Figma', 'Notion', 'Canva', 'ByteDance', 'Samsung', 'Sony', 'Qualcomm'
];

const UNIVERSITIES = [
  'MIT', 'Stanford University', 'Harvard University', 'Carnegie Mellon University',
  'University of California Berkeley', 'Caltech', 'Princeton University', 'Yale University',
  'Columbia University', 'University of Michigan', 'Georgia Tech', 'Cornell University',
  'University of Texas', 'University of Washington', 'Duke University'
];

const DEGREES = ['B.Sc.', 'M.Sc.', 'B.Eng.', 'M.Eng.', 'MBA', 'B.Tech.', 'M.Tech.', 'Ph.D.'];

const BIO_TEMPLATES = [
  'Passionate about {skill1} and {skill2}. Currently pursuing my degree in {dept}.',
  'Research enthusiast with a focus on {skill1}. Love building impactful solutions.',
  '{role} with expertise in {skill1}, {skill2}, and {skill3}.',
  'Building the future with {skill1} and {skill2}. Open to collaborations!',
  'Dedicated {dept} student interested in {skill1} and emerging technologies.',
  'Tech enthusiast | {skill1} developer | Open source contributor',
  'Turning data into insights. Specializing in {skill1} and {skill2}.',
  'Bridging academia and industry through innovative {skill1} solutions.',
  'Currently working on cutting-edge {skill1} research at {university}.',
  'Lifelong learner. {skill1} practitioner. {dept} graduate.'
];

const POST_CONTENTS = [
  "Just completed my final project on {topic}! After weeks of hard work, the results are incredible. Sharing my findings with the community. 🎓",
  "Excited to announce that I've joined {company} as a {role} intern! Looking forward to learning and contributing. This is a dream come true!",
  "Working on a research paper about {topic}. The intersection of AI and real-world applications is fascinating. Would love collaborators!",
  "Key takeaways from today's {topic} workshop:\n\n• Understanding fundamentals matters most\n• Practice beats theory every time\n• Build in public and get feedback early\n\nWhat would you add?",
  "Hot take: {topic} is going to completely transform {industry} in the next 5 years. Here's why I think so...",
  "Successfully deployed my {topic} project to production! Built with React, Node.js, and PostgreSQL. Check it out — link in comments!",
  "Struggling with {topic} and decided to write a blog post about what I learned. Sometimes explaining it to others is the best way to understand.",
  "Attended an incredible seminar on {topic} today. The speaker from {company} shared insights I'll be using for years. My notes below 👇",
  "Looking for study group members for {topic} exam prep. DM me if you're interested! Let's ace this together.",
  "Reflection after 1 year of studying {dept}: the most valuable skill isn't technical — it's learning how to learn. What's been your biggest lesson?",
  "Just got my paper on {topic} accepted to the conference! Can't believe it. Months of research finally paying off 🙌",
  "Reminder: the deadline for {topic} submissions is this Friday. Don't wait until the last minute! I learned that the hard way last semester.",
  "If you're learning {topic}, here are the 3 resources that helped me the most:\n1. Documentation (seriously, read it!)\n2. Build a real project\n3. Find a mentor",
  "The gap between theory and practice in {topic} is HUGE. Here's what nobody tells you in class...",
  "Networking event recap: met so many talented people in {industry} today. This community is amazing. Always be open to new connections!",
  "First time contributing to an open source {topic} project! The process was intimidating but the community was so welcoming. You should try it!",
  "Career advice that changed my trajectory: focus on problems, not technologies. {topic} is just a tool. The real skill is problem-solving.",
  "Research update: our team has made significant progress on {topic}. Preliminary results look promising. Stay tuned for the full paper!",
  "What's your favorite {topic} learning resource? Drop recommendations in the comments — I'll compile a list for everyone!",
  "Interview prep tip: don't just memorize {topic} concepts — understand WHY they work. Interviewers can tell the difference immediately."
];

const COMMENT_TEMPLATES = [
  "This is incredibly insightful! Thank you for sharing.",
  "Great work! This approach to {topic} is something I've been exploring too.",
  "Congratulations! Well deserved 🎉",
  "This resonates with me so much. Keep it up!",
  "Would love to connect and discuss this further.",
  "Amazing research! Did you consider the implications for {field}?",
  "I had a similar experience. The key insight for me was staying consistent.",
  "This is exactly what I needed to read today. Thank you!",
  "Fantastic perspective. The industry needs more thinking like this.",
  "Bookmarking this for future reference. Gold content!",
  "You should turn this into a full blog post. Seriously.",
  "Totally agree. I've seen this firsthand in my work at {company}.",
  "This changed how I think about {topic}. Thank you!",
  "Following for more content like this 🙌",
  "The point about learning fundamentals is SO true!"
];

const TOPICS = [
  'Machine Learning', 'Web Development', 'Cloud Computing', 'Data Science', 'Cybersecurity',
  'Blockchain', 'IoT', 'Computer Vision', 'NLP', 'Distributed Systems', 'React', 'Python',
  'System Design', 'Database Optimization', 'DevOps', 'Mobile Development', 'GraphQL',
  'Quantum Computing', 'AR/VR', 'Autonomous Systems'
];

const INDUSTRIES = [
  'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Transportation',
  'Entertainment', 'Government', 'Agriculture', 'Energy'
];

const UNSPLASH_TECH = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',
  'https://images.unsplash.com/photo-1607798748738-b15c40d33d57?w=800&q=80',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80',
  'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'https://images.unsplash.com/photo-1508780709619-79562169bc64?w=800&q=80',
  'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&q=80',
];

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Backend Engineer',
  'Frontend Developer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
  'Cloud Architect', 'Product Manager', 'UX Designer', 'Data Analyst', 'Security Engineer',
  'Mobile Developer', 'Research Engineer', 'Site Reliability Engineer', 'Engineering Manager',
  'AI Researcher', 'Systems Architect', 'Technical Lead'
];

const EVENT_TITLES = [
  'Annual Tech Career Fair 2026', 'AI & Machine Learning Summit', 'Web Development Bootcamp',
  'Cybersecurity Awareness Workshop', 'Data Science Hackathon', 'Alumni Networking Night',
  'Cloud Computing Seminar', 'Open Source Contribution Sprint', 'Research Symposium 2026',
  'Blockchain Technology Workshop', 'Women in Tech Panel', 'Startup Pitch Competition',
  'Full Stack Development Workshop', 'DevOps Best Practices Seminar', 'Mobile App Development Bootcamp',
  'Industry Expert Talk: Future of AI', 'Database Design Masterclass', 'System Design Interview Prep',
  'Capstone Project Showcase', 'Quantum Computing Introduction', 'Graduate Research Colloquium',
  'Tech Ethics and Society Forum', 'Embedded Systems Workshop', 'UX Design Sprint',
  'Python for Data Science Bootcamp', 'Game Development Jam', 'Networking & Professional Development',
  'Final Year Project Expo', 'IEEE Student Chapter Meetup', 'International Students Tech Mixer'
];

const RESEARCH_TITLES = [
  'Deep Learning Approaches for Early Disease Detection',
  'Federated Learning for Privacy-Preserving IoT Systems',
  'Natural Language Processing in Low-Resource Languages',
  'Autonomous Vehicle Navigation Using Reinforcement Learning',
  'Quantum Algorithms for Optimization Problems',
  'Blockchain-Based Academic Credential Verification',
  'Explainable AI for Clinical Decision Support',
  'Energy-Efficient Deep Neural Networks for Edge Computing',
  'Real-Time Object Detection in Adverse Weather Conditions',
  'Secure Multi-Party Computation for Financial Fraud Detection',
  'Graph Neural Networks for Social Network Analysis',
  'Adversarial Robustness in Computer Vision Systems',
  'Automated Code Review Using Large Language Models',
  'Emotion Recognition from Multimodal Signals',
  'Smart Grid Optimization Using Predictive Analytics',
  'Human-Robot Interaction with Natural Language Commands',
  'Differential Privacy in Healthcare Data Analysis',
  'Cross-Modal Learning for Medical Image Synthesis',
  'Sustainable Computing: Reducing Carbon Footprint of AI',
  'Biometric Authentication Using Behavioral Patterns'
];

const MSG_TEMPLATES = [
  "Hey! Saw your post about {topic}. Really impressive work!",
  "Hi, I'm working on something similar in {topic}. Would love to chat!",
  "Thanks for connecting! Your background in {skill} is super relevant to what I'm doing.",
  "Just wanted to reach out — your research on {topic} caught my eye.",
  "Are you free for a quick call this week? Would love to discuss {topic}.",
  "I noticed we're both interested in {topic}. Let's collaborate!",
  "Your last post was spot on. I've been thinking about {topic} a lot lately.",
  "Do you have any recommendations for getting started with {skill}?",
  "Congrats on your recent achievement! How's the experience at {company} going?",
  "I just published something about {topic}. Would love your thoughts!",
  "Long time! How's everything going with your studies?",
  "Thanks for the feedback on my project. Really helpful!",
  "Quick question: what's your preferred tool for {topic} projects?",
  "Amazing presentation yesterday! The part about {topic} was eye-opening.",
  "Hey, are you attending the {topic} event this weekend?"
];

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 DECP Platform — Database Seeder');
  console.log('===================================\n');

  // ── 0. Clean up seed data (keep manually-registered users) ────────────────
  console.log('Cleaning up previous seed data...');
  // Only delete users whose emails end in @decp.edu (seed-generated)
  const seedEmailPattern = '%@decp.edu';
  const oldUsers = await pools.auth.query(
    `SELECT id FROM users WHERE email LIKE $1`, [seedEmailPattern]
  );
  const oldIds = oldUsers.rows.map(r => r.id);
  if (oldIds.length > 0) {
    const ph = oldIds.map((_, i) => `$${i+1}`).join(',');
    await pools.users.query(`DELETE FROM profiles WHERE "userId" IN (${ph})`, oldIds).catch(() => {});
    await pools.users.query(`DELETE FROM connections WHERE "followerId" IN (${ph}) OR "followingId" IN (${ph})`, oldIds).catch(() => {});
    // Delete feed data for these users
    const oldPosts = await pools.feed.query(`SELECT id FROM posts WHERE "userId" IN (${ph})`, oldIds).catch(() => ({ rows: [] }));
    const postIds = oldPosts.rows.map(r => r.id);
    if (postIds.length > 0) {
      const pp = postIds.map((_, i) => `$${i+1}`).join(',');
      await pools.feed.query(`DELETE FROM likes WHERE "postId" IN (${pp})`, postIds).catch(() => {});
      await pools.feed.query(`DELETE FROM comments WHERE "postId" IN (${pp})`, postIds).catch(() => {});
      await pools.feed.query(`DELETE FROM bookmarks WHERE "postId" IN (${pp})`, postIds).catch(() => {});
      await pools.feed.query(`DELETE FROM posts WHERE id IN (${pp})`, postIds).catch(() => {});
    }
    await pools.jobs.query(`DELETE FROM jobs WHERE "postedBy" IN (${ph})`, oldIds).catch(() => {});
    await pools.events.query(`DELETE FROM events WHERE "organizerId" IN (${ph})`, oldIds).catch(() => {});
    await pools.research.query(`DELETE FROM research_projects WHERE "leadResearcherId" IN (${ph})`, oldIds).catch(() => {});
    await pools.auth.query(`DELETE FROM users WHERE id IN (${ph})`, oldIds).catch(() => {});
    console.log(`  ✓ Cleaned ${oldIds.length} old seed users and their data`);
  } else {
    console.log('  ✓ No previous seed data found');
  }

  // ── 1. Create Users (auth) ─────────────────────────────────────────────────
  console.log('Creating 200 users in decp_auth...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const users = [];

  for (let i = 0; i < 200; i++) {
    const role = ROLES[i % ROLES.length];
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const gradYear = role === 'alumni' ? rand(2015, 2023)
                   : role === 'faculty' ? rand(1995, 2010)
                   : role === 'student' ? rand(2024, 2027)
                   : null;
    const id = uuid();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@decp.edu`;
    users.push({ id, email, firstName, lastName, role, dept, gradYear });

    await q('auth', `
      INSERT INTO users (id, email, password, "firstName", "lastName", role, department, "graduationYear", "isEmailVerified", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$9)
      ON CONFLICT (email) DO NOTHING
    `, [id, email, hashedPassword, firstName, lastName, role, dept, gradYear, ago(rand(30, 365))]);
  }
  console.log(`  ✓ ${users.length} users created`);

  // ── 2. Create Profiles (user-service) ─────────────────────────────────────
  console.log('Creating profiles in decp_users...');
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const skills = pickN(SKILLS_POOL, rand(3, 8));
    const interests = pickN(TOPICS, rand(2, 5));
    const bioTpl = BIO_TEMPLATES[i % BIO_TEMPLATES.length];
    const bio = bioTpl
      .replace('{skill1}', skills[0] || 'technology')
      .replace('{skill2}', skills[1] || 'innovation')
      .replace('{skill3}', skills[2] || 'research')
      .replace('{dept}', u.dept)
      .replace('{role}', u.role)
      .replace('{university}', pick(UNIVERSITIES));

    const gender = i % 2 === 0 ? 'men' : 'women';
    const avatarNum = (i % 70) + 1;
    const avatar = `https://randomuser.me/api/portraits/${gender}/${avatarNum}.jpg`;

    const experience = u.role !== 'student' ? [
      {
        company: pick(COMPANIES),
        title: pick(JOB_TITLES),
        location: 'Remote',
        startDate: `${rand(2018, 2022)}-0${rand(1,9)}-01`,
        endDate: u.role === 'alumni' ? `${rand(2022, 2024)}-0${rand(1,9)}-01` : undefined,
        current: u.role !== 'alumni',
        description: `Working on ${pick(TOPICS)} projects and leading a team of engineers.`
      }
    ] : [];

    const education = [
      {
        institution: pick(UNIVERSITIES),
        degree: pick(DEGREES),
        fieldOfStudy: u.dept,
        startYear: u.gradYear ? u.gradYear - 4 : 2020,
        endYear: u.gradYear || undefined,
        current: !u.gradYear || u.gradYear > 2025
      }
    ];

    const headline = u.role === 'student'
      ? `${u.dept} Student | Aspiring ${pick(JOB_TITLES)}`
      : u.role === 'alumni'
      ? `${pick(JOB_TITLES)} at ${pick(COMPANIES)}`
      : u.role === 'faculty'
      ? `Professor of ${u.dept} | Researcher`
      : `Administrator | ${u.dept}`;

    await q('users', `
      INSERT INTO profiles (id, "userId", email, "firstName", "lastName", role, avatar, department, "graduationYear",
        bio, headline, location, skills, interests, experience, education, "openToWork", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)
      ON CONFLICT (id) DO NOTHING
    `, [
      uuid(), u.id, u.email, u.firstName, u.lastName, u.role, avatar, u.dept, u.gradYear,
      bio, headline, pick(['Colombo, Sri Lanka', 'Kandy', 'Galle', 'Remote', 'New York', 'London', 'Singapore']),
      JSON.stringify(skills), JSON.stringify(interests),
      JSON.stringify(experience), JSON.stringify(education),
      u.role === 'alumni' || u.role === 'student', ago(rand(30, 365))
    ]);
  }
  console.log(`  ✓ ${users.length} profiles created`);

  // ── 3. Connections ──────────────────────────────────────────────────────────
  console.log('Creating connections...');
  let connCount = 0;
  for (let i = 0; i < users.length; i++) {
    const numConns = rand(3, 15);
    const targets = pickN(users.filter((_, j) => j !== i), numConns);
    for (const t of targets) {
      const res = await q('users', `
        INSERT INTO connections (id, "followerId", "followingId", status, "createdAt", "updatedAt")
        VALUES ($1,$2,$3,'accepted',$4,$4)
        ON CONFLICT ("followerId","followingId") DO NOTHING
      `, [uuid(), users[i].id, t.id, ago(rand(1, 200))]);
      if (res) connCount++;
    }
  }
  console.log(`  ✓ ~${connCount} connections created`);

  // ── 4. Posts ────────────────────────────────────────────────────────────────
  console.log('Creating posts in decp_feed...');
  const posts = [];
  const postTypes = ['text', 'text', 'text', 'image', 'image', 'poll'];

  for (let i = 0; i < 300; i++) {
    const u = users[i % users.length];
    const type = postTypes[i % postTypes.length];
    const topic = pick(TOPICS);
    const company = pick(COMPANIES);
    const industry = pick(INDUSTRIES);
    const contentTpl = POST_CONTENTS[i % POST_CONTENTS.length];
    const content = contentTpl
      .replace('{topic}', topic).replace('{topic}', topic)
      .replace('{company}', company).replace('{role}', pick(JOB_TITLES))
      .replace('{industry}', industry).replace('{dept}', u.dept)
      .replace('{field}', pick(DEPARTMENTS));

    const pollOptions = type === 'poll' ? JSON.stringify([
      { text: `Option A: ${pick(TOPICS)}`, votes: pickN(users, rand(2, 15)).map(u => u.id) },
      { text: `Option B: ${pick(TOPICS)}`, votes: pickN(users, rand(2, 15)).map(u => u.id) },
      { text: `Option C: ${pick(TOPICS)}`, votes: pickN(users, rand(1, 10)).map(u => u.id) },
      { text: `Option D: Other approach`, votes: pickN(users, rand(0, 8)).map(u => u.id) },
    ]) : null;

    const mediaUrls = type === 'image' ? JSON.stringify([UNSPLASH_TECH[i % UNSPLASH_TECH.length]]) : JSON.stringify([]);
    const likesCount = rand(0, 120);
    const commentsCount = rand(0, 40);
    const id = uuid();

    const author = JSON.stringify({
      _id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 70) + 1}.jpg`
    });

    await q('feed', `
      INSERT INTO posts (id, "userId", author, content, "mediaUrls", type, likes, comments, shares,
        "isPublic", "pollOptions", "pollEndsAt", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,$12)
      ON CONFLICT (id) DO NOTHING
    `, [
      id, u.id, author, content, mediaUrls, type === 'poll' ? 'poll' : type,
      likesCount, commentsCount, rand(0, 30),
      pollOptions,
      type === 'poll' ? future(rand(3, 14)) : null,
      ago(rand(0, 180))
    ]);

    posts.push({ id, userId: u.id });
  }
  console.log(`  ✓ ${posts.length} posts created`);

  // ── 5. Likes ────────────────────────────────────────────────────────────────
  console.log('Creating likes...');
  const reactions = ['like', 'love', 'celebrate', 'insightful', 'curious'];
  let likeCount = 0;
  for (const post of posts) {
    const likers = pickN(users, rand(2, 20));
    for (const liker of likers) {
      const res = await q('feed', `
        INSERT INTO likes (id, "postId", "userId", "reactionType", "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$5)
        ON CONFLICT ("postId","userId") DO NOTHING
      `, [uuid(), post.id, liker.id, pick(reactions), ago(rand(0, 90))]);
      if (res) likeCount++;
    }
  }
  console.log(`  ✓ ~${likeCount} likes created`);

  // ── 6. Comments ──────────────────────────────────────────────────────────────
  console.log('Creating comments...');
  let commentCount = 0;
  for (const post of posts.slice(0, 200)) {
    const numComments = rand(0, 8);
    const commenters = pickN(users, numComments);
    for (const commenter of commenters) {
      const tpl = COMMENT_TEMPLATES[rand(0, COMMENT_TEMPLATES.length - 1)];
      const content = tpl
        .replace('{topic}', pick(TOPICS))
        .replace('{company}', pick(COMPANIES))
        .replace('{field}', pick(DEPARTMENTS));

      const author = JSON.stringify({
        _id: commenter.id,
        firstName: commenter.firstName,
        lastName: commenter.lastName,
        role: commenter.role
      });

      const res = await q('feed', `
        INSERT INTO comments (id, "postId", "userId", author, content, "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$6)
        ON CONFLICT (id) DO NOTHING
      `, [uuid(), post.id, commenter.id, author, content, ago(rand(0, 90))]);
      if (res) commentCount++;
    }
  }
  console.log(`  ✓ ~${commentCount} comments created`);

  // ── 7. Bookmarks ─────────────────────────────────────────────────────────────
  console.log('Creating bookmarks...');
  let bookmarkCount = 0;
  for (let i = 0; i < 100; i++) {
    const u = pick(users);
    const post = pick(posts);
    const res = await q('feed', `
      INSERT INTO bookmarks (id, "postId", "userId", "createdAt")
      VALUES ($1,$2,$3,$4)
      ON CONFLICT ("userId","postId") DO NOTHING
    `, [uuid(), post.id, u.id, ago(rand(0, 60))]);
    if (res) bookmarkCount++;
  }
  console.log(`  ✓ ~${bookmarkCount} bookmarks created`);

  // ── 8. Jobs ──────────────────────────────────────────────────────────────────
  console.log('Creating jobs in decp_jobs...');
  const jobs = [];
  const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  const posters = users.filter(u => u.role === 'alumni' || u.role === 'faculty');

  for (let i = 0; i < 50; i++) {
    const poster = posters[i % posters.length];
    const company = COMPANIES[i % COMPANIES.length];
    const title = JOB_TITLES[i % JOB_TITLES.length];
    const skills = pickN(SKILLS_POOL, rand(3, 6));
    const id = uuid();

    await q('jobs', `
      INSERT INTO jobs (id, title, description, company, location, type, salary, requirements, skills,
        "postedBy", status, "expiresAt", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11,$12,$12)
      ON CONFLICT (id) DO NOTHING
    `, [
      id,
      title,
      `We are looking for a talented ${title} to join our ${company} team. You will work on cutting-edge ${pick(TOPICS)} projects in a collaborative environment. This is an excellent opportunity for ${pick(DEPARTMENTS)} graduates.`,
      company,
      pick(['Remote', 'New York, NY', 'San Francisco, CA', 'London, UK', 'Singapore', 'Colombo, Sri Lanka', 'Bangalore, India']),
      jobTypes[i % jobTypes.length],
      JSON.stringify({ min: rand(50, 80) * 1000, max: rand(100, 200) * 1000, currency: 'USD', period: 'yearly' }),
      JSON.stringify([
        `${rand(1, 5)}+ years experience in ${skills[0]}`,
        `Strong understanding of ${skills[1]} fundamentals`,
        `Experience with ${pick(['Agile', 'Scrum', 'Kanban'])} methodology`,
        `Excellent communication skills`
      ]),
      JSON.stringify(skills),
      poster.id,
      future(rand(10, 60)),
      ago(rand(1, 30))
    ]);

    jobs.push({ id, postedBy: poster.id });
  }
  console.log(`  ✓ ${jobs.length} jobs created`);

  // ── 9. Job Applications ───────────────────────────────────────────────────────
  console.log('Creating job applications...');
  const appStatuses = ['pending', 'reviewing', 'interview', 'offered', 'rejected'];
  let appCount = 0;
  const applicants = users.filter(u => u.role === 'student' || u.role === 'alumni');

  for (const job of jobs) {
    const numApps = rand(2, 8);
    const appliers = pickN(applicants, numApps);
    for (const app of appliers) {
      if (app.id === job.postedBy) continue;
      const res = await q('jobs', `
        INSERT INTO applications (id, "jobId", "userId", "coverLetter", status, "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$6)
        ON CONFLICT ("jobId","userId") DO NOTHING
      `, [
        uuid(), job.id, app.id,
        `I am very excited about this opportunity at your company. My background in ${pick(SKILLS_POOL)} and ${pick(SKILLS_POOL)} makes me an ideal candidate. I am passionate about ${pick(TOPICS)} and have been working on related projects. I would love to contribute to your team.`,
        pick(appStatuses),
        ago(rand(1, 20))
      ]);
      if (res) appCount++;
    }
  }
  console.log(`  ✓ ~${appCount} job applications created`);

  // ── 10. Events ────────────────────────────────────────────────────────────────
  console.log('Creating events in decp_events...');
  const evtTypes = ['webinar', 'workshop', 'seminar', 'networking', 'career_fair', 'other'];
  const organizers = users.filter(u => u.role === 'faculty' || u.role === 'admin' || u.role === 'alumni');
  const events = [];

  for (let i = 0; i < EVENT_TITLES.length; i++) {
    const org = organizers[i % organizers.length];
    const id = uuid();
    const daysOffset = rand(-10, 60);
    const start = daysOffset > 0 ? future(daysOffset) : ago(-daysOffset);
    const end = new Date(start.getTime() + rand(2, 8) * 3600000);
    const isVirtual = Math.random() > 0.4;

    await q('events', `
      INSERT INTO events (id, title, description, type, "startDate", "endDate", location, "isVirtual",
        "meetingLink", "organizerId", capacity, "imageUrl", "coverImage", status, tags, "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,'published',$13,$14,$14)
      ON CONFLICT (id) DO NOTHING
    `, [
      id,
      EVENT_TITLES[i],
      `Join us for an engaging ${evtTypes[i % evtTypes.length]} on ${pick(TOPICS)}. This event brings together students, alumni, and industry professionals to share knowledge and network. Don't miss this opportunity to learn from experts and expand your professional network.`,
      evtTypes[i % evtTypes.length],
      start, end,
      isVirtual ? null : pick(['Main Auditorium', 'Conference Hall A', 'Lab 201', 'Innovation Hub']),
      isVirtual,
      isVirtual ? 'https://zoom.us/j/meeting-link' : null,
      org.id,
      rand(50, 300),
      UNSPLASH_TECH[(i + 5) % UNSPLASH_TECH.length],
      JSON.stringify(pickN(TOPICS, rand(2, 4))),
      ago(rand(1, 30))
    ]);

    events.push({ id, organizerId: org.id });
  }
  console.log(`  ✓ ${events.length} events created`);

  // ── 11. RSVPs ────────────────────────────────────────────────────────────────
  console.log('Creating RSVPs...');
  const rsvpStatuses = ['going', 'going', 'going', 'maybe', 'not_going'];
  let rsvpCount = 0;
  for (const evt of events) {
    const attendees = pickN(users, rand(5, 30));
    for (const att of attendees) {
      const res = await q('events', `
        INSERT INTO rsvps (id, "eventId", "userId", status, "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$5)
        ON CONFLICT ("eventId","userId") DO NOTHING
      `, [uuid(), evt.id, att.id, pick(rsvpStatuses), ago(rand(0, 20))]);
      if (res) rsvpCount++;
    }
  }
  console.log(`  ✓ ~${rsvpCount} RSVPs created`);

  // ── 12. Research Projects ─────────────────────────────────────────────────────
  console.log('Creating research projects...');
  const researchers = users.filter(u => u.role === 'faculty' || u.role === 'alumni');
  const researchStatuses = ['planning', 'active', 'active', 'active', 'completed', 'on_hold'];
  const researchFields = ['Computer Science', 'AI/ML', 'Cybersecurity', 'Data Science', 'IoT', 'Bioinformatics'];

  for (let i = 0; i < RESEARCH_TITLES.length; i++) {
    const lead = researchers[i % researchers.length];
    const collabs = pickN(users, rand(2, 6)).map(u => u.id);

    await q('research', `
      INSERT INTO research_projects (id, title, abstract, description, status, "startDate", "endDate",
        "leadResearcherId", collaborators, tags, visibility, progress, field, "coverImage", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'public',$11,$12,$13,$14,$14)
      ON CONFLICT (id) DO NOTHING
    `, [
      uuid(),
      RESEARCH_TITLES[i],
      `This research investigates ${RESEARCH_TITLES[i].toLowerCase()}. Our approach combines state-of-the-art techniques with novel methodologies to address key challenges in the field. We aim to publish our findings in top-tier conferences and journals.`,
      `Detailed description: Our team is exploring ${pick(TOPICS)} through a combination of theoretical analysis and empirical experimentation. The project involves data collection, model development, and rigorous evaluation.`,
      researchStatuses[i % researchStatuses.length],
      ago(rand(30, 365)),
      Math.random() > 0.5 ? future(rand(30, 180)) : null,
      lead.id,
      JSON.stringify(collabs),
      JSON.stringify(pickN(TOPICS, rand(2, 5))),
      rand(10, 95),
      pick(researchFields),
      UNSPLASH_TECH[(i + 10) % UNSPLASH_TECH.length],
      ago(rand(10, 200))
    ]);
  }
  console.log(`  ✓ ${RESEARCH_TITLES.length} research projects created`);

  // ── 13. Conversations & Messages ──────────────────────────────────────────────
  console.log('Creating conversations & messages in decp_messaging...');
  const conversations = [];
  let msgCount = 0;

  // Direct conversations
  for (let i = 0; i < 60; i++) {
    const u1 = users[i];
    const u2 = users[(i + rand(1, 50)) % users.length];
    if (u1.id === u2.id) continue;
    const id = uuid();

    await q('messaging', `
      INSERT INTO conversations (id, type, participants, "createdBy", "createdAt", "updatedAt")
      VALUES ($1,'direct',$2,$3,$4,$4)
      ON CONFLICT (id) DO NOTHING
    `, [id, JSON.stringify([u1.id, u2.id]), u1.id, ago(rand(1, 60))]);

    conversations.push({ id, participants: [u1, u2] });
  }

  // Group conversations
  const groupNames = [
    'CS Final Year Group', 'Machine Learning Study Group', 'Hackathon Team Alpha',
    'Research Collaboration', 'Job Hunt Squad', 'Data Science Club', 'Alumni Network',
    'Capstone Project Team', 'IEEE Student Chapter', 'Startup Founders'
  ];
  for (let i = 0; i < 10; i++) {
    const members = pickN(users, rand(3, 8));
    const id = uuid();
    await q('messaging', `
      INSERT INTO conversations (id, type, title, participants, "createdBy", "createdAt", "updatedAt")
      VALUES ($1,'group',$2,$3,$4,$5,$5)
      ON CONFLICT (id) DO NOTHING
    `, [id, groupNames[i], JSON.stringify(members.map(m => m.id)), members[0].id, ago(rand(1, 60))]);
    conversations.push({ id, participants: members });
  }

  // Messages in each conversation
  for (const conv of conversations) {
    const numMsgs = rand(2, 10);
    for (let m = 0; m < numMsgs; m++) {
      const sender = pick(conv.participants);
      const tpl = MSG_TEMPLATES[rand(0, MSG_TEMPLATES.length - 1)];
      const content = tpl
        .replace('{topic}', pick(TOPICS))
        .replace('{skill}', pick(SKILLS_POOL))
        .replace('{company}', pick(COMPANIES));

      const res = await q('messaging', `
        INSERT INTO messages (id, "conversationId", "senderId", content, type, "isDeleted", "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,'text',false,$5,$5)
        ON CONFLICT (id) DO NOTHING
      `, [uuid(), conv.id, sender.id, content, ago(rand(0, 30))]);
      if (res) msgCount++;
    }
  }
  console.log(`  ✓ ${conversations.length} conversations, ~${msgCount} messages created`);

  // ── 14. Notifications ─────────────────────────────────────────────────────────
  console.log('Creating notifications in decp_notifications...');
  const notifTypes = ['message', 'connection', 'job', 'event', 'mention', 'system'];
  let notifCount = 0;

  for (let i = 0; i < 300; i++) {
    const recipient = users[i % users.length];
    const actor = users[(i + rand(1, 50)) % users.length];
    const type = notifTypes[i % notifTypes.length];
    const job = jobs[i % jobs.length];
    const event = events[i % events.length];

    let title, body, data;
    switch (type) {
      case 'connection':
        title = `${actor.firstName} ${actor.lastName} accepted your connection request`;
        body = `You and ${actor.firstName} are now connected. Check their profile!`;
        data = { fromUserId: actor.id, fromUserName: `${actor.firstName} ${actor.lastName}` };
        break;
      case 'message':
        title = `New message from ${actor.firstName} ${actor.lastName}`;
        body = `${actor.firstName} sent you a message: "${pick(['Hey!', 'How are you?', 'Let\'s connect!', 'Great post!'])}"`;
        data = { fromUserId: actor.id, fromUserName: `${actor.firstName} ${actor.lastName}` };
        break;
      case 'job':
        title = `New job opportunity: ${pick(JOB_TITLES)} at ${pick(COMPANIES)}`;
        body = `A job matching your profile has been posted. Apply now!`;
        data = { jobId: job.id };
        break;
      case 'event':
        title = `Upcoming event: ${pick(EVENT_TITLES)}`;
        body = `An event you might be interested in is happening soon. Register now!`;
        data = { eventId: event.id };
        break;
      case 'mention':
        title = `${actor.firstName} ${actor.lastName} mentioned you in a post`;
        body = `${actor.firstName} tagged you in a post about ${pick(TOPICS)}.`;
        data = { fromUserId: actor.id, postId: pick(posts).id };
        break;
      default:
        title = `Welcome to DECP Platform!`;
        body = `Your profile is complete. Start connecting with peers and exploring opportunities.`;
        data = { type: 'welcome' };
    }

    const res = await q('notifications', `
      INSERT INTO notifications (id, "userId", type, title, body, data, "isRead", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
      ON CONFLICT (id) DO NOTHING
    `, [
      uuid(), recipient.id, type, title, body,
      JSON.stringify(data),
      Math.random() > 0.6,
      ago(rand(0, 30))
    ]);
    if (res) notifCount++;
  }
  console.log(`  ✓ ~${notifCount} notifications created`);

  // ── Done ──────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('=================');
  console.log('Summary:');
  console.log(`  Users:         200`);
  console.log(`  Profiles:      200`);
  console.log(`  Connections:   ~${connCount}`);
  console.log(`  Posts:         ${posts.length}`);
  console.log(`  Likes:         ~${likeCount}`);
  console.log(`  Comments:      ~${commentCount}`);
  console.log(`  Bookmarks:     ~${bookmarkCount}`);
  console.log(`  Jobs:          ${jobs.length}`);
  console.log(`  Applications:  ~${appCount}`);
  console.log(`  Events:        ${events.length}`);
  console.log(`  RSVPs:         ~${rsvpCount}`);
  console.log(`  Research:      ${RESEARCH_TITLES.length}`);
  console.log(`  Conversations: ${conversations.length}`);
  console.log(`  Messages:      ~${msgCount}`);
  console.log(`  Notifications: ~${notifCount}`);
  console.log('\nAll users can login with password: Password123!');

  // Close all connections
  for (const p of Object.values(pools)) await p.end();
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.detail) console.error('  Detail:', err.detail);
  if (err.hint) console.error('  Hint:', err.hint);
  process.exit(1);
});
