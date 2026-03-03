/**
 * DECP Platform — Database Seed Script
 * Run with:  node seed.js
 * Requires:  All services running (run start.bat first)
 */

const http = require('http');

const BASE = 'http://localhost:3000/api/v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const get  = (path, token)        => request('GET',    path, null,  token);
const post = (path, body, token)   => request('POST',   path, body,  token);
const put  = (path, body, token)   => request('PUT',    path, body,  token);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function log(msg) { process.stdout.write(`  ${msg}\n`); }
function ok(msg)  { process.stdout.write(`  \x1b[32m✔\x1b[0m ${msg}\n`); }
function warn(msg){ process.stdout.write(`  \x1b[33m⚠\x1b[0m ${msg}\n`); }
function err(msg) { process.stdout.write(`  \x1b[31m✗\x1b[0m ${msg}\n`); }

// ─── User Definitions ────────────────────────────────────────────────────────

const USERS = [
  {
    email: 'admin@decp.edu', password: 'Admin1234x',
    firstName: 'System', lastName: 'Admin', role: 'admin',
    profile: {
      bio: 'Platform administrator for DECP. Responsible for managing the department engagement and career platform.',
      headline: 'Platform Administrator',
      department: 'Computer Science',
      location: 'University Campus',
      skills: ['System Administration', 'Platform Management', 'Data Analytics'],
    },
  },
  {
    email: 'prof.james@decp.edu', password: 'Pass1234x',
    firstName: 'James', lastName: 'Wilson', role: 'faculty',
    profile: {
      bio: 'Professor of Computer Science with 15 years of teaching and research experience. Specialising in machine learning and distributed systems.',
      headline: 'Professor of Computer Science | ML & Distributed Systems',
      department: 'Computer Science',
      location: 'Building A, Room 204',
      skills: ['Machine Learning', 'Distributed Systems', 'Python', 'TensorFlow', 'Research'],
      socialLinks: { linkedin: 'https://linkedin.com', github: 'https://github.com' },
    },
  },
  {
    email: 'prof.sarah@decp.edu', password: 'Pass1234x',
    firstName: 'Sarah', lastName: 'Chen', role: 'faculty',
    profile: {
      bio: 'Data Science faculty member passionate about statistical learning and big data technologies. Lead researcher on the department\'s AI initiatives.',
      headline: 'Associate Professor | Data Science & AI',
      department: 'Data Science',
      location: 'Building B, Room 110',
      skills: ['Data Science', 'R', 'Python', 'Statistical Learning', 'Big Data', 'Spark'],
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
  },
  {
    email: 'prof.michael@decp.edu', password: 'Pass1234x',
    firstName: 'Michael', lastName: 'Brown', role: 'faculty',
    profile: {
      bio: 'Software Engineering faculty. Industry experience at Google before joining academia. Focus on software architecture and agile methodologies.',
      headline: 'Senior Lecturer | Software Engineering',
      department: 'Software Engineering',
      location: 'Building C, Room 305',
      skills: ['Software Architecture', 'Agile', 'Java', 'Microservices', 'Cloud Computing'],
      socialLinks: { linkedin: 'https://linkedin.com', github: 'https://github.com' },
    },
  },
  {
    email: 'alice.student@decp.edu', password: 'Pass1234x',
    firstName: 'Alice', lastName: 'Johnson', role: 'student',
    profile: {
      bio: 'Final-year Computer Science student passionate about AI and web development. Looking for software engineering internships.',
      headline: 'CS Student | Aspiring Software Engineer',
      department: 'Computer Science',
      location: 'Student Residences',
      graduationYear: 2025,
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Machine Learning'],
      socialLinks: { linkedin: 'https://linkedin.com', github: 'https://github.com' },
    },
  },
  {
    email: 'bob.student@decp.edu', password: 'Pass1234x',
    firstName: 'Bob', lastName: 'Martinez', role: 'student',
    profile: {
      bio: 'Third-year Data Science student with a keen interest in natural language processing and data visualisation.',
      headline: 'Data Science Student | NLP Enthusiast',
      department: 'Data Science',
      location: 'Student Residences',
      graduationYear: 2026,
      skills: ['Python', 'NLP', 'Pandas', 'Data Visualisation', 'SQL'],
      socialLinks: { github: 'https://github.com' },
    },
  },
  {
    email: 'carol.student@decp.edu', password: 'Pass1234x',
    firstName: 'Carol', lastName: 'Williams', role: 'student',
    profile: {
      bio: 'Second-year Software Engineering student. Open source contributor and tech community advocate.',
      headline: 'SE Student | Open Source Contributor',
      department: 'Software Engineering',
      location: 'Student Residences',
      graduationYear: 2027,
      skills: ['TypeScript', 'React', 'Docker', 'Git', 'CI/CD'],
      socialLinks: { github: 'https://github.com', twitter: 'https://twitter.com' },
    },
  },
  {
    email: 'dan.student@decp.edu', password: 'Pass1234x',
    firstName: 'Dan', lastName: 'Taylor', role: 'student',
    profile: {
      bio: 'Final-year CS student with interests in cybersecurity and network engineering. Active in the department\'s security club.',
      headline: 'CS Student | Cybersecurity Enthusiast',
      department: 'Computer Science',
      location: 'Student Residences',
      graduationYear: 2025,
      skills: ['Cybersecurity', 'Networking', 'Linux', 'Python', 'Ethical Hacking'],
    },
  },
  {
    email: 'david.alumni@decp.edu', password: 'Pass1234x',
    firstName: 'David', lastName: 'Lee', role: 'alumni',
    profile: {
      bio: 'Software Engineer at Google. DECP CS graduate, Class of 2020. Happy to mentor current students and share job opportunities.',
      headline: 'Software Engineer @ Google | CS Alumni 2020',
      department: 'Computer Science',
      location: 'San Francisco, CA',
      graduationYear: 2020,
      skills: ['Go', 'Kubernetes', 'Cloud Architecture', 'System Design', 'Mentoring'],
      socialLinks: { linkedin: 'https://linkedin.com', github: 'https://github.com' },
    },
  },
  {
    email: 'emma.alumni@decp.edu', password: 'Pass1234x',
    firstName: 'Emma', lastName: 'Davis', role: 'alumni',
    profile: {
      bio: 'Product Manager at Microsoft. SE graduate Class of 2019. I love connecting with students and sharing career advice.',
      headline: 'Product Manager @ Microsoft | SE Alumni 2019',
      department: 'Software Engineering',
      location: 'Seattle, WA',
      graduationYear: 2019,
      skills: ['Product Management', 'Agile', 'UX Research', 'Roadmapping', 'Leadership'],
      socialLinks: { linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    },
  },
  {
    email: 'frank.alumni@decp.edu', password: 'Pass1234x',
    firstName: 'Frank', lastName: 'Zhang', role: 'alumni',
    profile: {
      bio: 'Data Scientist at Stripe. DS graduate Class of 2021. Interested in fintech, ML infrastructure, and helping students break into the industry.',
      headline: 'Data Scientist @ Stripe | DS Alumni 2021',
      department: 'Data Science',
      location: 'New York, NY',
      graduationYear: 2021,
      skills: ['Machine Learning', 'Python', 'SQL', 'MLOps', 'Financial Data'],
      socialLinks: { linkedin: 'https://linkedin.com', github: 'https://github.com', twitter: 'https://twitter.com' },
    },
  },
];

// ─── Content definitions ─────────────────────────────────────────────────────

const POSTS = [
  { userIdx: 1, content: '🎉 Excited to announce that our Machine Learning elective has just been updated with a new module on Large Language Models! Students will get hands-on experience with transformer architectures and fine-tuning techniques. Check the course portal for updated materials.' },
  { userIdx: 4, content: 'Just finished my first end-to-end ML project — a sentiment analyser for student feedback forms! Used BERT for classification and achieved 94% accuracy on the test set. The preprocessing pipeline was the real challenge 😅 Happy to share the GitHub repo with anyone interested. #MachineLearning #NLP #StudentProject' },
  { userIdx: 8, content: 'Big news — I just accepted an offer from Google as a Software Engineer! 🚀 Couldn\'t have done it without the amazing mentors in this department and the alumni network. If anyone wants tips on the Google interview process, feel free to DM me!' },
  { userIdx: 2, content: 'Reminder: Office hours for Data Science 301 are now on Tuesdays 2–4pm AND Thursdays 10am–12pm. Feel free to drop by with questions on your project proposals. Looking forward to seeing everyone\'s topic ideas this semester!' },
  { userIdx: 5, content: 'Working on a data visualisation dashboard for my capstone project using React + D3.js. The hardest part? Making it actually look good 😂 Any recommendations for colour palettes that work well for data-heavy UIs? #DataViz #FrontendDevelopment' },
  { userIdx: 9, content: '📢 We\'re hiring at Microsoft! Looking for Product Manager interns and new grad SWEs. Especially looking for candidates with strong communication skills and CS fundamentals. Check the Jobs section — I\'ve posted the details there. Great opportunity for final-year students!' },
  { userIdx: 3, content: 'Congrats to our software engineering students who completed the Agile Sprint project last week! The demos were impressive — real-world problem solving, cross-functional teams, and some genuinely innovative solutions. This is what project-based learning looks like 💪' },
  { userIdx: 6, content: 'Just got back from the ACM conference on computer security. Presented our paper on adversarial attacks in IoT networks. The feedback was really encouraging — definitely motivating me to pursue a PhD in cybersecurity after graduation. #AcademicConference #Cybersecurity' },
  { userIdx: 10, content: 'The alumni mentorship programme is off to a great start this semester! Matched with two final-year students and we\'ve already had two great sessions. If you\'re a student looking for career guidance, sign up through the platform. If you\'re alumni — please consider giving back! 🙏' },
  { userIdx: 1, content: '🔬 The new research collaboration platform is live! Faculty and students can now create research projects and invite collaborators directly through the platform. Check out the Research section and explore the current projects looking for student contributors.' },
  { userIdx: 4, content: 'Debugging session gone wrong → my "quick fix" turned into a 4-hour deep dive into React rendering optimisation. Reduced re-renders by 60% using useMemo and useCallback. The profiler tool in React DevTools is genuinely amazing. Lesson learned: profile first, optimise second. #React #Performance' },
  { userIdx: 2, content: 'New research paper published in IEEE Transactions: "Federated Learning with Differential Privacy for Healthcare Data". Co-authored with two amazing PhD students from our department. Proud of the team! Full paper in the Research section 📄' },
  { userIdx: 7, content: 'Networking tip that actually worked for me: instead of asking for a job, ask for a 15-minute call to learn about their career path. 80% of my outreach got responses this way. Now working at Stripe thanks to a cold message to a DECP alumnus! The alumni community here is gold. 🙌' },
  { userIdx: 5, content: 'Monthly student coding challenge results are in! 🏆 Congratulations to everyone who participated. Special shoutout to the top 3 teams — your dynamic programming solutions were elegant. Next challenge drops in two weeks, theme: graph algorithms!' },
  { userIdx: 3, content: 'Teaching tip: replace "any questions?" with "what was the most confusing part?" You\'ll get 10x more engagement. Tried this in today\'s lecture on microservices architecture and the discussion was fantastic. Students asked questions about Docker Compose configs I hadn\'t thought to explain explicitly!' },
];

const JOBS = [
  {
    userIdx: 8, // David @ Google
    job: {
      title: 'Software Engineer — New Grad',
      company: 'Google',
      location: 'Mountain View, CA (Hybrid)',
      type: 'full-time',
      description: 'Join Google\'s core infrastructure team as a new graduate software engineer. You\'ll work on distributed systems that serve billions of users, collaborate with world-class engineers, and contribute to open-source projects. We offer competitive compensation, excellent benefits, and a culture of learning and innovation.',
      requirements: ['Bachelor\'s or Master\'s in CS or related field', 'Strong understanding of data structures and algorithms', 'Experience with at least one systems programming language (Go, C++, Java)', 'Familiarity with distributed systems concepts'],
      skills: ['Go', 'C++', 'Distributed Systems', 'Algorithms'],
      salary: { min: 120000, max: 160000, currency: 'USD', period: 'yearly' },
    },
  },
  {
    userIdx: 9, // Emma @ Microsoft
    job: {
      title: 'Product Manager Intern',
      company: 'Microsoft',
      location: 'Seattle, WA (Hybrid)',
      type: 'internship',
      description: 'Join Microsoft\'s Azure team as a PM intern. You\'ll define product requirements, work with engineering and design teams, and ship features used by millions of developers worldwide. This is a 12-week programme with potential for return offers.',
      requirements: ['Currently pursuing a degree in CS, Business or related field', 'Strong analytical and communication skills', 'Experience with product thinking or UX research', 'Passion for developer tools and cloud computing'],
      skills: ['Product Management', 'Agile', 'Communication', 'UX Research'],
    },
  },
  {
    userIdx: 9, // Emma @ Microsoft
    job: {
      title: 'Software Development Engineer II',
      company: 'Microsoft',
      location: 'Redmond, WA',
      type: 'full-time',
      description: 'We\'re looking for experienced engineers to join the Microsoft 365 team. You\'ll build features for Word, Excel, and PowerPoint — products used by over a billion people. Strong ownership culture with excellent career growth opportunities.',
      requirements: ['3+ years of software development experience', 'Proficiency in C# or TypeScript', 'Experience with large-scale web applications', 'Excellent problem-solving skills'],
      skills: ['C#', 'TypeScript', 'Azure', 'React', 'Web APIs'],
      salary: { min: 140000, max: 200000, currency: 'USD', period: 'yearly' },
    },
  },
  {
    userIdx: 10, // Frank @ Stripe
    job: {
      title: 'Data Scientist',
      company: 'Stripe',
      location: 'Remote',
      type: 'remote',
      description: 'Stripe\'s data science team turns financial data into insights that help millions of businesses grow. You\'ll build ML models for fraud detection, revenue optimisation, and risk assessment. The role involves close collaboration with product and engineering.',
      requirements: ['Master\'s or PhD in Statistics, Mathematics or CS', 'Strong proficiency in Python and SQL', 'Experience with ML frameworks (scikit-learn, XGBoost, PyTorch)', 'Experience with production ML pipelines'],
      skills: ['Python', 'SQL', 'Machine Learning', 'MLOps', 'Statistical Analysis'],
      salary: { min: 130000, max: 180000, currency: 'USD', period: 'yearly' },
    },
  },
  {
    userIdx: 10, // Frank @ Stripe
    job: {
      title: 'Machine Learning Engineer Intern',
      company: 'Stripe',
      location: 'New York, NY (Hybrid)',
      type: 'internship',
      description: 'Join Stripe\'s ML team for a summer internship building real ML systems at scale. You\'ll work on fraud detection, risk scoring, or recommendation systems — real impact from day one.',
      requirements: ['Strong Python skills', 'Coursework in machine learning or statistics', 'Experience with at least one ML framework', 'Strong mathematical foundation'],
      skills: ['Python', 'PyTorch', 'SQL', 'Data Analysis'],
    },
  },
  {
    userIdx: 1, // James (faculty posting an academic opening)
    job: {
      title: 'Research Assistant — Machine Learning Lab',
      company: 'University CS Department',
      location: 'On Campus',
      type: 'part-time',
      description: 'The ML research group is recruiting research assistants for the upcoming academic year. RAs will contribute to ongoing projects in federated learning and privacy-preserving ML. Flexible hours, mentorship, and co-authorship opportunities on publications.',
      requirements: ['Currently enrolled in CS or Data Science programme', 'GPA 3.5 or above', 'Completed courses in Machine Learning and Statistics', 'Python proficiency'],
      skills: ['Python', 'TensorFlow', 'Research', 'Machine Learning'],
    },
  },
  {
    userIdx: 8, // David alumni
    job: {
      title: 'Backend Engineer — Infrastructure',
      company: 'Google',
      location: 'London, UK',
      type: 'full-time',
      description: 'Google\'s London office is expanding the infrastructure team. Work on services handling petabyte-scale data, improve reliability and performance of distributed storage systems, and contribute to Google\'s open-source infrastructure projects.',
      requirements: ['3+ years backend engineering experience', 'Strong systems programming skills', 'Experience with distributed databases or storage systems', 'Excellent English communication skills'],
      skills: ['Go', 'C++', 'Bigtable', 'Spanner', 'Performance Engineering'],
      salary: { min: 80000, max: 130000, currency: 'GBP', period: 'yearly' },
    },
  },
];

const EVENTS = [
  {
    userIdx: 1, // James
    event: {
      title: 'Machine Learning Career Panel — Industry Insights',
      description: 'Join us for an evening with ML practitioners from Google, Stripe, and DeepMind. Panellists will share their career paths, discuss the current AI job market, and answer your questions on breaking into ML roles. All students welcome!',
      type: 'seminar',
      startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000 + 7200000).toISOString(),
      location: 'Main Auditorium, Building A',
      isOnline: false,
      capacity: 150,
    },
  },
  {
    userIdx: 2, // Sarah
    event: {
      title: 'Introduction to Tableau & Power BI — Workshop',
      description: 'A hands-on workshop covering data visualisation with Tableau and Power BI. Bring your laptop — we\'ll work through real datasets together. Perfect for students working on data-heavy projects or looking to add BI tools to their CV.',
      type: 'workshop',
      startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 3 * 86400000 + 10800000).toISOString(),
      location: 'Computer Lab 2, Building B',
      isOnline: false,
      capacity: 40,
    },
  },
  {
    userIdx: 0, // Admin
    event: {
      title: 'Annual CS Department Career Fair 2025',
      description: 'The biggest career event of the year! Over 30 companies attending including Google, Microsoft, Amazon, Stripe, and many local tech firms. Bring printed CVs and be ready for on-the-spot interviews. Career services will run CV review sessions on the day.',
      type: 'career_fair',
      startDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 14 * 86400000 + 28800000).toISOString(),
      location: 'Main Hall, Student Union Building',
      isOnline: false,
      capacity: 500,
    },
  },
  {
    userIdx: 3, // Michael
    event: {
      title: 'Agile & Scrum Certification Webinar',
      description: 'Free online webinar covering Agile methodologies and Scrum framework. We\'ll go through roles, ceremonies, and artefacts, with practical examples from real software projects. Certificate of attendance provided.',
      type: 'webinar',
      startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 5 * 86400000 + 5400000).toISOString(),
      isOnline: true,
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      capacity: 200,
    },
  },
  {
    userIdx: 1, // James
    event: {
      title: 'Research Symposium — Student Presentations',
      description: 'Annual student research showcase. Final-year students and postgraduates present their research projects to faculty, industry guests, and peers. Prizes for best presentation in each category. Great networking opportunity!',
      type: 'seminar',
      startDate: new Date(Date.now() + 21 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 21 * 86400000 + 18000000).toISOString(),
      location: 'Conference Hall, Building A',
      isOnline: false,
      capacity: 200,
    },
  },
  {
    userIdx: 2, // Sarah
    event: {
      title: 'Python for Data Science — Beginner Workshop',
      description: 'Starting your data science journey? This workshop covers Python basics through to pandas and matplotlib. No prior Python experience required! Bring your laptop with Anaconda pre-installed.',
      type: 'workshop',
      startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 10 * 86400000 + 10800000).toISOString(),
      location: 'Computer Lab 1, Building B',
      isOnline: false,
      capacity: 35,
    },
  },
  {
    userIdx: 0, // Admin
    event: {
      title: 'Alumni Networking Night',
      description: 'An informal evening bringing together current students and DECP alumni. Come prepared with questions, share experiences, and build your professional network. Refreshments provided. This is one of the most valuable events of the academic year!',
      type: 'networking',
      startDate: new Date(Date.now() + 18 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 18 * 86400000 + 10800000).toISOString(),
      location: 'Faculty Lounge, Building A',
      isOnline: false,
      capacity: 80,
    },
  },
  {
    userIdx: 3, // Michael
    event: {
      title: 'Docker & Kubernetes for Developers — Live Session',
      description: 'Online session covering containerisation with Docker and orchestration with Kubernetes. We\'ll deploy a sample microservices app from scratch. Intermediate-level — some CLI experience expected.',
      type: 'webinar',
      startDate: new Date(Date.now() + 8 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 8 * 86400000 + 7200000).toISOString(),
      isOnline: true,
      meetingLink: 'https://zoom.us/j/123456789',
      capacity: 100,
    },
  },
];

