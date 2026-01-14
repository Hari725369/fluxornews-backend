const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
    // Home Page Layout Settings
    homeLayout: {
        columns: {
            type: Number,
            default: 3,
            min: 1,
            max: 4,
        },
        // We can add more layout settings here later
    },
    // Branding
    branding: {
        logo: String,
        favicon: String,
    },
    // Features Toggles
    features: {
        showLatestNews: {
            type: Boolean,
            default: true
        },
        enableEmailSubscribe: {
            type: Boolean,
            default: true
        },
        enableTags: {
            type: Boolean,
            default: true
        },
        enableComments: {
            type: Boolean,
            default: true
        },
        enableDarkMode: {
            type: Boolean,
            default: true
        },
        enableReadingTime: {
            type: Boolean,
            default: true
        },
        enableRelatedArticles: {
            type: Boolean,
            default: true
        },
        enableSocialShare: {
            type: Boolean,
            default: true
        },
        enableSearch: {
            type: Boolean,
            default: true
        },
        showAuthorName: {
            type: Boolean,
            default: false
        },
        showCountryName: {
            type: Boolean,
            default: false
        },
        showDateTime: {
            type: Boolean,
            default: true
        },
        showSignInButton: {
            type: Boolean,
            default: true
        },
        enableSaveForLater: {
            type: Boolean,
            default: true
        },
        showPostIntro: {
            type: Boolean,
            default: true
        }
    },
    // Social Links
    socialLinks: {
        facebook: {
            url: String,
            enabled: {
                type: Boolean,
                default: false
            }
        },
        twitter: {
            url: String,
            enabled: {
                type: Boolean,
                default: false
            }
        },
        instagram: {
            url: String,
            enabled: {
                type: Boolean,
                default: false
            }
        },
        linkedin: {
            url: String,
            enabled: {
                type: Boolean,
                default: false
            }
        },
        youtube: {
            url: String,
            enabled: {
                type: Boolean,
                default: false
            }
        }
    },
    // Footer Content
    footer: {
        copyrightText: String,
        description: String
    },
    // Policies and Legal Pages
    policies: {
        contactUs: {
            enabled: {
                type: Boolean,
                default: true
            },
            heading: {
                type: String,
                default: 'Contact Us'
            },
            description: {
                type: String,
                default: 'Have a question, suggestion, or feedback? We\'d love to hear from you.'
            },
            form: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                emailTo: String
            },
            otherWays: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                email: String,
                phone: String,
                address: String
            },
            businessHours: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                timezone: {
                    type: String,
                    default: 'EST'
                },
                hours: {
                    type: String,
                    default: 'Monday - Friday: 9AM - 6PM'
                }
            },
            socialMedia: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                platforms: [{
                    name: String,
                    url: String,
                    icon: String
                }]
            },
            responseTime: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                text: {
                    type: String,
                    default: 'We typically respond within 24-48 hours'
                }
            },
            faqs: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                items: [{
                    question: String,
                    answer: String,
                    order: Number
                }]
            }
        },
        privacyPolicy: {
            enabled: {
                type: Boolean,
                default: true
            },
            title: {
                type: String,
                default: 'Privacy Policy'
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            },
            content: {
                type: String,
                default: ''
            }
        },
        cookiePolicy: {
            enabled: {
                type: Boolean,
                default: true
            },
            title: {
                type: String,
                default: 'Cookie Policy'
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            },
            content: {
                type: String,
                default: ''
            }
        },
        termsOfUse: {
            enabled: {
                type: Boolean,
                default: true
            },
            title: {
                type: String,
                default: 'Terms of Use'
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            },
            content: {
                type: String,
                default: ''
            }
        }
    },
    // Who last updated the config
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure only one config document exists (singleton pattern)
siteConfigSchema.statics.getConfig = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
