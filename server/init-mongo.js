db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'collaborative_coding');

// Example: create indexes if needed
db.createCollection('init_meta');
db.init_meta.insertOne({ createdAt: new Date(), note: 'Initialized by init-mongo.js' });
