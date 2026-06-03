import mongoose from 'mongoose';

const maskMongoUri = (uri) => {
  if (!uri) return uri;
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return uri.replace(/\/\/([^:/?#]+):([^@]+)@/g, '//$1:***@');
  }
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    console.log('\x1b[36m%s\x1b[0m', '[DB] Connecting to MongoDB...');
    console.log('\x1b[36m%s\x1b[0m', `[DB] Environment: ${process.env.NODE_ENV || 'undefined'}`);
    console.log('\x1b[36m%s\x1b[0m', `[DB] process.env.MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    console.log('\x1b[36m%s\x1b[0m', `[DB] process.env.MONGO_URI exists: ${!!process.env.MONGO_URI}`);
    console.log('\x1b[36m%s\x1b[0m', `[DB] Mongo URI: ${maskMongoUri(uri)}`);

    if (!uri) {
      throw new Error('MongoDB URI missing (set MONGO_URI or MONGODB_URI)');
    }
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\x1b[32m%s\x1b[0m', '[DB SUCCESS] MongoDB Connected Successfully');
    console.log('\x1b[32m%s\x1b[0m', `[DB] host=${mongoose.connection.host}`);
    console.log('\x1b[32m%s\x1b[0m', `[DB] database=${mongoose.connection.name}`);
    console.log('\x1b[32m%s\x1b[0m', `[DB] readyState=${mongoose.connection.readyState}`);
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[DB ERROR] MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
