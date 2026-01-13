require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');
const Category = require('./src/models/Category');
const AdminUser = require('./src/models/AdminUser');
const connectDB = require('./src/config/database');

const sampleArticles = [
    {
        title: "Global Climate Summit Reaches Historic Agreement on Carbon Emissions",
        content: `<p>World leaders have reached a groundbreaking agreement at the Global Climate Summit in Geneva, committing to reduce carbon emissions by 50% by 2035. The accord, signed by 195 nations, marks the most ambitious climate action plan in history.</p>
    <p>The agreement includes binding commitments for developed nations to provide financial support to developing countries for green energy transitions. "This is a turning point in our fight against climate change," said UN Secretary-General António Guterres.</p>
    <p>Key provisions include accelerated phase-out of coal power, increased investment in renewable energy, and protection of global forests. Environmental groups have cautiously welcomed the deal while emphasizing the need for strict implementation and monitoring.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&h=800&fit=crop",
        imageAlt: "Wind turbines at sunset representing renewable energy",
        categoryName: "Breaking News",
    },
    {
        title: "Tech Giant Unveils Revolutionary AI Assistant with Human-Like Reasoning",
        content: `<p>Silicon Valley tech giant TechCorp has announced the launch of its most advanced AI assistant yet, capable of complex reasoning and multi-step problem solving that rivals human capabilities.</p>
    <p>The new AI, named "Atlas AI," can understand context, make logical inferences, and even detect emotional nuances in conversations. The system was trained on a diverse dataset and underwent rigorous testing to ensure accuracy and safety.</p>
    <p>"This represents a quantum leap in artificial intelligence," said TechCorp CEO Sarah Chen. "Atlas AI can assist with everything from medical diagnosis to scientific research, while maintaining ethical guardrails."</p>
    <p>The announcement has sparked both excitement and concern among AI researchers, with some questioning the implications of such powerful technology and calling for increased regulation.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop",
        imageAlt: "Artificial intelligence concept with digital brain visualization",
        categoryName: "Technology",
    },
    {
        title: "Stock Markets Hit Record Highs Amid Economic Recovery Plans",
        content: `<p>Global stock markets surged to record levels today as investors responded positively to coordinated economic recovery plans announced by major economies. The S&P 500 gained 3.5%, while European and Asian markets also posted significant gains.</p>
    <p>The rally was driven by optimism over infrastructure spending proposals, strong corporate earnings, and central bank commitments to supportive monetary policies. Technology and green energy stocks led the advance.</p>
    <p>Financial analysts attribute the market strength to improving economic indicators, including rising employment figures and increased consumer spending. "We're seeing a broad-based recovery that's sustainable," noted Goldman Sachs chief economist Jan Hatzius.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop",
        imageAlt: "Stock market chart showing upward trend",
        categoryName: "Business",
    },
    {
        title: "Major Breakthrough in Cancer Treatment Shows 90% Success Rate in Trials",
        content: `<p>Researchers at Johns Hopkins University have announced a revolutionary cancer treatment that achieved a 90% success rate in late-stage clinical trials, offering new hope to millions of patients worldwide.</p>
    <p>The treatment, which combines immunotherapy with targeted gene editing, was tested on 500 patients with various forms of cancer. Results showed significant tumor reduction within weeks, with minimal side effects compared to traditional chemotherapy.</p>
    <p>"This could fundamentally change how we treat cancer," said lead researcher Dr. Emily Watson. "We're not just managing the disease – we're potentially curing it."</p>
    <p>The FDA has granted expedited review status, and the treatment could be available to patients within 18 months. Pharmaceutical companies are already working on scaling up production to meet expected demand.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop",
        imageAlt: "Medical research laboratory with scientists working",
        categoryName: "Breaking News",
    },
    {
        title: "National Team Clinches Championship in Thrilling Final Match",
        content: `<p>In a nail-biting finale that kept fans on the edge of their seats, the national team secured the championship title with a dramatic 3-2 victory in overtime. The game, watched by over 50 million viewers worldwide, featured incredible plays and stunning goals.</p>
    <p>Team captain Marcus Rodriguez scored the winning goal in the 95th minute, sending the stadium into a frenzy. "This is what we've worked for all season," Rodriguez said in a post-game interview. "The team showed incredible resilience."</p>
    <p>The championship marks the team's first title in a decade and is being celebrated as a turning point for the sport in the country. Celebrations erupted in major cities across the nation as fans took to the streets to mark the historic victory.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&h=800&fit=crop",
        imageAlt: "Soccer players celebrating championship victory",
        categoryName: "Sports",
    },
    {
        title: "Award-Winning Director Announces Surprise Film Project with Star-Studded Cast",
        content: `<p>Oscar-winning director Christopher Nolan has surprised the entertainment industry by announcing his next project – a science fiction epic featuring an ensemble cast that reads like a who's who of Hollywood.</p>
    <p>The film, titled "Quantum Dreams," will star Jennifer Lawrence, Denzel Washington, and Timothée Chalamet, with production set to begin next month. Warner Bros. has committed to a $200 million budget for the ambitious project.</p>
    <p>"This is a story about humanity's place in the universe and the nature of reality itself," Nolan revealed at a press conference. "We're pushing the boundaries of what's possible in cinema."</p>
    <p>The announcement has generated massive excitement among film fans, with industry analysts predicting it could become one of the biggest releases of the decade.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=800&fit=crop",
        imageAlt: "Movie theater with film reel and cinema lights",
        categoryName: "Entertainment",
    },
    {
        title: "Political Leaders Announce Bipartisan Infrastructure Agreement",
        content: `<p>In a rare display of bipartisan cooperation, congressional leaders from both parties have announced a comprehensive infrastructure agreement worth $1.2 trillion over the next decade.</p>
    <p>The deal includes funding for roads, bridges, public transit, broadband internet expansion, and clean energy initiatives. It represents the largest infrastructure investment in generations and is expected to create millions of jobs.</p>
    <p>"This shows that when we put politics aside and focus on what's good for the American people, we can achieve great things," said Senate Majority Leader. The bill is expected to pass both chambers with strong support.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop",
        imageAlt: "Government building with American flag",
        categoryName: "Politics",
    },
    {
        title: "Local Community Rallies to Save Historic Downtown Landmark",
        content: `<p>Residents of downtown Springfield have launched a successful fundraising campaign to preserve the historic Riverside Theater, raising over $5 million in just three months to prevent its demolition.</p>
    <p>The 100-year-old theater, which has been a cultural cornerstone of the community, was slated for demolition to make way for a commercial development. However, community activists organized protests and fundraising events that captured national attention.</p>
    <p>"This theater is part of our identity," said campaign organizer Maria Santos. "It's where generations of families have created memories, and we weren't going to let it disappear without a fight."</p>
    <p>The city council has agreed to work with preservationists to restore the theater while incorporating modern amenities. The project is expected to create a model for historic preservation efforts nationwide.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=800&fit=crop",
        imageAlt: "Historic theater building with classic architecture",
        categoryName: "Local News",
    },
];

const seedArticles = async () => {
    try {
        await connectDB();

        console.log('🌱 Starting article seed...');

        // Get admin user
        const admin = await AdminUser.findOne({ email: 'admin@news.com' });
        if (!admin) {
            console.error('❌ Admin user not found. Please run seed.js first!');
            process.exit(1);
        }

        // Get all categories
        const categories = await Category.find();
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        // Clear existing articles
        await Article.deleteMany({});
        console.log('🗑️  Cleared existing articles');

        // Create sample articles
        for (const article of sampleArticles) {
            const categoryId = categoryMap[article.categoryName];

            if (!categoryId) {
                console.log(`⚠️  Category "${article.categoryName}" not found, skipping article`);
                continue;
            }

            await Article.create({
                title: article.title,
                content: article.content,
                featuredImage: article.featuredImage,
                imageAlt: article.imageAlt,
                category: categoryId,
                tags: [],
                status: 'published',
                author: admin._id,
                views: Math.floor(Math.random() * 10000), // Random view count
                publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
            });

            console.log(`✅ Created article: ${article.title}`);
        }

        console.log(`🎉 Successfully seeded ${sampleArticles.length} articles!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding articles:', error);
        process.exit(1);
    }
};

seedArticles();
