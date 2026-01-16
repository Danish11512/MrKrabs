import Redis from 'ioredis'

let redisClient: Redis | null = null

export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number): number | null => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError: (err: Error): boolean => {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        return true
      }
      return false
    },
  })

  redisClient.on('error', (err: Error): void => {
    console.error('Redis connection error:', err)
  })

  redisClient.on('connect', (): void => {
    console.log('Redis connected successfully')
  })

  return redisClient
}

export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