const RESEARCH = [
  {
    userIdx: 1, // James
    project: {
      title: 'Privacy-Preserving Federated Learning for Healthcare Data',
      abstract: 'This project investigates federated learning techniques combined with differential privacy to enable collaborative model training on sensitive medical datasets without sharing raw patient data.',
      description: 'Traditional centralised machine learning requires data aggregation, which poses privacy risks, especially in healthcare. Our research explores federated learning frameworks where models are trained locally on distributed data and only model updates are shared. We further apply differential privacy mechanisms to prevent membership inference attacks.',
      status: 'active',
      startDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
      tags: ['Federated Learning', 'Differential Privacy', 'Healthcare AI', 'Machine Learning'],
      visibility: 'public',
    },
  },
  {
    userIdx: 1, // James
    project: {
      title: 'Efficient Transformer Architectures for Edge Computing',
      abstract: 'Investigating model compression and distillation techniques to deploy large language models on resource-constrained edge devices while maintaining performance.',
      description: 'Large language models have shown remarkable capabilities but their deployment is restricted by computational requirements. This project focuses on knowledge distillation, quantisation, and pruning techniques to create compact transformer models suitable for edge deployment.',
      status: 'active',
      startDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
      tags: ['Transformers', 'Edge Computing', 'Model Compression', 'NLP'],
      visibility: 'public',
    },
  },
  {
    userIdx: 2, // Sarah
    project: {
      title: 'Explainable AI for Credit Risk Assessment',
      abstract: 'Developing interpretable machine learning models for credit scoring that provide transparent and auditable decision explanations for regulatory compliance.',
      description: 'Regulatory requirements increasingly demand explainability in AI-driven financial decisions. This project combines gradient boosting models with SHAP (SHapley Additive exPlanations) to provide feature attribution scores, enabling credit officers to understand and validate model predictions.',
      status: 'active',
      startDate: new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0],
      tags: ['Explainable AI', 'Credit Scoring', 'XAI', 'FinTech', 'SHAP'],
      visibility: 'public',
    },
  },
  {
    userIdx: 2, // Sarah
    project: {
      title: 'Real-Time Anomaly Detection in Streaming Data',
      abstract: 'Online learning algorithms for detecting anomalies in high-velocity streaming data from IoT sensors, enabling real-time fraud detection and infrastructure monitoring.',
      description: 'Traditional batch-based anomaly detection is insufficient for streaming environments where data arrives continuously at high velocity. We develop adaptive online learning algorithms using techniques from the changepoint detection and robust statistics literature.',
      status: 'planning',
      startDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      tags: ['Anomaly Detection', 'Streaming Data', 'IoT', 'Online Learning'],
      visibility: 'public',
    },
  },
  {
    userIdx: 3, // Michael
    project: {
      title: 'Automated Code Review Using Static Analysis and LLMs',
      abstract: 'Combining traditional static analysis tools with large language models to provide intelligent, context-aware code review suggestions that go beyond pattern matching.',
      description: 'Code review is a bottleneck in software development. This project investigates a hybrid approach that combines AST-based static analysis with GPT-style language models to generate review comments that consider code semantics, design patterns, and project context.',
      status: 'active',
      startDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
      tags: ['Code Review', 'LLMs', 'Static Analysis', 'Software Engineering', 'AI'],
      visibility: 'public',
    },
  },
  {
    userIdx: 3, // Michael
    project: {
      title: 'Microservices Migration Patterns and Anti-Patterns',
      abstract: 'Empirical study of organisations migrating from monolithic to microservices architectures, identifying common patterns, pitfalls, and success factors.',
      description: 'Many organisations are undertaking microservices migration but face unexpected challenges around data consistency, service communication, and organisational alignment. This research conducts a systematic literature review supplemented by practitioner interviews to build a pattern catalogue for successful migrations.',
      status: 'completed',
      startDate: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      tags: ['Microservices', 'Software Architecture', 'Migration', 'Cloud Native'],
      visibility: 'public',
    },
  },
];

