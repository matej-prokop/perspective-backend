export interface HttpServerConfig {
  port: number;
}

export interface MongoConfig {
  uri: string;
  dbName: string;
}

export interface Config {
  httpServer: HttpServerConfig;
  mongo: MongoConfig;
}

export function getConfig(): Config {
  return {
    httpServer: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 3111,
    },
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
      dbName: process.env.DB_NAME || 'perspective',
    },
  };
}
