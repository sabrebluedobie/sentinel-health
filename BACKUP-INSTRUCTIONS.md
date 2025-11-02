# Sentrya Backup System Setup

## What This Does
This backup system creates timestamped git commits automatically, so you can restore your code to any previous working state. Perfect for those "oh shit" moments!

## Manual Backup (Use Anytime!)

### First Time Setup:
1. Open Terminal
2. Navigate to your project:
   ```bash
   cd ~/Sentinel-Health/sentinel-health
   ```
3. Make the script executable:
   ```bash
   chmod +x backup.sh
   ```

### To Create a Manual Backup:
Anytime you want to save a snapshot (like when CGM works!):
```bash
cd ~/Sentinel-Health/sentinel-health
./backup.sh
```

You'll see a confirmation message and your recent backup history.

---

## Automatic Hourly Backups

### Setup Instructions:

1. **Create the launch agent directory** (if it doesn't exist):
   ```bash
   mkdir -p ~/Library/LaunchAgents
   ```

2. **Create the plist file**:
   ```bash
   nano ~/Library/LaunchAgents/com.sentrya.backup.plist
   ```

3. **Paste this content** (replace YOUR_USERNAME with your actual username):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.sentrya.backup</string>
       <key>ProgramArguments</key>
       <array>
           <string>/Users/YOUR_USERNAME/Sentinel-Health/sentinel-health/backup.sh</string>
       </array>
       <key>StartInterval</key>
       <integer>3600</integer>
       <key>StandardOutPath</key>
       <string>/Users/YOUR_USERNAME/Sentinel-Health/sentinel-health/backup.log</string>
       <key>StandardErrorPath</key>
       <string>/Users/YOUR_USERNAME/Sentinel-Health/sentinel-health/backup-error.log</string>
   </dict>
   </plist>
   ```

4. **Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

5. **Load the launch agent**:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.sentrya.backup.plist
   ```

6. **Verify it's running**:
   ```bash
   launchctl list | grep sentrya
   ```

### To Change Backup Frequency:
The `<integer>3600</integer>` line is seconds. Change it to:
- Every 30 minutes: 1800
- Every 2 hours: 7200
- Every 4 hours: 14400

After changing, unload and reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.sentrya.backup.plist
launchctl load ~/Library/LaunchAgents/com.sentrya.backup.plist
```

### To Stop Automatic Backups:
```bash
launchctl unload ~/Library/LaunchAgents/com.sentrya.backup.plist
```

---

## Restoring from a Backup

### See All Backups:
```bash
cd ~/Sentinel-Health/sentinel-health
git log --oneline
```

### Restore to a Specific Backup:
1. Find the commit you want (copy the short code from git log)
2. Restore:
   ```bash
   git checkout [commit-code]
   ```
   Example: `git checkout a1b2c3d`

### Get Back to Latest:
```bash
git checkout main
```
(or `git checkout master` depending on your branch name)

### Create a New Branch from Old Backup (Safe Option):
This lets you explore old code without losing current work:
```bash
git checkout -b backup-exploration [commit-code]
```

---

## Troubleshooting

**Script won't run**: Make sure it's executable:
```bash
chmod +x ~/Sentinel-Health/sentinel-health/backup.sh
```

**Automatic backups not working**: Check the logs:
```bash
cat ~/Sentinel-Health/sentinel-health/backup.log
cat ~/Sentinel-Health/sentinel-health/backup-error.log
```

**Want to see if it's scheduled**: 
```bash
launchctl list | grep sentrya
```

---

## Pro Tips

- Run `./backup.sh` before trying anything risky
- The script won't create empty commits - only when you've made changes
- You can add a comment to manual backups: `git commit --amend -m "CGM WORKING!"`
- Check `backup.log` to see when automatic backups ran