const CONVERSATIONS = [
  { participantIdxs: [4, 8], messages: [ // Alice ↔ David
    { senderIdx: 8, content: 'Hi Alice! Saw your post about the ML project — really impressive work. How are you finding the job search?' },
    { senderIdx: 4, content: 'Hi David! Thanks so much, means a lot coming from you. Honestly it\'s been tough — lots of applications but not many callbacks yet. Do you have any tips for the Google screening process?' },
    { senderIdx: 8, content: 'Absolutely! The key is practising system design problems early. Don\'t leave it until you get the interview. I\'d recommend designing 2-3 systems per week. Also, LeetCode medium difficulty for coding rounds. What stage are you at?' },
    { senderIdx: 4, content: 'I have an online assessment coming up next week! Trying to balance that with my final year project. The system design advice is really helpful, I\'ll start today.' },
    { senderIdx: 8, content: 'Good luck! You\'ve got this. Feel free to DM me after the OA and I can give you more guidance on the next stages. Happy to do a mock interview too if you want.' },
  ]},
  { participantIdxs: [5, 10], messages: [ // Bob ↔ Frank
    { senderIdx: 10, content: 'Hey Bob! I saw you\'re doing NLP work for your project. I work on similar problems at Stripe — happy to chat and share some resources if useful?' },
    { senderIdx: 5, content: 'That would be amazing, thank you! I\'m working on sentiment analysis for student feedback and I\'m struggling with handling sarcasm and negation correctly. Any advice?' },
    { senderIdx: 10, content: 'Ah, that\'s a classic challenge! BERT-based models generally handle it much better than traditional approaches. Have you tried fine-tuning a pre-trained model on a small labelled dataset? I can share a colab notebook we used internally.' },
    { senderIdx: 5, content: 'Yes please! I\'ve been using VADER so far but the accuracy is disappointing. Would love to try fine-tuning BERT.' },
    { senderIdx: 10, content: 'Perfect, I\'ll prepare a simplified version of our pipeline. Also consider looking at the SST-2 dataset for pre-training before fine-tuning on your domain data. Will send you the link tomorrow.' },
  ]},
  { participantIdxs: [6, 9], messages: [ // Carol ↔ Emma
    { senderIdx: 9, content: 'Carol! Loved your contribution to the open source project you mentioned. Product managers at Microsoft actually love candidates who have OSS contributions — it shows initiative and collaboration skills.' },
    { senderIdx: 6, content: 'Oh wow, good to know! I always thought PM roles were mainly for business students. Is CS background actually helpful for PM?' },
    { senderIdx: 9, content: 'Absolutely — at Microsoft, being technical gives you huge credibility with engineers. You can participate meaningfully in design reviews, estimate complexity, and earn trust much faster.' },
    { senderIdx: 6, content: 'That\'s reassuring! I\'ve been considering both SWE and PM tracks for internships. How did you decide to go into PM rather than engineering?' },
    { senderIdx: 9, content: 'Great question. I realised I got more energy from defining WHAT to build rather than HOW. If you love customer problems and cross-functional work, PM is fantastic. If you love the craft of code, stick with engineering for a few years first — you can always transition later.' },
  ]},
  { participantIdxs: [1, 4], messages: [ // James ↔ Alice (professor-student)
    { senderIdx: 4, content: 'Professor Wilson, I wanted to ask about the ML research assistant position you posted. Is it too late to apply? I\'m really interested in the federated learning project.' },
    { senderIdx: 1, content: 'Hi Alice! Not too late at all — we\'re still reviewing applications. I\'ve seen your grade in ML301, so you\'d be a strong candidate. Could you send me a short paragraph on why federated learning interests you specifically?' },
    { senderIdx: 4, content: 'Thank you! I\'ll write that up today. I\'m particularly interested because my final project touches on privacy in ML systems — feels like a natural extension. I read the differential privacy paper you published last year.' },
    { senderIdx: 1, content: 'Excellent — referencing that paper in your application would definitely strengthen it. We\'d like someone who can contribute to the experiments section. Strong Python and PyTorch skills are essential. Looking forward to reading your application.' },
  ]},
  { participantIdxs: [2, 5], messages: [ // Sarah ↔ Bob
    { senderIdx: 5, content: 'Hi Professor Chen, I attended your Tableau workshop last week — it was really helpful. I was wondering if you have any recommended resources for learning more advanced visualisation techniques?' },
    { senderIdx: 2, content: 'Glad you found it useful, Bob! For advanced techniques, I recommend Kieran Healy\'s "Data Visualization: A Practical Introduction". Also, the Tidy Tuesday project on GitHub is excellent for practice — real datasets every week.' },
    { senderIdx: 5, content: 'Perfect, I\'ll order the book. For my dissertation I\'m building a dashboard showing student performance trends — do you think D3.js is better than Tableau for this kind of interactive application?' },
    { senderIdx: 2, content: 'For a web-embedded, highly interactive application, D3.js gives you maximum flexibility. Tableau is faster to prototype but harder to customise. If you have the time and JavaScript skills, D3 will produce a more impressive result for your dissertation portfolio.' },
  ]},
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seed() {
  console.log('\n\x1b[1m\x1b[36m  ╔══════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ║    DECP Platform — Database Seeder   ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ╚══════════════════════════════════════╝\x1b[0m\n');

  // ── Check gateway is up ──
  try {
    const health = await get('/auth/health');
    if (health.status !== 200) throw new Error('Gateway not ready');
    ok('API Gateway is healthy\n');
  } catch {
    err('Cannot reach API Gateway at http://localhost:3000');
    err('Please start all services with start.bat first.\n');
    process.exit(1);
  }

  // ── Step 1: Register all users ──
  console.log('\x1b[1m  Step 1/5: Registering users\x1b[0m');
  const tokens = {}; // email → accessToken
  const userIds = {}; // email → userId

  for (const u of USERS) {
    try {
      const res = await post('/auth/register', {
        email: u.email,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.profile.department,
        graduationYear: u.profile.graduationYear,
      });
      if (res.status === 201 || res.status === 200) {
        const { accessToken, user } = res.body.data || {};
        tokens[u.email] = accessToken;
        userIds[u.email] = user?.id || user?._id;
        ok(`Registered: ${u.firstName} ${u.lastName} (${u.role})`);
      } else {
        // User might already exist — try login
        const loginRes = await post('/auth/login', { email: u.email, password: u.password });
        if (loginRes.status === 200) {
          const { accessToken, user } = loginRes.body.data || {};
          tokens[u.email] = accessToken;
          userIds[u.email] = user?.id || user?._id;
          warn(`Already exists (logged in): ${u.firstName} ${u.lastName}`);
        } else {
          err(`Failed to register/login: ${u.email} — ${JSON.stringify(res.body).slice(0, 100)}`);
        }
      }
    } catch (e) {
      err(`Error registering ${u.email}: ${e.message}`);
    }
    await sleep(100);
  }
  console.log('');

  // ── Step 2: Update profiles ──
  console.log('\x1b[1m  Step 2/5: Updating profiles\x1b[0m');
  for (const u of USERS) {
    if (!tokens[u.email]) continue;
    try {
      const profileData = {
        bio: u.profile.bio,
        headline: u.profile.headline,
        location: u.profile.location,
        skills: u.profile.skills || [],
        ...(u.profile.socialLinks ? { socialLinks: u.profile.socialLinks } : {}),
        ...(u.profile.graduationYear ? { graduationYear: u.profile.graduationYear } : {}),
      };
      const res = await put('/users/me', profileData, tokens[u.email]);
      if (res.status === 200) {
        ok(`Profile updated: ${u.firstName} ${u.lastName}`);
      } else {
        warn(`Profile update failed for ${u.firstName}: ${JSON.stringify(res.body).slice(0, 80)}`);
      }
    } catch (e) {
      warn(`Profile error for ${u.email}: ${e.message}`);
    }
    await sleep(80);
  }
  console.log('');

  // ── Step 3: Create posts, likes, comments ──
  console.log('\x1b[1m  Step 3/5: Creating posts & interactions\x1b[0m');
  const postIds = [];
  for (const p of POSTS) {
    const authorEmail = USERS[p.userIdx].email;
    if (!tokens[authorEmail]) continue;
    try {
      const res = await post('/posts', { content: p.content, type: 'text' }, tokens[authorEmail]);
      if (res.status === 201 || res.status === 200) {
        const postId = res.body.data?.post?.id || res.body.data?.post?._id || res.body.data?.id || res.body.data?._id;
        postIds.push(postId);
        ok(`Post created by ${USERS[p.userIdx].firstName}`);

        // Like the post from 2–4 random users
        const likers = [4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5).slice(0, 3);
        for (const likerIdx of likers) {
          const likerEmail = USERS[likerIdx]?.email;
          if (likerEmail && tokens[likerEmail] && likerIdx !== p.userIdx) {
            await post(`/posts/${postId}/like`, {}, tokens[likerEmail]);
            await sleep(50);
          }
        }

        // Add a comment from 1 user
        const commenterIdx = (p.userIdx + 2) % USERS.length;
        const commenterEmail = USERS[commenterIdx].email;
        const comments = [
          'Great post! Really insightful.',
          'Thanks for sharing this!',
          'This is really useful — appreciate you posting it.',
          'Completely agree with this. Well said.',
          'Would love to discuss this further. DM me!',
        ];
        if (tokens[commenterEmail]) {
          await post(`/posts/${postId}/comments`, { content: comments[p.userIdx % comments.length] }, tokens[commenterEmail]);
          await sleep(50);
        }
      }
    } catch (e) {
      warn(`Post error: ${e.message}`);
    }
    await sleep(100);
  }
  console.log('');

  // ── Step 4: Create jobs, events, research ──
  console.log('\x1b[1m  Step 4/5: Creating jobs, events, research\x1b[0m');

  const jobIds = [];
  for (const j of JOBS) {
    const authorEmail = USERS[j.userIdx].email;
    if (!tokens[authorEmail]) continue;
    try {
      const res = await post('/jobs', j.job, tokens[authorEmail]);
      if (res.status === 201 || res.status === 200) {
        const jobId = res.body.data?.job?.id || res.body.data?.job?._id || res.body.data?.id || res.body.data?._id;
        jobIds.push(jobId);
        ok(`Job: ${j.job.title} @ ${j.job.company}`);
      }
    } catch (e) { warn(`Job error: ${e.message}`); }
    await sleep(100);
  }

  // Students apply to jobs
  const studentEmails = ['alice.student@decp.edu', 'bob.student@decp.edu', 'carol.student@decp.edu', 'dan.student@decp.edu'];
  for (const email of studentEmails) {
    if (!tokens[email]) continue;
    const applyTo = jobIds.filter((_, i) => i % 2 === studentEmails.indexOf(email) % 2).slice(0, 3);
    for (const jobId of applyTo) {
      if (!jobId) continue;
      try {
        await post(`/jobs/${jobId}/apply`, {
          coverLetter: 'I am very interested in this opportunity and believe my background in CS makes me a strong candidate.',
        }, tokens[email]);
        await sleep(60);
      } catch { /* ignore duplicate applications */ }
    }
    ok(`Job applications submitted for ${email.split('.')[0]}`);
  }

  const eventIds = [];
  for (const e of EVENTS) {
    const authorEmail = USERS[e.userIdx].email;
    if (!tokens[authorEmail]) continue;
    try {
      const eventPayload = { ...e.event };
      if (!eventPayload.location) delete eventPayload.location;
      if (!eventPayload.meetingLink) delete eventPayload.meetingLink;
      const res = await post('/events', eventPayload, tokens[authorEmail]);
      if (res.status === 201 || res.status === 200) {
        const eventId = res.body.data?.event?.id || res.body.data?.event?._id || res.body.data?.id || res.body.data?._id;
        eventIds.push(eventId);
        ok(`Event: ${e.event.title.substring(0, 50)}...`);
      }
    } catch (e2) { warn(`Event error: ${e2.message}`); }
    await sleep(100);
  }

  // Students RSVP to events
  for (const email of studentEmails) {
    if (!tokens[email]) continue;
    const rsvpTo = eventIds.filter(Boolean).slice(0, 4);
    for (const eventId of rsvpTo) {
      try {
        await post(`/events/${eventId}/rsvp`, {}, tokens[email]);
        await sleep(50);
      } catch { /* ignore */ }
    }
  }
  ok('Event RSVPs submitted');

  const researchIds = [];
  for (const r of RESEARCH) {
    const authorEmail = USERS[r.userIdx].email;
    if (!tokens[authorEmail]) continue;
    try {
      const payload = {
        title: r.project.title,
        abstract: r.project.abstract,
        description: r.project.description,
        status: r.project.status,
        startDate: r.project.startDate,
        endDate: r.project.endDate,
        tags: r.project.tags,
        visibility: r.project.visibility,
      };
      const res = await post('/research', payload, tokens[authorEmail]);
      if (res.status === 201 || res.status === 200) {
        const resId = res.body.data?.project?.id || res.body.data?.project?._id || res.body.data?.id || res.body.data?._id;
        researchIds.push(resId);
        ok(`Research: ${r.project.title.substring(0, 50)}...`);
      }
    } catch (e) { warn(`Research error: ${e.message}`); }
    await sleep(100);
  }

  // Students collaborate on research
  for (const email of studentEmails) {
    if (!tokens[email]) continue;
    const collabOn = researchIds.filter(Boolean).slice(0, 2);
    for (const resId of collabOn) {
      try {
        await post(`/research/${resId}/collaborate`, {}, tokens[email]);
        await sleep(50);
      } catch { /* ignore */ }
    }
  }
  ok('Research collaborations created');
  console.log('');

  // ── Step 5: Create conversations & messages ──
  console.log('\x1b[1m  Step 5/5: Creating conversations & messages\x1b[0m');
  for (const conv of CONVERSATIONS) {
    const user1Email = USERS[conv.participantIdxs[0]].email;
    const user2Email = USERS[conv.participantIdxs[1]].email;
    if (!tokens[user1Email] || !tokens[user2Email]) continue;
    if (!userIds[user1Email] || !userIds[user2Email]) continue;

    try {
      const convRes = await post('/conversations', {
        type: 'direct',
        participants: [userIds[user1Email], userIds[user2Email]],
      }, tokens[user1Email]);

      const convId = convRes.body.data?.id || convRes.body.data?._id ||
                     convRes.body.data?.conversation?.id || convRes.body.data?.conversation?._id;

      if (convId) {
        ok(`Conversation: ${USERS[conv.participantIdxs[0]].firstName} ↔ ${USERS[conv.participantIdxs[1]].firstName}`);
        for (const msg of conv.messages) {
          const senderEmail = USERS[msg.senderIdx].email;
          if (!tokens[senderEmail]) continue;
          try {
            await post(`/conversations/${convId}/messages`, { content: msg.content, type: 'text' }, tokens[senderEmail]);
          } catch { /* ignore */ }
          await sleep(60);
        }
      } else {
        warn(`No conversation ID returned for ${user1Email} ↔ ${user2Email}`);
      }
    } catch (e) { warn(`Conversation error: ${e.message}`); }
    await sleep(120);
  }

  // ── Done ──
  console.log('\n\x1b[1m\x1b[32m  ══════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m\x1b[32m  ✅  SEEDING COMPLETE!\x1b[0m');
  console.log('\x1b[1m\x1b[32m  ══════════════════════════════════════════════\x1b[0m\n');

  console.log('\x1b[1m  ── User Accounts ────────────────────────────\x1b[0m\n');
  const roles = { admin: [], faculty: [], alumni: [], student: [] };
  USERS.forEach((u) => roles[u.role]?.push(u));
  for (const [role, users] of Object.entries(roles)) {
    if (users.length === 0) continue;
    console.log(`  \x1b[1m${role.toUpperCase()}\x1b[0m`);
    users.forEach((u) => {
      const name = `${u.firstName} ${u.lastName}`.padEnd(18);
      console.log(`    ${name}  ${u.email.padEnd(32)}  ${u.password}`);
    });
    console.log('');
  }

  console.log('\x1b[1m  ── Summary ──────────────────────────────────\x1b[0m');
  console.log(`  • ${USERS.length} users registered`);
  console.log(`  • ${POSTS.length} posts created with likes & comments`);
  console.log(`  • ${JOBS.length} job listings + student applications`);
  console.log(`  • ${EVENTS.length} events + RSVPs`);
  console.log(`  • ${RESEARCH.length} research projects + collaborations`);
  console.log(`  • ${CONVERSATIONS.length} conversations + messages`);
  console.log('\n  Access the platform at: \x1b[4m\x1b[36mhttp://localhost:5173\x1b[0m\n');
}

seed().catch((e) => {
  err(`Fatal error: ${e.message}`);
  process.exit(1);
});
