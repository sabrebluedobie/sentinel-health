# Sentrya - Dexcom Integration Description

## Application Overview

**Sentrya** is a health tracking platform designed specifically for individuals managing both diabetes and migraines. Our mission is to help users discover patterns and correlations between their glucose levels and migraine episodes, enabling better health management and more informed conversations with healthcare providers.

## How We Use Dexcom Data

### Data Collection
- **Glucose Readings (EGVs)**: We retrieve Estimated Glucose Values with timestamps to build a complete picture of blood sugar patterns
- **Trend Information**: We collect trend arrows (rising, falling, stable) to understand glucose velocity
- **Historical Data**: We sync up to 120 days of historical readings to enable meaningful pattern analysis

### Data Usage
1. **Correlation Analysis**: We analyze relationships between glucose levels and migraine episodes to help users identify potential triggers
2. **Trend Visualization**: We display glucose data in charts alongside migraine, sleep, and other health metrics
3. **Pattern Recognition**: We calculate statistical correlations to surface insights users might miss
4. **Health Reports**: We aggregate data for users to share with their healthcare providers

### Data Security & Privacy
- All glucose data is encrypted in transit (HTTPS) and at rest
- Data is stored securely in our HIPAA-compliant infrastructure (Supabase)
- Users retain full control and can disconnect/delete their data at any time
- We **never** sell or share user health data with third parties
- OAuth tokens are stored securely and refreshed automatically

### Access Pattern
- **Initial Sync**: When a user connects their Dexcom account, we pull the last 7 days of readings
- **Automatic Sync**: We sync new readings every hour to keep data current
- **Manual Sync**: Users can trigger on-demand syncs at any time
- **Read-Only Access**: We only read glucose data - we never modify or write data back to Dexcom

### Data Retention
- Glucose readings are retained for 120 days by default
- Users can manually delete their connection and all associated data
- Automatic cleanup removes readings older than 120 days

## User Benefits

### Primary Use Cases
1. **Migraine Trigger Identification**: Discover if blood sugar spikes or drops precede migraines
2. **Treatment Effectiveness**: Monitor how glucose management affects migraine frequency
3. **Provider Collaboration**: Generate comprehensive reports combining glucose and migraine data
4. **Self-Management**: Understand personal patterns to make informed lifestyle choices

### Target Audience
- Type 1 and Type 2 diabetics who also experience migraines
- Healthcare providers managing patients with both conditions
- Researchers studying the relationship between glucose and migraines

## Technical Integration

### API Endpoints Used
- `/v2/oauth2/login` - User authorization
- `/v2/oauth2/token` - Token exchange and refresh
- `/v2/users/self/egvs` - Glucose readings retrieval

### Data Fields Accessed
- `systemTime` - Timestamp of reading
- `value` - Glucose value in mg/dL
- `trend` - Trend direction (rising/falling/stable)
- `recordId` - Unique identifier for deduplication

### Rate Limiting
- We respect Dexcom's API rate limits
- Hourly syncs stay well within the 1000 requests/hour limit
- Batch processing minimizes API calls

## Contact Information

**Company**: Bluedobie Developing LLC  
**Application**: Sentrya Whole Health  
**Website**: https://sentrya.com  
**Support Email**: support@sentrya.com  
**Privacy Policy**: https://sentrya.com/privacy  
**Terms of Service**: https://sentrya.com/terms

---

## OAuth Application Details

**Application Name**: Sentrya Whole Health  
**Redirect URIs**: 
- Production: `https://sentrya.com/api/dexcom/callback`
- Development: `http://localhost:5173/api/dexcom/callback`

**Requested Scopes**:
- `offline_access` - To maintain long-term sync without requiring re-authorization

**Data Handling Commitment**:
We commit to using Dexcom data solely for the purposes outlined above and in accordance with HIPAA regulations and Dexcom's Developer Terms of Service.

---

*Last Updated: December 31, 2024*
