require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const categories = [
    {
        name: "Breaking News",
        slug: "breaking-news",
        description: "Stay informed with the latest breaking news alerts from around the globe. Get real-time updates on developing stories, emergencies, and major events as they unfold.",
        metaTitle: "Breaking News - Real-Time Headlines & Alerts | Fluxor",
        metaKeywords: "breaking news, latest headlines, news alerts, developing stories, live news, emergency news, top stories, current events, global news, local news",
        color: "#DC2626"
    },
    {
        name: "World News",
        slug: "world-news",
        description: "Comprehensive coverage of international affairs, diplomacy, and global conflicts. Understand the stories shaping our world with in-depth reporting and analysis.",
        metaTitle: "World News - International Headlines & Global Events | Fluxor",
        metaKeywords: "world news, international news, global politics, foreign affairs, diplomacy, un, peacekeeping, global economy, world conflicts, international relations",
        color: "#2563EB"
    },
    {
        name: "Politics",
        slug: "politics",
        description: "Unbiased reporting on government, policy decisions, and elections. Keep up with the latest legislative changes, political debates, and leadership insights.",
        metaTitle: "Politics - Government News, Elections & Policy | Fluxor",
        metaKeywords: "politics, government, elections, policy, legislation, congress, senate, parliament, democracy, political parties, voting, campaign",
        color: "#4B5563"
    },
    {
        name: "Business & Economy",
        slug: "business-economy",
        description: "Expert analysis on financial markets, economic trends, and business innovations. Track stock market updates, corporate news, and global economic reports.",
        metaTitle: "Business News - Economy, Markets & Finance | Fluxor",
        metaKeywords: "business news, economy, stock market, finance, wall street, corporate news, startups, investing, market trends, entrepreneurship",
        color: "#059669"
    },
    {
        name: "Technology",
        slug: "technology",
        description: "Discover the future with the latest news on gadgets, AI, and scientific breakthroughs. Reviews, guides, and insights into the tech that powers our lives.",
        metaTitle: "Tech News - Gadgets, AI & Future Trends | Fluxor",
        metaKeywords: "technology, tech news, artificial intelligence, gadgets, smartphones, software, cyber security, innovation, silicon valley, startups, coding",
        color: "#7C3AED"
    },
    {
        name: "Sports",
        slug: "sports",
        description: "Scores, highlights, and commentary from the world of sports. Follow your favorite teams and athletes across football, basketball, tennis, and more.",
        metaTitle: "Sports News - Scores, Highlights & Commentary | Fluxor",
        metaKeywords: "sports, live scores, football, basketball, cricket, tennis, athletes, sports news, match results, championships, leagues, olympics",
        color: "#F59E0B"
    },
    {
        name: "Entertainment",
        slug: "entertainment",
        description: "Your source for celebrity news, movie reviews, and pop culture trends. Get the latest gossip, music updates, and exclusive interviews from Hollywood and beyond.",
        metaTitle: "Entertainment News - Movies, Music & Celebrity | Fluxor",
        metaKeywords: "entertainment, celebrity news, movies, hollywood, music, pop culture, tv shows, streaming, gossip, reviews, red carpet",
        color: "#DB2777"
    },
    {
        name: "Health",
        slug: "health",
        description: "Vital information on wellness, medical research, and healthy living. Trusted advice on nutrition, fitness, mental health, and medical breakthroughs.",
        metaTitle: "Health News - Wellness, Fitness & Medical Research | Fluxor",
        metaKeywords: "health, wellness, medicine, fitness, nutrition, mental health, medical research, healthy living, diet, exercise, public health",
        color: "#0891B2"
    },
    {
        name: "Artificial Intelligence (AI)",
        slug: "artificial-intelligence",
        description: "Dive deep into the world of AI, machine learning, and neural networks. Explore how artificial intelligence is reshaping industries, ethics, and daily life.",
        metaTitle: "AI News - Artificial Intelligence & Machine Learning | Fluxor",
        metaKeywords: "artificial intelligence, ai, machine learning, deep learning, nlp, robotics, automation, neural networks, future tech, ai tools",
        color: "#6366F1"
    },
    {
        name: "Startups & Innovation",
        slug: "startups-innovation",
        description: "Stories of disruptive companies, visionary founders, and breakthrough ideas. Follow the journey from seed funding to unicorn status in the startup ecosystem.",
        metaTitle: "Startup News - Innovation, VCs & Entrepreneurship | Fluxor",
        metaKeywords: "startups, entrepreneurship, venture capital, innovation, founders, unicorns, seed funding, business growth, disruptors, pitch decks",
        color: "#F43F5E"
    },
    {
        name: "Climate Change & Environment",
        slug: "climate-environment",
        description: "Critical updates on climate action, conservation, and environmental policy. Learn about sustainability efforts, renewable energy, and the fight for our planet.",
        metaTitle: "Climate News - Environment, Sustainability & Green Tech | Fluxor",
        metaKeywords: "climate change, environment, global warming, sustainability, renewable energy, conservation, green tech, ecology, carbon footprint, nature",
        color: "#16A34A"
    },
    {
        name: "Cybersecurity",
        slug: "cybersecurity",
        description: "Essential news on data privacy, cyber threats, and digital hacking. Stay ahead of vulnerabilities, malware, and the latest security protocols protecting your data.",
        metaTitle: "Cybersecurity News - Hacking, Privacy & InfoSec | Fluxor",
        metaKeywords: "cybersecurity, hacking, data privacy, infosec, malware, ransomware, data breach, network security, cybercrime, digital safety",
        color: "#111827"
    },
    {
        name: "Space & Science",
        slug: "space-science",
        description: "Explore the cosmos and scientific discoveries pushing human boundaries. From Mars missions to quantum physics, stay updated on the wonders of the universe.",
        metaTitle: "Space & Science - Astronomy, NASA & Discovery | Fluxor",
        metaKeywords: "space, science, astronomy, nasa, spacex, mars, astrophysics, quantum physics, scientific discovery, universe, cosmology",
        color: "#1E3A8A"
    },
    {
        name: "Electric Vehicles (EV)",
        slug: "electric-vehicles",
        description: "The latest in electric mobility, battery technology, and autonomous driving. Reviews and news on EV manufacturers transforming the automotive industry.",
        metaTitle: "EV News - Electric Vehicles, Tesla & Green Transport | Fluxor",
        metaKeywords: "electric vehicles, ev, tesla, electric cars, batteries, autonomous driving, green transport, automotive, charging stations, mobility",
        color: "#0EA5E9"
    },
    {
        name: "Cryptocurrency & Web3",
        slug: "cryptocurrency-web3",
        description: "Decoding the world of crypto, blockchain, and decentralized finance. Market analysis, regulatory updates, and the evolution of the Web3 internet.",
        metaTitle: "Crypto News - Bitcoin, Blockchain & Web3 | Fluxor",
        metaKeywords: "cryptocurrency, bitcoin, ethereum, blockchain, web3, defi, nft, crypto market, digital assets, decentralized finance",
        color: "#F59E0B"
    },
    {
        name: "Personal Finance",
        slug: "personal-finance",
        description: "Practical advice on saving, investing, and managing your money. Tips for budgeting, retirement planning, credit scores, and financial independence.",
        metaTitle: "Personal Finance - Investing, Saving & Money Tips | Fluxor",
        metaKeywords: "personal finance, investing, saving money, budgeting, retirement, credit cards, mortgages, financial planning, wealth management, taxes",
        color: "#84CC16"
    },
    {
        name: "Stock Market",
        slug: "stock-market",
        description: "Real-time analysis of global stock exchanges and market movers. Expert insights on bull/bear markets, day trading, and long-term investment strategies.",
        metaTitle: "Stock Market News - Wall Street, Sensex & Nifty | Fluxor",
        metaKeywords: "stock market, wall street, shares, trading, ipo, bull market, bear market, sensex, nifty, dividend, technical analysis",
        color: "#10B981"
    },
    {
        name: "Banking & Insurance",
        slug: "banking-insurance",
        description: "News on banking regulations, fintech innovations, and insurance sectors. Analysis of interest rates, loans, and the future of banking institutions.",
        metaTitle: "Banking & Insurance - Fintech, Loans & Rates | Fluxor",
        metaKeywords: "banking, insurance, fintech, loans, interest rates, central bank, digital banking, life insurance, credit, financial services",
        color: "#1E40AF"
    },
    {
        name: "Real Estate",
        slug: "real-estate",
        description: "Trends in housing markets, commercial property, and infrastructure. Updates on mortgage rates, home buying tips, and real estate investment opportunities.",
        metaTitle: "Real Estate News - Housing Market, Property & Trends | Fluxor",
        metaKeywords: "real estate, housing market, property, mortgage, home buying, commercial real estate, investing, rental market, architecture, infrastructure",
        color: "#78350F"
    },
    {
        name: "Technology Reviews / Gadgets",
        slug: "technology-reviews",
        description: "Hands-on reviews of the latest smartphones, laptops, and consumer tech. Unbiased verdicts to help you decide which gadget is worth your money.",
        metaTitle: "Tech Reviews - Gadgets, Smartphones & Laptops | Fluxor",
        metaKeywords: "tech reviews, gadget reviews, smartphones, unboxing, product reviews, best laptops, consumer electronics, tech recommendations, buying guides",
        color: "#9CA3AF"
    },
    {
        name: "Local News",
        slug: "local-news",
        description: "Stories that matter to your community. Coverage of local government, events, schools, and issues affecting neighborhoods in your immediate area.",
        metaTitle: "Local News - Community Updates & Neighborhood Stories | Fluxor",
        metaKeywords: "local news, community, neighborhood, town hall, local government, schools, local events, updates, regional news, nearby",
        color: "#2DD4BF"
    },
    {
        name: "City News",
        slug: "city-news",
        description: "The pulse of the metro. Updates on city infrastructure, development, urban culture, and major happenings in metropolitan areas.",
        metaTitle: "City News - Metro Updates, Urban Life & Development | Fluxor",
        metaKeywords: "city news, metro, urbanization, city life, infrastructure, development, traffic, municipal corporation, city council, metro updates",
        color: "#64748B"
    },
    {
        name: "Weather",
        slug: "weather",
        description: "Accurate forecasts, severe weather alerts, and climate patterns. Plan your day with daily weather reports and long-range meteorological outlooks.",
        metaTitle: "Weather Forecast - Daily Updates, Storms & Alerts | Fluxor",
        metaKeywords: "weather, forecast, storm alert, temperature, rain, meteorology, climate, weather update, daily forecast, severe weather",
        color: "#38BDF8"
    },
    {
        name: "Public Alerts & Traffic",
        slug: "public-alerts-traffic",
        description: "Real-time notifications on traffic jams, road closures, and public safety alerts. Essential information for daily commuting and safe travel.",
        metaTitle: "Public Alerts - Traffic Updates, Safety & Advisories | Fluxor",
        metaKeywords: "public alerts, traffic, road closures, commute, safety alert, accidents, transit, public transport, advisories, emergencies",
        color: "#F97316"
    },
    {
        name: "Crime & Law",
        slug: "crime-law",
        description: "Reporting on law enforcement, court cases, and legal developments. Analysis of criminal justice issues and significant legal precedents.",
        metaTitle: "Crime & Law - Legal News, Court Cases & Justice | Fluxor",
        metaKeywords: "crime, law, legal news, court cases, justice system, police, law enforcement, supreme court, lawsuits, rights",
        color: "#18181B"
    },
    {
        name: "Explainers",
        slug: "explainers",
        description: "Complex topics broken down into simple terms. \"What Is\" and \"How To\" guides that help you understand the context behind the headlines.",
        metaTitle: "Explainers - The 'Why' and 'How' Behind the News | Fluxor",
        metaKeywords: "explainers, guides, deep dive, what is, how to, context, analysis, breakdown, facts, simplified",
        color: "#EAB308"
    },
    {
        name: "Opinions & Editorials",
        slug: "opinions-editorials",
        description: "Thought-provoking perspectives and expert commentary. Columns and op-eds debating the pressing issues of the day from diverse viewpoints.",
        metaTitle: "Opinion - Editorials, Columns & Perspectives | Fluxor",
        metaKeywords: "opinion, editorial, commentary, columns, perspectives, viewpoints, debate, op-ed, analysis, voice",
        color: "#8B5CF6"
    },
    {
        name: "Fact Check",
        slug: "fact-check",
        description: "Verifying claims and debunking misinformation. Rigorous investigation into viral stories and political statements to separate fact from fiction.",
        metaTitle: "Fact Check - Verifying Claims & Debunking Myths | Fluxor",
        metaKeywords: "fact check, truth, debunking, misinformation, fake news, verification, evidence, claims, investigation, accuracy",
        color: "#0D9488"
    },
    {
        name: "Interviews",
        slug: "interviews",
        description: "Exclusive conversations with newsmakers, leaders, and influencers. In-depth Q&As that reveal the people behind the stories.",
        metaTitle: "Interviews - Exclusive Conversations with Leaders | Fluxor",
        metaKeywords: "interviews, q&a, conversation, profile, exclusive, newsmakers, leaders, dialogue, talk, featured",
        color: "#D946EF"
    },
    {
        name: "In-Depth Analysis",
        slug: "in-depth-analysis",
        description: "Long-form journalism and investigative reports. Deep dives into systemic issues, trends, and stories that require more than just a headline.",
        metaTitle: "In-Depth - Investigative Journalism & Analysis | Fluxor",
        metaKeywords: "in-depth, analysis, investigative journalism, long-form, special report, deep dive, insight, research, study, focus",
        color: "#BE123C"
    },
    {
        name: "Gaming & Esports",
        slug: "gaming-esports",
        description: "News from the gaming world, including esports tournaments, game releases, and streamer culture. Reviews and updates for PC, console, and mobile gaming.",
        metaTitle: "Gaming News - Esports, Reviews & Game Releases | Fluxor",
        metaKeywords: "gaming, esports, video games, streamers, tournaments, playstation, xbox, pc gaming, game reviews, twitch",
        color: "#A855F7"
    },
    {
        name: "Social Media Trends",
        slug: "social-media-trends",
        description: "Tracking what's trending across Twitter, Instagram, TikTok, and more. Analysis of viral hashtags, digital culture, and platform updates.",
        metaTitle: "Social Trends - Viral News, Hashtags & Influencers | Fluxor",
        metaKeywords: "social media, trends, viral, hashtags, influencers, tiktok, instagram, twitter, digital culture, trending now",
        color: "#3B82F6"
    },
    {
        name: "Internet Culture / Viral News",
        slug: "internet-culture",
        description: "The lighter side of the web. Memes, viral videos, and internet phenomena that are capturing the world's attention right now.",
        metaTitle: "Viral News - Internet Culture, Memes & Trends | Fluxor",
        metaKeywords: "viral news, internet culture, memes, viral videos, funny, trending, buzz, web culture, phenomena, shareable",
        color: "#FF006E"
    },
    {
        name: "Streaming & OTT",
        slug: "streaming-ott",
        description: "Guides to what to watch on Netflix, Prime, Disney+, and more. Reviews of web series, movie premieres, and keeping up with the streaming wars.",
        metaTitle: "Streaming News - Netflix, Prime Video & OTT Releases | Fluxor",
        metaKeywords: "streaming, ott, netflix, amazon prime, disney+, hbo, web series, binge watch, movie releases, streaming wars",
        color: "#E50914"
    },
    {
        name: "Celebrities",
        slug: "celebrities",
        description: "Inside the lives of the rich and famous. Breaking celebrity news, lifestyle updates, and red carpet coverage from the world of stardom.",
        metaTitle: "Celebrity News - Gossip, Lifestyle & Famous Faces | Fluxor",
        metaKeywords: "celebrities, famous people, gossip, lifestyle, stars, actors, red carpet, hollywood, fame, paparazzi",
        color: "#EAB308"
    },
    {
        name: "Geopolitics",
        slug: "geopolitics",
        description: "Analysis of strategic power plays between nations. Understanding alliances, conflicts, and the geopolitical forces shifting the global balance of power.",
        metaTitle: "Geopolitics - Global Strategy, Power & Relations | Fluxor",
        metaKeywords: "geopolitics, international relations, strategy, foreign policy, global power, alliances, sovereignty, diplomacy, borders, geopolitical risk",
        color: "#1F2937"
    },
    {
        name: "Defense & Military",
        slug: "defense-military",
        description: "Updates on defense technologies, military operations, and national security. Coverage of armed forces, defense budgets, and strategic developments.",
        metaTitle: "Defense News - Military, Security & Strategy | Fluxor",
        metaKeywords: "defense, military, army, navy, air force, national security, weapons, defense tech, warfare, armed forces",
        color: "#3F6212"
    },
    {
        name: "Energy & Sustainability",
        slug: "energy-sustainability",
        description: "The future of power. Coverage of oil, gas, nuclear, and the transition to renewable energy sources. Market trends and sustainable innovations.",
        metaTitle: "Energy News - Oil, Gas, Renewables & Power | Fluxor",
        metaKeywords: "energy, sustainability, oil and gas, renewable energy, nuclear, power, solar, wind, fossil fuels, energy transition",
        color: "#F97316"
    },
    {
        name: "Agriculture & Rural Affairs",
        slug: "agriculture-rural",
        description: "News affecting the farming community and rural economy. Crop reports, agri-tech details, and policy updates for the agricultural sector.",
        metaTitle: "Agriculture News - Farming, Crops & Rural Economy | Fluxor",
        metaKeywords: "agriculture, farming, rural, crops, farmers, agri-tech, food security, livestock, harvest, rural economy",
        color: "#65A30D"
    },
    {
        name: "Education & Exams",
        slug: "education-exams",
        description: "News for students and educators. Updates on board exams, entrance tests, university admissions, and educational policy changes.",
        metaTitle: "Education News - Exams, Admissions & Schools | Fluxor",
        metaKeywords: "education, exams, schools, universities, admissions, students, teachers, results, campus, learning",
        color: "#2563EB"
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        for (const cat of categories) {
            await Category.findOneAndUpdate(
                { slug: cat.slug },
                {
                    ...cat,
                    showInHeader: false, // Default to false as requested
                    isActive: true, // Visible in Admin
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`Synced: ${cat.name}`);
        }

        console.log('All categories seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCategories();
