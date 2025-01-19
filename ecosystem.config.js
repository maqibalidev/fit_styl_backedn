module.exports = {
    apps: [
      {
        name: 'backend', // The name of your app
        script: 'index.js', // The entry point for your application
        instances: 'max', // To run the app in clustered mode with the max available CPUs
        exec_mode: 'cluster', // Enable cluster mode for scaling
        watch: true, // Enable file watching for auto-restarting on changes (useful in dev, you can remove for prod)
        env: {
          NODE_ENV: 'development', // Set environment variable for development
        },
        env_production: {
          NODE_ENV: 'production', // Set environment variable for production
        },
      },
    ],
  };
  