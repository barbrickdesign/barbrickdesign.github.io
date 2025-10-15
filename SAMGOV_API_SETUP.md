# 🔑 SAM.gov API Setup Guide

## Quick Fix - Set Your API Key

### **Option 1: Browser Console (Immediate)**
```javascript
// Open browser console (F12) and run:
localStorage.setItem('samgov_api_key', 'YOUR_API_KEY_HERE');
```

### **Option 2: UI Config Panel** (Recommended)
Use the built-in configuration panel on any page that uses SAM.gov data.

---

## 📋 Getting Your SAM.gov API Key

### **Step 1: Visit SAM.gov**
🔗 **https://sam.gov/data-services**

### **Step 2: Create Account**
1. Click "Request an API Key"
2. Fill out the registration form:
   - First Name
   - Last Name
   - Email Address
   - Organization (optional)
3. Agree to terms of service
4. Submit

### **Step 3: Receive API Key**
- Check your email
- SAM.gov will send your API key
- Key format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### **Step 4: Configure in Project**
Choose one of these methods:

---

## 🛠️ Configuration Methods

### **Method 1: localStorage (Quick)**
```javascript
// In browser console or JavaScript:
localStorage.setItem('samgov_api_key', 'your-api-key-here');
```

### **Method 2: Environment Variable**
Create `.env` file in project root:
```env
SAM_GOV_API_KEY=your-api-key-here
```

### **Method 3: Config UI**
Use the SAM.gov Config Panel:
```javascript
// Will be created below
const samApi = new SAMGovAPIIntegration();
samApi.setApiKey('your-api-key-here');
```

---

## 📝 API Key Requirements

### **Free Tier Limits**
- ✅ 1,000 requests per day
- ✅ Access to all public data
- ✅ Contract opportunities
- ✅ Federal spending data
- ✅ Entity information

### **Rate Limits**
- 5 requests per second
- 1,000 requests per day
- Resets at midnight EST

### **No Credit Card Required**
- Free for public data
- Premium tiers available for higher limits

---

## 🚀 Using the API

### **Basic Usage**
```javascript
// Initialize with API key
const samApi = new SAMGovAPIIntegration('your-api-key');

// Search opportunities
const opportunities = await samApi.searchOpportunities({
    limit: 10,
    naicsCode: '541511' // Custom Computer Programming Services
});

// Search contracts
const contracts = await samApi.searchContracts({
    limit: 10,
    minAmount: 10000
});
```

### **Pages Using SAM.gov API**
1. **contract-crowdfunding.html** - Contract funding
2. **github-repo-valuation.html** - Repo valuations
3. **integration-complete.html** - System integration
4. **dev-compensation-calculator.js** - Compensation
5. **project-tokenomics.js** - Tokenomics

---

## 🔧 Testing Your Setup

### **Test API Key**
```javascript
async function testSAMGovAPI() {
    const samApi = new SAMGovAPIIntegration();
    
    // Check if key is set
    if (!samApi.apiKey) {
        console.error('❌ No API key found');
        return;
    }
    
    try {
        // Try a simple search
        const results = await samApi.searchOpportunities({ limit: 1 });
        console.log('✅ SAM.gov API working!', results);
    } catch (error) {
        console.error('❌ API Error:', error);
    }
}

// Run test
testSAMGovAPI();
```

### **Expected Response**
```json
{
    "opportunitiesData": [{
        "noticeId": "abc123",
        "title": "IT Services Contract",
        "department": "Department of Defense",
        "postedDate": "2025-01-15",
        "responseDeadline": "2025-02-15"
    }],
    "totalRecords": 1234
}
```

---

## 🎯 Troubleshooting

### **Error: "API key not found"**
**Solution**: Set API key using localStorage or config
```javascript
localStorage.setItem('samgov_api_key', 'YOUR_KEY');
```

### **Error: "401 Unauthorized"**
**Causes**:
- Invalid API key
- Expired API key
- Wrong format

**Solution**: Double-check your key from SAM.gov email

### **Error: "429 Too Many Requests"**
**Cause**: Rate limit exceeded (1,000/day)

**Solutions**:
- Wait 24 hours
- Implement caching
- Request higher tier

### **Error: "No results found"**
**Cause**: No matching data

