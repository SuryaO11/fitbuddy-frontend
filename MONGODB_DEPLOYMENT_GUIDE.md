# MongoDB Deployment Guide for Fitbuddy

## Current MongoDB URI Analysis

**Current URI:** `mongodb+srv://sourav2000ranjan:Sourav@999@srvcluster.foibe.mongodb.net/?retryWrites=true&w=majority&appName=srvcluster`

## Issue Identified

The password `Sourav@999` contains an `@` symbol which needs to be URL-encoded as `%40` in the connection string.

## Corrected MongoDB URI

**Fixed URI:** `mongodb+srv://sourav2000ranjan:Sourav%40999@srvcluster.foibe.mongodb.net/?retryWrites=true&w=majority&appName=srvcluster`

## Steps to Fix

1. Open your `.env` file
2. Replace the current `MONGODB_URI` line with:
   ```
   MONGODB_URI=mongodb+srv://sourav2000ranjan:Sourav%40999@srvcluster.foibe.mongodb.net/?retryWrites=true&w=majority&appName=srvcluster
   ```

## Deployment Security Recommendations

### 1. MongoDB Atlas Security
- **IP Whitelisting**: Restrict database access to your production server IP addresses
- **Database Users**: Create separate database users for different environments (dev, staging, prod)
- **Network Access**: Use VPC peering if deploying on AWS/Azure/GCP
- **Encryption**: Enable encryption at rest in MongoDB Atlas
- **Backups**: Configure regular automated backups

### 2. Environment Variables Security
- Use different passwords for development and production environments
- Consider using MongoDB Atlas connection strings with shorter expiration times
- Rotate database passwords regularly

### 3. Application Security
- **JWT Secret**: Use a much stronger, randomly generated secret in production
- **Token Expiration**: Set shorter expiration times for production JWT tokens
- **Rate Limiting**: Implement rate limiting on authentication endpoints
- **Input Validation**: Validate all inputs to prevent NoSQL injection

### 4. Monitoring and Logging
- Enable MongoDB Atlas monitoring and alerts
- Set up proper application logging
- Monitor connection attempts and failed authentications

### 5. Backup Strategy
- Regular automated backups
- Test restoration procedures
- Consider cross-region replication for disaster recovery

## Production Checklist

- [ ] Fix MongoDB URI password encoding
- [ ] Create separate production database user
- [ ] Set up IP whitelisting in MongoDB Atlas
- [ ] Enable encryption at rest
- [ ] Configure proper backup strategy
- [ ] Use strong JWT secret in production
- [ ] Set up monitoring and alerts
- [ ] Test connection from production environment

## Testing the Connection

After making changes, test the connection by running:
```bash
npm run dev
```

Check that the application connects successfully to MongoDB without errors.

## Troubleshooting

If you encounter connection issues:
1. Verify the MongoDB URI format
2. Check IP whitelisting settings in MongoDB Atlas
3. Verify database user permissions
4. Check network connectivity from your deployment environment
