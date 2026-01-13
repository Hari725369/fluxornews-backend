module.exports = {
    apps: [{
        name: 'news-api',
        script: './server.js',
        instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
        exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
        env: {
            NODE_ENV: 'development',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: process.env.PORT || 5000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        max_memory_restart: '500M',
        min_uptime: '10s',
        max_restarts: 10,
        autorestart: true,
        restart_delay: 4000,
    }]
};