**Solution**: Adjust search parameters

---

## 💾 Caching Strategy

The integration includes automatic caching:

```javascript
// Results cached for 1 hour
cache = {
    opportunities: [],
    contracts: [],
    lastUpdate: timestamp
}

// Check cache first
if (cacheValid && cacheAge < 3600) {
    return cachedResults;
}
```

**Benefits**:
- Reduces API calls
- Faster responses
- Avoids rate limits

---

## 📊 Available Endpoints

### **1. Opportunities API**
```
GET https://api.sam.gov/prod/opportunities/v2/search
```
**Use For**: Contract opportunities, RFPs, solicitations

### **2. Contract Data API**
```
GET https://api.sam.gov/prod/federalcontractdata/v1/search
```
**Use For**: Awarded contracts, spending data

### **3. Entity Management API**
```
GET https://api.sam.gov/prod/entity-information/v2/entities
```
**Use For**: Vendor information, entity details

---

## 🔐 Security Best Practices

### **DO:**
✅ Store API key in localStorage (client-side apps)  
✅ Use environment variables (Node.js/server apps)  
✅ Rotate keys periodically  
✅ Monitor usage in SAM.gov dashboard  

### **DON'T:**
❌ Commit API keys to GitHub  
❌ Share keys publicly  
❌ Use same key for multiple projects  
❌ Hardcode keys in source files  

---

## 📱 Quick Config Panel

Add this to any page using SAM.gov:

```html
<!-- SAM.gov Config Panel -->
<div id="samConfigPanel" style="position:fixed;top:10px;right:10px;background:#1a1a2e;padding:15px;border-radius:10px;z-index:10000;">
    <h4 style="margin:0 0 10px 0;color:#fff;">SAM.gov API Config</h4>
    <input id="samApiKeyInput" type="text" placeholder="Enter API Key" style="width:250px;padding:8px;border-radius:5px;border:1px solid #444;background:#0f131a;color:#fff;">
    <button onclick="saveSAMKey()" style="padding:8px 12px;margin-top:8px;border-radius:5px;background:#00ff99;border:none;cursor:pointer;font-weight:bold;">Save Key</button>
    <div id="samStatus" style="margin-top:8px;color:#aaa;font-size:12px;"></div>
</div>

<script>
function saveSAMKey() {
    const key = document.getElementById('samApiKeyInput').value.trim();
    if (key) {
        localStorage.setItem('samgov_api_key', key);
        document.getElementById('samStatus').textContent = '✅ API Key Saved!';
        document.getElementById('samStatus').style.color = '#00ff99';
        setTimeout(() => location.reload(), 1000);
    } else {
        document.getElementById('samStatus').textContent = '❌ Enter a valid key';
        document.getElementById('samStatus').style.color = '#ff6b6b';
    }
}

// Show current status
window.addEventListener('load', () => {
    const hasKey = !!localStorage.getItem('samgov_api_key');
    document.getElementById('samStatus').textContent = hasKey ? 
        '✅ API Key Configured' : 
        '⚠️ No API Key';
    document.getElementById('samStatus').style.color = hasKey ? '#00ff99' : '#fbbf24';
});
</script>
```

---

## 🎓 Resources

- **SAM.gov Data Services**: https://sam.gov/data-services
- **API Documentation**: https://open.gsa.gov/api/sam-api/
- **Developer Forum**: https://github.com/GSA/sam_api
- **Status Page**: https://status.sam.gov/

---

## ✅ Checklist

Before using SAM.gov features:

- [ ] Created SAM.gov account
- [ ] Received API key via email
- [ ] Saved API key to localStorage
- [ ] Tested API with sample request
- [ ] Verified data is loading
- [ ] Checked rate limit usage

---

## 🚀 Quick Start

**1-Minute Setup:**
```bash
# 1. Get API key from email
# 2. Open browser console (F12)
# 3. Run this command:
localStorage.setItem('samgov_api_key', 'PASTE_YOUR_KEY_HERE');

# 4. Refresh page
# 5. Check console for: "✅ SAM.gov API key saved"
```

**Done!** Your SAM.gov integration is now active.

---

**Need help?** Check console for detailed error messages or visit https://sam.gov/data-services for support.
